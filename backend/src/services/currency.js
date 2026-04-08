const axios = require('axios')

// Cache exchange rates for 1 hour
let rateCache = {
  rates: null,
  fetchedAt: null,
}

const BASE_CURRENCY = 'USD'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Fetch live exchange rates with USD as base
 */
async function fetchExchangeRates() {
  const now = Date.now()
  if (rateCache.rates && rateCache.fetchedAt && (now - rateCache.fetchedAt < CACHE_TTL_MS)) {
    return rateCache.rates
  }

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY
    if (!apiKey) {
      console.warn('[Currency] No exchange rate API key — using fallback rates')
      return getFallbackRates()
    }

    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${BASE_CURRENCY}`,
      { timeout: 5000 }
    )

    if (response.data && response.data.conversion_rates) {
      rateCache = {
        rates: response.data.conversion_rates,
        fetchedAt: now,
      }
      return rateCache.rates
    }
    return getFallbackRates()
  } catch (err) {
    console.error('[Currency] Failed to fetch exchange rates:', err.message)
    return getFallbackRates()
  }
}

/**
 * Fallback rates (approximate, updated periodically)
 * SZL and ZAR are pegged 1:1
 */
function getFallbackRates() {
  return {
    USD: 1,
    GHS: 15.2,
    ZAR: 18.5,
    SZL: 18.5,
    EUR: 0.92,
    GBP: 0.79,
  }
}

/**
 * Convert an amount from one currency to another
 */
async function convert(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount
  const rates = await fetchExchangeRates()
  const fromRate = rates[fromCurrency.toUpperCase()]
  const toRate = rates[toCurrency.toUpperCase()]
  if (!fromRate || !toRate) throw new Error(`Unknown currency: ${fromCurrency} or ${toCurrency}`)
  // Convert to USD then to target
  const inUSD = amount / fromRate
  return Math.round(inUSD * toRate * 100) / 100
}

/**
 * Get all current rates for display
 */
async function getAllRates() {
  const rates = await fetchExchangeRates()
  const currencies = ['USD', 'GHS', 'ZAR', 'SZL', 'EUR', 'GBP']
  return currencies.reduce((acc, cur) => {
    acc[cur] = rates[cur] || null
    return acc
  }, {})
}

/**
 * Format currency for display
 */
function formatCurrency(amount, currency) {
  const symbols = {
    GHS: '₵',
    ZAR: 'R',
    SZL: 'L',
    USD: '$',
    EUR: '€',
    GBP: '£',
  }
  const symbol = symbols[currency] || currency
  return `${symbol}${Number(amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

module.exports = { fetchExchangeRates, convert, getAllRates, formatCurrency }
