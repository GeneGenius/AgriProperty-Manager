export function StatusBadge({ status }) {
  const map = {
    // Rent / Payment
    paid: 'badge-green',
    pending: 'badge-yellow',
    overdue: 'badge-red',
    partial: 'badge-blue',
    // Property
    occupied: 'badge-green',
    vacant: 'badge-gray',
    under_maintenance: 'badge-yellow',
    for_sale: 'badge-blue',
    // Tenant
    active: 'badge-green',
    inactive: 'badge-gray',
    evicted: 'badge-red',
    // Maintenance
    open: 'badge-red',
    in_progress: 'badge-yellow',
    resolved: 'badge-green',
    cancelled: 'badge-gray',
    // Crop
    growing: 'badge-green',
    harvested: 'badge-blue',
    failed: 'badge-red',
    sold: 'badge-gray',
    // Order delivery
    shipped: 'badge-blue',
    delivered: 'badge-green',
    // Certification
    expired: 'badge-red',
    // Priority
    low: 'badge-gray',
    medium: 'badge-yellow',
    high: 'badge-red',
    emergency: 'badge-red',
  }

  const labels = {
    under_maintenance: 'Maintenance',
    for_sale: 'For Sale',
    in_progress: 'In Progress',
  }

  const cls = map[status] || 'badge-gray'
  const label = labels[status] || status?.replace(/_/g, ' ')

  return <span className={cls}>{label}</span>
}

export function QualityBadge({ grade }) {
  const map = {
    A: 'badge-green',
    B: 'badge-blue',
    C: 'badge-yellow',
    reject: 'badge-red',
  }
  return <span className={map[grade] || 'badge-gray'}>{grade}</span>
}

export function PriorityBadge({ priority }) {
  const map = {
    low: 'badge-gray',
    medium: 'badge-yellow',
    high: 'badge-red',
    emergency: 'bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full',
  }
  return <span className={map[priority] || 'badge-gray'}>{priority}</span>
}
