const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')
const { sendWhatsApp } = require('../services/twilio')
const { format } = require('date-fns')

router.use(authenticate)

// GET /api/rent-payments
router.get('/', async (req, res) => {
  try {
    const { status, property_id, tenant_id } = req.query
    let query = supabase
      .from('rent_payments')
      .select('*, tenants(full_name, phone), properties(name, location)')
      .eq('user_id', req.user.id)
      .order('due_date', { ascending: false })

    if (status) query = query.eq('status', status)
    if (property_id) query = query.eq('property_id', property_id)
    if (tenant_id) query = query.eq('tenant_id', tenant_id)

    const { data, error } = await query
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/rent-payments/mark-paid/:id
router.post('/mark-paid/:id', async (req, res) => {
  try {
    const { payment_method, reference, notes } = req.body
    const today = format(new Date(), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('rent_payments')
      .update({ status: 'paid', paid_date: today, payment_method, reference, notes })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*, tenants(full_name, phone), properties(name)')
      .single()

    if (error) return res.status(400).json({ error: error.message })

    // Send receipt via WhatsApp if configured
    const { data: settings } = await supabase
      .from('settings')
      .select('whatsapp_enabled')
      .eq('user_id', req.user.id)
      .single()

    if (settings?.whatsapp_enabled && data.tenants?.phone) {
      await sendWhatsApp(
        data.tenants.phone,
        `🏠 *AgrIProperty Manager*\n\nDear ${data.tenants.full_name},\n\nPayment received! ✅\n\nAmount: *GHS ${Number(data.amount).toLocaleString()}*\nProperty: ${data.properties.name}\nDate: ${today}\nRef: ${reference || 'N/A'}\n\nThank you for your payment! 🙏`
      )
    }

    // Create notification
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      type: 'payment_received',
      title: 'Rent Payment Received',
      message: `GHS ${Number(data.amount).toLocaleString()} received from ${data.tenants?.full_name} for ${data.properties?.name}`,
      related_id: data.id,
      related_type: 'rent_payment',
    })

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/rent-payments
router.post('/', async (req, res) => {
  try {
    const body = req.body
    if (!body.tenant_id || !body.property_id || !body.amount || !body.due_date) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const { data, error } = await supabase
      .from('rent_payments')
      .insert({ ...body, user_id: req.user.id })
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/rent-payments/:id
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rent_payments')
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

// DELETE /api/rent-payments/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('rent_payments')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)

    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Payment record deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/rent-payments/send-reminder/:id
router.post('/send-reminder/:id', async (req, res) => {
  try {
    const { data: payment, error } = await supabase
      .from('rent_payments')
      .select('*, tenants(full_name, phone), properties(name)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (error || !payment) return res.status(404).json({ error: 'Payment not found' })
    if (!payment.tenants?.phone) return res.status(400).json({ error: 'Tenant phone number not available' })

    const result = await sendWhatsApp(
      payment.tenants.phone,
      `🏠 *AgrIProperty Manager*\n\nDear ${payment.tenants.full_name},\n\nThis is a reminder that your rent of *GHS ${Number(payment.amount).toLocaleString()}* for *${payment.properties.name}* is due on *${format(new Date(payment.due_date), 'dd MMMM yyyy')}*.\n\nPlease ensure timely payment.\n\nThank you! 🙏`
    )

    if (result.success) {
      await supabase.from('rent_payments').update({ reminder_sent: true }).eq('id', payment.id)
      res.json({ message: 'Reminder sent successfully' })
    } else {
      res.status(500).json({ error: result.error || 'Failed to send reminder' })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
