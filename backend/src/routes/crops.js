const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const { status } = req.query
    let query = supabase
      .from('crops')
      .select('*, harvests(id, harvest_date, yield_kg, quality_grade)')
      .eq('user_id', req.user.id)
      .order('planting_date', { ascending: false })
    if (status) query = query.eq('status', status)
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
      .from('crops')
      .select('*, harvests(*), farm_expenses(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()
    if (error) return res.status(404).json({ error: 'Crop not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body
    if (!body.name || !body.crop_type || !body.field_plot || !body.planting_date || !body.expected_harvest_date || !body.quantity_planted) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const { data, error } = await supabase
      .from('crops')
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
      .from('crops')
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
      .from('crops')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Crop deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/crops/:id/profit-report
router.get('/:id/profit-report', async (req, res) => {
  try {
    const { data: crop, error } = await supabase
      .from('crops')
      .select('*, harvests(yield_kg, quality_grade), farm_expenses(amount, category)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (error) return res.status(404).json({ error: 'Crop not found' })

    const totalYield = crop.harvests?.reduce((sum, h) => sum + Number(h.yield_kg), 0) || 0
    const totalExpenses = crop.farm_expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

    // Get related order items revenue
    const { data: orderItems } = await supabase
      .from('orders')
      .select('items, total_amount, payment_status, currency')
      .eq('user_id', req.user.id)
      .neq('payment_status', 'cancelled')

    let totalRevenue = 0
    for (const order of orderItems || []) {
      const items = Array.isArray(order.items) ? order.items : []
      const relevant = items.filter(i => i.crop_id === req.params.id)
      totalRevenue += relevant.reduce((sum, i) => sum + (Number(i.total_price) || 0), 0)
    }

    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

    const expenseBreakdown = (crop.farm_expenses || []).reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
      return acc
    }, {})

    res.json({
      crop,
      report: {
        total_yield_kg: totalYield,
        total_expenses: totalExpenses,
        total_revenue: totalRevenue,
        net_profit: netProfit,
        profit_margin_pct: profitMargin,
        expense_breakdown: expenseBreakdown,
        cost_per_kg: totalYield > 0 ? Math.round(totalExpenses / totalYield * 100) / 100 : 0,
        revenue_per_kg: totalYield > 0 ? Math.round(totalRevenue / totalYield * 100) / 100 : 0,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
