import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login    = (email, password) => api.post('/login',  { email, password })
export const logout   = ()                => api.post('/logout')
export const getMe    = ()                => api.get('/me')

// ── SecureBank ────────────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard')
export const getHistory   = (limit = 50) => api.get(`/history?limit=${limit}`)
export const transfer     = (from_account, to_account, amount) =>
  api.post('/transfer', { from_account, to_account, amount })

// ── Artha ingest ──────────────────────────────────────────────────────────────
export const uploadFile = (formData, customKey = null) => {
  const key = customKey || localStorage.getItem('artha_gemini_key')
  const headers = { 'Content-Type': 'multipart/form-data' }
  if (key) headers['X-Gemini-Key'] = key
  return api.post('/artha/upload', formData, { headers })
}
export const uploadText = (text, doc_type = 'sms_text', customKey = null) => {
  const key = customKey || localStorage.getItem('artha_gemini_key')
  const headers = {}
  if (key) headers['X-Gemini-Key'] = key
  return api.post('/artha/upload', { text, doc_type }, { headers })
}
export const confirmRows = (doc_type, provider, rows) =>
  api.post('/artha/confirm', { doc_type, provider, rows })

// ── Artha engine ──────────────────────────────────────────────────────────────
export const getOverview       = ()                      => api.get('/artha/overview')
export const getTransactions   = (params = {})          => api.get('/artha/transactions', { params })
export const getInsights       = ()                      => api.get('/artha/insights')
export const getGoals          = ()                      => api.get('/artha/goals')
export const createGoal        = (data)                  => api.post('/artha/goals', data)
export const simulateGoal      = (goal_id, what_ifs = {}) =>
  api.post('/artha/goals/simulate', { goal_id, what_ifs })
export const getCoach          = (metric, language = 'english') =>
  api.post('/artha/coach', { metric, language })

// ── New Features: Safe-to-Spend, Anomalies, What-If, Recon, Voice ─────────────
export const getSafeToSpend    = (buffer = 0.15)         => api.get(`/artha/safe-to-spend?buffer=${buffer}`)
export const getResilience     = ()                      => api.get('/artha/resilience')
export const getAnomalies      = ()                      => api.get('/artha/anomalies')
export const updateAnomalyStatus = (anomaly_key, status, note = '') =>
  api.post('/artha/anomalies/status', { anomaly_key, status, note })
export const simulateWhatIf    = (scenario, params = {}) =>
  api.post('/artha/what-if', { scenario, params })
export const getReconciliation = ()                      => api.get('/artha/reconciliation')
export const resolveReconciliation = (conflict_id, action) =>
  api.post('/artha/reconciliation/resolve', { conflict_id, action })
export const voiceAsk          = (query, language = 'english') =>
  api.post('/artha/voice-ask', { query, language })
