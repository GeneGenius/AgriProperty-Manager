const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')
const { sendOrderConfirmation } = require('../services/twilio')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { payment_status, delivery_status } = req.query
    let query = supabase
      .from('orders')
      .select('*, buyers(contact_name, company_name, phone, country)')
      .eq('user_id', req.user.id)
      .order('order_date', { ascending: false })

    if (payment_status) query = query.eq('payment_status', payment_status)
    if (delivery_status) query = query.eq('delivery_status', delivery_status)

    const { data, error } = await query
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, buyers(contact_name, company_name, phone, email, address, city, country)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()
    if (error) return res.status(404).json({ error: 'Order not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body
    if (!body.buyer_id || !body.items || !body.total_amount) {
      return res.status(400).json({ error: 'Buyer, items, and total amount are required' })
    }

    // Calculate subtotal from items
    const items = Array.isArray(body.items) ? body.items : []
    const subtotal = items.reduce((sum, item) => {
      return sum + (Number(item.quantity_kg || 0) * Number(item.price_per_kg || 0))
    }, 0)
    const taxAmount = body.tax_amount || 0
    const total = subtotal + taxAmount

    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...body,
        user_id: req.user.id,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
      })
      .select('*, buyers(contact_name, company_name, phone, whatsapp)')
      .single()

    if (error) return res.status(400).json({ error: error.message })

    // Send WhatsApp confirmation to buyer if they have WhatsApp
    const { data: settings } = await supabase
      .from('settings')
      .select('whatsapp_enabled')
      .eq('user_id', req.user.id)
      .single()

    const buyerWhatsApp = data.buyers?.whatsapp || data.buyers?.phone
    if (settings?.whatsapp_enabled && buyerWhatsApp) {
      await sendOrderConfirmation(
        buyerWhatsApp,
        data.buyers.contact_name,
        data.invoice_number,
        items,
        body.delivery_date || 'TBD',
        total,
        body.currency || 'ZAR'
      )
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      type: 'order_confirmed',
      title: 'New Order Created',
      message: `Order ${data.invoice_number} for ${data.buyers?.contact_name} — ${body.currency || 'ZAR'} ${Number(total).toLocaleString()}`,
      related_id: data.id,
      related_type: 'order',
      sent_via_whatsapp: !!(settings?.whatsapp_enabled && buyerWhatsApp),
    })

    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Order deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/orders/:id/invoice — get invoice data for PDF generation
router.get('/:id/invoice', async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, buyers(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (error || !order) return res.status(404).json({ error: 'Order not found' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, business_name_eswatini, whatsapp_number')
      .eq('id', req.user.id)
      .single()

    res.json({ order, seller: profile })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
