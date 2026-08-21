import { NextRequest, NextResponse } from 'next/server';
import { runBrightDataScraper } from '@/lib/brightdata';
import { COLLECTOR_ID } from '@/lib/constants';
import { normalizeAndAnalyze } from '@/lib/analyzer';

import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body.url || 'https://www.sony.com/electronics/headband-headphones/wh-1000xm5';

    console.log(`ProofSpider analyzing URL: ${url}`);

    const { data: rawOutput, isLive, collectorId, dataSource } = await runBrightDataScraper(url);
    const analysis = normalizeAndAnalyze(rawOutput, url, { dataSource });
    analysis.collectorId = collectorId || COLLECTOR_ID;

    try {
      const artifactsDir = path.join(process.cwd(), 'artifacts');
      if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
      }
      const normalizedPath = path.join(artifactsDir, 'normalized-proofspider-result.json');
      fs.writeFileSync(normalizedPath, JSON.stringify(analysis, null, 2), 'utf-8');
    } catch (saveErr) {
      console.warn('Could not persist normalized-proofspider-result.json:', saveErr);
    }

    return NextResponse.json({
      success: true,
      analysis,
      isLive,
      dataSource,
      collectorId: collectorId || COLLECTOR_ID,
    });
  } catch (error: unknown) {
    console.error('Analysis error in /api/analyze:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze product claims';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
