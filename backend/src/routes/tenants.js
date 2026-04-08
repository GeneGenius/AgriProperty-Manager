const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')
const { generateTenancyAgreement } = require('../services/claude')

router.use(authenticate)

// GET /api/tenants
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*, properties(name, location, type)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/tenants/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*, properties(name, location, type, city), rent_payments(id, amount, status, due_date, paid_date)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (error) return res.status(404).json({ error: 'Tenant not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tenants
router.post('/', async (req, res) => {
  try {
    const body = req.body
    if (!body.full_name || !body.property_id || !body.phone || !body.lease_start || !body.lease_end || !body.monthly_rent) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({ ...body, user_id: req.user.id })
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })

    // Update property status to occupied
    await supabase
      .from('properties')
      .update({ status: 'occupied' })
      .eq('id', body.property_id)
      .eq('user_id', req.user.id)

    // Generate initial rent payments for the lease period
    await generateInitialRentPayments(tenant, req.user.id)

    res.status(201).json(tenant)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/tenants/:id
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tenants')
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

// DELETE /api/tenants/:id
router.delete('/:id', async (req, res) => {
  try {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('property_id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)

    if (error) return res.status(400).json({ error: error.message })

    // Check if property has other active tenants
    if (tenant?.property_id) {
      const { data: otherTenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('property_id', tenant.property_id)
        .eq('status', 'active')

      if (!otherTenants || otherTenants.length === 0) {
        await supabase.from('properties').update({ status: 'vacant' }).eq('id', tenant.property_id)
      }
    }

    res.json({ message: 'Tenant removed successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tenants/:id/generate-agreement
router.post('/:id/generate-agreement', async (req, res) => {
  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*, properties(name, location, city, region, type, size_sqm)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (error || !tenant) return res.status(404).json({ error: 'Tenant not found' })

    const agreement = await generateTenancyAgreement(tenant.properties, tenant)
    res.json({ agreement })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Generate monthly rent payment records for entire lease period
 */
async function generateInitialRentPayments(tenant, userId) {
  const start = new Date(tenant.lease_start)
  const end = new Date(tenant.lease_end)
  const payments = []
  let current = new Date(start)

  while (current <= end) {
    const dueDate = new Date(current.getFullYear(), current.getMonth(), tenant.rent_due_day || 1)
    payments.push({
      user_id: userId,
      tenant_id: tenant.id,
      property_id: tenant.property_id,
      amount: tenant.monthly_rent,
      due_date: dueDate.toISOString().split('T')[0],
      status: dueDate < new Date() ? 'overdue' : 'pending',
    })
    current.setMonth(current.getMonth() + 1)
    if (payments.length > 60) break // Safety limit: 5 years
  }

  if (payments.length > 0) {
    await supabase.from('rent_payments').insert(payments)
  }
}

module.exports = router
