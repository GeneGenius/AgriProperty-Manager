import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FileText, Package, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { ordersApi, buyersApi, cropsApi } from '../../services/api'
import { StatusBadge } from '../../components/UI/Badge'
import Modal from '../../components/UI/Modal'
import ConfirmDialog from '../../components/UI/ConfirmDialog'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [buyers, setBuyers] = useState([])
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [invoiceModal, setInvoiceModal] = useState(null)
  const [items, setItems] = useState([{ crop_id: '', crop_name: '', quantity_kg: '', price_per_kg: '', total_price: 0 }])

  const { register, handleSubmit, reset, watch } = useForm()
  const currency = watch('currency', 'ZAR')

  const load = async () => {
    try {
      const [o, b, c] = await Promise.all([ordersApi.list(), buyersApi.list(), cropsApi.list()])
      setOrders(o); setBuyers(b); setCrops(c)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    reset({ currency: 'ZAR', order_date: format(new Date(), 'yyyy-MM-dd') })
    setItems([{ crop_id: '', crop_name: '', quantity_kg: '', price_per_kg: '', total_price: 0 }])
    setModalOpen(true)
  }
  const openEdit = (o) => {
    setEditing(o)
    reset({ ...o })
    setItems(Array.isArray(o.items) ? o.items : [])
    setModalOpen(true)
  }

  const updateItem = (idx, field, value) => {
    const updated = [...items]
    updated[idx][field] = value
    if (field === 'quantity_kg' || field === 'price_per_kg') {
      updated[idx].total_price = Number(updated[idx].quantity_kg || 0) * Number(updated[idx].price_per_kg || 0)
    }
    if (field === 'crop_id') {
      const crop = crops.find(c => c.id === value)
      if (crop) updated[idx].crop_name = crop.name
    }
    setItems(updated)
  }

  const addItem = () => setItems([...items, { crop_id: '', crop_name: '', quantity_kg: '', price_per_kg: '', total_price: 0 }])
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

  const totalAmount = items.reduce((sum, i) => sum + Number(i.total_price || 0), 0)

  const onSubmit = async (data) => {
    if (!items.some(i => i.quantity_kg > 0)) return toast.error('Add at least one item')
    setSaving(true)
    try {
      const orderData = { ...data, items, total_amount: totalAmount }
      if (editing) { await ordersApi.update(editing.id, orderData); toast.success('Order updated') }
      else { await ordersApi.create(orderData); toast.success('Order created!') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await ordersApi.delete(deleteId); toast.success('Order deleted'); setDeleteId(null); load() }
    catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  const viewInvoice = async (orderId) => {
    try {
      const data = await ordersApi.getInvoice(orderId)
      setInvoiceModal(data)
    } catch { toast.error('Failed to load invoice') }
  }

  const downloadInvoice = (invoiceData) => {
    if (!invoiceData) return
    const { order, seller } = invoiceData
    const items = Array.isArray(order.items) ? order.items : []
    const content = `
INVOICE
=======
Invoice No: ${order.invoice_number}
Date: ${format(new Date(order.order_date), 'd MMMM yyyy')}
${order.delivery_date ? `Delivery Date: ${format(new Date(order.delivery_date), 'd MMMM yyyy')}` : ''}

FROM:
${seller?.business_name_eswatini || 'AgrIProperty Farm'}
${seller?.full_name || ''}

TO:
${order.buyers?.company_name || order.buyers?.contact_name}
${order.buyers?.address || ''}
${order.buyers?.city || ''}, ${order.buyers?.country || ''}

ITEMS:
${items.map(i => `  ${i.crop_name}: ${i.quantity_kg}kg @ ${order.currency} ${i.price_per_kg}/kg = ${order.currency} ${Number(i.total_price).toLocaleString()}`).join('\n')}

SUBTOTAL: ${order.currency} ${Number(order.subtotal || 0).toLocaleString()}
TAX: ${order.currency} ${Number(order.tax_amount || 0).toLocaleString()}
TOTAL: ${order.currency} ${Number(order.total_amount).toLocaleString()}

Payment Status: ${order.payment_status?.toUpperCase()}
Payment Terms: ${order.buyers?.payment_terms || 'Net 30'}

Thank you for your business!
    `.trim()
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${order.invoice_number}.txt`
    a.click()
  }

  if (loading) return <PageLoader />

  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total_amount), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Orders & Invoices</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">R{totalRevenue.toLocaleString()} ZAR collected</p>
        </div>
        <button onClick={openCreate} className="btn-success"><Plus size={16} /> Create Order</button>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No orders yet.</p>
          <button onClick={openCreate} className="btn-success mt-4"><Plus size={16} /> Create Order</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  {['Invoice', 'Buyer', 'Order Date', 'Delivery', 'Total', 'Payment', 'Delivery Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {orders.map(o => (
                  <tr key={o.id} className="table-row-hover">
                    <td className="px-4 py-3 text-xs font-mono text-blue-600 dark:text-blue-400">{o.invoice_number}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{o.buyers?.contact_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{format(new Date(o.order_date), 'd MMM yy')}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{o.delivery_date ? format(new Date(o.delivery_date), 'd MMM yy') : '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{o.currency} {Number(o.total_amount).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.payment_status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={o.delivery_status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => viewInvoice(o.id)} title="View Invoice" className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-lg"><FileText size={14} /></button>
                        <button onClick={() => openEdit(o)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-lg"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(o.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Order' : 'Create Order'} size="xl"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-success">{saving ? 'Saving...' : editing ? 'Update' : 'Create Order'}</button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="form-label">Buyer *</label>
            <select className="form-select" {...register('buyer_id', { required: true })}>
              <option value="">Select buyer</option>
              {buyers.map(b => <option key={b.id} value={b.id}>{b.company_name || b.contact_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Currency</label>
            <select className="form-select" {...register('currency')}>
              <option value="ZAR">ZAR — South African Rand</option>
              <option value="SZL">SZL — Swazi Lilangeni</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="form-label">Order Date</label>
            <input type="date" className="form-input" {...register('order_date')} />
          </div>
          <div>
            <label className="form-label">Delivery Date</label>
            <input type="date" className="form-input" {...register('delivery_date')} />
          </div>
          <div>
            <label className="form-label">Payment Status</label>
            <select className="form-select" {...register('payment_status')}>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="form-label">Delivery Status</label>
            <select className="form-select" {...register('delivery_status')}>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Order Items</p>
            <button type="button" onClick={addItem} className="btn-secondary text-xs py-1">+ Add Item</button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <label className="form-label">Crop</label>
                  <select className="form-select text-xs" value={item.crop_id} onChange={e => updateItem(idx, 'crop_id', e.target.value)}>
                    <option value="">Select crop</option>
                    {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="form-label">Qty (kg)</label>
                  <input type="number" step="0.1" className="form-input text-xs" value={item.quantity_kg} onChange={e => updateItem(idx, 'quantity_kg', e.target.value)} />
                </div>
                <div className="col-span-3">
                  <label className="form-label">Price/kg</label>
                  <input type="number" step="0.01" className="form-input text-xs" value={item.price_per_kg} onChange={e => updateItem(idx, 'price_per_kg', e.target.value)} />
                </div>
                <div className="col-span-1 text-center">
                  <label className="form-label opacity-0">X</label>
                  <button type="button" onClick={() => removeItem(idx)} className="w-full text-red-500 hover:text-red-700 text-sm font-bold py-2">×</button>
                </div>
                {item.total_price > 0 && (
                  <div className="col-span-12 text-right text-xs text-gray-500">
                    = {currency} {Number(item.total_price).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</span>
            <span className="text-xl font-bold text-green-600 dark:text-green-400">{currency} {totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="form-label">Notes</label>
          <textarea rows={2} className="form-input resize-none" {...register('notes')} />
        </div>
      </Modal>

      {/* Invoice Modal */}
      <Modal isOpen={!!invoiceModal} onClose={() => setInvoiceModal(null)} title={`Invoice — ${invoiceModal?.order?.invoice_number}`} size="lg"
        footer={<button onClick={() => downloadInvoice(invoiceModal)} className="btn-primary"><Download size={14} /> Download</button>}
      >
        {invoiceModal && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">FROM</p>
                <p className="font-semibold">{invoiceModal.seller?.business_name_eswatini || 'AgrIProperty Farm'}</p>
                <p className="text-gray-600 dark:text-gray-400">{invoiceModal.seller?.full_name}</p>
                <p className="text-gray-600 dark:text-gray-400">Eswatini</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">TO</p>
                <p className="font-semibold">{invoiceModal.order.buyers?.company_name || invoiceModal.order.buyers?.contact_name}</p>
                <p className="text-gray-600 dark:text-gray-400">{invoiceModal.order.buyers?.city}, {invoiceModal.order.buyers?.country}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-1 text-gray-500">Item</th>
                    <th className="text-right py-1 text-gray-500">Qty</th>
                    <th className="text-right py-1 text-gray-500">Price</th>
                    <th className="text-right py-1 text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(invoiceModal.order.items) ? invoiceModal.order.items : []).map((item, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="py-2">{item.crop_name}</td>
                      <td className="py-2 text-right">{item.quantity_kg}kg</td>
                      <td className="py-2 text-right">{invoiceModal.order.currency} {item.price_per_kg}</td>
                      <td className="py-2 text-right font-medium">{invoiceModal.order.currency} {Number(item.total_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex justify-end">
                <div className="text-right">
                  <p className="text-gray-500">Subtotal: {invoiceModal.order.currency} {Number(invoiceModal.order.subtotal).toLocaleString()}</p>
                  {Number(invoiceModal.order.tax_amount) > 0 && <p className="text-gray-500">Tax: {invoiceModal.order.currency} {Number(invoiceModal.order.tax_amount).toLocaleString()}</p>}
                  <p className="text-lg font-bold text-green-600 mt-1">Total: {invoiceModal.order.currency} {Number(invoiceModal.order.total_amount).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <p>Payment: <span className="font-medium capitalize">{invoiceModal.order.payment_status}</span></p>
              <p>Delivery: <span className="font-medium capitalize">{invoiceModal.order.delivery_status}</span></p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Order" message="Delete this order?" loading={deleting} />
    </div>
  )
}
