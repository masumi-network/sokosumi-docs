import { source } from '@/lib/source';
import { getMarkdownContent } from '@/lib/get-markdown';
import { NextRequest, NextResponse } from 'next/server';

// CORS headers for LLM/agent access (no auth, no gating)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path') ?? '';
    const slug = path.split('/').filter(Boolean);

    // Default to documentation if no path
    if (slug.length === 0) {
      return await serveMarkdown(request, ['documentation']);
    }

    // Try to serve the requested page
    return await serveMarkdown(request, slug);
  } catch (error) {
    console.error('Error serving markdown:', error);
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Error: ${errorMessage}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...CORS_HEADERS },
    });
  }
}

function isBrowserRequest(request: NextRequest): boolean {
  const accept = request.headers.get('accept') ?? '';
  // Browsers typically send Accept: text/html; LLMs/APIs often send text/markdown or */*
  return accept.includes('text/html') && !accept.includes('text/markdown');
}

async function serveMarkdown(request: NextRequest, slug: string[]): Promise<NextResponse> {
  let page = source.getPage(slug);
  if (!page && slug.length > 0) {
    page = source.getPage([...slug, 'index']);
  }


  if (!page) {
    // Return markdown-formatted error instead of 404 to prevent Next.js fallback
    const errorContent = `# Page Not Found

The page \`/${slug.join('/')}\` was not found in the documentation.

## Available Pages

Visit \`/md-index.md\` to see a list of all available documentation pages.

## How to Access Documentation

Append \`.md\` to any valid documentation URL:
- \`/documentation.md\`
- \`/api-reference/agents.md\`
- \`/cli_docs.md\`
- \`/mcp.md\`
`;

    // For browser requests: return HTML error page
    if (isBrowserRequest(request)) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page Not Found - Sokosumi Docs</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; background: #fff; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; border-radius: 6px; white-space: pre-wrap; }
    a { color: #6F6AF8; }
    .error { color: #d00; }
    @media (prefers-color-scheme: dark) {
      body { color: #e5e5e5; background: #1a1a1a; }
      pre { background: #2a2a2a; }
      .error { color: #ff6666; }
    }
  </style>
</head>
<body>
  <div class="error">⚠ Page not found</div>
  <pre>${escapeHtml(errorContent)}</pre>
  <p><a href="/documentation">← Back to documentation</a></p>
</body>
</html>`;
      return new NextResponse(html, {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...CORS_HEADERS,
        },
      });
    }

    // For LLMs: return markdown error
    return new NextResponse(errorContent, {
      status: 404,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        ...CORS_HEADERS
      },
    });
  }

  let content: string;
  try {
    content = await getMarkdownContent(page);
  } catch (error) {
    console.error('Error getting markdown content:', error);
    // Fallback content if getMarkdownContent fails
    content = `# ${page.data.title || 'Documentation'}

URL: ${page.url}

${page.data.description || 'Error loading content'}

---

*Error: Unable to load markdown content in production environment.*`;
  }

  // For browser requests: return HTML so content is visible (avoids blank white screen)
  if (isBrowserRequest(request)) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.data.title)} - Sokosumi Docs</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; background: #fff; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; border-radius: 6px; white-space: pre-wrap; }
    a { color: #6F6AF8; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
    @media (prefers-color-scheme: dark) {
      body { color: #e5e5e5; background: #1a1a1a; }
      pre { background: #2a2a2a; }
      .meta { color: #999; }
    }
  </style>
</head>
<body>
  <div class="meta">Raw markdown · <a href="${page.url}">View as HTML</a></div>
  <pre>${escapeHtml(content)}</pre>
</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'X-Robots-Tag': 'all',
        ...CORS_HEADERS,
      },
    });
  }

  // For LLMs/APIs: return plain markdown
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
      'X-Robots-Tag': 'all',
      ...CORS_HEADERS,
    },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function HEAD(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path') ?? '';
    const slug = path.split('/').filter(Boolean);
    const effectiveSlug = slug.length === 0 ? ['documentation'] : slug;

    let page = source.getPage(effectiveSlug);
    if (!page && effectiveSlug.length > 0) {
      page = source.getPage([...effectiveSlug, 'index']);
    }
    if (!page) {
      return new NextResponse(null, {
        status: 404,
        headers: { ...CORS_HEADERS },
      });
    }
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'X-Robots-Tag': 'all',
        ...CORS_HEADERS,
      },
    });
  } catch {
    return new NextResponse(null, {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
