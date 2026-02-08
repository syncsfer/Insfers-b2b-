import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/toast';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chain Payments - On-Chain USDC Payment Platform',
  description: 'Stripe-like platform for on-chain USDC payments with hosted checkout, refunds, invoices, and more.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
