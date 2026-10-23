import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../context/AuthContext'

const S = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0faf4' },
  card: { background: '#fff', borderRadius: 16, padding: 40, width: 360, boxShadow: '0 4px 24px rgba(0,0,0,.1)' },
  logo: { fontSize: 32, fontWeight: 900, color: '#0d4f2e', marginBottom: 4 },
  tagline: { color: '#4a7a5a', fontSize: 13, marginBottom: 28 },
  label: { display: 'block', marginBottom: 4, fontSize: 13, color: '#444', fontWeight: 500 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cde8d4',
    fontSize: 14, marginBottom: 16, outline: 'none',
  },
  btn: {
    width: '100%', padding: '12px', background: '#0d4f2e', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  err: { color: '#c0392b', fontSize: 13, marginBottom: 12 },
  hint: { fontSize: 12, color: '#888', marginTop: 16, textAlign: 'center' },
}

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { setUser } = useAuth()
  const nav = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await login(email, password)
      setUser({ full_name: r.data.name, email })
      nav('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.wrap}>
      <form style={S.card} onSubmit={handleSubmit}>
        <div style={S.logo}>Artha</div>
        <div style={S.tagline}>All your money, one clear picture. Private by design.</div>
        {error && <div style={S.err}>{error}</div>}
        <label style={S.label}>Email</label>
        <input style={S.input} type="email" value={email}
               onChange={e => setEmail(e.target.value)} required autoFocus />
        <label style={S.label}>Password</label>
        <input style={S.input} type="password" value={password}
               onChange={e => setPassword(e.target.value)} required />
        <button style={S.btn} type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <div style={S.hint}>Demo: priya@demo.artha / demo1234</div>
      </form>
    </div>
  )
}
