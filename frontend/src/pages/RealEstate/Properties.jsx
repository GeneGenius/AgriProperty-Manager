import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, MapPin, Home, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { propertiesApi } from '../../services/api'
import { StatusBadge } from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import ConfirmDialog from '../../components/UI/ConfirmDialog'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const PROPERTY_TYPES = ['apartment', 'house', 'commercial', 'land', 'office', 'shop', 'warehouse']
const PROPERTY_STATUSES = ['vacant', 'occupied', 'under_maintenance', 'for_sale']

export default function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reportProp, setReportProp] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = async () => {
    try {
      const data = await propertiesApi.list()
      setProperties(data)
    } catch (err) {
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingProperty(null)
    reset({})
    setModalOpen(true)
  }

  const openEdit = (prop) => {
    setEditingProperty(prop)
    reset(prop)
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editingProperty) {
        await propertiesApi.update(editingProperty.id, data)
        toast.success('Property updated')
      } else {
        await propertiesApi.create(data)
        toast.success('Property added')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await propertiesApi.delete(deleteId)
      toast.success('Property deleted')
      setDeleteId(null)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const viewReport = async (prop) => {
    setReportProp(prop)
    setReportLoading(true)
    try {
      const data = await propertiesApi.getReport(prop.id)
      setReportData(data)
    } catch {
      toast.error('Failed to load report')
    } finally {
      setReportLoading(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Properties</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{properties.length} total properties in Ghana</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Property
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: properties.length, color: 'text-gray-900 dark:text-white' },
          { label: 'Occupied', value: properties.filter(p => p.status === 'occupied').length, color: 'text-green-600 dark:text-green-400' },
          { label: 'Vacant', value: properties.filter(p => p.status === 'vacant').length, color: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Maintenance', value: properties.filter(p => p.status === 'under_maintenance').length, color: 'text-red-600 dark:text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="card p-12 text-center">
          <Home size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No properties yet. Add your first property!</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            <Plus size={16} /> Add Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((prop) => (
            <div key={prop.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{prop.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {prop.location}{prop.city ? `, ${prop.city}` : ''}
                  </p>
                </div>
                <StatusBadge status={prop.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <p className="text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-medium capitalize">{prop.type}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <p className="text-gray-500 dark:text-gray-400">Value</p>
                  <p className="font-medium">₵{Number(prop.value || 0).toLocaleString()}</p>
                </div>
                {prop.bedrooms && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 dark:text-gray-400">Bedrooms</p>
                    <p className="font-medium">{prop.bedrooms}</p>
                  </div>
                )}
                {prop.size_sqm && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500 dark:text-gray-400">Size</p>
                    <p className="font-medium">{prop.size_sqm} m²</p>
                  </div>
                )}
              </div>

              {/* Active tenants */}
              {prop.tenants && prop.tenants.length > 0 && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                    {prop.tenants.filter(t => t.status === 'active').length} active tenant(s) · ₵{prop.tenants.filter(t => t.status === 'active').reduce((sum, t) => sum + Number(t.monthly_rent), 0).toLocaleString()}/mo
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button onClick={() => viewReport(prop)} className="flex-1 btn-secondary text-xs py-1.5">
                  <Eye size={13} /> Report
                </button>
                <button onClick={() => openEdit(prop)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => setDeleteId(prop.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProperty ? 'Edit Property' : 'Add New Property'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editingProperty ? 'Update' : 'Add Property'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Property Name *</label>
            <input className="form-input" placeholder="e.g. Apartment 4B, Ring Road" {...register('name', { required: true })} />
            {errors.name && <p className="text-red-500 text-xs mt-1">Required</p>}
          </div>
          <div>
            <label className="form-label">Location / Area *</label>
            <input className="form-input" placeholder="e.g. East Legon, Accra" {...register('location', { required: true })} />
            {errors.location && <p className="text-red-500 text-xs mt-1">Required</p>}
          </div>
          <div>
            <label className="form-label">City</label>
            <input className="form-input" placeholder="Accra" {...register('city')} />
          </div>
          <div>
            <label className="form-label">Region</label>
            <input className="form-input" placeholder="Greater Accra" {...register('region')} />
          </div>
          <div>
            <label className="form-label">Type *</label>
            <select className="form-select" {...register('type', { required: true })}>
              <option value="">Select type</option>
              {PROPERTY_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            {errors.type && <p className="text-red-500 text-xs mt-1">Required</p>}
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" {...register('status')}>
              {PROPERTY_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Property Value (GHS)</label>
            <input type="number" className="form-input" placeholder="0" {...register('value')} />
          </div>
          <div>
            <label className="form-label">Size (sqm)</label>
            <input type="number" step="0.01" className="form-input" placeholder="0" {...register('size_sqm')} />
          </div>
          <div>
            <label className="form-label">Bedrooms</label>
            <input type="number" className="form-input" placeholder="0" {...register('bedrooms')} />
          </div>
          <div>
            <label className="form-label">Bathrooms</label>
            <input type="number" className="form-input" placeholder="0" {...register('bathrooms')} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea rows={3} className="form-input resize-none" placeholder="Property description..." {...register('description')} />
          </div>
        </div>
      </Modal>

      {/* Property Report Modal */}
      <Modal isOpen={!!reportProp} onClose={() => { setReportProp(null); setReportData(null) }} title={`Performance Report — ${reportProp?.name}`} size="lg">
        {reportLoading ? (
          <div className="text-center py-8"><p className="text-gray-500">Loading report...</p></div>
        ) : reportData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Occupancy Rate', value: `${reportData.report.occupancy_rate}%` },
                { label: 'Total Rent Income', value: `₵${Number(reportData.report.total_rent_income).toLocaleString()}` },
                { label: 'Total Expenses', value: `₵${Number(reportData.report.total_expenses).toLocaleString()}` },
                { label: 'Net Profit', value: `₵${Number(reportData.report.net_profit).toLocaleString()}`, highlight: reportData.report.net_profit > 0 ? 'green' : 'red' },
                { label: 'Pending Payments', value: reportData.report.pending_payments },
                { label: 'Overdue Payments', value: reportData.report.overdue_payments, highlight: reportData.report.overdue_payments > 0 ? 'red' : null },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="card p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className={`text-lg font-bold mt-0.5 ${highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Property"
        message="Are you sure you want to delete this property? This action cannot be undone and will remove all associated tenant and payment records."
        loading={deleting}
      />
    </div>
  )
}
