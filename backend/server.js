require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const cron = require('node-cron')

const routes = require('./src/routes')
const { scheduleRentReminders, scheduleDailySummary } = require('./src/services/scheduler')

const app = express()
const PORT = process.env.PORT || 5000

// ── Security middleware ──────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')
    if (!origin || allowed.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

// ── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', limiter)

// AI endpoint gets a tighter limit
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many AI requests. Please wait a moment.' },
})
app.use('/api/ai', aiLimiter)

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ── Routes ───────────────────────────────────────────────────
app.use('/api', routes)

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'AgrIProperty Manager AI Backend',
  })
})

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack)
  const status = err.status || 500
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  })
})

// ── Scheduled jobs ───────────────────────────────────────────
// Rent reminders: run daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('[Cron] Running rent reminder job...')
  await scheduleRentReminders()
})

// Daily summary: run daily at 7 AM
cron.schedule('0 7 * * *', async () => {
  console.log('[Cron] Sending daily summaries...')
  await scheduleDailySummary()
})

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ AgrIProperty Manager AI backend running on port ${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app
