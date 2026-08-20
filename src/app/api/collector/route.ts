import { NextResponse } from 'next/server';
import { loadArtifactData } from '@/lib/brightdata';
import { COLLECTOR_ID } from '@/lib/constants';


export async function GET() {
  const createArtifact = loadArtifactData('collector-create.json');
  const healArtifact = loadArtifactData('heal.json');
  const healApprovedArtifact = loadArtifactData('heal-approved.json');

  return NextResponse.json({
    collectorId: COLLECTOR_ID,
    collectorName: 'proofspider-electronics-claims',
    status: 'active',
    viewUrl: `https://brightdata.com/cp/scrapers/${COLLECTOR_ID}`,
    hasHealedRun: !!healArtifact,
    hasHealApproved: !!healApprovedArtifact,
    verifiedTargets: [
      {
        name: 'Sony WH-1000XM5',
        url: 'https://www.sony.com/electronics/headband-headphones/wh-1000xm5',
        artifact: 'artifacts/sony-wh1000xm5-run.json',
        healedArtifact: 'artifacts/sony-wh1000xm5-healed.json',
      },
      {
        name: 'Sony WH-1000XM4',
        url: 'https://www.sony.com/electronics/headband-headphones/wh-1000xm4',
        artifact: 'artifacts/sony-wh1000xm4-run.json',
      },
      {
        name: 'Sony WH-CH720N',
        url: 'https://www.sony.com/electronics/headband-headphones/wh-ch720n',
        artifact: 'artifacts/sony-whch720n-run.json',
      },
    ],
  });
}
