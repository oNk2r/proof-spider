export type ClaimVerdict = 'Supported' | 'Qualified' | 'Conflicted' | 'Unknown';

export interface ClaimEvidence {
  id: string;
  field: string;
  extractedValue: string;
  sourceExcerpt: string;
  sourceUrl: string;
  relevance: string;
  type: 'spec' | 'footnote' | 'policy' | 'warranty' | 'manual' | 'badge';
}

export interface PolicyCitation {
  title: string;
  url: string;
  type: 'warranty' | 'support' | 'return' | 'terms';
  snippet?: string;
}

export interface AnalyzedClaim {
  id: string;
  claimText: string;
  category: 'Performance' | 'Battery & Power' | 'Durability & Materials' | 'Comfort & Design' | 'Connectivity' | 'Audio & ANC' | 'General';
  verdict: ClaimVerdict;
  confidence: number; // 0.0 to 1.0
  reason: string;
  evidence: ClaimEvidence[];
  unknowns: string[];
  policyCitations: PolicyCitation[];
}

export interface ProductSpec {
  label: string;
  value: string;
  unit?: string;
  category?: string;
}

export interface ProductPrice {
  value: number;
  currency: string;
  symbol?: string;
  originalValue?: number;
  savings?: string;
}

export interface ProductAnalysis {
  productName: string;
  brand: string;
  modelNumber: string | null;
  category: string;
  price: ProductPrice | null;
  heroImageUrl: string | null;
  sourceUrl: string;
  scrapedAt: string;
  collectorId: string;
  claims: AnalyzedClaim[];
  specs: ProductSpec[];
  warrantyAndSupportLinks: PolicyCitation[];
  returnPolicyLinks: PolicyCitation[];
  evidenceExcerpts: string[];
  verdictSummary: {
    total: number;
    supported: number;
    qualified: number;
    conflicted: number;
    unknown: number;
  };
  rawCollectorData?: any;
  healedCollector?: boolean;
}

export interface ScraperStatusInfo {
  collectorId: string;
  collectorName: string;
  status: string;
  viewUrl: string;
  healedAt?: string;
  lastRunTarget?: string;
  isLiveAvailable: boolean;
}
