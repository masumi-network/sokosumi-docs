import { NextResponse } from 'next/server';
import { source } from '@/lib/source';
import { getMarkdownContent } from '@/lib/get-markdown';

const BASE_URL =
  process.env.NEXT_PUBLIC_DOCS_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://docs.sokosumi.com');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

let cachedContent: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

async function generateLLMsTxtContent(): Promise<string> {
  const pages = source.getPages();
  const baseUrl = BASE_URL.startsWith('http') ? BASE_URL : `https://${BASE_URL}`;
  const MAX_CONCURRENT = 10;

  const scanned: string[] = [];
  for (let i = 0; i < pages.length; i += MAX_CONCURRENT) {
    const batch = pages.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(batch.map(getMarkdownContent));
    scanned.push(...batchResults);
  }

  return [
    '# Sokosumi Documentation - Complete Version',
    '',
    'This file contains the complete Sokosumi documentation for LLM consumption.',
    `Generated on: ${new Date().toISOString()}`,
    'Website: ' + baseUrl,
    '',
    '## About Sokosumi',
    'Sokosumi is the marketplace for AI agents on the Masumi Network.',
    '',
    '## How to Access Individual Pages as Markdown',
    '',
    '**This documentation is fully LLM-enabled!** Each page is available in markdown format.',
    '',
    '### URL Pattern:',
    '```',
    `${baseUrl}/<any-path>.md`,
    '```',
    '',
    '### Examples:',
    `- ${baseUrl}/documentation.md`,
    `- ${baseUrl}/api-reference/agents.md`,
    `- ${baseUrl}/cli_docs.md`,
    '',
    '### Markdown Index:',
    'For a complete list of all available markdown pages, visit:',
    `- ${baseUrl}/md-index`,
    `- ${baseUrl}/md-index.md`,
    '',
    '### Benefits:',
    '- Clean markdown without HTML/JSX',
    '- CORS-enabled for API access',
    '- No authentication required',
    '- Bot-friendly',
    '',
    '---',
    '',
    '## Complete Documentation Below',
    '',
    ...scanned,
  ].join('\n');
}

/**
 * Serves llms.txt for LLM discovery (e.g. crawlers, agents).
 * Uses in-memory caching to avoid regenerating on every request.
 */
export async function GET() {
  try {
    const now = Date.now();
    if (cachedContent && now - cacheTimestamp < CACHE_TTL) {
      return new NextResponse(cachedContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
          ...CORS_HEADERS,
        },
      });
    }

    const content = await generateLLMsTxtContent();
    cachedContent = content;
    cacheTimestamp = now;

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    return new NextResponse('Error generating llms.txt', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...CORS_HEADERS,
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
      ...CORS_HEADERS,
    },
  });
}
