/**
 * Artha Jargon Buster Dictionary
 * Multi-lingual explanations (English, Hindi, Tamil, Telugu) with real-world analogies.
 * Used by content scripts (in-page tooltips) and the side panel/popup.
 */

const FINANCIAL_TERMS = {
  'safe-to-spend': {
    term: 'Safe-to-Spend',
    category: 'Daily Budgeting',
    aliases: ['safe to spend', 'safetospend', 'disposable balance', 'spendable amount'],
    en: {
      definition: 'The calculated amount you can safely spend today without risking missing upcoming bills, rent, EMIs, or monthly savings goals.',
      example: 'If you have ₹25,000 in your bank, but ₹11,500 is needed for upcoming rent and ₹5,000 for your SIP, your actual Safe-to-Spend is ₹8,500.',
      whyInArtha: 'Artha computes this dynamically so you see one actionable daily spending number instead of getting confused by total bank balances.'
    },
    hi: {
      definition: 'वह सुरक्षित राशि जिसे आप आज बेझिझक खर्च कर सकते हैं, बिना आगामी बिलों, किराए, लोन ईएमआई या बचत योजनाओं को खतरे में डाले।',
      example: 'यदि आपके खाते में ₹25,000 हैं, लेकिन ₹11,500 किराया और ₹5,000 एसआईपी के लिए चाहिए, तो आपकी सुरक्षित खर्च राशि ₹8,500 है।',
      whyInArtha: 'अर्था इसे स्वचालित रूप से गणना करता है ताकि आपको कुल बैलेंस देखकर भ्रमित न होना पड़े।'
    },
    ta: {
      definition: 'வரவிருக்கும் வாடகை, கடன் தவணைகள் (EMI) மற்றும் சேமிப்புகளை பாதிக்காமல் நீங்கள் இன்றே சுதந்திரமாக செலவிடக்கூடிய பாதுகாப்பான தொகை.',
      example: 'வங்கி கணக்கில் ₹25,000 இருந்தாலும், வாடகைக்கு ₹11,500, சேமிப்புக்கு ₹5,000 ஒதுக்கிய பின், நீங்கள் செலவிடக்கூடிய பாதுகாப்பான தொகை ₹8,500 மட்டுமே.',
      whyInArtha: 'ஒரே பார்வையில் குழப்பமில்லாமல் செலவு செய்ய அர்தா இதை துல்லியமாக கணக்கிட்டு காட்டுகிறது.'
    },
    te: {
      definition: 'రాబోయే బిల్లులు, రుణాలు మరియు పొదుపులకు ఆటంకం కలగకుండా మీరు ఈ రోజు సురక్షితంగా ఖర్చు చేయగల మొత్తం.',
      example: 'మీ ఖాతాలో ₹25,000 ఉన్నప్పటికీ, బిల్లులకు ₹11,500 పోను, మిగిలిన సురక్షిత మొత్తం ₹8,500.',
      whyInArtha: 'అర్థా ఈ సంఖ్యను స్పష్టంగా లెక్కిస్తుంది, తద్వారా మీరు అధిక ఖర్చు చేయకుండా ఉంటారు.'
    }
  },
  'apr': {
    term: 'APR (Annual Percentage Rate)',
    category: 'Credit & Loans',
    aliases: ['apr', 'annual percentage rate', 'effective interest rate'],
    en: {
      definition: 'The true yearly cost of borrowing money, including the base interest rate plus all mandatory processing fees and hidden charges.',
      example: 'A loan advertising 12% interest with a 2% upfront processing fee actually has an APR of ~14.2%.',
      whyInArtha: 'Artha compares the true APR of credit cards and loans rather than misleading headline interest rates.'
    },
    hi: {
      definition: 'पैसे उधार लेने की कुल वार्षिक लागत, जिसमें ब्याज दर के साथ-साथ सभी प्रोसेसिंग और प्रशासनिक शुल्क शामिल होते हैं।',
      example: 'यदि किसी ऋण पर 12% ब्याज और 2% प्रोसेसिंग शुल्क है, तो वास्तविक वार्षिक दर (APR) लगभग 14.2% होती है।',
      whyInArtha: 'अर्था आपको केवल विज्ञापित ब्याज दर नहीं, बल्कि ऋण की वास्तविक लागत समझाता है।'
    },
    ta: {
      definition: 'ஒரு கடன் பெறுவதற்கான உண்மையான ஆண்டு மொத்த செலவு (வட்டி + செயலாக்கக் கட்டணங்கள் உள்ளிட்டவை).',
      example: '12% வட்டி என்று கூறப்பட்டாலும் 2% கட்டணம் சேர்ந்தால் உண்மையான APR 14%க்கும் மேல் ஆகும்.',
      whyInArtha: 'மறைமுக கட்டணங்களை தவிர்த்து கடனின் உண்மையான சுமையை அறிய அர்தா உதவுகிறது.'
    },
    te: {
      definition: 'రుణం పొందడానికి అయ్యే పూర్తి వార్షిక ఖర్చు, ఇందులో వడ్డీతో పాటు అన్ని ప్రాసెసింగ్ ఫీజులు ఉంటాయి.',
      example: '12% వడ్డీతో పాటు 2% ఫీజు కలిపితే అసలు APR 14% మించుతుంది.',
      whyInArtha: 'అర్థా మీకు క్రెడిట్ కార్డుల నిజమైన ఖర్చును చూపిస్తుంది.'
    }
  },
  'emi': {
    term: 'EMI (Equated Monthly Installment)',
    category: 'Banking & Debt',
    aliases: ['emi', 'equated monthly installment', 'loan installment', 'monthly installment'],
    en: {
      definition: 'A fixed monthly payment amount made by a borrower to a lender on a specific date each month until a loan is fully repaid.',
      example: 'Paying ₹6,200 every month on the 15th for your personal loan until the balance reaches zero.',
      whyInArtha: 'Artha automatically subtracts your upcoming EMIs from your liquid balance so your payments never bounce.'
    },
    hi: {
      definition: 'एक निश्चित मासिक किस्त जो हर महीने एक तय तारीख को कर्ज चुकाने के लिए बैंक को दी जाती है।',
      example: 'अपने पर्सनल लोन के लिए हर महीने 15 तारीख को ₹6,200 चुकाना।',
      whyInArtha: 'अर्था आगामी ईएमआई को पहले से सुरक्षित रखता है ताकि बाउंस पेनल्टी न लगे।'
    },
    ta: {
      definition: 'கடன் தீரும் வரை ஒவ்வொரு மாதமும் குறிப்பிட்ட தேதியில் வங்கிக்கு செலுத்தும் சமமான மாதாந்திர தவணை.',
      example: 'தனிநபர் கடனுக்காக மாதந்தோறும் 15-ஆம் தேதி செலுத்தும் ₹6,200 தவணை.',
      whyInArtha: 'EMI தவணை தவறாமல் இருக்க உங்கள் பாதுகாப்பான தொகையிலிருந்து அர்தா இதை முன்கூட்டியே ஒதுக்குகிறது.'
    },
    te: {
      definition: 'రుణం పూర్తయ్యే వరకు ప్రతి నెలా నిర్ణీత తేదీన చెల్లించే సమాన నెలవారీ వాయిదా.',
      example: 'ప్రతి నెలా 15న చెల్లించే ₹6,200 వ్యక్తిగత రుణ వాయిదా.',
      whyInArtha: 'అర్థా మీ రాబోయే EMIలను ముందుగానే ట్రాక్ చేస్తుంది.'
    }
  },
  'resilience': {
    term: 'Financial Resilience',
    category: 'Financial Health',
    aliases: ['resilience', 'financial resilience', 'emergency fund runway'],
    en: {
      definition: 'Your ability to withstand unexpected life shocks (like job delays, medical emergencies, or car repairs) without falling into high-interest debt.',
      example: 'Having 3-6 months of living expenses parked in safe liquid savings so an income pause is manageable.',
      whyInArtha: 'Artha measures resilience across 4 transparent pillars: Runway, Obligations Coverage, Debt Ratio, and Savings Stability.'
    },
    hi: {
      definition: 'अचानक आने वाले वित्तीय झटकों (जैसे वेतन में देरी या अप्रत्याशित चिकित्सा बिल) को बिना कर्ज लिए झेलने की आपकी क्षमता।',
      example: '3 से 6 महीने का खर्च सुरक्षित रखना ताकि कोई आपात स्थिति आने पर कर्ज न लेना पड़े।',
      whyInArtha: 'अर्था आपकी वित्तीय मजबूती को 4 पारदर्शी नियमों के आधार पर मापता है।'
    },
    ta: {
      definition: 'திடீர் வேலை இழப்பு, மருத்துவ செலவு அல்லது சம்பள தாமதம் போன்ற நிதி நெருக்கடிகளை தாங்கும் திறன்.',
      example: 'எந்தவித கடன் வாங்காமலும் 3 முதல் 6 மாதங்கள் வாழ்க்கையை நடத்தும் அளவுக்கு அவசர நிதி வைத்திருப்பது.',
      whyInArtha: 'உங்கள் நிதி பாதுகாப்பு திறனை 4 வெளிப்படையான காரணிகள் மூலம் அர்தா மதிப்பீடு செய்கிறது.'
    },
    te: {
      definition: 'అనుకోని ఆర్థిక సమస్యలు ఎదురైనప్పుడు తట్టుకునే మీ సామర్థ్యం.',
      example: '3 నుండి 6 నెలల అత్యవసర ఖర్చులను సిద్ధంగా ఉంచుకోవడం.',
      whyInArtha: 'అర్థా మీ ఆర్థిక స్థిరత్వాన్ని పారదర్శకంగా అంచనా వేస్తుంది.'
    }
  },
  'z-score': {
    term: 'Z-Score Anomaly Detection',
    category: 'AI & Statistics',
    aliases: ['z-score', 'zscore', 'anomaly detection', 'spending spike'],
    en: {
      definition: 'A statistical metric measuring how unusually high a transaction is compared to your personal spending baseline.',
      example: 'If your typical dinner order is ₹400, a sudden charge of ₹2,100 triggers an anomaly warning because it is > 2.5 standard deviations above your norm.',
      whyInArtha: 'Artha flags suspicious patterns with mathematical proof instead of unverified assumptions.'
    },
    hi: {
      definition: 'एक सांख्यिकीय माप जो दर्शाता है कि कोई नया लेनदेन आपके सामान्य औसत खर्च से कितना असामान्य रूप से बड़ा है।',
      example: 'यदि आपका सामान्य खाना ₹400 का है, तो अचानक ₹2,100 का चार्ज असामान्य रूप से चिन्हित होता है।',
      whyInArtha: 'अर्था गणितीय नियमों के आधार पर संदिग्ध लेनदेन को पकड़ता है।'
    },
    ta: {
      definition: 'உங்கள் வழக்கமான செலவிலிருந்து ஒரு புதிய பரிவர்த்தனை எவ்வளவு தூரம் அசாதாரணமாக வேறுபடுகிறது என்பதைக் காட்டும் கணித அளவு.',
      example: 'வழக்கமான உணவு ₹400 ஆக இருக்கையில், திடீரென ₹2,100 பதிவானால் Z-score மூலம் அது எச்சரிக்கப்படும்.',
      whyInArtha: 'மர்மமான பரிவர்த்தனைகளை துல்லியமான விதிகளுடன் அர்தா சுட்டிக்காட்டுகிறது.'
    },
    te: {
      definition: 'మీ సాధారణ ఖర్చు సగటు నుండి ఏదైనా లావాదేవీ ఎంత భిన్నంగా ఉందో కొలిచే పద్ధతి.',
      example: 'రోజూ ₹400 ఖర్చయ్యే చోట ₹2,100 ఛార్జ్ పడితే అది అనుమానాస్పదంగా గుర్తించబడుతుంది.',
      whyInArtha: 'అర్థా గణిత ఆధారాలతో అసాధారణ ఖర్చులను గుర్తిస్తుంది.'
    }
  },
  'nach': {
    term: 'NACH Mandate',
    category: 'Banking & Auto-Pay',
    aliases: ['nach', 'nach mandate', 'e-mandate', 'auto debit mandate'],
    en: {
      definition: 'National Automated Clearing House — an electronic mandate permitting institutions to auto-debit recurring payments for loans, SIPs, or utilities.',
      example: 'Your home loan or mutual fund SIP debited automatically on the 5th of each month.',
      whyInArtha: 'Artha tracks upcoming NACH dates so your account always maintains enough balance to avoid ₹500+ bounce charges.'
    },
    hi: {
      definition: 'एक इलेक्ट्रॉनिक अनुमति जो बैंक को आपके खाते से मासिक ईएमआई या एसआईपी स्वचालित रूप से काटने की अनुमति देती है।',
      example: 'हर महीने की 15 तारीख को ₹6,200 की लोन ईएमआई का ऑटो-डेबिट।',
      whyInArtha: 'अर्था बाउंस शुल्क से बचने के लिए एनएसीएच देय तिथियों को पहले से ट्रैक करता है।'
    },
    ta: {
      definition: 'மாதாந்திர கடன் தவணைகள் மற்றும் முதலீடுகளை உங்கள் வங்கி கணக்கிலிருந்து தானாகவே கழிக்க வழங்கப்படும் மின்னணு அங்கீகாரம்.',
      example: 'ஒவ்வொரு 15-ஆம் தேதியும் வங்கி தானாகவே எடுக்கும் ₹6,200 தவணை.',
      whyInArtha: 'கணக்கில் பணம் பற்றாக்குறையாகி பவுன்ஸ் கட்டணம் விழுவதை தடுக்க அர்தா இதை முன்னரே எச்சரிக்கிறது.'
    },
    te: {
      definition: 'మీ ఖాతా నుండి స్వయంచాలకంగా లోన్ EMI లేదా SIP మినహాయించడానికి ఇచ్చే అధికారిక అనుమతి.',
      example: 'ప్రతి నెలా 15న ఆటోమేటిక్‌గా కట్ అయ్యే ₹6,200 EMI.',
      whyInArtha: 'బౌన్స్ ఛార్జీలు పడకుండా ఉండేందుకు అర్థా ఈ తేదీలను ట్రాక్ చేస్తుంది.'
    }
  },
  'reconciliation': {
    term: 'Financial Reconciliation',
    category: 'Accounting & Ledger',
    aliases: ['reconciliation', 'reconcile', 'statement matching'],
    en: {
      definition: 'Cross-checking independent sources (UPI history, bank statements, credit card bills) to ensure amounts match and duplicates are eliminated.',
      example: 'Verifying that a ₹850 Swiggy payment shown in your Google Pay history only debited your bank account once.',
      whyInArtha: 'Artha matches multi-source records to catch duplicate retries and statement discrepancies.'
    },
    hi: {
      definition: 'दो या अधिक वित्तीय स्रोतों (जैसे यूपीआई और बैंक स्टेटमेंट) के बीच लेनदेन का मिलान करने की प्रक्रिया ताकि कोई गलती न छूटे।',
      example: 'यह जांचना कि गूगल पे पर दिख रहा ₹850 का स्विगी भुगतान बैंक पासबुक से मेल खाता है या दो बार कट गया।',
      whyInArtha: 'अर्था कई स्टेटमेंट की तुलना करके आपको गलत कटौतियों से बचाता है।'
    },
    ta: {
      definition: 'யுபிஐ (UPI), வங்கி அறிக்கை மற்றும் கிரெடிட் கார்டு பில்களை ஒப்பிட்டு பார்த்து எண்களும் பரிவர்த்தனைகளும் சரியாக உள்ளனவா என்பதை சரிபார்க்கும் முறை.',
      example: 'கூகிள் பே-யில் பதிவான ₹850 பேங்க் ஸ்டேட்மெண்ட்டுடன் பொருந்துகிறதா அல்லது இருமுறை கழிக்கப்பட்டுள்ளதா என அறிவது.',
      whyInArtha: 'தவறான பதிவுகளையும் நகல்களையும் நீக்கி துல்லியமான கணக்கை வைக்க அர்தா உதவுகிறது.'
    },
    te: {
      definition: 'రెండు వేర్వేరు రికార్డులను (UPI మరియు బ్యాంక్ స్టేట్‌మెంట్) పోల్చి చూసి సరిచూసుకునే విధానం.',
      example: 'గూగుల్ పే లోని ₹850 బ్యాంక్ పాస్‌బుక్ ఎంట్రీతో సరిపోలుతుందో లేదో తనిఖీ చేయడం.',
      whyInArtha: 'అర్థా డూప్లికేట్ ఛార్జీలను గుర్తించడానికి రికార్డులను పోలుస్తుంది.'
    }
  },
  'sip': {
    term: 'SIP (Systematic Investment Plan)',
    category: 'Investments',
    aliases: ['sip', 'systematic investment plan', 'mutual fund sip'],
    en: {
      definition: 'A method of investing a fixed sum of money at regular intervals (usually monthly) in a mutual fund, promoting rupee-cost averaging.',
      example: 'Automatically investing ₹5,000 every month on your salary day into an index fund.',
      whyInArtha: 'Artha includes planned SIPs as essential monthly obligations inside your Safe-to-Spend calculations.'
    },
    hi: {
      definition: 'म्यूचुअल फंड में नियमित अंतराल (आमतौर पर हर महीने) पर एक निश्चित राशि निवेश करने की योजना।',
      example: 'हर महीने ₹5,000 इंडेक्स फंड में नियमित रूप से निवेश करना।',
      whyInArtha: 'अर्था आपके एसआईपी को महत्वपूर्ण आगामी प्रतिबद्धता मानकर बजट तय करता है।'
    },
    ta: {
      definition: 'ஒவ்வொரு மாதமும் ஒரு குறிப்பிட்ட தொகையை மியூச்சுவல் ஃபண்டில் தொடர்ந்து முதலீடு செய்யும் எளிய திட்டம்.',
      example: 'மாதந்தோறும் ₹5,000 தொகையை இண்டெக்ஸ் ஃபண்டில் செலுத்துவது.',
      whyInArtha: 'உங்கள் சேமிப்பு தடைபடாமல் இருக்க அர்தா இதை செலவுக்கணக்கில் முன்கூட்டியே ஒதுக்குகிறது.'
    },
    te: {
      definition: 'ప్రతి నెలా ఒక నిర్దిష్ట మొత్తాన్ని మ్యూచువల్ ఫండ్‌లలో క్రమబద్ధంగా పెట్టుబడి పెట్టే విధానం.',
      example: 'ప్రతి నెలా ₹5,000 ఇండెక్స్ ఫండ్‌లో ఇన్వెస్ట్ చేయడం.',
      whyInArtha: 'అర్థా మీ SIPలను ముఖ్యమైన బాధ్యతలుగా పరిగణిస్తుంది.'
    }
  },
  'nav': {
    term: 'NAV (Net Asset Value)',
    category: 'Investments',
    aliases: ['nav', 'net asset value'],
    en: {
      definition: 'The per-unit market value of a mutual fund scheme, calculated by dividing the total net assets of the scheme by the total number of outstanding units.',
      example: 'If a fund manages ₹100 crore and has 5 crore units, its NAV is ₹20 per unit.',
      whyInArtha: 'Helps evaluate portfolio valuations against historical purchase cost.'
    },
    hi: {
      definition: 'म्यूचुअल फंड की एक यूनिट का शुद्ध बाजार मूल्य।',
      example: 'यदि किसी फंड का कुल मूल्य ₹100 करोड़ और 5 करोड़ यूनिट्स हैं, तो NAV ₹20 प्रति यूनिट होगा।',
      whyInArtha: 'यह आपके पोर्टफोलियो का सही और अद्यतन मूल्य जानने में मदद करता है।'
    },
    ta: {
      definition: 'மியூச்சுவல் ஃபண்டின் ஒரு யூனிட்டின் தற்போதைய சந்தை மதிப்பு.',
      example: 'ஒரு ஃபண்டின் மொத்த சொத்து ₹100 கோடி மற்றும் 5 கோடி யூனிட்டுகள் என்றால், அதன் NAV ₹20 ஆகும்.',
      whyInArtha: 'உங்கள் முதலீட்டின் உண்மையான மதிப்பை அறிய உதவுகிறது.'
    },
    te: {
      definition: 'మ్యూచువల్ ఫండ్ యొక్క ఒక యూనిట్ మార్కెట్ విలువ.',
      example: 'ఒక ఫండ్ నికర ఆస్తులు ₹100 కోట్లు, 5 కోట్ల యూనిట్లు ఉంటే, దాని NAV ₹20.',
      whyInArtha: 'మీ పెట్టుబడుల ప్రస్తుత విలువను తెలుసుకోవడానికి సహాయపడుతుంది.'
    }
  },
  'cibil': {
    term: 'CIBIL / Credit Score',
    category: 'Credit & Loans',
    aliases: ['cibil', 'credit score', 'cibil score', 'experian score'],
    en: {
      definition: 'A 3-digit numerical summary (between 300 and 900) of your credit history that lenders evaluate before approving credit cards or loans.',
      example: 'A score above 750 qualifies you for lower home loan interest rates and swift pre-approvals.',
      whyInArtha: 'Keeping high card utilization (<30%) and never missing EMI dates in Artha protects your CIBIL score.'
    },
    hi: {
      definition: '300 से 900 के बीच का 3-अंकों का स्कोर जो आपके ऋण और पुनर्भुगतान इतिहास को दर्शाता है।',
      example: '750 से अधिक का स्कोर कम ब्याज दरों पर आसानी से ऋण प्राप्त करने में मदद करता है।',
      whyInArtha: 'समय पर ईएमआई चुकाने से आपका सिबिल स्कोर हमेशा मजबूत बना रहता है।'
    },
    ta: {
      definition: '300 முதல் 900 வரையிலான உங்கள் கடன் ஒழுங்கு மற்றும் திருப்பியளிக்கும் வரலாற்றை காட்டும் எண் மதிப்பு.',
      example: '750க்கு மேற்பட்ட கிரெடிட் ஸ்கோர் இருந்தால் குறைந்த வட்டியில் எளிதாக கடன் கிடைக்கும்.',
      whyInArtha: 'சரியான நேரத்தில் பில் மற்றும் இஎம்ஐ செலுத்த அர்தா நினைவூட்டுவதால் கிரெடிட் ஸ்கோர் உயரும்.'
    },
    te: {
      definition: '300 నుండి 900 వరకు ఉండే మీ క్రెడిట్ చరిత్ర మరియు లోన్ రీపేమెంట్ సామర్థ్యాన్ని తెలిపే స్కోరు.',
      example: '750 కంటే ఎక్కువ స్కోరు ఉంటే తక్కువ వడ్డీతో లోన్లు త్వరగా మంజూరవుతాయి.',
      whyInArtha: 'క్రమం తప్పకుండా EMIలు చెల్లించేలా చూసి అర్థా మీ క్రెడిట్ స్కోర్‌ను కాపాడుతుంది.'
    }
  }
};

/**
 * Normalizes and looks up a word or phrase against the dictionary.
 */
function findFinancialTerm(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const cleaned = rawText.trim().toLowerCase().replace(/[^a-z0-9 -]/g, '');
  if (!cleaned || cleaned.length < 2) return null;

  // Direct key match
  if (FINANCIAL_TERMS[cleaned]) {
    return { key: cleaned, data: FINANCIAL_TERMS[cleaned] };
  }

  // Check aliases and term titles
  for (const [key, item] of Object.entries(FINANCIAL_TERMS)) {
    if (item.term.toLowerCase() === cleaned) return { key, data: item };
    if (item.aliases && item.aliases.some(a => a.toLowerCase() === cleaned)) {
      return { key, data: item };
    }
  }

  // Partial / inclusion search for short phrases
  if (cleaned.length >= 3 && cleaned.length <= 35) {
    for (const [key, item] of Object.entries(FINANCIAL_TERMS)) {
      if (cleaned.includes(key) || item.term.toLowerCase().includes(cleaned)) {
        return { key, data: item };
      }
      if (item.aliases && item.aliases.some(a => cleaned.includes(a) || a.includes(cleaned))) {
        return { key, data: item };
      }
    }
  }

  return null;
}

// Export for module/worker or window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FINANCIAL_TERMS, findFinancialTerm };
}
if (typeof window !== 'undefined') {
  window.FINANCIAL_TERMS = FINANCIAL_TERMS;
  window.findFinancialTerm = findFinancialTerm;
}
