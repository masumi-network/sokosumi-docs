import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';
import { createOpenAPI, attachFile } from 'fumadocs-openapi/server';
import { icons } from 'lucide-react';
import { createElement } from 'react';

// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) {
      // You may set a default icon
      return undefined;
    }
    if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
    return undefined;
  },
});

// OpenAPI configuration for generated docs
export const openapi = createOpenAPI();
