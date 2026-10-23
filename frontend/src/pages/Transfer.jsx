import React, { useState } from 'react'
import Nav from '../components/Nav'
import { transfer } from '../api'

const S = {
  page: { padding: 32 },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#0d4f2e' },
  card: { background: '#fff', borderRadius: 12, padding: 28, maxWidth: 400,
          boxShadow: '0 2px 12px rgba(0,0,0,.07)' },
  label: { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500, color: '#444' },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #cde8d4',
           fontSize: 14, marginBottom: 16 },
  btn: { width: '100%', padding: 12, background: '#0d4f2e', color: '#fff',
         border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  msg: (ok) => ({ color: ok ? '#0d4f2e' : '#c0392b', marginBottom: 12, fontSize: 14 }),
}

export default function Transfer() {
  const [from, setFrom]     = useState('')
  const [to, setTo]         = useState('')
  const [amount, setAmount] = useState('')
  const [msg, setMsg]       = useState(null)
  const [ok, setOk]         = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const r = await transfer(from, to, parseFloat(amount))
      setMsg(r.data.message); setOk(true)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Transfer failed'); setOk(false)
    }
  }

  return (
    <>
      <Nav />
      <div style={S.page}>
        <h1 style={S.h1}>Transfer</h1>
        <div style={S.card}>
          {msg && <div style={S.msg(ok)}>{msg}</div>}
          <form onSubmit={handleSubmit}>
            <label style={S.label}>From Account</label>
            <input style={S.input} value={from} onChange={e => setFrom(e.target.value)} required />
            <label style={S.label}>To Account</label>
            <input style={S.input} value={to} onChange={e => setTo(e.target.value)} required />
            <label style={S.label}>Amount (₹)</label>
            <input style={S.input} type="number" min="1" value={amount}
                   onChange={e => setAmount(e.target.value)} required />
            <button style={S.btn} type="submit">Transfer</button>
          </form>
        </div>
      </div>
    </>
  )
}
