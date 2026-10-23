import React, { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import { getHistory } from '../api'

const S = {
  page: { padding: 32 },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#0d4f2e' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff',
           borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.07)' },
  th: { background: '#0d4f2e', color: '#fff', padding: '12px 16px', textAlign: 'left', fontSize: 13 },
  td: { padding: '10px 16px', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
}

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) }

export default function History() {
  const [txns, setTxns]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory(50).then(r => setTxns(r.data.transactions || [])).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Nav />
      <div style={S.page}>
        <h1 style={S.h1}>Transaction History</h1>
        {loading ? <p>Loading…</p> : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Date','From','To','Amount','Type','Description'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.transaction_id}>
                  <td style={S.td}>{t.transaction_date?.slice(0,10)}</td>
                  <td style={S.td}>{t.from_account}</td>
                  <td style={S.td}>{t.to_account}</td>
                  <td style={S.td}>{fmt(t.amount)}</td>
                  <td style={S.td}>{t.transaction_type}</td>
                  <td style={S.td}>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
