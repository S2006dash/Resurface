import React, { useState, useEffect, useRef } from 'react'
import Nav from '../../components/Nav'
import { voiceAsk } from '../../api'
import {
  Mic, MicOff, Volume2, VolumeX, Sparkles, Languages,
  Send, ShieldCheck, CheckCircle2, MessageSquare, RefreshCw
} from 'lucide-react'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function VoiceArtha() {
  const [selectedLang, setSelectedLang] = useState('tamil')
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef(null)

  // Preset regional queries
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
    ],
  }

  // Setup Web Speech API for voice-to-text
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setQuery(transcript)
    }

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  // Toggle Microphone
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by this browser. You can type or use the voice chips below!')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      if (selectedLang === 'tamil') recognitionRef.current.lang = 'ta-IN'
      else if (selectedLang === 'hindi') recognitionRef.current.lang = 'hi-IN'
      else if (selectedLang === 'telugu') recognitionRef.current.lang = 'te-IN'
      else recognitionRef.current.lang = 'en-IN'

      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Ask Artha
  const handleAsk = async (textToAsk = query) => {
    const q = textToAsk.trim()
    if (!q) return

    setLoading(true)
    setResponse(null)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setIsSpeaking(false)

    try {
      const res = await voiceAsk(q, selectedLang)
      setResponse(res.data)
      // Auto-read response aloud
      speakText(res.data.spoken_response)
    } catch (err) {
      console.error('Error asking voice assistant:', err)
      setResponse({
        spoken_response: 'Artha voice assistant is temporarily connecting to offline mode. Please try again.',
        engine_context: null,
      })
    } finally {
      setLoading(false)
    }
  }

  // Text-to-Speech
  const speakText = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    if (selectedLang === 'tamil') utterance.lang = 'ta-IN'
    else if (selectedLang === 'hindi') utterance.lang = 'hi-IN'
    else if (selectedLang === 'telugu') utterance.lang = 'te-IN'
    else utterance.lang = 'en-IN'

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  return (
    <>
      <Nav />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(125,255,179,0.15)',
            color: '#0d4f2e',
            padding: '4px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            <Sparkles size={15} color="#0d4f2e" />
            <span>Gemma 4 Multilingual Financial Engine</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0d4f2e', margin: '4px 0 8px' }}>
            Voice-Based Artha in Regional Languages
          </h1>
          <p style={{ color: '#475569', fontSize: 15, maxWidth: 640, margin: '0 auto', lineHeight: 1.5 }}>
            Ask natural financial questions in <strong>Tamil, Hindi, Telugu, or English</strong>. Artha calculates verified answers with its deterministic money engine and reads the explanation aloud.
          </p>
        </div>

        {/* Language Selection Pill Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          {[
            { id: 'tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
            { id: 'hindi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
            { id: 'english', label: 'English (India)', flag: '🌐' },
            { id: 'telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
          ].map(l => (
            <button
              key={l.id}
              onClick={() => { setSelectedLang(l.id); setQuery(''); setResponse(null); stopSpeaking() }}
              style={{
                padding: '9px 18px',
                borderRadius: 24,
                border: selectedLang === l.id ? '2px solid #0d4f2e' : '1px solid #cbd5e1',
                background: selectedLang === l.id ? '#0d4f2e' : '#ffffff',
                color: selectedLang === l.id ? '#ffffff' : '#334155',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: selectedLang === l.id ? '0 4px 12px rgba(13,79,46,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>

        {/* Central Voice Input Card */}
        <div style={{
          background: 'linear-gradient(135deg, #062615 0%, #0d4f2e 100%)',
          borderRadius: 20,
          padding: '36px 32px',
          color: '#fff',
          boxShadow: '0 16px 40px rgba(6,38,21,0.3)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 32,
        }}>
          {/* Waveform Animation Background when Listening */}
          {isListening && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, rgba(125,255,179,0.25) 0%, transparent 70%)',
              animation: 'pulse 1.2s infinite',
              pointerEvents: 'none',
            }} />
          )}

          {/* Glowing Microphone Button */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
            <button
              onClick={toggleListening}
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: isListening ? '#ef4444' : '#7dffb3',
                color: isListening ? '#ffffff' : '#062615',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isListening 
                  ? '0 0 30px rgba(239,68,68,0.7)' 
                  : '0 0 25px rgba(125,255,179,0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, color: '#7dffb3', marginBottom: 4 }}>
            {isListening ? '🎙️ Listening to your voice… Speak now' : 'Tap Microphone or select a question below'}
          </div>
          <div style={{ fontSize: 12, color: '#c8f5dc', opacity: 0.8, marginBottom: 20 }}>
            {selectedLang === 'tamil' ? 'தமிழில் பேசவும் (எ.கா: "Indha maasam evlo spend pannirukken?")' :
             selectedLang === 'hindi' ? 'हिंदी में बोलें (उदा: "इस महीने मेरा सेफ-टू-स्पेंड कितना है?")' :
             selectedLang === 'telugu' ? 'తెలుగులో మాట్లాడండి' :
             'Speak naturally in Indian English'}
          </div>

          {/* Text Input Box */}
          <div style={{
            display: 'flex',
            maxWidth: 600,
            margin: '0 auto',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 30,
            border: '1px solid rgba(125,255,179,0.3)',
            padding: '4px 6px 4px 18px',
            alignItems: 'center',
          }}>
            <input
              type="text"
              placeholder="Ask anything or speak into the mic…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !query.trim()}
              style={{
                background: '#7dffb3',
                color: '#062615',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 24,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: loading || !query.trim() ? 0.6 : 1,
              }}
            >
              <span>{loading ? 'Thinking…' : 'Ask'}</span>
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Preset Regional Voice Chips */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
            Popular Voice Questions in {selectedLang.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {(PRESET_QUERIES[selectedLang] || PRESET_QUERIES.english).map((chip, idx) => (
              <button
                key={idx}
                onClick={() => { setQuery(chip.text); handleAsk(chip.text) }}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cde8d4',
                  borderRadius: 20,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0d4f2e',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
              >
                <span>💬 "{chip.label}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Answer & Spoken Card */}
        {response && (
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1.5px solid #a7f3d0',
            boxShadow: '0 8px 30px rgba(13,79,46,0.08)',
            padding: '28px 32px',
            animation: 'fadeIn 0.25s ease-out',
            marginBottom: 32,
          }}>
            {/* Question Echo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                You asked: <strong style={{ color: '#0f172a' }}>"{query}"</strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isSpeaking ? (
                  <button
                    onClick={stopSpeaking}
                    style={{
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <VolumeX size={14} />
                    <span>Stop Audio</span>
                  </button>
                ) : (
                  <button
                    onClick={() => speakText(response.spoken_response)}
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Volume2 size={14} />
                    <span>Play Audio</span>
                  </button>
                )}
              </div>
            </div>

            {/* Gemma Spoken Response Text */}
            <div style={{
              background: '#f0fdf4',
              borderRadius: 12,
              padding: '20px 24px',
              borderLeft: '4px solid #16a34a',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', marginBottom: 6 }}>
                <Sparkles size={14} color="#16a34a" />
                <span>Gemma 4 Voice Response ({selectedLang.toUpperCase()})</span>
              </div>
              <p style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: '#064e3b',
                fontWeight: 600,
                margin: 0,
              }}>
                "{response.spoken_response}"
              </p>
            </div>

            {/* Verified Engine Context Card */}
            {response.engine_context && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 12 }}>
                  <ShieldCheck size={14} color="#0d4f2e" />
                  <span>Verified Ground-Truth Calculation Engine Values (Zero Hallucination)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Safe-to-Spend</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0d4f2e' }}>
                      {fmt(response.engine_context.safe_to_spend)}
                    </div>
                  </div>
                  <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Monthly Burn</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#b91c1c' }}>
                      {fmt(response.engine_context.monthly_expenses)}
                    </div>
                  </div>
                  <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Next Bill</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {response.engine_context.next_bill}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{fmt(response.engine_context.next_bill_amount)}</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Resilience Score</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>
                      {response.engine_context.resilience_score_out_of_100}/100 ({response.engine_context.resilience_grade})
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accessibility & Trust Info */}
        <div style={{
          background: '#f8fafc',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #e2e8f0',
          fontSize: 13,
          color: '#475569',
          lineHeight: 1.5,
        }}>
          <strong>Why Voice Artha stands out:</strong> Financial dashboards are often overwhelming with confusing charts. By enabling voice interaction in regional Indian languages, anyone—regardless of language proficiency or technical background—can simply speak to understand their money safely.
        </div>
      </div>
    </>
  )
}
