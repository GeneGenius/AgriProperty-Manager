import { useState, useEffect } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { marketPricesApi } from '../../services/api'
import Modal from '../../components/UI/Modal'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

export default function MarketPrices() {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const load = async () => {
    try { const data = await marketPricesApi.getSummary(); setPrices(data) }
    catch { toast.error('Failed to load prices') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await marketPricesApi.create(data)
      toast.success('Price added'); setModalOpen(false); reset({}); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Market Prices</h2>
          <p className="text-sm text-gray-500">SA & Eswatini fresh produce market tracker</p>
        </div>
        <button onClick={() => { reset({ currency: 'ZAR' }); setModalOpen(true) }} className="btn-success">
          <Plus size={16} /> Add Price
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {prices.map((mp, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{mp.crop_name}</h3>
              <TrendingUp size={16} className="text-green-500" />
            </div>
            <div className="mt-3 space-y-1">
              {mp.avg_price_zar && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">SA Market</span>
                  <span className="font-bold text-green-600">R{mp.avg_price_zar}/kg</span>
                </div>
              )}
              {mp.avg_price_szl && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Eswatini</span>
                  <span className="font-bold text-blue-600">L{mp.avg_price_szl}/kg</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">{mp.markets?.length} market{mp.markets?.length !== 1 ? 's' : ''} tracked</p>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Market Price" size="sm"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-success">{saving ? 'Saving...' : 'Add'}</button>
        </>}
      >
        <div className="space-y-4">
          <div><label className="form-label">Crop Name *</label><input className="form-input" {...register('crop_name', { required: true })} /></div>
          <div>
            <label className="form-label">Market *</label>
            <select className="form-select" {...register('market', { required: true })}>
              <option value="">Select market</option>
              <option value="Johannesburg Fresh Produce Market">Johannesburg Fresh Produce Market</option>
              <option value="Cape Town Market">Cape Town Market</option>
              <option value="Durban Market">Durban Market</option>
              <option value="Manzini Fresh Produce Market">Manzini Fresh Produce Market</option>
              <option value="Mbabane Market">Mbabane Market</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div><label className="form-label">Price per kg *</label><input type="number" step="0.01" className="form-input" {...register('price_per_kg', { required: true })} /></div>
          <div>
            <label className="form-label">Currency</label>
            <select className="form-select" {...register('currency')}>
              <option value="ZAR">ZAR — South African Rand</option>
              <option value="SZL">SZL — Swazi Lilangeni</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
