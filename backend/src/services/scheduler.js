const supabase = require('./supabase')
const { sendRentReminder, sendOverdueAlert, sendHarvestAlert, sendCertificationAlert, sendDailySummary } = require('./twilio')
const { addDays, isWithinInterval, parseISO, differenceInDays, format } = require('date-fns')

/**
 * Check upcoming rent payments and send reminders
 * Sends reminders 5 days before due date
 */
async function scheduleRentReminders() {
  try {
    const today = new Date()
    const reminderDate = addDays(today, 5)
    const reminderDateStr = format(reminderDate, 'yyyy-MM-dd')
    const todayStr = format(today, 'yyyy-MM-dd')

    // Get all pending payments due in next 5 days
    const { data: upcomingPayments } = await supabase
      .from('rent_payments')
      .select(`
        *,
        tenants (full_name, phone),
        properties (name)
      `)
      .eq('status', 'pending')
      .eq('reminder_sent', false)
      .gte('due_date', todayStr)
      .lte('due_date', reminderDateStr)

    for (const payment of upcomingPayments || []) {
      // Get tenant's user settings to check WhatsApp enabled
      const { data: settings } = await supabase
        .from('settings')
        .select('whatsapp_enabled')
        .eq('user_id', payment.user_id)
        .single()

      if (settings?.whatsapp_enabled && payment.tenants?.phone) {
        await sendRentReminder(
          payment.tenants.phone,
          payment.tenants.full_name,
          payment.properties.name,
          payment.amount,
          format(parseISO(payment.due_date), 'dd MMMM yyyy')
        )

        // Mark reminder as sent
        await supabase
          .from('rent_payments')
          .update({ reminder_sent: true })
          .eq('id', payment.id)

        // Create in-app notification
        await supabase.from('notifications').insert({
          user_id: payment.user_id,
          type: 'rent_due',
          title: 'Rent Reminder Sent',
          message: `Rent reminder sent to ${payment.tenants.full_name} for ${payment.properties.name}`,
          related_id: payment.id,
          related_type: 'rent_payment',
          sent_via_whatsapp: true,
        })
      }
    }

    // Handle overdue payments
    const { data: overduePayments } = await supabase
      .from('rent_payments')
      .select(`
        *,
        tenants (full_name, phone),
        properties (name)
      `)
      .eq('status', 'pending')
      .lt('due_date', todayStr)

    for (const payment of overduePayments || []) {
      // Update status to overdue
      await supabase
        .from('rent_payments')
        .update({ status: 'overdue' })
        .eq('id', payment.id)

      const daysOverdue = differenceInDays(today, parseISO(payment.due_date))
      const { data: settings } = await supabase
        .from('settings')
        .select('whatsapp_enabled')
        .eq('user_id', payment.user_id)
        .single()

      if (settings?.whatsapp_enabled && payment.tenants?.phone && daysOverdue % 7 === 0) {
        await sendOverdueAlert(
          payment.tenants.phone,
          payment.tenants.full_name,
          payment.properties.name,
          payment.amount,
          daysOverdue
        )
      }

      await supabase.from('notifications').insert({
        user_id: payment.user_id,
        type: 'rent_overdue',
        title: 'Overdue Rent',
        message: `${payment.tenants.full_name}'s rent for ${payment.properties.name} is ${daysOverdue} day(s) overdue`,
        related_id: payment.id,
        related_type: 'rent_payment',
      })
    }

    // Harvest approaching (within 7 days)
    const harvestDate = addDays(today, 7)
    const harvestDateStr = format(harvestDate, 'yyyy-MM-dd')

    const { data: upcomingHarvests } = await supabase
      .from('crops')
      .select('*, profiles(whatsapp_number)')
      .eq('status', 'growing')
      .gte('expected_harvest_date', todayStr)
      .lte('expected_harvest_date', harvestDateStr)

    for (const crop of upcomingHarvests || []) {
      const { data: settings } = await supabase
        .from('settings')
        .select('whatsapp_enabled')
        .eq('user_id', crop.user_id)
        .single()

      if (settings?.whatsapp_enabled && crop.profiles?.whatsapp_number) {
        await sendHarvestAlert(
          crop.profiles.whatsapp_number,
          crop.name,
          crop.field_plot,
          format(parseISO(crop.expected_harvest_date), 'dd MMMM yyyy')
        )
      }

      await supabase.from('notifications').insert({
        user_id: crop.user_id,
        type: 'harvest_approaching',
        title: 'Harvest Approaching',
        message: `${crop.name} in Field ${crop.field_plot} is due for harvest on ${format(parseISO(crop.expected_harvest_date), 'dd MMM yyyy')}`,
        related_id: crop.id,
        related_type: 'crop',
      })
    }

    // Certification deadlines (within 30 days)
    const certDate = addDays(today, 30)
    const certDateStr = format(certDate, 'yyyy-MM-dd')

    const { data: expiringCerts } = await supabase
      .from('certifications')
      .select('*, profiles(whatsapp_number)')
      .eq('status', 'active')
      .gte('expiry_date', todayStr)
      .lte('expiry_date', certDateStr)

    for (const cert of expiringCerts || []) {
      const daysLeft = differenceInDays(parseISO(cert.expiry_date), today)
      const { data: settings } = await supabase
        .from('settings')
        .select('whatsapp_enabled')
        .eq('user_id', cert.user_id)
        .single()

      if (settings?.whatsapp_enabled && cert.profiles?.whatsapp_number) {
        await sendCertificationAlert(
          cert.profiles.whatsapp_number,
          cert.name,
          format(parseISO(cert.expiry_date), 'dd MMMM yyyy'),
          daysLeft
        )
      }

      await supabase.from('notifications').insert({
        user_id: cert.user_id,
        type: 'certification_deadline',
        title: 'Certification Expiring Soon',
        message: `${cert.name} expires in ${daysLeft} days on ${format(parseISO(cert.expiry_date), 'dd MMM yyyy')}`,
        related_id: cert.id,
        related_type: 'certification',
      })
    }

    console.log('[Scheduler] Rent reminders job completed')
  } catch (err) {
    console.error('[Scheduler] Error:', err)
  }
}

/**
 * Send daily summary to all users with daily_summary enabled
 */
async function scheduleDailySummary() {
  try {
    const { data: usersWithSummary } = await supabase
      .from('settings')
      .select('user_id, profiles(whatsapp_number)')
      .eq('whatsapp_enabled', true)
      .eq('daily_summary_enabled', true)

    for (const setting of usersWithSummary || []) {
      if (!setting.profiles?.whatsapp_number) continue

      const userId = setting.user_id
      const todayStr = format(new Date(), 'yyyy-MM-dd')

      // Gather summary data
      const [props, crops, orders, payments] = await Promise.all([
        supabase.from('properties').select('id, status').eq('user_id', userId),
        supabase.from('crops').select('id, status, expected_harvest_date').eq('user_id', userId).eq('status', 'growing'),
        supabase.from('orders').select('id, payment_status').eq('user_id', userId).eq('payment_status', 'pending'),
        supabase.from('rent_payments').select('id, status, amount').eq('user_id', userId).eq('status', 'overdue'),
      ])

      const properties = props.data || []
      const occupied = properties.filter(p => p.status === 'occupied').length

      const oneWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')
      const upcoming = (crops.data || []).filter(c => c.expected_harvest_date <= oneWeek)

      await sendDailySummary(setting.profiles.whatsapp_number, {
        totalProperties: properties.length,
        occupiedProperties: occupied,
        rentDueToday: 0,
        overduePayments: (payments.data || []).length,
        activeCrops: (crops.data || []).length,
        upcomingHarvests: upcoming.length,
        pendingOrders: (orders.data || []).length,
        monthIncomeGHS: 0,
        monthIncomeZAR: 0,
      })
    }
    console.log('[Scheduler] Daily summaries sent')
  } catch (err) {
    console.error('[Scheduler] Daily summary error:', err)
  }
}

module.exports = { scheduleRentReminders, scheduleDailySummary }
