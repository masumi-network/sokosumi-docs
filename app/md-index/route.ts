import { source } from '@/lib/source';
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL =
  process.env.NEXT_PUBLIC_DOCS_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://docs.sokosumi.com');

// CORS headers for LLM/agent access
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function isBrowserRequest(request: NextRequest): boolean {
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html') && !accept.includes('text/markdown');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Markdown Index - Guide for LLMs/bots to discover all available markdown endpoints.
 * Accessible at: /md-index or /md-index.md
 */
export async function GET(request: NextRequest) {
  try {
    const pages = source.getPages();
    const baseUrl = BASE_URL.startsWith('http') ? BASE_URL : `https://${BASE_URL}`;

    const pagesBySection = new Map<string, typeof pages>();
    pages.forEach((page) => {
      const section = page.url.split('/')[1] || 'root';
      if (!pagesBySection.has(section)) {
        pagesBySection.set(section, []);
      }
      pagesBySection.get(section)!.push(page);
    });

    const sections: string[] = [
      '# Sokosumi Documentation - Markdown Index',
      '',
      '**Welcome to the Sokosumi Documentation Markdown Index!**',
      '',
      'This page provides a complete guide to all available documentation pages in markdown format.',
      'Each page can be accessed by appending `.md` to any documentation URL.',
      '',
      '## How to Use',
      '',
      '**URL Pattern:**',
      '```',
      `${baseUrl}/<path>.md`,
      '```',
      '',
      '**Examples:**',
      `- HTML: ${baseUrl}/documentation`,
      `- Markdown: ${baseUrl}/documentation.md`,
      '',
      `- HTML: ${baseUrl}/api-reference/agents`,
      `- Markdown: ${baseUrl}/api-reference/agents.md`,
      '',
      '## Available Documentation Pages',
      '',
      `Total pages: ${pages.length}`,
      '',
    ];

    Array.from(pagesBySection.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([section, sectionPages]) => {
        sections.push(`### ${section.charAt(0).toUpperCase() + section.slice(1)}`);
        sections.push('');

        sectionPages
          .sort((a, b) => a.url.localeCompare(b.url))
          .forEach((page) => {
            const title = page.data.title || page.url;
            const description = page.data.description ? ` - ${page.data.description}` : '';
            sections.push(`- **${title}**${description}`);
            sections.push(`  - URL: \`${baseUrl}${page.url}.md\``);
            sections.push(`  - Path: \`${page.url}\``);
            sections.push('');
          });

        sections.push('');
      });

    sections.push(
      '---',
      '',
      '## Additional Resources',
      '',
      '### Individual Page Access',
      '- Use the URLs listed above to access individual pages',
      '- Append `.md` to any documentation URL',
      '- All pages return clean markdown without HTML/JSX',
      '',
      '### API Access',
      '- All markdown endpoints support CORS',
      '- Content-Type: `text/markdown; charset=utf-8`',
      '- No authentication required',
      '',
      '## About Sokosumi',
      '',
      'Sokosumi is the marketplace for AI agents on the Masumi Network.',
      '',
      '**Official Links:**',
      '- Documentation: https://docs.sokosumi.com',
      '- App: https://app.sokosumi.com',
      '- Website: https://www.sokosumi.com',
      '',
      '---',
      '',
      `*Generated on: ${new Date().toISOString()}*`
    );

    const content = sections.join('\n');

    // For browser requests: return HTML so content is visible (avoids blank white screen)
    if (isBrowserRequest(request)) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Markdown Index - Sokosumi Docs</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; background: #fff; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; border-radius: 6px; white-space: pre-wrap; }
    a { color: #6F6AF8; }
    @media (prefers-color-scheme: dark) {
      body { color: #e5e5e5; background: #1a1a1a; }
      pre { background: #2a2a2a; }
    }
  </style>
</head>
<body>
  <h1>Sokosumi Documentation - Markdown Index</h1>
  <p><a href="/documentation">← Back to docs</a></p>
  <pre>${escapeHtml(content)}</pre>
</body>
</html>`;
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=604800',
          'X-Robots-Tag': 'all',
          ...CORS_HEADERS,
        },
      });
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=604800',
        'X-Robots-Tag': 'all',
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    console.error('Error generating markdown index:', error);
    return new NextResponse('Error generating markdown index', {
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
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=604800',
      'X-Robots-Tag': 'all',
      ...CORS_HEADERS,
    },
  });
}
