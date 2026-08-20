'use client';

import React from 'react';
import { AnalyzedClaim, ClaimVerdict } from '@/types/proofspider';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';

interface EvidenceDrawerProps {
  claim: AnalyzedClaim | null;
  onClose: () => void;
}

const verdictDetails: Record<ClaimVerdict, {
  label: string;
  badge: string;
  icon: React.ElementType;
  description: string;
}> = {
  Supported: {
    label: 'Supported',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
    description: 'Direct public evidence supports the claim with no discovered material qualifier.',
  },
  Qualified: {
    label: 'Qualified',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: AlertTriangle,
    description: 'Evidence supports the core claim, but important limits, exclusions, or operating conditions exist.',
  },
  Conflicted: {
    label: 'Conflicted',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: XCircle,
    description: 'Public sources associated with the product appear to disagree or show conflicting statements.',
  },
  Unknown: {
    label: 'Unknown',
    badge: 'bg-slate-700/40 text-slate-300 border-slate-600/30',
    icon: HelpCircle,
    description: 'The claim exists on marketing materials but adequate supporting evidence was not discovered in public sources.',
  },
};

export default function EvidenceDrawer({ claim, onClose }: EvidenceDrawerProps) {
  const [copied, setCopied] = React.useState(false);

  if (!claim) return null;

  const verdict = verdictDetails[claim.verdict] || verdictDetails.Unknown;
  const VerdictIcon = verdict.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(claim, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col text-white transform transition-transform duration-300 ease-out">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-400">
              Claim Analysis Details
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] font-mono text-slate-400">{claim.id}</span>
          </div>
          <h2 className="mt-1.5 text-lg font-bold text-slate-100 leading-snug">
            &ldquo;{claim.claimText}&rdquo;
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body Scroll */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Verdict & Confidence Banner */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Verdict:</span>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${verdict.badge}`}>
                <VerdictIcon className="w-4 h-4" />
                <span>{verdict.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Confidence:</span>
              <span className="text-sm font-mono font-extrabold text-indigo-300">
                {Math.round(claim.confidence * 100)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed italic">
            {verdict.description}
          </p>
        </div>

        {/* Why this verdict? Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Info className="w-4 h-4" />
            <span>Why this verdict?</span>
          </div>
          <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4">
            <p className="text-sm text-slate-200 leading-relaxed">
              {claim.reason}
            </p>
          </div>
        </div>

        {/* Extracted Evidence Excerpts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Public Evidence Excerpts ({claim.evidence.length})</span>
            </div>
          </div>

          <div className="space-y-3">
            {claim.evidence.map((ev, index) => (
              <div
                key={ev.id || index}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-indigo-300 font-semibold uppercase">
                    [{ev.type}] {ev.extractedValue}
                  </span>
                  {ev.sourceUrl && (
                    <a
                      href={ev.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-[11px]"
                    >
                      <span>Public Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800/80">
                  <p className="text-xs font-mono text-slate-300 leading-relaxed">
                    &ldquo;{ev.sourceExcerpt}&rdquo;
                  </p>
                </div>
                {ev.relevance && (
                  <p className="text-[11px] text-slate-400 italic">
                    ↳ <span className="font-semibold text-slate-300">Finding:</span> {ev.relevance}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Unknowns / Limits */}
        {claim.unknowns && claim.unknowns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Undiscovered Information & Unknowns</span>
            </div>
            <ul className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
              {claim.unknowns.map((unk, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{unk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Associated Policies & Warranties */}
        {claim.policyCitations && claim.policyCitations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Referenced Policy Documents</span>
            </div>
            <div className="space-y-2">
              {claim.policyCitations.map((pol, idx) => (
                <a
                  key={idx}
                  href={pol.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-slate-800 bg-slate-950 p-3 hover:border-indigo-500/50 transition-colors group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">
                    <span>{pol.title}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                  {pol.snippet && (
                    <p className="mt-1 text-[11px] text-slate-400 leading-normal">
                      {pol.snippet}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Claim JSON!' : 'Copy Claim Evidence JSON'}</span>
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
