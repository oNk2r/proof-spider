'use client';

import React from 'react';
import { Sparkles, ExternalLink, Cpu, ShieldCheck, Activity } from 'lucide-react';
import { COLLECTOR_ID } from '@/lib/constants';


interface CollectorBadgeProps {
  collectorId?: string;
  onOpenHealModal?: () => void;
  isLive?: boolean;
}

export default function CollectorBadge({
  collectorId = COLLECTOR_ID,
  onOpenHealModal,
  isLive = false,
}: CollectorBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Collector ID Chip */}
      <div className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
            Bright Data Scraper Studio
          </span>
        </div>
        <span className="text-slate-600">•</span>
        <a
          href={`https://brightdata.com/cp/scrapers/${collectorId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono text-xs font-bold text-white hover:text-indigo-300 transition-colors"
          title="Open collector in Bright Data dashboard"
        >
          <span>{collectorId}</span>
          <ExternalLink className="w-3 h-3 text-indigo-400" />
        </a>
      </div>

      {/* Self-Healing Trigger Button */}
      {onOpenHealModal && (
        <button
          onClick={onOpenHealModal}
          className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/40 hover:border-amber-400 transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Self-Healing Verified</span>
        </button>
      )}

      {/* Live / Artifact mode badge */}
      <div className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900 text-slate-400">
        <Activity className="w-3 h-3 text-emerald-400" />
        <span>{isLive ? 'Live Scrape Pipeline' : 'Verified Collector Artifact'}</span>
      </div>
    </div>
  );
}
