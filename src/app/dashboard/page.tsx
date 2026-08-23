'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  ExternalLink,
  Filter,
  Layers,
  Link as LinkIcon,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AnalyzedClaim, ClaimVerdict, ProductAnalysis } from '@/types/proofspider';

const DEFAULT_URL = 'https://www.sony.com/electronics/headband-headphones/wh-1000xm5';

const EXAMPLES = [
  { label: 'Sony WH-1000XM5', url: 'https://www.sony.com/electronics/headband-headphones/wh-1000xm5', note: 'HEALED RUN' },
  { label: 'Apple AirPods Max', url: 'https://www.apple.com/airpods-max/', note: 'VERIFIED RUN' },
];

const VERDICT_CONFIG: Record<
  ClaimVerdict,
  { label: string; tagClass: string; dotClass: string; description: string }
> = {
  Supported: {
    label: 'SUPPORTED',
    tagClass: 'ps-tag-supported',
    dotClass: 'green',
    description: 'Fully corroborated by extracted specifications, manuals, or manufacturer evidence.',
  },
  Qualified: {
    label: 'QUALIFIED',
    tagClass: 'ps-tag-qualified',
    dotClass: 'blue',
    description: 'Conditioned on specific benchmark dates, operating modes, or footnote qualifiers.',
  },
  Conflicted: {
    label: 'CONFLICTED',
    tagClass: 'ps-tag-conflicted',
    dotClass: 'orange',
    description: 'Contradicted or limited by public return policies, specs, or legal disclaimers.',
  },
  Unknown: {
    label: 'NEEDS EVIDENCE',
    tagClass: 'ps-tag-unknown',
    dotClass: 'neutral',
    description: 'No direct specification, footnote, or policy link was indexed on the product page.',
  },
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUrlParam = searchParams.get('url');

  const [inputUrl, setInputUrl] = useState(targetUrlParam || DEFAULT_URL);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<AnalyzedClaim | null>(null);
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'claims' | 'specs' | 'policies'>('claims');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSignal, setActiveSignal] = useState<string | null>(null);
  const [activePin, setActivePin] = useState<string | null>(null);

  async function fetchAnalysis(urlToAnalyze: string) {
    setLoading(true);
    setError(null);
    setSelectedClaim(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToAnalyze }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to extract and analyze product evidence.');
      }

      setAnalysis(result.analysis);
    } catch (err) {
      setAnalysis(null);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const target = targetUrlParam || DEFAULT_URL;
    const timer = window.setTimeout(() => {
      setInputUrl(target);
      void fetchAnalysis(target);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [targetUrlParam]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanUrl = inputUrl.trim();
    if (cleanUrl) {
      router.push(`/dashboard?url=${encodeURIComponent(cleanUrl)}`);
    }
  };

  const handleSelectExample = (exampleUrl: string) => {
    setInputUrl(exampleUrl);
    router.push(`/dashboard?url=${encodeURIComponent(exampleUrl)}`);
  };

  const filteredClaims = useMemo(() => {
    if (!analysis?.claims) return [];
    if (verdictFilter === 'ALL') return analysis.claims;
    return analysis.claims.filter((c) => c.verdict === verdictFilter);
  }, [analysis, verdictFilter]);

  const summary = analysis?.verdictSummary || {
    total: analysis?.claims.length || 0,
    supported: analysis?.claims.filter((c) => c.verdict === 'Supported').length || 0,
    qualified: analysis?.claims.filter((c) => c.verdict === 'Qualified').length || 0,
    conflicted: analysis?.claims.filter((c) => c.verdict === 'Conflicted').length || 0,
    unknown: analysis?.claims.filter((c) => c.verdict === 'Unknown').length || 0,
  };

  const dynamicSignalsLeft = useMemo(() => {
    if (!analysis) return [];
    const sku = analysis.modelNumber || 'SKU DETECTED';
    const priceText = analysis.price ? `${analysis.price.symbol || '$'}${analysis.price.value.toFixed(2)}` : 'MARKET PRICE';
    const firstClaim = analysis.claims[0]?.claimText || 'Extracted Product Claims';
    return [
      { num: '01', code: 'BRAND', label: 'Domain Brand', excerpt: `${analysis.brand} • Authenticated Target`, status: 'VERIFIED', filter: 'ALL' },
      { num: '02', code: 'SKU', label: 'Model / Identifier', excerpt: sku, status: 'MATCHED', filter: 'ALL' },
      { num: '03', code: 'VAL', label: 'Price Analysis', excerpt: priceText + (analysis.price?.savings ? ` (${analysis.price.savings})` : ''), status: 'PARSED', filter: 'ALL' },
      { num: '04', code: 'CLM', label: 'Claims Matrix', excerpt: firstClaim, status: `${analysis.claims.length} DETECTED`, filter: 'ALL' },
    ];
  }, [analysis]);

  const dynamicSignalsRight = useMemo(() => {
    if (!analysis) return [];
    const firstSpec = analysis.specs[0] ? `${analysis.specs[0].label}: ${analysis.specs[0].value}` : 'Core Hardware Specifications';
    const supportExcerpt = analysis.warrantyAndSupportLinks[0]?.title || 'Manufacturer Warranty Portal';
    const returnExcerpt = analysis.returnPolicyLinks[0]?.title || 'Standard Consumer Return Policy';
    const footExcerpt = analysis.evidenceExcerpts[0] || 'Technical Footnote Verification';
    return [
      { num: '05', code: 'SPC', label: 'Extracted Specs', excerpt: firstSpec, status: `${analysis.specs.length} INDEXED`, tab: 'specs' as const },
      { num: '06', code: 'SUP', label: 'Warranty Endpoints', excerpt: supportExcerpt, status: 'RESOLVED', tab: 'policies' as const },
      { num: '07', code: 'RTN', label: 'Return Policy', excerpt: returnExcerpt, status: 'VERIFIED', tab: 'policies' as const },
      { num: '08', code: 'EVD', label: 'Evidence Footnotes', excerpt: footExcerpt, status: `${analysis.evidenceExcerpts.length} EXTRACTS`, tab: 'policies' as const },
    ];
  }, [analysis]);

  const dynamicPins = useMemo(() => {
    if (!analysis) return [];
    const supportedCount = analysis.claims.filter((c) => c.verdict === 'Supported').length;
    const qualifiedCount = analysis.claims.filter((c) => c.verdict === 'Qualified').length;
    const specsCount = analysis.specs.length;
    const returnCount = (analysis.warrantyAndSupportLinks?.length || 0) + (analysis.returnPolicyLinks?.length || 0);
    return [
      { id: 'pin-1', top: '24%', left: '26%', label: 'HARDWARE & SPECS', sub: `${specsCount} Specifications Indexed`, tab: 'specs' as const },
      { id: 'pin-2', top: '30%', left: '74%', label: 'SUPPORTED CLAIMS', sub: `${supportedCount} Claims Verified`, filter: 'Supported' },
      { id: 'pin-3', top: '68%', left: '28%', label: 'QUALIFIED CLAIMS', sub: `${qualifiedCount} Conditioned Footnotes`, filter: 'Qualified' },
      { id: 'pin-4', top: '64%', left: '72%', label: 'POLICY EVIDENCE', sub: `${returnCount} Policies Verified`, tab: 'policies' as const },
    ];
  }, [analysis]);

  return (
    <main className="ps-dashboard">
      {/* Top Cybernetic Nav Bar */}
      <nav className="ps-nav" aria-label="Primary navigation">
        <Link href="/" className="ps-logo">
          PROOF<span>·</span>SPIDER
        </Link>
        <p className="ps-nav-status">
          <i /> EVIDENCE MATRIX {'//'} {analysis?.collectorId || 'c_mt1v2vo62kutyo7m6k'}
        </p>
        <Link href="/" className="ps-nav-action">
          <ArrowLeft size={14} /> NEW SEARCH
        </Link>
      </nav>

      <div className="ps-dash-wrapper">
        {/* Search & Example Switcher Bar */}
        <section aria-label="Target search">
          <form onSubmit={handleSearchSubmit} className="ps-search" style={{ margin: '0 auto' }}>
            <LinkIcon size={18} aria-hidden="true" />
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="PASTE A PUBLIC PRODUCT URL..."
              aria-label="Product page URL"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'ANALYZING...' : 'ANALYZE TARGET'} <Search size={15} />
            </button>
          </form>

          <div className="ps-examples" aria-label="Verified examples">
            <span>TARGET NODES:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example.label}
                onClick={() => handleSelectExample(example.url)}
                className={inputUrl === example.url ? 'active' : ''}
              >
                {example.label} <small>{example.note}</small>
              </button>
            ))}
          </div>
        </section>

        {/* Loading State: Concentric Radar Screen */}
        {loading && (
          <div className="ps-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div className="ps-radar-loader" aria-hidden="true">
              <div />
              <div />
              <div />
              <span />
            </div>
            <p className="ps-kicker" style={{ marginTop: '2rem' }}>
              <span className="ps-signal-dot" /> CUSTOM SCRAPER STUDIO PIPELINE {'//'} LIVE PARSER
            </p>
            <h2 style={{ fontSize: '1.4rem', letterSpacing: '-0.04em', margin: '0.8rem 0' }}>
              COLLECTING & VERIFYING EVIDENCE
            </h2>
            <p style={{ color: '#95909a', fontSize: '0.78rem', maxWidth: '30rem', margin: '0 auto', lineHeight: 1.6 }}>
              Extracting headline claims, cross-referencing technical specifications, indexing footnotes, and analyzing return policy constraints.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            className="ps-panel"
            style={{
              borderColor: 'rgba(237,28,36,0.5)',
              background: 'radial-gradient(ellipse at 50% 0%, rgba(237,28,36,0.1) 0%, rgba(18,12,16,0.95) 75%)',
              padding: '2.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--signal)' }}>
              <CircleAlert size={22} />
              <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                EVIDENCE COLLECTION NOTICE
              </h2>
            </div>
            <p style={{ marginTop: '1rem', color: '#d0cbd4', fontSize: '0.85rem', lineHeight: 1.7, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {error}
            </p>

            {/* How to enable live scraping guide */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                background: 'rgba(9,8,12,0.85)',
                border: '1px solid rgba(237,28,36,0.25)',
                borderRadius: '0.5rem',
                fontSize: '0.78rem',
                fontFamily: 'Space Mono, monospace',
                color: '#c5c0cc',
              }}
            >
              <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--signal)' }}>●</span> HOW TO ENABLE LIVE SCRAPING ON ANY URL:
              </div>
              <p style={{ margin: '0.3rem 0', fontFamily: 'IBM Plex Sans, sans-serif', color: '#a8a3b0' }}>
                To scrape arbitrary live web URLs in real-time, add your Bright Data API token in <code style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '0.15rem 0.4rem', borderRadius: '0.2rem' }}>.env.local</code>:
              </p>
              <pre style={{ margin: '0.6rem 0 0', padding: '0.75rem', background: '#050407', borderRadius: '0.35rem', color: '#4ade80', fontSize: '0.72rem', overflowX: 'auto' }}>
                BRIGHTDATA_API_KEY=your_brightdata_api_token_here
              </pre>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => fetchAnalysis(inputUrl)}
                className="ps-nav-action"
                style={{ background: 'var(--signal)', color: '#000', fontWeight: 700 }}
              >
                RETRY COLLECTION <ArrowRight size={14} />
              </button>
              <span style={{ fontSize: '0.7rem', color: '#777', margin: '0 0.5rem' }}>OR TRY A VERIFIED TARGET:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => handleSelectExample(ex.url)}
                  className="ps-nav-action"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.68rem' }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loaded Analysis Dossier */}
        {analysis && !loading && (
          <>
            {/* Dossier Hero Card */}
            <section className="ps-dossier-hero">
              <div>
                <p className="ps-kicker">
                  <span className="ps-signal-dot" /> SCRAPER STUDIO DOSSIER {'//'} {analysis.collectorId}
                </p>
                <h1>{analysis.productName}</h1>
                <div className="ps-dossier-meta">
                  <span>
                    BRAND: <b>{analysis.brand.toUpperCase()}</b>
                  </span>
                  {analysis.modelNumber && (
                    <span>
                      MODEL / SKU: <b>{analysis.modelNumber}</b>
                    </span>
                  )}
                  {analysis.price && (
                    <span className="ps-price-tag">
                      {analysis.price.symbol || '$'}
                      {analysis.price.value.toFixed(2)}{' '}
                      {analysis.price.originalValue && (
                        <small style={{ color: '#888', textDecoration: 'line-through', marginLeft: '0.4rem', fontSize: '0.7rem' }}>
                          {analysis.price.symbol || '$'}
                          {analysis.price.originalValue.toFixed(2)}
                        </small>
                      )}
                      {analysis.price.savings && (
                        <small style={{ color: '#4ade80', marginLeft: '0.5rem', fontSize: '0.68rem' }}>
                          ({analysis.price.savings})
                        </small>
                      )}
                    </span>
                  )}
                  <span>
                    COLLECTED: <b>{new Date(analysis.scrapedAt).toLocaleDateString()}</b>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'flex-start' }}>
                <a
                  href={analysis.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ps-nav-action"
                  style={{ textDecoration: 'none' }}
                >
                  VIEW PUBLIC SOURCE <ArrowUpRight size={14} />
                </a>
              </div>
            </section>

            {/* Live Holographic Radar Target Audit Stage */}
            <section className="ps-product-inspector-section ps-dashboard-inspector" aria-label="Live Evidence Target Scanner">
              <div className="ps-section-header" style={{ marginBottom: '1.75rem' }}>
                <h2>REAL-TIME TARGET AUDIT</h2>
              </div>

              <div className="ps-inspector-stage">
                {/* Left Telemetry Signals */}
                <div className="ps-signals-col ps-signals-left-col">
                  {dynamicSignalsLeft.map((sig) => (
                    <div
                      key={sig.code}
                      className={`ps-signal-card ${activeSignal === sig.code ? 'active' : ''}`}
                      onMouseEnter={() => setActiveSignal(sig.code)}
                      onMouseLeave={() => setActiveSignal(null)}
                      onClick={() => {
                        setActiveTab('claims');
                        setVerdictFilter(sig.filter || 'ALL');
                        document.getElementById('claims-matrix-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
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

                {/* Center Live Product Showcase with Hologram Scanner */}
                <div className="ps-product-stage">
                  <div className="ps-product-frame">
                    <div className="ps-hud-corner ps-hud-tl" />
                    <div className="ps-hud-corner ps-hud-tr" />
                    <div className="ps-hud-corner ps-hud-bl" />
                    <div className="ps-hud-corner ps-hud-br" />

                    <div className="ps-scanner-beam" />
                    
                    <div className="ps-radar-rings" aria-hidden="true">
                      <div className="ps-radar-ring-1" />
                      <div className="ps-radar-ring-2" />
                      <div className="ps-radar-ring-3" />
                      <div className="ps-radar-sweep" />
                    </div>

                    <div className="ps-product-image-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={analysis.heroImageUrl || '/assets/product-hero.jpg'}
                        alt={analysis.productName}
                        className="ps-product-image"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          const name = (analysis?.productName || '').toLowerCase();
                          const brand = (analysis?.brand || '').toLowerCase();
                          if (brand.includes('bose') || name.includes('bose') || name.includes('quietcomfort')) {
                            target.src = '/assets/bose-qc-ultra.jpg';
                          } else if (brand.includes('samsung') || name.includes('galaxy') || name.includes('s24')) {
                            target.src = '/assets/galaxy-s24-ultra.jpg';
                          } else {
                            target.src = '/assets/product-hero.jpg';
                          }
                        }}
                      />
                    </div>

                    {dynamicPins.map((pin) => (
                      <div
                        key={pin.id}
                        className={`ps-target-pin ${activePin === pin.id ? 'active' : ''}`}
                        style={{ top: pin.top, left: pin.left }}
                        onMouseEnter={() => setActivePin(pin.id)}
                        onMouseLeave={() => setActivePin(null)}
                        onClick={() => {
                          if (pin.tab) setActiveTab(pin.tab);
                          if (pin.filter) setVerdictFilter(pin.filter);
                          document.getElementById('claims-matrix-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <div className="ps-pin-pulse" />
                        <div className="ps-pin-dot" />
                        <div className="ps-pin-callout">
                          <b>{pin.label}</b>
                          <span>{pin.sub}</span>
                        </div>
                      </div>
                    ))}

                    <div className="ps-product-hud-bar">
                      <div className="ps-hud-meta">
                        <span className="ps-hud-target-name">{analysis.productName}</span>
                        {analysis.price && (
                          <span className="ps-hud-price">
                            {analysis.price.symbol || '$'}{analysis.price.value.toFixed(2)}
                            {analysis.price.originalValue && (
                              <del style={{ marginLeft: '0.35rem', color: '#888' }}>
                                {analysis.price.symbol || '$'}{analysis.price.originalValue.toFixed(2)}
                              </del>
                            )}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('claims-matrix-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="ps-hud-action"
                      >
                        VIEW MATRIX <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Telemetry Signals */}
                <div className="ps-signals-col ps-signals-right-col">
                  {dynamicSignalsRight.map((sig) => (
                    <div
                      key={sig.code}
                      className={`ps-signal-card ${activeSignal === sig.code ? 'active' : ''}`}
                      onMouseEnter={() => setActiveSignal(sig.code)}
                      onMouseLeave={() => setActiveSignal(null)}
                      onClick={() => {
                        if (sig.tab) setActiveTab(sig.tab);
                        document.getElementById('claims-matrix-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
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

            {/* Verdict Scorecard Metric Grid */}
            <section aria-label="Evidence verdict summary">
              <div className="ps-metric-grid">
                <button
                  onClick={() => setVerdictFilter('ALL')}
                  className={`ps-metric-card ${verdictFilter === 'ALL' ? 'active' : ''}`}
                >
                  <div className="ps-metric-label">
                    <span>TOTAL CLAIMS</span>
                    <Layers size={14} color="#aaa" />
                  </div>
                  <div className="ps-metric-value">{summary.total}</div>
                </button>

                <button
                  onClick={() => setVerdictFilter('Supported')}
                  className={`ps-metric-card ${verdictFilter === 'Supported' ? 'active' : ''}`}
                >
                  <div className="ps-metric-label">
                    <span>SUPPORTED</span>
                    <i className="ps-signal-dot" style={{ background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
                  </div>
                  <div className="ps-metric-value" style={{ color: '#4ade80' }}>
                    {summary.supported}
                  </div>
                </button>

                <button
                  onClick={() => setVerdictFilter('Qualified')}
                  className={`ps-metric-card ${verdictFilter === 'Qualified' ? 'active' : ''}`}
                >
                  <div className="ps-metric-label">
                    <span>QUALIFIED</span>
                    <i className="ps-signal-dot" style={{ background: '#60a5fa', boxShadow: '0 0 8px #60a5fa' }} />
                  </div>
                  <div className="ps-metric-value" style={{ color: '#60a5fa' }}>
                    {summary.qualified}
                  </div>
                </button>

                <button
                  onClick={() => setVerdictFilter('Conflicted')}
                  className={`ps-metric-card ${verdictFilter === 'Conflicted' ? 'active' : ''}`}
                >
                  <div className="ps-metric-label">
                    <span>CONFLICTED</span>
                    <i className="ps-signal-dot" style={{ background: '#fb923c', boxShadow: '0 0 8px #fb923c' }} />
                  </div>
                  <div className="ps-metric-value" style={{ color: '#fb923c' }}>
                    {summary.conflicted}
                  </div>
                </button>

                <button
                  onClick={() => setVerdictFilter('Unknown')}
                  className={`ps-metric-card ${verdictFilter === 'Unknown' ? 'active' : ''}`}
                >
                  <div className="ps-metric-label">
                    <span>NEEDS EVIDENCE</span>
                    <i className="ps-signal-dot" style={{ background: '#9ca3af', boxShadow: '0 0 8px #9ca3af' }} />
                  </div>
                  <div className="ps-metric-value" style={{ color: '#9ca3af' }}>
                    {summary.unknown}
                  </div>
                </button>
              </div>
            </section>

            {/* Scraper Studio Collector & Self-Healing Pipeline Badge */}
            <section className="ps-panel">
              <div className="ps-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Sparkles size={15} color="var(--signal)" />
                  <span>BRIGHT DATA SCRAPER STUDIO {'//'} SELF-HEALING ARCHITECTURE</span>
                </div>
                <span style={{ color: '#4ade80', fontSize: '0.65rem' }}>● HEALED & VERIFIED</span>
              </div>
              <div className="ps-panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#c5c1cb', lineHeight: 1.6, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    Collector <b style={{ color: '#fff', fontFamily: 'Space Mono, monospace' }}>{analysis.collectorId}</b> was developed via Custom Scraper Studio, healed for structured schema extraction (clean price amounts, key specs array, warranty endpoints, and footnote excerpts), and approved for verified production runs.
                  </p>
                </div>
                <a
                  href={`https://brightdata.com/cp/scrapers/${analysis.collectorId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ps-nav-action"
                  style={{ whiteSpace: 'nowrap', textDecoration: 'none', fontSize: '0.62rem' }}
                >
                  VIEW IN BRIGHT DATA <ExternalLink size={13} />
                </a>
              </div>
            </section>

            {/* Dossier Navigation Tabs (Claims, Specs, Policies) */}
            <div id="claims-matrix-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', scrollMarginTop: '2rem' }}>
              <div className="ps-tabs" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === 'claims'}
                  onClick={() => setActiveTab('claims')}
                  className={`ps-tab ${activeTab === 'claims' ? 'active' : ''}`}
                >
                  CLAIM EVIDENCE MATRIX ({analysis.claims.length})
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'specs'}
                  onClick={() => setActiveTab('specs')}
                  className={`ps-tab ${activeTab === 'specs' ? 'active' : ''}`}
                >
                  EXTRACTED SPECIFICATIONS ({analysis.specs.length})
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'policies'}
                  onClick={() => setActiveTab('policies')}
                  className={`ps-tab ${activeTab === 'policies' ? 'active' : ''}`}
                >
                  POLICY & SUPPORT CITATIONS ({(analysis.warrantyAndSupportLinks?.length || 0) + (analysis.returnPolicyLinks?.length || 0)})
                </button>
              </div>

              {activeTab === 'claims' && (
                <div style={{ fontSize: '0.68rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={13} />
                  <span>FILTERING: <b style={{ color: 'var(--signal)' }}>{verdictFilter}</b> ({filteredClaims.length} OF {analysis.claims.length})</span>
                </div>
              )}
            </div>

            {/* Tab 1: Claims Evidence Matrix */}
            {activeTab === 'claims' && (
              <section className="ps-panel" aria-label="Claims list">
                <div className="ps-panel-header">
                  <span>INDEXED MARKETING CLAIMS</span>
                  <span style={{ fontSize: '0.65rem' }}>CLICK ANY CLAIM TO INSPECT EVIDENCE TRAIL</span>
                </div>
                <div className="ps-panel-body">
                  <div className="ps-claims-list">
                    {filteredClaims.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '2rem', color: '#888', fontSize: '0.75rem' }}>
                        No claims match the &quot;{verdictFilter}&quot; verdict filter.
                      </p>
                    ) : (
                      filteredClaims.map((claim, idx) => {
                        const verdictData = VERDICT_CONFIG[claim.verdict] || VERDICT_CONFIG.Unknown;
                        return (
                          <button
                            key={claim.id}
                            onClick={() => setSelectedClaim(claim)}
                            className="ps-claim-row"
                            aria-haspopup="dialog"
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '7.5rem' }}>
                              <span style={{ fontSize: '0.62rem', color: 'var(--signal)', letterSpacing: '0.1em' }}>
                                CLAIM-{String(idx + 1).padStart(2, '0')}
                              </span>
                              <span
                                className={`w-fit rounded px-2 py-0.5 text-[0.62rem] font-bold ${verdictData.tagClass}`}
                              >
                                {verdictData.label}
                              </span>
                            </div>

                            <div>
                              <p className="ps-claim-title">&ldquo;{claim.claimText}&rdquo;</p>
                              <p className="ps-claim-reason">{claim.reason}</p>
                              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', fontSize: '0.62rem', color: '#7e7984' }}>
                                <span>CATEGORY: <b style={{ color: '#b9b5be' }}>{claim.category.toUpperCase()}</b></span>
                                <span>•</span>
                                <span>CONFIDENCE: <b style={{ color: '#4ade80' }}>{Math.round(claim.confidence * 100)}%</b></span>
                                <span>•</span>
                                <span>EVIDENCE SOURCES: <b style={{ color: '#b9b5be' }}>{claim.evidence.length}</b></span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--signal)', fontSize: '0.68rem' }}>
                              <span className="hidden sm:inline">INSPECT</span>
                              <ChevronRight size={16} />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Tab 2: Extracted Specifications */}
            {activeTab === 'specs' && (
              <section className="ps-panel" aria-label="Extracted specifications">
                <div className="ps-panel-header">
                  <span>TECHNICAL SPECIFICATIONS DOSSIER</span>
                  <span>{analysis.specs.length} DATA POINTS</span>
                </div>
                <div className="ps-panel-body">
                  <div className="ps-specs-table">
                    {analysis.specs.map((spec, idx) => (
                      <div key={`${spec.label}-${idx}`} className="ps-spec-item">
                        <div className="ps-spec-label">
                          SPEC-{String(idx + 1).padStart(2, '0')} {'//'} {spec.label}
                        </div>
                        <div className="ps-spec-val">{spec.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Tab 3: Policies & Support Citations */}
            {activeTab === 'policies' && (
              <section className="ps-panel" aria-label="Policy links and support citations">
                <div className="ps-panel-header">
                  <span>POLICY & CITATION DIRECTORY</span>
                  <span>VERIFIED PUBLIC DESTINATIONS</span>
                </div>
                <div className="ps-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {analysis.warrantyAndSupportLinks && analysis.warrantyAndSupportLinks.length > 0 && (
                    <div>
                      <p className="ps-kicker" style={{ marginBottom: '0.75rem' }}>
                        WARRANTY & SUPPORT ENDPOINTS
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))', gap: '0.8rem' }}>
                        {analysis.warrantyAndSupportLinks.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="ps-spec-item"
                            style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div>
                              <div className="ps-spec-label">{link.type.toUpperCase()} {'//'} ENDPOINT</div>
                              <div className="ps-spec-val">{link.title || 'Support Document'}</div>
                            </div>
                            <ArrowUpRight size={14} color="var(--signal)" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.returnPolicyLinks && analysis.returnPolicyLinks.length > 0 && (
                    <div>
                      <p className="ps-kicker" style={{ marginBottom: '0.75rem' }}>
                        RETURN POLICY & CONSUMER PROTECTION
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))', gap: '0.8rem' }}>
                        {analysis.returnPolicyLinks.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="ps-spec-item"
                            style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div>
                              <div className="ps-spec-label">RETURN POLICY {'//'} TERMS</div>
                              <div className="ps-spec-val">{link.title || 'Return Policy'}</div>
                            </div>
                            <ArrowUpRight size={14} color="var(--signal)" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Interactive Evidence Trail Modal */}
      {selectedClaim && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-claim-title"
          className="ps-modal-overlay"
          onClick={() => setSelectedClaim(null)}
        >
          <div className="ps-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <p className="ps-kicker">
                  <span className="ps-signal-dot" /> EVIDENCE INSPECTION DOSSIER
                </p>
                <h2 id="modal-claim-title" style={{ fontSize: '1.2rem', margin: '0.6rem 0', color: '#fff', letterSpacing: '-0.02em' }}>
                  &ldquo;{selectedClaim.claimText}&rdquo;
                </h2>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span className={`w-fit rounded px-2.5 py-0.5 text-xs font-bold ${VERDICT_CONFIG[selectedClaim.verdict].tagClass}`}>
                    {VERDICT_CONFIG[selectedClaim.verdict].label}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#95909a' }}>
                    CATEGORY: <b style={{ color: '#fff' }}>{selectedClaim.category.toUpperCase()}</b>
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#95909a' }}>
                    CONFIDENCE: <b style={{ color: '#4ade80' }}>{Math.round(selectedClaim.confidence * 100)}%</b>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedClaim(null)}
                style={{ background: 'transparent', border: '1px solid #332a37', color: '#a09ba6', borderRadius: '50%', width: '2rem', height: '2rem', display: 'grid', placeItems: 'center' }}
                aria-label="Close modal"
              >
                <X size={15} />
              </button>
            </div>

            {/* Verdict Explanation Panel */}
            <div
              style={{
                borderLeft: '3px solid var(--signal)',
                background: 'rgba(23, 17, 22, 0.8)',
                padding: '1.1rem 1.3rem',
                borderRadius: '0 0.4rem 0.4rem 0',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--signal)', letterSpacing: '0.1em', fontWeight: 700 }}>
                VERDICT REASONING:
              </div>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: '#e0dce3', lineHeight: 1.6, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {selectedClaim.reason}
              </p>
            </div>

            {/* Itemized Evidence Trail */}
            <div>
              <div className="ps-panel-header" style={{ padding: '0.6rem 0', borderBottomColor: '#2d2432' }}>
                <span>COLLECTED EVIDENCE TRAIL ({selectedClaim.evidence.length})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.8rem' }}>
                {selectedClaim.evidence.length > 0 ? (
                  selectedClaim.evidence.map((ev, i) => (
                    <article
                      key={ev.id || i}
                      style={{
                        padding: '1rem',
                        background: 'rgba(18, 15, 21, 0.85)',
                        border: '1px solid #2d2331',
                        borderRadius: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.62rem', color: '#4ade80', letterSpacing: '0.1em', fontWeight: 700 }}>
                          [{ev.type.toUpperCase()}] {'//'} EVIDENCE #{i + 1}
                        </span>
                        {ev.sourceUrl && (
                          <a
                            href={ev.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '0.65rem', color: 'var(--signal)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            SOURCE <ArrowUpRight size={12} />
                          </a>
                        )}
                      </div>

                      <blockquote
                        style={{
                          margin: '0.6rem 0',
                          padding: '0.5rem 0.8rem',
                          background: 'rgba(10, 8, 11, 0.7)',
                          borderLeft: '2px solid #4a3e50',
                          color: '#f0edf2',
                          fontSize: '0.8rem',
                          lineHeight: 1.5,
                          fontFamily: 'Space Mono, monospace',
                        }}
                      >
                        &ldquo;{ev.sourceExcerpt}&rdquo;
                      </blockquote>

                      {ev.relevance && (
                        <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: '#9d97a4', lineHeight: 1.5, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                          <b style={{ color: '#bbb' }}>Relevance:</b> {ev.relevance}
                        </p>
                      )}
                    </article>
                  ))
                ) : (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#888', padding: '1rem 0' }}>
                    <CircleHelp size={16} /> No direct citation or footnote was extracted for this claim on the public page.
                  </p>
                )}
              </div>
            </div>

            {/* Unknowns / Gaps */}
            {selectedClaim.unknowns && selectedClaim.unknowns.length > 0 && (
              <div style={{ padding: '0.9rem 1.1rem', background: 'rgba(20,17,23,0.7)', border: '1px dashed #3a2e40', borderRadius: '0.4rem' }}>
                <div style={{ fontSize: '0.62rem', color: '#fb923c', letterSpacing: '0.08em', fontWeight: 700 }}>
                  NOTED EVIDENCE GAPS / UNKNOWNS:
                </div>
                <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#b5b0bb', lineHeight: 1.6, fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  {selectedClaim.unknowns.map((un, i) => (
                    <li key={i}>{un}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                onClick={() => setSelectedClaim(null)}
                className="ps-nav-action"
                style={{ background: 'var(--signal)', color: '#090909', fontWeight: 700 }}
              >
                <Check size={14} /> DONE INSPECTING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Clean Footer */}
      <footer className="ps-footer" aria-label="System footer">
        <div className="ps-footer-simple">
          <p className="ps-footer-text">
            Built for <span className="ps-footer-highlight">Into the Scrape-Verse</span> <span className="ps-footer-sep">•</span> <span className="ps-footer-highlight">WeMakeDevs</span> <span className="ps-footer-sep">×</span> <span className="ps-footer-brand">Bright Data</span>
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <main className="ps-dashboard" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
          <div className="ps-radar-loader">
            <div />
            <div />
            <div />
            <span />
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
