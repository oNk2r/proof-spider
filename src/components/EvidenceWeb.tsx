'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ProductNodeComponent from './nodes/ProductNode';
import ClaimNodeComponent from './nodes/ClaimNode';
import EvidenceNodeComponent from './nodes/EvidenceNode';
import { AnalyzedClaim, ClaimVerdict, ProductAnalysis } from '@/types/proofspider';
import { Filter, Search, RotateCcw, Eye, ShieldCheck } from 'lucide-react';

interface EvidenceWebProps {
  analysis: ProductAnalysis;
  selectedClaimId: string | null;
  onSelectClaim: (claim: AnalyzedClaim | null) => void;
}

const nodeTypes = {
  productNode: ProductNodeComponent,
  claimNode: ClaimNodeComponent,
  evidenceNode: EvidenceNodeComponent,
};

const verdictColors: Record<ClaimVerdict, string> = {
  Supported: '#10B981', // emerald-500
  Qualified: '#F59E0B', // amber-500
  Conflicted: '#EF4444', // rose-500
  Unknown: '#94A3B8',   // slate-400
};

export default function EvidenceWeb({ analysis, selectedClaimId, onSelectClaim }: EvidenceWebProps) {
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generate Radial Graph Layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Center: Product Node
    nodes.push({
      id: 'product-root',
      type: 'productNode',
      position: { x: 0, y: 0 },
      data: {
        productName: analysis.productName,
        brand: analysis.brand,
        modelNumber: analysis.modelNumber,
        category: analysis.category,
        price: analysis.price,
        heroImageUrl: analysis.heroImageUrl,
        sourceUrl: analysis.sourceUrl,
        collectorId: analysis.collectorId,
        verdictSummary: analysis.verdictSummary,
      },
    });

    // Ring 1 & Ring 2 Layout Calculations
    const claims = analysis.claims;
    const totalClaims = claims.length;
    const ring1Radius = 380; // Distance from center to claims

    claims.forEach((claim, index) => {
      // Calculate angle for radial distribution
      const angle = (2 * Math.PI * index) / totalClaims - Math.PI / 2;
      const claimX = Math.round(ring1Radius * Math.cos(angle));
      const claimY = Math.round(ring1Radius * Math.sin(angle));

      const isSelected = claim.id === selectedClaimId;
      const edgeColor = verdictColors[claim.verdict] || '#6366F1';

      // Add Claim Node
      nodes.push({
        id: claim.id,
        type: 'claimNode',
        position: { x: claimX, y: claimY },
        data: {
          ...claim,
          isSelected,
        },
        selected: isSelected,
      });

      // Edge from Product to Claim
      edges.push({
        id: `edge-root-${claim.id}`,
        source: 'product-root',
        target: claim.id,
        animated: isSelected,
        style: {
          stroke: edgeColor,
          strokeWidth: isSelected ? 3 : 2,
          strokeDasharray: claim.verdict === 'Qualified' ? '4 4' : undefined,
          opacity: selectedClaimId && !isSelected ? 0.25 : 0.85,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 14,
          height: 14,
        },
      });

      // Add Evidence Nodes (Ring 2) around each claim
      const evidenceList = claim.evidence;
      const evidenceRadius = 260; // Offset from claim node
      
      evidenceList.forEach((ev, evIdx) => {
        const evAngleOffset = (evIdx - (evidenceList.length - 1) / 2) * 0.45;
        const totalEvAngle = angle + evAngleOffset;
        const evX = claimX + Math.round(evidenceRadius * Math.cos(totalEvAngle));
        const evY = claimY + Math.round(evidenceRadius * Math.sin(totalEvAngle));

        nodes.push({
          id: ev.id,
          type: 'evidenceNode',
          position: { x: evX, y: evY },
          data: {
            ...ev,
            isSelected,
          },
        });

        // Edge from Claim to Evidence
        edges.push({
          id: `edge-${claim.id}-${ev.id}`,
          source: claim.id,
          target: ev.id,
          animated: isSelected,
          style: {
            stroke: edgeColor,
            strokeWidth: isSelected ? 2 : 1.5,
            opacity: selectedClaimId && !isSelected ? 0.15 : 0.7,
          },
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [analysis, selectedClaimId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronize nodes/edges when analysis or selection changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Filter nodes based on verdict filter and search query
  const filteredNodes = useMemo(() => {
    if (filterVerdict === 'ALL' && !searchQuery.trim()) {
      return nodes;
    }

    const matchingClaimIds = new Set<string>();
    analysis.claims.forEach(c => {
      const matchesVerdict = filterVerdict === 'ALL' || c.verdict.toUpperCase() === filterVerdict;
      const matchesQuery = !searchQuery.trim() || 
        c.claimText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.reason.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (matchesVerdict && matchesQuery) {
        matchingClaimIds.add(c.id);
        c.evidence.forEach(e => matchingClaimIds.add(e.id));
      }
    });

    return nodes.map(n => {
      if (n.id === 'product-root') return n;
      const isVisible = matchingClaimIds.has(n.id);
      return {
        ...n,
        hidden: !isVisible,
      };
    });
  }, [nodes, filterVerdict, searchQuery, analysis.claims]);

  // Node click handler
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'claimNode') {
      const claim = analysis.claims.find(c => c.id === node.id);
      if (claim) onSelectClaim(claim);
    } else if (node.type === 'evidenceNode') {
      // Find parent claim for this evidence
      const parentClaim = analysis.claims.find(c => c.evidence.some(e => e.id === node.id));
      if (parentClaim) onSelectClaim(parentClaim);
    } else if (node.type === 'productNode') {
      onSelectClaim(null);
    }
  }, [analysis.claims, onSelectClaim]);

  return (
    <div className="relative w-full h-full min-h-[640px] rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2.5 rounded-xl bg-slate-900/90 p-2.5 border border-slate-800 backdrop-blur-xl shadow-xl">
        {/* Search */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search claims & evidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 sm:w-56 rounded-lg bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Verdict Filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterVerdict('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              filterVerdict === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({analysis.claims.length})
          </button>
          <button
            onClick={() => setFilterVerdict('SUPPORTED')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              filterVerdict === 'SUPPORTED' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Supported ({analysis.verdictSummary.supported})
          </button>
          <button
            onClick={() => setFilterVerdict('QUALIFIED')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              filterVerdict === 'QUALIFIED' ? 'bg-amber-600 text-white shadow' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Qualified ({analysis.verdictSummary.qualified})
          </button>
          <button
            onClick={() => setFilterVerdict('CONFLICTED')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              filterVerdict === 'CONFLICTED' ? 'bg-rose-600 text-white shadow' : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            Conflicted ({analysis.verdictSummary.conflicted})
          </button>
        </div>

        {/* Reset Selection */}
        {selectedClaimId && (
          <button
            onClick={() => onSelectClaim(null)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset View</span>
          </button>
        )}
      </div>

      {/* Legend on Bottom Left */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 rounded-xl bg-slate-900/90 p-3 border border-slate-800 backdrop-blur-xl shadow-xl text-[11px]">
        <div className="font-bold text-slate-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Verdict Legend</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-300">Supported (Direct public proof)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-300">Qualified (Material conditions apply)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-slate-300">Conflicted (Public discrepancies)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span className="text-slate-400">Unknown (Evidence not discovered)</span>
        </div>
      </div>

      {/* React Flow Graph */}
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={20} size={1} variant={BackgroundVariant.Dots} />
        <Controls className="!bg-slate-900 !border-slate-800 !text-white !fill-white rounded-lg shadow-xl" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'productNode') return '#6366F1';
            if (node.type === 'claimNode') {
              const v = (node.data as any).verdict as ClaimVerdict;
              return verdictColors[v] || '#94A3B8';
            }
            return '#475569';
          }}
          className="!bg-slate-950 !border-slate-800 rounded-xl"
          maskColor="rgba(15, 23, 42, 0.75)"
        />
      </ReactFlow>
    </div>
  );
}
