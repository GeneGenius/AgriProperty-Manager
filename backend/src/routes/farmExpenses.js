const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { crop_id } = req.query
    let query = supabase
      .from('farm_expenses')
      .select('*, crops(name, field_plot)')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })
    if (crop_id) query = query.eq('crop_id', crop_id)
    const { data, error } = await query
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { category, description, amount, date, crop_id, vendor, notes, currency } = req.body
    if (!category || !description || !amount || !date) {
      return res.status(400).json({ error: 'Category, description, amount, and date required' })
    }
    const { data, error } = await supabase
      .from('farm_expenses')
      .insert({ user_id: req.user.id, category, description, amount, date, crop_id, vendor, notes, currency: currency || 'SZL' })
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
      .from('farm_expenses')
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
      .from('farm_expenses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Expense deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
