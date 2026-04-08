const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')

// GET /api/auth/profile — get current user's profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error) return res.status(404).json({ error: 'Profile not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/auth/profile — update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { full_name, whatsapp_number, business_name_ghana, business_name_eswatini, currency_preference, avatar_url } = req.body
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name, whatsapp_number, business_name_ghana, business_name_eswatini, currency_preference, avatar_url })
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
