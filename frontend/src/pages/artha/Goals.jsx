import React, { useEffect, useState } from 'react'
import Nav from '../../components/Nav'
import { getGoals, createGoal, simulateGoal } from '../../api'

const fmt = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

const S = {
  page: { padding: 32 },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#0d4f2e' },
  sub: { color: '#4a7a5a', fontSize: 14, marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20, marginBottom: 32 },
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,.07)' },
  goalName: { fontSize: 17, fontWeight: 700, color: '#0d4f2e', marginBottom: 4 },
  goalMeta: { fontSize: 13, color: '#666', marginBottom: 12 },
  simBtn: { padding: '8px 16px', background: '#0d4f2e', color: '#fff', border: 'none',
             borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  simResult: { marginTop: 12, padding: '12px 16px', background: '#f0faf4',
               borderRadius: 8, fontSize: 13 },
  probBig: { fontSize: 32, fontWeight: 800, color: '#0d4f2e' },
  slider: { width: '100%', marginTop: 8, accentColor: '#0d4f2e' },
  sliderLabel: { fontSize: 12, color: '#666', marginBottom: 4, marginTop: 10 },
  form: { background: '#fff', borderRadius: 12, padding: '20px 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,.07)', maxWidth: 420 },
  label: { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 },
  input: { width: '100%', padding: '9px 12px', borderRadius: 7, border: '1.5px solid #cde8d4',
           fontSize: 13, marginBottom: 14 },
  addBtn: { padding: '10px 22px', background: '#0d4f2e', color: '#fff', border: 'none',
             borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  disclaimer: { fontSize: 12, color: '#888', marginTop: 24, fontStyle: 'italic' },
}

function GoalCard({ goal, onSim }) {
  const [sim, setSim]         = useState(null)
  const [loading, setLoading] = useState(false)
  const [foodCut, setFoodCut] = useState(0)

  const simulate = async () => {
    setLoading(true)
    try {
      const whatIfs = foodCut > 0 ? { Food: -foodCut } : {}
      const r = await simulateGoal(goal.goal_id, whatIfs)
      setSim(r.data)
    } finally { setLoading(false) }
  }

  return (
    <div style={S.card}>
      <div style={S.goalName}>{goal.name}</div>
      <div style={S.goalMeta}>
        Target: {fmt(goal.target_amount)} · Deadline: {goal.deadline}
      </div>
      <button style={S.simBtn} onClick={simulate} disabled={loading}>
        {loading ? 'Simulating…' : '🎲 Simulate odds'}
      </button>

      {sim && (
        <div style={S.simResult}>
          <div style={S.probBig}>{sim.success_probability}%</div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>chance of reaching your goal</div>
          <div>Monthly savings: {fmt(sim.base_monthly_savings)}</div>
          <div>Projected: {fmt(sim.projected_savings)} in {sim.months_left} months</div>

          <div style={S.sliderLabel}>What if you cut Food spending by {fmt(foodCut)}/month?</div>
          <input type="range" min={0} max={3000} step={100} value={foodCut}
                 style={S.slider} onChange={e => setFoodCut(Number(e.target.value))} />
          {foodCut > 0 && (
            <button style={{ ...S.simBtn, marginTop: 8 }} onClick={simulate}>
              Recalculate
            </button>
          )}
          <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
            {sim.note}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Goals() {
  const [goals, setGoals]     = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName]       = useState('')
  const [target, setTarget]   = useState('')
  const [deadline, setDeadline] = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    getGoals().then(r => setGoals(r.data.goals || [])).finally(() => setLoading(false))
  }, [])

  const addGoal = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createGoal({ name, target_amount: parseFloat(target), deadline })
      const r = await getGoals()
      setGoals(r.data.goals || [])
      setName(''); setTarget(''); setDeadline('')
    } finally { setSaving(false) }
  }

  return (
    <>
      <Nav />
      <div style={S.page}>
        <h1 style={S.h1}>Goals</h1>
        <p style={S.sub}>Set a savings goal and simulate your odds with honest Monte Carlo estimates.</p>

        {loading ? <p>Loading…</p> : (
          <div style={S.grid}>
            {goals.map(g => <GoalCard key={g.goal_id} goal={g} />)}
          </div>
        )}

        <h2 style={{ ...S.h1, fontSize: 17, marginBottom: 14 }}>Add a new goal</h2>
        <form style={S.form} onSubmit={addGoal}>
          <label style={S.label}>Goal name</label>
          <input style={S.input} value={name} onChange={e => setName(e.target.value)}
                 placeholder="e.g. Laptop" required />
          <label style={S.label}>Target amount (₹)</label>
          <input style={S.input} type="number" min="1" value={target}
                 onChange={e => setTarget(e.target.value)} placeholder="60000" required />
          <label style={S.label}>Deadline</label>
          <input style={S.input} type="date" value={deadline}
                 onChange={e => setDeadline(e.target.value)} required />
          <button style={S.addBtn} disabled={saving}>{saving ? 'Saving…' : 'Add goal'}</button>
        </form>

        <div style={S.disclaimer}>
          Not financial advice. Odds are Monte Carlo estimates from your recent savings history.
          Results depend on future behaviour and may not reflect actual outcomes.
        </div>
      </div>
    </>
  )
}
