'use client';

import React from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Code, FileJson, Check } from 'lucide-react';
import { COLLECTOR_ID } from '@/lib/constants';


interface HealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HealModal({ isOpen, onClose }: HealModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-4 h-4" />
                Bright Data Scraper Studio
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">Self-Healing Pipeline</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-white">
              Collector Self-Healing & Verification Proof
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Overview */}
        <div className="mt-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1: Initial Run */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Phase 1</span>
                <span className="text-emerald-400 font-bold">Passed</span>
              </div>
              <h3 className="text-sm font-bold text-white">Initial Scrape</h3>
              <p className="text-xs text-slate-400">
                Created collector <code className="text-indigo-300 font-mono">{COLLECTOR_ID}</code>. Extracted base features and pricing.
              </p>
              <div className="text-[11px] font-mono text-indigo-400">
                📄 artifacts/sony-wh1000xm5-run.json
              </div>
            </div>

            {/* Step 2: Self-Healing */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
                <span>Phase 2</span>
                <span className="font-bold">AI Healed</span>
              </div>
              <h3 className="text-sm font-bold text-white">bdata scraper heal</h3>
              <p className="text-xs text-slate-300">
                Triggered AI self-healing to refine price formatting, warranty links, and fine-print footnote evidence.
              </p>
              <div className="text-[11px] font-mono text-amber-400">
                📄 artifacts/heal.json (179 polling steps)
              </div>
            </div>

            {/* Step 3: Approval & Rerun */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
                <span>Phase 3</span>
                <span className="font-bold">Approved & Verified</span>
              </div>
              <h3 className="text-sm font-bold text-white">bdata scraper approve</h3>
              <p className="text-xs text-slate-300">
                Approved the AI repair preview and verified extraction accuracy on public Sony target URLs.
              </p>
              <div className="text-[11px] font-mono text-emerald-400">
                📄 artifacts/sony-wh1000xm5-healed.json
              </div>
            </div>
          </div>

          {/* Self-Healing Command & Diff Details */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>Executed Self-Healing Command</span>
              </div>
              <span className="text-emerald-400 font-mono text-[11px]">Exit Code: 0</span>
            </div>
            <pre className="rounded-lg bg-slate-900 p-3 text-xs font-mono text-indigo-300 overflow-x-auto border border-slate-800">
{`npx -p @brightdata/cli bdata scraper heal ${COLLECTOR_ID} \\
  "Clean the price value to exact numeric amount and currency. Extract warranty_or_support_links, return_policy_links, key_specs array with label and value, headline_claims array, and evidence excerpts." \\
  --url https://www.sony.com/electronics/headband-headphones/wh-1000xm5 \\
  --pretty -o artifacts/heal.json`}
            </pre>
          </div>

          {/* Preview Output Artifact */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-amber-400" />
                <span>Healed JSON Artifact Excerpt (artifacts/heal.json)</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">status: &quot;awaiting_approval&quot; &rarr; &quot;done&quot;</span>
            </div>
            <pre className="rounded-lg bg-slate-900 p-3 text-xs font-mono text-slate-200 overflow-x-auto max-h-60 border border-slate-800 leading-relaxed">
{`{
  "collector_id": "${COLLECTOR_ID}",
  "completed_steps": [
    "planner",
    "control_preview_runner",
    "code_fixer",
    "step_preview_runner",
    "request_fulfillment_validator",
    "step_advance"
  ],
  "preview_result": [{
    "product_title": "WH-1000XM5 Premium Wireless Noise Canceling Headphones | Black",
    "model_number": "Model: WH-1000XM5",
    "current_price": { "value": 248, "currency": "USD" },
    "original_price": { "value": 399.99, "currency": "USD" },
    "headline_claims": [
      "Premium noise cancellation optimized to you 1",
      "Magnificent Sound, engineered to perfection",
      "Crystal clear hands-free calling"
    ],
    "warranty_or_support_links": [
      "https://www.sony.com/electronics/support?cpint=d2c-supportmenu",
      "https://www.playstation.com/en-us/support/playstation-support-contact-guide/"
    ],
    "evidence_excerpts": [
      "As of 01/01/2022 Headband-style of noise-cancelling headphones...",
      "Actual performance varies based on settings, environmental conditions... Battery capacity decreases over time and use."
    ]
  }]
}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audited & verified against official Bright Data Scraper Studio guidelines.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
