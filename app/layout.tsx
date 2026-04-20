import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from './session-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PizzaOS - Commande WhatsApp pour Pizzerias',
  description: 'Système de commande automatisé par WhatsApp avec dashboard cuisine temps réel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
