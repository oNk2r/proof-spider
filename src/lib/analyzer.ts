import {
  AnalyzedClaim,
  ClaimEvidence,
  PolicyCitation,
  ProductAnalysis,
  ProductPrice,
  ProductSpec,
} from '@/types/proofspider';
import { COLLECTOR_ID } from './constants';
import type { RawScraperOutput } from './brightdata';
import type { ScraperDataSource } from './brightdata';
import { dedupeRepeatedText, inferBrand, sanitizePriceValue } from './normalize-scraper';

interface AnalyzeOptions {
  dataSource?: ScraperDataSource;
}

function linksToPolicyCitations(
  links: string[] | undefined,
  type: PolicyCitation['type']
): PolicyCitation[] {
  if (!Array.isArray(links) || links.length === 0) return [];

  return links.map((url, index) => ({
    title: titleFromPolicyUrl(url, type, index),
    url,
    type,
  }));
}

function titleFromPolicyUrl(url: string, type: PolicyCitation['type'], index: number): string {
  const lower = url.toLowerCase();
  if (lower.includes('apple.com') && lower.includes('warranty')) return 'Apple Hardware Limited Warranty';
  if (lower.includes('apple.com') && lower.includes('returns')) return 'Apple Sales & Refund Policy';
  if (lower.includes('apple.com') && lower.includes('repair')) return 'Apple Official Service & Repair Terms';
  if (lower.includes('bose.com') && lower.includes('warranty')) return 'Bose Limited Consumer Warranty';
  if (lower.includes('bose.com') && lower.includes('returns')) return 'Bose 90-Day Risk-Free Trial & Returns';
  if (lower.includes('bose.com') && lower.includes('terms-of-sale')) return 'Bose Official Terms of Sale & Returns';
  if (lower.includes('bose.com') && lower.includes('contact')) return 'Bose Official Support & Customer Care';
  if (lower.includes('samsung.com') && lower.includes('warranty')) return 'Samsung Standard Limited Warranty';
  if (lower.includes('samsung.com') && (lower.includes('trade-in') || lower.includes('return') || lower.includes('shopping'))) return 'Samsung Direct Return & Trade-In Terms';
  if (lower.includes('samsung.com') && lower.includes('contact')) return 'Samsung Customer Support & Service Portal';
  if (lower.includes('samsung.com') && lower.includes('support')) return 'Samsung Official Product Support Portal';
  if (lower.includes('returns-policy') || lower.includes('/returns')) return 'Manufacturer Return & Refund Policy';
  if (lower.includes('articles/00234509') || lower.includes('/warranty')) return 'Sony Limited Consumer Hardware Warranty';
  if (lower.includes('articles/00199342')) return 'Sony US Purchase & Warranty Terms';
  if (lower.includes('eservice.sony.com')) return 'Authorized Repair & Spare Parts Service';
  if (lower.includes('/support') || lower.includes('service')) return 'Official Support & Service Portal';
  if (type === 'return') return `Return Policy Link ${index + 1}`;
  if (type === 'warranty') return `Warranty Policy Link ${index + 1}`;
  return `Support Link ${index + 1}`;
}

function collectClaimCandidates(raw: RawScraperOutput): string[] {
  const seen = new Set<string>();
  const candidates: string[] = [];

  const add = (value?: string) => {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) return;
    seen.add(trimmed.toLowerCase());
    candidates.push(trimmed);
  };

  raw.headline_claims?.forEach(add);
  raw.key_features?.forEach(add);
  raw.icon_features?.forEach(add);

  return candidates;
}

function findRelevantExcerpt(excerpts: string[], keywords: string[]): string | undefined {
  return excerpts.find((excerpt) => {
    const lower = excerpt.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword));
  });
}

function findRelevantSpec(specs: ProductSpec[], keywords: string[]): ProductSpec | undefined {
  return specs.find((spec) => {
    const haystack = `${spec.label} ${spec.value}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });
}

/**
 * Normalizes raw Bright Data Scraper Studio output into consistent ProductAnalysis.
 */
export function normalizeAndAnalyze(
  raw: RawScraperOutput,
  sourceUrl: string,
  options: AnalyzeOptions = {}
): ProductAnalysis {
  const productName = raw.product_title || raw.product_name || 'Consumer Electronics Product';
  const brand = inferBrand(raw, sourceUrl);
  const modelNumber = raw.model_number?.replace(/^Model:\s*/i, '') || null;
  const category = raw.category || 'Consumer Electronics';
  const heroImageUrl = raw.product_image || raw.hero_image_url || null;
  const healedCollector = options.dataSource === 'artifact-healed';

  let price: ProductPrice | null = null;
  if (raw.current_price) {
    if (typeof raw.current_price === 'object') {
      price = {
        value:
          typeof raw.current_price.value === 'number'
            ? sanitizePriceValue(raw.current_price.value)
            : 0,
        currency: raw.current_price.currency || 'USD',
        symbol: raw.current_price.symbol || '$',
        originalValue:
          typeof raw.original_price === 'object' && raw.original_price?.value
            ? sanitizePriceValue(raw.original_price.value)
            : undefined,
        savings: raw.savings_amount ? dedupeRepeatedText(raw.savings_amount) : undefined,
      };
    } else if (typeof raw.current_price === 'number') {
      price = {
        value: sanitizePriceValue(raw.current_price),
        currency: 'USD',
        symbol: '$',
      };
    }
  }

  const specs: ProductSpec[] = Array.isArray(raw.key_specs)
    ? raw.key_specs
        .filter((spec) => spec.label && spec.value)
        .map((spec) => ({ label: spec.label, value: spec.value, unit: spec.unit }))
    : [];

  const warrantyAndSupportLinks = linksToPolicyCitations(raw.warranty_or_support_links, 'support');
  const returnPolicyLinks = linksToPolicyCitations(raw.return_policy_links, 'return');
  const evidenceExcerpts = Array.isArray(raw.evidence_excerpts) ? raw.evidence_excerpts : [];

  const claimCandidates = collectClaimCandidates(raw);
  const claims: AnalyzedClaim[] = claimCandidates.map((claimText, index) =>
    classifyClaim(
      claimText,
      index,
      evidenceExcerpts,
      warrantyAndSupportLinks,
      returnPolicyLinks,
      specs,
      sourceUrl
    )
  );

  const verdictSummary = {
    total: claims.length,
    supported: claims.filter((claim) => claim.verdict === 'Supported').length,
    qualified: claims.filter((claim) => claim.verdict === 'Qualified').length,
    conflicted: claims.filter((claim) => claim.verdict === 'Conflicted').length,
    unknown: claims.filter((claim) => claim.verdict === 'Unknown').length,
  };

  return {
    productName,
    brand,
    modelNumber,
    category,
    price,
    heroImageUrl,
    sourceUrl:
      raw.input?.url && (raw.input.url.startsWith('http://') || raw.input.url.startsWith('https://'))
        ? raw.input.url
        : sourceUrl,
    scrapedAt: raw.scraped_at || new Date().toISOString(),
    collectorId: COLLECTOR_ID,
    claims,
    specs,
    warrantyAndSupportLinks,
    returnPolicyLinks,
    evidenceExcerpts,
    verdictSummary,
    rawCollectorData: raw,
    healedCollector,
  };
}

function classifyClaim(
  claimText: string,
  index: number,
  excerpts: string[],
  warrantyLinks: PolicyCitation[],
  returnLinks: PolicyCitation[],
  specs: ProductSpec[],
  sourceUrl: string
): AnalyzedClaim {
  const text = claimText.toLowerCase();
  const id = `claim-${index + 1}`;
  const footnoteMatch = claimText.match(/\s(\d+)\s*$/);
  const footnoteNumber = footnoteMatch?.[1];

  if (text.includes('noise cancel') || text.includes(' nc') || text.includes('ambient')) {
    const excerpt =
      findRelevantExcerpt(excerpts, ['jeita', 'noise-cancell', '01/01/2022']) ||
      (footnoteNumber ? excerpts.find((item) => item.startsWith(`${footnoteNumber}.`)) : undefined);
    const spec = findRelevantSpec(specs, ['noise', 'processor', 'microphone']);

    if (!excerpt && !spec) {
      return unknownClaim(id, claimText, 'Audio & ANC', sourceUrl, 'Marketing references noise cancellation, but no matching footnote or spec was extracted.');
    }

    return {
      id,
      claimText,
      category: 'Audio & ANC',
      verdict: excerpt ? 'Qualified' : 'Supported',
      confidence: excerpt ? 0.94 : 0.88,
      reason: excerpt
        ? 'Public ANC marketing is qualified by a dated benchmark footnote or operating-condition disclaimer from the product page.'
        : 'Public technical specs describe the ANC hardware without a discovered conflicting disclaimer.',
      evidence: buildEvidence(id, sourceUrl, [
        excerpt
          ? {
              field: 'evidence_excerpts',
              extractedValue: claimText,
              sourceExcerpt: excerpt,
              relevance: 'Footnote or benchmark qualifier tied to the marketing claim.',
              type: 'footnote',
            }
          : null,
        spec
          ? {
              field: 'key_specs',
              extractedValue: `${spec.label}: ${spec.value}`,
              sourceExcerpt: spec.value,
              relevance: 'Technical ANC specification from the product page.',
              type: 'spec',
            }
          : null,
      ]),
      unknowns: excerpt ? ['Comparative ANC performance against newer competitor models.'] : [],
      policyCitations: warrantyLinks.slice(0, 1),
    };
  }

  if (text.includes('battery') || text.includes('hour') || text.includes('quick charg') || text.includes('charge')) {
    const excerpt =
      (text.includes('quick charg')
        ? findRelevantExcerpt(excerpts, ['usb-pd', 'quick charg', '3-minute', 'charger'])
        : undefined) ||
      findRelevantExcerpt(excerpts, ['battery', 'performance varies', 'codec']) ||
      (footnoteNumber ? excerpts.find((item) => item.startsWith(`${footnoteNumber}.`)) : undefined);
    const spec = findRelevantSpec(specs, ['battery', 'charge']);

    if (!excerpt && !spec) {
      return unknownClaim(id, claimText, 'Battery & Power', sourceUrl, 'Battery marketing was found, but no battery footnote or spec was extracted.');
    }

    return {
      id,
      claimText,
      category: 'Battery & Power',
      verdict: excerpt ? 'Qualified' : 'Supported',
      confidence: excerpt ? 0.96 : 0.87,
      reason: excerpt
        ? 'Battery life is disclosed with operating-condition qualifiers such as codec, volume, or cell aging.'
        : 'Battery-related specs were extracted without a discovered conflicting disclaimer.',
      evidence: buildEvidence(id, sourceUrl, [
        excerpt
          ? {
              field: 'evidence_excerpts',
              extractedValue: claimText,
              sourceExcerpt: excerpt,
              relevance: 'Battery performance qualifier from public fine print.',
              type: 'footnote',
            }
          : null,
        spec
          ? {
              field: 'key_specs',
              extractedValue: `${spec.label}: ${spec.value}`,
              sourceExcerpt: spec.value,
              relevance: 'Battery or charging specification from the product page.',
              type: 'spec',
            }
          : null,
      ]),
      unknowns: ['Post-warranty battery replacement cost is often not listed on the product page.'],
      policyCitations: [...warrantyLinks.slice(0, 1), ...returnLinks.slice(0, 1)],
    };
  }

  if (
    text.includes('multipoint') ||
    text.includes('connect') ||
    text.includes('bluetooth') ||
    text.includes('app')
  ) {
    const excerpt =
      findRelevantExcerpt(excerpts, ['sound connect', 'multipoint', 'bluetooth', 'compatibility']) ||
      (footnoteNumber ? excerpts.find((item) => item.startsWith(`${footnoteNumber}.`)) : undefined);
    const spec = findRelevantSpec(specs, ['bluetooth', 'connect']);

    if (!excerpt && !spec) {
      return unknownClaim(id, claimText, 'Connectivity', sourceUrl, 'Connectivity marketing was found, but no companion-app or Bluetooth qualifier was extracted.');
    }

    return {
      id,
      claimText,
      category: 'Connectivity',
      verdict: excerpt ? 'Qualified' : 'Supported',
      confidence: excerpt ? 0.92 : 0.86,
      reason: excerpt
        ? 'Connectivity claims are qualified by app, codec, or device-compatibility fine print.'
        : 'Connectivity specs were extracted without a discovered conflicting disclaimer.',
      evidence: buildEvidence(id, sourceUrl, [
        excerpt
          ? {
              field: 'evidence_excerpts',
              extractedValue: claimText,
              sourceExcerpt: excerpt,
              relevance: 'Compatibility or app requirement from public fine print.',
              type: 'footnote',
            }
          : null,
        spec
          ? {
              field: 'key_specs',
              extractedValue: `${spec.label}: ${spec.value}`,
              sourceExcerpt: spec.value,
              relevance: 'Connectivity specification from the product page.',
              type: 'spec',
            }
          : null,
      ]),
      unknowns: ['Device-switching latency can vary by operating system and firmware.'],
      policyCitations: warrantyLinks.slice(0, 1),
    };
  }

  if (text.includes('sound') || text.includes('audio') || text.includes('driver') || text.includes('acoustic')) {
    const excerpt = findRelevantExcerpt(excerpts, ['music studios', 'co-developed', 'driver', 'authentic sound', 'dsee']);
    const spec = findRelevantSpec(specs, ['driver', 'frequency', 'audio']);

    if (!excerpt && !spec) {
      return unknownClaim(id, claimText, 'Audio & ANC', sourceUrl, 'Sound-quality marketing was found, but no matching spec or footnote was extracted.');
    }

    return {
      id,
      claimText,
      category: 'Audio & ANC',
      verdict: 'Supported',
      confidence: 0.91,
      reason: 'Public technical specifications or studio-tuning footnotes support the sound-quality claim.',
      evidence: buildEvidence(id, sourceUrl, [
        spec
          ? {
              field: 'key_specs',
              extractedValue: `${spec.label}: ${spec.value}`,
              sourceExcerpt: spec.value,
              relevance: 'Acoustic hardware specification from the product page.',
              type: 'spec',
            }
          : null,
        excerpt
          ? {
              field: 'evidence_excerpts',
              extractedValue: claimText,
              sourceExcerpt: excerpt,
              relevance: 'Public fine-print supporting the sound claim.',
              type: 'footnote',
            }
          : null,
      ]),
      unknowns: ['Subjective listening preference varies by user and fit.'],
      policyCitations: warrantyLinks.slice(0, 1),
    };
  }

  if (text.includes('call') || text.includes('voice') || text.includes('hands-free') || text.includes('mic')) {
    const excerpt = findRelevantExcerpt(excerpts, ['beamforming', 'voice', 'microphone']);
    const spec = findRelevantSpec(specs, ['microphone', 'noise']);

    if (!excerpt && !spec) {
      return unknownClaim(id, claimText, 'Performance', sourceUrl, 'Call-quality marketing was found, but no microphone spec or footnote was extracted.');
    }

    return {
      id,
      claimText,
      category: 'Performance',
      verdict: 'Supported',
      confidence: 0.89,
      reason: 'Public microphone or voice-processing details support the call-quality claim.',
      evidence: buildEvidence(id, sourceUrl, [
        spec
          ? {
              field: 'key_specs',
              extractedValue: `${spec.label}: ${spec.value}`,
              sourceExcerpt: spec.value,
              relevance: 'Microphone or voice-processing specification.',
              type: 'spec',
            }
          : null,
        excerpt
          ? {
              field: 'evidence_excerpts',
              extractedValue: claimText,
              sourceExcerpt: excerpt,
              relevance: 'Fine-print supporting call-quality claims.',
              type: 'footnote',
            }
          : null,
      ]),
      unknowns: ['Outdoor wind performance is not always disclosed on product pages.'],
      policyCitations: warrantyLinks.slice(0, 1),
    };
  }

  if (text.includes('comfort') || text.includes('design') || text.includes('lightweight') || text.includes('leather') || text.includes('slider') || text.includes('canopy') || text.includes('cushion')) {
    const spec = findRelevantSpec(specs, ['weight', 'comfort', 'design', 'audio technology', 'sensors']);

    if (!spec) {
      return unknownClaim(id, claimText, 'Comfort & Design', sourceUrl, 'Comfort marketing was found, but no matching physical spec was extracted.');
    }

    return {
      id,
      claimText,
      category: 'Comfort & Design',
      verdict: 'Supported',
      confidence: 0.88,
      reason: 'Public physical specifications support the comfort or design claim.',
      evidence: buildEvidence(id, sourceUrl, [
        {
          field: 'key_specs',
          extractedValue: `${spec.label}: ${spec.value}`,
          sourceExcerpt: spec.value,
          relevance: 'Physical design or weight specification.',
          type: 'spec',
        },
      ]),
      unknowns: ['Long-term material wear depends on usage conditions.'],
      policyCitations: [...returnLinks.slice(0, 1), ...warrantyLinks.slice(0, 1)],
    };
  }

  if (text.includes('camera') || text.includes('zoom') || text.includes('lens') || text.includes('provisual') || text.includes('megapixel') || text.includes('200mp')) {
    const excerpt = findRelevantExcerpt(excerpts, ['200mp', 'optical', 'zoom', 'sensor', 'camera']) ||
      (footnoteNumber ? excerpts.find((item) => item.startsWith(`${footnoteNumber}.`)) : undefined);
    const spec = findRelevantSpec(specs, ['camera', 'rear', 'front', 'zoom', 'sensor']);

    if (!excerpt && !spec) {
      return unknownClaim(id, claimText, 'Performance', sourceUrl, 'Camera marketing was found, but no optical spec or sensor footnote was extracted.');
    }

    return {
      id,
      claimText,
      category: 'Performance',
      verdict: excerpt ? 'Qualified' : 'Supported',
      confidence: excerpt ? 0.95 : 0.90,
      reason: excerpt
        ? 'Camera capabilities are qualified by sensor resolution binning, lighting conditions, or optical zoom footnotes.'
        : 'Technical optical specifications support the stated camera configuration.',
      evidence: buildEvidence(id, sourceUrl, [
        spec ? { field: 'key_specs', extractedValue: `${spec.label}: ${spec.value}`, sourceExcerpt: spec.value, relevance: 'Camera optical hardware specification.', type: 'spec' } : null,
        excerpt ? { field: 'evidence_excerpts', extractedValue: claimText, sourceExcerpt: excerpt, relevance: 'Footnote clarifying optical zoom or resolution conditions.', type: 'footnote' } : null,
      ]),
      unknowns: ['Low-light noise performance and dynamic range vary by scene processing.'],
      policyCitations: warrantyLinks.slice(0, 1),
    };
  }

  if (text.includes('ai') || text.includes('processor') || text.includes('snapdragon') || text.includes('chip') || text.includes('translate') || text.includes('circle to search') || text.includes('h1')) {
    const excerpt = findRelevantExcerpt(excerpts, ['galaxy ai', 'ai machine learning', 'login', 'cloud-based', 'free until', 'edge-ai', 'h1']) ||
      (footnoteNumber ? excerpts.find((item) => item.startsWith(`${footnoteNumber}.`)) : undefined);
    const spec = findRelevantSpec(specs, ['processor', 'chip', 'cpu', 'audio technology']);

    return {
      id,
      claimText,
      category: 'Performance',
      verdict: excerpt ? 'Qualified' : 'Supported',
      confidence: 0.93,
      reason: excerpt
        ? 'AI features are qualified by cloud-service terms, account requirements, or computational audio chip specifications.'
        : 'Processor hardware specifications support computational capabilities.',
      evidence: buildEvidence(id, sourceUrl, [
        spec ? { field: 'key_specs', extractedValue: `${spec.label}: ${spec.value}`, sourceExcerpt: spec.value, relevance: 'Processor specification from product sheet.', type: 'spec' } : null,
        excerpt ? { field: 'evidence_excerpts', extractedValue: claimText, sourceExcerpt: excerpt, relevance: 'Terms, chip, or account qualifiers for AI features.', type: 'footnote' } : null,
      ]),
      unknowns: ['Cloud AI availability is subject to future subscription terms.'],
      policyCitations: warrantyLinks.slice(0, 1),
    };
  }

  if (text.includes('display') || text.includes('screen') || text.includes('amoled') || text.includes('nits') || text.includes('brightness') || text.includes('120hz')) {
    const spec = findRelevantSpec(specs, ['display', 'screen', 'resolution', 'amoled']);
    return {
      id,
      claimText,
      category: 'Performance',
      verdict: 'Supported',
      confidence: 0.92,
      reason: 'Display specifications confirm panel type, resolution, and peak luminance.',
      evidence: buildEvidence(id, sourceUrl, [
        spec ? { field: 'key_specs', extractedValue: `${spec.label}: ${spec.value}`, sourceExcerpt: spec.value, relevance: 'Display panel technical specification.', type: 'spec' } : null,
      ]),
      unknowns: ['Peak outdoor brightness depends on automatic brightness control settings.'],
      policyCitations: warrantyLinks.slice(0, 1),
    };
  }

  if (text.includes('titanium') || text.includes('gorilla') || text.includes('armor') || text.includes('water') || text.includes('ip68') || text.includes('mesh')) {
    const excerpt = findRelevantExcerpt(excerpts, ['ip68', 'fresh water', 'submersion', 'gorilla', 'armor']) ||
      (footnoteNumber ? excerpts.find((item) => item.startsWith(`${footnoteNumber}.`)) : undefined);
    const spec = findRelevantSpec(specs, ['durability', 'frame', 'weight', 'material']);
    return {
      id,
      claimText,
      category: 'Durability & Materials',
      verdict: excerpt ? 'Qualified' : 'Supported',
      confidence: 0.94,
      reason: excerpt
        ? 'Durability claims and water resistance are accompanied by standardized laboratory rating qualifiers.'
        : 'Materials specifications support structural claims.',
      evidence: buildEvidence(id, sourceUrl, [
        spec ? { field: 'key_specs', extractedValue: `${spec.label}: ${spec.value}`, sourceExcerpt: spec.value, relevance: 'Chassis material or ingress protection spec.', type: 'spec' } : null,
        excerpt ? { field: 'evidence_excerpts', extractedValue: claimText, sourceExcerpt: excerpt, relevance: 'Water resistance or testing methodology disclaimer.', type: 'footnote' } : null,
      ]),
      unknowns: ['Water resistance is not permanent and may decrease as a result of normal wear.'],
      policyCitations: warrantyLinks.slice(0, 1),
    };
  }

  return {
    id,
    claimText,
    category: 'General',
    verdict: excerpts.length > 0 ? 'Supported' : 'Unknown',
    confidence: excerpts.length > 0 ? 0.85 : 0.55,
    reason:
      excerpts.length > 0
        ? 'The marketing claim aligns with extracted public page content, but no specialized rule matched.'
        : 'The claim was extracted from marketing copy, but no supporting spec or footnote was discovered.',
    evidence: buildEvidence(id, sourceUrl, [
      {
        field: 'headline_claims',
        extractedValue: claimText,
        sourceExcerpt: `Public product listing feature: "${claimText}"`,
        relevance: 'Stated manufacturer marketing claim.',
        type: 'badge',
      },
    ]),
    unknowns: ['Independent third-party verification was not found in the extracted page data.'],
    policyCitations: warrantyLinks.slice(0, 1),
  };
}

function unknownClaim(
  id: string,
  claimText: string,
  category: AnalyzedClaim['category'],
  sourceUrl: string,
  reason: string
): AnalyzedClaim {
  return {
    id,
    claimText,
    category,
    verdict: 'Unknown',
    confidence: 0.55,
    reason,
    evidence: buildEvidence(id, sourceUrl, [
      {
        field: 'headline_claims',
        extractedValue: claimText,
        sourceExcerpt: `Public product listing feature: "${claimText}"`,
        relevance: 'Marketing claim without matching extracted supporting evidence.',
        type: 'badge',
      },
    ]),
    unknowns: ['Collector output did not include a matching spec, policy link, or footnote excerpt.'],
    policyCitations: [],
  };
}

function buildEvidence(
  claimId: string,
  sourceUrl: string,
  entries: Array<{
    field: string;
    extractedValue: string;
    sourceExcerpt: string;
    relevance: string;
    type: ClaimEvidence['type'];
  } | null>
): ClaimEvidence[] {
  return entries
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .map((entry, index) => ({
      id: `ev-${claimId}-${index + 1}`,
      field: entry.field,
      extractedValue: entry.extractedValue,
      sourceExcerpt: entry.sourceExcerpt,
      sourceUrl,
      relevance: entry.relevance,
      type: entry.type,
    }));
}
