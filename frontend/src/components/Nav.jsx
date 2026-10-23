import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const S = {
  nav: {
    background: '#0d4f2e', color: '#fff', padding: '0 24px',
    display: 'flex', alignItems: 'center', gap: 8, height: 56,
    boxShadow: '0 2px 8px rgba(0,0,0,.2)',
  },
  brand: { fontWeight: 800, fontSize: 22, color: '#7dffb3', textDecoration: 'none', marginRight: 16 },
  link: (active) => ({
    color: active ? '#7dffb3' : '#c8f5dc',
    textDecoration: 'none', fontWeight: active ? 700 : 400,
    padding: '4px 10px', borderRadius: 6,
    background: active ? 'rgba(125,255,179,.15)' : 'transparent',
    fontSize: 14,
  }),
  user: { marginLeft: 'auto', fontSize: 13, opacity: .8 },
  logout: {
    marginLeft: 12, background: 'rgba(255,255,255,.1)', border: 'none',
    color: '#fff', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
  },
}

export default function Nav() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const at  = (p) => loc.pathname === p || loc.pathname.startsWith(p + '/')

  const handleLogout = async () => { await logout(); nav('/login') }

  return (
    <nav style={S.nav}>
      <Link to="/"      style={S.brand}>Artha</Link>
      <Link to="/"      style={S.link(at('/') && !at('/artha'))}>Dashboard</Link>
      <Link to="/history"  style={S.link(at('/history'))}>History</Link>
      <Link to="/transfer" style={S.link(at('/transfer'))}>Transfer</Link>
      <Link to="/artha"    style={S.link(at('/artha'))}>✦ Artha</Link>
      <Link to="/profile"  style={S.link(at('/profile'))}>Profile</Link>
      <span style={S.user}>{user?.full_name}</span>
      <button style={S.logout} onClick={handleLogout}>Logout</button>
    </nav>
  )
}
