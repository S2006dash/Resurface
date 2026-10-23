import React, { useState, useRef } from 'react'
import Nav from '../../components/Nav'
import { uploadFile, uploadText, confirmRows } from '../../api'

const S = {
  page: { padding: 32, maxWidth: 900 },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#0d4f2e' },
  sub: { color: '#4a7a5a', fontSize: 14, marginBottom: 24 },
  dropzone: {
    border: '2px dashed #2ea862', borderRadius: 12, padding: 32, textAlign: 'center',
    cursor: 'pointer', background: '#f0faf4', marginBottom: 16, color: '#0d4f2e',
  },
  textarea: { width: '100%', minHeight: 100, borderRadius: 8, border: '1.5px solid #cde8d4',
              padding: 12, fontSize: 13, marginBottom: 12 },
  btn: { padding: '10px 24px', background: '#0d4f2e', color: '#fff', border: 'none',
         borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', marginRight: 8 },
  btnGhost: { padding: '10px 24px', background: 'transparent', color: '#0d4f2e',
              border: '1.5px solid #0d4f2e', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff',
           borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.07)', marginTop: 20 },
  th: { background: '#0d4f2e', color: '#fff', padding: '10px 14px', textAlign: 'left', fontSize: 12 },
  td: (flag) => ({
    padding: '9px 14px', borderBottom: '1px solid #f0f0f0', fontSize: 13,
    background: flag ? '#fffbea' : '#fff',
  }),
  badge: { fontSize: 11, background: '#ffd54f', color: '#7a5700', padding: '2px 6px', borderRadius: 4 },
  check: { padding: 16, background: '#f0faf4', borderRadius: 10, marginTop: 16, fontSize: 13 },
  success: { padding: 16, background: '#d4edda', borderRadius: 10, marginTop: 16, color: '#155724' },
  error: { padding: 12, background: '#f8d7da', borderRadius: 10, marginTop: 12, color: '#721c24', fontSize: 13 },
}

const fmt = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export default function Upload() {
  const [tab, setTab]       = useState('file')   // 'file' | 'text'
  const [pastedText, setPastedText] = useState('')
  const [docType, setDocType] = useState('upi_screenshot')
  const [loading, setLoading] = useState(false)
  const [result, setResult]  = useState(null)   // { doc_type, provider, rows, checks }
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError]    = useState('')
  const fileRef = useRef()

  const handleFileDrop = async (e) => {
    e.preventDefault()
    const file = e.dataTransfer?.files[0] || e.target.files[0]
    if (!file) return
    setError(''); setLoading(true); setResult(null); setConfirmed(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('doc_type', docType)
      const r = await uploadFile(fd)
      setResult(r.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally { setLoading(false) }
  }

  const handleTextUpload = async () => {
    if (!pastedText.trim()) return
    setError(''); setLoading(true); setResult(null); setConfirmed(false)
    try {
      const r = await uploadText(pastedText, docType)
      setResult(r.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally { setLoading(false) }
  }

  const handleConfirm = async () => {
    if (!result) return
    setLoading(true)
    try {
      await confirmRows(result.doc_type, result.provider, result.rows)
      setConfirmed(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Confirm failed')
    } finally { setLoading(false) }
  }

  const rows = result?.rows || []
  const checks = result?.checks || {}

  return (
    <>
      <Nav />
      <div style={S.page}>
        <h1 style={S.h1}>Upload Financial Document</h1>
        <p style={S.sub}>Upload a screenshot, PDF, or paste SMS text. Gemma 4 reads it — you review before anything is saved.</p>

        {/* Doc type selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, marginRight: 8 }}>Document type:</label>
          <select value={docType} onChange={e => setDocType(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #cde8d4', fontSize: 13 }}>
            <option value="upi_screenshot">UPI Screenshot</option>
            <option value="bank_pdf">Bank Statement PDF</option>
            <option value="card_pdf">Credit Card PDF</option>
            <option value="loan_screenshot">Loan Screenshot</option>
            <option value="policy_photo">Insurance Policy Photo</option>
            <option value="sms_text">SMS Text</option>
          </select>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['file','text'].map(t => (
            <button key={t} onClick={() => setTab(t)}
                    style={{ ...S.btn, background: tab===t ? '#0d4f2e' : '#e8f5ee', color: tab===t ? '#fff' : '#0d4f2e' }}>
              {t === 'file' ? '📁 File / Image' : '📋 Paste Text'}
            </button>
          ))}
        </div>

        {tab === 'file' ? (
          <div style={S.dropzone}
               onDrop={handleFileDrop}
               onDragOver={e => e.preventDefault()}
               onClick={() => fileRef.current.click()}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <div>Drag & drop an image or PDF here, or click to browse</div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display:'none' }} onChange={handleFileDrop} />
          </div>
        ) : (
          <>
            <textarea style={S.textarea} placeholder="Paste SMS text or transaction data here…"
                      value={pastedText} onChange={e => setPastedText(e.target.value)} />
            <button style={S.btn} onClick={handleTextUpload} disabled={loading}>
              {loading ? 'Reading…' : 'Read with Gemma 4'}
            </button>
          </>
        )}

        {loading && <div style={{ marginTop: 16, color: '#0d4f2e' }}>Gemma 4 is reading your document…</div>}
        {error && <div style={S.error}>{error}</div>}

        {/* Checks summary */}
        {result && (
          <div style={S.check}>
            <strong>Checks:</strong>{' '}
            {checks.reconciles === null ? 'No balance provided (skip reconciliation)' :
             checks.reconciles ? '✅ Statement adds up' : '⚠️ Statement does NOT add up — review carefully'}
            {checks.duplicates > 0 && <span style={{ marginLeft: 12, color: '#e8476a' }}>⚠️ {checks.duplicates} possible duplicate(s)</span>}
            {checks.bad_dates  > 0 && <span style={{ marginLeft: 12, color: '#f4a261' }}>⚠️ {checks.bad_dates} unclear date(s)</span>}
          </div>
        )}

        {/* Rows table */}
        {rows.length > 0 && !confirmed && (
          <>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Date','Merchant','Amount','Dir','Category','Conf','Flags'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const hasFlag = row.flags?.length > 0 || row.confidence < 0.7
                  return (
                    <tr key={i}>
                      <td style={S.td(hasFlag)}>{row.date || '?'}</td>
                      <td style={S.td(hasFlag)}>{row.merchant}</td>
                      <td style={S.td(hasFlag)}>{fmt(row.amount)}</td>
                      <td style={S.td(hasFlag)}>{row.direction}</td>
                      <td style={S.td(hasFlag)}>{row.category}</td>
                      <td style={S.td(hasFlag)}>
                        <span style={{ color: row.confidence < 0.7 ? '#e8476a' : '#0d4f2e', fontWeight: 600 }}>
                          {(row.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td style={S.td(hasFlag)}>
                        {(row.flags || []).map(f => (
                          <span key={f} style={{ ...S.badge, marginRight: 4 }}>{f}</span>
                        ))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <button style={S.btn} onClick={handleConfirm} disabled={loading}>
                ✅ Looks right — save to ledger
              </button>
              <button style={S.btnGhost} onClick={() => setResult(null)}>
                ✕ Discard
              </button>
            </div>
          </>
        )}

        {confirmed && (
          <div style={S.success}>
            ✅ <strong>{rows.length} rows saved</strong> to your ledger. Your dashboard has been updated.{' '}
            <a href="/artha" style={{ color: '#155724', fontWeight: 600 }}>View Artha overview →</a>
          </div>
        )}
      </div>
    </>
  )
}
