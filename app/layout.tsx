import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { SiteFooter } from '@/components/site-footer';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sokosumi Documentation',
  description: 'Documentation for Sokosumi Network',
  icons: {
    icon: '/favicon.png',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <Script
          defer
          data-domain="docs.masumi.network"
          src="https://plausible.io/js/script.hash.outbound-links.pageview-props.tagged-events.js"
        />
        <Script id="plausible-init">
          {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <SiteFooter />
        {/* Fixed Kanji on the right */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50  pointer-events-none">
          <img 
            src="/assets/sokosumi-logo-kanji-black.png" 
            alt="Sokosumi Kanji" 
            className="h-[40px] w-auto dark:hidden"
          />
          <img 
            src="/assets/sokosumi-logo-kanji-white.png" 
            alt="Sokosumi Kanji" 
            className="h-[40px] w-auto hidden dark:block"
          />
        </div>
      </body>
    </html>
  );
}
