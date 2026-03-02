import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';
import stripMarkdown from 'strip-markdown';
import type { Page } from 'fumadocs-core/source';

export async function getLLMText(page: Page): Promise<string> {
  try {
    let rawContent = '';

    // Try to read from filesystem only if we have an absolute path
    if (page?.absolutePath) {
      try {
        const fs = await import('fs/promises').catch(() => null);
        if (fs && fs.readFile) {
          rawContent = await fs.readFile(page.absolutePath, 'utf-8');
        }
      } catch (fileError) {
        console.log('File read failed (expected in production):', fileError);
      }
    }

    // If we have content, process it
    if (rawContent && rawContent.length > 0) {
      try {
        const processor = remark()
          .use(remarkGfm)
          .use(remarkMdx)
          .use(stripMarkdown)
          .use(remarkStringify);

        const processed = await processor.process({
          value: rawContent,
        });

        return `# ${page?.data?.title || 'Page'}
URL: ${page?.url || '/'}

${page?.data?.description || ''}

${processed.value}`;
      } catch (processError) {
        console.error('Processing error:', processError);
      }
    }

    // Production fallback
    const title = page?.data?.title || 'Documentation';
    const url = page?.url || '/';
    const description = page?.data?.description || 'Content only available in development mode.';

    return `# ${title}
URL: ${url}

${description}`;

  } catch (error) {
    console.error('Critical error in getLLMText:', error);
    return '# Error\n\nUnable to load content.';
  }
}