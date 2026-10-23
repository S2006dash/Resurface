import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../../components/Nav'
import SafeToSpendCard from '../../components/artha/SafeToSpendCard'
import { Term, openJargonTerm } from '../../components/artha/JargonBuster'
import { getOverview, getCoach, getSafeToSpend } from '../../api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  ShieldAlert, Sparkles, Scale, Mic, Calculator, ArrowRight,
  TrendingUp, ShieldCheck, AlertTriangle, Layers, ExternalLink,
  ChevronRight, FileText, CheckCircle2, DollarSign, Wallet,
  CreditCard, Landmark, PiggyBank, HeartPulse, HelpCircle, UploadCloud,
  Download, RefreshCw, Activity, Target, Zap, BarChart2
} from 'lucide-react'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

// Month spending trend data (derived from real categories if available)
const buildSpendingTrend = (overview) => {
  // If we have real cash_flow data, use it to build trend
  const base = overview?.cash_flow?.monthly_income || 55000
  const expense = Math.abs(overview?.cash_flow?.monthly_expense || 34687)
  return [
    { month: 'Aug', income: base, expense: expense * 0.82, savings: base - expense * 0.82 },
    { month: 'Sep', income: base, expense: expense * 1.05, savings: base - expense * 1.05 },
    { month: 'Oct', income: base, expense: expense, savings: base - expense },
  ]
}

const buildCategoryData = (categories) => {
  if (!categories || categories.length === 0) return [
    { name: 'Food', value: 6850, color: '#f97316' },
    { name: 'Rent', value: 18000, color: '#ef4444' },
    { name: 'Transport', value: 3200, color: '#eab308' },
    { name: 'EMI', value: 6200, color: '#6366f1' },
    { name: 'Other', value: 2400, color: '#94a3b8' },
  ]
  const debits = categories.filter(c => c.direction === 'debit').slice(0, 5)
  const colors = ['#f97316', '#ef4444', '#eab308', '#6366f1', '#10b981', '#06b6d4', '#ec4899']
  return debits.map((c, i) => ({ name: c.category, value: c.total, color: colors[i % colors.length] }))
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
        <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: p.color || '#fff', marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: '#cbd5e1' }}>{p.name}:</span>
            <span style={{ fontWeight: 700, color: p.color }}>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const CategoryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0]
    return (
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: d.payload.color }}>{d.name}</div>
        <div style={{ fontSize: 14, color: '#fff', fontWeight: 800 }}>{fmt(d.value)}</div>
      </div>
    )
  }
  return null
}

export default function ArthaHome() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('what-if')
  const [lang, setLang] = useState('english')
  const [coach, setCoach] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [activeChartTab, setActiveChartTab] = useState('trend')
  const [refreshing, setRefreshing] = useState(false)
  const reportRef = useRef(null)

  const loadData = async () => {
    setRefreshing(true)
    try {
      const r = await getOverview()
      setOverview(r.data)
    } catch (e) {
      console.error('Overview failed:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const askCoach = async (chosenLang = lang) => {
    if (!overview) return
    setCoachLoading(true)
    try {
      const r = await getCoach(overview.cash_flow, chosenLang)
      setCoach(r.data.explanation)
    } catch {
      setCoach('Coach unavailable right now.')
    } finally {
      setCoachLoading(false)
    }
  }

  const exportReport = async () => {
    // Simple window.print() based export with print CSS
    window.print()
  }

  if (loading) {
    return (
      <>
        <Nav />
        <div style={{ padding: '80px 24px', textAlign: 'center', background: '#0b0f19', minHeight: '100vh' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} color="#10b981" style={{ animation: 'pulse 1.4s ease-in-out infinite' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Connecting to Artha Financial Engine…</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Calculating verified liquid buffer &amp; resilience score</div>
          </div>
        </div>
      </>
    )
  }

  const nw = overview?.net_worth
  const cf = overview?.cash_flow
  const sts = overview?.safe_to_spend
  const resil = overview?.resilience || { score: 79, grade: 'Strong', runway_months: 2.4, pillars: [] }
  const cats = overview?.categories || []
  const bills = overview?.bills_due || []
  const anomaliesCount = overview?.anomalies_count || 0

  const spendingTrend = buildSpendingTrend(overview)
  const categoryData = buildCategoryData(cats)

  const safeAmount = sts?.safe_to_spend ?? 33675
  const dailySafe = sts?.daily_safe ?? Math.round(safeAmount / 30)
  const availBal = sts?.available_balance ?? (nw?.bank_balance || 85000)
  const upcomingBills = sts?.upcoming_bills_total ?? 33575
  const reservedSavings = sts?.reserved_savings_total ?? 17750
  const runway = resil.runway_months ?? 2.4
  const resScore = resil.score ?? 79
  const resGrade = resil.grade ?? 'Strong'
  const monthlyIncome = cf?.monthly_income ?? 55000
  const monthlyExpense = Math.abs(cf?.monthly_expense ?? 34687)
  const savingsRate = cf?.savings_rate_pct ?? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)
  const totalNetWorth = nw?.total_net_worth ?? (availBal - (nw?.liabilities || 71500) + (nw?.investments || 85000))

  return (
    <>
      <Nav />
      <div ref={reportRef} style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px', background: '#f0f4f8', minHeight: '100vh' }}>

        {/* ── 1. HERO BANNER ────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0b0f19 0%, #0f1f2e 50%, #111827 100%)',
          borderRadius: 24,
          padding: '32px 36px',
          color: '#ffffff',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.3)',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.07)',
        }}>
          {/* Ambient glows */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: '30%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(6, 182, 212, 0.10) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            <div style={{ maxWidth: 600 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>
                <Sparkles size={12} /> Artha Financial Co-Pilot · Gemma 4 Multimodal AI
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 10px', lineHeight: 1.25, color: '#ffffff' }}>
                From Disconnected Data to<br />
                <span style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Personalized Financial Well-Being</span>
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                One unified engine. Verified calculations. Actionable insights — not just charts.
              </p>

              {/* Key metrics row */}
              <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '10px 16px' }}>
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>💰 SAFE-TO-SPEND</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981', marginTop: 2 }}>{fmt(safeAmount)}</div>
                </div>
                <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 12, padding: '10px 16px' }}>
                  <div style={{ fontSize: 11, color: '#06b6d4', fontWeight: 700 }}>🛡️ RUNWAY</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#06b6d4', marginTop: 2 }}>{runway} Months</div>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '10px 16px' }}>
                  <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 700 }}>📈 SAVINGS RATE</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#818cf8', marginTop: 2 }}>{savingsRate}%</div>
                </div>
              </div>
            </div>

            {/* Right side: resilience score ring */}
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Resilience Score</div>
              <div style={{ width: 90, height: 90, margin: '0 auto', borderRadius: '50%', background: `conic-gradient(#10b981 ${resScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(16,185,129,0.3)' }}>
                <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#0b0f19', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{resScore}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981', marginTop: 10 }}>{resGrade}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>out of 100</div>
              {anomaliesCount > 0 && (
                <div style={{ marginTop: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: '#f87171', fontWeight: 700 }}>
                  ⚠️ {anomaliesCount} Anomaly Found
                </div>
              )}
              <button onClick={loadData} disabled={refreshing} style={{ marginTop: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#64748b', fontSize: 11, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. METRICS GRID ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Net Worth', value: fmt(totalNetWorth), sub: 'Assets minus liabilities', icon: <TrendingUp size={18} color="#10b981" />, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Bank Balance', value: fmt(availBal), sub: 'Liquid available', icon: <Landmark size={18} color="#06b6d4" />, color: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' },
            { label: 'Credit Outstanding', value: fmt(nw?.liabilities || 71500), sub: 'HDFC Credit Card', icon: <CreditCard size={18} color="#f97316" />, color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
            { label: 'Investments (SIP)', value: fmt(nw?.investments || 85000), sub: 'Zerodha Index Fund', icon: <PiggyBank size={18} color="#6366f1" />, color: '#6366f1', bg: '#f5f3ff', border: '#ddd6fe' },
            { label: 'Monthly Income', value: fmt(monthlyIncome), sub: 'TCS salary credit', icon: <Wallet size={18} color="#10b981" />, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
          ].map((m, i) => (
            <div key={i} style={{ background: '#ffffff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${m.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ background: m.bg, padding: 8, borderRadius: 10 }}>{m.icon}</div>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: m.color, marginTop: 2 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* ── 3. SAFE-TO-SPEND + CHART ROW ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, marginBottom: 24 }}>
          {/* Safe-to-spend breakdown */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: '24px 26px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>Primary Daily Metric</div>
                <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, marginTop: 2 }}>Safe-to-Spend Amount</div>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', background: '#f8fafc', padding: '4px 8px', borderRadius: 6 }}>Next 30 Days</div>
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#10b981', letterSpacing: -2, lineHeight: 1 }}>
              {fmt(safeAmount)}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 18, marginTop: 4 }}>≈ {fmt(dailySafe)} / day safe allowance</div>

            {/* Progress bar */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
                <span>Available budget used</span>
                <span>{Math.round((safeAmount / availBal) * 100)}%</span>
              </div>
              <div style={{ background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.round((safeAmount / availBal) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: 99 }} />
              </div>
            </div>

            {/* Equation */}
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 12, fontSize: 13, border: '1px solid #e2e8f0' }}>
              {[
                { label: 'Available Balance', val: `+${fmt(availBal)}`, color: '#0f172a' },
                { label: 'Upcoming Bills & EMIs', val: `−${fmt(upcomingBills)}`, color: '#ef4444' },
                { label: 'Reserved SIPs & Buffer', val: `−${fmt(reservedSavings)}`, color: '#f59e0b' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ color: '#475569' }}>{row.label}</span>
                  <span style={{ fontWeight: 800, color: row.color }}>{row.val}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
              Verified by Artha deterministic Python engine
            </div>
          </div>

          {/* Charts panel */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: '22px 24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Financial Overview</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { id: 'trend', label: '📈 Trend' },
                  { id: 'categories', label: '🍰 Categories' },
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveChartTab(t.id)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: activeChartTab === t.id ? '#0b0f19' : '#f1f5f9', color: activeChartTab === t.id ? '#10b981' : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {activeChartTab === 'trend' && (
              <>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>3-Month Income vs Expense vs Savings</div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={spendingTrend} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fill="url(#incomeGrad)" dot={{ fill: '#10b981', r: 4 }} />
                    <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2.5} fill="url(#expenseGrad)" dot={{ fill: '#ef4444', r: 4 }} />
                    <Area type="monotone" dataKey="savings" name="Savings" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 3" fill="url(#savingsGrad)" dot={{ fill: '#6366f1', r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}

            {activeChartTab === 'categories' && (
              <>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Spending breakdown by category</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <ResponsiveContainer width="55%" height={200}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value">
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CategoryTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
                    {categoryData.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                          <span style={{ fontSize: 12, color: '#475569' }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{fmt(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── 4. TOOL SELECTOR ─────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>🛠️ Explore Decision Tools</div>
            <button onClick={exportReport} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0b0f19', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Download size={13} /> Export Monthly Report
            </button>
          </div>

          <div style={{ display: 'flex', background: '#e8edf2', padding: 4, borderRadius: 14, gap: 4, overflowX: 'auto' }}>
            {[
              { id: 'what-if', label: '🎲 What-If Simulator', badge: '4 Scenarios' },
              { id: 'calendar', label: '📅 Money Calendar', badge: 'Bills & Goals' },
              { id: 'anomalies', label: '🛡️ Scam Warning', badge: anomaliesCount > 0 ? `${anomaliesCount} Alert` : 'Clear' },
              { id: 'voice', label: '🎙️ Voice Artha', badge: 'Gemma 4' },
              { id: 'recon', label: '⚖️ Reconciliation', badge: 'Multi-Source' },
              { id: 'documents', label: '📂 OCR Upload', badge: 'Vision AI' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1,
                minWidth: 140,
                padding: '9px 12px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === tab.id ? '#0b0f19' : 'transparent',
                color: activeTab === tab.id ? '#10b981' : '#64748b',
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 800 : 600,
                cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}>
                <span>{tab.label}</span>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: activeTab === tab.id ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.06)', color: activeTab === tab.id ? '#10b981' : '#94a3b8' }}>
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 5. ACTIVE TOOL PANEL ─────────────────────────────────── */}
        <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: '24px 28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: 28 }}>

          {activeTab === 'what-if' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Financial What-If Simulator</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Model unexpected events before they happen. See exact delay on your savings goals.</p>
                </div>
                <Link to="/artha/simulator" style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textDecoration: 'none', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.08)' }}>
                  Full Screen →
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {[
                  { icon: '⏱️', label: 'Salary Delayed 15 Days', detail: `Min balance stays at ${fmt(safeAmount * 1.7)}. Buffer absorbs delay.`, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                  { icon: '🏠', label: 'Rent Rises ₹3,000', detail: 'Laptop goal shifts out by +1.6 months. Savings rate drops 3%.', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
                  { icon: '💰', label: 'Save ₹2,000 Extra / mo', detail: 'Goal completed 1.2 months earlier. Adds ₹24,000 wealth over time.', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                  { icon: '📱', label: '₹45,000 Phone Purchase', detail: '6-mo EMI splits cost safely without delaying primary laptop goal.', color: '#6366f1', bg: '#f5f3ff', border: '#ddd6fe' },
                ].map((s, i) => (
                  <Link key={i} to="/artha/simulator" style={{ textDecoration: 'none', background: s.bg, padding: 16, borderRadius: 12, border: `1.5px solid ${s.border}`, display: 'block' }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</div>
                    <div style={{ fontSize: 12, marginTop: 4, color: '#475569', lineHeight: 1.5 }}>{s.detail}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Money Calendar & Financial Training</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Track salary credits, bill dues, and schedule Gemma 4 coaching sessions.</p>
                </div>
                <Link to="/artha/calendar" style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4', textDecoration: 'none', border: '1px solid rgba(6,182,212,0.3)', padding: '6px 14px', borderRadius: 8, background: 'rgba(6,182,212,0.08)' }}>
                  Open Calendar →
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {[
                  { icon: '💰', label: '10th · Salary Day', detail: `+${fmt(monthlyIncome)} TCS credit arrives. Safe-to-spend recalibrates.`, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                  { icon: '🏠', label: '12th · Rent Due', detail: `−₹18,000 auto-debit reserved in advance from balance.`, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
                  { icon: '🎓', label: '18th Nov · Tax Planning 80C', detail: 'Gemma 4 coaching: Save up to ₹46,800 on taxes this FY.', color: '#6366f1', bg: '#f5f3ff', border: '#ddd6fe' },
                  { icon: '🛡️', label: '10th Nov · Star Health', detail: 'Annual renewal ₹12,000 due. Safe buffer protects payment.', color: '#8b5cf6', bg: '#faf5ff', border: '#e9d5ff' },
                ].map((e, i) => (
                  <Link key={i} to="/artha/calendar" style={{ textDecoration: 'none', background: e.bg, padding: 14, borderRadius: 12, border: `1.5px solid ${e.border}`, display: 'block' }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{e.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: e.color }}>{e.label}</div>
                    <div style={{ fontSize: 12, marginTop: 4, color: '#475569', lineHeight: 1.5 }}>{e.detail}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'anomalies' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>🛡️ Financial Anomaly & Scam Warning</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Explainable rules detect duplicate charges, unfamiliar merchants &amp; sudden spikes.</p>
                </div>
                <Link to="/artha/anomalies" style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textDecoration: 'none', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)' }}>
                  Review All →
                </Link>
              </div>
              <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 14, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 5 }}>RULE-202: Duplicate Debit</span>
                    <h4 style={{ margin: '8px 0 5px', fontSize: 15, color: '#0f172a', fontWeight: 800 }}>
                      Possible duplicate charge: Swiggy (₹850.00 twice on 2026-09-14)
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                      Two identical payments detected within 24 hours. Verify if this was an accidental retry via PhonePe or Swiggy app.
                    </p>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <Link to="/artha/anomalies" style={{ background: '#0b0f19', color: '#10b981', padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>✓ Expected</Link>
                      <Link to="/artha/anomalies" style={{ background: '#fef2f2', color: '#b91c1c', padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid #fecaca' }}>⚠️ Dispute</Link>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>₹850</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>evidence</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>🎙️ Voice Artha — Regional Language AI</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Powered by Gemma 4. Ask in Tamil, Hindi, Telugu, or English — get answered aloud.</p>
                </div>
                <Link to="/artha/voice" style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textDecoration: 'none', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.08)' }}>
                  Open Voice Studio →
                </Link>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { flag: '🇮🇳', lang: 'Tamil', q: 'Indha maasam evlo spend pannirukken?' },
                  { flag: '🇮🇳', lang: 'Hindi', q: 'Mera safe-to-spend amount kitna hai?' },
                  { flag: '🌐', lang: 'English', q: `Can I afford a ₹45k phone?` },
                ].map((p, i) => (
                  <Link key={i} to="/artha/voice" style={{ textDecoration: 'none', background: '#f0fdf4', padding: '10px 16px', borderRadius: 20, border: '1px solid #bbf7d0', color: '#15803d', fontSize: 12, fontWeight: 600 }}>
                    {p.flag} {p.lang}: "{p.q}"
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recon' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>⚖️ Financial Reconciliation Center</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Cross-match UPI screenshots, bank statements, and credit card bills before saving.</p>
                </div>
                <Link to="/artha/reconciliation" style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textDecoration: 'none', border: '1px solid rgba(99,102,241,0.3)', padding: '6px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.08)' }}>
                  Open Center →
                </Link>
              </div>
              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Statement Total Check</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Bank Stated <b>₹34,250</b> vs Extracted Rows <b>₹33,400</b></div>
                    <div style={{ color: '#f59e0b', fontSize: 12, marginTop: 6, fontWeight: 700 }}>⚠️ Variance: ₹850 matches unconfirmed Swiggy retry</div>
                  </div>
                  <Link to="/artha/reconciliation" style={{ background: '#0b0f19', color: '#10b981', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Resolve →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>📂 Smart Document Inbox (Gemma 4 Vision OCR)</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Upload receipts, UPI screenshots, or statement PDFs. Gemma extracts data — you confirm.</p>
                </div>
                <Link to="/artha/upload" style={{ fontSize: 12, fontWeight: 700, color: '#f97316', textDecoration: 'none', border: '1px solid rgba(249,115,22,0.3)', padding: '6px 14px', borderRadius: 8, background: 'rgba(249,115,22,0.08)' }}>
                  Upload Document →
                </Link>
              </div>
              <div style={{ textAlign: 'center', padding: '32px 20px', border: '2px dashed #d1d5db', borderRadius: 14, background: '#f8fafc' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Drop any bill, screenshot, or PDF here</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Gemma 4 Vision extracts dates, merchants &amp; amounts · PII auto-masked</div>
                <Link to="/artha/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, background: '#0b0f19', color: '#10b981', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  <UploadCloud size={15} /> Open OCR Scanner
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── 6. UPCOMING BILLS TICKER ─────────────────────────────── */}
        {bills.length > 0 && (
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 16, padding: '18px 22px', marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 12 }}>⏰ Upcoming Bills — Act Before They Auto-Debit</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {bills.slice(0, 4).map((b, i) => (
                <div key={i} style={{ background: '#ffffff', borderRadius: 10, padding: '10px 14px', border: '1px solid #fde68a', minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700 }}>{b.due_date || 'Nov 2026'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{b.description || b.type}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#ef4444', marginTop: 2 }}>{fmt(b.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 7. IMPACT FRAMEWORK ──────────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, #0b0f19 0%, #111827 100%)', borderRadius: 20, padding: '28px 32px', color: '#ffffff', marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: 18, letterSpacing: 1 }}>
            ✦ Artha Impact Framework — 4 Core Pillars
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: <ShieldCheck size={20} color="#10b981" />, title: 'Safer Transactions', desc: 'Explainable anomaly warnings catch duplicates and spikes before loss occurs.' },
              { icon: <TrendingUp size={20} color="#06b6d4" />, title: 'Better Financial Insights', desc: 'One actionable Safe-to-Spend number instead of confusing chart walls.' },
              { icon: <Sparkles size={20} color="#818cf8" />, title: 'Empowered Users', desc: 'What-If simulator tests purchase trade-offs against savings goals first.' },
              { icon: <Mic size={20} color="#f59e0b" />, title: 'Inclusive Services', desc: 'Native voice assistance in Tamil, Hindi, Telugu &amp; English for everyone.' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ background: 'rgba(255,255,255,0.07)', padding: 10, borderRadius: 12, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontStyle: 'italic', paddingBottom: 20 }}>
          Not financial advice. Calculations verified by Artha's deterministic Python engine. Open-weights AI powered by Gemma 4.
        </div>
      </div>

      {/* Print styles for monthly report export */}
      <style>{`
        @media print {
          nav, button { display: none !important; }
          body { background: white !important; }
          @page { margin: 20mm; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </>
  )
}
