const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')
const { chat, generateMarketReport } = require('../services/claude')

router.use(authenticate)

// GET /api/ai/conversations
router.get('/conversations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false })
      .limit(20)
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/ai/conversations/:id
router.get('/conversations/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()
    if (error) return res.status(404).json({ error: 'Conversation not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/ai/chat — send message in a conversation
router.post('/chat', async (req, res) => {
  try {
    const { message, conversation_id, include_business_context } = req.body
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const userId = req.user.id
    let conversation = null
    let messages = []

    // Load existing conversation or create new one
    if (conversation_id) {
      const { data } = await supabase
        .from('ai_conversations')
        .select()
        .eq('id', conversation_id)
        .eq('user_id', userId)
        .single()
      if (data) {
        conversation = data
        messages = Array.isArray(data.messages) ? data.messages : []
      }
    }

    // Optionally gather business context for the AI
    let businessContext = null
    if (include_business_context) {
      businessContext = await gatherBusinessContext(userId)
    }

    // Add user message
    messages.push({ role: 'user', content: message.trim() })

    // Call Claude
    const assistantReply = await chat(messages, businessContext)

    // Add assistant reply
    messages.push({ role: 'assistant', content: assistantReply })

    // Save conversation
    if (conversation) {
      await supabase
        .from('ai_conversations')
        .update({ messages, updated_at: new Date().toISOString() })
        .eq('id', conversation.id)
    } else {
      const title = message.length > 60 ? message.substring(0, 57) + '...' : message
      const { data: newConv } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, title, messages })
        .select()
        .single()
      conversation = newConv
    }

    res.json({
      reply: assistantReply,
      conversation_id: conversation?.id,
      messages,
    })
  } catch (err) {
    console.error('[AI Chat]', err)
    if (err.message?.includes('overloaded') || err.message?.includes('rate')) {
      return res.status(429).json({ error: 'AI service busy. Please try again in a moment.' })
    }
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/ai/conversations/:id
router.delete('/conversations/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Conversation deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/ai/generate-report
router.post('/generate-report', async (req, res) => {
  try {
    const businessData = await gatherBusinessContext(req.user.id)
    const report = await generateMarketReport(businessData)
    res.json({ report })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Gather a summary of the user's business data for AI context
 */
async function gatherBusinessContext(userId) {
  try {
    const [
      props,
      tenants,
      overdueRent,
      crops,
      recentHarvests,
      pendingOrders,
      buyers,
    ] = await Promise.all([
      supabase.from('properties').select('name, location, status, type, value').eq('user_id', userId),
      supabase.from('tenants').select('full_name, monthly_rent, status, lease_end').eq('user_id', userId).eq('status', 'active'),
      supabase.from('rent_payments').select('amount, due_date').eq('user_id', userId).eq('status', 'overdue').limit(5),
      supabase.from('crops').select('name, crop_type, field_plot, status, expected_harvest_date, quantity_planted, unit').eq('user_id', userId).limit(20),
      supabase.from('harvests').select('harvest_date, yield_kg, quality_grade, crops(name)').eq('user_id', userId).order('harvest_date', { ascending: false }).limit(10),
      supabase.from('orders').select('invoice_number, total_amount, currency, payment_status, delivery_date, buyers(contact_name, company_name)').eq('user_id', userId).eq('payment_status', 'pending').limit(10),
      supabase.from('buyers').select('contact_name, company_name, country').eq('user_id', userId).limit(20),
    ])

    return {
      real_estate: {
        properties: props.data || [],
        active_tenants: tenants.data || [],
        overdue_rent: overdueRent.data || [],
        total_properties: (props.data || []).length,
        occupied: (props.data || []).filter(p => p.status === 'occupied').length,
        monthly_income_ghs: (tenants.data || []).reduce((sum, t) => sum + Number(t.monthly_rent), 0),
      },
      farm: {
        active_crops: (crops.data || []).filter(c => c.status === 'growing'),
        recent_harvests: recentHarvests.data || [],
        pending_orders: pendingOrders.data || [],
        buyers: buyers.data || [],
      },
    }
  } catch (err) {
    console.error('[AI Context]', err)
    return {}
  }
}

module.exports = router
