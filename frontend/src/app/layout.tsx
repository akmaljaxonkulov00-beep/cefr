import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'MockCEFR - AI Mock Exam Platform',
  description: 'CEFR va IELTS imtihonlariga AI yordamida tayyorlaning. Speaking, Writing, Reading, Listening - hammasi AI bilan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="font-sans antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
