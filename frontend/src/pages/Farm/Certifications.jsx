import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Award, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { certificationsApi } from '../../services/api'
import { StatusBadge } from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import ConfirmDialog from '../../components/UI/ConfirmDialog'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { format, differenceInDays, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const SIZA_CHECKLIST = [
  'Environmental management plan in place',
  'Worker health and safety procedures documented',
  'Chemical storage and handling compliance',
  'Water source and irrigation records maintained',
  'Waste management policy documented',
  'Worker accommodation standards met',
  'First aid facilities available on farm',
  'Pesticide application records up to date',
  'Soil management practices documented',
  'Internal audit completed',
]

export default function Certifications() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [checklistModal, setChecklistModal] = useState(null)

  const { register, handleSubmit, reset } = useForm()

  const load = async () => {
    try { const data = await certificationsApi.list(); setCerts(data) }
    catch { toast.error('Failed to load certifications') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); reset(c); setModalOpen(true) }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editing) { await certificationsApi.update(editing.id, data); toast.success('Certification updated') }
      else { await certificationsApi.create(data); toast.success('Certification added') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await certificationsApi.delete(deleteId); toast.success('Deleted'); setDeleteId(null); load() }
    catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Certifications</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">SIZA, GlobalG.A.P & compliance tracking</p>
        </div>
        <button onClick={openCreate} className="btn-success"><Plus size={16} /> Add Certification</button>
      </div>

      {/* SIZA Compliance Card */}
      <div className="card p-5 border-l-4 border-green-500">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-green-500" /> SIZA Compliance Checklist
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sustainability Initiative of South Africa — required for SA market access</p>
          </div>
          <button onClick={() => setChecklistModal(SIZA_CHECKLIST)} className="btn-secondary text-xs py-1.5">View Checklist</button>
        </div>
      </div>

      {certs.length === 0 ? (
        <div className="card p-12 text-center">
          <Award size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No certifications tracked yet.</p>
          <button onClick={openCreate} className="btn-success mt-4"><Plus size={16} /> Add Certification</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {certs.map(cert => {
            const daysLeft = cert.expiry_date ? differenceInDays(parseISO(cert.expiry_date), new Date()) : null
            const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0
            const isExpired = daysLeft !== null && daysLeft < 0
            return (
              <div key={cert.id} className={`card p-5 ${isExpiringSoon ? 'ring-2 ring-yellow-400' : isExpired ? 'ring-2 ring-red-400' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{cert.name}</h3>
                    <p className="text-xs text-gray-500">{cert.type} · {cert.issuing_body}</p>
                  </div>
                  <StatusBadge status={cert.status} />
                </div>
                {(isExpiringSoon || isExpired) && (
                  <div className={`flex items-center gap-2 text-xs font-medium mb-3 p-2 rounded-lg ${isExpired ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'}`}>
                    <AlertCircle size={14} />
                    {isExpired ? 'EXPIRED' : `Expires in ${daysLeft} days`}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  {cert.issue_date && <div><p className="text-gray-500">Issued</p><p className="font-medium">{format(parseISO(cert.issue_date), 'd MMM yy')}</p></div>}
                  {cert.expiry_date && <div><p className="text-gray-500">Expires</p><p className={`font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : ''}`}>{format(parseISO(cert.expiry_date), 'd MMM yy')}</p></div>}
                  {cert.certificate_number && <div className="col-span-2"><p className="text-gray-500">Cert #</p><p className="font-medium font-mono">{cert.certificate_number}</p></div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(cert)} className="flex-1 btn-secondary text-xs py-1.5"><Edit2 size={12} /> Edit</button>
                  <button onClick={() => setDeleteId(cert.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Certification' : 'Add Certification'} size="md"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-success">{saving ? 'Saving...' : 'Save'}</button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="form-label">Certification Name *</label>
            <input className="form-input" placeholder="e.g. SIZA Certification 2025" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" {...register('type')}>
              <option value="SIZA">SIZA</option>
              <option value="GlobalGAP">GlobalG.A.P</option>
              <option value="organic">Organic</option>
              <option value="halal">Halal</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" {...register('status')}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div>
            <label className="form-label">Issuing Body</label>
            <input className="form-input" placeholder="e.g. SIZA, GLOBALG.A.P" {...register('issuing_body')} />
          </div>
          <div>
            <label className="form-label">Certificate Number</label>
            <input className="form-input" {...register('certificate_number')} />
          </div>
          <div>
            <label className="form-label">Issue Date</label>
            <input type="date" className="form-input" {...register('issue_date')} />
          </div>
          <div>
            <label className="form-label">Expiry Date</label>
            <input type="date" className="form-input" {...register('expiry_date')} />
          </div>
        </div>
      </Modal>

      {/* SIZA Checklist Modal */}
      <Modal isOpen={!!checklistModal} onClose={() => setChecklistModal(null)} title="SIZA Compliance Checklist" size="md">
        <div className="space-y-2">
          {(checklistModal || []).map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <input type="checkbox" className="w-4 h-4 rounded text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Complete all checklist items before your SIZA audit. Contact SIZA directly at siza.co.za for official requirements.
        </p>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Certification" message="Delete this certification record?" loading={deleting} />
    </div>
  )
}
