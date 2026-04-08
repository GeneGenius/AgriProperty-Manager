import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { farmExpensesApi, cropsApi } from '../../services/api'
import Modal from '../../components/UI/Modal'
import ConfirmDialog from '../../components/UI/ConfirmDialog'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const CATEGORIES = ['seeds', 'fertilizer', 'pesticide', 'labor', 'irrigation', 'transport', 'equipment', 'packaging', 'certification', 'other']

export default function FarmExpenses() {
  const [expenses, setExpenses] = useState([])
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset } = useForm()

  const load = async () => {
    try {
      const [e, c] = await Promise.all([farmExpensesApi.list(), cropsApi.list()])
      setExpenses(e); setCrops(c)
    } catch { toast.error('Failed to load expenses') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); reset({ date: format(new Date(), 'yyyy-MM-dd'), currency: 'SZL' }); setModalOpen(true) }
  const openEdit = (e) => { setEditing(e); reset(e); setModalOpen(true) }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editing) { await farmExpensesApi.update(editing.id, data); toast.success('Expense updated') }
      else { await farmExpensesApi.create(data); toast.success('Expense added') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await farmExpensesApi.delete(deleteId); toast.success('Expense deleted'); setDeleteId(null); load() }
    catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  const totalByCat = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
    return acc
  }, {})

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Farm Expenses</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">L{total.toLocaleString()} SZL total expenses</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Log Expense</button>
      </div>

      {/* Category Breakdown */}
      {Object.keys(totalByCat).length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Expense Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(totalByCat).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
              <div key={cat} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 capitalize mb-1">{cat}</p>
                <p className="font-bold text-sm text-gray-900 dark:text-white">L{Number(amount).toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">{Math.round((amount / total) * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="card p-12 text-center">
          <DollarSign size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No expenses logged yet.</p>
          <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Log Expense</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {['Date', 'Category', 'Description', 'Crop', 'Vendor', 'Amount', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {expenses.map(e => (
                  <tr key={e.id} className="table-row-hover">
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{format(new Date(e.date), 'd MMM yy')}</td>
                    <td className="px-4 py-3"><span className="badge-gray capitalize text-xs">{e.category}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{e.description}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{e.crops?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{e.vendor || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">{e.currency} {Number(e.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-lg"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(e.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Log Farm Expense'} size="md"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Category *</label>
            <select className="form-select" {...register('category', { required: true })}>
              <option value="">Select</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" {...register('date', { required: true })} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description *</label>
            <input className="form-input" placeholder="What was purchased/paid for?" {...register('description', { required: true })} />
          </div>
          <div>
            <label className="form-label">Amount *</label>
            <input type="number" step="0.01" className="form-input" {...register('amount', { required: true })} />
          </div>
          <div>
            <label className="form-label">Currency</label>
            <select className="form-select" {...register('currency')}>
              <option value="SZL">SZL — Swazi Lilangeni</option>
              <option value="ZAR">ZAR — South African Rand</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="form-label">Crop (optional)</label>
            <select className="form-select" {...register('crop_id')}>
              <option value="">Not crop-specific</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Vendor / Supplier</label>
            <input className="form-input" placeholder="Supplier name" {...register('vendor')} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Notes</label>
            <textarea rows={2} className="form-input resize-none" {...register('notes')} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Expense" message="Delete this expense record?" loading={deleting} />
    </div>
  )
}
