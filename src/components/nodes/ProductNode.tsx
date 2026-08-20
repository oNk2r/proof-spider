'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Headphones, ShieldCheck, Tag, ExternalLink } from 'lucide-react';
import { ProductPrice } from '@/types/proofspider';

interface ProductNodeData {
  productName: string;
  brand: string;
  modelNumber: string | null;
  category: string;
  price: ProductPrice | null;
  heroImageUrl: string | null;
  sourceUrl: string;
  collectorId: string;
  verdictSummary: {
    total: number;
    supported: number;
    qualified: number;
    conflicted: number;
    unknown: number;
  };
}

function ProductNodeComponent({ data }: { data: ProductNodeData }) {
  return (
    <div className="relative group min-w-[280px] max-w-[320px] rounded-2xl border-2 border-indigo-500/40 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-400 hover:shadow-indigo-500/20">
      <Handle type="source" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Left} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />

      {/* Header Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-indigo-400 uppercase">
          <Headphones className="w-3.5 h-3.5" />
          <span>{data.brand || 'Product Entity'}</span>
        </div>
        {data.modelNumber && (
          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300 border border-slate-700">
            {data.modelNumber}
          </span>
        )}
      </div>

      {/* Product Image & Info */}
      <div className="mt-3 flex gap-3 items-center">
        {data.heroImageUrl ? (
          <div className="w-16 h-16 rounded-lg bg-slate-950 p-1 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.heroImageUrl} alt={data.productName} className="object-contain w-full h-full" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
            <Headphones className="w-8 h-8 text-indigo-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight" title={data.productName}>
            {data.productName}
          </h3>
          {data.price && (
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-emerald-400">
                {data.price.symbol || '$'}{data.price.value.toFixed(2)}
              </span>
              {data.price.originalValue && (
                <span className="text-xs line-through text-slate-500">
                  ${data.price.originalValue.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Verdict Summary Pill Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5 flex justify-between">
          <span>Claims Verified</span>
          <span className="font-mono text-indigo-400">{data.verdictSummary.total} claims</span>
        </div>
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-mono">
          <div className="rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 py-0.5">
            {data.verdictSummary.supported} Supp.
          </div>
          <div className="rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 py-0.5">
            {data.verdictSummary.qualified} Qual.
          </div>
          <div className="rounded bg-rose-950/60 border border-rose-800/60 text-rose-300 py-0.5">
            {data.verdictSummary.conflicted} Conf.
          </div>
          <div className="rounded bg-slate-800/80 border border-slate-700/60 text-slate-300 py-0.5">
            {data.verdictSummary.unknown} Unk.
          </div>
        </div>
      </div>

      {/* Collector Reference Footer */}
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
        <span className="font-mono truncate max-w-[170px]">ID: {data.collectorId}</span>
        {data.sourceUrl && (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export default memo(ProductNodeComponent);
