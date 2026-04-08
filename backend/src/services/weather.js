const axios = require('axios')

const BASE_URL = 'https://api.openweathermap.org/data/2.5'

/**
 * Get current weather for a location
 */
async function getCurrentWeather(city = 'Manzini', country = 'SZ') {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    return { error: 'OpenWeather API key not configured', mock: true, ...getMockWeather(city) }
  }

  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: `${city},${country}`,
        appid: apiKey,
        units: 'metric',
      },
      timeout: 5000,
    })

    const data = response.data
    return {
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      wind_speed: data.wind.speed,
      rainfall: data.rain?.['1h'] || 0,
      visibility: data.visibility,
      farming_advisory: getFarmingAdvisory(data),
    }
  } catch (err) {
    console.error('[Weather] Failed:', err.message)
    return getMockWeather(city)
  }
}

/**
 * Get 5-day forecast
 */
async function getForecast(city = 'Manzini', country = 'SZ') {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    return { error: 'OpenWeather API key not configured', mock: true }
  }

  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: `${city},${country}`,
        appid: apiKey,
        units: 'metric',
        cnt: 40,
      },
      timeout: 5000,
    })

    const forecasts = response.data.list.filter((_, i) => i % 8 === 0).slice(0, 5)
    return {
      city: response.data.city.name,
      forecasts: forecasts.map(f => ({
        date: f.dt_txt.split(' ')[0],
        temp_high: Math.round(f.main.temp_max),
        temp_low: Math.round(f.main.temp_min),
        humidity: f.main.humidity,
        description: f.weather[0].description,
        icon: f.weather[0].icon,
        rainfall: f.rain?.['3h'] || 0,
        farming_tip: getForecastTip(f),
      })),
    }
  } catch (err) {
    console.error('[Weather] Forecast failed:', err.message)
    return { error: err.message }
  }
}

/**
 * Generate farming advisory based on weather conditions
 */
function getFarmingAdvisory(weatherData) {
  const tips = []
  const temp = weatherData.main.temp
  const humidity = weatherData.main.humidity
  const rain = weatherData.rain?.['1h'] || 0
  const windSpeed = weatherData.wind.speed

  if (rain > 5) tips.push('⚠️ Heavy rain — avoid spraying pesticides or fertilizers')
  else if (rain > 0) tips.push('🌧️ Light rain — good for natural irrigation, skip watering today')
  else if (humidity < 40) tips.push('💧 Low humidity — increase irrigation frequency')
  else tips.push('✅ Good conditions — proceed with normal farming activities')

  if (temp > 35) tips.push('🌡️ High temperature — harvest early morning to preserve quality')
  else if (temp < 10) tips.push('❄️ Cool temperatures — protect frost-sensitive crops')

  if (windSpeed > 10) tips.push('💨 Strong winds — postpone pesticide spraying, check crop supports')

  return tips.join('\n')
}

function getForecastTip(forecast) {
  const rain = forecast.rain?.['3h'] || 0
  const temp = forecast.main.temp_max
  if (rain > 10) return 'Heavy rain expected — no spraying activities'
  if (rain > 2) return 'Moderate rain — good irrigation day'
  if (temp > 32) return 'Hot day — early harvest recommended'
  return 'Good farming conditions expected'
}

function getMockWeather(city) {
  return {
    city: city,
    country: 'SZ',
    temperature: 24,
    feels_like: 26,
    humidity: 68,
    description: 'partly cloudy',
    icon: '03d',
    wind_speed: 3.2,
    rainfall: 0,
    farming_advisory: '✅ Good conditions — proceed with normal farming activities\n💧 Monitor soil moisture levels',
    mock: true,
  }
}

module.exports = { getCurrentWeather, getForecast }
