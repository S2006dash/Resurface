import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import History    from './pages/History'
import Transfer   from './pages/Transfer'
import Profile    from './pages/Profile'
import ArthaHome  from './pages/artha/ArthaHome'
import Upload     from './pages/artha/Upload'
import Insights   from './pages/artha/Insights'
import Goals      from './pages/artha/Goals'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40 }}>Loading…</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/history"  element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
          <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Artha routes */}
          <Route path="/artha"         element={<ProtectedRoute><ArthaHome /></ProtectedRoute>} />
          <Route path="/artha/upload"  element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/artha/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/artha/goals"   element={<ProtectedRoute><Goals /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
