import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Wrench } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { maintenanceApi, propertiesApi, tenantsApi } from '../../services/api'
import { StatusBadge, PriorityBadge } from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import ConfirmDialog from '../../components/UI/ConfirmDialog'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Maintenance() {
  const [requests, setRequests] = useState([])
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = async () => {
    try {
      const [r, p, t] = await Promise.all([
        maintenanceApi.list(statusFilter ? { status: statusFilter } : {}),
        propertiesApi.list(),
        tenantsApi.list(),
      ])
      setRequests(r); setProperties(p); setTenants(t)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true) }
  const openEdit = (r) => { setEditing(r); reset(r); setModalOpen(true) }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editing) {
        await maintenanceApi.update(editing.id, data)
        toast.success('Request updated')
      } else {
        await maintenanceApi.create(data)
        toast.success('Request created')
      }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await maintenanceApi.delete(deleteId)
      toast.success('Request deleted'); setDeleteId(null); load()
    } catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Maintenance Requests</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{requests.filter(r => r.status === 'open').length} open requests</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-select w-auto text-sm">
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Log Request</button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card p-12 text-center">
          <Wrench size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No maintenance requests</p>
          <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Log Request</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {requests.map(r => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{r.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{r.properties?.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={r.status} />
                  <PriorityBadge priority={r.priority} />
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{r.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                {r.assigned_to && <div><span className="text-gray-500">Assigned:</span> <span className="font-medium">{r.assigned_to}</span></div>}
                {r.actual_cost && <div><span className="text-gray-500">Cost:</span> <span className="font-medium">₵{Number(r.actual_cost).toLocaleString()}</span></div>}
                {r.completed_at && <div className="col-span-2"><span className="text-gray-500">Resolved:</span> <span>{format(new Date(r.completed_at), 'd MMM yyyy')}</span></div>}
                <div><span className="text-gray-500">Logged:</span> <span>{format(new Date(r.created_at), 'd MMM yy')}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(r)} className="flex-1 btn-secondary text-xs py-1.5"><Edit2 size={12} /> Update</button>
                <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Update Request' : 'Log Maintenance Request'} size="lg"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="e.g. Leaking roof in bedroom" {...register('title', { required: true })} />
          </div>
          <div>
            <label className="form-label">Property *</label>
            <select className="form-select" {...register('property_id', { required: true })}>
              <option value="">Select property</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Tenant (optional)</label>
            <select className="form-select" {...register('tenant_id')}>
              <option value="">None</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select className="form-select" {...register('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="form-select" {...register('category')}>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="structural">Structural</option>
              <option value="appliances">Appliances</option>
              <option value="cleaning">Cleaning</option>
              <option value="security">Security</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" {...register('status')}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="form-label">Assigned To</label>
            <input className="form-input" placeholder="Contractor name" {...register('assigned_to')} />
          </div>
          <div>
            <label className="form-label">Actual Cost (GHS)</label>
            <input type="number" className="form-input" {...register('actual_cost')} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description *</label>
            <textarea rows={3} className="form-input resize-none" {...register('description', { required: true })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Request" message="Delete this maintenance request?" loading={deleting} />
    </div>
  )
}
