'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { truncateAddress, getExplorerAddressUrl, cn } from '@/lib/utils';

interface WalletChipProps {
  address: string;
  chain?: string;
  label?: string | null;
  variant?: 'default' | 'highlighted' | 'blocked';
  showExplorer?: boolean;
  className?: string;
}

export function WalletChip({
  address,
  chain = 'base',
  label,
  variant = 'default',
  showExplorer = true,
  className,
}: WalletChipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const variantClasses = {
    default: 'bg-[#f3f4f6]',
    highlighted: 'bg-[#dbeafe]',
    blocked: 'bg-[#fee2e2]',
  };

  return (
    <div className={cn('inline-flex flex-col gap-0.5', className)}>
      {label && (
        <span className="text-[11px] text-gray-500 font-medium">{label}</span>
      )}
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[13px]',
        variantClasses[variant],
      )}>
        {truncateAddress(address)}
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Copy address"
        >
          {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
        </button>
        {showExplorer && (
          <a
            href={getExplorerAddressUrl(chain, address)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="View on explorer"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </span>
    </div>
  );
}
