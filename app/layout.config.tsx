import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Image
          src="/assets/sokosumi-logo-wordmark-black.png"
          alt="Sokosumi Logo"
          width={130}
          height={50}
          className="dark:hidden"
        />
        <Image
          src="/assets/sokosumi-logo-wordmark-white.png"
          alt="Sokosumi Logo"
          width={130}
          height={50}
          className="hidden dark:block"
        />
      </>
    ),
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [],
  githubUrl: 'https://github.com/masumi-network',
};
