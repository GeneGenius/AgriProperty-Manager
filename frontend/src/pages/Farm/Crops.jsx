import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Sprout, BarChart2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { cropsApi } from '../../services/api'
import { StatusBadge } from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import ConfirmDialog from '../../components/UI/ConfirmDialog'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { format, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'

export default function Crops() {
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reportCrop, setReportCrop] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  const { register, handleSubmit, reset } = useForm()

  const load = async () => {
    try {
      const data = await cropsApi.list()
      setCrops(data)
    } catch { toast.error('Failed to load crops') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); reset({ ...c }); setModalOpen(true) }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editing) { await cropsApi.update(editing.id, data); toast.success('Crop updated') }
      else { await cropsApi.create(data); toast.success('Crop added') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await cropsApi.delete(deleteId); toast.success('Crop deleted'); setDeleteId(null); load()
    } catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  const viewReport = async (crop) => {
    setReportCrop(crop); setReportLoading(true); setReportData(null)
    try {
      const data = await cropsApi.getProfitReport(crop.id); setReportData(data)
    } catch { toast.error('Failed to load report') }
    finally { setReportLoading(false) }
  }

  if (loading) return <PageLoader />

  const activeCrops = crops.filter(c => c.status === 'growing')

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Crops</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{activeCrops.length} crops growing in Eswatini</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Crop</button>
      </div>

      {crops.length === 0 ? (
        <div className="card p-12 text-center">
          <Sprout size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No crops tracked yet.</p>
          <button onClick={openCreate} className="btn-primary mt-4"><Plus size={16} /> Add Crop</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {crops.map((c) => {
            const daysToHarvest = differenceInDays(new Date(c.expected_harvest_date), new Date())
            const isUrgent = daysToHarvest <= 7 && daysToHarvest >= 0 && c.status === 'growing'
            return (
              <div key={c.id} className={`card p-5 ${isUrgent ? 'ring-2 ring-orange-400 dark:ring-orange-500' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.crop_type} · Field {c.field_plot}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                {isUrgent && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs font-medium px-3 py-1.5 rounded-lg mb-3">
                    🌾 Harvest in {daysToHarvest} day{daysToHarvest !== 1 ? 's' : ''}!
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500">Planted</p>
                    <p className="font-medium">{format(new Date(c.planting_date), 'd MMM yy')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500">Harvest</p>
                    <p className={`font-medium ${isUrgent ? 'text-orange-600' : ''}`}>{format(new Date(c.expected_harvest_date), 'd MMM yy')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500">Quantity</p>
                    <p className="font-medium">{c.quantity_planted} {c.unit}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-gray-500">Harvests</p>
                    <p className="font-medium">{c.harvests?.length || 0}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => viewReport(c)} className="flex-1 btn-secondary text-xs py-1.5"><BarChart2 size={12} /> Report</button>
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Crop' : 'Add Crop'} size="lg"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-success">{saving ? 'Saving...' : editing ? 'Update' : 'Add Crop'}</button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Crop Name *</label>
            <input className="form-input" placeholder="e.g. Tomatoes" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="form-label">Crop Type *</label>
            <input className="form-input" placeholder="e.g. Vegetable, Fruit" {...register('crop_type', { required: true })} />
          </div>
          <div>
            <label className="form-label">Variety</label>
            <input className="form-input" placeholder="e.g. Roma, Cherry" {...register('variety')} />
          </div>
          <div>
            <label className="form-label">Field / Plot *</label>
            <input className="form-input" placeholder="e.g. A1, Block 3" {...register('field_plot', { required: true })} />
          </div>
          <div>
            <label className="form-label">Planting Date *</label>
            <input type="date" className="form-input" {...register('planting_date', { required: true })} />
          </div>
          <div>
            <label className="form-label">Expected Harvest *</label>
            <input type="date" className="form-input" {...register('expected_harvest_date', { required: true })} />
          </div>
          <div>
            <label className="form-label">Quantity Planted *</label>
            <input type="number" step="0.01" className="form-input" {...register('quantity_planted', { required: true })} />
          </div>
          <div>
            <label className="form-label">Unit</label>
            <select className="form-select" {...register('unit')}>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="ton">ton</option>
              <option value="bags">bags</option>
              <option value="crates">crates</option>
              <option value="pieces">pieces</option>
            </select>
          </div>
          <div>
            <label className="form-label">Area (hectares)</label>
            <input type="number" step="0.001" className="form-input" {...register('area_hectares')} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" {...register('status')}>
              <option value="growing">Growing</option>
              <option value="harvested">Harvested</option>
              <option value="failed">Failed</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Notes</label>
            <textarea rows={2} className="form-input resize-none" {...register('notes')} />
          </div>
        </div>
      </Modal>

      {/* Profit Report Modal */}
      <Modal isOpen={!!reportCrop} onClose={() => { setReportCrop(null); setReportData(null) }} title={`Profit Report — ${reportCrop?.name}`} size="lg">
        {reportLoading ? (
          <div className="text-center py-8 text-gray-500">Calculating crop profitability...</div>
        ) : reportData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Yield', value: `${reportData.report.total_yield_kg} kg` },
                { label: 'Total Revenue', value: `R${Number(reportData.report.total_revenue).toLocaleString()}` },
                { label: 'Total Expenses', value: `L${Number(reportData.report.total_expenses).toLocaleString()}` },
                { label: 'Net Profit', value: `R${Number(reportData.report.net_profit).toLocaleString()}`, hl: reportData.report.net_profit > 0 ? 'green' : 'red' },
                { label: 'Profit Margin', value: `${reportData.report.profit_margin_pct}%` },
                { label: 'Cost per kg', value: `L${reportData.report.cost_per_kg}` },
              ].map(({ label, value, hl }) => (
                <div key={label} className="card p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-lg font-bold mt-0.5 ${hl === 'green' ? 'text-green-600' : hl === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{value}</p>
                </div>
              ))}
            </div>
            {Object.keys(reportData.report.expense_breakdown || {}).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Expense Breakdown</p>
                <div className="space-y-1">
                  {Object.entries(reportData.report.expense_breakdown).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="capitalize text-gray-600 dark:text-gray-400">{cat}</span>
                      <span className="font-medium">L{Number(amt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Crop" message="Delete this crop record? All harvest records will also be deleted." loading={deleting} />
    </div>
  )
}
