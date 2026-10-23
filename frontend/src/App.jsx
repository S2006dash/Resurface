import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login            from './pages/Login'
import Dashboard        from './pages/Dashboard'
import History          from './pages/History'
import Transfer         from './pages/Transfer'
import Profile          from './pages/Profile'
import ArthaHome        from './pages/artha/ArthaHome'
import Upload           from './pages/artha/Upload'
import Insights         from './pages/artha/Insights'
import Goals            from './pages/artha/Goals'
import Anomalies        from './pages/artha/Anomalies'
import WhatIfSimulator  from './pages/artha/WhatIfSimulator'
import Reconciliation   from './pages/artha/Reconciliation'
import VoiceArtha       from './pages/artha/VoiceArtha'
import MoneyCalendar   from './pages/artha/MoneyCalendar'
import JargonBuster     from './components/artha/JargonBuster'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, color: '#0d4f2e', fontWeight: 600 }}>Loading Artha…</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <JargonBuster />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/history"  element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
          <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Artha core & new feature routes */}
          <Route path="/artha"                element={<ProtectedRoute><ArthaHome /></ProtectedRoute>} />
          <Route path="/artha/anomalies"       element={<ProtectedRoute><Anomalies /></ProtectedRoute>} />
          <Route path="/artha/simulator"       element={<ProtectedRoute><WhatIfSimulator /></ProtectedRoute>} />
          <Route path="/artha/reconciliation"  element={<ProtectedRoute><Reconciliation /></ProtectedRoute>} />
          <Route path="/artha/voice"          element={<ProtectedRoute><VoiceArtha /></ProtectedRoute>} />
          <Route path="/artha/calendar"       element={<ProtectedRoute><MoneyCalendar /></ProtectedRoute>} />
          <Route path="/artha/upload"         element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/artha/insights"       element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/artha/goals"          element={<ProtectedRoute><Goals /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/artha" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
