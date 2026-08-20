# ProofSpider 🕷️
> **The evidence web behind what brands claim.**

ProofSpider transforms marketing claims into an interactive, verifiable evidence graph powered by a custom Bright Data Scraper Studio collector and conservative evidence classification.

---

## 🎯 Problem
Consumer electronics product pages often make bold claims—such as *"Industry-leading noise cancellation"*, *"Up to 30-hour battery life"*, and *"Built for years of listening"*—while warranty disclaimers, technical footnotes, and return policies restrict or qualify those claims elsewhere. Consumers and AI agents need transparent, structured visibility into what is actually backed by public evidence.

---

## ⚡ What ProofSpider Does
1. **Pasting a product URL** triggers a custom Bright Data Scraper Studio collector.
2. **Collects live structured evidence**: Marketing claims, technical specifications, footnote disclaimers, warranty links, and return policies.
3. **Classifies claims conservatively** into 4 verdicts:
   - 🟢 **Supported**: Direct public evidence supports the claim with no discovered material qualifier.
   - 🟡 **Qualified**: Evidence supports the core claim, but important limits, exclusions, or operating conditions exist (e.g. footnote testing dates, codec-dependent battery life, ambient restrictions).
   - 🔴 **Conflicted**: Public sources associated with the product appear to disagree.
   - ⚪ **Unknown**: The claim exists on marketing copy, but adequate public supporting evidence was not found.
4. **Renders an interactive Evidence Web** using React Flow (`@xyflow/react`) with slide-over evidence drawers detailing source quotes and clickable URLs.

---

## 🌐 Bright Data Scraper Studio Usage
- **Custom Scraper Studio Collector**: Created specifically for consumer electronics product pages.
- **Real Collector ID**: `c_mt1v2vo62kutyo7m6k`
  - Dashboard: [https://brightdata.com/cp/scrapers/c_mt1v2vo62kutyo7m6k](https://brightdata.com/cp/scrapers/c_mt1v2vo62kutyo7m6k)
- **Triggering Pipeline**: Integrated via Bright Data CLI (`bdata scraper run`) and Next.js server-side API.
- **Self-Healing Verification**:
  - Executed `bdata scraper heal` to refine numeric price formatting, footnote extraction, and policy links (`artifacts/heal.json`).
  - Approved healed candidate with `bdata scraper approve` (`artifacts/heal-approved.json`).
  - Re-ran verification scrape on `https://www.sony.com/electronics/headband-headphones/wh-1000xm5` (`artifacts/sony-wh1000xm5-healed.json`).
- **Collector Reusability**:
  - Successfully verified across multiple public Sony product pages:
    - Sony WH-1000XM5: `artifacts/sony-wh1000xm5-run.json`
    - Sony WH-1000XM4: `artifacts/sony-wh1000xm4-run.json`
    - Sony WH-CH720N: `artifacts/sony-whch720n-run.json`

---

## 📂 Example Structured Output
- Example output committed at: [`public/example-output.json`](./public/example-output.json) and [`artifacts/sony-wh1000xm5-run.json`](./artifacts/sony-wh1000xm5-run.json)
- Normalized ProofSpider analysis: [`artifacts/normalized-proofspider-result.json`](./artifacts/normalized-proofspider-result.json)

---

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/proofspider.git
cd proofspider
npm install
```

### 2. Configure Environment Variables (Optional for Live Runs)
Create `.env.local`:
```env
BRIGHTDATA_API_KEY=your_bright_data_api_key
BRIGHTDATA_COLLECTOR_ID=c_mt1v2vo62kutyo7m6k
```
*(Note: ProofSpider includes pre-cached verified collector artifacts for seeded test targets so you can run the app immediately even without an API key).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 AI Disclosure
Built with an AI coding assistant. All architecture, collector prompt design, data normalization pipelines, and user interface components were reviewed, tested, and understood by the team.

---

## ⚖️ Limitations
ProofSpider does not make legal, truth, or safety determinations. It extracts public manufacturer statements, specifications, and fine-print footnotes, mapping claims directly to their corresponding public evidence.
