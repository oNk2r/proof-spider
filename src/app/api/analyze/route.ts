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
    
    // 1. Run or load Bright Data collector output
    const { data: rawOutput, isLive, collectorId } = await runBrightDataScraper(url);

    // 2. Normalize and classify claims using conservative verdict engine
    const analysis = normalizeAndAnalyze(rawOutput, url);
    analysis.collectorId = collectorId || COLLECTOR_ID;

    // 3. Persist normalized result in artifacts/ as required by Step P
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
      collectorId: collectorId || COLLECTOR_ID,
    });
  } catch (error: any) {
    console.error('Analysis error in /api/analyze:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze product claims',
      },
      { status: 500 }
    );
  }
}
