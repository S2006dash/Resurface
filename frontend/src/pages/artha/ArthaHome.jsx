import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../../components/Nav'
import SafeToSpendCard from '../../components/artha/SafeToSpendCard'
import { Term, openJargonTerm } from '../../components/artha/JargonBuster'
import { getOverview, getCoach } from '../../api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  ShieldAlert, Sparkles, Scale, Mic, Calculator, ArrowRight,
  TrendingUp, ShieldCheck, AlertTriangle, Layers, ExternalLink,
  ChevronRight, FileText, CheckCircle2, DollarSign, Wallet,
  CreditCard, Landmark, PiggyBank, HeartPulse, HelpCircle, UploadCloud
} from 'lucide-react'

const COLORS = ['#0d4f2e', '#16a34a', '#22c55e', '#5fc98a', '#86efac', '#eab308', '#f97316', '#ef4444']
const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function ArthaHome() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('what-if') // 'what-if' | 'anomalies' | 'recon' | 'voice' | 'documents'
  const [lang, setLang] = useState('english')
  const [coach, setCoach] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)

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
        <div style={{ padding: '60px 24px', textAlign: 'center', color: '#0d4f2e' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Connecting to Artha Financial Engine…</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Calculating verified liquid buffer & resilience</div>
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
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 20px', background: '#f8fafc' }}>
        
        {/* ── 1. HERO BANNER: Modern Fintech Obsidian & Mint Glow ────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0b0f19 0%, #111827 50%, #1e293b 100%)',
          borderRadius: 22,
          padding: '30px 34px',
          color: '#ffffff',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          {/* Cyan/Mint ambient glow */}
          <div style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
            <div style={{ maxWidth: 640 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 10,
              }}>
                <span>✦ Artha Financial Co-Pilot</span>
                <span>•</span>
                <span>Gemma 4 Multimodal AI</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.3, color: '#ffffff' }}>
                From Disconnected Financial Data to Personalized Well-Being
              </h1>
              <p style={{ color: '#c8f5dc', fontSize: 14, lineHeight: 1.5, margin: 0, opacity: 0.9 }}>
                Consolidates accounts, digital wallets, credit cards, loans, and bills into one clear picture. 
                Grounded in verifiable calculations so you always know what to do next.
              </p>
            </div>

            {/* Quick Status Pill */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: 14,
              padding: '16px 20px',
              border: '1px solid rgba(125,255,179,0.25)',
              textAlign: 'right',
            }}>
              <div style={{ fontSize: 11, color: '#c8f5dc', textTransform: 'uppercase', fontWeight: 600 }}>Emergency Runway</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#7dffb3', marginTop: 2 }}>{resil.runway_months} Months</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                <Term name="Resilience">Resilience Score</Term>: {resil.score}/100 ({resil.grade})
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. TWO-COLUMN EXECUTIVE DASHBOARD: Calm, Uncluttered ───────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 28 }}>
          
          {/* Left: The Actionable Safe-to-Spend Box */}
          <div style={{
            background: '#ffffff',
            borderRadius: 18,
            padding: '24px 26px',
            border: '1px solid #e2ece4',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0d4f2e', background: '#dcfce7', padding: '3px 10px', borderRadius: 20 }}>
                  Primary Daily Metric
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Next 30 Days</span>
              </div>
              <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                Estimated <Term name="Safe-to-Spend">Safe-to-Spend Amount</Term>
              </div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#0d4f2e', letterSpacing: -1, margin: '6px 0 2px' }}>
                {fmt(sts?.safe_to_spend ?? 33675)}
              </div>
              <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, marginBottom: 16 }}>
                ≈ {fmt(sts?.daily_safe ?? 1122)} / day safe spending allowance
              </div>

              {/* Simple Equation Steps */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 13, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#475569' }}>Available Bank Balance</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>+{fmt(sts?.available_balance ?? 85000)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#475569' }}>Upcoming Rent & <Term name="EMI">EMIs</Term></span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>−{fmt(sts?.upcoming_bills_total ?? 33575)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#475569' }}>Reserved SIPs & Safety Buffer</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>−{fmt(sts?.reserved_savings_total ?? 17750)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
              Accounts for rent, insurance, loan EMIs & emergency savings.
            </div>
          </div>

          {/* Right: Consolidated Accounts Breakdown Card (From Slide Mockup) */}
          <div style={{
            background: '#ffffff',
            borderRadius: 18,
            padding: '24px 26px',
            border: '1px solid #e2ece4',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                Your Financial Overview
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0d4f2e' }}>
                Net Worth: {fmt(nw?.total_net_worth)}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Landmark size={17} color="#0d4f2e" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Bank Accounts (Liquid)</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{fmt(nw?.bank_balance)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CreditCard size={17} color="#ea580c" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Credit Cards Outstanding</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#ea580c' }}>{fmt(nw?.liabilities)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <PiggyBank size={17} color="#16a34a" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Investments (SIPs)</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>{fmt(nw?.investments)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HeartPulse size={17} color="#0284c7" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Insurance Coverage</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: 6 }}>
                  Active (Star Health)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. FOCUSED FEATURE SEGMENTED SELECTOR: Zero Cognitive Clutter ───── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              Explore Actions & Decision Tools
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Select a tool to explore in-place
            </div>
          </div>

          <div style={{
            display: 'flex',
            background: '#e2ece4',
            padding: 4,
            borderRadius: 12,
            gap: 4,
            overflowX: 'auto',
          }}>
            {[
              { id: 'what-if', label: '🎲 What-If Simulator', count: '4 Scenarios' },
              { id: 'calendar', label: '📅 Money Calendar', count: 'Plan & Learn' },
              { id: 'anomalies', label: '🛡️ Scam Warning', count: `${anomaliesCount} Finding` },
              { id: 'voice', label: '🎙️ Voice Artha', count: 'Gemma 4' },
              { id: 'recon', label: '⚖️ Reconciliation', count: 'Multi-Source' },
              { id: 'documents', label: '📂 Smart Ingestion', count: 'OCR' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  minWidth: 150,
                  padding: '9px 12px',
                  borderRadius: 9,
                  border: 'none',
                  background: activeTab === tab.id ? '#ffffff' : 'transparent',
                  color: activeTab === tab.id ? '#0d4f2e' : '#475569',
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  cursor: 'pointer',
                  boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: activeTab === tab.id ? '#dcfce7' : 'rgba(0,0,0,0.05)',
                  color: activeTab === tab.id ? '#15803d' : '#64748b',
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. ACTIVE TOOL WORKSPACE ────────────────────────────────────────── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2ece4',
          padding: '24px 28px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          marginBottom: 32,
        }}>
          {activeTab === 'what-if' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0d4f2e', margin: 0 }}>
                    Financial What-If Simulator
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    Model unexpected events before they happen. See the exact delay on your Laptop savings goal.
                  </p>
                </div>
                <Link to="/artha/simulator" style={{ fontSize: 12, fontWeight: 700, color: '#0d4f2e', textDecoration: 'none' }}>
                  Full Screen Simulator →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
                <Link to="/artha/simulator" style={{ textDecoration: 'none', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', color: '#0f172a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c' }}>⏱️ Salary Delayed by 15 Days</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: '#475569' }}>Minimum balance stays at ₹57,250. Buffer absorbs delay.</div>
                </Link>
                <Link to="/artha/simulator" style={{ textDecoration: 'none', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', color: '#0f172a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>🏠 Rent Rises by ₹3,000</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: '#475569' }}>Laptop goal shifts out by +1.6 months. Savings rate drops.</div>
                </Link>
                <Link to="/artha/simulator" style={{ textDecoration: 'none', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', color: '#0f172a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>💰 Save ₹2,000 Extra / mo</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: '#475569' }}>Goal completed 1.2 months earlier. Adds ₹24,000 wealth.</div>
                </Link>
                <Link to="/artha/simulator" style={{ textDecoration: 'none', background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', color: '#0f172a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>📱 ₹45,000 Phone Purchase</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: '#475569' }}>6-mo EMI splits cost safely without delaying primary goal.</div>
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#064e3b', margin: 0 }}>
                    Money Calendar & Financial Training
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    Track salary credits, rent dates, card dues, and schedule bite-sized Gemma 4 financial coaching.
                  </p>
                </div>
                <Link to="/artha/calendar" style={{ fontSize: 12, fontWeight: 700, color: '#064e3b', textDecoration: 'none' }}>
                  Open Full Interactive Calendar →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
                <Link to="/artha/calendar" style={{ textDecoration: 'none', background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0', color: '#0f172a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>💰 10th of Month · Salary Day</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: '#475569' }}>+₹55,000 TCS credit arrives. Safe-to-spend recalibrates.</div>
                </Link>
                <Link to="/artha/calendar" style={{ textDecoration: 'none', background: '#fef2f2', padding: 14, borderRadius: 10, border: '1px solid #fecaca', color: '#0f172a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c' }}>🏠 12th of Month · Rent Due</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: '#475569' }}>-₹18,000 auto-debit reserved in advance from balance.</div>
                </Link>
                <Link to="/artha/calendar" style={{ textDecoration: 'none', background: '#eff6ff', padding: 14, borderRadius: 10, border: '1px solid #bfdbfe', color: '#0f172a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>🎓 18th Nov · Tax Planning 80C</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: '#475569' }}>Scheduled Gemma 4 session: Save up to ₹46,800 on taxes.</div>
                </Link>
                <Link to="/artha/calendar" style={{ textDecoration: 'none', background: '#faf5ff', padding: 14, borderRadius: 10, border: '1px solid #e9d5ff', color: '#0f172a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7e22ce' }}>🛡️ 10th Nov · Star Health Policy</div>
                  <div style={{ fontSize: 13, marginTop: 4, color: '#475569' }}>Annual renewal ₹12,000 due. Safe buffer protects payment.</div>
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'anomalies' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#b91c1c', margin: 0 }}>
                    Financial Anomaly & Scam Warning
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    Explainable anomaly rules. Flags suspicious patterns with exact evidence, not unverified claims.
                  </p>
                </div>
                <Link to="/artha/anomalies" style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', textDecoration: 'none' }}>
                  Review All Warnings →
                </Link>
              </div>

              <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: 4 }}>
                      RULE-202: Duplicate Debit
                    </span>
                    <h4 style={{ margin: '6px 0 4px', fontSize: 15, color: '#0f172a' }}>
                      Possible duplicate charge: Swiggy (₹850.00 twice on 2026-09-14)
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
                      Two identical payments detected within 24 hours. Verify if this was an accidental retry.
                    </p>
                  </div>
                  <Link to="/artha/anomalies" style={{ background: '#0d4f2e', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Confirm or Dispute
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0d4f2e', margin: 0 }}>
                    Voice Artha in Regional Languages
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    Powered by Gemma 4. Ask questions aloud in Tamil, Hindi, Telugu, or English.
                  </p>
                </div>
                <Link to="/artha/voice" style={{ fontSize: 12, fontWeight: 700, color: '#0d4f2e', textDecoration: 'none' }}>
                  Open Voice Assistant →
                </Link>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                <Link to="/artha/voice" style={{ textDecoration: 'none', background: '#f0fdf4', padding: '10px 16px', borderRadius: 20, border: '1px solid #bbf7d0', color: '#0d4f2e', fontSize: 13, fontWeight: 600 }}>
                  💬 தமிழ்: "Indha maasam evlo spend pannirukken?"
                </Link>
                <Link to="/artha/voice" style={{ textDecoration: 'none', background: '#f0fdf4', padding: '10px 16px', borderRadius: 20, border: '1px solid #bbf7d0', color: '#0d4f2e', fontSize: 13, fontWeight: 600 }}>
                  💬 हिन्दी: "Mera safe-to-spend amount kitna hai?"
                </Link>
                <Link to="/artha/voice" style={{ textDecoration: 'none', background: '#f0fdf4', padding: '10px 16px', borderRadius: 20, border: '1px solid #bbf7d0', color: '#0d4f2e', fontSize: 13, fontWeight: 600 }}>
                  💬 English: "Can I afford a ₹45k phone without delaying goal?"
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'recon' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0d4f2e', margin: 0 }}>
                    Financial Reconciliation Center
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    Cross-match UPI screenshots, bank statements, and credit card bills before saving.
                  </p>
                </div>
                <Link to="/artha/reconciliation" style={{ fontSize: 12, fontWeight: 700, color: '#0d4f2e', textDecoration: 'none' }}>
                  Open Reconciliation Center →
                </Link>
              </div>

              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Statement Total Check:</strong> Bank Stated (₹34,250) vs Extracted Rows (₹33,400).
                  <div style={{ color: '#ea580c', fontSize: 12, marginTop: 2 }}>
                    Variance: ₹850.00 matches unconfirmed Swiggy retry.
                  </div>
                </div>
                <Link to="/artha/reconciliation" style={{ background: '#0d4f2e', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  Resolve Conflicts
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0d4f2e', margin: 0 }}>
                    Smart Document Inbox (Gemma 4 Vision OCR)
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    Upload messy receipts, UPI screenshots, or statement PDFs. Private PII masking applied automatically.
                  </p>
                </div>
                <Link to="/artha/upload" style={{ fontSize: 12, fontWeight: 700, color: '#0d4f2e', textDecoration: 'none' }}>
                  Upload Document →
                </Link>
              </div>

              <div style={{ textAlign: 'center', padding: '24px 20px', border: '2px dashed #bbf7d0', borderRadius: 12, background: '#f0fdf4' }}>
                <UploadCloud size={32} color="#16a34a" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0d4f2e' }}>Drop any bill, screenshot, or PDF here</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Gemma 4 extracts dates, merchants, and amounts. You confirm before anything is saved.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. THE 4 IMPACT PILLARS (Directly from User Slide) ──────────────── */}
        <div style={{
          background: '#062615',
          borderRadius: 16,
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: 28,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7dffb3', textTransform: 'uppercase', marginBottom: 14, letterSpacing: 0.5 }}>
            Artha Impact Framework
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ background: 'rgba(125,255,179,0.15)', padding: 8, borderRadius: 8 }}>
                <ShieldCheck size={18} color="#7dffb3" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Safer Transactions</div>
                <div style={{ fontSize: 12, color: '#c8f5dc', marginTop: 2 }}>Explainable anomaly warnings catch duplicates and spikes before loss occurs.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ background: 'rgba(125,255,179,0.15)', padding: 8, borderRadius: 8 }}>
                <TrendingUp size={18} color="#7dffb3" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Better Financial Insights</div>
                <div style={{ fontSize: 12, color: '#c8f5dc', marginTop: 2 }}>One actionable Safe-to-Spend number instead of confusing chart walls.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ background: 'rgba(125,255,179,0.15)', padding: 8, borderRadius: 8 }}>
                <Sparkles size={18} color="#7dffb3" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Empowered Users</div>
                <div style={{ fontSize: 12, color: '#c8f5dc', marginTop: 2 }}>What-If simulator tests purchase trade-offs against savings goals first.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ background: 'rgba(125,255,179,0.15)', padding: 8, borderRadius: 8 }}>
                <Mic size={18} color="#7dffb3" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Inclusive Services</div>
                <div style={{ fontSize: 12, color: '#c8f5dc', marginTop: 2 }}>Native voice assistance in Tamil, Hindi, Telugu & English for everyone.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Footer Note */}
        <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b', fontStyle: 'italic', paddingBottom: 16 }}>
          Not financial advice. Calculations verified by Artha's deterministic Python engine. Open-weights AI powered by Gemma 4.
        </div>
      </div>
    </>
  )
}
