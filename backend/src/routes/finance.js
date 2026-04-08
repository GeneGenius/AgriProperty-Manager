const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')
const { authenticate } = require('../middleware/auth')
const { getAllRates, convert } = require('../services/currency')
const { format, subMonths, startOfMonth, endOfMonth, parseISO } = require('date-fns')

router.use(authenticate)

// GET /api/finance/dashboard — main finance dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id
    const now = new Date()
    const sixMonthsAgo = format(subMonths(now, 5), 'yyyy-MM-01')

    const [
      rentPayments,
      reExpenses,
      farmOrders,
      farmExpenses,
      rates,
    ] = await Promise.all([
      supabase.from('rent_payments').select('amount, status, due_date, paid_date').eq('user_id', userId).gte('due_date', sixMonthsAgo),
      supabase.from('real_estate_expenses').select('amount, date, category').eq('user_id', userId).gte('date', sixMonthsAgo),
      supabase.from('orders').select('total_amount, currency, payment_status, order_date, items').eq('user_id', userId).gte('order_date', sixMonthsAgo),
      supabase.from('farm_expenses').select('amount, currency, date, category').eq('user_id', userId).gte('date', sixMonthsAgo),
      getAllRates(),
    ])

    // Build monthly breakdown for the last 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM yy') }
    })

    const monthlyData = months.map(({ key, label }) => {
      const paidRent = (rentPayments.data || [])
        .filter(p => p.status === 'paid' && p.paid_date?.startsWith(key))
        .reduce((sum, p) => sum + Number(p.amount), 0)

      const reExp = (reExpenses.data || [])
        .filter(e => e.date?.startsWith(key))
        .reduce((sum, e) => sum + Number(e.amount), 0)

      const farmRev = (farmOrders.data || [])
        .filter(o => o.payment_status === 'paid' && o.order_date?.startsWith(key))
        .reduce((sum, o) => sum + Number(o.total_amount), 0)

      const farmExp = (farmExpenses.data || [])
        .filter(e => e.date?.startsWith(key))
        .reduce((sum, e) => sum + Number(e.amount), 0)

      return {
        month: label,
        key,
        rent_income_ghs: paidRent,
        re_expenses_ghs: reExp,
        farm_revenue_zar: farmRev,
        farm_expenses_szl: farmExp,
        re_profit: paidRent - reExp,
        farm_profit: farmRev - farmExp,
      }
    })

    // Totals
    const totalRentIncome = (rentPayments.data || []).filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
    const totalREExpenses = (reExpenses.data || []).reduce((sum, e) => sum + Number(e.amount), 0)
    const totalFarmRevenue = (farmOrders.data || []).filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total_amount), 0)
    const totalFarmExpenses = (farmExpenses.data || []).reduce((sum, e) => sum + Number(e.amount), 0)

    // Current month
    const currentMonthKey = format(now, 'yyyy-MM')
    const currentMonth = monthlyData.find(m => m.key === currentMonthKey) || {}

    // Health score
    const totalRevenue = totalRentIncome + totalFarmRevenue
    const totalExpenses = totalREExpenses + totalFarmExpenses
    const overallMargin = totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : 0
    let healthScore = 'needs_attention'
    if (overallMargin > 0.3) healthScore = 'excellent'
    else if (overallMargin > 0.1) healthScore = 'good'

    // Expense breakdown by category
    const reExpByCategory = (reExpenses.data || []).reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
      return acc
    }, {})
    const farmExpByCategory = (farmExpenses.data || []).reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
      return acc
    }, {})

    // 3-month cash flow forecast (simple projection based on last 3 months average)
    const last3 = monthlyData.slice(-3)
    const avgRentIncome = last3.reduce((sum, m) => sum + m.rent_income_ghs, 0) / 3
    const avgREExp = last3.reduce((sum, m) => sum + m.re_expenses_ghs, 0) / 3
    const avgFarmRev = last3.reduce((sum, m) => sum + m.farm_revenue_zar, 0) / 3
    const avgFarmExp = last3.reduce((sum, m) => sum + m.farm_expenses_szl, 0) / 3

    const forecast = Array.from({ length: 3 }, (_, i) => {
      const d = subMonths(now, -1 - i)
      return {
        month: format(d, 'MMM yy'),
        projected_rent: Math.round(avgRentIncome),
        projected_re_expenses: Math.round(avgREExp),
        projected_farm_revenue: Math.round(avgFarmRev),
        projected_farm_expenses: Math.round(avgFarmExp),
      }
    })

    res.json({
      monthly_data: monthlyData,
      totals: {
        rent_income_ghs: totalRentIncome,
        re_expenses_ghs: totalREExpenses,
        re_profit_ghs: totalRentIncome - totalREExpenses,
        farm_revenue_zar: totalFarmRevenue,
        farm_expenses_szl: totalFarmExpenses,
        farm_profit_zar: totalFarmRevenue - totalFarmExpenses,
      },
      current_month: currentMonth,
      health_score: healthScore,
      overall_margin_pct: Math.round(overallMargin * 100),
      expense_breakdown: { real_estate: reExpByCategory, farm: farmExpByCategory },
      forecast,
      exchange_rates: rates,
    })
  } catch (err) {
    console.error('[Finance]', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/finance/rates
router.get('/rates', async (req, res) => {
  try {
    const rates = await getAllRates()
    res.json(rates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/finance/summary — quick KPI summary for dashboard
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id
    const now = new Date()
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

    const [props, tenants, crops, orders, overdueRent] = await Promise.all([
      supabase.from('properties').select('id, status').eq('user_id', userId),
      supabase.from('tenants').select('id, monthly_rent, status').eq('user_id', userId).eq('status', 'active'),
      supabase.from('crops').select('id, status, name, expected_harvest_date').eq('user_id', userId).eq('status', 'growing').order('expected_harvest_date'),
      supabase.from('orders').select('id, total_amount, currency, payment_status').eq('user_id', userId).gte('order_date', monthStart).lte('order_date', monthEnd),
      supabase.from('rent_payments').select('id, amount').eq('user_id', userId).eq('status', 'overdue'),
    ])

    const properties = props.data || []
    const occupied = properties.filter(p => p.status === 'occupied').length
    const occupancyRate = properties.length > 0 ? Math.round((occupied / properties.length) * 100) : 0
    const monthlyRentalIncome = (tenants.data || []).reduce((sum, t) => sum + Number(t.monthly_rent), 0)
    const farmRevThisMonth = (orders.data || []).filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total_amount), 0)
    const nextHarvest = (crops.data || [])[0]

    res.json({
      total_properties: properties.length,
      occupied_properties: occupied,
      occupancy_rate: occupancyRate,
      monthly_rental_income_ghs: monthlyRentalIncome,
      active_crops: (crops.data || []).length,
      next_harvest: nextHarvest ? { name: nextHarvest.name, date: nextHarvest.expected_harvest_date } : null,
      farm_revenue_this_month_zar: farmRevThisMonth,
      overdue_rent_count: (overdueRent.data || []).length,
      overdue_rent_amount_ghs: (overdueRent.data || []).reduce((sum, p) => sum + Number(p.amount), 0),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
