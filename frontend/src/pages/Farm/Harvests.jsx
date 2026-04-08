import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Leaf } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { harvestsApi, cropsApi } from '../../services/api'
import { QualityBadge } from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import ConfirmDialog from '../../components/UI/ConfirmDialog'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Harvests() {
  const [harvests, setHarvests] = useState([])
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
      const [h, c] = await Promise.all([harvestsApi.list(), cropsApi.list()])
      setHarvests(h); setCrops(c)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); reset({ harvest_date: format(new Date(), 'yyyy-MM-dd') }); setModalOpen(true) }
  const openEdit = (h) => { setEditing(h); reset(h); setModalOpen(true) }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editing) { await harvestsApi.update(editing.id, data); toast.success('Harvest updated') }
      else { await harvestsApi.create(data); toast.success('Harvest logged!') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await harvestsApi.delete(deleteId); toast.success('Record deleted'); setDeleteId(null); load()
    } catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  const totalYield = harvests.reduce((sum, h) => sum + Number(h.yield_kg), 0)
  const gradeA = harvests.filter(h => h.quality_grade === 'A').length

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Harvest Records</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{totalYield.toLocaleString()} kg total yield logged</p>
        </div>
        <button onClick={openCreate} className="btn-success"><Plus size={16} /> Log Harvest</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: harvests.length },
          { label: 'Total Yield (kg)', value: totalYield.toLocaleString() },
          { label: 'Grade A Harvests', value: gradeA, color: 'text-green-600' },
          { label: 'Avg Yield/Harvest', value: harvests.length > 0 ? (totalYield / harvests.length).toFixed(1) + ' kg' : '—' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${color || 'text-gray-900 dark:text-white'}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {harvests.length === 0 ? (
        <div className="card p-12 text-center">
          <Leaf size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No harvests logged yet.</p>
          <button onClick={openCreate} className="btn-success mt-4"><Plus size={16} /> Log Harvest</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {['Crop', 'Field', 'Harvest Date', 'Yield (kg)', 'Quality', 'Storage', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {harvests.map(h => (
                  <tr key={h.id} className="table-row-hover">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{h.crops?.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{h.crops?.field_plot}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{format(new Date(h.harvest_date), 'd MMM yyyy')}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">{Number(h.yield_kg).toLocaleString()}</td>
                    <td className="px-4 py-3">{h.quality_grade ? <QualityBadge grade={h.quality_grade} /> : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{h.storage_location || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(h)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-lg"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(h.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Harvest' : 'Log Harvest'} size="md"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-success">{saving ? 'Saving...' : 'Log Harvest'}</button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Crop *</label>
            <select className="form-select" {...register('crop_id', { required: true })}>
              <option value="">Select crop</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.name} — Field {c.field_plot}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Harvest Date *</label>
            <input type="date" className="form-input" {...register('harvest_date', { required: true })} />
          </div>
          <div>
            <label className="form-label">Yield (kg) *</label>
            <input type="number" step="0.1" className="form-input" placeholder="0.0" {...register('yield_kg', { required: true })} />
          </div>
          <div>
            <label className="form-label">Quality Grade</label>
            <select className="form-select" {...register('quality_grade')}>
              <option value="">Not graded</option>
              <option value="A">Grade A — Export Quality</option>
              <option value="B">Grade B — Market Quality</option>
              <option value="C">Grade C — Processing</option>
              <option value="reject">Reject</option>
            </select>
          </div>
          <div>
            <label className="form-label">Storage Location</label>
            <input className="form-input" placeholder="e.g. Cold Room 1, Pack House" {...register('storage_location')} />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea rows={2} className="form-input resize-none" {...register('notes')} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Harvest" message="Delete this harvest record?" loading={deleting} />
    </div>
  )
}
