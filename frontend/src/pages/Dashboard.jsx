import React, { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import { getDashboard } from '../api'

const S = {
  page: { padding: 32 },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#0d4f2e' },
  grid: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  card: {
    background: '#fff', borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 2px 12px rgba(0,0,0,.07)', minWidth: 200,
  },
  label: { fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 28, fontWeight: 700, color: '#0d4f2e', marginTop: 4 },
  sub:   { fontSize: 13, color: '#666', marginTop: 4 },
  cta: {
    display: 'inline-block', marginTop: 28, padding: '12px 24px',
    background: '#0d4f2e', color: '#fff', borderRadius: 8, textDecoration: 'none',
    fontWeight: 600, fontSize: 14,
  },
}

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) }

export default function Dashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Nav />
      <div style={S.page}>
        <h1 style={S.h1}>SecureBank Accounts</h1>
        {loading ? <p>Loading…</p> : (
          <>
            <div style={S.grid}>
              {(data?.accounts || []).map(acc => (
                <div key={acc.account_number} style={S.card}>
                  <div style={S.label}>{acc.account_type}</div>
                  <div style={S.value}>{fmt(acc.balance)}</div>
                  <div style={S.sub}>{acc.account_number}</div>
                </div>
              ))}
              <div style={{ ...S.card, background: '#0d4f2e', color: '#fff' }}>
                <div style={{ ...S.label, color: '#7dffb3' }}>Total Balance</div>
                <div style={{ ...S.value, color: '#7dffb3' }}>{fmt(data?.total_balance || 0)}</div>
              </div>
            </div>
            <a href="/artha" style={S.cta}>✦ Open Artha — see full financial picture →</a>
          </>
        )}
      </div>
    </>
  )
}
