/**
 * Help centre content.
 *
 * Articles live here rather than in a CMS so search, category counts, and
 * related-article links all derive from one source and can't drift apart.
 */

export type HelpCategoryId =
  | 'getting-started'
  | 'payments'
  | 'refunds'
  | 'wallets'
  | 'invoicing'
  | 'currencies'
  | 'developers'
  | 'security';

export interface HelpCategory {
  id: HelpCategoryId;
  name: string;
  description: string;
  /** lucide icon name, resolved in the page. */
  icon: string;
  accent: string;
}

export interface HelpSection {
  heading?: string;
  /** Paragraphs. */
  body?: string[];
  /** Ordered steps. */
  steps?: string[];
  /** Bulleted points. */
  bullets?: string[];
  /** Callout shown as a tinted box. */
  note?: { tone: 'info' | 'warn'; text: string };
}

export interface HelpArticle {
  slug: string;
  title: string;
  summary: string;
  category: HelpCategoryId;
  /** Rough time to read, in minutes. */
  readMinutes: number;
  popular?: boolean;
  sections: HelpSection[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: 'getting-started', name: 'Getting started', description: 'Set up your account and take your first payment', icon: 'Rocket', accent: 'blue' },
  { id: 'payments', name: 'Payments', description: 'Checkout, payment links, holds, and settlement', icon: 'CreditCard', accent: 'violet' },
  { id: 'refunds', name: 'Refunds & claims', description: 'Issuing refunds and how claim links work', icon: 'RotateCcw', accent: 'amber' },
  { id: 'wallets', name: 'Wallets & payouts', description: 'Treasury, settlement wallets, and sending money', icon: 'Wallet', accent: 'emerald' },
  { id: 'invoicing', name: 'Invoicing & catalog', description: 'Invoices, catalog items, and receipts', icon: 'FileText', accent: 'rose' },
  { id: 'currencies', name: 'Currencies', description: 'USDC, EURC, JPYC, HTGC and how they behave', icon: 'Coins', accent: 'blue' },
  { id: 'developers', name: 'Developers', description: 'API keys, webhooks, and integrating', icon: 'Code2', accent: 'slate' },
  { id: 'security', name: 'Security & compliance', description: 'How funds are protected and who can access what', icon: 'ShieldCheck', accent: 'emerald' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'accept-your-first-payment',
    title: 'Accept your first payment',
    summary: 'Create a payment link, share it, and watch the funds settle to your wallet.',
    category: 'getting-started',
    readMinutes: 3,
    popular: true,
    sections: [
      {
        body: [
          'The fastest way to get paid is a payment link — no code, no integration. You create a link, send it to your customer, and they pay from any wallet.',
        ],
      },
      {
        heading: 'Create the link',
        steps: [
          'Go to Payment Links in the dashboard and choose Create payment link.',
          'Set an amount, or leave it open so the customer enters their own.',
          'Pick the currency and which networks you will accept.',
          'Save, then copy the link and send it however you like.',
        ],
      },
      {
        heading: 'What your customer sees',
        body: [
          'They open the link, connect a wallet, approve the stablecoin, and pay. On Base the whole thing usually finishes in a couple of seconds.',
          'If they enter an email at checkout, they get a receipt automatically once the payment confirms.',
        ],
      },
      {
        note: {
          tone: 'info',
          text: 'Funds settle directly to the settlement wallet you configured — they never sit in an account we control.',
        },
      },
    ],
  },
  {
    slug: 'how-claim-links-work',
    title: 'How refund claim links work',
    summary: 'Why claimable refunds exist, what the customer sees, and what happens if nobody claims.',
    category: 'refunds',
    readMinutes: 4,
    popular: true,
    sections: [
      {
        body: [
          'A direct refund pushes funds back to the address that paid. That works when the customer still controls that wallet — but often they do not, especially if they paid from an exchange.',
          'A claim link solves this. Instead of pushing funds, you create a link that lets the customer pull the refund to any address they control.',
        ],
      },
      {
        heading: 'The lifecycle',
        steps: [
          'You issue a claimable refund. The funds are set aside and a link is generated.',
          'We email the link to the customer if we have their address on file. You can also copy it and send it yourself.',
          'The customer opens the link, connects a wallet, and chooses where to receive the money.',
          'They claim. The transfer settles on-chain and the refund is marked completed.',
        ],
      },
      {
        heading: 'If nobody claims',
        body: [
          'Claim links expire after 24 hours by default. When a link expires unclaimed, the funds return to your treasury automatically — nothing is stranded.',
          'You can also revoke a link before it expires from the Manage panel on the refund, which returns the funds immediately and disables the link.',
        ],
      },
      {
        note: {
          tone: 'warn',
          text: 'Anyone holding a claim link can claim the refund to any address. Treat it like a bearer token and share it only with the customer.',
        },
      },
      {
        heading: 'Tracking a claim',
        body: [
          'Open Refunds and choose Manage on any claimable refund. You will see the time remaining, whether the link was delivered, how many reminders went out, and a full timeline of every step.',
        ],
      },
    ],
  },
  {
    slug: 'understanding-multi-currency',
    title: 'Working with multiple currencies',
    summary: 'How USDC, EURC, JPYC, and HTGC behave, and why some totals show a ≈ sign.',
    category: 'currencies',
    readMinutes: 4,
    popular: true,
    sections: [
      {
        body: [
          'Each currency stays itself, end to end. If a customer pays in euros you hold euros, and we never convert without you asking.',
        ],
      },
      {
        heading: 'What each one is',
        bullets: [
          'USDC — digital dollar, settles on all five networks.',
          'EURC — digital euro, settles on Base and Ethereum.',
          'JPYC — digital yen, settles on Ethereum and Polygon. Written without decimals, as yen normally is.',
          'HTGC — digital gourde, settles on Base and Polygon.',
        ],
      },
      {
        heading: 'Networks are per-currency',
        body: [
          'Not every coin exists on every chain. When you pick a currency in Send Money, the network list narrows to the ones that coin actually settles on — so you cannot accidentally send JPYC to a chain that has none.',
        ],
      },
      {
        heading: 'Why some numbers show ≈',
        body: [
          'Individual balances and transactions are always exact, in their own currency. But a single combined figure — total treasury value, or volume across every currency — has to convert somewhere.',
          'Those combined figures are approximate US-dollar equivalents and are marked with ≈. Never reconcile your books against them; use the per-currency numbers.',
        ],
      },
    ],
  },
  {
    slug: 'settlement-wallets',
    title: 'Setting up settlement wallets',
    summary: 'Where your money lands, how to add wallets per network, and what auto-settle does.',
    category: 'wallets',
    readMinutes: 3,
    popular: true,
    sections: [
      {
        body: [
          'A settlement wallet is where payments on a given network land. You control the keys; we only ever write to the address you set.',
        ],
      },
      {
        heading: 'Adding a wallet',
        steps: [
          'Open Wallets and choose Add Wallet.',
          'Give it a label, paste the address, and pick the network.',
          'Tick "Use as settlement wallet" to make it the destination for that network.',
        ],
      },
      {
        note: {
          tone: 'warn',
          text: 'Use a wallet you control, not an exchange deposit address. Exchange addresses often reject unexpected transfers, and funds sent there can be difficult or impossible to recover.',
        },
      },
      {
        heading: 'Auto-settle',
        body: [
          'With auto-settle on, funds move to your primary settlement wallet as they arrive. With it off, they accumulate on the receiving network until you withdraw manually.',
          'Auto-settle is per-network, so you can leave it on for cheap chains and off for Ethereum where gas makes frequent sweeps expensive.',
        ],
      },
    ],
  },
  {
    slug: 'build-your-catalog',
    title: 'Building your catalog',
    summary: 'Save your products and services once, then invoice from them.',
    category: 'invoicing',
    readMinutes: 3,
    sections: [
      {
        body: [
          'The catalog holds the things you sell — name, description, SKU, price, and the unit it is sold by. Once an item is saved you can pull it into an invoice instead of retyping the price every time.',
        ],
      },
      {
        heading: 'Adding items',
        steps: [
          'Open Catalog and choose Add item.',
          'Fill in the name, description, and SKU.',
          'Choose whether it is a product or a service, and assign a category.',
          'Set the price, currency, and unit — for example "per month" or "per hour".',
        ],
      },
      {
        heading: 'Using items on an invoice',
        body: [
          'In Create Invoice, choose Add from catalog and search by name or SKU. Add as many items as you need and adjust quantities; the total works itself out.',
        ],
      },
      {
        note: {
          tone: 'info',
          text: 'An invoice bills a single currency. The first item you add sets it, and any item priced differently is flagged rather than converted — split those onto a separate invoice.',
        },
      },
      {
        heading: 'Tracking performance',
        body: [
          'The Performance tab ranks items by lifetime revenue and shows units sold, a 30-day trend, and when each was last sold. Use it to spot what is worth promoting and what has gone stale.',
        ],
      },
    ],
  },
  {
    slug: 'email-receipts',
    title: 'Sending email receipts',
    summary: 'Automatic receipts, resending them, and what to do about bounces.',
    category: 'invoicing',
    readMinutes: 2,
    sections: [
      {
        heading: 'Automatic receipts',
        body: [
          'With auto-send enabled in Settings → Receipts, every confirmed payment triggers a receipt to the email captured at checkout. If no email was captured, nothing is sent.',
        ],
      },
      {
        heading: 'Customising them',
        bullets: [
          'From name and reply-to address.',
          'Subject line, using {{merchant}}, {{amount}}, and {{receipt_id}}.',
          'A footer message, an on-chain transaction link, and an optional PDF attachment.',
        ],
      },
      {
        heading: 'Resending and failures',
        body: [
          'Open any succeeded payment to see the receipt panel: whether it was sent, delivered, or opened, how many attempts were made, and the reason if it bounced.',
          'A bounce usually means a typo in the address. Use Resend and correct the email there.',
        ],
      },
    ],
  },
  {
    slug: 'ai-agent-permissions',
    title: 'What AI agents can and cannot do',
    summary: 'Capabilities, spending limits, and how agent activity is tracked.',
    category: 'getting-started',
    readMinutes: 3,
    sections: [
      {
        body: [
          'Agents act on your behalf — creating invoices, sending scheduled payments, generating reports. Each one has its own wallet, so its spending is ring-fenced from your treasury.',
        ],
      },
      {
        heading: 'Limiting what an agent can do',
        bullets: [
          'Capabilities decide which actions are available at all — an agent without send_payment simply cannot move money.',
          'A per-transaction limit caps any single action.',
          'A daily limit caps the total across a day.',
          'The agent wallet balance is a hard ceiling regardless of limits.',
        ],
      },
      {
        heading: 'Seeing what an agent did',
        body: [
          'Every action is logged in the agent activity feed with its type, amount, and transaction hash. Payments and invoices also record whether they came from an agent or a human wallet, visible as a badge in the payments and invoices lists.',
        ],
      },
      {
        note: {
          tone: 'info',
          text: 'Pausing an agent stops it acting immediately without deleting its history or emptying its wallet.',
        },
      },
    ],
  },
  {
    slug: 'why-a-payment-failed',
    title: 'Why a payment failed',
    summary: 'The common reasons a transaction does not go through, and what to tell the customer.',
    category: 'payments',
    readMinutes: 3,
    popular: true,
    sections: [
      {
        body: [
          'A failed payment means the transaction was rejected on-chain. No funds moved, and the customer has not been charged.',
        ],
      },
      {
        heading: 'Common causes',
        bullets: [
          'Insufficient stablecoin balance for the amount plus fees.',
          'Not enough native token (ETH, MATIC) to pay gas.',
          'The customer rejected the transaction in their wallet.',
          'Wrong network selected — the coin does not exist on that chain.',
          'The approval expired before the payment was submitted.',
        ],
      },
      {
        heading: 'What to do',
        body: [
          'Open the payment and read the status explainer, which names the specific reason where we have it. If the transaction reached the chain, the explorer link shows the revert reason.',
          'In most cases the fix is for the customer to retry with enough balance or gas. Send them the payment link again — the original is still valid unless it expired.',
        ],
      },
    ],
  },
  {
    slug: 'api-keys-and-webhooks',
    title: 'API keys and webhooks',
    summary: 'Authenticating requests and receiving events in your backend.',
    category: 'developers',
    readMinutes: 4,
    sections: [
      {
        heading: 'Keys',
        body: [
          'Live and test keys are separate. Test keys never touch real funds, so build against them first.',
        ],
        bullets: [
          'Keep secret keys server-side only — never ship them to a browser or mobile app.',
          'Rotate a key immediately if it may have leaked; the old one stops working at once.',
        ],
      },
      {
        heading: 'Webhooks',
        body: [
          'Register an endpoint under Developers and choose which events to receive. We sign every delivery, so verify the signature before trusting the payload.',
          'Respond with a 2xx quickly and do slow work afterwards. We retry failures with backoff, and repeated failures surface in your Action Center.',
        ],
      },
      {
        note: {
          tone: 'warn',
          text: 'Treat webhooks as at-least-once. The same event can arrive twice, so make your handler idempotent by keying on the event id.',
        },
      },
    ],
  },
  {
    slug: 'holds-and-captures',
    title: 'Placing holds and capturing later',
    summary: 'Reserve funds now, take them when you ship.',
    category: 'payments',
    readMinutes: 3,
    sections: [
      {
        body: [
          'A hold reserves a customer’s funds without moving them. Use it when the final amount is not known yet, or when you only want to charge once you have delivered.',
        ],
      },
      {
        heading: 'How it works',
        steps: [
          'Create a hold for the maximum you might charge.',
          'When you are ready, capture the full amount or any part of it.',
          'Release anything you do not capture, or let the hold expire.',
        ],
      },
      {
        heading: 'Expiry',
        body: [
          'Holds expire automatically. An expiring hold appears in your Action Center a day out, so you can capture or release before it lapses. Once expired, the reservation is gone and you would need a new payment.',
        ],
      },
    ],
  },
  {
    slug: 'who-can-access-what',
    title: 'Team roles and access',
    summary: 'What Owner, Admin, and Viewer can each do.',
    category: 'security',
    readMinutes: 2,
    sections: [
      {
        heading: 'Roles',
        bullets: [
          'Owner — full access including billing, team management, and wallet configuration. Cannot be removed.',
          'Admin — day-to-day operations: payments, refunds, invoices, payouts. Cannot change settlement wallets or remove the owner.',
          'Viewer — read-only. Useful for accountants and support staff who need visibility without the ability to move money.',
        ],
      },
      {
        heading: 'Protecting the account',
        body: [
          'Enable two-factor authentication for everyone with Admin or Owner access. Review the team list periodically and remove anyone who has left.',
        ],
      },
    ],
  },
  {
    slug: 'action-center',
    title: 'Using the Action Center',
    summary: 'One queue for everything that needs your attention.',
    category: 'getting-started',
    readMinutes: 2,
    sections: [
      {
        body: [
          'The Action Center collects everything across the platform that needs a decision — failed payments, overdue invoices, expiring holds and claim links, flagged wallets, webhook failures, and incomplete onboarding.',
        ],
      },
      {
        heading: 'Working the queue',
        bullets: [
          'Items are ranked by priority, with critical first.',
          'Filter by category when you want to batch similar work.',
          'Each item links straight to the record it concerns.',
        ],
      },
      {
        note: {
          tone: 'info',
          text: 'Items disappear from the queue once the underlying issue is resolved — you do not need to tick anything off manually.',
        },
      },
    ],
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const HELP_FAQS: FaqItem[] = [
  {
    question: 'How quickly do payments settle?',
    answer:
      'It depends on the network. Base, Polygon, Arbitrum, and Optimism typically confirm in a few seconds. Ethereum takes around fifteen. Once confirmed, the funds are in your settlement wallet — there is no multi-day payout delay.',
  },
  {
    question: 'Do you ever hold my money?',
    answer:
      'No. Payments settle directly from the customer’s wallet to yours. We are non-custodial, so there is no balance sitting with us that could be frozen or lost.',
  },
  {
    question: 'What happens if a customer sends the wrong amount?',
    answer:
      'Underpayments stay pending and are visible on the payment, so you can ask the customer to top up or refund what arrived. Overpayments confirm at the amount sent — issue a refund for the difference.',
  },
  {
    question: 'Can I accept payments in one currency and pay out in another?',
    answer:
      'Not automatically. Each currency settles as itself, and we never convert without you asking. If you need to move between currencies, use the Bridge, which makes the conversion explicit.',
  },
  {
    question: 'What are the fees?',
    answer:
      'We charge a flat 0.1% platform fee on payments. The rest is network gas, which varies by chain — cents on Base and Polygon, more on Ethereum. There are no monthly minimums or setup fees.',
  },
  {
    question: 'Is there a test mode?',
    answer:
      'Yes. Switch to Test in the sidebar to use testnet funds and test API keys. Nothing in test mode touches real money, and test data is kept separate from live data.',
  },
  {
    question: 'A refund claim link expired. What now?',
    answer:
      'The funds returned to your treasury automatically when the link expired — nothing is lost. Issue a new refund to generate a fresh link.',
  },
  {
    question: 'How do I export my data?',
    answer:
      'Every list view exports to CSV from the row menu or the Reporting page. For programmatic access, the API returns the same records with pagination.',
  },
];

// --- Lookup helpers ---

export function getArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find(a => a.slug === slug);
}

export function articlesInCategory(id: HelpCategoryId): HelpArticle[] {
  return HELP_ARTICLES.filter(a => a.category === id);
}

export function getCategory(id: HelpCategoryId): HelpCategory | undefined {
  return HELP_CATEGORIES.find(c => c.id === id);
}

/** Other articles in the same category, for the "related" rail. */
export function relatedArticles(article: HelpArticle, limit = 3): HelpArticle[] {
  return HELP_ARTICLES
    .filter(a => a.category === article.category && a.slug !== article.slug)
    .slice(0, limit);
}

/** Naive relevance search across title, summary, and body text. */
export function searchArticles(query: string): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const haystack = (a: HelpArticle) =>
    [
      a.title,
      a.summary,
      ...a.sections.flatMap(s => [
        s.heading ?? '',
        ...(s.body ?? []),
        ...(s.steps ?? []),
        ...(s.bullets ?? []),
        s.note?.text ?? '',
      ]),
    ]
      .join(' ')
      .toLowerCase();

  return HELP_ARTICLES
    .map(a => {
      const title = a.title.toLowerCase();
      // Title hits rank above body hits.
      const score = title.includes(q) ? 3 : a.summary.toLowerCase().includes(q) ? 2 : haystack(a).includes(q) ? 1 : 0;
      return { a, score };
    })
    .filter(r => r.score > 0)
    .sort((x, y) => y.score - x.score)
    .map(r => r.a);
}
