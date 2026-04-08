import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, AlertCircle, Clock, Sprout, Package, DollarSign, Wrench, Award } from 'lucide-react'
import { notificationsApi } from '../../services/api'
import useAppStore from '../../store/appStore'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  rent_due: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Rent Due' },
  rent_overdue: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Overdue Rent' },
  harvest_approaching: { icon: Sprout, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Harvest Alert' },
  order_confirmed: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Order' },
  certification_deadline: { icon: Award, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'Certification' },
  maintenance: { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', label: 'Maintenance' },
  payment_received: { icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Payment' },
  weather_alert: { icon: AlertCircle, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', label: 'Weather' },
  system: { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', label: 'System' },
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { setUnreadNotifications } = useAppStore()

  const load = async () => {
    try {
      const data = await notificationsApi.list({})
      setNotifications(data)
      setUnreadNotifications(data.filter(n => !n.is_read).length)
    } catch { toast.error('Failed to load notifications') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await notificationsApi.markRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadNotifications(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadNotifications(0)
      toast.success('All marked as read')
    } catch { toast.error('Failed to mark all as read') }
  }

  const deleteNotif = async (id) => {
    try {
      await notificationsApi.delete(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch { toast.error('Failed to delete') }
  }

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'whatsapp') return n.sent_via_whatsapp
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Notification Center</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="form-select w-auto text-sm">
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="whatsapp">WhatsApp sent</option>
          </select>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-sm">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No notifications to show</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
            const Icon = config.icon
            return (
              <div
                key={n.id}
                className={`card p-4 flex items-start gap-4 transition-all ${!n.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${!n.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {n.title}
                        {n.sent_via_whatsapp && (
                          <span className="ml-2 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">WhatsApp</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                    </div>
                    <span className="badge-gray text-[10px] flex-shrink-0">{config.label}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5" title={format(new Date(n.created_at), 'dd MMM yyyy HH:mm')}>
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} title="Mark as read" className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteNotif(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
