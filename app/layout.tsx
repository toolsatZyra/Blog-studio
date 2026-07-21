import type { Metadata } from 'next';
import './globals.css';

// The app builds two things for thezyra.studio - blog posts and programmatic
// landing pages. The repo is named Programmatic-SEO; the app stays Zyra Studio.
export const metadata: Metadata = {
  title: 'Zyra Studio',
  description: 'Internal tool to research, write, audit and publish blogs and programmatic SEO landing pages for thezyra.studio.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
