import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saviour | Save Your Stuff',
  description: 'The ultimate vault to save, organize, and retrieve your valuable stuff securely.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="app-container">
          {children}
        </main>
      </body>
    </html>
  );
}
