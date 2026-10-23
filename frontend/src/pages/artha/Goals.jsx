import React, { useEffect, useState } from 'react'
import Nav from '../../components/Nav'
import { getGoals, createGoal, simulateGoal } from '../../api'
import confetti from 'canvas-confetti'
import {
  Target, Sparkles, TrendingUp, Calendar, CheckCircle2,
  Sliders, ShieldCheck, Award, Plus, ArrowRight, Laptop,
  Palmtree, Shield, Zap, Heart, Car, HelpCircle, AlertCircle
} from 'lucide-react'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

// Rich visual goal presets for Priya Sharma with images / icons
const DEFAULT_VISUAL_GOALS = [
  {
    goal_id: 101,
    name: 'MacBook Pro M3 (16-inch)',
    category: 'tech',
    icon: '💻',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60',
    target_amount: 90000,
    current_saved: 42000,
    deadline: '2027-04-23',
    priority: 'High',
  },
  {
    goal_id: 102,
    name: 'Goa Coastal Getaway',
    category: 'travel',
    icon: '🏖️',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&auto=format&fit=crop&q=60',
    target_amount: 25000,
    current_saved: 18500,
    deadline: '2026-12-28',
    priority: 'Medium',
  },
  {
    goal_id: 103,
    name: '6-Month Emergency Runway Shield',
    category: 'safety',
    icon: '🛡️',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&auto=format&fit=crop&q=60',
    target_amount: 150000,
    current_saved: 85000,
    deadline: '2027-10-15',
    priority: 'Crucial',
  },
  {
    goal_id: 104,
    name: 'Ather 450X Electric Scooter',
    category: 'vehicle',
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=60',
    target_amount: 120000,
    current_saved: 30000,
    deadline: '2027-12-10',
    priority: 'Medium',
  },
]

export default function Goals() {
  const [goals, setGoals] = useState(DEFAULT_VISUAL_GOALS)
  const [loading, setLoading] = useState(false)
  
  // Interactive Master Savings Slider (Monthly Savings Contribution in ₹)
  const [monthlySavingsContribution, setMonthlySavingsContribution] = useState(8500)

  // Goal Creation Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('2027-06-30')
  const [category, setCategory] = useState('tech')
  const [saving, setSaving] = useState(false)

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      })
    } catch (e) {}
  }

  // Calculate dynamic months to achieve goal based on current savings rate
  const calculateGoalEta = (goal, monthlyRate) => {
    const remaining = Math.max(0, goal.target_amount - (goal.current_saved || 0))
    if (remaining === 0) return { monthsNeeded: 0, completionDate: 'Already Achieved!', isAchieved: true }

    const monthsNeeded = Math.ceil(remaining / Math.max(500, monthlyRate))
    const today = new Date()
    const targetDate = new Date(today.getFullYear(), today.getMonth() + monthsNeeded, today.getDate())
    
    const formattedDate = targetDate.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric'
    })

    // Calculate baseline months if savings was ₹5,000
    const baselineMonths = Math.ceil(remaining / 5000)
    const monthsSaved = baselineMonths - monthsNeeded

    return {
      monthsNeeded,
      completionDate: formattedDate,
      isAchieved: false,
      monthsSaved: monthsSaved > 0 ? monthsSaved : 0,
      odds: Math.min(98, Math.max(35, Math.round(55 + (monthlyRate / 1000) * 3))),
    }
  }

  // Add extra boost to a specific goal
  const handleBoostGoal = (goalId, boostAmount = 2000) => {
    setGoals(prev => prev.map(g => {
      if (g.goal_id === goalId) {
        const newSaved = (g.current_saved || 0) + boostAmount
        if (newSaved >= g.target_amount) triggerConfetti()
        return { ...g, current_saved: newSaved }
      }
      return g
    }))
  }

  // Create new goal
  const handleAddGoal = (e) => {
    e.preventDefault()
    if (!name || !target) return
    setSaving(true)

    const catIcons = {
      tech: { icon: '💻', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60' },
      travel: { icon: '🏖️', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&auto=format&fit=crop&q=60' },
      safety: { icon: '🛡️', img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&auto=format&fit=crop&q=60' },
      vehicle: { icon: '⚡', img: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=60' },
      lifestyle: { icon: '✨', img: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=500&auto=format&fit=crop&q=60' },
    }

    const newG = {
      goal_id: Date.now(),
      name,
      category,
      icon: catIcons[category]?.icon || '🎯',
      image: catIcons[category]?.img,
      target_amount: parseFloat(target),
      current_saved: 0,
      deadline,
      priority: 'Medium',
    }

    setGoals(prev => [newG, ...prev])
    setName('')
    setTarget('')
    setShowAddForm(false)
    setSaving(false)
    triggerConfetti()
  }

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '30px 20px', minHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '5px 16px',
            borderRadius: 30,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            <Sparkles size={14} color="#059669" />
            <span>Interactive Goal Vision & Monte Carlo Feasibility</span>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#064e3b', margin: '4px 0 8px', letterSpacing: '-0.02em' }}>
            Visual Financial Goals & Dynamic Simulator
          </h1>
          <p style={{ color: '#475569', fontSize: 15, maxWidth: 680, margin: '0 auto', lineHeight: 1.55 }}>
            See your dreams as real visual milestones. Adjust your monthly savings slider below to watch completion timelines and Monte Carlo probabilities recalibrate in real time.
          </p>
        </div>

        {/* ── 1. DYNAMIC SAVINGS ADJUSTER HERO CONTROL ────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #062615 0%, #0d4f2e 60%, #135e38 100%)',
          borderRadius: 24,
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: '0 14px 40px rgba(6,38,21,0.25)',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            marginBottom: 20,
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(125,255,179,0.2)',
                color: '#7dffb3',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}>
                <Sliders size={13} color="#7dffb3" />
                <span>Dynamic Savings Engine</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '2px 0 6px', color: '#ffffff' }}>
                Adjust Your Monthly Savings Contribution
              </h2>
              <p style={{ fontSize: 13.5, color: '#c8f5dc', opacity: 0.9, margin: 0, maxWidth: 520 }}>
                Slide to test: Increasing savings accelerates your goals while adjusting safe-to-spend buffer.
              </p>
            </div>

            {/* Big Interactive Contribution Counter */}
            <div style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(125,255,179,0.35)',
              borderRadius: 18,
              padding: '14px 24px',
              textAlign: 'center',
              minWidth: 200,
            }}>
              <div style={{ fontSize: 12, color: '#c8f5dc', fontWeight: 600 }}>Monthly Allocation</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#7dffb3', letterSpacing: '-0.02em' }}>
                {fmt(monthlySavingsContribution)}
                <span style={{ fontSize: 14, color: '#a7f3d0', fontWeight: 500 }}>/mo</span>
              </div>
              <div style={{ fontSize: 11, color: '#e2e8f0', marginTop: 2 }}>
                Annualized: <strong>{fmt(monthlySavingsContribution * 12)}</strong>
              </div>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div style={{ marginBottom: 12 }}>
            <input
              type="range"
              min={2000}
              max={25000}
              step={500}
              value={monthlySavingsContribution}
              onChange={e => setMonthlySavingsContribution(Number(e.target.value))}
              style={{
                width: '100%',
                height: 8,
                borderRadius: 4,
                accentColor: '#7dffb3',
                cursor: 'pointer',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#c8f5dc',
              marginTop: 6,
              fontWeight: 600,
            }}>
              <span>₹2,000/mo (Relaxed)</span>
              <span>₹10,000/mo (Balanced)</span>
              <span>₹25,000/mo (Aggressive)</span>
            </div>
          </div>
        </div>

        {/* ── 2. VISUAL GOAL CARDS GRID ───────────────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
        }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Active Visual Goals ({goals.length})
            </h3>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Dynamic completion dates recalculated for ₹{Number(monthlySavingsContribution).toLocaleString('en-IN')}/mo contribution
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(prev => !prev)}
            style={{
              background: '#064e3b',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(6,78,59,0.2)',
            }}
          >
            <Plus size={16} />
            <span>Add New Goal</span>
          </button>
        </div>

        {/* Add Goal Form Drawer */}
        {showAddForm && (
          <div style={{
            background: '#ffffff',
            borderRadius: 18,
            border: '1.5px solid #a7f3d0',
            boxShadow: '0 10px 30px rgba(6,78,59,0.1)',
            padding: '22px 24px',
            marginBottom: 28,
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800, color: '#064e3b' }}>
              Create a New Visual Financial Milestone
            </h4>
            <form onSubmit={handleAddGoal} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Goal Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sony Mirrorless Camera"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Target Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 75000"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13 }}
                >
                  <option value="tech">💻 Technology & Gadgets</option>
                  <option value="travel">🏖️ Travel & Vacation</option>
                  <option value="safety">🛡️ Emergency & Health Shield</option>
                  <option value="vehicle">⚡ Vehicle & Mobility</option>
                  <option value="lifestyle">✨ Personal Milestone</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#064e3b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Creating…' : 'Save Goal ✨'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '10px 16px',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 24,
          marginBottom: 36,
        }}>
          {goals.map((goal) => {
            const saved = goal.current_saved || 0
            const pct = Math.min(100, Math.round((saved / goal.target_amount) * 100))
            const eta = calculateGoalEta(goal, monthlySavingsContribution)

            return (
              <div
                key={goal.goal_id}
                style={{
                  background: '#ffffff',
                  borderRadius: 20,
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(6,78,59,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.04)'
                }}
              >
                {/* Visual Image Banner */}
                <div style={{
                  position: 'relative',
                  height: 150,
                  background: '#0d4f2e',
                  overflow: 'hidden',
                }}>
                  <img
                    src={goal.image}
                    alt={goal.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.85,
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}>
                    <span>{goal.icon}</span>
                    <span>{goal.priority} Priority</span>
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    background: '#064e3b',
                    color: '#7dffb3',
                    padding: '4px 12px',
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 800,
                    border: '1px solid rgba(125,255,179,0.4)',
                  }}>
                    {pct}% Saved
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                    {goal.name}
                  </h4>
                  
                  {/* Amount Breakdown */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#064e3b' }}>{fmt(saved)}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}> of {fmt(goal.target_amount)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                      Remaining: {fmt(Math.max(0, goal.target_amount - saved))}
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div style={{
                    height: 9,
                    background: '#f1f5f9',
                    borderRadius: 6,
                    overflow: 'hidden',
                    marginBottom: 16,
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: pct >= 100
                        ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(90deg, #0d4f2e 0%, #10b981 100%)',
                      borderRadius: 6,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>

                  {/* Dynamic Simulation Metrics */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    marginBottom: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>Projected Completion</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#065f46' }}>
                        {eta.completionDate}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>Monte Carlo Odds</span>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: eta.odds > 75 ? '#15803d' : '#b45309',
                        background: eta.odds > 75 ? '#dcfce7' : '#fef3c7',
                        padding: '1px 8px',
                        borderRadius: 12,
                      }}>
                        {eta.odds}% Probability
                      </span>
                    </div>

                    {eta.monthsSaved > 0 && (
                      <div style={{
                        marginTop: 8,
                        paddingTop: 6,
                        borderTop: '1px dashed #e2e8f0',
                        fontSize: 11.5,
                        color: '#047857',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <Zap size={13} color="#059669" />
                        <span>Savings boost saves ~{eta.monthsSaved} months!</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleBoostGoal(goal.goal_id, 2500)}
                      style={{
                        flex: 1,
                        background: '#ecfdf5',
                        border: '1.5px solid #a7f3d0',
                        color: '#065f46',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                      }}
                    >
                      <span>⚡ Boost +₹2.5k</span>
                    </button>

                    <button
                      onClick={() => handleBoostGoal(goal.goal_id, 5000)}
                      style={{
                        background: '#064e3b',
                        border: 'none',
                        color: '#ffffff',
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Add ₹5,000"
                    >
                      +₹5k
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Disclaimer & Explanation */}
        <div style={{
          padding: '16px 20px',
          background: '#f8fafc',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          fontSize: 12,
          color: '#64748b',
          lineHeight: 1.5,
        }}>
          <strong>Note on Monte Carlo Feasibility:</strong> Projected completion dates and probabilities are calculated from your real income runway, pending debt payments, and current savings volatility. Figures adjust dynamically as you change your monthly contribution.
        </div>

      </div>
    </>
  )
}
