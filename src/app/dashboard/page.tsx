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
  { label: 'WH-1000XM5', url: 'https://www.sony.com/electronics/headband-headphones/wh-1000xm5', note: 'HEALED RUN' },
  { label: 'WH-1000XM4', url: 'https://www.sony.com/electronics/headband-headphones/wh-1000xm4', note: 'VERIFIED RUN' },
  { label: 'WH-CH720N', url: 'https://www.sony.com/electronics/headband-headphones/wh-ch720n', note: 'VERIFIED RUN' },
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
              background: 'rgba(28,14,16,0.85)',
              padding: '2.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--signal)' }}>
              <CircleAlert size={22} />
              <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                EVIDENCE COLLECTION FAILED
              </h2>
            </div>
            <p style={{ marginTop: '1rem', color: '#d0cbd4', fontSize: '0.85rem', lineHeight: 1.7, fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {error}
            </p>
            <button
              onClick={() => fetchAnalysis(inputUrl)}
              className="ps-nav-action"
              style={{ marginTop: '1.5rem', background: 'var(--signal)', color: '#000', fontWeight: 700 }}
            >
              RETRY COLLECTION <ArrowRight size={14} />
            </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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

      {/* Cybernetic Technical Footer */}
      <footer className="ps-footer">
        <div>
          <span>08 EVIDENCE DIMENSIONS</span>
          <span>04 VERDICT TYPES</span>
          <span>100% SOURCE LINKED</span>
        </div>
        <p>
          © 2026 PROOFSPIDER <span>{'//'}</span> NODE-001-ALPHA
        </p>
        <aside>
          <span>
            SUPPORTED <i className="green" />
          </span>
          <span>
            QUALIFIED <i className="blue" />
          </span>
          <span>
            CONFLICTED <i className="orange" />
          </span>
          <span>
            UNKNOWN <i />
          </span>
        </aside>
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
