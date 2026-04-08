const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('real_estate_expenses')
      .select('*, properties(name)')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { category, description, amount, date, property_id, notes } = req.body
    if (!category || !description || !amount || !date) {
      return res.status(400).json({ error: 'Category, description, amount, and date are required' })
    }
    const { data, error } = await supabase
      .from('real_estate_expenses')
      .insert({ user_id: req.user.id, category, description, amount, date, property_id, notes })
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
      .from('real_estate_expenses')
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
      .from('real_estate_expenses')
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
