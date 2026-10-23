import React, { useState, useEffect, useRef } from 'react'
import { BookOpen, Sparkles, Volume2, X, Search, Globe, ChevronRight } from 'lucide-react'

// Curated financial dictionary with multi-language definitions and real-world analogies
export const FINANCIAL_TERMS = {
  'safe-to-spend': {
    term: 'Safe-to-Spend',
    category: 'Budgeting & Daily Cash',
    en: {
      definition: 'The calculated amount you can spend today without risking missing upcoming bills, loan EMIs, or monthly savings commitments.',
      example: 'If your bank has ₹25,000, but ₹11,500 is needed for upcoming rent and ₹5,000 for your SIP, your Safe-to-Spend is ₹8,500.',
      whyInArtha: 'Artha computes this dynamically so you have one actionable number instead of guessing from total bank balances.',
    },
    hi: {
      definition: 'वह सुरक्षित राशि जिसे आप आज खर्च कर सकते हैं, बिना आगामी बिलों, लोन ईएमआई या बचत योजनाओं को जोखिम में डाले।',
      example: 'अगर आपके खाते में ₹25,000 हैं, लेकिन ₹11,500 किराया और ₹5,000 एसआईपी के लिए चाहिए, तो आपकी सुरक्षित खर्च राशि ₹8,500 है।',
      whyInArtha: 'अर्था इसे स्वचालित रूप से गणना करता है ताकि आपको कुल बैलेंस देखकर भ्रमित न होना पड़े।',
    },
    ta: {
      definition: 'வரவிருக்கும் வாடகை, தவணைகள் (EMI) மற்றும் சேமிப்புகளை பாதிக்காமல் நீங்கள் இன்றே சுதந்திரமாக செலவிடக்கூடிய பாதுகாப்பான தொகை.',
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
      definition: 'The total yearly cost of borrowing money, including the base interest rate plus all mandatory processing and administrative fees.',
      example: 'A loan with a 12% interest rate but 2% upfront processing fee actually has an APR of ~14.2%.',
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
      definition: 'A fixed payment amount made by a borrower to a lender at a specified date each calendar month until a loan is repaid.',
      example: 'Paying ₹6,200 every month on the 15th for your personal loan until the balance reaches zero.',
      whyInArtha: 'Artha automatically subtracts your upcoming EMIs from your liquid balance to protect you from penalty charges.',
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
  'liquidity': {
    term: 'Liquidity',
    category: 'Cash & Assets',
    en: {
      definition: 'How quickly and easily an asset can be converted into spendable cash without losing its market value.',
      example: 'Money in your savings account or UPI wallet is fully liquid. Real estate or provident fund (PPF) is illiquid.',
      whyInArtha: 'Artha uses your liquid funds to compute your financial emergency runway in months.',
    },
    hi: {
      definition: 'किसी संपत्ति को कितनी आसानी और तेजी से नकद पैसे में बदला जा सकता है।',
      example: 'बचत खाते या यूपीआई का पैसा लिक्विड है, जबकि जमीन या मकान को तुरंत नकदी में बदलना कठिन है।',
      whyInArtha: 'अर्था आपकी लिक्विडिटी के आधार पर आपके आपातकालीन महीनों की गणना करता है।',
    },
    ta: {
      definition: 'ஒரு சொத்தை எவ்வளவு விரைவாக கையில் புழங்கும் பணமாக மாற்ற முடியும் என்பதற்கான அளவீடு.',
      example: 'சேமிப்பு கணக்கில் உள்ள பணம் உடனடி பணப்புழக்கம் (Liquid). வீடு அல்லது நிலம் தாமதமாகும் (Illiquid).',
      whyInArtha: 'அவசர கால நிதி எவ்வளவு மாதங்களுக்கு தாங்கும் என்பதை கணக்கிட அர்தா இதை பயன்படுத்துகிறது.',
    },
    te: {
      definition: 'ఒక ఆస్తిని ఎంత త్వరగా నగదుగా మార్చవచ్చో తెలిపే కొలమానం.',
      example: 'బ్యాంకు ఖాతాలోని డబ్బు తక్షణ నగదు. భూమి లేదా ఆస్తి నెమ్మదిగా నగదుగా మారుతుంది.',
      whyInArtha: 'అర్థా మీ అత్యవసర నిధిని లెక్కించడానికి దీన్ని ఉపయోగిస్తుంది.',
    },
  },
  'resilience': {
    term: 'Financial Resilience',
    category: 'Financial Health',
    en: {
      definition: 'Your ability to withstand and recover from unexpected financial shocks, such as a delayed paycheck, sudden medical bill, or income loss.',
      example: 'Having 3-6 months of essential living expenses parked safely so a job transition does not force you into debt.',
      whyInArtha: 'Artha measures resilience across 4 transparent pillars: Runway, Obligations Coverage, Debt Burden, and Savings Rate.',
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
      definition: 'అనుకోని ఆర్థిక సమస్యలు (ఉద్యోగ మార్పు, వైద్య ఖర్చులు) ఎదురైనప్పుడు తట్టుకునే మీ సామర్థ్యం.',
      example: '3 నుండి 6 నెలల అత్యవసర ఖర్చులను సిద్ధంగా ఉంచుకోవడం.',
      whyInArtha: 'అర్థా మీ ఆర్థిక స్థిరత్వాన్ని పారదర్శకంగా అంచనా వేస్తుంది.',
    },
  },
  'z-score': {
    term: 'Z-Score Anomaly Detection',
    category: 'Statistics & Protection',
    en: {
      definition: 'A statistical measure that reveals how many standard deviations an unusual transaction is away from your usual spending average.',
      example: 'If your typical dinner bill is ₹400 (std dev ₹100), a surprise charge of ₹2,100 has a Z-score of +17.0 and gets flagged immediately.',
      whyInArtha: 'Artha uses Z-scores to flag suspicious spikes or fraud risks with exact mathematical proof, not vague guesses.',
    },
    hi: {
      definition: 'एक सांख्यिकीय माप जो दर्शाता है कि कोई नया लेनदेन आपके सामान्य औसत खर्च से कितना असामान्य रूप से दूर है।',
      example: 'यदि आपका सामान्य खाना ₹400 का है, तो अचानक ₹2,100 का चार्ज असामान्य (Z-Score > 3) के रूप में तुरंत चिन्हित होता है।',
      whyInArtha: 'अर्था गणितीय नियमों के आधार पर संदिग्ध लेनदेन को पकड़ता है ताकि आप सतर्क रह सकें।',
    },
    ta: {
      definition: 'உங்கள் இயல்பான செலவு சராசரியிலிருந்து ஒரு புதிய பரிவர்த்தனை எவ்வளவு தூரம் அசாதாரணமாக வேறுபடுகிறது என்பதைக் காட்டும் புள்ளியியல் அளவு.',
      example: 'வழக்கமான உணவு ₹400 ஆக இருக்கையில், திடீரென ₹2,100 பதிவானால் Z-score மூலம் அது எச்சரிக்கப்படும்.',
      whyInArtha: 'மர்மமான பரிவர்த்தனைகளை துல்லியமான கணித விதிகளுடன் அர்தா உங்களுக்கு சுட்டிக்காட்டுகிறது.',
    },
    te: {
      definition: 'మీ సాధారణ ఖర్చు సగటు నుండి ఏదైనా లావాదేవీ ఎంత భిన్నంగా ఉందో కొలిచే పద్ధతి.',
      example: 'రోజూ ₹400 ఖర్చయ్యే చోట ₹2,100 ఛార్జ్ పడితే అది అనుమానాస్పదంగా గుర్తించబడుతుంది.',
      whyInArtha: 'అర్థా గణిత ఆధారాలతో అసాధారణ ఖర్చులను గుర్తిస్తుంది.',
    },
  },
  'monte carlo': {
    term: 'Monte Carlo Simulation',
    category: 'Forecasting & Goals',
    en: {
      definition: 'A mathematical algorithm that runs 1,000+ randomized simulated futures of your income and spending variability to calculate the realistic odds of achieving your goal.',
      example: 'Simulating 1,000 different market and expense months shows you have an 84% chance of saving ₹60,000 for your laptop by April.',
      whyInArtha: 'Artha gives you honest probability percentages rather than making naive straight-line assumptions.',
    },
    hi: {
      definition: 'एक उन्नत गणितीय तकनीक जो 1,000+ संभावित परिदृश्यों का अनुकरण करके आपके लक्ष्य तक पहुंचने की वास्तविक संभावना (%) बताती है।',
      example: '1,000 अलग-अलग महीनों का परीक्षण करके यह बताना कि अप्रैल तक लैपटॉप के लिए ₹60,000 जमा होने की 84% संभावना है।',
      whyInArtha: 'अर्था आपको खोखले वादे नहीं, बल्कि वास्तविक संभावना बताता है।',
    },
    ta: {
      definition: '1,000-க்கும் மேற்பட்ட எதிர்கால சாத்தியக்கூறுகளை கணினி மூலம் உருவகப்படுத்தி உங்கள் சேமிப்பு இலக்கை அடைவதற்கான உண்மையான நிகழ்தகவை (%) கணக்கிடும் முறை.',
      example: '1,000 முறை சோதித்து லேப்டாப் இலக்கை அடைய 84% வாய்ப்பு உள்ளதா என்பதை தெரிவிப்பது.',
      whyInArtha: 'வெறும் எளிய கணக்கீடு செய்யாமல் சாத்தியக்கூறுகளை நேர்மையாக கணக்கிட அர்தா இதை பயன்படுத்துகிறது.',
    },
    te: {
      definition: '1,000 కంటే ఎక్కువ భవిష్యత్తు పరిస్థితులను లెక్కించి మీ లక్ష్యాన్ని చేరుకునే సంభావ్యతను (%) తెలిపే విధానం.',
      example: 'ఏప్రిల్ నాటికి ల్యాప్‌టాప్ లక్ష్యాన్ని చేరుకోవడానికి 84% అవకాశం ఉందని లెక్కించడం.',
      whyInArtha: 'అర్థా మీకు వాస్తవిక అవకాశాలను చూపుతుంది.',
    },
  },
  'reconciliation': {
    term: 'Financial Reconciliation',
    category: 'Ledger & Accuracy',
    en: {
      definition: 'The process of cross-checking records from two or more independent financial sources (e.g., UPI history vs Bank PDF) to ensure every transaction matches and catches duplicates.',
      example: 'Confirming that a ₹850 Swiggy payment recorded on Google Pay matches the exact debited line on your bank passbook.',
      whyInArtha: 'Artha compares multiple statements and highlights duplicate retries or discrepancies before updating your net worth.',
    },
    hi: {
      definition: 'दो या अधिक वित्तीय स्रोतों (जैसे यूपीआई और बैंक स्टेटमेंट) के बीच लेनदेन का मिलान करने की प्रक्रिया ताकि कोई गलती या डुप्लीकेट एंट्री न छूटे।',
      example: 'यह जांचना कि गूगल पे पर दिख रहा ₹850 का स्विगी भुगतान बैंक पासबुक से मेल खाता है या दो बार कट गया।',
      whyInArtha: 'अर्था कई स्टेटमेंट की तुलना करके आपको गलत या डुप्लीकेट कटौतियों से बचाता है।',
    },
    ta: {
      definition: 'யுபிஐ (UPI), வங்கி அறிக்கை மற்றும் கிரெடிட் கார்டு பில்களை ஒப்பிட்டு பார்த்து எண்களும் பரிவர்த்தனைகளும் சரியாக உள்ளனவா என்பதை சரிபார்க்கும் செயல்முறை.',
      example: 'கூகிள் பே-யில் பதிவான ₹850 பேங்க் ஸ்டேட்மெண்ட்டுடன் பொருந்துகிறதா அல்லது இருமுறை கழிக்கப்பட்டுள்ளதா என அறிவது.',
      whyInArtha: 'தவறான பதிவுகளையும் நகல்களையும் நீக்கி துல்லியமான கணக்கை வைக்க அர்தா உதவுகிறது.',
    },
    te: {
      definition: 'రెండు వేర్వేరు రికార్డులను (UPI మరియు బ్యాంక్ స్టేట్‌మెంట్) పోల్చి చూసి సరిచూసుకునే విధానం.',
      example: 'గూగుల్ పే లోని ₹850 బ్యాంక్ పాస్‌బుక్ ఎంట్రీతో సరిపోలుతుందో లేదో తనిఖీ చేయడం.',
      whyInArtha: 'అర్థా డూప్లికేట్ ఛార్జీలను గుర్తించడానికి రికార్డులను పోలుస్తుంది.',
    },
  },
  'deductible': {
    term: 'Deductible',
    category: 'Insurance',
    en: {
      definition: 'The upfront amount of expenses that you must pay out-of-pocket before your insurance provider begins paying for a covered claim.',
      example: 'If your health insurance has a ₹10,000 deductible and your hospital bill is ₹50,000, you pay ₹10,000 and the insurer pays ₹40,000.',
      whyInArtha: 'Artha factors your policy deductibles into your emergency fund requirements.',
    },
    hi: {
      definition: 'बीमा कंपनी द्वारा क्लेम का भुगतान शुरू करने से पहले वह राशि जो आपको अपनी जेब से चुकानी होती है।',
      example: 'यदि स्वास्थ्य बीमा में ₹10,000 का डिडक्टिबल है और अस्पताल का बिल ₹50,000 है, तो पहले ₹10,000 आप देंगे, बाकी ₹40,000 बीमा देगा।',
      whyInArtha: 'अर्था आपके इमरजेंसी फंड में इस डिडक्टिबल राशि को शामिल करने की सलाह देता है।',
    },
    ta: {
      definition: 'காப்பீட்டு நிறுவனம் க்ளைம் வழங்குவதற்கு முன் நீங்கள் சொந்த பணத்திலிருந்து செலுத்த வேண்டிய ஆரம்பத் தொகை.',
      example: 'மருத்துவமனையில் ₹50,000 பில் வந்தால், ₹10,000 நீங்கள் செலுத்திய பின் மீதி ₹40,000 இன்சூரன்ஸ் தரும்.',
      whyInArtha: 'அவசர சேமிப்பில் இந்த தொகையை முன்கூட்டியே தயார் செய்ய அர்தா நினைவூட்டுகிறது.',
    },
    te: {
      definition: 'ఇన్సూరెన్స్ కంపెనీ క్లెయిమ్ చెల్లించే ముందు మీరు స్వయంగా భరించాల్సిన ప్రారంభ మొత్తం.',
      example: 'రూ. 50,000 బిల్లులో రూ. 10,000 మీరు చెల్లించాక, మిగిలిన రూ. 40,000 బీమా ఇస్తుంది.',
      whyInArtha: 'అర్థా మీ ఎమర్జెన్సీ ఫండ్‌లో ఈ మొత్తాన్ని కూడా పరిగణనలోకి తీసుకుంటుంది.',
    },
  },
  'nach': {
    term: 'NACH Mandate',
    category: 'Banking & Auto-Pay',
    en: {
      definition: 'National Automated Clearing House mandate — an electronic authorization that lets financial institutions automatically debit funds for recurring EMIs, SIPs, or utilities.',
      example: 'Your automatic ₹6,200 home loan or personal loan EMI debited on the 15th of every month.',
      whyInArtha: 'Artha scans upcoming NACH dates so your account maintains sufficient funds to avoid ₹500+ bounce charges.',
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

export default function JargonBuster() {
  const [selectedWord, setSelectedWord] = useState(null)
  const [tooltipPos, setTooltipPos] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeLang, setActiveLang] = useState('en')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeItem, setActiveItem] = useState(FINANCIAL_TERMS['safe-to-spend'])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const popupRef = useRef(null)

  // Listen to window text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setTooltipPos(null)
        return
      }

      const rawText = selection.toString().trim()
      if (rawText.length < 2 || rawText.length > 40) {
        setTooltipPos(null)
        return
      }

      // Check if matches known term or partial
      const normalized = rawText.toLowerCase().replace(/[^a-z0-9 -]/g, '')
      let matchedKey = Object.keys(FINANCIAL_TERMS).find(k => 
        k === normalized || FINANCIAL_TERMS[k].term.toLowerCase().includes(normalized) || normalized.includes(k)
      )

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      if (rect.width > 0 && rect.height > 0) {
        setTooltipPos({
          top: Math.max(10, rect.top - 46 + window.scrollY),
          left: Math.max(10, rect.left + rect.width / 2 - 80 + window.scrollX),
        })
        setSelectedWord({
          raw: rawText,
          key: matchedKey || null,
        })
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const handleOpenTerm = (termKey, customWord = null) => {
    if (termKey && FINANCIAL_TERMS[termKey]) {
      setActiveItem(FINANCIAL_TERMS[termKey])
    } else {
      // Dynamic fallback definition for highlighted word
      const word = customWord || selectedWord?.raw || 'Financial Term'
      setActiveItem({
        term: word,
        category: 'Highlighted Term',
        en: {
          definition: `Plain-English breakdown: "${word}" represents a financial concept in your ledger or insights. Review your supporting transactions in Artha to verify how it applies to your cash flow.`,
          example: `In everyday personal finance, tracking ${word} helps you stay in control of unexpected commitments.`,
          whyInArtha: `Artha verifies every metric connected to ${word} using deterministic calculations without making assumptions.`,
        },
        hi: {
          definition: `सरल हिंदी में: "${word}" आपके वित्तीय रिकॉर्ड या स्टेटमेंट से जुड़ा एक शब्द है। अर्था आपकी व्यक्तिगत सुरक्षा के लिए इसका विश्लेषण करता है।`,
          example: `दैनिक वित्त में, ${word} को समझना आपके पैसे की सुरक्षा के लिए आवश्यक है।`,
          whyInArtha: `अर्था गणितीय नियमों के साथ इसकी गणना करता है।`,
        },
        ta: {
          definition: `எளிய தமிழில்: "${word}" என்பது உங்கள் வங்கி அல்லது பரிவர்த்தனை ஆவணங்களில் காணப்படும் ஒரு நிதி சொல்லாகும்.`,
          example: `தினசரி வாழ்க்கையில் ${word} பற்றி தெரிந்துகொள்வது எதிர்பாராத செலவுகளை தவிர்க்க உதவும்.`,
          whyInArtha: `அர்தா எந்த ஒரு கணக்கீட்டையும் துல்லியமான ஆதாரத்துடன் உங்களுக்கு விளக்குகிறது.`,
        },
        te: {
          definition: `సులభమైన వివరణ: "${word}" మీ ఆర్థిక రికార్డులకు సంబంధించిన ఒక ముఖ్యమైన పదం.`,
          example: `దీనిని అర్థం చేసుకోవడం వలన మీ ఖర్చులు అదుపులో ఉంటాయి.`,
          whyInArtha: `అర్థా ఆధారాలతో కూడిన నిజమైన లెక్కలను మాత్రమే అందిస్తుంది.`,
        },
      })
    }
    setIsOpen(true)
    setTooltipPos(null)
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

  // Filtered terms for search
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
            padding: '6px 14px',
            borderRadius: 24,
            boxShadow: '0 8px 24px rgba(0, 40, 20, 0.45)',
            border: '1px solid rgba(125,255,179,0.3)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            animation: 'fadeInUp 0.18s ease-out',
            whiteSpace: 'nowrap',
          }}
          onClick={() => handleOpenTerm(selectedWord.key, selectedWord.raw)}
        >
          <Sparkles size={14} color="#7dffb3" />
          <span>Explain "{selectedWord.raw.slice(0, 16)}{selectedWord.raw.length > 16 ? '…' : ''}"</span>
          <span style={{ background: 'rgba(125,255,179,0.2)', padding: '2px 6px', borderRadius: 12, fontSize: 10, color: '#7dffb3' }}>
            Jargon Buster
          </span>
        </div>
      )}

      {/* ── Floating Corner Action Pill (Always accessible) ─────────────────── */}
      <div
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
          boxShadow: '0 6px 20px rgba(13, 79, 46, 0.4)',
          border: '1px solid rgba(125,255,179,0.3)',
          fontWeight: 600,
          fontSize: 13,
          transition: 'all 0.2s ease',
        }}
        onClick={() => setIsOpen(true)}
      >
        <BookOpen size={16} color="#7dffb3" />
        <span>Jargon Buster</span>
        <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 10 }}>
          Highlight any word
        </span>
      </div>

      {/* ── Slide-Out Popover / Drawer ────────────────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 20, 10, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={popupRef}
            style={{
              width: '100%',
              maxWidth: 480,
              height: '100%',
              background: '#ffffff',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>Artha Jargon Buster</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#a7f3d0' }}>Plain-language financial explainer</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Language Selector Tabs */}
              <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
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
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
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
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {/* Active Term Card */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                padding: '20px 22px',
                marginBottom: 24,
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
                      letterSpacing: 0.5,
                    }}>
                      {activeItem.category}
                    </span>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '8px 0 0' }}>
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
                      fontWeight: 600,
                    }}
                  >
                    <Volume2 size={15} />
                    <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                  </button>
                </div>

                {/* Definition */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    What it means
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: '#1e293b', margin: '6px 0 16px', fontWeight: 500 }}>
                    {currentContent.definition}
                  </p>
                </div>

                {/* Real-World Analogy */}
                <div style={{
                  background: '#f0fdf4',
                  borderLeft: '4px solid #16a34a',
                  padding: '12px 16px',
                  borderRadius: '0 8px 8px 0',
                  marginBottom: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>💡 Real-World Example</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#166534', margin: '4px 0 0', lineHeight: 1.5 }}>
                    {currentContent.example}
                  </p>
                </div>

                {/* Why it matters in Artha */}
                <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    ✦ Why it matters in Artha
                  </div>
                  <p style={{ fontSize: 13, color: '#334155', margin: '4px 0 0', lineHeight: 1.5 }}>
                    {currentContent.whyInArtha}
                  </p>
                </div>
              </div>

              {/* Search & Browse All Terms */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  Search or Browse Financial Terms
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
                  <input
                    type="text"
                    placeholder="Search terms: EMI, APR, Z-Score, NACH…"
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

              {/* Terms List */}
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
                        background: isCur ? '#e0f2fe' : '#ffffff',
                        border: isCur ? '1.5px solid #38bdf8' : '1px solid #f1f5f9',
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
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', textAlign: 'center' }}>
              💡 Tip: Highlight any financial word on any screen to open instant definitions!
            </div>
          </div>
        </div>
      )}
    </>
  )
}
