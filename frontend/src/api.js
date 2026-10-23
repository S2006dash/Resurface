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
export const uploadFile = (formData) =>
  api.post('/artha/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const uploadText = (text, doc_type = 'sms_text') =>
  api.post('/artha/upload', { text, doc_type })
export const confirmRows = (doc_type, provider, rows) =>
  api.post('/artha/confirm', { doc_type, provider, rows })

// ── Artha engine ──────────────────────────────────────────────────────────────
export const getOverview    = ()                      => api.get('/artha/overview')
export const getTransactions = (params = {})          => api.get('/artha/transactions', { params })
export const getInsights    = ()                      => api.get('/artha/insights')
export const getGoals       = ()                      => api.get('/artha/goals')
export const createGoal     = (data)                  => api.post('/artha/goals', data)
export const simulateGoal   = (goal_id, what_ifs = {}) =>
  api.post('/artha/goals/simulate', { goal_id, what_ifs })
export const getCoach       = (metric, language = 'english') =>
  api.post('/artha/coach', { metric, language })
