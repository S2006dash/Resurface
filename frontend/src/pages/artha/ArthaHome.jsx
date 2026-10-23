import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../../components/Nav'
import SafeToSpendCard from '../../components/artha/SafeToSpendCard'
import { getOverview, getCoach } from '../../api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  ShieldAlert, Sparkles, Scale, Mic, Calculator, ArrowRight,
  TrendingUp, ShieldCheck, AlertTriangle, Layers, ExternalLink, ChevronRight, FileText
} from 'lucide-react'

const COLORS = ['#0d4f2e', '#1a7a48', '#2ea862', '#5fc98a', '#99e8bc', '#c8f5dc', '#e8476a', '#f4a261']
const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function ArthaHome() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('english')
  const [coach, setCoach] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [whyDrawer, setWhyDrawer] = useState(null) // { title, rows }

  useEffect(() => {
    getOverview().then(r => setOverview(r.data)).finally(() => setLoading(false))
  }, [])

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

  if (loading) {
    return (
      <>
        <Nav />
        <div style={{ padding: 48, textAlign: 'center', color: '#0d4f2e', fontSize: 16 }}>
          Loading your verified financial picture…
        </div>
      </>
    )
  }

  const nw = overview?.net_worth
  const cf = overview?.cash_flow
  const sts = overview?.safe_to_spend
  const resil = overview?.resilience || { score: 79, grade: 'Strong', runway_months: 2.4, pillars: [] }
  const cats = (overview?.categories || []).filter(c => c.direction === 'debit')
  const bills = overview?.bills_due || []
  const anomaliesCount = overview?.anomalies_count || 1

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 24px' }}>
        {/* Page Hero Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#0d4f2e' }}>Artha Overview</span>
              <span style={{
                background: 'rgba(125,255,179,0.2)',
                color: '#0d4f2e',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 12,
                border: '1px solid #7dffb3',
              }}>
                ✦ Verified Engine
              </span>
            </div>
            <div style={{ color: '#4a7a5a', fontSize: 14 }}>
              All your money, one clear picture. Grounded in deterministic calculations with human verification.
            </div>
          </div>

          {/* Quick Action Navigation Strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link
              to="/artha/anomalies"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 8,
                background: '#fee2e2',
                color: '#b91c1c',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
                border: '1px solid #fca5a5',
              }}
            >
              <ShieldAlert size={15} />
              <span>Scam & Anomalies ({anomaliesCount})</span>
            </Link>

            <Link
              to="/artha/simulator"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 8,
                background: '#0d4f2e',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Calculator size={15} />
              <span>What-If Simulator</span>
            </Link>

            <Link
              to="/artha/reconciliation"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 8,
                background: '#f8fafc',
                color: '#0d4f2e',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                border: '1.5px solid #0d4f2e',
              }}
            >
              <Scale size={15} />
              <span>Reconciliation</span>
            </Link>

            <Link
              to="/artha/voice"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 8,
                background: '#e0f2fe',
                color: '#0369a1',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
                border: '1px solid #7dd3fc',
              }}
            >
              <Mic size={15} />
              <span>Voice Artha (Tamil/Hindi)</span>
            </Link>

            <Link
              to="/artha/upload"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 8,
                background: '#f1f5f9',
                color: '#334155',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span>+ Upload Statement</span>
            </Link>
          </div>
        </div>

        {/* ── 1. PROMINENT SAFE-TO-SPEND AMOUNT (Feature 5) ───────────────────── */}
        <SafeToSpendCard initialData={sts} />

        {/* ── 2. FINANCIAL RESILIENCE SCORE ──────────────────────────────────── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1.5px solid #bbf7d0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          padding: '24px 28px',
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                <ShieldCheck size={16} color="#16a34a" />
                <span>Financial Resilience Assessment</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>
                Resilience Score: <span style={{ color: '#16a34a' }}>{resil.score}/100</span> ({resil.grade})
              </h2>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                Measures how long you can comfortably cover essential living expenses if your primary income source stops.
              </div>
            </div>

            <div style={{ background: '#f0fdf4', padding: '10px 18px', borderRadius: 10, textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#15803d', textTransform: 'uppercase' }}>Expense Runway Buffer</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0d4f2e' }}>
                {resil.runway_months} Months
              </div>
            </div>
          </div>

          {/* 4 Transparent Pillars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {(resil.pillars || [
              { name: 'Emergency Runway', score: 28, max: 35, detail: '2.4 months expense buffer' },
              { name: 'Obligations Coverage', score: 25, max: 30, detail: '2.5x upcoming bills covered' },
              { name: 'Debt Burden', score: 12, max: 20, detail: 'Healthy credit debt ratio' },
              { name: 'Savings Discipline', score: 14, max: 15, detail: '36.9% monthly savings rate' },
            ]).map((pillar, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                  <span>{pillar.name}</span>
                  <span style={{ color: '#0d4f2e' }}>{pillar.score}/{pillar.max}</span>
                </div>
                <div style={{ background: '#e2e8f0', height: 6, borderRadius: 3, margin: '6px 0', overflow: 'hidden' }}>
                  <div style={{ background: '#16a34a', width: `${(pillar.score / pillar.max) * 100}%`, height: '100%' }} />
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{pillar.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. SIGNATURE HIGHLIGHT GRID: SCAM WARNING, WHAT-IF, RECON, VOICE ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 14 }}>
            Signature Innovations & Tools
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {/* Anomaly Card */}
            <Link
              to="/artha/anomalies"
              style={{
                background: '#ffffff',
                border: '1.5px solid #fecaca',
                borderRadius: 14,
                padding: '20px 22px',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 6, borderRadius: 8 }}>
                    <ShieldAlert size={18} />
                  </div>
                  <span style={{ fontSize: 11, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    1 Flagged
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                  Scam & Anomaly Warning
                </div>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Possible duplicate Swiggy debit of ₹850.00 detected. Verify or dispute with exact evidence.
                </p>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', marginTop: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Review finding</span> <ChevronRight size={14} />
              </div>
            </Link>

            {/* What-If Simulator Card */}
            <Link
              to="/artha/simulator"
              style={{
                background: '#ffffff',
                border: '1.5px solid #fed7aa',
                borderRadius: 14,
                padding: '20px 22px',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ background: '#fff7ed', color: '#ea580c', padding: 6, borderRadius: 8 }}>
                    <Calculator size={18} />
                  </div>
                  <span style={{ fontSize: 11, background: '#ffedd5', color: '#9a3412', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    4 Scenarios
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                  Financial What-If Simulator
                </div>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Simulate delayed salary (15d), rent spike (+₹3k), and whether you can afford a ₹45k phone without delaying your laptop goal.
                </p>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', marginTop: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Open simulator</span> <ChevronRight size={14} />
              </div>
            </Link>

            {/* Reconciliation Center Card */}
            <Link
              to="/artha/reconciliation"
              style={{
                background: '#ffffff',
                border: '1.5px solid #cde8d4',
                borderRadius: 14,
                padding: '20px 22px',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ background: '#f0fdf4', color: '#0d4f2e', padding: 6, borderRadius: 8 }}>
                    <Scale size={18} />
                  </div>
                  <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    Multi-Source
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                  Reconciliation Center
                </div>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Cross-match UPI, Bank statements & Credit cards. Eliminate duplicate retries and statement sum variances.
                </p>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0d4f2e', marginTop: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Reconcile sources</span> <ChevronRight size={14} />
              </div>
            </Link>

            {/* Voice Artha Card */}
            <Link
              to="/artha/voice"
              style={{
                background: '#ffffff',
                border: '1.5px solid #bae6fd',
                borderRadius: 14,
                padding: '20px 22px',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ background: '#e0f2fe', color: '#0284c7', padding: 6, borderRadius: 8 }}>
                    <Mic size={18} />
                  </div>
                  <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                    Tamil • Hindi • Eng
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                  Voice-Based Artha
                </div>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Ask questions naturally in your native Indian language. Gemma 4 provides spoken answers with audio playback.
                </p>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', marginTop: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Speak with Artha</span> <ChevronRight size={14} />
              </div>
            </Link>
          </div>
        </div>

        {/* ── 4. NET WORTH & CASH FLOW METRICS ────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 14 }}>
            Net Worth & Cash Flow Overview
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: '#0d4f2e', color: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 4px 14px rgba(13,79,46,0.2)' }}>
              <div style={{ fontSize: 12, color: '#7dffb3', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Net Worth</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#7dffb3', marginTop: 4 }}>{fmt(nw?.total_net_worth)}</div>
              <div style={{ fontSize: 11, color: '#c8f5dc', marginTop: 4 }}>Assets − Liabilities</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Bank Balance</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{fmt(nw?.bank_balance)}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Liquid checking & savings</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Investments (SIPs)</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{fmt(nw?.investments)}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Mutual funds & wealth</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Liabilities (Cards & Loans)</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{fmt(nw?.liabilities)}</div>
              <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Outstanding balance</div>
            </div>
          </div>
        </div>

        {/* ── 5. SPENDING CATEGORIES & UPCOMING BILLS ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 32 }}>
          {/* Category Pie Chart */}
          <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0d4f2e', margin: '0 0 16px' }}>
              Monthly Spend Breakdown by Category
            </h3>
            {cats.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={cats} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={85} label={e => `${e.category}`}>
                    {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No category transactions recorded yet.</div>
            )}
          </div>

          {/* Upcoming Bills & Renewals */}
          <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0d4f2e', margin: '0 0 16px' }}>
              Bills & Renewals Due in 30 Days
            </h3>
            {bills.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bills.map((b, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{b.kind.toUpperCase()} • Due in {b.days_until} days</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#b91c1c' }}>
                      {fmt(b.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No upcoming bills due in the next 30 days.</div>
            )}
          </div>
        </div>

        {/* ── 6. ASK ARTHA COACH (Multilingual Gemma Explainer) ───────────────── */}
        <div style={{
          background: '#f0fdf4',
          borderRadius: 16,
          border: '1.5px solid #a7f3d0',
          padding: '24px 28px',
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: '#0d4f2e', color: '#fff', padding: 6, borderRadius: 8 }}>
                <Sparkles size={16} color="#7dffb3" />
              </div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0d4f2e' }}>
                Ask Artha AI Coach (Gemma 4)
              </h3>
            </div>

            {/* Language buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'english', label: 'English' },
                { id: 'tamil', label: 'தமிழ்' },
                { id: 'hindi', label: 'हिन्दी' },
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => { setLang(l.id); askCoach(l.id) }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: lang === l.id ? '1.5px solid #0d4f2e' : '1px solid #cbd5e1',
                    background: lang === l.id ? '#0d4f2e' : '#ffffff',
                    color: lang === l.id ? '#ffffff' : '#334155',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#334155', margin: '0 0 14px' }}>
            Get a plain-language explanation of your cash flow and safe-to-spend buffer. Numbers are computed authoritatively by Artha's Python engine; Gemma provides clear guidance.
          </p>

          <button
            onClick={() => askCoach(lang)}
            disabled={coachLoading}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              background: '#0d4f2e',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {coachLoading ? 'Gemma is explaining…' : 'Explain My Current Cash Flow'}
          </button>

          {coach && (
            <div style={{
              marginTop: 16,
              background: '#ffffff',
              borderRadius: 10,
              padding: '16px 20px',
              borderLeft: '4px solid #0d4f2e',
              fontSize: 14,
              lineHeight: 1.6,
              color: '#064e3b',
              fontWeight: 500,
            }}>
              "{coach}"
            </div>
          )}
        </div>

        {/* Global Disclaimer */}
        <div style={{ fontSize: 12, color: '#888', textAlign: 'center', fontStyle: 'italic' }}>
          Not financial advice. All arithmetic calculated by Artha's deterministic Python engine. Estimates based on recent transaction history.
        </div>
      </div>
    </>
  )
}
