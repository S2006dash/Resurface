import React, { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import { getDashboard } from '../api'
import confetti from 'canvas-confetti'
import {
  Landmark, Plus, ShieldCheck, CheckCircle2, ArrowRight,
  RefreshCw, Lock, ExternalLink, Wallet, CreditCard, Building2,
  X, Check, AlertCircle, ChevronRight
} from 'lucide-react'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

// Popular Indian banks available for linking
const INDIAN_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC', badgeColor: '#004c8f', logo: '🏦' },
  { id: 'sbi', name: 'State Bank of India', code: 'SBIN', badgeColor: '#280071', logo: '🏛️' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICIC', badgeColor: '#f37021', logo: '🔷' },
  { id: 'axis', name: 'Axis Bank', code: 'UTIB', badgeColor: '#97144d', logo: '🅰️' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KKBK', badgeColor: '#ed1c24', logo: '🔴' },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PUNB', badgeColor: '#a20a3a', logo: '🏛️' },
  { id: 'zerodha', name: 'Zerodha Broking', code: 'ZERO', badgeColor: '#387ed1', logo: '📈' },
  { id: 'groww', name: 'Groww Invest', code: 'GROW', badgeColor: '#00d09c', logo: '🌱' },
]

// Pre-seeded connected accounts for Priya Sharma
const INITIAL_CONNECTED_BANKS = [
  {
    id: 'acc-1',
    bankName: 'HDFC Bank',
    accountType: 'Salary Account',
    accountNumber: '•••• 4091',
    ifsc: 'HDFC0001234',
    balance: 85000,
    status: 'Verified (AA)',
    logo: '🏦',
    badgeColor: '#004c8f',
    lastSync: 'Today, 2:15 PM',
  },
  {
    id: 'acc-2',
    bankName: 'State Bank of India (SBI)',
    accountType: 'Savings Account',
    accountNumber: '•••• 8821',
    ifsc: 'SBIN0004521',
    balance: 32450,
    status: 'Verified (AA)',
    logo: '🏛️',
    badgeColor: '#280071',
    lastSync: 'Yesterday',
  },
  {
    id: 'acc-3',
    bankName: 'ICICI Bank',
    accountType: 'Digital Privilege',
    accountNumber: '•••• 1904',
    ifsc: 'ICIC0000982',
    balance: 18200,
    status: 'Verified (AA)',
    logo: '🔷',
    badgeColor: '#f37021',
    lastSync: '2 days ago',
  },
  {
    id: 'acc-4',
    bankName: 'Zerodha Broking',
    accountType: 'Liquid Trading & Demat',
    accountNumber: '•••• 7710',
    ifsc: 'YESB0CMSNOC',
    balance: 45000,
    status: 'Verified (API)',
    logo: '📈',
    badgeColor: '#387ed1',
    lastSync: 'Today, 11:30 AM',
  },
]

export default function Dashboard() {
  const [accounts, setAccounts] = useState(INITIAL_CONNECTED_BANKS)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Add Account form state
  const [selectedBank, setSelectedBank] = useState(INDIAN_BANKS[0])
  const [accountType, setAccountType] = useState('Savings Account')
  const [accountNumber, setAccountNumber] = useState('')
  const [customBalance, setCustomBalance] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aaStep, setAaStep] = useState(1) // 1: input, 2: consent simulation

  const totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0)

  const triggerConfetti = () => {
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
    } catch (e) {}
  }

  // Handle adding a new bank account via simulated Account Aggregator
  const handleLinkAccount = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setAaStep(2)

    setTimeout(() => {
      const newAcc = {
        id: 'acc-' + Date.now(),
        bankName: selectedBank.name,
        accountType: accountType,
        accountNumber: '•••• ' + (accountNumber.slice(-4) || '6420'),
        ifsc: selectedBank.code + '0009999',
        balance: parseFloat(customBalance) || 25000,
        status: 'Verified (AA)',
        logo: selectedBank.logo,
        badgeColor: selectedBank.badgeColor,
        lastSync: 'Just now',
      }

      setAccounts(prev => [newAcc, ...prev])
      setIsSubmitting(false)
      setShowAddModal(false)
      setAaStep(1)
      setAccountNumber('')
      setCustomBalance('')
      triggerConfetti()
    }, 1200)
  }

  const handleRefresh = () => {
    setIsSyncing(true)
    setTimeout(() => setIsSyncing(false), 900)
  }

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 20px', minHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 28,
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
              <ShieldCheck size={14} color="#10b981" />
              <span>RBI Account Aggregator (AA) Sandbox</span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', margin: '2px 0 4px', letterSpacing: '-0.02em' }}>
              Connected Bank Accounts
            </h1>
            <p style={{ color: '#64748b', fontSize: 14.5, margin: 0 }}>
              Consolidate liquid accounts from multiple Indian banks into your Artha ledger.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#475569',
                padding: '10px 16px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing…' : 'Sync All (AA)'}</span>
            </button>

            <button
              onClick={() => { setShowAddModal(true); setAaStep(1) }}
              style={{
                background: '#0b0f19',
                border: 'none',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(11, 15, 25, 0.25)',
              }}
            >
              <Plus size={16} color="#10b981" />
              <span>Link New Bank Account</span>
            </button>
          </div>
        </div>

        {/* ── 1. AGGREGATED BALANCE SUMMARY BANNER ────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #0b0f19 0%, #1e293b 100%)',
          borderRadius: 22,
          padding: '28px 32px',
          color: '#ffffff',
          boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Liquid Cash Across {accounts.length} Banks
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#10b981', letterSpacing: '-0.02em', margin: '4px 0 6px' }}>
              {fmt(totalBalance)}
            </div>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>
              Verified balance feeding your daily Safe-to-Spend calculations in real time.
            </div>
          </div>

          <a
            href="/artha"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '10px 18px',
              borderRadius: 12,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Open Artha Co-Pilot</span>
            <ArrowRight size={14} />
          </a>
        </div>

        {/* ── 2. CONNECTED BANKS LIST ─────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
          marginBottom: 32,
        }}>
          {accounts.map((acc) => (
            <div
              key={acc.id}
              style={{
                background: '#ffffff',
                borderRadius: 18,
                border: '1.5px solid #e2e8f0',
                padding: '22px 24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#cbd5e1'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                    }}>
                      {acc.logo}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                        {acc.bankName}
                      </h3>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {acc.accountType} · {acc.accountNumber}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    background: '#ecfdf5',
                    color: '#059669',
                    padding: '2px 8px',
                    borderRadius: 12,
                    border: '1px solid #a7f3d0',
                  }}>
                    {acc.status}
                  </span>
                </div>

                <div style={{ margin: '14px 0 10px' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Available Balance</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>
                    {fmt(acc.balance)}
                  </div>
                </div>
              </div>

              <div style={{
                borderTop: '1px solid #f1f5f9',
                paddingTop: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 11.5,
                color: '#94a3b8',
              }}>
                <span>IFSC: <strong>{acc.ifsc}</strong></span>
                <span>Synced: {acc.lastSync}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── 3. MODAL: ADD / LINK BANK ACCOUNT (ACCOUNT AGGREGATOR) ───────── */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 22,
              maxWidth: 480,
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0f172a' }}>
                    Link Bank Account via AA
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Account Aggregator (RBI Sandbox Mock Mode)
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              {aaStep === 1 ? (
                <form onSubmit={handleLinkAccount}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Select Bank
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                      {INDIAN_BANKS.slice(0, 4).map(b => (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBank(b)}
                          style={{
                            border: selectedBank.id === b.id ? '2px solid #10b981' : '1px solid #cbd5e1',
                            background: selectedBank.id === b.id ? '#ecfdf5' : '#f8fafc',
                            borderRadius: 10,
                            padding: '8px 4px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                        >
                          <div style={{ fontSize: 18, marginBottom: 2 }}>{b.logo}</div>
                          <div>{b.name.split(' ')[0]}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Account Type
                    </label>
                    <select
                      value={accountType}
                      onChange={e => setAccountType(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13 }}
                    >
                      <option value="Savings Account">Savings Account</option>
                      <option value="Salary Account">Salary Account</option>
                      <option value="Current Account">Current Business Account</option>
                      <option value="Fixed Deposit">Fixed Deposit (Liquid)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Account Number (Last 4 digits or Mock Number)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. •••• 5521"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13 }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Simulated Starting Balance (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 35000"
                      value={customBalance}
                      onChange={e => setCustomBalance(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13 }}
                      required
                    />
                  </div>

                  {/* Privacy note */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 10,
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    fontSize: 11.5,
                    color: '#64748b',
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                  }}>
                    <Lock size={14} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong>DPDP & RBI AA Compliance:</strong> No private netbanking password or MPIN is collected. In this hackathon demo, a simulated consent token is created safely.
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '9px 20px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#0b0f19',
                        color: '#ffffff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: 13,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      Authorize & Link Account
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <RefreshCw size={36} color="#10b981" className="animate-spin" style={{ margin: '0 auto 14px' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    Simulating Account Aggregator Consent…
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Verifying mock financial institution token with {selectedBank.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
