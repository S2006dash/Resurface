import React, { useEffect, useState } from 'react'
import Nav from '../../components/Nav'
import { getInsights, getTransactions } from '../../api'

const TYPE_ICON = {
  recurring_subscription: '🔄',
  possible_duplicate:     '⚠️',
  spending_spike:         '📈',
  card_near_limit:        '💳',
}

const fmt = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })

const S = {
  page: { padding: 32 },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#0d4f2e' },
  sub: { color: '#4a7a5a', fontSize: 14, marginBottom: 24 },
  card: {
    background: '#fff', borderRadius: 12, padding: '18px 22px',
    boxShadow: '0 2px 12px rgba(0,0,0,.07)', marginBottom: 16, cursor: 'pointer',
    borderLeft: '4px solid #2ea862', transition: 'box-shadow .15s',
  },
  cardTitle: { fontWeight: 700, fontSize: 15, marginBottom: 4 },
  cardReason: { fontSize: 13, color: '#555', marginBottom: 6 },
  cardAction: { fontSize: 13, color: '#0d4f2e', fontWeight: 500 },
  icon: { marginRight: 8 },
  drawer: {
    background: '#f0faf4', borderRadius: 10, padding: '16px 20px', marginTop: 10,
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 13 },
  th: { borderBottom: '2px solid #cde8d4', padding: '6px 10px', textAlign: 'left', color: '#0d4f2e' },
  td: { borderBottom: '1px solid #f0f0f0', padding: '6px 10px' },
  empty: { color: '#888', fontStyle: 'italic', padding: '32px 0' },
}

export default function Insights() {
  const [findings, setFindings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [open, setOpen]           = useState(null)       // finding id with open drawer
  const [drawerRows, setDrawerRows] = useState([])
  const [drawerLoading, setDrawerLoading] = useState(false)

  useEffect(() => {
    getInsights()
      .then(r => setFindings(r.data.findings || []))
      .finally(() => setLoading(false))
  }, [])

  const toggleDrawer = async (finding) => {
    if (open === finding.id) { setOpen(null); return }
    setOpen(finding.id)
    setDrawerRows([])
    if (!finding.proof_row_ids?.length) return
    setDrawerLoading(true)
    try {
      const r = await getTransactions({ finding_id: finding.proof_row_ids.join(',') })
      setDrawerRows(r.data.transactions || [])
    } finally { setDrawerLoading(false) }
  }

  return (
    <>
      <Nav />
      <div style={S.page}>
        <h1 style={S.h1}>Financial Insights</h1>
        <p style={S.sub}>Tap any finding to see the exact transactions behind it.</p>

        {loading ? <p>Loading…</p> : findings.length === 0 ? (
          <p style={S.empty}>No findings yet. Upload some statements to get insights.</p>
        ) : (
          findings.map(f => (
            <div key={f.id} style={S.card} onClick={() => toggleDrawer(f)}>
              <div style={S.cardTitle}>
                <span style={S.icon}>{TYPE_ICON[f.type] || '💡'}</span>
                {f.title}
              </div>
              <div style={S.cardReason}>{f.reason}</div>
              <div style={S.cardAction}>→ {f.action}</div>

              {open === f.id && (
                <div style={S.drawer} onClick={e => e.stopPropagation()}>
                  {drawerLoading ? <p>Loading proof rows…</p> : (
                    drawerRows.length === 0 ? <p style={{ fontSize: 13, color: '#888' }}>No ledger rows to show.</p> : (
                      <table style={S.table}>
                        <thead>
                          <tr>
                            {['Date','Merchant','Amount','Direction','Category','Confidence'].map(h => (
                              <th key={h} style={S.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {drawerRows.map(row => (
                            <tr key={row.entry_id}>
                              <td style={S.td}>{row.entry_date}</td>
                              <td style={S.td}>{row.merchant}</td>
                              <td style={S.td}>{fmt(row.amount)}</td>
                              <td style={S.td}>{row.direction}</td>
                              <td style={S.td}>{row.category}</td>
                              <td style={S.td}>{(row.confidence * 100).toFixed(0)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}
