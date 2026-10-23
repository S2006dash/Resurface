import React, { useEffect, useState } from 'react'
import Nav from '../../components/Nav'
import { getAnomalies, updateAnomalyStatus } from '../../api'
import {
  AlertTriangle, ShieldAlert, CheckCircle2, XCircle, Info,
  ArrowRight, FileText, Download, ChevronDown, ChevronUp, Filter, Sparkles
} from 'lucide-react'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [disputeModal, setDisputeModal] = useState(null) // anomaly object
  const [successToast, setSuccessToast] = useState('')

  const fetchAnomalies = async () => {
    try {
      setLoading(true)
      const res = await getAnomalies()
      setAnomalies(res.data.anomalies || [])
    } catch (err) {
      console.error('Error fetching anomalies:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnomalies()
  }, [])

  const handleMarkStatus = async (anomalyKey, newStatus, note = '') => {
    try {
      await updateAnomalyStatus(anomalyKey, newStatus, note)
      setAnomalies(prev => prev.map(a => 
        a.anomaly_key === anomalyKey ? { ...a, user_status: newStatus } : a
      ))
      setSuccessToast(
        newStatus === 'expected' 
          ? 'Marked as Expected. Ledger verified.' 
          : 'Marked as Incorrect / Dispute. Grievance record created.'
      )
      setTimeout(() => setSuccessToast(''), 3500)
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  // Filter anomalies
  const filtered = anomalies.filter(a => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'pending') return a.user_status === 'pending_review'
    if (activeFilter === 'expected') return a.user_status === 'expected'
    if (activeFilter === 'disputed') return a.user_status === 'disputed'
    if (activeFilter === 'duplicate') return a.type === 'possible_duplicate'
    if (activeFilter === 'large') return a.type === 'unusually_large_payment'
    if (activeFilter === 'recurring') return a.type === 'recurring_charge_jump'
    return true
  })

  const pendingCount = anomalies.filter(a => a.user_status === 'pending_review').length
  const expectedCount = anomalies.filter(a => a.user_status === 'expected').length
  const disputedCount = anomalies.filter(a => a.user_status === 'disputed').length

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Toast Alert */}
        {successToast && (
          <div style={{
            position: 'fixed',
            top: 70,
            right: 24,
            zIndex: 9999,
            background: '#062615',
            color: '#7dffb3',
            border: '1px solid #22c55e',
            borderRadius: 8,
            padding: '12px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <CheckCircle2 size={16} color="#7dffb3" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fee2e2', color: '#b91c1c', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
            <ShieldAlert size={15} />
            <span>Practical Financial Protection</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0d4f2e', margin: '4px 0 8px' }}>
            Financial Anomaly & Scam Warning
          </h1>
          <p style={{ color: '#475569', fontSize: 15, maxWidth: 780, lineHeight: 1.5 }}>
            Artha flags suspicious patterns—such as duplicate UPI charges, statistical spending spikes, unfamiliar merchants, or sudden subscription increases. 
            <strong> We explain the exact rule that triggered each warning</strong> and let you confirm whether each transaction is expected or incorrect.
          </p>
        </div>

        {/* Summary Counter Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Detected Patterns</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{anomalies.length}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Rules-based anomaly flags</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', border: '1px solid #fed7aa', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #f97316' }}>
            <div style={{ fontSize: 12, color: '#c2410c', fontWeight: 600, textTransform: 'uppercase' }}>Needs Your Review</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#ea580c', marginTop: 4 }}>{pendingCount}</div>
            <div style={{ fontSize: 12, color: '#c2410c', marginTop: 2 }}>Awaiting verification</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', border: '1px solid #bbf7d0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600, textTransform: 'uppercase' }}>Verified Expected</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{expectedCount}</div>
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>Confirmed by you</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', border: '1px solid #fecaca', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #dc2626' }}>
            <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600, textTransform: 'uppercase' }}>Disputed / Flagged</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{disputedCount}</div>
            <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>Marked incorrect</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 20 }}>
          {[
            { id: 'all', label: 'All Warnings' },
            { id: 'pending', label: `Pending Review (${pendingCount})` },
            { id: 'duplicate', label: 'Possible Duplicates' },
            { id: 'large', label: 'Large Spikes' },
            { id: 'recurring', label: 'Subscription Jumps' },
            { id: 'expected', label: 'Verified Expected' },
            { id: 'disputed', label: 'Disputes' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: activeFilter === f.id ? '1.5px solid #0d4f2e' : '1px solid #cbd5e1',
                background: activeFilter === f.id ? '#0d4f2e' : '#ffffff',
                color: activeFilter === f.id ? '#ffffff' : '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List of Anomalies */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            Analyzing transactions with explainable rules…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 40, textAlign: 'center', border: '1px dashed #cbd5e1' }}>
            <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>No Anomaly Warnings Found</h3>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748b' }}>
              All transactions match your regular baseline profile.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {filtered.map(anom => {
              const isExpanded = expandedId === anom.anomaly_key
              const isExpected = anom.user_status === 'expected'
              const isDisputed = anom.user_status === 'disputed'

              return (
                <div
                  key={anom.anomaly_key}
                  style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    border: isExpected ? '1.5px solid #86efac' : isDisputed ? '1.5px solid #fca5a5' : '1.5px solid #fed7aa',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header Strip */}
                  <div style={{
                    padding: '20px 24px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                  }}>
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: anom.severity === 'high' ? '#fee2e2' : '#fef3c7',
                          color: anom.severity === 'high' ? '#b91c1c' : '#b45309',
                        }}>
                          {anom.severity} Severity Anomaly
                        </span>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#f1f5f9',
                          color: '#0f172a',
                          fontFamily: 'monospace',
                        }}>
                          {anom.rule_code}
                        </span>
                        {isExpected && (
                          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d' }}>
                            ✓ Verified Expected
                          </span>
                        )}
                        {isDisputed && (
                          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#b91c1c' }}>
                            ⚠️ Flagged Dispute
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                        {anom.title}
                      </h3>

                      {/* Rule Explanation */}
                      <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #0d4f2e', margin: '8px 0 12px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0d4f2e', textTransform: 'uppercase' }}>
                          Why this warning triggered ({anom.rule_name})
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                          {anom.explanation}
                        </p>
                      </div>

                      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Info size={14} color="#0d4f2e" />
                        <span>{anom.action_hint}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200, alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleMarkStatus(anom.anomaly_key, 'expected')}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: isExpected ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                            background: isExpected ? '#dcfce7' : '#ffffff',
                            color: isExpected ? '#15803d' : '#1e293b',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <CheckCircle2 size={14} color={isExpected ? '#15803d' : '#64748b'} />
                          <span>Expected</span>
                        </button>

                        <button
                          onClick={() => {
                            handleMarkStatus(anom.anomaly_key, 'disputed')
                            setDisputeModal(anom)
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: isDisputed ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                            background: isDisputed ? '#fee2e2' : '#ffffff',
                            color: isDisputed ? '#b91c1c' : '#1e293b',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <AlertTriangle size={14} color={isDisputed ? '#b91c1c' : '#64748b'} />
                          <span>Dispute</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : anom.anomaly_key)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0d4f2e',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 0',
                        }}
                      >
                        <span>{isExpanded ? 'Hide Evidence' : 'Show Transaction Evidence'}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Evidence Drawer */}
                  {isExpanded && (
                    <div style={{
                      background: '#f8fafc',
                      padding: '16px 24px',
                      borderTop: '1px solid #e2e8f0',
                      animation: 'fadeIn 0.15s ease-out',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} color="#0d4f2e" />
                        <span>Supporting Transaction Evidence ({anom.evidence?.length || 0} ledger row)</span>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: 12 }}>
                            <th style={{ padding: '8px 12px' }}>Entry ID</th>
                            <th style={{ padding: '8px 12px' }}>Date</th>
                            <th style={{ padding: '8px 12px' }}>Merchant</th>
                            <th style={{ padding: '8px 12px' }}>Category</th>
                            <th style={{ padding: '8px 12px' }}>Amount</th>
                            <th style={{ padding: '8px 12px' }}>Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(anom.evidence || []).map(row => (
                            <tr key={row.entry_id} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#64748b' }}>#{row.entry_id}</td>
                              <td style={{ padding: '8px 12px' }}>{row.entry_date}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{row.merchant}</td>
                              <td style={{ padding: '8px 12px' }}>{row.category}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#b91c1c' }}>{fmt(row.amount)}</td>
                              <td style={{ padding: '8px 12px', color: '#16a34a', fontWeight: 600 }}>{Math.round(row.confidence * 100)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Dispute Grievance Slip Modal */}
        {disputeModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 540,
              width: '100%',
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#fee2e2', padding: 8, borderRadius: 8 }}>
                    <AlertTriangle size={20} color="#dc2626" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                    Bank Dispute & Grievance Slip
                  </h3>
                </div>
                <button
                  onClick={() => setDisputeModal(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
                Artha has generated a standardized transaction summary you can submit to your bank's grievance portal or UPI app (PhonePe/GPay) to dispute this charge:
              </p>

              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontFamily: 'monospace', color: '#1e293b', whiteHeight: 'pre-wrap', lineHeight: 1.6, marginBottom: 18 }}>
                <div><strong>DISPUTE CASE REF:</strong> ARTHA-SEC-{disputeModal.anomaly_key}</div>
                <div><strong>RULE TRIGGERED:</strong> {disputeModal.rule_code}</div>
                <div><strong>MERCHANT NAME:</strong> {disputeModal.evidence?.[0]?.merchant || 'Unknown'}</div>
                <div><strong>TRANSACTION DATE:</strong> {disputeModal.evidence?.[0]?.entry_date}</div>
                <div><strong>AMOUNT DISPUTED:</strong> {fmt(disputeModal.evidence?.[0]?.amount)}</div>
                <div><strong>GROUNDS FOR GRIEVANCE:</strong> {disputeModal.explanation}</div>
                <div><strong>NPCI COMPLIANT:</strong> Flagged under RBI Consumer Protection Framework (Duplicate / Unauthorized)</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`DISPUTE CASE REF: ARTHA-SEC-${disputeModal.anomaly_key}\nRULE: ${disputeModal.rule_code}\nMERCHANT: ${disputeModal.evidence?.[0]?.merchant}\nAMOUNT: ${disputeModal.evidence?.[0]?.amount}\nDETAILS: ${disputeModal.explanation}`)
                    alert('Dispute details copied to clipboard!')
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    background: '#0d4f2e',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  📋 Copy Dispute Details
                </button>
                <button
                  onClick={() => setDisputeModal(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div style={{ marginTop: 32, padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
          Disclaimer: Artha flags suspicious patterns for review using deterministic rules and mathematical baselines. It does not claim to prove fraud or make legal determinations.
        </div>
      </div>
    </>
  )
}
