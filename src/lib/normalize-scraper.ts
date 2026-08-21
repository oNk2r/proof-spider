import type { RawScraperOutput } from './brightdata';

/** Collapse duplicated scraper strings like "Save $151.99 Save $151.99". */
export function dedupeRepeatedText(text: string): string {
  const trimmed = text.trim();
  const half = trimmed.slice(0, Math.floor(trimmed.length / 2)).trim();
  const secondHalf = trimmed.slice(Math.floor(trimmed.length / 2)).trim();
  if (half.length > 0 && half === secondHalf) {
    return half;
  }
  return trimmed.replace(/(\$\d+(?:\.\d+)?)\s+\1/g, '$1');
}

/** Fix Scraper Studio price glitches such as 248.00248 -> 248. */
export function sanitizePriceValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value * 100) / 100;
  if (rounded >= 1 && rounded <= 100_000) {
    return rounded;
  }
  return value;
}

export function inferBrand(raw: RawScraperOutput, sourceUrl: string): string {
  if (raw.brand?.trim()) return raw.brand.trim();
  const host = sourceUrl.toLowerCase();
  if (host.includes('sony.com')) return 'Sony';
  if (host.includes('apple.com')) return 'Apple';
  if (host.includes('samsung.com')) return 'Samsung';
  if (host.includes('bose.com')) return 'Bose';
  const title = raw.product_title || raw.product_name || '';
  const match = title.match(/^([A-Za-z0-9]+)/);
  return match?.[1] || 'Unknown Brand';
}

export function normalizeRawScraperOutput(raw: RawScraperOutput): RawScraperOutput {
  const normalized: RawScraperOutput = { ...raw };

  if (typeof raw.current_price === 'object' && raw.current_price?.value != null) {
    normalized.current_price = {
      ...raw.current_price,
      value: sanitizePriceValue(Number(raw.current_price.value)),
    };
  } else if (typeof raw.current_price === 'number') {
    normalized.current_price = sanitizePriceValue(raw.current_price);
  }

  if (typeof raw.original_price === 'object' && raw.original_price?.value != null) {
    normalized.original_price = {
      ...raw.original_price,
      value: sanitizePriceValue(Number(raw.original_price.value)),
    };
  } else if (typeof raw.original_price === 'number') {
    normalized.original_price = sanitizePriceValue(raw.original_price);
  }

  if (raw.savings_amount) {
    normalized.savings_amount = dedupeRepeatedText(raw.savings_amount);
  }

  if (raw.model_number) {
    normalized.model_number = raw.model_number.replace(/^Model:\s*/i, '').trim();
  }

  return normalized;
}
