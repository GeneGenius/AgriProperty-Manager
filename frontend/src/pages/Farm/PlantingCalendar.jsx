import { useState, useEffect } from 'react'
import { Calendar, Cloud, Thermometer, Droplets, Wind } from 'lucide-react'
import { cropsApi, weatherApi, marketPricesApi } from '../../services/api'
import { StatusBadge } from '../../components/UI/Badge'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { format, differenceInDays, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

export default function PlantingCalendar() {
  const [crops, setCrops] = useState([])
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [marketPrices, setMarketPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('Manzini')

  const load = async () => {
    try {
      const [c, w, f, mp] = await Promise.allSettled([
        cropsApi.list({ status: 'growing' }),
        weatherApi.get(city, 'SZ'),
        weatherApi.getForecast(city, 'SZ'),
        marketPricesApi.getSummary(),
      ])
      if (c.status === 'fulfilled') setCrops(c.value)
      if (w.status === 'fulfilled') setWeather(w.value)
      if (f.status === 'fulfilled') setForecast(f.value)
      if (mp.status === 'fulfilled') setMarketPrices(mp.value.slice(0, 8))
    } catch { toast.error('Failed to load calendar data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [city])

  if (loading) return <PageLoader />

  const ESWATINI_CITIES = ['Manzini', 'Mbabane', 'Siteki', 'Nhlangano', 'Pigg\'s Peak']

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Planting Calendar & Weather</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Eswatini farm weather & crop schedule</p>
        </div>
        <select className="form-select w-auto" value={city} onChange={e => { setCity(e.target.value); setLoading(true) }}>
          {ESWATINI_CITIES.map(c => <option key={c} value={c}>{c}, Eswatini</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Current Weather */}
        {weather && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{weather.city}, Eswatini</h3>
                <p className="text-xs text-gray-500 capitalize">{weather.description}</p>
                {weather.mock && <span className="text-[10px] text-yellow-500">Preview data</span>}
              </div>
              <Cloud size={28} className="text-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                <Thermometer size={18} className="mx-auto text-orange-500 mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{weather.temperature}°C</p>
                <p className="text-xs text-gray-500">Temperature</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                <Droplets size={18} className="mx-auto text-blue-500 mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{weather.humidity}%</p>
                <p className="text-xs text-gray-500">Humidity</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <Wind size={18} className="mx-auto text-gray-400 mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{weather.wind_speed} m/s</p>
                <p className="text-xs text-gray-500">Wind</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                <Droplets size={18} className="mx-auto text-blue-500 mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{weather.rainfall || 0} mm</p>
                <p className="text-xs text-gray-500">Rainfall</p>
              </div>
            </div>
            {weather.farming_advisory && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Farming Advisory</p>
                <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed whitespace-pre-line">{weather.farming_advisory}</p>
              </div>
            )}
          </div>
        )}

        {/* 5-Day Forecast */}
        {forecast?.forecasts && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">5-Day Forecast</h3>
            <div className="space-y-2">
              {forecast.forecasts.map((day, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="w-16 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {format(new Date(day.date), 'EEE d')}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs capitalize text-gray-600 dark:text-gray-400">{day.description}</p>
                    <p className="text-[10px] text-blue-500">{day.farming_tip}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-orange-500">{day.temp_high}°</p>
                    <p className="text-gray-400">{day.temp_low}°</p>
                  </div>
                  <div className="text-xs text-blue-500">
                    {day.rainfall > 0 ? `${day.rainfall}mm` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SA & Eswatini Market Prices */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Market Prices</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">SA & Eswatini fresh produce markets</p>
          {marketPrices.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No price data available</p>
          ) : (
            <div className="space-y-2">
              {marketPrices.map((mp, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{mp.crop_name}</p>
                    <p className="text-xs text-gray-500">{mp.markets?.[0]?.market?.split(' ').slice(0, 2).join(' ')}</p>
                  </div>
                  <div className="text-right">
                    {mp.avg_price_zar && <p className="text-sm font-bold text-green-600">R{mp.avg_price_zar}/kg</p>}
                    {mp.avg_price_szl && <p className="text-xs text-blue-600">L{mp.avg_price_szl}/kg</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Crop Schedule */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Active Crop Schedule</h3>
        {crops.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No active crops</p>
        ) : (
          <div className="space-y-3">
            {crops.map(crop => {
              const today = new Date()
              const plantDate = parseISO(crop.planting_date)
              const harvestDate = parseISO(crop.expected_harvest_date)
              const totalDays = differenceInDays(harvestDate, plantDate)
              const daysGrown = differenceInDays(today, plantDate)
              const daysLeft = differenceInDays(harvestDate, today)
              const progress = Math.min(100, Math.max(0, Math.round((daysGrown / totalDays) * 100)))
              const isUrgent = daysLeft <= 7 && daysLeft >= 0

              return (
                <div key={crop.id} className={`p-4 rounded-xl border ${isUrgent ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/10' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{crop.name}</span>
                      <span className="text-xs text-gray-500 ml-2">Field {crop.field_plot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isUrgent && <span className="text-xs text-orange-600 font-medium">🌾 {daysLeft}d to harvest!</span>}
                      <span className="text-xs text-gray-500">{format(harvestDate, 'd MMM yy')}</span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isUrgent ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
                    <span>Planted {format(plantDate, 'd MMM')}</span>
                    <span>{progress}% grown — {daysLeft > 0 ? `${daysLeft} days left` : 'Ready to harvest'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
