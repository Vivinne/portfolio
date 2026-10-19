import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './reset.css';
import './site.css';

export const metadata: Metadata = { title: 'Vivinne Portfolio' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..125,300..700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&family=Noto+Sans+TC:wght@300;400;500&display=swap';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        {children}
        <noscript>This portfolio needs JavaScript. 本網站需要啟用 JavaScript。</noscript>
      </body>
    </html>
  );
}
