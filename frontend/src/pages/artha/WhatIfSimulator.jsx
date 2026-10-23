import React, { useState, useEffect } from 'react'
import Nav from '../../components/Nav'
import { simulateWhatIf } from '../../api'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend
} from 'recharts'
import {
  Calculator, Calendar, Home, PiggyBank, Smartphone,
  Sliders, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, TrendingUp
} from 'lucide-react'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function WhatIfSimulator() {
  const [activeScenario, setActiveScenario] = useState('salary_delay')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  // Interactive slider parameters
  const [delayDays, setDelayDays] = useState(15)
  const [rentIncrease, setRentIncrease] = useState(3000)
  const [extraSavings, setExtraSavings] = useState(2000)
  const [phonePrice, setPhonePrice] = useState(45000)
  const [itemName, setItemName] = useState('Smartphone')

  const runSimulation = async (scenario, params) => {
    setLoading(true)
    try {
      const res = await simulateWhatIf(scenario, params)
      setData(res.data)
    } catch (err) {
      console.error('Failed to simulate what-if:', err)
    } finally {
      setLoading(false)
    }
  }

  // Run on scenario change or parameter update
  useEffect(() => {
    if (activeScenario === 'salary_delay') {
      runSimulation('salary_delay', { delay_days: delayDays })
    } else if (activeScenario === 'rent_increase') {
      runSimulation('rent_increase', { rent_increase: rentIncrease })
    } else if (activeScenario === 'save_more') {
      runSimulation('save_more', { extra_savings: extraSavings })
    } else if (activeScenario === 'phone_purchase') {
      runSimulation('phone_purchase', { purchase_price: phonePrice, item_name: itemName })
    }
  }, [activeScenario, delayDays, rentIncrease, extraSavings, phonePrice, itemName])

  const scenarioTabs = [
    { id: 'salary_delay', label: 'Salary Delayed by 15 Days', icon: Calendar, color: '#f59e0b' },
    { id: 'rent_increase', label: 'Rent Increases by ₹3,000', icon: Home, color: '#ef4444' },
    { id: 'save_more', label: 'Save ₹2,000 More Monthly', icon: PiggyBank, color: '#10b981' },
    { id: 'phone_purchase', label: 'Afford ₹45,000 Phone vs Goal', icon: Smartphone, color: '#6366f1' },
  ]

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(125,255,179,0.15)',
            color: '#0d4f2e',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            <Sparkles size={15} color="#0d4f2e" />
            <span>Deterministic Scenario Modeling</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0d4f2e', margin: '4px 0 8px' }}>
            Financial What-If Simulator
          </h1>
          <p style={{ color: '#475569', fontSize: 15, maxWidth: 780, lineHeight: 1.5 }}>
            Explore critical financial decisions before committing money. Compare side-by-side cash flow projections and understand the exact trade-offs on your existing savings goals.
          </p>
        </div>

        {/* Preset Scenario Nav Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}>
          {scenarioTabs.map(t => {
            const Icon = t.icon
            const isActive = activeScenario === t.id
            return (
              <div
                key={t.id}
                onClick={() => setActiveScenario(t.id)}
                style={{
                  background: isActive ? '#0d4f2e' : '#ffffff',
                  color: isActive ? '#ffffff' : '#0f172a',
                  border: isActive ? '1.5px solid #0d4f2e' : '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '16px 20px',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 8px 24px rgba(13,79,46,0.2)' : '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  padding: 10,
                  borderRadius: 10,
                }}>
                  <Icon size={20} color={isActive ? '#7dffb3' : t.color} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: isActive ? '#c8f5dc' : '#64748b', marginTop: 2 }}>
                    Click to simulate
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Scenario Content Body ─────────────────────────────────────────── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          padding: '28px 32px',
        }}>
          {/* ── 1. SALARY DELAY SCENARIO ───────────────────────────────────────── */}
          {activeScenario === 'salary_delay' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d4f2e', margin: 0 }}>
                    “What if my salary is delayed by {delayDays} days?”
                  </h2>
                  <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
                    Simulating daily cash balance buffer between Day 10 (scheduled date) and Day {10 + delayDays}.
                  </p>
                </div>

                {/* Slider */}
                <div style={{ background: '#f8fafc', padding: '10px 18px', borderRadius: 10, border: '1px solid #e2e8f0', minWidth: 260 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                    <span>Delay duration:</span>
                    <span style={{ color: '#f59e0b', fontWeight: 800 }}>{delayDays} Days</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    step="1"
                    value={delayDays}
                    onChange={e => setDelayDays(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                    <span>On-time (0d)</span>
                    <span>15 days</span>
                    <span>45 days</span>
                  </div>
                </div>
              </div>

              {/* Verdict Banner */}
              <div style={{
                background: data?.is_runway_safe ? '#f0fdf4' : '#fffbeb',
                borderLeft: `4px solid ${data?.is_runway_safe ? '#16a34a' : '#f59e0b'}`,
                padding: '14px 18px',
                borderRadius: '0 10px 10px 0',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                {data?.is_runway_safe ? (
                  <CheckCircle2 size={24} color="#16a34a" />
                ) : (
                  <AlertTriangle size={24} color="#f59e0b" />
                )}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: data?.is_runway_safe ? '#15803d' : '#b45309' }}>
                    Simulation Verdict: {data?.is_runway_safe ? 'Safe Buffer Available' : 'Cash Buffer Warning'}
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                    {data?.verdict}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Lowest Account Balance</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0d4f2e', marginTop: 4 }}>
                    {fmt(data?.min_balance_reached)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>During delay window</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Maximum Cash Dip</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                    −{fmt(data?.lowest_dip_amount)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Absorbed by liquid funds</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Upcoming EMI & Rent</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
                    {fmt(24200)}
                  </div>
                  <div style={{ fontSize: 11, color: '#16a34a' }}>✓ Automatically covered</div>
                </div>
              </div>

              {/* Day-by-Day Area Chart */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                  Side-by-Side 45-Day Account Balance Projection
                </div>
                <div style={{ height: 280, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.projection_curve || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `₹${v/1000}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => fmt(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="baseline" name="Baseline (On-Time Salary)" stroke="#16a34a" fill="rgba(22,163,74,0.15)" strokeWidth={2} />
                      <Area type="monotone" dataKey="delayed" name={`Delayed by ${delayDays} Days`} stroke="#f59e0b" fill="rgba(245,158,11,0.2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. RENT INCREASE SCENARIO ─────────────────────────────────────── */}
          {activeScenario === 'rent_increase' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d4f2e', margin: 0 }}>
                    “What if my rent increases by {fmt(rentIncrease)}?”
                  </h2>
                  <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
                    Assessing monthly savings rate reduction and timeline impact on your <strong>{data?.goal_name || 'Laptop'}</strong> goal.
                  </p>
                </div>

                {/* Slider */}
                <div style={{ background: '#f8fafc', padding: '10px 18px', borderRadius: 10, border: '1px solid #e2e8f0', minWidth: 260 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                    <span>Monthly increase:</span>
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>+{fmt(rentIncrease)}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={rentIncrease}
                    onChange={e => setRentIncrease(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                    <span>₹500</span>
                    <span>₹3,000</span>
                    <span>₹10,000</span>
                  </div>
                </div>
              </div>

              {/* Verdict Banner */}
              <div style={{
                background: '#fff1f2',
                borderLeft: '4px solid #ef4444',
                padding: '14px 18px',
                borderRadius: '0 10px 10px 0',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <TrendingUp size={24} color="#ef4444" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>
                    Cumulative Impact: −{fmt(data?.annual_impact)} per year
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                    {data?.verdict}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Baseline Savings Rate</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
                    {data?.base_savings_rate}%
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Current performance</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>New Savings Rate</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
                    {data?.new_savings_rate}%
                  </div>
                  <div style={{ fontSize: 11, color: '#ef4444' }}>−{Math.round((data?.base_savings_rate - data?.new_savings_rate)*10)/10}% drop</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>{data?.goal_name} Goal Delay</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                    +{data?.goal_completion_delay_months} Months
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Target completion pushes back</div>
                </div>
              </div>

              {/* 12-Month Accumulation Chart */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                  12-Month Cumulative Wealth Accumulation: Baseline vs With Rent Hike
                </div>
                <div style={{ height: 280, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.projection_curve || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `₹${v/1000}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => fmt(v)} />
                      <Legend />
                      <Bar dataKey="baseline_savings" name="Baseline Accumulation" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="adjusted_savings" name={`With +₹${rentIncrease} Rent`} fill="#f87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. SAVE MORE SCENARIO ─────────────────────────────────────────── */}
          {activeScenario === 'save_more' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d4f2e', margin: 0 }}>
                    “What if I save {fmt(extraSavings)} more every month?”
                  </h2>
                  <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
                    Simulating accelerated compounding and earlier completion of your <strong>{data?.goal_name || 'Laptop'}</strong> goal.
                  </p>
                </div>

                {/* Slider */}
                <div style={{ background: '#f8fafc', padding: '10px 18px', borderRadius: 10, border: '1px solid #e2e8f0', minWidth: 260 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                    <span>Extra monthly savings:</span>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>+{fmt(extraSavings)}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={extraSavings}
                    onChange={e => setExtraSavings(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                    <span>₹500</span>
                    <span>₹2,000</span>
                    <span>₹10,000</span>
                  </div>
                </div>
              </div>

              {/* Verdict Banner */}
              <div style={{
                background: '#f0fdf4',
                borderLeft: '4px solid #16a34a',
                padding: '14px 18px',
                borderRadius: '0 10px 10px 0',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <CheckCircle2 size={24} color="#16a34a" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>
                    +{fmt(data?.annual_extra)} Extra Capital Added in Year 1
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                    {data?.verdict}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Boosted Savings Rate</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
                    {data?.new_savings_rate}%
                  </div>
                  <div style={{ fontSize: 11, color: '#16a34a' }}>Up from 36.9%</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Goal Accelerated By</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0d4f2e', marginTop: 4 }}>
                    {data?.months_saved} Months Earlier
                  </div>
                  <div style={{ fontSize: 11, color: '#16a34a' }}>Fast-tracks {data?.goal_name} target</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Yearly Surplus Added</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                    +{fmt(data?.annual_extra)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Expands emergency runway</div>
                </div>
              </div>

              {/* Chart */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                  Wealth Growth Curve with Boosted Monthly Savings
                </div>
                <div style={{ height: 280, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.projection_curve || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `₹${v/1000}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => fmt(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="baseline_savings" name="Baseline Trajectory" stroke="#94a3b8" fill="rgba(148,163,184,0.15)" />
                      <Area type="monotone" dataKey="boosted_savings" name={`Boosted (+₹${extraSavings}/mo)`} stroke="#10b981" fill="rgba(16,185,129,0.2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. PHONE PURCHASE VS LAPTOP GOAL SCENARIO ──────────────────────── */}
          {activeScenario === 'phone_purchase' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0d4f2e', margin: 0 }}>
                    “Can I afford a {fmt(phonePrice)} {itemName} without delaying my {data?.goal_name || 'Laptop'} goal?”
                  </h2>
                  <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
                    Comparing cash purchase vs 6-month EMI vs waiting until your savings goal finishes.
                  </p>
                </div>

                {/* Slider */}
                <div style={{ background: '#f8fafc', padding: '10px 18px', borderRadius: 10, border: '1px solid #e2e8f0', minWidth: 260 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                    <span>Purchase Price:</span>
                    <span style={{ color: '#6366f1', fontWeight: 800 }}>{fmt(phonePrice)}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="100000"
                    step="5000"
                    value={phonePrice}
                    onChange={e => setPhonePrice(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                    <span>₹10,000</span>
                    <span>₹45,000</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>
              </div>

              {/* Recommendation Callout */}
              <div style={{
                background: '#eef2ff',
                borderLeft: '4px solid #6366f1',
                padding: '16px 20px',
                borderRadius: '0 10px 10px 0',
                marginBottom: 24,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', marginBottom: 4 }}>
                  Artha Trade-Off Analysis & Recommendation
                </div>
                <div style={{ fontSize: 14, color: '#1e1b4b', lineHeight: 1.5 }}>
                  {data?.recommendation}
                </div>
              </div>

              {/* 3 Pathway Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                {/* Option 1: Cash */}
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #fed7aa',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>
                    Option 1: Pay Upfront Cash
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
                    −{fmt(phonePrice)} Immediate
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                    Laptop Goal Delay: <strong style={{ color: '#ea580c' }}>+{data?.cash_delay_months} Months</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, background: '#fff7ed', padding: 10, borderRadius: 6 }}>
                    Reduces liquid savings immediately. Your target completion moves from April 2027 to July 2027.
                  </div>
                </div>

                {/* Option 2: 6-Month EMI */}
                <div style={{
                  background: '#f0fdf4',
                  border: '2px solid #22c55e',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 4px 16px rgba(34,197,94,0.15)',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute',
                    top: -10,
                    right: 14,
                    background: '#16a34a',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    Recommended
                  </span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                    Option 2: 6-Month Split (No-Cost EMI)
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
                    {fmt(data?.emi_option?.monthly_emi)} / month
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                    Laptop Goal Delay: <strong style={{ color: '#16a34a' }}>Only ~18 days</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.5, background: '#dcfce7', padding: 10, borderRadius: 6 }}>
                    Monthly surplus remains healthy. You achieve your primary laptop milestone with virtually zero disruption.
                  </div>
                </div>

                {/* Option 3: Wait */}
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Option 3: Postpone After Laptop
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>
                    Buy in May 2027
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                    Laptop Goal Delay: <strong style={{ color: '#16a34a' }}>0 Days (On Time)</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: 10, borderRadius: 6 }}>
                    Guarantees laptop target is completed by April 2027. Then allocate full surplus toward phone purchase.
                  </div>
                </div>
              </div>

              {/* Side-by-Side Summary Table */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Side-by-Side Decision Comparison
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '8px 10px' }}>Strategy</th>
                      <th style={{ padding: '8px 10px' }}>Laptop Goal ETA</th>
                      <th style={{ padding: '8px 10px' }}>Liquid Buffer Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.side_by_side || []).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>{row.option}</td>
                        <td style={{ padding: '8px 10px', color: '#0d4f2e', fontWeight: 600 }}>{row.goal_eta}</td>
                        <td style={{ padding: '8px 10px', color: '#475569' }}>{row.liquid_cushion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
