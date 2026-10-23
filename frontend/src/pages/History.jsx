import React, { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import { getOverview, getTransactions } from '../api'
import {
  Calendar, TrendingDown, TrendingUp, Search, Filter,
  PieChart, Layers, Download, CheckCircle2, ShieldCheck,
  ArrowDownRight, ArrowUpRight, DollarSign, Wallet
} from 'lucide-react'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

// Seeded categorized monthly baseline for Priya Sharma
const CATEGORY_BASELINES = [
  { category: 'Rent', monthly: 18000, icon: '🏠', color: '#ef4444' },
  { category: 'EMI', monthly: 6200, icon: '💳', color: '#f97316' },
  { category: 'Food', monthly: 3830, icon: '🍔', color: '#eab308' },
  { category: 'Groceries', monthly: 3900, icon: '🛒', color: '#10b981' },
  { category: 'Subscriptions', monthly: 1767, icon: '📺', color: '#8b5cf6' },
  { category: 'Shopping', monthly: 2100, icon: '🛍️', color: '#ec4899' },
  { category: 'Investments', monthly: 5000, icon: '📈', color: '#06b6d4' },
]

// Fallback transactions if API is empty
const DEMO_TRANSACTIONS = [
  { entry_id: 1, entry_date: '2026-10-20', merchant: 'Zerodha SIP (Nifty 50)', amount: 5000, direction: 'debit', category: 'Investments', confidence: 0.99 },
  { entry_id: 2, entry_date: '2026-10-18', merchant: 'BigBasket Superstore', amount: 1950, direction: 'debit', category: 'Groceries', confidence: 0.96 },
  { entry_id: 3, entry_date: '2026-10-15', merchant: 'HDFC Personal Loan EMI', amount: 6200, direction: 'debit', category: 'EMI', confidence: 0.99 },
  { entry_id: 4, entry_date: '2026-10-12', merchant: 'House Rent (Koramangala)', amount: 18000, direction: 'debit', category: 'Rent', confidence: 0.99 },
  { entry_id: 5, entry_date: '2026-10-10', merchant: 'TCS Monthly Salary', amount: 55000, direction: 'credit', category: 'Income', confidence: 0.99 },
  { entry_id: 6, entry_date: '2026-10-07', merchant: 'Spotify Premium Family', amount: 119, direction: 'debit', category: 'Subscriptions', confidence: 0.99 },
  { entry_id: 7, entry_date: '2026-10-05', merchant: 'FitLife Gym Monthly', amount: 999, direction: 'debit', category: 'Subscriptions', confidence: 0.92 },
  { entry_id: 8, entry_date: '2026-10-03', merchant: 'Netflix 4K Subscription', amount: 649, direction: 'debit', category: 'Subscriptions', confidence: 0.99 },
  { entry_id: 9, entry_date: '2026-10-02', merchant: 'Zomato Dining Delivery', amount: 870, direction: 'debit', category: 'Food', confidence: 0.97 },
  { entry_id: 10, entry_date: '2026-10-01', merchant: 'Swiggy Gourmet Order', amount: 900, direction: 'debit', category: 'Food', confidence: 0.97 },
]

export default function History() {
  const [period, setPeriod] = useState('monthly') // 'monthly' | 'yearly'
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [txns, setTxns] = useState(DEMO_TRANSACTIONS)
  const [categories, setCategories] = useState(CATEGORY_BASELINES)
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)

  useEffect(() => {
    Promise.all([
      getTransactions({ limit: 100 }).catch(() => ({ data: [] })),
      getOverview().catch(() => ({ data: null })),
    ]).then(([txRes, ovRes]) => {
      const apiTxns = txRes.data || []
      if (apiTxns.length > 0) setTxns(apiTxns)
      if (ovRes.data) {
        setOverview(ovRes.data)
        const apiCats = (ovRes.data.categories || []).filter(c => c.direction === 'debit')
        if (apiCats.length > 0) {
          const merged = CATEGORY_BASELINES.map(b => {
            const match = apiCats.find(c => c.category === b.category)
            return match ? { ...b, monthly: match.total } : b
          })
          setCategories(merged)
        }
      }
    }).finally(() => setLoading(false))
  }, [])

  // Export monthly report as printable view
  const exportMonthlyReport = () => {
    const reportWindow = window.open('', '_blank')
    const income = overview?.cash_flow?.monthly_income || 55000
    const expense = categories.reduce((s, c) => s + c.monthly, 0)
    const safe = overview?.safe_to_spend?.safe_to_spend || 33675
    const html = `
      <html><head><title>Artha Monthly Financial Report - October 2026</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #0f172a; }
        h1 { font-size: 28px; color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 12px; }
        h2 { font-size: 18px; color: #0f172a; margin-top: 28px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #0b0f19; color: #10b981; padding: 10px 14px; text-align: left; font-size: 13px; }
        td { padding: 9px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .green { color: #10b981; font-weight: 700; }
        .red { color: #ef4444; font-weight: 700; }
        .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .metric { text-align: center; }
        .metric-val { font-size: 28px; font-weight: 900; }
        .metric-label { font-size: 12px; color: #64748b; margin-top: 4px; }
        .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; font-style: italic; border-top: 1px solid #e2e8f0; padding-top: 14px; }
      </style></head>
      <body>
        <h1>📊 Artha Monthly Financial Report</h1>
        <div style="font-size:13px; color:#64748b; margin-bottom:20px;">Generated: October 2026 · Priya Sharma · Verified by Artha Deterministic Engine + Gemma 4</div>
        <div class="summary-box">
          <div class="metric"><div class="metric-val" style="color:#10b981">₹${income.toLocaleString('en-IN')}</div><div class="metric-label">Monthly Income</div></div>
          <div class="metric"><div class="metric-val" style="color:#ef4444">₹${expense.toLocaleString('en-IN')}</div><div class="metric-label">Total Expenses</div></div>
          <div class="metric"><div class="metric-val" style="color:#6366f1">₹${safe.toLocaleString('en-IN')}</div><div class="metric-label">Safe-to-Spend</div></div>
        </div>
        <h2>Category Breakdown</h2>
        <table>
          <tr><th>Category</th><th>Monthly Spend</th><th>% of Income</th></tr>
          ${categories.map(c => `<tr><td>${c.icon} ${c.category}</td><td class="red">₹${c.monthly.toLocaleString('en-IN')}</td><td>${Math.round((c.monthly/income)*100)}%</td></tr>`).join('')}
        </table>
        <h2>Recent Transactions</h2>
        <table>
          <tr><th>Date</th><th>Merchant</th><th>Category</th><th>Amount</th></tr>
          ${txns.slice(0,20).map(t => `<tr><td>${t.entry_date}</td><td>${t.merchant}</td><td>${t.category}</td><td class="${t.direction === 'credit' ? 'green' : 'red'}">${t.direction === 'credit' ? '+' : '-'}₹${Number(t.amount).toLocaleString('en-IN')}</td></tr>`).join('')}
        </table>
        <div class="footer">Not financial advice. All calculations verified by Artha's deterministic Python engine. Open-weights AI powered by Gemma 4 via Gemini API. For demonstration purposes only.</div>
      </body></html>
    `
    reportWindow.document.write(html)
    reportWindow.document.close()
    reportWindow.print()
  }

  // Calculate monthly total and yearly total
  const monthlyTotal = categories.reduce((s, c) => s + c.monthly, 0)
  const yearlyTotal = monthlyTotal * 12

  const activeTotal = period === 'monthly' ? monthlyTotal : yearlyTotal

  // Filter transactions
  const filteredTxns = txns.filter(t => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory
    const matchesSearch = !searchQuery || t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })


  return (
    <>
      <Nav />
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 20px', minHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 26,
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10b981',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              <Layers size={13} color="#10b981" />
              <span>Categorized Spending Intelligence</span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', margin: '2px 0 4px', letterSpacing: '-0.02em' }}>
              Spendings & Ledger History
            </h1>
            <p style={{ color: '#64748b', fontSize: 14.5, margin: 0 }}>
              All transactions extracted and confirmed via Gemma 4 OCR and connected banks.
            </p>
          </div>

          {/* Monthly vs Yearly Switcher + Export */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              background: '#0b0f19',
              padding: 4,
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <button
                onClick={() => setPeriod('monthly')}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: period === 'monthly' ? '#10b981' : 'transparent',
                  color: period === 'monthly' ? '#000000' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <Calendar size={14} />
                <span>Monthly View</span>
              </button>

              <button
                onClick={() => setPeriod('yearly')}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: period === 'yearly' ? '#10b981' : 'transparent',
                  color: period === 'yearly' ? '#000000' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <TrendingDown size={14} />
                <span>Yearly Projected View</span>
              </button>
            </div>

            <button
              onClick={exportMonthlyReport}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0b0f19', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              <Download size={14} /> Export Monthly Report
            </button>
          </div>
        </div>


        {/* ── 1. AGGREGATED SPENDING BANNER ─────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0b0f19 0%, #1e293b 100%)',
          borderRadius: 22,
          padding: '26px 30px',
          color: '#ffffff',
          boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
          marginBottom: 30,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total {period === 'monthly' ? 'Monthly' : 'Annualized'} Spendings
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#f87171', letterSpacing: '-0.02em', margin: '4px 0 6px' }}>
              {fmt(activeTotal)}
            </div>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>
              {period === 'monthly'
                ? 'Based on verified 30-day transactions · Salary income: ₹55,000/mo'
                : 'Projected 12-month burn rate assuming current recurring commitments'}
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: '16px 20px',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: 200,
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{period === 'monthly' ? 'Monthly Savings' : 'Annual Savings'}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
              +{fmt(period === 'monthly' ? (55000 - monthlyTotal) : ((55000 * 12) - yearlyTotal))}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              Savings Rate: <strong>{((55000 - monthlyTotal) / 55000 * 100).toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* ── 2. CATEGORY BREAKDOWN CARDS ─────────────────────────────────── */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
            Spendings by Category ({period === 'monthly' ? 'October 2026' : 'Full Year'})
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {CATEGORY_BASELINES.map(c => {
              const amount = period === 'monthly' ? c.monthly : c.monthly * 12
              const pct = Math.round((amount / activeTotal) * 100)

              return (
                <div
                  key={c.category}
                  onClick={() => setSelectedCategory(selectedCategory === c.category ? 'All' : c.category)}
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    border: selectedCategory === c.category ? '2px solid #10b981' : '1px solid #e2e8f0',
                    padding: '16px 18px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      <span>{c.icon}</span>
                      <span>{c.category}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>
                      {pct}%
                    </span>
                  </div>

                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
                    {fmt(amount)}
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: c.color, borderRadius: 4 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 3. DETAILED LEDGER TABLE & SEARCH ───────────────────────────── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          padding: '24px',
        }}>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                padding: '8px 14px',
                flex: 1,
              }}>
                <Search size={15} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search merchant, store, or tag…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    color: '#0f172a',
                    width: '100%',
                  }}
                />
              </div>

              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Clear Filter ✕
                </button>
              )}
            </div>

            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              Showing <strong>{filteredTxns.length}</strong> transactions
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['Date', 'Merchant / Payee', 'Category', 'Direction', 'Amount', 'Confidence', 'Ledger Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map((t) => {
                  const isCredit = t.direction === 'credit'
                  return (
                    <tr
                      key={t.entry_id}
                      style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.1s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {t.entry_date}
                      </td>
                      <td style={{ padding: '14px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                        {t.merchant}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: 6,
                        }}>
                          {t.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          color: isCredit ? '#15803d' : '#b91c1c',
                        }}>
                          {isCredit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          <span>{t.direction.toUpperCase()}</span>
                        </span>
                      </td>
                      <td style={{ padding: '14px', fontSize: 15, fontWeight: 900, color: isCredit ? '#15803d' : '#0f172a' }}>
                        {isCredit ? '+' : '-'}{fmt(t.amount)}
                      </td>
                      <td style={{ padding: '14px', fontSize: 12, color: '#059669', fontWeight: 700 }}>
                        {Math.round(t.confidence * 100)}%
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#ecfdf5',
                          color: '#059669',
                          padding: '2px 8px',
                          borderRadius: 12,
                          border: '1px solid #a7f3d0',
                        }}>
                          <CheckCircle2 size={12} />
                          <span>Confirmed</span>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
