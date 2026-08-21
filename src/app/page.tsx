'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Link as LinkIcon, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const EXAMPLES = [
  { label: 'WH-1000XM5', url: 'https://www.sony.com/electronics/headband-headphones/wh-1000xm5', note: 'HEALED RUN' },
  { label: 'WH-1000XM4', url: 'https://www.sony.com/electronics/headband-headphones/wh-1000xm4', note: 'VERIFIED RUN' },
  { label: 'WH-CH720N', url: 'https://www.sony.com/electronics/headband-headphones/wh-ch720n', note: 'VERIFIED RUN' },
];

const SIGNALS = [
  ['01', 'TITLE', 'Product title'], ['02', 'SKU', 'Model / SKU'], ['03', 'VAL', 'Price analysis'], ['04', 'CLM', 'Core claims'],
  ['05', 'SPC', 'Specifications'], ['06', 'SUP', 'Support links'], ['07', 'RTN', 'Return policy'], ['08', 'EVD', 'Evidence trail'],
];

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const analyze = (targetUrl: string) => { const nextUrl = targetUrl.trim(); if (nextUrl) router.push(`/dashboard?url=${encodeURIComponent(nextUrl)}`); };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); analyze(url); };

  return <main className="ps-home">
    <nav className="ps-nav" aria-label="Primary navigation">
      <Link href="/" className="ps-logo">PROOF<span>·</span>SPIDER</Link>
      <p className="ps-nav-status"><i /> PUBLIC EVIDENCE ANALYSIS</p>
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

    <section className="ps-core-section" aria-label="Evidence dimensions">
      <div className="ps-signals ps-signals-left">{SIGNALS.slice(0, 4).map(([number, code, label]) => <div key={code} className="ps-signal"><div><b>{number} LOC: {code}</b><span>{label}</span></div><i /><hr /></div>)}</div>
      <div className="ps-core" aria-hidden="true"><div /><div /><div /><span><i /></span><p>COLLECTOR<br />CORE</p></div>
      <div className="ps-signals ps-signals-right">{SIGNALS.slice(4).map(([number, code, label]) => <div key={code} className="ps-signal"><hr /><i /><div><b>{number} LOC: {code}</b><span>{label}</span></div></div>)}</div>
    </section>

    <footer className="ps-footer"><div><span>08 EVIDENCE DIMENSIONS</span><span>04 VERDICT TYPES</span><span>100% SOURCE LINKED</span></div><p>© 2026 PROOFSPIDER <span>{'//'}</span> NODE-001-ALPHA</p><aside><span>SUPPORTED <i className="green" /></span><span>QUALIFIED <i className="blue" /></span><span>CONFLICTED <i className="orange" /></span><span>UNKNOWN <i /></span></aside></footer>
  </main>;
}
