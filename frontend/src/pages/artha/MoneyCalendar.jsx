import React, { useState } from 'react'
import Nav from '../../components/Nav'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  Sparkles, CheckCircle2, Clock, Plus, BookOpen, AlertCircle,
  TrendingUp, Shield, Wallet, ArrowDownRight, ArrowUpRight,
  GraduationCap, Play, X, Award
} from 'lucide-react'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

// Pre-seeded financial events and training sessions for Priya Sharma
const INITIAL_EVENTS = [
  // Recurring cash commitments & inflows
  { id: 'ev-1', date: '2026-10-10', type: 'salary', title: 'Salary Credit (TCS)', amount: 55000, direction: 'credit', category: 'Income' },
  { id: 'ev-2', date: '2026-10-12', type: 'rent', title: 'House Rent (Koramangala)', amount: 18000, direction: 'debit', category: 'Rent' },
  { id: 'ev-3', date: '2026-10-15', type: 'emi', title: 'HDFC Personal Loan EMI', amount: 6200, direction: 'debit', category: 'EMI' },
  { id: 'ev-4', date: '2026-10-20', type: 'sip', title: 'Zerodha Index Fund SIP', amount: 5000, direction: 'debit', category: 'Investments' },
  { id: 'ev-5', date: '2026-10-24', type: 'training', title: '🎓 Financial Training: Safe-to-Spend Buffer Audit', category: 'Training', trainer: 'Gemma 4 AI', duration: '15 mins', status: 'Completed' },
  
  // November upcoming commitments
  { id: 'ev-6', date: '2026-11-05', type: 'bill', title: 'HDFC Credit Card Bill Due', amount: 71500, direction: 'debit', category: 'Card Bill' },
  { id: 'ev-7', date: '2026-11-10', type: 'salary', title: 'Salary Credit (TCS)', amount: 55000, direction: 'credit', category: 'Income' },
  { id: 'ev-8', date: '2026-11-10', type: 'insurance', title: 'Star Health Policy Annual Renewal', amount: 12000, direction: 'debit', category: 'Insurance' },
  { id: 'ev-9', date: '2026-11-12', type: 'rent', title: 'House Rent', amount: 18000, direction: 'debit', category: 'Rent' },
  { id: 'ev-10', date: '2026-11-15', type: 'emi', title: 'HDFC Personal Loan EMI', amount: 6200, direction: 'debit', category: 'EMI' },
  { id: 'ev-11', date: '2026-11-18', type: 'training', title: '🎓 Financial Training: Tax Saving 80C & 80D Prep', category: 'Training', trainer: 'Gemma 4 AI', duration: '20 mins', status: 'Upcoming' },
  { id: 'ev-12', date: '2026-11-20', type: 'sip', title: 'Zerodha Index Fund SIP', amount: 5000, direction: 'debit', category: 'Investments' },
  { id: 'ev-13', date: '2026-11-25', type: 'training', title: '🎓 Financial Training: Emergency Runway Stress-Test', category: 'Training', trainer: 'Gemma 4 AI', duration: '15 mins', status: 'Upcoming' },
]

// Catalog of quick financial training courses
const TRAINING_CATALOG = [
  {
    id: 't-1',
    title: 'Safe-to-Spend & Liquid Buffer Mastery',
    duration: '12 mins',
    level: 'Beginner',
    summary: 'Learn why looking at your raw bank balance causes overspending, and how liquid buffer budgeting keeps you stress-free.',
    keyTakeaway: 'Always deduct upcoming bills and 15% shock buffer before discretionary weekend spends.',
  },
  {
    id: 't-2',
    title: 'Tax Saving Blueprint: Section 80C & 80D',
    duration: '18 mins',
    level: 'Intermediate',
    summary: 'Demystify ELSS mutual funds, PPF, and Health Insurance tax deductions to save up to ₹46,800 annually.',
    keyTakeaway: 'Star Health premium of ₹12,000 qualifies for full Section 80D tax deduction.',
  },
  {
    id: 't-3',
    title: 'Debt Avalanche vs Snowball for High-Interest Cards',
    duration: '15 mins',
    level: 'Essential',
    summary: 'Step-by-step strategy to eliminate high-APR credit card balances (e.g. ₹71,500 HDFC Card) before interest compounds at 42% APR.',
    keyTakeaway: 'Directing ₹4,000 extra per month clears the card 7 months earlier and saves ₹14,200 in interest.',
  },
  {
    id: 't-4',
    title: 'How to Spot UPI & Phishing Scams in India',
    duration: '10 mins',
    level: 'Crucial',
    summary: 'Recognize QR code scams, reverse payment requests, and fraudulent SMS mimicking bank OTPs.',
    keyTakeaway: 'Entering your UPI PIN always deducts money; you NEVER enter a PIN to receive funds.',
  },
]

export default function MoneyCalendar() {
  // Calendar state: Start at November 2026 (matching demo obligations)
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(10) // 10 = November (0-indexed: 9=Oct, 10=Nov)
  const [selectedDate, setSelectedDate] = useState('2026-11-10')
  const [events, setEvents] = useState(INITIAL_EVENTS)
  
  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [activeTrainingModule, setActiveTrainingModule] = useState(null)
  const [newTrainingTitle, setNewTrainingTitle] = useState(TRAINING_CATALOG[0].title)
  const [newTrainingTime, setNewTrainingTime] = useState('10:00 AM')
  const [newTrainingNotes, setNewTrainingNotes] = useState('')

  // Calendar Helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const formatDateStr = (day) => {
    const m = String(currentMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${currentYear}-${m}-${d}`
  }

  const getEventsForDate = (dateStr) => {
    return events.filter(e => e.date === dateStr)
  }

  const selectedEvents = getEventsForDate(selectedDate)

  // Schedule a new training session
  const handleAddTraining = (e) => {
    e.preventDefault()
    if (!newTrainingTitle) return

    const newEv = {
      id: 'tr-' + Date.now(),
      date: selectedDate,
      type: 'training',
      title: '🎓 Financial Training: ' + newTrainingTitle,
      category: 'Training',
      trainer: 'Gemma 4 AI',
      duration: '15 mins',
      notes: newTrainingNotes,
      time: newTrainingTime,
      status: 'Upcoming',
    }

    setEvents(prev => [...prev, newEv])
    setShowScheduleModal(false)
    setNewTrainingNotes('')
  }

  // Quick 1-click schedule from catalog
  const handleQuickAdd = (catalogItem) => {
    const newEv = {
      id: 'tr-' + Date.now(),
      date: selectedDate,
      type: 'training',
      title: '🎓 Financial Training: ' + catalogItem.title,
      category: 'Training',
      trainer: 'Gemma 4 AI',
      duration: catalogItem.duration,
      notes: catalogItem.summary,
      time: '11:00 AM',
      status: 'Upcoming',
    }
    setEvents(prev => [...prev, newEv])
    setActiveTrainingModule(catalogItem)
  }

  // Calculate day net cashflow
  const dayInflow = selectedEvents.filter(e => e.direction === 'credit').reduce((s, e) => s + e.amount, 0)
  const dayOutflow = selectedEvents.filter(e => e.direction === 'debit').reduce((s, e) => s + e.amount, 0)

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px', minHeight: '90vh' }}>
        
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
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 10,
          }}>
            <CalendarIcon size={14} color="#059669" />
            <span>Interactive Financial Planning & Coaching Calendar</span>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#064e3b', margin: '4px 0 8px', letterSpacing: '-0.02em' }}>
            Money Calendar & Financial Training
          </h1>
          <p style={{ color: '#475569', fontSize: 15, maxWidth: 680, margin: '0 auto', lineHeight: 1.55 }}>
            Pick any date to review cash flow obligations, salary inflows, bill due dates, and schedule personalized <strong>Gemma 4 Financial Training</strong> sessions for everyday financial literacy.
          </p>
        </div>

        {/* ── TWO-COLUMN LAYOUT: CALENDAR GRID (LEFT) + SELECTED DAY PANEL (RIGHT) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.1fr)', gap: 24, alignItems: 'start' }}>
          
          {/* LEFT: CALENDAR CONTAINER */}
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
            padding: '24px 24px',
          }}>
            {/* Month & Year Navigation Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              paddingBottom: 14,
              borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#064e3b',
                  color: '#7dffb3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                }}>
                  ✦
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Click any day to view commitments or schedule training
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handlePrevMonth}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#334155',
                  }}
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextMonth}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#334155',
                  }}
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Legend Bar */}
            <div style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              marginBottom: 16,
              fontSize: 11.5,
              fontWeight: 600,
              color: '#475569',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                <span>Salary / Inflow</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
                <span>Bills & EMI</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed' }} />
                <span>Star Health Insurance</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                <span>🎓 Gemma 4 Training</span>
              </div>
            </div>

            {/* Weekday Labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8, textAlign: 'center' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div key={i} style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', padding: '4px 0' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {/* Empty padding slots before 1st of month */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} style={{ minHeight: 74, background: '#f8fafc', borderRadius: 10, opacity: 0.4 }} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1
                const dateStr = formatDateStr(day)
                const dayEvs = getEventsForDate(dateStr)
                const isSelected = selectedDate === dateStr
                const hasSalary = dayEvs.some(e => e.type === 'salary')
                const hasBill = dayEvs.some(e => ['bill', 'rent', 'emi'].includes(e.type))
                const hasInsurance = dayEvs.some(e => e.type === 'insurance')
                const hasTraining = dayEvs.some(e => e.type === 'training')

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    style={{
                      minHeight: 78,
                      borderRadius: 12,
                      padding: '7px 8px',
                      background: isSelected ? '#ecfdf5' : '#ffffff',
                      border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 14px rgba(5,150,105,0.18)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#94a3b8'
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0'
                    }}
                  >
                    {/* Date Number */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: isSelected ? 800 : 700,
                        color: isSelected ? '#065f46' : '#1e293b',
                      }}>
                        {day}
                      </span>
                      {isSelected && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                      )}
                    </div>

                    {/* Event Badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                      {hasSalary && (
                        <div style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1.5px 4px',
                          borderRadius: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          💰 +₹55k
                        </div>
                      )}
                      {hasInsurance && (
                        <div style={{
                          background: '#f3e8ff',
                          color: '#7e22ce',
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1.5px 4px',
                          borderRadius: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          🛡️ Health Policy
                        </div>
                      )}
                      {hasBill && (
                        <div style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1.5px 4px',
                          borderRadius: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          ⚠️ Due
                        </div>
                      )}
                      {hasTraining && (
                        <div style={{
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1.5px 4px',
                          borderRadius: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          🎓 Training
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT: SELECTED DATE DETAIL DRAWER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Selected Day Agenda Box */}
            <div style={{
              background: '#ffffff',
              borderRadius: 22,
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
              padding: '24px 22px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #f1f5f9',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Day Schedule & Training
                  </div>
                  <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </h3>
                </div>

                <button
                  onClick={() => setShowScheduleModal(true)}
                  style={{
                    background: '#064e3b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 3px 10px rgba(6,78,59,0.2)',
                  }}
                >
                  <Plus size={14} />
                  <span>Add Session</span>
                </button>
              </div>

              {/* Cash Flow Summary for the day */}
              {(dayInflow > 0 || dayOutflow > 0) && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 16,
                  background: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Scheduled Inflow</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>
                      +{fmt(dayInflow)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Scheduled Outflow</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>
                      -{fmt(dayOutflow)}
                    </div>
                  </div>
                </div>
              )}

              {/* Scheduled Events on this date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedEvents.length === 0 ? (
                  <div style={{
                    padding: '30px 16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: 12,
                    border: '1px dashed #cbd5e1',
                    color: '#64748b',
                  }}>
                    <BookOpen size={28} color="#94a3b8" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 13, fontWeight: 600 }}>No commitments on this day</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Perfect day to schedule a 15-minute Financial Training workshop!
                    </div>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      style={{
                        marginTop: 12,
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#065f46',
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Schedule Training Now
                    </button>
                  </div>
                ) : (
                  selectedEvents.map((ev) => {
                    const isTraining = ev.type === 'training'
                    const isCredit = ev.direction === 'credit'

                    return (
                      <div
                        key={ev.id}
                        style={{
                          background: isTraining ? '#f0fdf4' : '#ffffff',
                          border: isTraining ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: isTraining ? '#bbf7d0' : isCredit ? '#dcfce7' : '#fee2e2',
                            color: isTraining ? '#065f46' : isCredit ? '#15803d' : '#b91c1c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {isTraining ? <GraduationCap size={18} /> : isCredit ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                          </div>

                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                              {ev.title}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b' }}>
                              {isTraining ? `${ev.duration || '15 mins'} · AI Coaching` : `${ev.category} commitment`}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isTraining ? (
                            <button
                              onClick={() => setActiveTrainingModule({
                                title: ev.title.replace('🎓 Financial Training: ', ''),
                                duration: ev.duration,
                                summary: ev.notes || 'Interactive coaching session grounded in verified Indian financial concepts.',
                                keyTakeaway: 'Mastering cash buffer budgeting protects your hard-earned salary from sudden shocks.',
                              })}
                              style={{
                                background: '#064e3b',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Play size={11} />
                              <span>Start</span>
                            </button>
                          ) : (
                            <div style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: isCredit ? '#15803d' : '#b91c1c',
                              textAlign: 'right',
                            }}>
                              {isCredit ? '+' : '-'}{fmt(ev.amount)}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Quick 1-Click Financial Training Catalog */}
            <div style={{
              background: '#ffffff',
              borderRadius: 22,
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
              padding: '22px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <Sparkles size={16} color="#059669" />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  Quick Financial Training Modules
                </h4>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px' }}>
                Click any module to assign it to <strong>{selectedDate}</strong> and open the lesson plan:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TRAINING_CATALOG.map((mod) => (
                  <div
                    key={mod.id}
                    onClick={() => handleQuickAdd(mod)}
                    style={{
                      background: '#f8fafc',
                      borderRadius: 10,
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#059669'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                        {mod.title}
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: '#ecfdf5',
                        color: '#047857',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}>
                        {mod.duration}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                      {mod.summary}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── MODAL: SCHEDULE FINANCIAL TRAINING OR COMMITMENT ────────────── */}
        {showScheduleModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 480,
              width: '100%',
              padding: '24px 26px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#064e3b' }}>
                  Schedule Financial Training Session
                </h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTraining}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 13,
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Training Course / Topic
                  </label>
                  <select
                    value={newTrainingTitle}
                    onChange={e => setNewTrainingTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 13,
                    }}
                  >
                    {TRAINING_CATALOG.map(t => (
                      <option key={t.id} value={t.title}>{t.title} ({t.duration})</option>
                    ))}
                    <option value="Personalized Budget & Overspending Review">Personalized Budget & Overspending Review</option>
                    <option value="Mutual Fund SIP & Portfolio Balancing">Mutual Fund SIP & Portfolio Balancing</option>
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Session Time
                  </label>
                  <input
                    type="text"
                    value={newTrainingTime}
                    onChange={e => setNewTrainingTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 13,
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Personal Goal / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newTrainingNotes}
                    onChange={e => setNewTrainingNotes(e.target.value)}
                    placeholder="e.g. Discuss whether to prepay HDFC loan or increase Zerodha SIP"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 13,
                      resize: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
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
                      background: '#064e3b',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 13,
                      boxShadow: '0 4px 12px rgba(6,78,59,0.25)',
                    }}
                  >
                    Save to Calendar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: ACTIVE TRAINING MODULE STUDY VIEWER ──────────────────── */}
        {activeTrainingModule && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 540,
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: '#ecfdf5',
                    color: '#059669',
                    padding: '3px 8px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                  }}>
                    Gemma 4 Interactive Learning Module
                  </span>
                  <h3 style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 800, color: '#064e3b' }}>
                    {activeTrainingModule.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTrainingModule(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px', marginBottom: 18, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                  Module Overview
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.55 }}>
                  {activeTrainingModule.summary}
                </p>
              </div>

              <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '16px', marginBottom: 20, borderLeft: '4px solid #16a34a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', marginBottom: 6 }}>
                  <Award size={16} />
                  <span>Key Actionable Takeaway</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#064e3b', fontWeight: 600, lineHeight: 1.5 }}>
                  "{activeTrainingModule.keyTakeaway}"
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <a
                  href="/artha/voice"
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    background: '#ecfdf5',
                    color: '#065f46',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Ask Gemma in Voice</span>
                  <span>🎙️</span>
                </a>
                <button
                  onClick={() => setActiveTrainingModule(null)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#064e3b',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Mark as Complete ✓
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
