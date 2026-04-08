import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FileText, User, Phone, Calendar } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { tenantsApi, propertiesApi } from '../../services/api'
import { StatusBadge } from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import ConfirmDialog from '../../components/UI/ConfirmDialog'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [agreementModal, setAgreementModal] = useState(false)
  const [agreement, setAgreement] = useState('')
  const [agreementLoading, setAgreementLoading] = useState(false)
  const [agreementTenantId, setAgreementTenantId] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = async () => {
    try {
      const [t, p] = await Promise.all([tenantsApi.list(), propertiesApi.list()])
      setTenants(t)
      setProperties(p)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditingTenant(null); reset({}); setModalOpen(true) }
  const openEdit = (t) => { setEditingTenant(t); reset({ ...t, lease_start: t.lease_start, lease_end: t.lease_end }); setModalOpen(true) }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editingTenant) {
        await tenantsApi.update(editingTenant.id, data)
        toast.success('Tenant updated')
      } else {
        await tenantsApi.create(data)
        toast.success('Tenant added — rent schedule generated')
      }
      setModalOpen(false)
      load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await tenantsApi.delete(deleteId)
      toast.success('Tenant removed')
      setDeleteId(null)
      load()
    } catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  const generateAgreement = async (tenantId) => {
    setAgreementTenantId(tenantId)
    setAgreementLoading(true)
    setAgreementModal(true)
    setAgreement('')
    try {
      const data = await tenantsApi.generateAgreement(tenantId)
      setAgreement(data.agreement)
    } catch { toast.error('Failed to generate agreement') }
    finally { setAgreementLoading(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Tenants</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{tenants.filter(t => t.status === 'active').length} active tenants</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Tenant</button>
      </div>

      {tenants.length === 0 ? (
        <div className="card p-12 text-center">
          <User size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No tenants yet.</p>
          <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Tenant</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {['Tenant', 'Property', 'Lease Period', 'Monthly Rent', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {tenants.map((t) => (
                  <tr key={t.id} className="table-row-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                          {t.full_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.full_name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> {t.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{t.properties?.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} />
                        {t.lease_start && format(new Date(t.lease_start), 'd MMM yy')} — {t.lease_end && format(new Date(t.lease_end), 'd MMM yy')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">₵{Number(t.monthly_rent).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => generateAgreement(t.id)} title="Generate Agreement" className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-lg transition-colors">
                          <FileText size={14} />
                        </button>
                        <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-lg transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteId(t.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTenant ? 'Edit Tenant' : 'Add New Tenant'} size="lg"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : editingTenant ? 'Update' : 'Add Tenant'}
          </button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Full Name *</label>
            <input className="form-input" {...register('full_name', { required: true })} />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">Required</p>}
          </div>
          <div>
            <label className="form-label">Property *</label>
            <select className="form-select" {...register('property_id', { required: true })}>
              <option value="">Select property</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Phone *</label>
            <input className="form-input" placeholder="+233 XXX XXX XXX" {...register('phone', { required: true })} />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" {...register('email')} />
          </div>
          <div>
            <label className="form-label">ID Number</label>
            <input className="form-input" {...register('id_number')} />
          </div>
          <div>
            <label className="form-label">Nationality</label>
            <input className="form-input" defaultValue="Ghanaian" {...register('nationality')} />
          </div>
          <div>
            <label className="form-label">Occupation</label>
            <input className="form-input" {...register('occupation')} />
          </div>
          <div>
            <label className="form-label">Lease Start *</label>
            <input type="date" className="form-input" {...register('lease_start', { required: true })} />
          </div>
          <div>
            <label className="form-label">Lease End *</label>
            <input type="date" className="form-input" {...register('lease_end', { required: true })} />
          </div>
          <div>
            <label className="form-label">Monthly Rent (GHS) *</label>
            <input type="number" className="form-input" {...register('monthly_rent', { required: true })} />
          </div>
          <div>
            <label className="form-label">Security Deposit (GHS)</label>
            <input type="number" className="form-input" {...register('deposit_amount')} />
          </div>
          <div>
            <label className="form-label">Rent Due Day (1-28)</label>
            <input type="number" min="1" max="28" className="form-input" defaultValue="1" {...register('rent_due_day')} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Notes</label>
            <textarea rows={2} className="form-input resize-none" {...register('notes')} />
          </div>
        </div>
      </Modal>

      {/* Agreement Modal */}
      <Modal isOpen={agreementModal} onClose={() => { setAgreementModal(false); setAgreement('') }} title="AI-Generated Tenancy Agreement" size="xl"
        footer={
          agreement ? (
            <button
              onClick={() => {
                const blob = new Blob([agreement], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'tenancy-agreement.txt'
                a.click()
              }}
              className="btn-primary"
            >
              Download Agreement
            </button>
          ) : null
        }
      >
        {agreementLoading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p>AI is generating your tenancy agreement...</p>
            </div>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300 font-mono leading-relaxed">{agreement}</pre>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Remove Tenant" message="Remove this tenant? Their payment history will also be deleted." loading={deleting} />
    </div>
  )
}
