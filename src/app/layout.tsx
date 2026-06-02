import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CryptoProvider } from '@/contexts/CryptoContext';
import Navbar from '@/components/navbar/Navbar';

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
        <AuthProvider>
          <CryptoProvider>
            <div className="min-h-screen">
              <Navbar />
              {children}
            </div>
          </CryptoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
