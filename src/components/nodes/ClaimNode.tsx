'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { AnalyzedClaim, ClaimVerdict } from '@/types/proofspider';

const verdictStyles: Record<ClaimVerdict, {
  border: string;
  bg: string;
  text: string;
  badge: string;
  icon: React.ElementType;
  glow: string;
}> = {
  Supported: {
    border: 'border-emerald-500/60 hover:border-emerald-400',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
    glow: 'shadow-emerald-500/10',
  },
  Qualified: {
    border: 'border-amber-500/60 hover:border-amber-400',
    bg: 'bg-amber-950/40',
    text: 'text-amber-300',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: AlertTriangle,
    glow: 'shadow-amber-500/10',
  },
  Conflicted: {
    border: 'border-rose-500/60 hover:border-rose-400',
    bg: 'bg-rose-950/40',
    text: 'text-rose-300',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: XCircle,
    glow: 'shadow-rose-500/10',
  },
  Unknown: {
    border: 'border-slate-500/60 hover:border-slate-400',
    bg: 'bg-slate-900/60',
    text: 'text-slate-300',
    badge: 'bg-slate-700/40 text-slate-300 border-slate-600/30',
    icon: HelpCircle,
    glow: 'shadow-slate-500/10',
  },
};

function ClaimNodeComponent({ data, selected }: { data: AnalyzedClaim & { isSelected?: boolean }; selected?: boolean }) {
  const style = verdictStyles[data.verdict] || verdictStyles.Unknown;
  const Icon = style.icon;
  const isHighlighted = selected || data.isSelected;

  return (
    <div
      className={`relative group min-w-[240px] max-w-[280px] rounded-xl border-2 ${style.border} ${style.bg} p-3.5 text-white shadow-xl backdrop-blur-xl transition-all duration-200 cursor-pointer ${
        isHighlighted ? 'ring-2 ring-indigo-400 scale-[1.03] shadow-2xl' : ''
      } ${style.glow}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2.5 !h-2.5 !border !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-400 !w-2.5 !h-2.5 !border !border-slate-900" />
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2.5 !h-2.5 !border !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-2.5 !h-2.5 !border !border-slate-900" />

      {/* Header: Category & Verdict Badge */}
      <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-800/80">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
          {data.category}
        </span>
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${style.badge}`}>
          <Icon className="w-3 h-3" />
          <span>{data.verdict}</span>
        </div>
      </div>

      {/* Claim Text */}
      <div className="my-2.5">
        <p className="text-xs font-semibold text-slate-100 line-clamp-3 leading-relaxed">
          &ldquo;{data.claimText}&rdquo;
        </p>
      </div>

      {/* Confidence Bar & Evidence Count */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[10px]">Confidence</span>
          <span className="font-mono font-bold text-slate-200">
            {Math.round(data.confidence * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1 text-indigo-400 font-medium text-[10px]">
          <span>{data.evidence.length} evidence</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}

export default memo(ClaimNodeComponent);
