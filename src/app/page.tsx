'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Link as LinkIcon, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const EXAMPLES = [
  { label: 'Sony WH-1000XM5', url: 'https://www.sony.com/electronics/headband-headphones/wh-1000xm5', note: 'HEALED RUN' },
  { label: 'Apple AirPods Max', url: 'https://www.apple.com/airpods-max/', note: 'VERIFIED RUN' },
  { label: 'Bose QC Ultra', url: 'https://www.bose.com/p/headphones/bose-quietcomfort-ultra-headphones/QCU-HEADPHONEARN.html', note: 'VERIFIED RUN' },
  { label: 'Galaxy S24 Ultra', url: 'https://www.samsung.com/us/smartphones/galaxy-s24-ultra/', note: 'VERIFIED RUN' },
];

/* ---- SVG Spider Web pattern for the hero background (static coords to avoid hydration mismatch) ---- */
function SpiderWebSVG() {
  return (
    <svg className="ps-spider-web-svg" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Radial lines from center (every 30°) */}
      <line x1="400" y1="400" x2="800" y2="400" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="746.41" y2="200" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="600" y2="53.59" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="400" y2="0" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="200" y2="53.59" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="53.59" y2="200" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="0" y2="400" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="53.59" y2="600" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="200" y2="746.41" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="400" y2="800" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="600" y2="746.41" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      <line x1="400" y1="400" x2="746.41" y2="600" stroke="rgba(237,28,36,0.08)" strokeWidth="0.8" />
      {/* Concentric web rings */}
      <polygon points="480,400 469.28,360 440,330.72 400,320 360,330.72 330.72,360 320,400 330.72,440 360,469.28 400,480 440,469.28 469.28,440" fill="none" stroke="rgba(237,28,36,0.06)" strokeWidth="0.6" />
      <polygon points="560,400 538.56,320 480,261.44 400,240 320,261.44 261.44,320 240,400 261.44,480 320,538.56 400,560 480,538.56 538.56,480" fill="none" stroke="rgba(237,28,36,0.06)" strokeWidth="0.6" />
      <polygon points="640,400 607.85,280 520,192.15 400,160 280,192.15 192.15,280 160,400 192.15,520 280,607.85 400,640 520,607.85 607.85,520" fill="none" stroke="rgba(237,28,36,0.06)" strokeWidth="0.6" />
      <polygon points="720,400 677.13,240 560,122.87 400,80 240,122.87 122.87,240 80,400 122.87,560 240,677.13 400,720 560,677.13 677.13,560" fill="none" stroke="rgba(237,28,36,0.06)" strokeWidth="0.6" />
      <polygon points="800,400 746.41,200 600,53.59 400,0 200,53.59 53.59,200 0,400 53.59,600 200,746.41 400,800 600,746.41 746.41,600" fill="none" stroke="rgba(237,28,36,0.06)" strokeWidth="0.6" />
    </svg>
  );
}

/* ---- Animated web lines that shoot across the screen ---- */
function WebStrings() {
  return (
    <div className="ps-web-strings" aria-hidden="true">
      <div className="ps-web-string ps-ws-1" />
      <div className="ps-web-string ps-ws-2" />
      <div className="ps-web-string ps-ws-3" />
      <div className="ps-web-string ps-ws-4" />
      <div className="ps-web-string ps-ws-5" />
    </div>
  );
}

const SIGNALS_LEFT = [
  { num: '01', code: 'TITLE', label: 'Product Title', excerpt: 'WH-1000XM5 ANC Headphones', status: 'VERIFIED' },
  { num: '02', code: 'SKU', label: 'Model / SKU', excerpt: 'WH1000XM5/B • Sony Catalog', status: 'MATCHED' },
  { num: '03', code: 'VAL', label: 'Price Analysis', excerpt: '$248.00 (Save $151.99)', status: '-38% MSRP' },
  { num: '04', code: 'CLM', label: 'Core Claims', excerpt: '4 Claims • 1 Qualified, 3 Supp', status: 'AUDITED' },
];

const SIGNALS_RIGHT = [
  { num: '05', code: 'SPC', label: 'Specifications', excerpt: 'Dual Proc V1 + QN1 • 8-Mic', status: 'EXTRACTED' },
  { num: '06', code: 'SUP', label: 'Support Links', excerpt: 'Sony Direct OEM Manuals', status: 'RESOLVED' },
  { num: '07', code: 'RTN', label: 'Return Policy', excerpt: '30-Day Sony D2C Guarantee', status: 'VERIFIED' },
  { num: '08', code: 'EVD', label: 'Evidence Trail', excerpt: 'JEITA Benchmark Footnotes', status: '100% LINKED' },
];

const PRODUCT_PINS = [
  { id: 'pin-1', top: '16%', left: '44%', label: 'LOC: SKU // WH-1000XM5', sub: 'Active Model Node' },
  { id: 'pin-2', top: '64%', left: '26%', label: 'LOC: SPC // Dual V1+QN1 ANC', sub: 'Processor Core' },
  { id: 'pin-3', top: '56%', left: '72%', label: 'LOC: CLM // 8-Mic Beamforming', sub: 'Audio & ANC Claim' },
  { id: 'pin-4', top: '82%', left: '46%', label: 'LOC: VAL // $248.00 USD', sub: 'Live Verified Price' },
];

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [activePin, setActivePin] = useState<string | null>(null);
  const [activeSignal, setActiveSignal] = useState<string | null>(null);

  const analyze = (targetUrl: string) => {
    const nextUrl = targetUrl.trim();
    if (nextUrl) router.push(`/dashboard?url=${encodeURIComponent(nextUrl)}`);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    analyze(url);
  };

  return <main className="ps-home">
    <SpiderWebSVG />
    <WebStrings />

    <nav className="ps-nav" aria-label="Primary navigation">
      <Link href="/" className="ps-logo">PROOF<span>·</span>SPIDER</Link>
      <p className="ps-nav-status"><i />PUBLIC EVIDENCE ANALYSIS</p>
      <button onClick={() => document.getElementById('url-input')?.focus()} className="ps-nav-action">ANALYZE NOW <ArrowRight size={15} /></button>
    </nav>

    <section className="ps-hero">
      <p className="ps-kicker"><span className="ps-signal-dot" /> CUSTOM SCRAPER STUDIO COLLECTOR <span>•</span> PUBLIC PRODUCT PAGES</p>
      <h1>WHAT BRANDS CLAIM.<br />WHAT <em>EVIDENCE</em> SAYS.</h1>
      <p className="ps-subtitle">Turn public product claims into a structured evidence trail—specs, footnotes, and policy links in one report.</p>
      <form onSubmit={submit} className="ps-search" aria-label="Analyze a product page">
        <LinkIcon size={18} aria-hidden="true" />
        <input id="url-input" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="PASTE A PUBLIC PRODUCT URL..." aria-label="Product page URL" />
        <button type="submit">ANALYZE PRODUCT <Search size={16} /></button>
      </form>
      <div className="ps-examples" aria-label="Verified examples">
        <span>VERIFIED TARGETS</span>{EXAMPLES.map((example) => <button key={example.label} onClick={() => analyze(example.url)}>{example.label} <small>{example.note}</small></button>)}
      </div>
    </section>

    {/* Live Product Evidence Radar Section */}
    <section className="ps-product-inspector-section" aria-label="Live Evidence Target Scanner">
      <div className="ps-section-header">
        <span className="ps-hud-tag"><i className="ps-signal-dot" /> LIVE PRODUCT EVIDENCE SCANNER</span>
        <h2>REAL-TIME TARGET AUDIT</h2>
        <p>Interactive telemetry extracted from live public product specifications and benchmark footnotes</p>
      </div>

      <div className="ps-inspector-stage">
        {/* Left Signals */}
        <div className="ps-signals-col ps-signals-left-col">
          {SIGNALS_LEFT.map((sig) => (
            <div
              key={sig.code}
              className={`ps-signal-card ${activeSignal === sig.code ? 'active' : ''}`}
              onMouseEnter={() => setActiveSignal(sig.code)}
              onMouseLeave={() => setActiveSignal(null)}
              onClick={() => analyze(EXAMPLES[0].url)}
            >
              <div className="ps-signal-card-head">
                <b>{sig.num} LOC: {sig.code}</b>
                <span className="ps-sig-badge">{sig.status}</span>
              </div>
              <p className="ps-sig-label">{sig.label}</p>
              <p className="ps-sig-val">{sig.excerpt}</p>
              <div className="ps-sig-beam" />
            </div>
          ))}
        </div>

        {/* Center Live Product Showcase */}
        <div className="ps-product-stage">
          {/* Holographic scanner container */}
          <div className="ps-product-frame">
            {/* Corner HUD Brackets */}
            <div className="ps-hud-corner ps-hud-tl" />
            <div className="ps-hud-corner ps-hud-tr" />
            <div className="ps-hud-corner ps-hud-bl" />
            <div className="ps-hud-corner ps-hud-br" />

            {/* Laser Scanning Line */}
            <div className="ps-scanner-beam" />
            
            {/* Radar Circular Grid Overlay */}
            <div className="ps-radar-rings" aria-hidden="true">
              <div className="ps-radar-ring-1" />
              <div className="ps-radar-ring-2" />
              <div className="ps-radar-ring-3" />
              <div className="ps-radar-sweep" />
            </div>

            {/* Product Image */}
            <div className="ps-product-image-wrap">
              <Image
                src="/assets/product-hero.jpg"
                alt="Sony WH-1000XM5 Live Product Target"
                width={400}
                height={400}
                priority
                className="ps-product-image"
                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
              />
            </div>

            {/* Interactive Target Pins on Product */}
            {PRODUCT_PINS.map((pin) => (
              <div
                key={pin.id}
                className={`ps-target-pin ${activePin === pin.id ? 'active' : ''}`}
                style={{ top: pin.top, left: pin.left }}
                onMouseEnter={() => setActivePin(pin.id)}
                onMouseLeave={() => setActivePin(null)}
              >
                <div className="ps-pin-pulse" />
                <div className="ps-pin-dot" />
                <div className="ps-pin-callout">
                  <b>{pin.label}</b>
                  <span>{pin.sub}</span>
                </div>
              </div>
            ))}

            {/* HUD Status Bar at bottom of product */}
            <div className="ps-product-hud-bar">
              <div className="ps-hud-meta">
                <span className="ps-hud-target-name">SONY WH-1000XM5</span>
                <span className="ps-hud-price">$248.00 <del>$399.99</del></span>
              </div>
              <button
                type="button"
                onClick={() => analyze(EXAMPLES[0].url)}
                className="ps-hud-action"
              >
                OPEN DOSSIER <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Signals */}
        <div className="ps-signals-col ps-signals-right-col">
          {SIGNALS_RIGHT.map((sig) => (
            <div
              key={sig.code}
              className={`ps-signal-card ${activeSignal === sig.code ? 'active' : ''}`}
              onMouseEnter={() => setActiveSignal(sig.code)}
              onMouseLeave={() => setActiveSignal(null)}
              onClick={() => analyze(EXAMPLES[0].url)}
            >
              <div className="ps-signal-card-head">
                <b>{sig.num} LOC: {sig.code}</b>
                <span className="ps-sig-badge">{sig.status}</span>
              </div>
              <p className="ps-sig-label">{sig.label}</p>
              <p className="ps-sig-val">{sig.excerpt}</p>
              <div className="ps-sig-beam" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Minimal Clean Footer */}
    <footer className="ps-footer" aria-label="System footer">
      <div className="ps-footer-simple">
        <p className="ps-footer-text">
          Built for <span className="ps-footer-highlight">Into the Scrape-Verse</span> <span className="ps-footer-sep">•</span> <span className="ps-footer-highlight">WeMakeDevs</span> <span className="ps-footer-sep">×</span> <span className="ps-footer-brand">Bright Data</span>
        </p>
      </div>
    </footer>
  </main>;
}
