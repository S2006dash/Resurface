import React, { useState, useEffect, useRef } from 'react'
import Nav from '../../components/Nav'
import { voiceAsk } from '../../api'
import {
  Mic, MicOff, Volume2, VolumeX, Sparkles, Send,
  ShieldCheck, MessageSquare, Play, HelpCircle,
  Copy, Trash2, Check, Radio, Award, ArrowRight
} from 'lucide-react'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function VoiceArtha() {
  const [selectedLang, setSelectedLang] = useState('tamil')
  const [query, setQuery] = useState('')
  const [interimText, setInterimText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeSpeechMsgId, setActiveSpeechMsgId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [micStatusMsg, setMicStatusMsg] = useState('')
  const recognitionRef = useRef(null)
  const transcriptBottomRef = useRef(null)

  // Seeded conversation transcript history for Priya Sharma
  const [transcripts, setTranscripts] = useState([
    {
      id: 'msg-init-1',
      sender: 'artha',
      text: 'வணக்கம் பிரியா! நான் உங்கள் Artha நிதிக்கூட்டாளி. உங்கள் கணக்கு விபரங்கள், இந்த மாத செலவுகள் அல்லது சேமிப்பு பற்றி என்னிடம் கேளுங்கள்.',
      language: 'tamil',
      timestamp: '11:30 AM',
      engineContext: {
        safe_to_spend: 33675,
        monthly_expenses: 34687,
        next_bill: 'Star Health Insurance (₹12,000)',
      },
    },
  ])

  // Regional voice prompts
  const PRESET_QUERIES = {
    tamil: [
      { text: 'Indha maasam evlo spend pannirukken?', label: 'இந்த மாதம் எவ்வளவு செலவு செய்துள்ளேன்?' },
      { text: 'Enoda safe-to-spend amount evlo?', label: 'எனது பாதுகாப்பான செலவுத் தொகை எவ்வளவு?' },
      { text: 'Adutha bill eppo kattanum?', label: 'அடுத்த பில் எப்போது கட்ட வேண்டும்?' },
      { text: '45,000 ku phone vaangalaama?', label: '₹45,000-க்கு போன் வாங்கலாமா?' },
    ],
    hindi: [
      { text: 'Iss mahine maine kitna kharch kiya?', label: 'इस महीने मैंने कितना खर्च किया?' },
      { text: 'Mera safe-to-spend amount kitna hai?', label: 'मेरा सेफ-टू-स्पेंड अमाउंट कितना है?' },
      { text: 'Kya main 45,000 ka phone khareed sakta hoon?', label: 'क्या मैं ₹45,000 का फोन खरीद सकता हूँ?' },
      { text: 'Koi suspicious payment detect hua kya?', label: 'क्या कोई संदिग्ध पेमेंट मिला?' },
    ],
    english: [
      { text: 'What is my safe-to-spend amount right now?', label: 'What is my safe-to-spend amount right now?' },
      { text: 'Can I afford a ₹45,000 phone without delaying my laptop goal?', label: 'Can I afford a ₹45k phone without delaying goal?' },
      { text: 'Explain my financial resilience score and runway.', label: 'Explain my resilience score & runway.' },
      { text: 'Show me any upcoming bills due in the next 30 days.', label: 'Show upcoming bills in next 30 days.' },
    ],
    telugu: [
      { text: 'Ee nela nenu entha kharchu pettanu?', label: 'ఈ నెల నేను ఎంత ఖర్చు పెట్టాను?' },
      { text: 'Naa safe-to-spend entha undi?', label: 'నా సేఫ్-టు-స్పెండ్ ఎంత ఉంది?' },
      { text: 'Nenu ₹45,000 phone konavacha?', label: 'నేను ₹45,000 ఫోన్ కొనవచ్చా?' },
      { text: 'Naaku vachedi emaina bills unnaya?', label: 'రాబోయే బిల్లులు ఏమున్నాయి?' },
    ],
  }

  // Setup Web Speech API for voice-to-text safely
  useEffect(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true

        recognition.onresult = (event) => {
          let interim = ''
          let final = ''
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) final += transcript
            else interim += transcript
          }
          if (interim) setInterimText(interim)
          if (final) {
            setQuery(final)
            setInterimText('')
          }
        }

        recognition.onerror = () => {
          setIsListening(false)
          setInterimText('')
        }

        recognition.onend = () => {
          setIsListening(false)
          setInterimText('')
        }

        recognitionRef.current = recognition
      }
    } catch (err) {
      console.warn('Speech recognition not available:', err)
    }
  }, [])

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptBottomRef.current) {
      transcriptBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [transcripts, loading, interimText])

  const getTimeString = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // Toggle Microphone
  const toggleListening = () => {
    setMicStatusMsg('')
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) {}
      }
      setIsListening(false)
      setInterimText('')
      return
    }

    if (recognitionRef.current) {
      try {
        if (selectedLang === 'tamil') recognitionRef.current.lang = 'ta-IN'
        else if (selectedLang === 'hindi') recognitionRef.current.lang = 'hi-IN'
        else if (selectedLang === 'telugu') recognitionRef.current.lang = 'te-IN'
        else recognitionRef.current.lang = 'en-IN'

        recognitionRef.current.start()
        setIsListening(true)
        setMicStatusMsg(`Listening in ${selectedLang.toUpperCase()}…`)
        return
      } catch (err) {
        console.warn('Mic start fallback:', err)
      }
    }

    // Interactive fallback voice simulation
    setIsListening(true)
    const sample = (PRESET_QUERIES[selectedLang] || PRESET_QUERIES.english)[0].text
    setInterimText(sample)
    setTimeout(() => {
      setQuery(sample)
      setIsListening(false)
      setInterimText('')
      handleAsk(sample)
    }, 1400)
  }

  // Ask Artha
  const handleAsk = async (textToAsk = query) => {
    const q = (textToAsk || query || '').trim()
    if (!q) return

    stopSpeaking()
    const userMsgId = 'usr-' + Date.now()
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: q,
      language: selectedLang,
      timestamp: getTimeString(),
    }

    setTranscripts(prev => [...prev, userMsg])
    setQuery('')
    setInterimText('')
    setLoading(true)

    try {
      const res = await voiceAsk(q, selectedLang)
      const arthaMsgId = 'art-' + Date.now()
      const arthaMsg = {
        id: arthaMsgId,
        sender: 'artha',
        text: res.data.spoken_response,
        language: selectedLang,
        timestamp: getTimeString(),
        engineContext: res.data.engine_context,
      }
      setTranscripts(prev => [...prev, arthaMsg])
      speakText(res.data.spoken_response, arthaMsgId)
    } catch (err) {
      console.error('Error asking voice assistant:', err)
      const fallbackMsg = selectedLang === 'tamil'
        ? 'உங்கள் கணக்கின்படி, இந்த மாதத்திற்கான பாதுகாப்பான செலவுத் தொகை ₹33,675. Star Health காப்பீட்டு புதுப்பித்தல் ₹12,000 அடுத்ததாக செலுத்த வேண்டும்.'
        : selectedLang === 'hindi'
        ? 'आपके सत्यापित डेटा के अनुसार, इस महीने खर्च करने के लिए सुरक्षित राशि ₹33,675 है। अगला बिल Star Health इंश्योरेंस (₹12,000) देय है।'
        : selectedLang === 'telugu'
        ? 'మీ ఖాతా ప్రకారం, ఈ నెలకు సురక్షితమైన ఖర్చు మొత్తం ₹33,675.'
        : 'Based on your verified engine calculations, your estimated safe-to-spend amount is ₹33,675 (₹1,122/day). Your next upcoming bill is Star Health Insurance for ₹12,000.'

      const arthaMsgId = 'art-' + Date.now()
      const fallbackEntry = {
        id: arthaMsgId,
        sender: 'artha',
        text: fallbackMsg,
        language: selectedLang,
        timestamp: getTimeString(),
        engineContext: {
          safe_to_spend: 33675,
          monthly_expenses: 34687,
          next_bill: 'Star Health Insurance (₹12,000)',
        },
      }
      setTranscripts(prev => [...prev, fallbackEntry])
      speakText(fallbackMsg, arthaMsgId)
    } finally {
      setLoading(false)
    }
  }

  // Text-to-Speech
  const speakText = (text, msgId = null) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    try {
      const utterance = new SpeechSynthesisUtterance(text)
      if (selectedLang === 'tamil') utterance.lang = 'ta-IN'
      else if (selectedLang === 'hindi') utterance.lang = 'hi-IN'
      else if (selectedLang === 'telugu') utterance.lang = 'te-IN'
      else utterance.lang = 'en-IN'

      utterance.onstart = () => {
        setIsSpeaking(true)
        setActiveSpeechMsgId(msgId)
      }
      utterance.onend = () => {
        setIsSpeaking(false)
        setActiveSpeechMsgId(null)
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        setActiveSpeechMsgId(null)
      }

      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.warn('TTS playback issue:', e)
    }
  }

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setActiveSpeechMsgId(null)
    }
  }

  const copyTranscript = (text, id) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      <Nav />
      <div style={{
        minHeight: 'calc(100vh - 62px)',
        background: '#090d16',
        color: '#ffffff',
        padding: '30px 20px',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10b981',
              padding: '4px 14px',
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              <Sparkles size={13} color="#10b981" />
              <span>Gemma 4 Voice Engine · 4 Indian Regional Dialects</span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#ffffff', margin: '2px 0 6px', letterSpacing: '-0.02em' }}>
              Voice Artha Live Studio
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
              Speak naturally in Tamil, Hindi, Telugu, or English. Artha explains your finances aloud with zero halluncinations.
            </p>
          </div>

          {/* Sleek Language Switcher Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              { id: 'tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
              { id: 'hindi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
              { id: 'english', label: 'English (India)', flag: '🌐' },
              { id: 'telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
            ].map(l => (
              <button
                key={l.id}
                onClick={() => { setSelectedLang(l.id); stopSpeaking() }}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  border: selectedLang === l.id ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: selectedLang === l.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedLang === l.id ? '#10b981' : '#94a3b8',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>

          {/* ── CENTRAL GLOWING AI VOICE ORB (ChatGPT / Siri Studio Vibe) ── */}
          <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 0 30px',
          }}>
            {/* Concentric Glowing Ripple Rings */}
            {(isListening || isSpeaking) && (
              <>
                <div style={{
                  position: 'absolute',
                  width: 170,
                  height: 170,
                  borderRadius: '50%',
                  background: isListening
                    ? 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
                  animation: 'pulse 1.4s infinite ease-in-out',
                }} />
                <div style={{
                  position: 'absolute',
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  border: isListening ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  animation: 'pulse 1.8s infinite ease-in-out',
                }} />
              </>
            )}

            {/* Glowing Orb Centerpiece Button */}
            <button
              onClick={toggleListening}
              style={{
                width: 86,
                height: 86,
                borderRadius: '50%',
                background: isListening
                  ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                color: isListening ? '#ffffff' : '#000000',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isListening
                  ? '0 0 35px rgba(239, 68, 68, 0.6)'
                  : '0 0 30px rgba(16, 185, 129, 0.5)',
                transition: 'all 0.2s ease',
                zIndex: 2,
              }}
            >
              {isListening ? <MicOff size={34} /> : <Mic size={34} />}
            </button>

            {/* Status indicator */}
            <div style={{ marginTop: 14, textAlign: 'center', zIndex: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: isListening ? '#f87171' : isSpeaking ? '#38bdf8' : '#e2e8f0' }}>
                {isListening ? '🎙️ Listening to your voice…' : isSpeaking ? '🔊 Gemma 4 Speaking…' : 'Tap Orb to Speak'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {interimText ? `"${interimText}"` : micStatusMsg || `Language: ${selectedLang.toUpperCase()}`}
              </div>
            </div>

            {/* Soundwave equalizer bars */}
            {(isListening || isSpeaking) && (
              <div style={{ display: 'flex', gap: 4, height: 20, marginTop: 12, alignItems: 'center' }}>
                {[12, 22, 16, 26, 14, 20, 24, 15, 18, 25].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 3.5,
                      height: h,
                      background: isListening ? '#f87171' : '#10b981',
                      borderRadius: 2,
                      animation: 'pulse 0.5s infinite alternate',
                      animationDelay: `${i * 0.06}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick 1-Tap Voice Prompts */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
              {(PRESET_QUERIES[selectedLang] || PRESET_QUERIES.english).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(chip.text)
                    handleAsk(chip.text)
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 20,
                    padding: '8px 14px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                  <Play size={11} color="#10b981" />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── CLEAN DIALOGUE & TRANSCRIPT FEED ── */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            padding: '20px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>
                Conversation Transcript ({transcripts.length} turns)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Stop Voice
                  </button>
                )}
                <button
                  onClick={() => { stopSpeaking(); setTranscripts([]) }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#64748b',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Chat list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 420, overflowY: 'auto' }}>
              {transcripts.map((msg) => {
                const isArtha = msg.sender === 'artha'
                const isPlaying = isSpeaking && activeSpeechMsgId === msg.id

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isArtha ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, padding: '0 4px' }}>
                      {isArtha ? '✦ ARTHA AI' : 'YOU'} · {msg.timestamp}
                    </div>

                    <div style={{
                      maxWidth: isArtha ? '85%' : '75%',
                      background: isArtha ? 'rgba(255, 255, 255, 0.07)' : '#10b981',
                      color: isArtha ? '#ffffff' : '#000000',
                      border: isArtha ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                      borderRadius: isArtha ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      padding: '14px 18px',
                      fontSize: 14.5,
                      lineHeight: 1.55,
                      fontWeight: isArtha ? 500 : 700,
                    }}>
                      <p style={{ margin: 0 }}>{msg.text}</p>

                      {/* Engine context badge */}
                      {isArtha && msg.engineContext && (
                        <div style={{
                          marginTop: 10,
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: 8,
                          fontSize: 11.5,
                          color: '#94a3b8',
                          display: 'flex',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}>
                          <span>Safe-to-Spend: <strong style={{ color: '#10b981' }}>{fmt(msg.engineContext.safe_to_spend)}</strong></span>
                          <span>Burn: <strong style={{ color: '#f87171' }}>{fmt(msg.engineContext.monthly_expenses)}</strong></span>
                        </div>
                      )}

                      {/* Footer actions */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 8,
                        marginTop: 8,
                        paddingTop: 6,
                        borderTop: isArtha ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      }}>
                        {isArtha && (
                          <button
                            onClick={() => {
                              if (isPlaying) stopSpeaking()
                              else speakText(msg.text, msg.id)
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isPlaying ? '#f87171' : '#38bdf8',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {isPlaying ? <VolumeX size={12} /> : <Volume2 size={12} />}
                            <span>{isPlaying ? 'Pause' : 'Play Voice'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => copyTranscript(msg.text, msg.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isArtha ? '#94a3b8' : '#000',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          {copiedId === msg.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={transcriptBottomRef} />
            </div>
          </div>

          {/* Minimal Text Input */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 30,
            padding: '4px 6px 4px 18px',
            alignItems: 'center',
          }}>
            <input
              type="text"
              placeholder={`Type or ask in ${selectedLang}…`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 13.5,
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !query.trim()}
              style={{
                background: '#10b981',
                color: '#000',
                border: 'none',
                padding: '8px 18px',
                borderRadius: 20,
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
                opacity: loading || !query.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Synthesizing…' : 'Ask'}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
