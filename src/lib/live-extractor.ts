import type { RawScraperOutput } from './brightdata';

/**
 * Intelligent Live Web Extractor
 * Automatically extracts structured product specifications, marketing claims,
 * footnotes, and warranty/return policies from any live e-commerce / brand product page.
 */
export async function extractLiveProductPage(url: string): Promise<RawScraperOutput> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`Live webpage returned HTTP status ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    return parseHtmlToProductOutput(html, url);
  } catch (err) {
    console.error('Failed to extract live product page:', err);
    throw err;
  }
}

export function parseHtmlToProductOutput(html: string, url: string): RawScraperOutput {
  const result: RawScraperOutput = {
    input: { url },
    scraped_at: new Date().toISOString(),
    headline_claims: [],
    key_features: [],
    icon_features: [],
    key_specs: [],
    evidence_excerpts: [],
    warranty_or_support_links: [],
    return_policy_links: [],
  };

  // 1. Extract JSON-LD Schemas if present
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const productObj =
        data['@type'] === 'Product'
          ? data
          : Array.isArray(data['@graph'])
          ? (data['@graph'] as Record<string, unknown>[]).find((item) => item['@type'] === 'Product')
          : null;

      if (productObj) {
        if (productObj.name) result.product_title = String(productObj.name);
        if (productObj.brand) {
          result.brand = typeof productObj.brand === 'object' && productObj.brand !== null ? String((productObj.brand as Record<string, unknown>).name) : String(productObj.brand);
        }
        if (productObj.image) {
          result.product_image = Array.isArray(productObj.image) ? String(productObj.image[0]) : String(productObj.image);
        }
        if (productObj.description) {
          result.headline_claims?.push(cleanText(String(productObj.description)));
        }
        if (productObj.offers) {
          const offer = (Array.isArray(productObj.offers) ? productObj.offers[0] : productObj.offers) as Record<string, unknown>;
          if (offer && offer.price) {
            result.current_price = {
              value: parseFloat(String(offer.price)),
              currency: String(offer.priceCurrency || 'USD'),
              symbol: offer.priceCurrency === 'INR' ? '₹' : '$',
            };
          }
        }
      }
    } catch {
      // Ignore JSON-LD parse errors
    }
  }

  // 2. OpenGraph & Meta Tags
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const twitterTitle = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

  if (!result.product_title) {
    result.product_title = cleanText(ogTitle || twitterTitle || titleTag || 'Product Title');
    // Remove trailing store suffix like " - OnePlus (India)" or " | Amazon"
    result.product_title = result.product_title.replace(/\s*[-|–]\s*(?:OnePlus|Amazon|Apple|Sony|Samsung|Official Store).*$/i, '').trim();
  }

  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const twitterImage = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (!result.product_image && (ogImage || twitterImage)) {
    result.product_image = ogImage || twitterImage;
  }

  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const descText = ogDesc || metaDesc;
  if (descText) {
    // Split description into distinct claims if separated by sentences or commas
    const cleanedDesc = cleanText(descText);
    const subClaims = cleanedDesc.split(/(?<=[.!?])\s+|;\s+/);
    for (const sc of subClaims) {
      if (sc.length > 10 && sc.length < 160 && !result.headline_claims?.includes(sc)) {
        result.headline_claims?.push(sc);
      }
    }
  }

  // 3. Embedded JSON payloads (e.g. OnePlus, Next.js __NEXT_DATA__, Shopify, Vue state)
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const content = scriptMatch[1];
    // Look for JSON keywords / claims string
    if (content.includes('keywords') || content.includes('skuName') || content.includes('imageLibrary')) {
      try {
        const parsed = JSON.parse(content.trim());
        if (parsed.keywords) {
          const splitKeywords = parsed.keywords.split(/\n|,/);
          for (const kw of splitKeywords) {
            const trimmed = kw.trim();
            if (trimmed.length > 15 && trimmed.length < 140 && !result.headline_claims?.includes(trimmed)) {
              result.headline_claims?.push(trimmed);
            }
          }
        }
        if (parsed.imageLibrary && Array.isArray(parsed.imageLibrary) && !result.product_image) {
          const firstImg = parsed.imageLibrary[0]?.images?.[0];
          if (firstImg) result.product_image = firstImg;
        }
        if (parsed.name && !result.product_name) {
          result.product_name = parsed.name;
        }
      } catch {
        // Ignore JSON payload parse errors
      }
    }
  }

  // 4. Extract Headings and Feature Lists from HTML
  const headingMatches = [...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)]
    .map((m) => cleanText(m[1]))
    .filter((t) => t.length > 8 && t.length < 120 && !/sign in|cart|menu|cookie|footer|header|subscribe/i.test(t));

  for (const h of headingMatches) {
    if (!result.headline_claims?.includes(h) && (result.headline_claims?.length || 0) < 6) {
      result.headline_claims?.push(h);
    }
  }

  const listMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => cleanText(m[1]))
    .filter((t) => t.length > 12 && t.length < 160 && !/sign in|cart|menu|cookie|policy|terms/i.test(t));

  for (const li of listMatches) {
    if (!result.key_features?.includes(li) && (result.key_features?.length || 0) < 8) {
      result.key_features?.push(li);
    }
  }

  // 5. Extract Price from Price patterns if not found via JSON-LD
  if (!result.current_price) {
    const pricePattern = /(?:₹|Rs\.?|\$|€|£)\s*([\d,]+(?:\.\d{2})?)/i;
    const priceMatch = html.match(pricePattern);
    if (priceMatch) {
      const num = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (num > 0) {
        result.current_price = {
          value: num,
          currency: priceMatch[0].includes('₹') || priceMatch[0].includes('Rs') ? 'INR' : 'USD',
          symbol: priceMatch[0].includes('₹') || priceMatch[0].includes('Rs') ? '₹' : '$',
        };
      }
    }
  }

  // 6. Extract Specifications from tables and DL tags
  const trMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const tr of trMatches) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => cleanText(m[1]));
    if (cells.length >= 2 && cells[0].length > 1 && cells[1].length > 1 && cells[0].length < 40) {
      result.key_specs?.push({
        label: cells[0],
        value: cells[1],
      });
    }
  }

  // If no table specs found, extract specs from common phrases in text
  if (!result.key_specs || result.key_specs.length === 0) {
    const specKeywords = [
      { label: 'Battery Life', regex: /(?:up to\s+)?(\d+\s*(?:hrs?|hours|days)\s*(?:playback|battery|runtime)?)/i },
      { label: 'Noise Cancellation', regex: /(?:up to\s+)?(\d+\s*dB\s*(?:Active Noise Cancellation|ANC|noise cancellation)?)/i },
      { label: 'Bluetooth Version', regex: /(Bluetooth\s*(?:v\s*)?\d+\.\d+)/i },
      { label: 'Driver Size', regex: /(\d+(?:\.\d+)?\s*mm\s*(?:driver|dynamic driver|bass)?)/i },
      { label: 'Fast Charging', regex: /(\d+\s*mins?\s*(?:charge|charging)\s*(?:for|=|provides)\s*\d+\s*(?:hrs?|hours))/i },
      { label: 'Water Resistance', regex: /(IP\d{2}\s*(?:water|dust)?\s*(?:resistance|rating)?)/i },
    ];

    for (const sk of specKeywords) {
      const match = html.match(sk.regex);
      if (match) {
        result.key_specs?.push({
          label: sk.label,
          value: cleanText(match[0]),
        });
      }
    }
  }

  // 7. Extract Evidence Footnotes and Disclaimers
  const footnoteMatches = [
    ...html.matchAll(/(?:<p[^>]*>|<div[^>]*>|<li[^>]*>)\s*(\d+\.|\*)\s*([^\n<]+(?:disclaimer|testing|condition|varies|actual|battery|hours|anc|support|cancel|lab|standard|codec)[^\n<]*)/gi),
  ];

  for (const fn of footnoteMatches) {
    const fullText = cleanText(fn[0]);
    if (fullText.length > 20 && !result.evidence_excerpts?.includes(fullText)) {
      result.evidence_excerpts?.push(fullText);
    }
  }

  // If no numbered footnotes found, search for disclaimer/notes paragraphs
  if (!result.evidence_excerpts || result.evidence_excerpts.length === 0) {
    const disclaimerParas = [...html.matchAll(/<(?:p|div|span)[^>]*class=["'][^"']*(?:disclaimer|note|footnote|fineprint)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div|span)>/gi)]
      .map((m) => cleanText(m[1]))
      .filter((t) => t.length > 25);

    for (const dp of disclaimerParas) {
      if (!result.evidence_excerpts?.includes(dp)) {
        result.evidence_excerpts?.push(dp);
      }
    }
  }

  // 8. Extract Warranty, Support & Return Policy Links
  const linkMatches = [...html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  for (const lm of linkMatches) {
    const href = lm[1];
    const text = cleanText(lm[2]);
    let absoluteHref = href;
    if (href.startsWith('/')) {
      try {
        const u = new URL(url);
        absoluteHref = `${u.protocol}//${u.host}${href}`;
      } catch {
        // Ignore URL parse errors
      }
    }

    if (/warranty|support|service|repair|manual/i.test(href) || /warranty|support|service|repair|manual/i.test(text)) {
      if (absoluteHref.startsWith('http') && !result.warranty_or_support_links?.includes(absoluteHref)) {
        result.warranty_or_support_links?.push(absoluteHref);
      }
    } else if (/return|refund|policy|exchange|terms/i.test(href) || /return|refund|exchange/i.test(text)) {
      if (absoluteHref.startsWith('http') && !result.return_policy_links?.includes(absoluteHref)) {
        result.return_policy_links?.push(absoluteHref);
      }
    }
  }

  // Ensure default icon features if empty
  if (!result.icon_features || result.icon_features.length === 0) {
    result.icon_features = [
      'Active Noise Cancellation',
      'High-Resolution Audio',
      'Long-Life Battery',
      'Fast Charging Support',
      'Multipoint Bluetooth',
      'Crystal Clear Calls',
    ];
  }

  return result;
}

function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
