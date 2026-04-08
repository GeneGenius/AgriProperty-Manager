const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')
const { generateBuyerEmail } = require('../services/claude')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buyers')
      .select('*, orders(id, total_amount, currency, payment_status, order_date)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buyers')
      .select('*, orders(*, items)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()
    if (error) return res.status(404).json({ error: 'Buyer not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body
    if (!body.contact_name || !body.phone) {
      return res.status(400).json({ error: 'Contact name and phone are required' })
    }
    const { data, error } = await supabase
      .from('buyers')
      .insert({ ...body, user_id: req.user.id })
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buyers')
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
      .from('buyers')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Buyer deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/buyers/:id/generate-email
router.post('/:id/generate-email', async (req, res) => {
  try {
    const { context } = req.body
    const { data: buyer } = await supabase.from('buyers').select().eq('id', req.params.id).eq('user_id', req.user.id).single()
    const { data: crops } = await supabase.from('crops').select().eq('user_id', req.user.id).eq('status', 'growing')
    if (!buyer) return res.status(404).json({ error: 'Buyer not found' })
    const email = await generateBuyerEmail(buyer, crops || [], context || '')
    res.json({ email })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
