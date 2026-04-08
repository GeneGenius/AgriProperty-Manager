import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, Wrench,
  Sprout, ShoppingCart, Package, DollarSign,
  Calendar, Award, TrendingUp, Bot, Bell, Settings,
  ChevronLeft, ChevronRight, Building2, Leaf, X,
} from 'lucide-react'
import useAppStore from '../../store/appStore'
import useAuthStore from '../../store/authStore'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: '🏠 Real Estate',
    color: 'estate',
    items: [
      { to: '/real-estate/properties', icon: Building2, label: 'Properties' },
      { to: '/real-estate/tenants', icon: Users, label: 'Tenants' },
      { to: '/real-estate/rent-payments', icon: CreditCard, label: 'Rent Payments' },
      { to: '/real-estate/maintenance', icon: Wrench, label: 'Maintenance' },
    ],
  },
  {
    label: '🌾 Farm',
    color: 'farm',
    items: [
      { to: '/farm/crops', icon: Sprout, label: 'Crops' },
      { to: '/farm/harvests', icon: Leaf, label: 'Harvests' },
      { to: '/farm/buyers', icon: Users, label: 'Buyers' },
      { to: '/farm/orders', icon: Package, label: 'Orders' },
      { to: '/farm/expenses', icon: DollarSign, label: 'Expenses' },
      { to: '/farm/calendar', icon: Calendar, label: 'Planting Calendar' },
      { to: '/farm/certifications', icon: Award, label: 'Certifications' },
    ],
  },
  {
    label: '💰 Finance',
    color: 'finance',
    items: [
      { to: '/finance', icon: TrendingUp, label: 'Finance Hub' },
    ],
  },
  {
    label: '🤖 AI & Tools',
    color: 'ai',
    items: [
      { to: '/ai', icon: Bot, label: 'AI Assistant' },
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

const groupColorMap = {
  estate: 'text-blue-600 dark:text-blue-400',
  farm: 'text-green-600 dark:text-green-400',
  finance: 'text-purple-600 dark:text-purple-400',
  ai: 'text-orange-600 dark:text-orange-400',
}

const activeLinkMap = {
  estate: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  farm: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  finance: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  ai: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
}

export default function Sidebar({ mobile = false, onClose }) {
  const { sidebarOpen, toggleSidebar, unreadNotifications } = useAppStore()
  const { profile } = useAuthStore()
  const location = useLocation()

  const collapsed = !sidebarOpen && !mobile

  const getGroupForPath = (path) => {
    if (path.startsWith('/real-estate')) return 'estate'
    if (path.startsWith('/farm')) return 'farm'
    if (path.startsWith('/finance')) return 'finance'
    if (path.startsWith('/ai') || path.startsWith('/notifications') || path.startsWith('/settings')) return 'ai'
    return 'default'
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate">AgrIProperty</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight truncate">Manager AI</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
        )}
        {!mobile && (
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors flex-shrink-0"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        {mobile && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
            {group.label && !collapsed && (
              <p className={`text-[11px] font-semibold uppercase tracking-wider px-2 mb-1 ${group.color ? groupColorMap[group.color] : 'text-gray-400'}`}>
                {group.label}
              </p>
            )}
            {group.items.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
              const groupColor = getGroupForPath(to)
              const activeClass = activeLinkMap[groupColor] || activeLinkMap.default

              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={mobile ? onClose : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? activeClass
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate">{label}</span>
                  )}
                  {!collapsed && label === 'Notifications' && unreadNotifications > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User profile at bottom */}
      {!collapsed && profile && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(profile.full_name || profile.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                {profile.full_name || 'User'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate capitalize">
                {profile.role || 'Owner'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
