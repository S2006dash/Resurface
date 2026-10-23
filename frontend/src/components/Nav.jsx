import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ShieldAlert, Calculator, Scale, Mic, Sparkles,
  UploadCloud, Target, ArrowRightLeft, User, LogOut,
  Calendar, Landmark, History, Layers
} from 'lucide-react'

export default function Nav() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const p = loc.pathname

  const isExact = path => p === path
  const isSub = path => p === path || p.startsWith(path + '/')

  const handleLogout = async () => {
    await logout()
    nav('/login')
  }

  const linkStyle = (active, isHighlight = false) => ({
    color: active ? '#10b981' : isHighlight ? '#38bdf8' : '#94a3b8',
    textDecoration: 'none',
    fontWeight: active ? 700 : 500,
    padding: '6px 11px',
    borderRadius: 8,
    background: active ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
    border: active ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  })

  return (
    <nav style={{
      background: '#0b0f19',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      color: '#fff',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 62,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      overflowX: 'auto',
    }}>
      {/* Brand */}
      <Link to="/artha" style={{
        fontWeight: 900,
        fontSize: 20,
        color: '#ffffff',
        textDecoration: 'none',
        marginRight: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        letterSpacing: '-0.02em',
      }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontWeight: 900,
          fontSize: 15,
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)',
        }}>
          ✦
        </div>
        <span style={{
          background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Artha
        </span>
      </Link>

      {/* Artha Suite Navigation */}
      <Link to="/artha" style={linkStyle(isExact('/artha'), true)}>
        <Sparkles size={14} color="#10b981" />
        <span>Overview</span>
      </Link>

      <Link to="/artha/voice" style={linkStyle(isSub('/artha/voice'))}>
        <Mic size={14} color="#38bdf8" />
        <span>Voice AI</span>
      </Link>

      <Link to="/artha/upload" style={linkStyle(isSub('/artha/upload'))}>
        <UploadCloud size={14} color="#a855f7" />
        <span>Gemma OCR</span>
      </Link>

      <Link to="/artha/calendar" style={linkStyle(isSub('/artha/calendar'))}>
        <Calendar size={14} color="#facc15" />
        <span>Money Calendar</span>
      </Link>

      <Link to="/artha/goals" style={linkStyle(isSub('/artha/goals'))}>
        <Target size={14} color="#f43f5e" />
        <span>Goals</span>
      </Link>

      <Link to="/artha/simulator" style={linkStyle(isSub('/artha/simulator'))}>
        <Calculator size={14} color="#fb923c" />
        <span>What-If</span>
      </Link>

      <Link to="/artha/anomalies" style={linkStyle(isSub('/artha/anomalies'))}>
        <ShieldAlert size={14} color="#ef4444" />
        <span>Scams & Spikes</span>
      </Link>

      <Link to="/artha/reconciliation" style={linkStyle(isSub('/artha/reconciliation'))}>
        <Scale size={14} color="#2dd4bf" />
        <span>Reconciliation</span>
      </Link>

      <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.12)', margin: '0 8px' }} />

      {/* Core Banking Tabs */}
      <Link to="/" style={linkStyle(isExact('/'))}>
        <Landmark size={14} color="#94a3b8" />
        <span>Connected Banks</span>
      </Link>

      <Link to="/history" style={linkStyle(isSub('/history'))}>
        <History size={14} color="#94a3b8" />
        <span>Spendings</span>
      </Link>

      <Link to="/transfer" style={linkStyle(isSub('/transfer'))}>
        <ArrowRightLeft size={13} color="#94a3b8" />
        <span>Transfer</span>
      </Link>

      {/* Right side profile & logout */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/profile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#e2e8f0',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: 600,
          background: 'rgba(255,255,255,0.06)',
          padding: '5px 12px',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <User size={13} color="#10b981" />
          <span>{user?.full_name?.split(' ')[0] || 'Priya'}</span>
        </Link>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            padding: '5px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={12} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
