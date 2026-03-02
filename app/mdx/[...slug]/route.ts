import { source } from '@/lib/source';
import { getMarkdownContent } from '@/lib/get-markdown';
import { NextRequest, NextResponse } from 'next/server';

// CORS headers for LLM access
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;

    // Try to get the page (documentation is at slug ['documentation'], not [])
    let page = source.getPage(slug);

    // If not found, try with 'index' appended
    if (!page && slug.length > 0) {
      page = source.getPage([...slug, 'index']);
    }

    if (!page) {
      return new NextResponse('Page not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          ...CORS_HEADERS,
        },
      });
    }

    // Get markdown content (with all the error handling we added)
    const content = await getMarkdownContent(page);

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
        'X-Robots-Tag': 'all',
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    console.error('Error generating MDX content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Error: ${errorMessage}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...CORS_HEADERS,
      },
    });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// HEAD request for availability checks
export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;

    let page = source.getPage(slug);
    if (!page && slug.length > 0) {
      page = source.getPage([...slug, 'index']);
    }

    if (!page) {
      return new NextResponse(null, {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
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