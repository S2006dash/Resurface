import React, { useState, useEffect } from 'react'
import { ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Info, Sparkles, Sliders } from 'lucide-react'
import { getSafeToSpend } from '../../api'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function SafeToSpendCard({ initialData, onBufferChange }) {
  const [data, setData] = useState(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [bufferPct, setBufferPct] = useState(0.15)
  const [showDrawer, setShowDrawer] = useState(false)

  const fetchSafeToSpend = async (buf) => {
    try {
      setLoading(true)
      const res = await getSafeToSpend(buf)
      setData(res.data)
      if (onBufferChange) onBufferChange(res.data)
    } catch (err) {
      console.error('Error fetching safe to spend:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialData) {
      fetchSafeToSpend(bufferPct)
    } else {
      setData(initialData)
    }
  }, [initialData])

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value)
    setBufferPct(val)
    fetchSafeToSpend(val)
  }

  const safeAmt = data?.safe_to_spend ?? 33675
  const dailyAmt = data?.daily_safe ?? Math.round(safeAmt / 30)
  const liquidAmt = data?.available_balance ?? 85000
  const billsTotal = data?.upcoming_bills_total ?? 33575
  const reserveTotal = data?.reserved_savings_total ?? 17750

  const bills = data?.breakdown?.bills || [
    { title: 'Upcoming House Rent', amount: 18000, due_date: 'Due in 12 days' },
    { title: 'Star Health Insurance Renewal', amount: 12000, due_date: 'Due in 18 days' },
    { title: 'Credit Card Minimum Due (5%)', amount: 3575, due_date: 'Due in 13 days' },
  ]

  const reserves = data?.breakdown?.reserves || [
    { title: 'Committed Monthly SIPs', amount: 5000 },
    { title: `Safety Buffer (${Math.round(bufferPct * 100)}% Emergency Cushion)`, amount: Math.round(liquidAmt * bufferPct) },
  ]

  return (
    <div style={{
      background: 'linear-gradient(135deg, #062615 0%, #0d4f2e 50%, #125735 100%)',
      borderRadius: 18,
      padding: '28px 32px',
      color: '#fff',
      boxShadow: '0 12px 32px rgba(6, 38, 21, 0.35)',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(125, 255, 179, 0.25)',
      marginBottom: 32,
    }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: -60,
        right: -60,
        width: 220,
        height: 220,
        background: 'radial-gradient(circle, rgba(125,255,179,0.18) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Top Banner Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(125, 255, 179, 0.15)',
          padding: '4px 12px',
          borderRadius: 20,
          border: '1px solid rgba(125, 255, 179, 0.3)',
          fontSize: 12,
          fontWeight: 700,
          color: '#7dffb3',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>
          <ShieldCheck size={15} />
          <span>Actionable Safe-to-Spend Metric</span>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
          Updated for next 30 days
        </span>
      </div>

      {/* Main Number + Subtitle */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
        <div>
          <div style={{ fontSize: 14, color: '#c8f5dc', fontWeight: 500, marginBottom: 4 }}>
            Estimated Safe-to-Spend Amount
          </div>
          <div style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#7dffb3',
            letterSpacing: -1,
            lineHeight: 1,
            textShadow: '0 2px 10px rgba(125,255,179,0.3)',
          }}>
            {fmt(safeAmt)}
          </div>
          <div style={{ fontSize: 14, color: '#e2f9ed', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>≈ <strong>{fmt(dailyAmt)}/day</strong> safe daily allowance</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: '#a7f3d0' }}>Accounts for bills, rent, EMIs & emergency cushion</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
          }}
        >
          <Info size={15} color="#7dffb3" />
          <span>{showDrawer ? 'Hide Calculation' : 'Show Me Why'}</span>
          {showDrawer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Transparent Equation Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginTop: 24,
        paddingTop: 20,
        borderTop: '1px solid rgba(255,255,255,0.15)',
      }}>
        <div style={{ background: 'rgba(255,255,255,0.07)', padding: '12px 16px', borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: '#c8f5dc', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Available Liquid Balance
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>
            +{fmt(liquidAmt)}
          </div>
        </div>

        <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px 16px', borderRadius: 10, borderLeft: '3px solid #ef4444' }}>
          <div style={{ fontSize: 11, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Upcoming Bills & Essentials
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fca5a5', marginTop: 2 }}>
            −{fmt(billsTotal)}
          </div>
        </div>

        <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px 16px', borderRadius: 10, borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: 11, color: '#fde68a', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Reserved Savings & Buffer
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fde68a', marginTop: 2 }}>
            −{fmt(reserveTotal)}
          </div>
        </div>

        <div style={{ background: 'rgba(125, 255, 179, 0.15)', padding: '12px 16px', borderRadius: 10, borderLeft: '3px solid #7dffb3' }}>
          <div style={{ fontSize: 11, color: '#7dffb3', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            = Estimated Safe-to-Spend
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#7dffb3', marginTop: 2 }}>
            {fmt(safeAmt)}
          </div>
        </div>
      </div>

      {/* Expandable "Show Me Why" Line-Item Drawer */}
      {showDrawer && (
        <div style={{
          marginTop: 20,
          background: 'rgba(0, 20, 10, 0.5)',
          borderRadius: 12,
          padding: 20,
          border: '1px solid rgba(125,255,179,0.2)',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {/* Buffer Control Slider */}
          <div style={{ marginBottom: 18, background: 'rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#c8f5dc', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={14} color="#7dffb3" />
                <span>Adjust Emergency Buffer Cushion: {Math.round(bufferPct * 100)}%</span>
              </span>
              <span style={{ fontSize: 12, color: '#7dffb3', fontWeight: 700 }}>
                {fmt(Math.round(liquidAmt * bufferPct))} reserved
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.05"
              value={bufferPct}
              onChange={handleSliderChange}
              style={{ width: '100%', accentColor: '#7dffb3', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              <span>5% (Aggressive)</span>
              <span>15% (Recommended)</span>
              <span>30% (Conservative)</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Bills Breakdown */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', marginBottom: 8 }}>
                Deducted Upcoming Bills ({bills.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {bills.map((b, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{b.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{b.due_date}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#fca5a5' }}>−{fmt(b.amount)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reserves Breakdown */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fde68a', textTransform: 'uppercase', marginBottom: 8 }}>
                Deducted Reserved Commitments ({reserves.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {reserves.map((r, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Auto-transferred to wealth</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#fde68a' }}>−{fmt(r.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', marginTop: 16 }}>
        Illustrative calculation only; actual results depend on complete and up-to-date financial data.
      </div>
    </div>
  )
}
