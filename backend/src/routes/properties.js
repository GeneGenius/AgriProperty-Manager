const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

// GET /api/properties
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*, tenants(id, full_name, status, monthly_rent, lease_end)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/properties/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        tenants(*, rent_payments(id, status, amount, due_date, paid_date)),
        maintenance_requests(id, title, status, priority, created_at),
        real_estate_expenses(id, category, amount, date)
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (error) return res.status(404).json({ error: 'Property not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/properties
router.post('/', async (req, res) => {
  try {
    const { name, location, city, region, type, value, status, description, bedrooms, bathrooms, size_sqm, amenities } = req.body
    if (!name || !location || !type) {
      return res.status(400).json({ error: 'Name, location, and type are required' })
    }

    const { data, error } = await supabase
      .from('properties')
      .insert({ user_id: req.user.id, name, location, city, region, type, value, status, description, bedrooms, bathrooms, size_sqm, amenities })
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/properties/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, location, city, region, type, value, status, description, bedrooms, bathrooms, size_sqm, amenities } = req.body
    const { data, error } = await supabase
      .from('properties')
      .update({ name, location, city, region, type, value, status, description, bedrooms, bathrooms, size_sqm, amenities })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'Property not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/properties/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)

    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Property deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/properties/:id/report — property performance report
router.get('/:id/report', async (req, res) => {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        tenants(id, full_name, monthly_rent, status, lease_start, lease_end),
        rent_payments(id, amount, status, due_date, paid_date),
        real_estate_expenses(id, category, amount, date),
        maintenance_requests(id, title, status, actual_cost)
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (error) return res.status(404).json({ error: 'Property not found' })

    const activeTenants = property.tenants?.filter(t => t.status === 'active') || []
    const totalRentIncome = property.rent_payments
      ?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const totalExpenses = property.real_estate_expenses
      ?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
    const maintenanceCost = property.maintenance_requests
      ?.reduce((sum, m) => sum + Number(m.actual_cost || 0), 0) || 0
    const netProfit = totalRentIncome - totalExpenses - maintenanceCost

    const occupancyRate = property.tenants?.length > 0
      ? Math.round((activeTenants.length / Math.max(property.tenants.length, 1)) * 100)
      : (property.status === 'occupied' ? 100 : 0)

    res.json({
      property,
      report: {
        occupancy_rate: occupancyRate,
        total_rent_income: totalRentIncome,
        total_expenses: totalExpenses + maintenanceCost,
        net_profit: netProfit,
        active_tenants: activeTenants.length,
        pending_payments: property.rent_payments?.filter(p => p.status === 'pending').length || 0,
        overdue_payments: property.rent_payments?.filter(p => p.status === 'overdue').length || 0,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
