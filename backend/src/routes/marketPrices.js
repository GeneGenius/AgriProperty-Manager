const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

// GET /api/market-prices — get all market prices (SA + Eswatini)
router.get('/', async (req, res) => {
  try {
    const { crop_name, currency } = req.query
    let query = supabase
      .from('market_prices')
      .select()
      .order('recorded_at', { ascending: false })
      .limit(200)
    if (crop_name) query = query.ilike('crop_name', `%${crop_name}%`)
    if (currency) query = query.eq('currency', currency)
    const { data, error } = await query
    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/market-prices — add a price entry
router.post('/', async (req, res) => {
  try {
    const { crop_name, market, city, price_per_kg, currency, source } = req.body
    if (!crop_name || !market || !price_per_kg) {
      return res.status(400).json({ error: 'Crop name, market, and price are required' })
    }
    const { data, error } = await supabase
      .from('market_prices')
      .insert({ crop_name, market, city, price_per_kg, currency: currency || 'ZAR', source })
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/market-prices/summary — grouped by crop with latest prices for SA AND Eswatini
router.get('/summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_prices')
      .select()
      .order('recorded_at', { ascending: false })
      .limit(400)

    if (error) return res.status(400).json({ error: error.message })

    // Group by crop_name, keep latest entry per market
    const grouped = {}
    for (const entry of (data || [])) {
      if (!grouped[entry.crop_name]) grouped[entry.crop_name] = []
      const existing = grouped[entry.crop_name].find(e => e.market === entry.market)
      if (!existing) grouped[entry.crop_name].push(entry)
    }

    const summary = Object.entries(grouped).map(([crop, entries]) => {
      const saEntries = entries.filter(e => e.currency === 'ZAR')
      const szlEntries = entries.filter(e => e.currency === 'SZL')
      const avgSA = saEntries.length > 0 ? saEntries.reduce((sum, e) => sum + Number(e.price_per_kg), 0) / saEntries.length : null
      const avgSZL = szlEntries.length > 0 ? szlEntries.reduce((sum, e) => sum + Number(e.price_per_kg), 0) / szlEntries.length : null
      return {
        crop_name: crop,
        markets: entries,
        sa_markets: saEntries,
        eswatini_markets: szlEntries,
        avg_price_zar: avgSA ? Math.round(avgSA * 100) / 100 : null,
        avg_price_szl: avgSZL ? Math.round(avgSZL * 100) / 100 : null,
        last_updated: entries[0]?.recorded_at,
      }
    })

    res.json(summary)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
