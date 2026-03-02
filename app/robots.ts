import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_DOCS_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://docs.sokosumi.com');
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'Claude-Web', 'anthropic-ai', 'Applebot-Extended', 'PerplexityBot', 'Diffbot'],
        allow: '/',
      },
    ],
    sitemap: [`${url}/sitemap.xml`],
    host: url,
    // Additional LLM-friendly resources
    additionalSitemaps: [
      `# LLM-Friendly Documentation Access`,
      `# All documentation pages can be accessed as markdown by appending .md to any URL`,
      `# Examples:`,
      `#   ${url}/documentation.md`,
      `#   ${url}/api-reference/agents.md`,
      `#`,
      `# Complete documentation in one file:`,
      `#   ${url}/llms.txt`,
      `#`,
      `# Markdown index of all pages:`,
      `#   ${url}/md-index.md`,
    ],
  } as MetadataRoute.Robots & { additionalSitemaps?: string[] };
}
