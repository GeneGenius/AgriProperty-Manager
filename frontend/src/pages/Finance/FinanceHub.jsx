import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Download, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { financeApi } from '../../services/api'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const HEALTH_CONFIG = {
  excellent: { label: 'Excellent', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: '🟢' },
  good: { label: 'Good', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: '🔵' },
  needs_attention: { label: 'Needs Attention', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: '🟡' },
}

const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#06b6d4', '#84cc16', '#f59e0b']

function MetricCard({ label, value, sub, positive, neutral }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${positive === true ? 'text-green-600 dark:text-green-400' : positive === false ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function FinanceHub() {
  const [data, setData] = useState(null)
  const [rates, setRates] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const [dashData, rateData] = await Promise.all([
        financeApi.getDashboard(),
        financeApi.getRates(),
      ])
      setData(dashData)
      setRates(rateData)
    } catch (err) {
      toast.error('Failed to load finance data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const refresh = () => { setRefreshing(true); load() }

  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['Month', 'Rent Income (GHS)', 'RE Expenses (GHS)', 'RE Profit (GHS)', 'Farm Revenue (ZAR)', 'Farm Expenses (SZL)', 'Farm Profit (ZAR)'],
      ...data.monthly_data.map(m => [m.month, m.rent_income_ghs, m.re_expenses_ghs, m.re_profit, m.farm_revenue_zar, m.farm_expenses_szl, m.farm_profit]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agriproperty-finance-${new Date().getFullYear()}.csv`
    a.click()
    toast.success('Finance report exported!')
  }

  if (loading) return <PageLoader />
  if (!data) return <div className="card p-12 text-center text-gray-500">No finance data available</div>

  const health = HEALTH_CONFIG[data.health_score] || HEALTH_CONFIG.needs_attention

  const reExpBreakdown = Object.entries(data.expense_breakdown?.real_estate || {}).map(([name, value]) => ({ name, value }))
  const farmExpBreakdown = Object.entries(data.expense_breakdown?.farm || {}).map(([name, value]) => ({ name, value }))

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="card px-4 py-3 text-xs shadow-xl">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {Number(p.value).toLocaleString()}</p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Finance Hub</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Unified P&L — Ghana Real Estate + Eswatini Farm</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={refreshing} className="btn-secondary">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportCSV} className="btn-primary"><Download size={14} /> Export CSV</button>
        </div>
      </div>

      {/* Health Score + Exchange Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`card p-5 ${health.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Financial Health Score</p>
              <p className={`text-2xl font-bold mt-1 ${health.color}`}>{health.icon} {health.label}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Overall profit margin: {data.overall_margin_pct}%</p>
            </div>
            <div className="text-4xl">{data.overall_margin_pct >= 30 ? '🚀' : data.overall_margin_pct >= 10 ? '📈' : '⚠️'}</div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Live Exchange Rates (vs USD)</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { code: 'GHS', symbol: '₵', name: 'Ghana Cedi' },
              { code: 'ZAR', symbol: 'R', name: 'SA Rand' },
              { code: 'SZL', symbol: 'L', name: 'Swazi Lilangeni' },
            ].map(({ code, symbol, name }) => (
              <div key={code} className="text-center bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-500">{name}</p>
                <p className="font-bold text-gray-900 dark:text-white">{symbol}{rates[code] || '—'}</p>
                <p className="text-[10px] text-gray-400">per USD</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <MetricCard label="Rent Income" value={`₵${Number(data.totals.rent_income_ghs).toLocaleString()}`} sub="GHS (6 months)" />
        <MetricCard label="RE Expenses" value={`₵${Number(data.totals.re_expenses_ghs).toLocaleString()}`} sub="GHS (6 months)" />
        <MetricCard label="RE Profit" value={`₵${Number(data.totals.re_profit_ghs).toLocaleString()}`} positive={data.totals.re_profit_ghs > 0} />
        <MetricCard label="Farm Revenue" value={`R${Number(data.totals.farm_revenue_zar).toLocaleString()}`} sub="ZAR (6 months)" />
        <MetricCard label="Farm Expenses" value={`L${Number(data.totals.farm_expenses_szl).toLocaleString()}`} sub="SZL (6 months)" />
        <MetricCard label="Farm Profit" value={`R${Number(data.totals.farm_profit_zar).toLocaleString()}`} positive={data.totals.farm_profit_zar > 0} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Combined Revenue Bar Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue & Expenses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.monthly_data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={customTooltip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="rent_income_ghs" name="Rent Income (GHS)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="re_expenses_ghs" name="RE Expenses (GHS)" fill="#93c5fd" radius={[3, 3, 0, 0]} />
              <Bar dataKey="farm_revenue_zar" name="Farm Rev (ZAR)" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="farm_expenses_szl" name="Farm Exp (SZL)" fill="#86efac" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Line Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Profit Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.monthly_data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={customTooltip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="re_profit" name="RE Profit (GHS)" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="farm_profit" name="Farm Profit (ZAR)" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Breakdown Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Real Estate Expense Categories (GHS)</h3>
          {reExpBreakdown.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No expense data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={reExpBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {reExpBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₵${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Farm Expense Categories (SZL)</h3>
          {farmExpBreakdown.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No expense data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={farmExpBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {farmExpBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `L${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3-Month Cash Flow Forecast */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">3-Month Cash Flow Forecast</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Based on 3-month average — for planning purposes only</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.forecast.map((f, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{f.month}</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Projected Rent</span><span className="text-blue-600 font-medium">₵{f.projected_rent.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">RE Expenses</span><span className="text-red-500 font-medium">₵{f.projected_re_expenses.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Farm Revenue</span><span className="text-green-600 font-medium">R{f.projected_farm_revenue.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Farm Expenses</span><span className="text-red-500 font-medium">L{f.projected_farm_expenses.toLocaleString()}</span></div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold">
                  <span className="text-gray-700 dark:text-gray-300">Net (approx)</span>
                  <span className={f.projected_rent + f.projected_farm_revenue > f.projected_re_expenses + f.projected_farm_expenses ? 'text-green-600' : 'text-red-600'}>
                    {f.projected_rent + f.projected_farm_revenue > f.projected_re_expenses + f.projected_farm_expenses ? '+' : '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
