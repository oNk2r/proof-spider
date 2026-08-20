'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, ShieldAlert, Cpu, ExternalLink, Scale, CheckCircle } from 'lucide-react';
import { ClaimEvidence } from '@/types/proofspider';

const typeIcons: Record<string, React.ElementType> = {
  spec: Cpu,
  footnote: FileText,
  policy: Scale,
  warranty: ShieldAlert,
  manual: FileText,
  badge: CheckCircle,
};

function EvidenceNodeComponent({ data, selected }: { data: ClaimEvidence & { isSelected?: boolean }; selected?: boolean }) {
  const Icon = typeIcons[data.type] || FileText;
  const isHighlighted = selected || data.isSelected;

  return (
    <div
      className={`relative group min-w-[220px] max-w-[260px] rounded-xl border border-slate-700 bg-slate-950/90 p-3 text-white shadow-lg backdrop-blur-md transition-all duration-200 ${
        isHighlighted ? 'ring-2 ring-indigo-400 border-indigo-400 scale-[1.02]' : 'hover:border-slate-500'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-2 !h-2 !border !border-slate-900" />
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2 !border !border-slate-900" />

      {/* Header Badge */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px]">
        <div className="flex items-center gap-1 font-semibold text-slate-400 uppercase tracking-wider">
          <Icon className="w-3 h-3 text-indigo-400" />
          <span>{data.type}</span>
        </div>
        {data.sourceUrl && (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
            title="View public source link"
          >
            <span>Source</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>

      {/* Source Excerpt */}
      <div className="my-2">
        <p className="text-[11px] font-mono text-slate-300 line-clamp-3 leading-relaxed bg-slate-900/80 p-1.5 rounded border border-slate-800">
          &ldquo;{data.sourceExcerpt}&rdquo;
        </p>
      </div>

      {/* Relevance Tag */}
      {data.relevance && (
        <div className="text-[10px] text-slate-400 line-clamp-1 italic">
          ↳ {data.relevance}
        </div>
      )}
    </div>
  );
}

export default memo(EvidenceNodeComponent);
