import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';
import type { Page } from 'fumadocs-core/source';
import type { Root, RootContent } from 'mdast';

/**
 * Recursively extract text content from mdast nodes (for MDX elements)
 */
function extractText(node: RootContent): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }
  if ('children' in node) {
    return (node.children as RootContent[]).map(extractText).join('');
  }
  return '';
}

/**
 * Remark plugin to convert MDX JSX elements to paragraphs (for LLM-friendly markdown)
 */
function remarkMdxToMarkdown() {
  return (tree: Root) => {
    const visit = (nodes: RootContent[]): RootContent[] => {
      return nodes.flatMap((node) => {
        const mdxTypes = ['mdxJsxFlowElement', 'mdxJsxTextElement'];
        if (mdxTypes.includes(node.type)) {
          const text = extractText(node);
          if (text.trim()) {
            return {
              type: 'paragraph',
              children: [{ type: 'text', value: text }],
            } as RootContent;
          }
          return [];
        }
        if ('children' in node) {
          return [
            {
              ...node,
              children: visit(node.children as RootContent[]),
            } as RootContent,
          ];
        }
        return [node];
      });
    };
    tree.children = visit(tree.children);
  };
}

export async function getMarkdownContent(page: Page): Promise<string> {
  try {
    let rawContent = '';

    // Try to read from filesystem only if we have an absolute path
    if (page?.absolutePath) {
      try {
        // Dynamic import with error handling
        const fs = await import('fs/promises').catch(() => null);
        if (fs && fs.readFile) {
          rawContent = await fs.readFile(page.absolutePath, 'utf-8');
        }
      } catch (fileError) {
        // Silently fail - expected in production
        console.log('File read failed (expected in production):', fileError);
      }
    }

    // If we have content, process it
    if (rawContent && rawContent.length > 0) {
      try {
        const processor = remark()
          .use(remarkGfm)
          .use(remarkMdx)
          .use(remarkMdxToMarkdown)
          .use(remarkStringify);

        const processed = await processor.process({
          value: rawContent,
        });

        return `# ${page.data?.title || 'Page'}

URL: ${page?.url || '/'}

${page.data?.description ? `${page.data.description}\n\n` : ''}${processed.value}`;
      } catch (processError) {
        console.error('Processing error:', processError);
        // Fall through to fallback
      }
    }

    // Production fallback - return basic markdown with title and description
    // This should NEVER fail
    const title = page?.data?.title || 'Documentation';
    const url = page?.url || '/';
    const description = page?.data?.description || 'Content preview not available in production environment.';

    return `# ${title}

URL: ${url}

${description}

---

*Note: Full content is only available in development mode. Production deployments show metadata only.*`;

  } catch (error) {
    // Ultimate fallback - this absolutely cannot fail
    console.error('Critical error in getMarkdownContent:', error);
    return '# Error\n\nUnable to load content. Please try again later.';
  }
}
