import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zyra Blog Studio',
  description: 'Internal tool to research, write, and audit SEO + GEO/AEO blogs for thezyra.in.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
