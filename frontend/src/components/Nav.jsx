import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ShieldAlert, Calculator, Scale, Mic, Sparkles,
  Upload, Target, ArrowRightLeft, User, LogOut, Calendar
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
    color: active ? '#7dffb3' : isHighlight ? '#a7f3d0' : '#c8f5dc',
    textDecoration: 'none',
    fontWeight: active ? 700 : 500,
    padding: '6px 10px',
    borderRadius: 8,
    background: active ? 'rgba(125,255,179,0.18)' : 'transparent',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  })

  return (
    <nav style={{
      background: 'linear-gradient(90deg, #062615 0%, #0d4f2e 100%)',
      color: '#fff',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 60,
      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      overflowX: 'auto',
    }}>
      {/* Brand */}
      <Link to="/artha" style={{
        fontWeight: 800,
        fontSize: 20,
        color: '#7dffb3',
        textDecoration: 'none',
        marginRight: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span>✦</span>
        <span>Artha</span>
      </Link>

      {/* Artha Suite Features */}
      <Link to="/artha" style={linkStyle(isExact('/artha'), true)}>
        <Sparkles size={14} color="#7dffb3" />
        <span>Overview</span>
      </Link>

      <Link to="/artha/anomalies" style={linkStyle(isSub('/artha/anomalies'))}>
        <ShieldAlert size={14} color="#fca5a5" />
        <span>Scam Warning</span>
      </Link>

      <Link to="/artha/simulator" style={linkStyle(isSub('/artha/simulator'))}>
        <Calculator size={14} color="#fed7aa" />
        <span>What-If</span>
      </Link>

      <Link to="/artha/reconciliation" style={linkStyle(isSub('/artha/reconciliation'))}>
        <Scale size={14} color="#7dd3fc" />
        <span>Reconciliation</span>
      </Link>

      <Link to="/artha/voice" style={linkStyle(isSub('/artha/voice'))}>
        <Mic size={14} color="#a7f3d0" />
        <span>Voice AI</span>
      </Link>

      <Link to="/artha/calendar" style={linkStyle(isSub('/artha/calendar'))}>
        <Calendar size={14} color="#fde047" />
        <span>Calendar</span>
      </Link>

      <Link to="/artha/goals" style={linkStyle(isSub('/artha/goals'))}>
        <Target size={14} />
        <span>Goals</span>
      </Link>

      <Link to="/artha/upload" style={linkStyle(isSub('/artha/upload'))}>
        <Upload size={14} />
        <span>Upload</span>
      </Link>

      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)', margin: '0 6px' }} />

      {/* Core Banking Tabs */}
      <Link to="/" style={linkStyle(isExact('/'))}>
        <span>Bank</span>
      </Link>

      <Link to="/transfer" style={linkStyle(isSub('/transfer'))}>
        <ArrowRightLeft size={13} />
        <span>Transfer</span>
      </Link>

      {/* Right side profile & logout */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#c8f5dc', textDecoration: 'none', fontSize: 13, opacity: 0.9 }}>
          <User size={14} />
          <span>{user?.full_name?.split(' ')[0] || 'Priya'}</span>
        </Link>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            padding: '5px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <LogOut size={12} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
