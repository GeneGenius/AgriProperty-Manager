import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Axios instance — auto-attaches Supabase auth token
const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.error || error.message || 'An error occurred'
    return Promise.reject(new Error(msg))
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  getProfile: () => api.get('/auth/profile').then(r => r.data),
  updateProfile: (data) => api.put('/auth/profile', data).then(r => r.data),
}

// ── Properties ────────────────────────────────────────────────
export const propertiesApi = {
  list: () => api.get('/properties').then(r => r.data),
  get: (id) => api.get(`/properties/${id}`).then(r => r.data),
  create: (data) => api.post('/properties', data).then(r => r.data),
  update: (id, data) => api.put(`/properties/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/properties/${id}`).then(r => r.data),
  getReport: (id) => api.get(`/properties/${id}/report`).then(r => r.data),
}

// ── Tenants ───────────────────────────────────────────────────
export const tenantsApi = {
  list: () => api.get('/tenants').then(r => r.data),
  get: (id) => api.get(`/tenants/${id}`).then(r => r.data),
  create: (data) => api.post('/tenants', data).then(r => r.data),
  update: (id, data) => api.put(`/tenants/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/tenants/${id}`).then(r => r.data),
  generateAgreement: (id) => api.post(`/tenants/${id}/generate-agreement`).then(r => r.data),
}

// ── Rent Payments ─────────────────────────────────────────────
export const rentPaymentsApi = {
  list: (params) => api.get('/rent-payments', { params }).then(r => r.data),
  create: (data) => api.post('/rent-payments', data).then(r => r.data),
  update: (id, data) => api.put(`/rent-payments/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/rent-payments/${id}`).then(r => r.data),
  markPaid: (id, data) => api.post(`/rent-payments/mark-paid/${id}`, data).then(r => r.data),
  sendReminder: (id) => api.post(`/rent-payments/send-reminder/${id}`).then(r => r.data),
}

// ── Maintenance ───────────────────────────────────────────────
export const maintenanceApi = {
  list: (params) => api.get('/maintenance', { params }).then(r => r.data),
  get: (id) => api.get(`/maintenance/${id}`).then(r => r.data),
  create: (data) => api.post('/maintenance', data).then(r => r.data),
  update: (id, data) => api.put(`/maintenance/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/maintenance/${id}`).then(r => r.data),
}

// ── Real Estate Expenses ──────────────────────────────────────
export const reExpensesApi = {
  list: () => api.get('/real-estate-expenses').then(r => r.data),
  create: (data) => api.post('/real-estate-expenses', data).then(r => r.data),
  update: (id, data) => api.put(`/real-estate-expenses/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/real-estate-expenses/${id}`).then(r => r.data),
}

// ── Crops ─────────────────────────────────────────────────────
export const cropsApi = {
  list: (params) => api.get('/crops', { params }).then(r => r.data),
  get: (id) => api.get(`/crops/${id}`).then(r => r.data),
  create: (data) => api.post('/crops', data).then(r => r.data),
  update: (id, data) => api.put(`/crops/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/crops/${id}`).then(r => r.data),
  getProfitReport: (id) => api.get(`/crops/${id}/profit-report`).then(r => r.data),
}

// ── Harvests ──────────────────────────────────────────────────
export const harvestsApi = {
  list: () => api.get('/harvests').then(r => r.data),
  create: (data) => api.post('/harvests', data).then(r => r.data),
  update: (id, data) => api.put(`/harvests/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/harvests/${id}`).then(r => r.data),
}

// ── Buyers ────────────────────────────────────────────────────
export const buyersApi = {
  list: () => api.get('/buyers').then(r => r.data),
  get: (id) => api.get(`/buyers/${id}`).then(r => r.data),
  create: (data) => api.post('/buyers', data).then(r => r.data),
  update: (id, data) => api.put(`/buyers/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/buyers/${id}`).then(r => r.data),
  generateEmail: (id, context) => api.post(`/buyers/${id}/generate-email`, { context }).then(r => r.data),
}

// ── Orders ────────────────────────────────────────────────────
export const ordersApi = {
  list: (params) => api.get('/orders', { params }).then(r => r.data),
  get: (id) => api.get(`/orders/${id}`).then(r => r.data),
  create: (data) => api.post('/orders', data).then(r => r.data),
  update: (id, data) => api.put(`/orders/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/orders/${id}`).then(r => r.data),
  getInvoice: (id) => api.get(`/orders/${id}/invoice`).then(r => r.data),
}

// ── Farm Expenses ─────────────────────────────────────────────
export const farmExpensesApi = {
  list: (params) => api.get('/farm-expenses', { params }).then(r => r.data),
  create: (data) => api.post('/farm-expenses', data).then(r => r.data),
  update: (id, data) => api.put(`/farm-expenses/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/farm-expenses/${id}`).then(r => r.data),
}

// ── Finance ───────────────────────────────────────────────────
export const financeApi = {
  getDashboard: () => api.get('/finance/dashboard').then(r => r.data),
  getSummary: () => api.get('/finance/summary').then(r => r.data),
  getRates: () => api.get('/finance/rates').then(r => r.data),
}

// ── AI ────────────────────────────────────────────────────────
export const aiApi = {
  getConversations: () => api.get('/ai/conversations').then(r => r.data),
  getConversation: (id) => api.get(`/ai/conversations/${id}`).then(r => r.data),
  chat: (data) => api.post('/ai/chat', data).then(r => r.data),
  deleteConversation: (id) => api.delete(`/ai/conversations/${id}`).then(r => r.data),
  generateReport: () => api.post('/ai/generate-report').then(r => r.data),
}

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then(r => r.data),
  markRead: (id) => api.post(`/notifications/mark-read/${id}`).then(r => r.data),
  markAllRead: () => api.post('/notifications/mark-all-read').then(r => r.data),
  delete: (id) => api.delete(`/notifications/${id}`).then(r => r.data),
}

// ── Settings ──────────────────────────────────────────────────
export const settingsApi = {
  get: () => api.get('/settings').then(r => r.data),
  update: (data) => api.put('/settings', data).then(r => r.data),
}

// ── Market Prices ─────────────────────────────────────────────
export const marketPricesApi = {
  list: (params) => api.get('/market-prices', { params }).then(r => r.data),
  getSummary: () => api.get('/market-prices/summary').then(r => r.data),
  create: (data) => api.post('/market-prices', data).then(r => r.data),
}

// ── Certifications ────────────────────────────────────────────
export const certificationsApi = {
  list: () => api.get('/certifications').then(r => r.data),
  create: (data) => api.post('/certifications', data).then(r => r.data),
  update: (id, data) => api.put(`/certifications/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/certifications/${id}`).then(r => r.data),
}

// ── Weather ───────────────────────────────────────────────────
export const weatherApi = {
  get: (city, country) => api.get('/weather', { params: { city, country } }).then(r => r.data),
  getForecast: (city, country) => api.get('/weather/forecast', { params: { city, country } }).then(r => r.data),
}

export default api
