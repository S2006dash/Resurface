import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../../components/Nav'
import { getOverview, getCoach } from '../../api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#0d4f2e','#1a7a48','#2ea862','#5fc98a','#99e8bc','#c8f5dc','#e8476a','#f4a261']
const fmt = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

const S = {
  page: { padding: 32 },
  heading: { fontSize: 26, fontWeight: 800, color: '#0d4f2e', marginBottom: 4 },
  sub: { color: '#4a7a5a', fontSize: 14, marginBottom: 28 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 32 },
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.07)' },
  cardGreen: { background: '#0d4f2e', color: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.15)' },
  label: { fontSize: 12, opacity: .7, textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 30, fontWeight: 800, marginTop: 4 },
  nav2: { display: 'flex', gap: 12, marginBottom: 28 },
  navLink: { padding: '10px 20px', background: '#0d4f2e', color: '#fff', borderRadius: 8,
             textDecoration: 'none', fontWeight: 600, fontSize: 14 },
  section: { fontSize: 18, fontWeight: 700, color: '#0d4f2e', marginBottom: 14, marginTop: 8 },
  billRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0',
             borderBottom: '1px solid #eee', fontSize: 14 },
  langBtn: { padding: '6px 14px', borderRadius: 6, border: '1.5px solid #0d4f2e',
             background: 'transparent', cursor: 'pointer', fontSize: 13, marginRight: 8 },
  coach: { background: '#f0faf4', borderRadius: 10, padding: '16px 20px', fontSize: 14,
           color: '#1a2e1a', borderLeft: '4px solid #0d4f2e', marginTop: 16 },
  disclaimer: { fontSize: 12, color: '#888', marginTop: 24, fontStyle: 'italic' },
}

export default function ArthaHome() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lang, setLang]         = useState('english')
  const [coach, setCoach]       = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [drawer, setDrawer]     = useState(null) // { label, rows }

  useEffect(() => {
    getOverview().then(r => setOverview(r.data)).finally(() => setLoading(false))
  }, [])

  const askCoach = async () => {
    if (!overview) return
    setCoachLoading(true)
    try {
      const r = await getCoach(overview.cash_flow, lang)
      setCoach(r.data.explanation)
    } catch { setCoach('Coach unavailable right now.') }
    finally { setCoachLoading(false) }
  }

  if (loading) return <><Nav /><div style={{ padding: 40 }}>Loading…</div></>

  const nw = overview?.net_worth
  const cf = overview?.cash_flow
  const cats = (overview?.categories || []).filter(c => c.direction === 'debit')
  const bills = overview?.bills_due || []

  return (
    <>
      <Nav />
      <div style={S.page}>
        <div style={S.heading}>Artha Overview</div>
        <div style={S.sub}>All your money, one clear picture.</div>

        {/* Quick nav */}
        <div style={S.nav2}>
          <Link to="/artha/upload"   style={S.navLink}>+ Upload Statement</Link>
          <Link to="/artha/insights" style={S.navLink}>🔍 Insights</Link>
          <Link to="/artha/goals"    style={S.navLink}>🎯 Goals</Link>
        </div>

        {/* Net worth cards */}
        <div style={S.grid}>
          <div style={S.cardGreen}>
            <div style={{ ...S.label, color: '#7dffb3' }}>Net Worth</div>
            <div style={{ ...S.value, color: '#7dffb3' }}>{fmt(nw?.total_net_worth || 0)}</div>
          </div>
          <div style={S.card}>
            <div style={S.label}>Bank Balance</div>
            <div style={S.value}>{fmt(nw?.bank_balance || 0)}</div>
          </div>
          <div style={S.card}>
            <div style={S.label}>Investments</div>
            <div style={S.value}>{fmt(nw?.investments || 0)}</div>
          </div>
          <div style={S.card}>
            <div style={S.label}>Liabilities</div>
            <div style={{ ...S.value, color: '#e8476a' }}>{fmt(nw?.liabilities || 0)}</div>
          </div>
        </div>

        {/* Cash flow */}
        <div style={S.grid}>
          <div style={S.card}>
            <div style={S.label}>Income (30d)</div>
            <div style={{ ...S.value, color: '#0d4f2e' }}>{fmt(cf?.income || 0)}</div>
          </div>
          <div style={S.card}>
            <div style={S.label}>Expenses (30d)</div>
            <div style={{ ...S.value, color: '#e8476a' }}>{fmt(cf?.expenses || 0)}</div>
          </div>
          <div style={S.card}>
            <div style={S.label}>Savings Rate</div>
            <div style={S.value}>{cf?.savings_rate ?? 0}%</div>
          </div>
        </div>

        {/* Category chart */}
        {cats.length > 0 && (
          <>
            <div style={S.section}>Spending by Category</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={cats} dataKey="total" nameKey="category" cx="50%" cy="50%"
                     outerRadius={100} label={e => `${e.category} ${fmt(e.total)}`}>
                  {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}

        {/* Bills due */}
        {bills.length > 0 && (
          <>
            <div style={{ ...S.section, marginTop: 28 }}>Bills & Renewals Due Soon</div>
            {bills.map((b, i) => (
              <div key={i} style={S.billRow}>
                <span>{b.name} <span style={{ color: '#888', fontSize: 12 }}>({b.kind})</span></span>
                <span>{fmt(b.amount)} — in {b.days_until} days</span>
              </div>
            ))}
          </>
        )}

        {/* Artha Coach */}
        <div style={{ ...S.section, marginTop: 28 }}>Ask Artha Coach</div>
        <button style={S.langBtn} onClick={() => setLang('english')}>English</button>
        <button style={S.langBtn} onClick={() => setLang('tamil')}>தமிழ்</button>
        <button
          style={{ ...S.langBtn, background: '#0d4f2e', color: '#fff' }}
          onClick={askCoach} disabled={coachLoading}
        >
          {coachLoading ? 'Thinking…' : 'Explain my finances'}
        </button>
        {coach && <div style={S.coach}>{coach}</div>}

        <div style={S.disclaimer}>
          Not financial advice. All numbers calculated by Artha's Python engine.
          Estimates based on recent transaction history.
        </div>
      </div>
    </>
  )
}
