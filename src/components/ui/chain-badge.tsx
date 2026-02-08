'use client';

import { cn } from '@/lib/utils';
import type { Chain } from '@/types';

const chainConfig: Record<Chain, { label: string; bg: string; logo: string }> = {
  base:     { label: 'Base',     bg: 'bg-[#0052FF]', logo: 'B' },
  ethereum: { label: 'Ethereum', bg: 'bg-[#627EEA]', logo: 'E' },
  polygon:  { label: 'Polygon',  bg: 'bg-[#8247E5]', logo: 'P' },
  arbitrum: { label: 'Arbitrum', bg: 'bg-[#28A0F0]', logo: 'A' },
  optimism: { label: 'Optimism', bg: 'bg-[#FF0420]', logo: 'O' },
};

interface ChainBadgeProps {
  chain: Chain;
  className?: string;
  showLabel?: boolean;
}

export function ChainBadge({ chain, className, showLabel = true }: ChainBadgeProps) {
  const config = chainConfig[chain] || chainConfig.base;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 h-5 rounded-full text-white text-[11px] font-semibold whitespace-nowrap',
        config.bg,
        className,
      )}
    >
      <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">
        {config.logo}
      </span>
      {showLabel && config.label}
    </span>
  );
}
