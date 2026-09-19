import { Newsreader, Inter_Tight } from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter-tight',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kunalgandvane.me'),
  title: {
    default: 'Kunal Gandvane',
    template: '%s — Kunal Gandvane',
  },
  description: 'Notes on curiosity, building things, and whatever else is on my mind.',
  openGraph: {
    type: 'website',
    siteName: 'Kunal Gandvane',
  },
};

export const viewport = {
  themeColor: '#03030a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${interTight.variable}`}>
      <body>{children}</body>
    </html>
  );
}
