import { useState, useEffect } from 'react'
import { CheckCircle, Bell, Filter, DollarSign, AlertCircle, Clock } from 'lucide-react'
import { rentPaymentsApi } from '../../services/api'
import { StatusBadge } from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { format, isPast, isToday } from 'date-fns'
import toast from 'react-hot-toast'

export default function RentPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [payModal, setPayModal] = useState(null)
  const [payMethod, setPayMethod] = useState('mobile_money')
  const [payRef, setPayRef] = useState('')
  const [marking, setMarking] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(null)

  const load = async () => {
    try {
      const data = await rentPaymentsApi.list(statusFilter ? { status: statusFilter } : {})
      setPayments(data)
    } catch { toast.error('Failed to load payments') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const markPaid = async () => {
    setMarking(true)
    try {
      await rentPaymentsApi.markPaid(payModal.id, { payment_method: payMethod, reference: payRef })
      toast.success('Payment marked as paid!')
      setPayModal(null)
      load()
    } catch (err) { toast.error(err.message) }
    finally { setMarking(false) }
  }

  const sendReminder = async (id) => {
    setSendingReminder(id)
    try {
      await rentPaymentsApi.sendReminder(id)
      toast.success('Reminder sent via WhatsApp!')
    } catch (err) { toast.error(err.message) }
    finally { setSendingReminder(null) }
  }

  const summary = {
    total: payments.length,
    paid: payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'pending').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
    totalAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
    overdueAmount: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0),
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Rent Payments</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage all rent collections</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-select w-auto text-sm"
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Collected</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">₵{summary.totalAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">{summary.paid} payments</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{summary.pending}</p>
          <p className="text-xs text-gray-500 mt-0.5">awaiting payment</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{summary.overdue}</p>
          <p className="text-xs text-gray-500 mt-0.5">₵{summary.overdueAmount.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Records</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {['Tenant', 'Property', 'Due Date', 'Amount', 'Paid Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {payments.map((p) => {
                const isDue = p.status === 'pending' && isToday(new Date(p.due_date))
                return (
                  <tr key={p.id} className={`table-row-hover ${isDue ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{p.tenants?.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.properties?.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      {p.due_date && (
                        <span className={isPast(new Date(p.due_date)) && p.status !== 'paid' ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          {format(new Date(p.due_date), 'd MMM yyyy')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">₵{Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.paid_date ? format(new Date(p.paid_date), 'd MMM yyyy') : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {p.status !== 'paid' && (
                          <>
                            <button onClick={() => setPayModal(p)} title="Mark as paid" className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 rounded-lg transition-colors">
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => sendReminder(p.id)}
                              disabled={sendingReminder === p.id}
                              title="Send WhatsApp reminder"
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Bell size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {payments.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500 text-sm">No payment records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Paid Modal */}
      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Record Payment" size="sm"
        footer={<>
          <button onClick={() => setPayModal(null)} className="btn-secondary">Cancel</button>
          <button onClick={markPaid} disabled={marking} className="btn-success">
            {marking ? 'Saving...' : 'Confirm Payment'}
          </button>
        </>}
      >
        {payModal && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tenant: <span className="font-medium text-gray-900 dark:text-white">{payModal.tenants?.full_name}</span></p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Amount: <span className="text-xl font-bold text-green-600">₵{Number(payModal.amount).toLocaleString()}</span></p>
            </div>
            <div>
              <label className="form-label">Payment Method</label>
              <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Reference / Transaction ID</label>
              <input className="form-input" placeholder="Optional" value={payRef} onChange={e => setPayRef(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
