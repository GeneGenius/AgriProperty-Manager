import { useState, useEffect } from 'react'
import { Save, User, Building2, Bell, Key, Sun, Moon, Globe } from 'lucide-react'
import { settingsApi } from '../../services/api'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { PageLoader } from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
        <Icon size={18} className="text-blue-500" /> {title}
      </h3>
      {children}
    </div>
  )
}

export default function Settings() {
  const { profile, updateProfile } = useAuthStore()
  const { darkMode, toggleDarkMode } = useAppStore()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    whatsapp_number: '',
    business_name_ghana: '',
    business_name_eswatini: '',
    currency_preference: 'GHS',
  })

  const [settingsForm, setSettingsForm] = useState({
    whatsapp_enabled: false,
    daily_summary_enabled: false,
    openweather_api_key: '',
    twilio_whatsapp_number: '',
  })

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        whatsapp_number: profile.whatsapp_number || '',
        business_name_ghana: profile.business_name_ghana || '',
        business_name_eswatini: profile.business_name_eswatini || '',
        currency_preference: profile.currency_preference || 'GHS',
      })
    }
    loadSettings()
  }, [profile])

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get()
      setSettings(data)
      setSettingsForm({
        whatsapp_enabled: data.whatsapp_enabled || false,
        daily_summary_enabled: data.daily_summary_enabled || false,
        openweather_api_key: data.openweather_api_key || '',
        twilio_whatsapp_number: data.twilio_whatsapp_number || '',
      })
    } catch {}
    finally { setLoading(false) }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await updateProfile(profileForm)
      toast.success('Profile updated!')
    } catch (err) { toast.error(err.message) }
    finally { setSavingProfile(false) }
  }

  const saveSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await settingsApi.update(settingsForm)
      toast.success('Settings saved!')
    } catch (err) { toast.error(err.message) }
    finally { setSavingSettings(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Profile */}
      <Section title="User Profile" icon={User}>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={profileForm.full_name}
                onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">WhatsApp Number</label>
              <input
                className="form-input"
                placeholder="+263 XX XXX XXXX"
                value={profileForm.whatsapp_number}
                onChange={e => setProfileForm(p => ({ ...p, whatsapp_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Default Currency</label>
              <select
                className="form-select"
                value={profileForm.currency_preference}
                onChange={e => setProfileForm(p => ({ ...p, currency_preference: e.target.value }))}
              >
                <option value="GHS">GHS — Ghana Cedi</option>
                <option value="ZAR">ZAR — South African Rand</option>
                <option value="SZL">SZL — Swazi Lilangeni</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </div>
            <div>
              <label className="form-label">Email</label>
              <input className="form-input bg-gray-50 dark:bg-gray-800" value={profile?.email || ''} disabled />
            </div>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            <Save size={14} /> {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </Section>

      {/* Business Profiles */}
      <Section title="Business Profiles" icon={Building2}>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="form-label">🏠 Ghana Real Estate Business Name</label>
            <input
              className="form-input"
              placeholder="e.g. Accra Properties Ltd"
              value={profileForm.business_name_ghana}
              onChange={e => setProfileForm(p => ({ ...p, business_name_ghana: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">🌾 Eswatini Farm Business Name</label>
            <input
              className="form-input"
              placeholder="e.g. Eswatini Fresh Farms"
              value={profileForm.business_name_eswatini}
              onChange={e => setProfileForm(p => ({ ...p, business_name_eswatini: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            <Save size={14} /> {savingProfile ? 'Saving...' : 'Save Business Names'}
          </button>
        </form>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" icon={Sun}>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Toggle between light and dark theme</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'} flex items-center justify-center`}>
              {darkMode ? <Moon size={10} className="text-blue-600" /> : <Sun size={10} className="text-yellow-500" />}
            </span>
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications & WhatsApp" icon={Bell}>
        <form onSubmit={saveSettings} className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp Notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Send rent reminders & alerts via WhatsApp</p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsForm(s => ({ ...s, whatsapp_enabled: !s.whatsapp_enabled }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${settingsForm.whatsapp_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settingsForm.whatsapp_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {settingsForm.whatsapp_enabled && (
            <div>
              <label className="form-label">Twilio WhatsApp Number (From)</label>
              <input
                className="form-input"
                placeholder="whatsapp:+14155238886"
                value={settingsForm.twilio_whatsapp_number}
                onChange={e => setSettingsForm(s => ({ ...s, twilio_whatsapp_number: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">Your Twilio WhatsApp sandbox number</p>
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Daily Summary</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive a daily business summary via WhatsApp at 7 AM</p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsForm(s => ({ ...s, daily_summary_enabled: !s.daily_summary_enabled }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${settingsForm.daily_summary_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settingsForm.daily_summary_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <button type="submit" disabled={savingSettings} className="btn-primary">
            <Save size={14} /> {savingSettings ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </form>
      </Section>

      {/* API Keys */}
      <Section title="API Configuration" icon={Key}>
        <form onSubmit={saveSettings} className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-xs text-yellow-700 dark:text-yellow-400">
            ⚠️ API keys are stored securely on the server and never exposed to the browser.
            Configure your main API keys in the backend .env file for security.
          </div>
          <div>
            <label className="form-label">OpenWeather API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your OpenWeather API key"
              value={settingsForm.openweather_api_key}
              onChange={e => setSettingsForm(s => ({ ...s, openweather_api_key: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">Used for Eswatini farm weather forecasts. Get a free key at openweathermap.org</p>
          </div>
          <button type="submit" disabled={savingSettings} className="btn-primary">
            <Save size={14} /> {savingSettings ? 'Saving...' : 'Save API Settings'}
          </button>
        </form>
      </Section>

      {/* System Info */}
      <Section title="System Information" icon={Globe}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Platform', value: 'AgrIProperty Manager AI v1.0' },
            { label: 'AI Model', value: 'Claude Sonnet 4' },
            { label: 'Database', value: 'Supabase (PostgreSQL)' },
            { label: 'Hosting', value: 'Vercel (Frontend) · Railway (Backend)' },
            { label: 'Currencies', value: 'GHS, ZAR, SZL, USD' },
            { label: 'Markets', value: 'Ghana RE · Eswatini & SA Farm' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
