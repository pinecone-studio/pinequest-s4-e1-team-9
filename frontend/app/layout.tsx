import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Research Docs',
  description: 'Company documents',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
