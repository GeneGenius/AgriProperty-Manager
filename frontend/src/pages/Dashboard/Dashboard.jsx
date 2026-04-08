import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, DollarSign, Sprout, Calendar, TrendingUp,
  AlertCircle, Plus, MessageSquare, Package, CheckCircle2, Clock,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { financeApi, notificationsApi } from '../../services/api'
import useAuthStore from '../../store/authStore'
import { format } from 'date-fns'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { StatusBadge } from '../../components/UI/Badge'
import toast from 'react-hot-toast'

function KPICard({ icon: Icon, label, value, sub, color, onClick }) {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  }
  return (
    <div
      className={`card p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [chartData, setChartData] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [sumData, finData, notifData] = await Promise.all([
          financeApi.getSummary(),
          financeApi.getDashboard(),
          notificationsApi.list({ unread_only: 'false' }),
        ])
        setSummary(sumData)
        setChartData(finData.monthly_data || [])
        setNotifications((notifData || []).slice(0, 6))
      } catch (err) {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageLoader />

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="card px-4 py-3 text-xs shadow-lg">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
              {p.name}: {p.value?.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const notifIcon = (type) => {
    const icons = {
      rent_due: <Clock size={14} className="text-yellow-500" />,
      rent_overdue: <AlertCircle size={14} className="text-red-500" />,
      harvest_approaching: <Sprout size={14} className="text-green-500" />,
      order_confirmed: <Package size={14} className="text-blue-500" />,
      payment_received: <CheckCircle2 size={14} className="text-green-500" />,
      maintenance: <AlertCircle size={14} className="text-orange-500" />,
      certification_deadline: <AlertCircle size={14} className="text-purple-500" />,
    }
    return icons[type] || <AlertCircle size={14} className="text-gray-400" />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="card p-6 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white border-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-100 text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
            <h2 className="text-2xl font-bold mt-0.5">
              {greeting()}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              Managing {profile?.business_name_ghana || 'Ghana Real Estate'} & {profile?.business_name_eswatini || 'Eswatini Farm'}
            </p>
          </div>
          {summary?.overdue_rent_count > 0 && (
            <div className="bg-red-500/30 border border-red-300/30 rounded-xl px-4 py-3 text-sm">
              <p className="font-semibold">⚠️ {summary.overdue_rent_count} overdue rent{summary.overdue_rent_count > 1 ? 's' : ''}</p>
              <p className="text-blue-200 text-xs">GHS {Number(summary.overdue_rent_amount_ghs || 0).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          icon={Building2} label="Total Properties" color="blue"
          value={summary?.total_properties ?? 0}
          sub={`${summary?.occupied_properties ?? 0} occupied`}
          onClick={() => navigate('/real-estate/properties')}
        />
        <KPICard
          icon={TrendingUp} label="Occupancy Rate" color="purple"
          value={`${summary?.occupancy_rate ?? 0}%`}
          sub="of all properties"
        />
        <KPICard
          icon={DollarSign} label="Monthly Rent" color="green"
          value={`₵${Number(summary?.monthly_rental_income_ghs ?? 0).toLocaleString()}`}
          sub="GHS total expected"
          onClick={() => navigate('/real-estate/rent-payments')}
        />
        <KPICard
          icon={Sprout} label="Active Crops" color="teal"
          value={summary?.active_crops ?? 0}
          sub="in the field"
          onClick={() => navigate('/farm/crops')}
        />
        <KPICard
          icon={Calendar} label="Next Harvest" color="orange"
          value={summary?.next_harvest?.date ? format(new Date(summary.next_harvest.date), 'd MMM') : 'N/A'}
          sub={summary?.next_harvest?.name || 'No harvest due'}
          onClick={() => navigate('/farm/calendar')}
        />
        <KPICard
          icon={Package} label="Farm Revenue" color="green"
          value={`R${Number(summary?.farm_revenue_this_month_zar ?? 0).toLocaleString()}`}
          sub="ZAR this month"
          onClick={() => navigate('/farm/orders')}
        />
      </div>

      {/* Revenue Chart + Notifications */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="card p-6 xl:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Revenue Overview — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="farmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={customTooltip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="rent_income_ghs" name="Rent (GHS)" stroke="#3b82f6" fill="url(#rentGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="farm_revenue_zar" name="Farm (ZAR)" stroke="#22c55e" fill="url(#farmGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Notifications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <button onClick={() => navigate('/notifications')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {notifications.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 p-2.5 rounded-lg ${!n.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                <div className="mt-0.5 flex-shrink-0">{notifIcon(n.type)}</div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{n.title}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {format(new Date(n.created_at), 'd MMM, HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Property', icon: Building2, to: '/real-estate/properties', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
            { label: 'Log Harvest', icon: Sprout, to: '/farm/harvests', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
            { label: 'Create Invoice', icon: Package, to: '/farm/orders', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
            { label: 'Ask AI', icon: MessageSquare, to: '/ai', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
          ].map(({ label, icon: Icon, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} hover:opacity-80 transition-opacity`}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
