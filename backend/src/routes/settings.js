const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select()
      .eq('user_id', req.user.id)
      .single()
    if (error) {
      // Create settings if not exists
      const { data: newSettings, error: createError } = await supabase
        .from('settings')
        .insert({ user_id: req.user.id })
        .select()
        .single()
      if (createError) return res.status(400).json({ error: createError.message })
      return res.json(newSettings)
    }
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/', async (req, res) => {
  try {
    const { whatsapp_enabled, daily_summary_enabled, daily_summary_time, dark_mode, openweather_api_key, twilio_whatsapp_number } = req.body
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        user_id: req.user.id,
        whatsapp_enabled,
        daily_summary_enabled,
        daily_summary_time,
        dark_mode,
        openweather_api_key,
        twilio_whatsapp_number,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
