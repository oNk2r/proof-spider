import fs from 'fs';
import path from 'path';
import { COLLECTOR_ID } from './constants';
import { normalizeRawScraperOutput } from './normalize-scraper';

const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY;

export type ScraperDataSource = 'live' | 'artifact-healed' | 'artifact-verified';

export interface RawScraperOutput {
  product_title?: string;
  product_name?: string;
  brand?: string;
  model_number?: string;
  category?: string;
  current_price?: {
    value?: number;
    currency?: string;
    symbol?: string;
  } | number;
  original_price?: {
    value?: number;
    currency?: string;
    symbol?: string;
  } | number;
  price?: unknown;
  savings_amount?: string;
  product_image?: string;
  hero_image_url?: string;
  color?: string;
  key_features?: string[];
  icon_features?: string[];
  headline_claims?: string[];
  key_specs?: Array<{ label: string; value: string; unit?: string }>;
  warranty_or_support_links?: string[];
  return_policy_links?: string[];
  evidence_excerpts?: string[];
  evidence?: unknown[];
  input?: {
    url: string;
  };
  scraped_at?: string;
}

export interface ScraperRunResult {
  data: RawScraperOutput;
  isLive: boolean;
  collectorId: string;
  dataSource: ScraperDataSource;
}

const VERIFIED_ARTIFACTS: Array<{
  match: (url: string) => boolean;
  file: string;
  dataSource: ScraperDataSource;
}> = [
  {
    match: (url) => url.includes('wh-1000xm5'),
    file: 'sony-wh1000xm5-healed.json',
    dataSource: 'artifact-healed',
  },
  {
    match: (url) => url.includes('wh-1000xm4'),
    file: 'sony-wh1000xm4-run.json',
    dataSource: 'artifact-verified',
  },
  {
    match: (url) => url.includes('wh-ch720n') || url.includes('whch720n'),
    file: 'sony-whch720n-run.json',
    dataSource: 'artifact-verified',
  },
];

/**
 * Loads scraped artifact directly from disk for seeded fallback.
 */
export function loadArtifactData(filename: string): RawScraperOutput | null {
  try {
    const artifactPath = path.join(process.cwd(), 'artifacts', filename);
    if (!fs.existsSync(artifactPath)) {
      return null;
    }

    const fileContent = fs.readFileSync(artifactPath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    const record = Array.isArray(parsed)
      ? parsed[0]
      : parsed.preview_result?.[0] ?? parsed;

    if (!record || typeof record !== 'object') {
      return null;
    }

    return normalizeRawScraperOutput(record as RawScraperOutput);
  } catch (err) {
    console.error(`Failed to load artifact ${filename}:`, err);
  }
  return null;
}

function loadVerifiedArtifact(targetUrl: string): ScraperRunResult | null {
  const normalizedUrl = targetUrl.toLowerCase().trim();

  for (const artifact of VERIFIED_ARTIFACTS) {
    if (!artifact.match(normalizedUrl)) continue;
    const data = loadArtifactData(artifact.file);
    if (data) {
      return {
        data,
        isLive: false,
        collectorId: COLLECTOR_ID,
        dataSource: artifact.dataSource,
      };
    }
  }

  return null;
}

/**
 * Executes a live Bright Data scrape using Bright Data's Web Scraper API if API Key is configured,
 * or falls back to recorded verified artifacts for known target URLs.
 */
export async function runBrightDataScraper(targetUrl: string): Promise<ScraperRunResult> {
  const verified = loadVerifiedArtifact(targetUrl);
  if (verified) {
    return verified;
  }

  if (BRIGHTDATA_API_KEY && BRIGHTDATA_API_KEY.trim() !== '') {
    try {
      console.log(`Triggering live Bright Data Scraper Studio run on collector ${COLLECTOR_ID} for ${targetUrl}...`);

      const triggerResponse = await fetch(
        `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${COLLECTOR_ID}&include_errors=true`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${BRIGHTDATA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ url: targetUrl }]),
        }
      );

      if (!triggerResponse.ok) {
        throw new Error(`Bright Data API trigger error: ${triggerResponse.status} ${triggerResponse.statusText}`);
      }

      const triggerResult = await triggerResponse.json();
      const snapshotId = triggerResult.snapshot_id;

      if (!snapshotId) {
        throw new Error('No snapshot_id returned from Bright Data trigger');
      }

      const maxAttempts = 30;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((res) => setTimeout(res, 3000));
        const statusRes = await fetch(`https://api.brightdata.com/datasets/v3/progress/${snapshotId}`, {
          headers: { Authorization: `Bearer ${BRIGHTDATA_API_KEY}` },
        });

        if (!statusRes.ok) continue;

        const statusData = await statusRes.json();
        if (statusData.status !== 'ready') continue;

        const dataRes = await fetch(
          `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
          {
            headers: { Authorization: `Bearer ${BRIGHTDATA_API_KEY}` },
          }
        );

        if (!dataRes.ok) continue;

        const liveOutput = await dataRes.json();
        const record = Array.isArray(liveOutput) ? liveOutput[0] : liveOutput;
        return {
          data: normalizeRawScraperOutput(record as RawScraperOutput),
          isLive: true,
          collectorId: COLLECTOR_ID,
          dataSource: 'live',
        };
      }

      throw new Error('Bright Data scrape timed out after 90 seconds');
    } catch (apiErr) {
      console.error('Live Bright Data run failed:', apiErr);
      throw apiErr instanceof Error
        ? apiErr
        : new Error('Live Bright Data scrape failed');
    }
  }

  throw new Error(
    'URL not in verified demo targets. Use one of the seeded Sony URLs, or set BRIGHTDATA_API_KEY in .env.local for live Scraper Studio runs.'
  );
}
