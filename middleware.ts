import { NextRequest, NextResponse } from 'next/server';

/**
 * LLM-friendly docs: Append .md or .markdown to any docs URL to get raw markdown.
 * e.g. /documentation.md, /api-reference/agents.md
 * No auth, no gating - enables AI agents to crawl docs.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Match .md or .markdown (checked in middleware to avoid matcher regex limitations)
  const mdMatch = pathname.match(/^(.+)\.(md|markdown)$/);
  if (!mdMatch) return NextResponse.next();

  const pathWithoutExtension = mdMatch[1];

  // Special case: /md-index.md → rewrite to /md-index (served by app/md-index/route.ts)
  if (pathWithoutExtension === '/md-index') {
    const url = request.nextUrl.clone();
    url.pathname = '/md-index';
    url.search = search;
    return NextResponse.rewrite(url);
  }

  // Remove leading slash and build slug for the route
  const slug = pathWithoutExtension.replace(/^\//, '') || 'documentation';

  // Rewrite to /mdx/[...slug] route (like masumi-docs does)
  const url = request.nextUrl.clone();
  url.pathname = `/mdx/${slug}`;
  url.search = search;

  return NextResponse.rewrite(url);
}

export const config = {
  // Match all routes except static files, api, etc. (md check done inside middleware)
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|mdx/|md-index(?:/|$)).*)',
  ],
};
