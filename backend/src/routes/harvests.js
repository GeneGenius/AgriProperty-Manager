const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('harvests')
      .select('*, crops(name, crop_type, field_plot)')
      .eq('user_id', req.user.id)
      .order('harvest_date', { ascending: false })
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { crop_id, harvest_date, yield_kg, quality_grade, storage_location, notes } = req.body
    if (!crop_id || !harvest_date || !yield_kg) {
      return res.status(400).json({ error: 'Crop, harvest date, and yield are required' })
    }
    const { data, error } = await supabase
      .from('harvests')
      .insert({ user_id: req.user.id, crop_id, harvest_date, yield_kg, quality_grade, storage_location, notes })
      .select('*, crops(name, field_plot)')
      .single()
    if (error) return res.status(400).json({ error: error.message })

    // Update crop status to harvested
    await supabase.from('crops').update({ status: 'harvested' }).eq('id', crop_id).eq('user_id', req.user.id)

    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('harvests')
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
      .from('harvests')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Harvest record deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
