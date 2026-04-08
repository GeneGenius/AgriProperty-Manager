const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const { getCurrentWeather, getForecast } = require('../services/weather')

router.use(authenticate)

// GET /api/weather?city=Manzini&country=SZ
router.get('/', async (req, res) => {
  try {
    const { city = 'Manzini', country = 'SZ' } = req.query
    const weather = await getCurrentWeather(city, country)
    res.json(weather)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/weather/forecast?city=Manzini&country=SZ
router.get('/forecast', async (req, res) => {
  try {
    const { city = 'Manzini', country = 'SZ' } = req.query
    const forecast = await getForecast(city, country)
    res.json(forecast)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
