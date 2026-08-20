'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Info,
  Layers,
  Network,
  ChevronRight,
  Database,
  Code2,
} from 'lucide-react';
import EvidenceWeb from '@/components/EvidenceWeb';
import EvidenceDrawer from '@/components/EvidenceDrawer';
import CollectorBadge from '@/components/CollectorBadge';
import HealModal from '@/components/HealModal';
import { AnalyzedClaim, ProductAnalysis } from '@/types/proofspider';

const SEEDED_TARGETS = [
  {
    id: 'wh-1000xm5',
    name: 'Sony WH-1000XM5',
    url: 'https://www.sony.com/electronics/headband-headphones/wh-1000xm5',
    tag: 'Flagship ANC (Healed Run)',
    desc: 'Auto NC Optimizer, 30-Hr Battery, 30mm Carbon Drivers, Multipoint',
  },
  {
    id: 'wh-1000xm4',
    name: 'Sony WH-1000XM4',
    url: 'https://www.sony.com/electronics/headband-headphones/wh-1000xm4',
    tag: 'Verified Compatible',
    desc: 'Dual Noise Sensor, Edge-AI, 30-Hr Battery, Multipoint Connection',
  },
  {
    id: 'wh-ch720n',
    name: 'Sony WH-CH720N',
    url: 'https://www.sony.com/electronics/headband-headphones/wh-ch720n',
    tag: 'Verified Compatible',
    desc: 'Integrated Processor V1, 35-Hr Battery, Ultra-Lightweight (192g)',
  },
];

export default function ProofSpiderApp() {
  const [urlInput, setUrlInput] = useState('https://www.sony.com/electronics/headband-headphones/wh-1000xm5');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<AnalyzedClaim | null>(null);
  const [isHealModalOpen, setIsHealModalOpen] = useState(false);
  const [isLiveScrape, setIsLiveScrape] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  // Initial load with default Sony WH-1000XM5 analysis
  useEffect(() => {
    handleAnalyze('https://www.sony.com/electronics/headband-headphones/wh-1000xm5');
  }, []);

  async function handleAnalyze(targetUrlToUse?: string) {
    const url = targetUrlToUse || urlInput;
    if (!url.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setSelectedClaim(null);

    try {
      setLoadingStep('Connecting to Bright Data Scraper Studio (c_mt1v2vo62kutyo7m6k)...');
      await new Promise(r => setTimeout(r, 400));

      setLoadingStep('Extracting public product claims, specs, and footnote excerpts...');
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Scraper run failed');
      }

      setLoadingStep('Evaluating claims with Conservative Verdict Classifier...');
      const data = await res.json();

      setLoadingStep('Rendering Evidence Web graph...');
      await new Promise(r => setTimeout(r, 300));

      setAnalysis(data.analysis);
      setIsLiveScrape(!!data.isLive);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while analyzing the URL.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>ProofSpider</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  MVP
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              The evidence web behind what brands claim.
            </p>
          </div>
        </div>

        {/* Collector Metadata Chip & Self-Healing Trigger */}
        <CollectorBadge
          collectorId={analysis?.collectorId || 'c_mt1v2vo62kutyo7m6k'}
          onOpenHealModal={() => setIsHealModalOpen(true)}
          isLive={isLiveScrape}
        />
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Section A: Search & Seeded Target Bar */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste public consumer electronics URL (e.g. https://www.sony.com/...)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
              />
            </div>
            <button
              onClick={() => handleAnalyze()}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Collecting Evidence...</span>
                </>
              ) : (
                <>
                  <span>Analyze Claims</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Seeded Targets */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Verified Collector Test Targets:</span>
              <span className="font-mono text-indigo-400 text-[11px]">Bright Data Scraper Studio Verified</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SEEDED_TARGETS.map((target) => (
                <button
                  key={target.id}
                  onClick={() => {
                    setUrlInput(target.url);
                    handleAnalyze(target.url);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    urlInput === target.url
                      ? 'border-indigo-500 bg-indigo-950/30 shadow-md shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{target.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {target.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                    {target.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Loading Overlay State */}
        {loading && (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-8 text-center space-y-4 backdrop-blur-xl shadow-xl">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-white">
              Running ProofSpider Pipeline
            </h3>
            <p className="text-xs font-mono text-indigo-300">
              {loadingStep || 'Processing product data...'}
            </p>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 p-4 text-rose-300 text-xs flex items-center gap-3">
            <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section B: Analysis Summary Stats & Evidence Web */}
        {analysis && !loading && (
          <div className="space-y-4">
            {/* Top Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Claims
                </span>
                <div className="text-xl font-black font-mono text-white">
                  {analysis.verdictSummary.total}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/30 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                    Supported
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black font-mono text-emerald-300">
                  {analysis.verdictSummary.supported}
                  <span className="text-xs font-normal text-emerald-400/70 ml-1.5">
                    ({Math.round((analysis.verdictSummary.supported / (analysis.verdictSummary.total || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-800/40 bg-amber-950/30 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                    Qualified
                  </span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black font-mono text-amber-300">
                  {analysis.verdictSummary.qualified}
                  <span className="text-xs font-normal text-amber-400/70 ml-1.5">
                    ({Math.round((analysis.verdictSummary.qualified / (analysis.verdictSummary.total || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-rose-800/40 bg-rose-950/30 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                    Conflicted
                  </span>
                  <XCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-xl font-black font-mono text-rose-300">
                  {analysis.verdictSummary.conflicted}
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3.5 space-y-1 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Unknown
                  </span>
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xl font-black font-mono text-slate-300">
                  {analysis.verdictSummary.unknown}
                </div>
              </div>
            </div>

            {/* Evidence Web Visualizer */}
            <div className="relative h-[720px] w-full">
              <EvidenceWeb
                analysis={analysis}
                selectedClaimId={selectedClaim?.id || null}
                onSelectClaim={(claim) => setSelectedClaim(claim)}
              />
            </div>
          </div>
        )}

        {/* Section C: Conservative Model Disclaimer */}
        <footer className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Conservative Verdict Standard:</strong> ProofSpider maps manufacturer marketing claims directly to public technical specifications, footnote disclaimers, and warranty policies. It visualizes public evidence and does not make legal or safety conclusions.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 font-mono text-[11px] text-slate-400">
            <span>Scraper Studio: <code className="text-indigo-300">c_mt1v2vo62kutyo7m6k</code></span>
          </div>
        </footer>
      </div>

      {/* Slide-over Evidence Drawer */}
      <EvidenceDrawer
        claim={selectedClaim}
        onClose={() => setSelectedClaim(null)}
      />

      {/* Scraper Studio Self-Healing Proof Modal */}
      <HealModal
        isOpen={isHealModalOpen}
        onClose={() => setIsHealModalOpen(false)}
      />
    </main>
  );
}
