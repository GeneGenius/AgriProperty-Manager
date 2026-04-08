import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Mail, Phone, MapPin, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { buyersApi } from '../../services/api'
import Modal from '../../components/UI/Modal'
import ConfirmDialog from '../../components/UI/ConfirmDialog'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

export default function Buyers() {
  const [buyers, setBuyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailBuyerId, setEmailBuyerId] = useState(null)
  const [emailContext, setEmailContext] = useState('')

  const { register, handleSubmit, reset } = useForm()

  const load = async () => {
    try { const data = await buyersApi.list(); setBuyers(data) }
    catch { toast.error('Failed to load buyers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); reset({ country: 'South Africa' }); setModalOpen(true) }
  const openEdit = (b) => { setEditing(b); reset(b); setModalOpen(true) }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editing) { await buyersApi.update(editing.id, data); toast.success('Buyer updated') }
      else { await buyersApi.create(data); toast.success('Buyer added') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await buyersApi.delete(deleteId); toast.success('Buyer deleted'); setDeleteId(null); load() }
    catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  const generateEmail = async (buyerId) => {
    setEmailBuyerId(buyerId); setEmailLoading(true); setEmailModal(true); setGeneratedEmail('')
    try {
      const data = await buyersApi.generateEmail(buyerId, emailContext)
      setGeneratedEmail(data.email)
    } catch { toast.error('Failed to generate email') }
    finally { setEmailLoading(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Buyers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{buyers.length} buyers — SA & Eswatini markets</p>
        </div>
        <button onClick={openCreate} className="btn-success"><Plus size={16} /> Add Buyer</button>
      </div>

      {buyers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No buyers yet. Add your first buyer!</p>
          <button onClick={openCreate} className="btn-success mt-4"><Plus size={16} /> Add Buyer</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buyers.map(b => (
            <div key={b.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{b.company_name || b.contact_name}</h3>
                  <p className="text-xs text-gray-500">{b.contact_name}{b.company_name ? ` · ${b.company_name}` : ''}</p>
                </div>
                <span className="badge-blue text-xs">{b.country}</span>
              </div>
              <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2"><Phone size={11} /> {b.phone}</div>
                {b.email && <div className="flex items-center gap-2"><Mail size={11} /> {b.email}</div>}
                {b.city && <div className="flex items-center gap-2"><MapPin size={11} /> {b.city}, {b.country}</div>}
              </div>
              {b.orders && b.orders.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-xs text-green-700 dark:text-green-400 mb-3">
                  {b.orders.length} orders · R{b.orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0).toLocaleString()} total
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEmailBuyerId(b.id); setEmailModal(true) }}
                  className="flex-1 btn-secondary text-xs py-1.5"
                >
                  <Mail size={12} /> Draft Email
                </button>
                <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"><Edit2 size={14} /></button>
                <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Buyer' : 'Add Buyer'} size="lg"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-success">{saving ? 'Saving...' : editing ? 'Update' : 'Add Buyer'}</button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Contact Name *</label>
            <input className="form-input" {...register('contact_name', { required: true })} />
          </div>
          <div>
            <label className="form-label">Company Name</label>
            <input className="form-input" {...register('company_name')} />
          </div>
          <div>
            <label className="form-label">Phone *</label>
            <input className="form-input" placeholder="+27 XX XXX XXXX" {...register('phone', { required: true })} />
          </div>
          <div>
            <label className="form-label">WhatsApp</label>
            <input className="form-input" placeholder="+27 XX XXX XXXX" {...register('whatsapp')} />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" {...register('email')} />
          </div>
          <div>
            <label className="form-label">City</label>
            <input className="form-input" placeholder="Johannesburg, Manzini..." {...register('city')} />
          </div>
          <div>
            <label className="form-label">Country</label>
            <select className="form-select" {...register('country')}>
              <option value="South Africa">South Africa</option>
              <option value="Eswatini">Eswatini</option>
              <option value="Mozambique">Mozambique</option>
              <option value="Zimbabwe">Zimbabwe</option>
              <option value="Botswana">Botswana</option>
              <option value="Namibia">Namibia</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Payment Terms</label>
            <select className="form-select" {...register('payment_terms')}>
              <option value="immediate">Immediate</option>
              <option value="net14">Net 14 days</option>
              <option value="net30">Net 30 days</option>
              <option value="net60">Net 60 days</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Address</label>
            <textarea rows={2} className="form-input resize-none" {...register('address')} />
          </div>
        </div>
      </Modal>

      {/* Email Generator Modal */}
      <Modal isOpen={emailModal} onClose={() => { setEmailModal(false); setGeneratedEmail(''); setEmailContext('') }} title="AI Buyer Email Generator" size="xl"
        footer={generatedEmail ? (
          <button onClick={() => { navigator.clipboard.writeText(generatedEmail); toast.success('Copied!') }} className="btn-primary">
            Copy Email
          </button>
        ) : null}
      >
        {!generatedEmail && !emailLoading && (
          <div className="space-y-4">
            <div>
              <label className="form-label">Additional context (optional)</label>
              <textarea
                rows={3}
                className="form-input resize-none"
                placeholder="E.g. We have 500kg of tomatoes available this week, looking for new contracts..."
                value={emailContext}
                onChange={e => setEmailContext(e.target.value)}
              />
            </div>
            <button onClick={() => generateEmail(emailBuyerId)} className="btn-success w-full">
              Generate Email with AI
            </button>
          </div>
        )}
        {emailLoading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p>AI is drafting your email...</p>
            </div>
          </div>
        )}
        {generatedEmail && (
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{generatedEmail}</pre>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Buyer" message="Delete this buyer?" loading={deleting} />
    </div>
  )
}
