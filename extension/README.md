# Artha Chrome Extension — All Your Money, One Clear Picture

> **Your private money companion across the web**: Safe-to-Spend shopping guardian, 1-click receipt clipper, and in-page financial Jargon Buster powered by Gemma 4.

---

## 🌟 Key Features

### 1. 🛡️ Safe-to-Spend Shopping Guardian
- **Impulse & Budget Check**: When browsing or checking out on e-commerce sites (**Amazon, Flipkart, Swiggy, Zomato, Myntra, etc.**), Artha automatically scans the cart total.
- **Real-Time Math**: Shows your remaining Safe-to-Spend balance after subtracting upcoming rent, bills, EMIs, and monthly SIP commitments.
- **Instant Verdict**: Displays whether the cart is within your daily allowance or if it encroaches into your emergency safety cushion.

### 2. 📥 1-Click "Clip to Artha" (Receipt & Statement Ingestion)
- **Web Receipts & Bills**: Right-click on invoice emails (Gmail/Outlook), net banking portals, or payment confirmation screens to capture.
- **Multimodal OCR**: Powered by **Gemma 4** (`POST /api/artha/upload`), extracting transaction date, merchant, amount, category, and confidence score.
- **Instant Ledger Review**: Review proposed entries and confirm them into your unified ledger with one click.

### 3. 💡 In-Page Multilingual Jargon Buster
- **Zero-Friction Education**: Highlight any financial term (*APR, EMI, NACH, Safe-to-Spend, Z-Score, Resilience, NAV, SIP, CIBIL*) on any website.
- **Instant Explanation**: Shows simple definitions, real-world analogies, and "Why it matters in Artha".
- **4 Languages & Speech**: Toggle definitions between **English, Hindi (हिंदी), Tamil (தமிழ்), and Telugu (తెలుగు)** with built-in text-to-speech pronunciation.

### 4. 📊 Persistent Companion Side Panel
- Dock Artha into Chrome's native Side Panel (`chrome.sidePanel`) to have your full financial picture open beside your browser tabs:
  - **Safe-to-Spend Hero Card** with dynamic safety buffer slider (5% to 30%).
  - **Net Worth & Cash Flow** gauges.
  - **Upcoming Bills Timeline** with days remaining warnings.
  - **Anomalies & Duplicate Finder** (Z-score spike detection).
  - **Conversational AI Financial Coach** in English, Hindi, and Tamil.

---

## 🚀 Quick Setup (Load Unpacked in Chrome)

1. **Start the Artha Backend**:
   Make sure the Artha Flask backend is running on `http://localhost:5000`:
   ```bash
   # From the root repository directory
   python app.py
   ```

2. **Open Chrome Extensions Manager**:
   - In Google Chrome, navigate to `chrome://extensions/`
   - Enable **Developer mode** toggle in the top-right corner.

3. **Load the Extension**:
   - Click **"Load unpacked"**.
   - Select the `extension/` folder in this repository.

4. **Pin Artha to Toolbar**:
   - Click the Extensions puzzle icon in Chrome's top bar and pin **Artha**.
   - Click the Artha icon to open the quick popup or press the Side Panel button!

5. **Demo Credentials**:
   - Pre-filled email: `priya@demo.artha`
   - Password: `demo1234`

---

## 🔒 Privacy & Architecture

- **Private by Design**: Financial documents and credentials remain on your local Artha backend (or local Ollama model if running offline).
- **Manifest V3**: Built using modern Chrome Extension standards (`service_worker`, `sidePanel`, declarative permissions).
- **Offline Jargon Dictionary**: The 50+ term multi-lingual financial dictionary runs completely offline client-side without external network calls.
