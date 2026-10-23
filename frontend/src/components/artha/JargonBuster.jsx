import React, { useState, useEffect, useRef } from 'react'
import { BookOpen, Sparkles, Volume2, X, Search, Globe, ChevronRight, HelpCircle } from 'lucide-react'

// Curated financial dictionary with multi-language definitions and real-world analogies
export const FINANCIAL_TERMS = {
  'safe-to-spend': {
    term: 'Safe-to-Spend',
    category: 'Daily Budgeting',
    en: {
      definition: 'The calculated amount you can safely spend today without risking missing upcoming bills, rent, EMIs, or monthly savings goals.',
      example: 'If you have ₹25,000 in your bank, but ₹11,500 is needed for upcoming rent and ₹5,000 for your SIP, your actual Safe-to-Spend is ₹8,500.',
      whyInArtha: 'Artha computes this dynamically so you see one actionable daily spending number instead of getting confused by total bank balances.',
    },
    hi: {
      definition: 'वह सुरक्षित राशि जिसे आप आज बेझिझक खर्च कर सकते हैं, बिना आगामी बिलों, किराए, लोन ईएमआई या बचत योजनाओं को खतरे में डाले।',
      example: 'यदि आपके खाते में ₹25,000 हैं, लेकिन ₹11,500 किराया और ₹5,000 एसआईपी के लिए चाहिए, तो आपकी सुरक्षित खर्च राशि ₹8,500 है।',
      whyInArtha: 'अर्था इसे स्वचालित रूप से गणना करता है ताकि आपको कुल बैलेंस देखकर भ्रमित न होना पड़े।',
    },
    ta: {
      definition: 'வரவிருக்கும் வாடகை, கடன் தவணைகள் (EMI) மற்றும் சேமிப்புகளை பாதிக்காமல் நீங்கள் இன்றே சுதந்திரமாக செலவிடக்கூடிய பாதுகாப்பான தொகை.',
      example: 'வங்கி கணக்கில் ₹25,000 இருந்தாலும், வாடகைக்கு ₹11,500, சேமிப்புக்கு ₹5,000 ஒதுக்கிய பின், நீங்கள் செலவிடக்கூடிய பாதுகாப்பான தொகை ₹8,500 மட்டுமே.',
      whyInArtha: 'ஒரே பார்வையில் குழப்பமில்லாமல் செலவு செய்ய அர்தா இதை துல்லியமாக கணக்கிட்டு காட்டுகிறது.',
    },
    te: {
      definition: 'రాబోయే బిల్లులు, రుణాలు మరియు పొదుపులకు ఆటంకం కలగకుండా మీరు ఈ రోజు సురక్షితంగా ఖర్చు చేయగల మొత్తం.',
      example: 'మీ ఖాతాలో ₹25,000 ఉన్నప్పటికీ, బిల్లులకు ₹11,500 పోను, మిగిలిన సురక్షిత మొత్తం ₹8,500.',
      whyInArtha: 'అర్థా ఈ సంఖ్యను స్పష్టంగా లెక్కిస్తుంది, తద్వారా మీరు అధిక ఖర్చు చేయకుండా ఉంటారు.',
    },
  },
  'apr': {
    term: 'APR (Annual Percentage Rate)',
    category: 'Credit & Loans',
    en: {
      definition: 'The true yearly cost of borrowing money, including the base interest rate plus all mandatory processing fees and hidden charges.',
      example: 'A loan advertising 12% interest with a 2% upfront processing fee actually has an APR of ~14.2%.',
      whyInArtha: 'Artha compares the true APR of credit cards and loans rather than misleading headline interest rates.',
    },
    hi: {
      definition: 'पैसे उधार लेने की कुल वार्षिक लागत, जिसमें ब्याज दर के साथ-साथ सभी प्रोसेसिंग और प्रशासनिक शुल्क शामिल होते हैं।',
      example: 'यदि किसी ऋण पर 12% ब्याज और 2% प्रोसेसिंग शुल्क है, तो वास्तविक वार्षिक दर (APR) लगभग 14.2% होती है।',
      whyInArtha: 'अर्था आपको केवल विज्ञापित ब्याज दर नहीं, बल्कि ऋण की वास्तविक लागत समझाता है।',
    },
    ta: {
      definition: 'ஒரு கடன் பெறுவதற்கான உண்மையான ஆண்டு மொத்த செலவு (வட்டி + செயலாக்கக் கட்டணங்கள் உள்ளிட்டவை).',
      example: '12% வட்டி என்று கூறப்பட்டாலும் 2% கட்டணம் சேர்ந்தால் உண்மையான APR 14%க்கும் மேல் ஆகும்.',
      whyInArtha: 'மறைமுக கட்டணங்களை தவிர்த்து கடனின் உண்மையான சுமையை அறிய அர்தா உதவுகிறது.',
    },
    te: {
      definition: 'రుణం పొందడానికి అయ్యే పూర్తి వార్షిక ఖర్చు, ఇందులో వడ్డీతో పాటు అన్ని ప్రాసెసింగ్ ఫీజులు ఉంటాయి.',
      example: '12% వడ్డీతో పాటు 2% ఫీజు కలిపితే అసలు APR 14% మించుతుంది.',
      whyInArtha: 'అర్థా మీకు క్రెడిట్ కార్డుల నిజమైన ఖర్చును చూపిస్తుంది.',
    },
  },
  'emi': {
    term: 'EMI (Equated Monthly Installment)',
    category: 'Banking & Debt',
    en: {
      definition: 'A fixed monthly payment amount made by a borrower to a lender on a specific date each month until a loan is fully repaid.',
      example: 'Paying ₹6,200 every month on the 15th for your personal loan until the balance reaches zero.',
      whyInArtha: 'Artha automatically subtracts your upcoming EMIs from your liquid balance so your payments never bounce.',
    },
    hi: {
      definition: 'एक निश्चित मासिक किस्त जो हर महीने एक तय तारीख को कर्ज चुकाने के लिए बैंक को दी जाती है।',
      example: 'अपने पर्सनल लोन के लिए हर महीने 15 तारीख को ₹6,200 चुकाना।',
      whyInArtha: 'अर्था आगामी ईएमआई को पहले से सुरक्षित रखता है ताकि बाउंस पेनल्टी न लगे।',
    },
    ta: {
      definition: 'கடன் தீரும் வரை ஒவ்வொரு மாதமும் குறிப்பிட்ட தேதியில் வங்கிக்கு செலுத்தும் சமமான மாதாந்திர தவணை.',
      example: 'தனிநபர் கடனுக்காக மாதந்தோறும் 15-ஆம் தேதி செலுத்தும் ₹6,200 தவணை.',
      whyInArtha: 'EMI தவணை தவறாமல் இருக்க உங்கள் பாதுகாப்பான தொகையிலிருந்து அர்தா இதை முன்கூட்டியே ஒதுக்குகிறது.',
    },
    te: {
      definition: 'రుణం పూర్తయ్యే వరకు ప్రతి నెలా నిర్ణీత తేదీన చెల్లించే సమాన నెలవారీ వాయిదా.',
      example: 'ప్రతి నెలా 15న చెల్లించే ₹6,200 వ్యక్తిగత రుణ వాయిదా.',
      whyInArtha: 'అర్థా మీ రాబోయే EMIలను ముందుగానే ట్రాక్ చేస్తుంది.',
    },
  },
  'resilience': {
    term: 'Financial Resilience',
    category: 'Financial Health',
    en: {
      definition: 'Your ability to withstand unexpected life shocks (like job delays, medical emergencies, or car repairs) without falling into high-interest debt.',
      example: 'Having 3-6 months of living expenses parked in safe liquid savings so an income pause is manageable.',
      whyInArtha: 'Artha measures resilience across 4 transparent pillars: Runway, Obligations Coverage, Debt Ratio, and Savings Stability.',
    },
    hi: {
      definition: 'अचानक आने वाले वित्तीय झटकों (जैसे वेतन में देरी या अप्रत्याशित चिकित्सा बिल) को बिना कर्ज लिए झेलने की आपकी क्षमता।',
      example: '3 से 6 महीने का खर्च सुरक्षित रखना ताकि कोई आपात स्थिति आने पर कर्ज न लेना पड़े।',
      whyInArtha: 'अर्था आपकी वित्तीय मजबूती को 4 पारदर्शी नियमों के आधार पर मापता है।',
    },
    ta: {
      definition: 'திடீர் வேலை இழப்பு, மருத்துவ செலவு அல்லது சம்பள தாமதம் போன்ற நிதி நெருக்கடிகளை தாங்கும் திறன்.',
      example: 'எந்தவித கடன் வாங்காமலும் 3 முதல் 6 மாதங்கள் வாழ்க்கையை நடத்தும் அளவுக்கு அவசர நிதி வைத்திருப்பது.',
      whyInArtha: 'உங்கள் நிதி பாதுகாப்பு திறனை 4 வெளிப்படையான காரணிகள் மூலம் அர்தா மதிப்பீடு செய்கிறது.',
    },
    te: {
      definition: 'అనుకోని ఆర్థిక సమస్యలు ఎదురైనప్పుడు తట్టుకునే మీ సామర్థ్యం.',
      example: '3 నుండి 6 నెలల అత్యవసర ఖర్చులను సిద్ధంగా ఉంచుకోవడం.',
      whyInArtha: 'అర్థా మీ ఆర్థిక స్థిరత్వాన్ని పారదర్శకంగా అంచనా వేస్తుంది.',
    },
  },
  'z-score': {
    term: 'Z-Score Anomaly Detection',
    category: 'AI & Statistics',
    en: {
      definition: 'A statistical metric that measures how unusually high a transaction is compared to your personal spending history.',
      example: 'If your typical dinner order is ₹400, a sudden surprise debit of ₹2,100 triggers an anomaly warning because it is > 2.5 standard deviations above your norm.',
      whyInArtha: 'Artha flags suspicious patterns with mathematical proof instead of making unverified fraud claims.',
    },
    hi: {
      definition: 'एक सांख्यिकीय माप जो दर्शाता है कि कोई नया लेनदेन आपके सामान्य औसत खर्च से कितना असामान्य रूप से दूर है।',
      example: 'यदि आपका सामान्य खाना ₹400 का है, तो अचानक ₹2,100 का चार्ज असामान्य रूप से चिन्हित होता है।',
      whyInArtha: 'अर्था गणितीय नियमों के आधार पर संदिग्ध लेनदेन को पकड़ता है।',
    },
    ta: {
      definition: 'உங்கள் வழக்கமான செலவிலிருந்து ஒரு புதிய பரிவர்த்தனை எவ்வளவு தூரம் அசாதாரணமாக வேறுபடுகிறது என்பதைக் காட்டும் கணித அளவு.',
      example: 'வழக்கமான உணவு ₹400 ஆக இருக்கையில், திடீரென ₹2,100 பதிவானால் Z-score மூலம் அது எச்சரிக்கப்படும்.',
      whyInArtha: 'மர்மமான பரிவர்த்தனைகளை துல்லியமான விதிகளுடன் அர்தா சுட்டிக்காட்டுகிறது.',
    },
    te: {
      definition: 'మీ సాధారణ ఖర్చు సగటు నుండి ఏదైనా లావాదేవీ ఎంత భిన్నంగా ఉందో కొలిచే పద్ధతి.',
      example: 'రోజూ ₹400 ఖర్చయ్యే చోట ₹2,100 ఛార్జ్ పడితే అది అనుమానాస్పదంగా గుర్తించబడుతుంది.',
      whyInArtha: 'అర్థా గణిత ఆధారాలతో అసాధారణ ఖర్చులను గుర్తిస్తుంది.',
    },
  },
  'reconciliation': {
    term: 'Financial Reconciliation',
    category: 'Accounting & Ledger',
    en: {
      definition: 'Cross-checking independent sources (UPI screenshots, bank statements, credit card bills) to make sure payments match and duplicates are eliminated.',
      example: 'Verifying that a ₹850 Swiggy payment shown in your Google Pay history only debited your bank account once.',
      whyInArtha: 'Artha matches multi-source records to catch duplicate retries and statement discrepancies.',
    },
    hi: {
      definition: 'दो या अधिक वित्तीय स्रोतों (जैसे यूपीआई और बैंक स्टेटमेंट) के बीच लेनदेन का मिलान करने की प्रक्रिया ताकि कोई गलती या डुप्लीकेट एंट्री न छूटे।',
      example: 'यह जांचना कि गूगल पे पर दिख रहा ₹850 का स्विगी भुगतान बैंक पासबुक से मेल खाता है या दो बार कट गया।',
      whyInArtha: 'अर्था कई स्टेटमेंट की तुलना करके आपको गलत या डुप्लीकेट कटौतियों से बचाता है।',
    },
    ta: {
      definition: 'யுபிஐ (UPI), வங்கி அறிக்கை மற்றும் கிரெடிட் கார்டு பில்களை ஒப்பிட்டு பார்த்து எண்களும் பரிவர்த்தனைகளும் சரியாக உள்ளனவா என்பதை சரிபார்க்கும் முறை.',
      example: 'கூகிள் பே-யில் பதிவான ₹850 பேங்க் ஸ்டேட்மெண்ட்டுடன் பொருந்துகிறதா அல்லது இருமுறை கழிக்கப்பட்டுள்ளதா என அறிவது.',
      whyInArtha: 'தவறான பதிவுகளையும் நகல்களையும் நீக்கி துல்லியமான கணக்கை வைக்க அர்தா உதவுகிறது.',
    },
    te: {
      definition: 'రెండు వేర్వేరు రికార్డులను (UPI మరియు బ్యాంక్ స్టేట్‌మెంట్) పోల్చి చూసి సరిచూసుకునే విధానం.',
      example: 'గూగుల్ పే లోని ₹850 బ్యాంక్ పాస్‌బుక్ ఎంట్రీతో సరిపోలుతుందో లేదో తనిఖీ చేయడం.',
      whyInArtha: 'అర్థా డూప్లికేట్ ఛార్జీలను గుర్తించడానికి రికార్డులను పోలుస్తుంది.',
    },
  },
  'nach': {
    term: 'NACH Mandate',
    category: 'Banking & Auto-Pay',
    en: {
      definition: 'National Automated Clearing House — an electronic authorization that lets institutions auto-debit payments for loans, SIPs, or utilities.',
      example: 'Your home loan or personal loan EMI debited automatically on the 15th of each month.',
      whyInArtha: 'Artha tracks upcoming NACH dates so your account has enough funds to avoid ₹500+ penalty fees.',
    },
    hi: {
      definition: 'एक इलेक्ट्रॉनिक अनुमति जो बैंक को आपके खाते से मासिक ईएमआई या एसआईपी स्वचालित रूप से काटने की अनुमति देती है।',
      example: 'हर महीने की 15 तारीख को ₹6,200 की लोन ईएमआई का ऑटो-डेबिट।',
      whyInArtha: 'अर्था बाउंस शुल्क से बचने के लिए एनएसीएच देय तिथियों को पहले से ट्रैक करता है।',
    },
    ta: {
      definition: 'மாதாந்திர கடன் தவணைகள் மற்றும் முதலீடுகளை உங்கள் வங்கி கணக்கிலிருந்து தானாகவே கழிக்க வழங்கப்படும் மின்னணு அங்கீகாரம்.',
      example: 'ஒவ்வொரு 15-ஆம் தேதியும் வங்கி தானாகவே எடுக்கும் ₹6,200 தவணை.',
      whyInArtha: 'கணக்கில் பணம் பற்றாக்குறையாகி பவுன்ஸ் கட்டணம் விழுவதை தடுக்க அர்தா இதை முன்னரே எச்சரிக்கிறது.',
    },
    te: {
      definition: 'మీ ఖాతా నుండి స్వయంచాలకంగా లోన్ EMI లేదా SIP మినహాయించడానికి ఇచ్చే అధికారిక అనుమతి.',
      example: 'ప్రతి నెలా 15న ఆటోమేటిక్‌గా కట్ అయ్యే ₹6,200 EMI.',
      whyInArtha: 'బౌన్స్ ఛార్జీలు పడకుండా ఉండేందుకు అర్థా ఈ తేదీలను ట్రాక్ చేస్తుంది.',
    },
  },
}

// ── Global Helper for any Component to Open a Term ───────────────────────────
let globalOpenTermHandler = null

export function openJargonTerm(termKeyOrWord) {
  if (globalOpenTermHandler) {
    globalOpenTermHandler(termKeyOrWord)
  }
}

// ── Inline Clickable Term Component ──────────────────────────────────────────
export function Term({ name, children }) {
  const termKey = (name || children || '').toString().toLowerCase().replace(/[^a-z0-9-]/g, '')
  return (
    <span
      onClick={(e) => {
        e.stopPropagation()
        openJargonTerm(termKey || name)
      }}
      title="Click for instant definition"
      style={{
        borderBottom: '1.5px dashed #0d4f2e',
        color: '#0d4f2e',
        cursor: 'pointer',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '0 2px',
        borderRadius: 3,
        background: 'rgba(125,255,179,0.15)',
      }}
    >
      <span>{children || name}</span>
      <HelpCircle size={12} color="#0d4f2e" style={{ opacity: 0.8 }} />
    </span>
  )
}

// ── Main JargonBuster Global Component ───────────────────────────────────────
export default function JargonBuster() {
  const [selectedWord, setSelectedWord] = useState(null)
  const [tooltipPos, setTooltipPos] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeLang, setActiveLang] = useState('en')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeItem, setActiveItem] = useState(FINANCIAL_TERMS['safe-to-spend'])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isInteractingWithTooltip = useRef(false)

  // Attach global handler
  useEffect(() => {
    globalOpenTermHandler = (termKeyOrWord) => {
      const normalized = (termKeyOrWord || '').toLowerCase().replace(/[^a-z0-9 -]/g, '')
      const matched = Object.keys(FINANCIAL_TERMS).find(k => 
        k === normalized || FINANCIAL_TERMS[k].term.toLowerCase().includes(normalized) || normalized.includes(k)
      )
      handleOpenTerm(matched, termKeyOrWord)
    }
    return () => { globalOpenTermHandler = null }
  }, [])

  // Listen to window text selection with bug-free mousedown protection
  useEffect(() => {
    const handleSelection = () => {
      if (isInteractingWithTooltip.current) return

      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        // slight timeout so clicking tooltip doesn't immediately dismiss
        setTimeout(() => {
          if (!isInteractingWithTooltip.current) {
            setTooltipPos(null)
          }
        }, 150)
        return
      }

      const rawText = selection.toString().trim()
      if (rawText.length < 2 || rawText.length > 50) {
        setTooltipPos(null)
        return
      }

      const normalized = rawText.toLowerCase().replace(/[^a-z0-9 -]/g, '')
      let matchedKey = Object.keys(FINANCIAL_TERMS).find(k => 
        k === normalized || FINANCIAL_TERMS[k].term.toLowerCase().includes(normalized) || normalized.includes(k)
      )

      try {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          setTooltipPos({
            top: Math.max(10, rect.top - 44 + window.scrollY),
            left: Math.max(10, rect.left + rect.width / 2 - 80 + window.scrollX),
          })
          setSelectedWord({
            raw: rawText,
            key: matchedKey || null,
          })
        }
      } catch (e) {
        // Range exception fallback
      }
    }

    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('touchend', handleSelection)
    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('touchend', handleSelection)
    }
  }, [])

  const handleOpenTerm = (termKey, customWord = null) => {
    if (termKey && FINANCIAL_TERMS[termKey]) {
      setActiveItem(FINANCIAL_TERMS[termKey])
    } else {
      const word = customWord || selectedWord?.raw || 'Financial Metric'
      setActiveItem({
        term: word,
        category: 'Highlighted Term',
        en: {
          definition: `Plain-English summary: "${word}" represents a financial factor in your ledger. Artha calculates how it impacts your available buffer and savings milestones.`,
          example: `In everyday personal money management, understanding ${word} ensures you don't face unexpected shortfalls.`,
          whyInArtha: `Artha grounds every insight involving ${word} with verifiable transactions.`,
        },
        hi: {
          definition: `सरल हिंदी में: "${word}" आपके वित्तीय रिकॉर्ड से संबंधित है। अर्था आपकी व्यक्तिगत सुरक्षा के लिए इसका पारदर्शी विश्लेषण करता है।`,
          example: `दैनिक वित्त में ${word} को समझना आपके पैसे की सुरक्षा के लिए जरूरी है।`,
          whyInArtha: `अर्था गणितीय नियमों के साथ इसकी गणना करता है।`,
        },
        ta: {
          definition: `எளிய தமிழில்: "${word}" என்பது உங்கள் நிதி நிலைமை மற்றும் பரிவர்த்தனைகள் தொடர்பான ஒரு சொல்லாகும்.`,
          example: `தினசரி வாழ்க்கையில் ${word} பற்றி தெரிந்துகொள்வது எதிர்பாராத செலவுகளை தவிர்க்க உதவும்.`,
          whyInArtha: `அர்தா எந்த ஒரு கணக்கீட்டையும் துல்லியமான ஆதாரத்துடன் உங்களுக்கு விளக்குகிறது.`,
        },
        te: {
          definition: `సులభమైన వివరణ: "${word}" మీ ఆర్థిక రికార్డులకు సంబంధించిన ఒక ముఖ్యమైన అంశం.`,
          example: `దీనిని అర్థం చేసుకోవడం వలన మీ ఖర్చులు అదుపులో ఉంటాయి.`,
          whyInArtha: `అర్థా ఆధారాలతో కూడిన నిజమైన లెక్కలను మాత్రమే అందిస్తుంది.`,
        },
      })
    }
    setIsOpen(true)
    setTooltipPos(null)
    isInteractingWithTooltip.current = false
  }

  // Voice narration using speech synthesis
  const handleSpeak = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    if (isSpeaking) {
      setIsSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    if (activeLang === 'hi') utterance.lang = 'hi-IN'
    else if (activeLang === 'ta') utterance.lang = 'ta-IN'
    else if (activeLang === 'te') utterance.lang = 'te-IN'
    else utterance.lang = 'en-IN'

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const currentContent = activeItem[activeLang] || activeItem.en

  const filteredKeys = Object.keys(FINANCIAL_TERMS).filter(k => {
    const item = FINANCIAL_TERMS[k]
    return item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.category.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <>
      {/* ── Floating Highlight Tooltip (Pops up above selected text) ─────────── */}
      {tooltipPos && selectedWord && (
        <div
          onMouseDown={(e) => {
            // Prevent selection from clearing before click fires
            e.preventDefault()
            isInteractingWithTooltip.current = true
          }}
          onClick={() => handleOpenTerm(selectedWord.key, selectedWord.raw)}
          style={{
            position: 'absolute',
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #062615 0%, #0d4f2e 100%)',
            color: '#fff',
            padding: '7px 14px',
            borderRadius: 24,
            boxShadow: '0 8px 24px rgba(0, 40, 20, 0.45)',
            border: '1px solid rgba(125,255,179,0.4)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            animation: 'fadeInUp 0.15s ease-out',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={14} color="#7dffb3" />
          <span>Explain "{selectedWord.raw.slice(0, 16)}{selectedWord.raw.length > 16 ? '…' : ''}"</span>
          <span style={{ background: 'rgba(125,255,179,0.25)', padding: '2px 7px', borderRadius: 12, fontSize: 10, color: '#7dffb3' }}>
            Tap to Read
          </span>
        </div>
      )}

      {/* ── Floating Corner Action Button (Always accessible) ───────────────── */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9000,
          background: 'linear-gradient(135deg, #0d4f2e 0%, #15803d 100%)',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(13, 79, 46, 0.35)',
          border: '1px solid rgba(125,255,179,0.3)',
          fontWeight: 700,
          fontSize: 13,
          transition: 'all 0.2s ease',
        }}
      >
        <BookOpen size={16} color="#7dffb3" />
        <span>Jargon Buster</span>
        <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 7px', borderRadius: 10 }}>
          4 Languages
        </span>
      </div>

      {/* ── Slide-Out Popover / Drawer ────────────────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 20, 10, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.18s ease-out',
          }}
          onClick={() => { setIsOpen(false); if (window.speechSynthesis) window.speechSynthesis.cancel(); setIsSpeaking(false) }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              height: '100%',
              background: '#ffffff',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #062615 0%, #0d4f2e 100%)',
              color: '#fff',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(125,255,179,0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: 'rgba(125,255,179,0.15)', padding: 6, borderRadius: 8 }}>
                    <BookOpen size={18} color="#7dffb3" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fff' }}>Artha Jargon Buster</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#a7f3d0' }}>Financial terms explained like you're 5</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsOpen(false); if (window.speechSynthesis) window.speechSynthesis.cancel(); setIsSpeaking(false) }}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Language Selector Tabs */}
              <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिन्दी' },
                  { code: 'ta', label: 'தமிழ்' },
                  { code: 'te', label: 'తెలుగు' },
                ].map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setActiveLang(l.code); if (window.speechSynthesis) window.speechSynthesis.cancel(); setIsSpeaking(false) }}
                    style={{
                      flex: 1,
                      padding: '7px 8px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: activeLang === l.code ? '#7dffb3' : 'rgba(255,255,255,0.12)',
                      color: activeLang === l.code ? '#062615' : '#e2e8f0',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
              {/* Active Term Card */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px 22px',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#0d4f2e',
                      background: '#dcfce7',
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}>
                      {activeItem.category}
                    </span>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '6px 0 0' }}>
                      {activeItem.term}
                    </h2>
                  </div>
                  <button
                    onClick={() => handleSpeak(`${activeItem.term}. ${currentContent.definition}`)}
                    style={{
                      background: isSpeaking ? '#ef4444' : '#0d4f2e',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <Volume2 size={15} />
                    <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                  </button>
                </div>

                {/* Definition */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    What it means
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: '#1e293b', margin: '6px 0 14px', fontWeight: 500 }}>
                    {currentContent.definition}
                  </p>
                </div>

                {/* Real-World Analogy */}
                <div style={{
                  background: '#f0fdf4',
                  borderLeft: '4px solid #16a34a',
                  padding: '12px 14px',
                  borderRadius: '0 8px 8px 0',
                  marginBottom: 14,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
                    💡 Simple Real-World Example
                  </div>
                  <p style={{ fontSize: 13, color: '#166534', margin: '4px 0 0', lineHeight: 1.5 }}>
                    {currentContent.example}
                  </p>
                </div>

                {/* Why it matters in Artha */}
                <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    ✦ Why it matters in Artha
                  </div>
                  <p style={{ fontSize: 12, color: '#334155', margin: '4px 0 0', lineHeight: 1.5 }}>
                    {currentContent.whyInArtha}
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  Search Any Financial Term
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
                  <input
                    type="text"
                    placeholder="Search: Safe-to-Spend, APR, EMI, NACH…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Term Pills list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredKeys.map(k => {
                  const itm = FINANCIAL_TERMS[k]
                  const isCur = activeItem.term === itm.term
                  return (
                    <div
                      key={k}
                      onClick={() => handleOpenTerm(k)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: isCur ? '#dcfce7' : '#ffffff',
                        border: isCur ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{itm.term}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{itm.category}</div>
                      </div>
                      <ChevronRight size={15} color="#94a3b8" />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', textAlign: 'center' }}>
              💡 Tip: Click on any financial term across Artha to see its instant definition.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
