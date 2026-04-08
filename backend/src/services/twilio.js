const twilio = require('twilio')

let client = null

function getClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    if (!accountSid || !authToken) {
      console.warn('[Twilio] Missing credentials — WhatsApp notifications disabled')
      return null
    }
    client = twilio(accountSid, authToken)
  }
  return client
}

const FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

/**
 * Send a WhatsApp message via Twilio
 */
async function sendWhatsApp(to, message) {
  const c = getClient()
  if (!c) return { success: false, error: 'Twilio not configured' }

  try {
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    const result = await c.messages.create({
      from: FROM,
      to: toNumber,
      body: message,
    })
    return { success: true, sid: result.sid }
  } catch (err) {
    console.error('[Twilio] Failed to send WhatsApp:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Send rent reminder to tenant
 */
async function sendRentReminder(tenantPhone, tenantName, propertyName, amount, dueDate) {
  const message = `🏠 *AgrIProperty Manager*\n\nHello ${tenantName},\n\nThis is a friendly reminder that your rent of *GHS ${Number(amount).toLocaleString()}* for *${propertyName}* is due on *${dueDate}*.\n\nPlease ensure timely payment to avoid late fees.\n\nThank you! 🙏`
  return sendWhatsApp(tenantPhone, message)
}

/**
 * Send overdue rent alert
 */
async function sendOverdueAlert(tenantPhone, tenantName, propertyName, amount, daysOverdue) {
  const message = `⚠️ *AgrIProperty Manager — URGENT*\n\nHello ${tenantName},\n\nYour rent of *GHS ${Number(amount).toLocaleString()}* for *${propertyName}* is *${daysOverdue} day(s) overdue*.\n\nPlease make payment immediately or contact your landlord to avoid further action.\n\nThank you.`
  return sendWhatsApp(tenantPhone, message)
}

/**
 * Send harvest approaching notification to farm manager
 */
async function sendHarvestAlert(phone, cropName, fieldPlot, expectedDate) {
  const message = `🌾 *AgrIProperty Manager — Farm Alert*\n\nYour crop *${cropName}* in *Field ${fieldPlot}* is approaching harvest!\n\nExpected harvest date: *${expectedDate}*\n\nPrepare harvest equipment and notify buyers. Check weather forecast before harvesting.\n\n✅ Log your harvest in the app when done.`
  return sendWhatsApp(phone, message)
}

/**
 * Send order confirmation to buyer
 */
async function sendOrderConfirmation(buyerPhone, buyerName, invoiceNumber, items, deliveryDate, total, currency) {
  const itemList = items.map(i => `• ${i.crop_name}: ${i.quantity_kg}kg @ ${currency} ${i.price_per_kg}/kg`).join('\n')
  const message = `📦 *AgrIProperty Manager — Order Confirmed*\n\nDear ${buyerName},\n\nYour order *${invoiceNumber}* has been confirmed!\n\n*Items:*\n${itemList}\n\n*Total: ${currency} ${Number(total).toLocaleString()}*\nDelivery Date: ${deliveryDate}\n\nWe will notify you when your order is dispatched. Thank you for your business! 🙏`
  return sendWhatsApp(buyerPhone, message)
}

/**
 * Send certification deadline alert
 */
async function sendCertificationAlert(phone, certName, expiryDate, daysLeft) {
  const message = `⚠️ *AgrIProperty Manager — Certification Alert*\n\nYour *${certName}* certification expires in *${daysLeft} day(s)* on *${expiryDate}*.\n\nPlease begin renewal process immediately to avoid disruption to your export operations.\n\n🌾 Log in to AgrIProperty Manager to update your certification status.`
  return sendWhatsApp(phone, message)
}

/**
 * Send daily summary report
 */
async function sendDailySummary(phone, summary) {
  const message = `📊 *AgrIProperty Manager — Daily Summary*\n*${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}*\n\n🏠 *Real Estate:*\n• Properties: ${summary.totalProperties} (${summary.occupiedProperties} occupied)\n• Rent due today: ${summary.rentDueToday}\n• Overdue payments: ${summary.overduePayments}\n\n🌾 *Farm:*\n• Active crops: ${summary.activeCrops}\n• Upcoming harvests: ${summary.upcomingHarvests}\n• Pending orders: ${summary.pendingOrders}\n\n💰 *Finance:*\n• Month income: GHS ${Number(summary.monthIncomeGHS || 0).toLocaleString()} + ZAR ${Number(summary.monthIncomeZAR || 0).toLocaleString()}\n\nHave a productive day! 🚀`
  return sendWhatsApp(phone, message)
}

module.exports = {
  sendWhatsApp,
  sendRentReminder,
  sendOverdueAlert,
  sendHarvestAlert,
  sendOrderConfirmation,
  sendCertificationAlert,
  sendDailySummary,
}
