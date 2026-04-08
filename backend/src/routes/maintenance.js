const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { status, priority, property_id } = req.query
    let query = supabase
      .from('maintenance_requests')
      .select('*, properties(name, location), tenants(full_name, phone)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)
    if (property_id) query = query.eq('property_id', property_id)

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
      .from('maintenance_requests')
      .select('*, properties(name, location), tenants(full_name, phone)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (error) return res.status(404).json({ error: 'Request not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body
    if (!body.property_id || !body.title || !body.description) {
      return res.status(400).json({ error: 'Property, title, and description are required' })
    }
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({ ...body, user_id: req.user.id })
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })

    // Create notification
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      type: 'maintenance',
      title: 'New Maintenance Request',
      message: `${body.title} - Priority: ${body.priority || 'medium'}`,
      related_id: data.id,
      related_type: 'maintenance',
    })

    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body }
    if (updates.status === 'resolved' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('maintenance_requests')
      .update(updates)
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
      .from('maintenance_requests')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)

    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
