'use client';

import { type ReactNode, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi-config';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------
// Top-level client providers for the Chain Payments Platform.
//
// - WagmiProvider: supplies the wagmi config (chains, transports, connectors)
//   to every descendant that calls wagmi hooks.
// - QueryClientProvider: powers wagmi v2's data-fetching layer and can also
//   be used directly for server-state management with @tanstack/react-query.
//
// Usage in app/layout.tsx:
//   import { Providers } from '@/components/providers';
//   ...
//   <body>
//     <Providers>{children}</Providers>
//   </body>
// ---------------------------------------------------------------------------

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // useState ensures the QueryClient is created once per component lifecycle
  // and is NOT shared between server-side requests in Next.js App Router.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR/RSC we typically don't want queries to refetch
            // immediately on mount because data was pre-fetched on the server.
            staleTime: 60 * 1000, // 1 minute
            // Retry once on failure before surfacing the error to the UI.
            retry: 1,
            // Don't refetch every time the window regains focus -- on-chain
            // data doesn't change that rapidly for dashboard pages.
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
