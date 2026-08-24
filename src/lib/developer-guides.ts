/**
 * Long-form docs for each product in `developer-content.ts`.
 *
 * Kept separate from the product catalogue so the landing page and navigation
 * stay cheap to render — they only need names and taglines, not every guide.
 */

import type { Language } from './developer-content';

export interface GuideSection {
  heading?: string;
  body?: string[];
  steps?: string[];
  bullets?: string[];
  note?: { tone: 'info' | 'warn' | 'success'; text: string };
  code?: { language: Language; label?: string; source: string };
  /** Endpoint ids from API_ENDPOINTS to render inline. */
  endpoints?: string[];
  table?: { headers: string[]; rows: string[][] };
}

export interface DevGuide {
  slug: string;
  readMinutes: number;
  /** Standfirst under the title. */
  intro: string;
  sections: GuideSection[];
  /** Product slugs to read next. */
  next?: string[];
}

export const DEV_GUIDES: DevGuide[] = [
  // -------------------------------------------------------------- Payments
  {
    slug: 'payment-intents',
    readMinutes: 6,
    intro:
      'A payment intent is the object that tracks one amount from the moment you ask for it to the moment it settles on-chain. Everything else in Payments — Checkout, links, invoices — creates one of these underneath.',
    sections: [
      {
        heading: 'The lifecycle',
        body: [
          'A payment intent moves through a small number of states, and it only ever moves forward. You will spend most of your integration reacting to two of them.',
        ],
        table: {
          headers: ['Status', 'What it means', 'What to do'],
          rows: [
            ['awaiting_payment', 'Created, nothing on-chain yet.', 'Show the customer a way to pay.'],
            ['pending', 'Broadcast, confirming.', 'Show progress. Do not fulfil yet.'],
            ['succeeded', 'Reached the required confirmations.', 'Fulfil the order.'],
            ['failed', 'Reverted or never confirmed.', 'Let the customer retry. Nothing was charged.'],
            ['expired', 'Nobody paid before the window closed.', 'Nothing to do.'],
          ],
        },
      },
      {
        heading: 'Amounts are in minor units',
        body: [
          'Every amount in the API is an integer in the currency’s smallest unit. For USDC, EURC, and HTGC that is hundredths — 5000 is 50.00. Yen has no subunit in practice, so JPYC amounts are whole yen: 5000 is ¥5,000.',
          'This is the single most common integration mistake. If you divide everything by 100, JPYC totals come out a hundred times too small.',
        ],
        note: {
          tone: 'warn',
          text: 'Never assume /100. Read the currency’s minor unit and divide by that.',
        },
      },
      {
        heading: 'Create a payment',
        endpoints: ['create-payment'],
      },
      {
        heading: 'Confirmations',
        body: [
          'A transaction appearing on-chain is not the same as it being final. We wait for a chain-specific number of confirmations before marking a payment succeeded, and report progress as it goes.',
          'The thresholds differ because the chains differ — a reorg on Ethereum is far more expensive to survive than one on an L2.',
        ],
        table: {
          headers: ['Network', 'Confirmations', 'Typical wall-clock'],
          rows: [
            ['Base', '12', '~24 seconds'],
            ['Optimism', '12', '~24 seconds'],
            ['Arbitrum', '12', '~3 seconds'],
            ['Polygon', '30', '~60 seconds'],
            ['Ethereum', '12', '~2.5 minutes'],
          ],
        },
      },
      {
        heading: 'Fulfil on the webhook, not the redirect',
        body: [
          'The customer’s browser can close, lose signal, or never come back after signing. The webhook does not depend on any of that.',
        ],
        code: {
          language: 'node',
          label: 'Fulfilment handler',
          source: `app.post('/webhooks/chain-payments', async (req, res) => {
  const event = cp.webhooks.construct(
    req.rawBody,
    req.headers['chain-signature'],
    process.env.CHAIN_PAYMENTS_WEBHOOK_SECRET,
  );

  if (event.type === 'payment.succeeded') {
    // Idempotent: this handler may run more than once for the same payment.
    await fulfilOrder(event.data.object.metadata.order_id);
  }

  res.sendStatus(200);
});`,
        },
      },
    ],
    next: ['checkout', 'webhooks', 'sandbox'],
  },

  {
    slug: 'checkout',
    readMinutes: 4,
    intro:
      'Checkout is a hosted page that handles the parts of a crypto payment your customers find hardest: connecting a wallet, being on the right network, having enough gas, and knowing whether it worked.',
    sections: [
      {
        heading: 'What it handles for you',
        bullets: [
          'Wallet connection across injected, WalletConnect, and mobile deep links.',
          'Detecting the wrong network and prompting a switch.',
          'Checking both the stablecoin balance and the gas balance before letting them submit.',
          'The token approval step, which most first-time payers have never seen.',
          'Live confirmation progress, and a receipt at the end.',
        ],
      },
      {
        heading: 'Create a session',
        body: [
          'Create a payment intent, then redirect the customer to the checkout URL it returns.',
        ],
        code: {
          language: 'node',
          label: 'Server',
          source: `const payment = await cp.payments.create({
  amount: 4999,                        // $49.99 — minor units
  currency: 'USDC',
  chain: 'base',
  merchant_address: process.env.SETTLEMENT_WALLET,
  description: 'Pro plan — annual',
  customer_email: email,
  metadata: { order_id: order.id },
});

res.redirect(payment.checkout_url);`,
        },
      },
      {
        heading: 'After payment',
        body: [
          'Checkout sends the customer to your success URL, but treat that as a convenience for them rather than a signal for you. The authoritative event is `payment.succeeded` on your webhook endpoint.',
        ],
        note: {
          tone: 'info',
          text: 'Test the failure paths in the sandbox — the "insufficient balance" and "reverts on-chain" test wallets exercise the two states most integrations forget.',
        },
      },
    ],
    next: ['payment-intents', 'sandbox', 'webhooks'],
  },

  {
    slug: 'payment-links',
    readMinutes: 3,
    intro:
      'A payment link is a URL that collects money. No integration, no server, no deploy — create it in the dashboard or over the API and send it to someone.',
    sections: [
      {
        heading: 'Fixed or customer-chosen amounts',
        body: [
          'Set an amount and the page shows that figure. Leave it null and the customer types their own — which is what you want for donations, top-ups, or anything you invoice conversationally.',
        ],
        endpoints: ['create-payment-link'],
      },
      {
        heading: 'Currency decides the networks',
        body: [
          'Each stablecoin exists on a specific set of chains, so a link can only offer networks its currency actually settles on. Passing an unsupported combination is rejected rather than silently corrected.',
        ],
        table: {
          headers: ['Currency', 'Networks'],
          rows: [
            ['USDC', 'Base, Ethereum, Polygon, Arbitrum, Optimism'],
            ['EURC', 'Base, Ethereum'],
            ['JPYC', 'Ethereum, Polygon'],
            ['HTGC', 'Base, Polygon'],
          ],
        },
      },
    ],
    next: ['checkout', 'multi-currency'],
  },

  {
    slug: 'holds',
    readMinutes: 4,
    intro:
      'A hold reserves an amount without moving it, so you can charge the final figure later. Use it when you know roughly what something costs but not exactly — rentals, deposits, usage-based work.',
    sections: [
      {
        heading: 'How it differs from a card authorization',
        body: [
          'On cards, the issuer holds the funds. Here the customer grants a time-boxed on-chain allowance against their own wallet, and you draw on it. The money never leaves their control until you capture.',
          'That has one consequence worth designing around: the customer can revoke the allowance. Treat a hold as a strong signal of intent, not a guarantee.',
        ],
        note: {
          tone: 'warn',
          text: 'A hold can be revoked by the customer before you capture. Capture promptly rather than sitting on holds for days.',
        },
      },
      {
        heading: 'Place a hold',
        endpoints: ['create-hold'],
      },
      {
        heading: 'Expiry',
        body: [
          'Every hold has a duration, after which it releases automatically and the allowance lapses. We send `hold.expiring` an hour before, which is the right moment to either capture or ask the customer to extend.',
        ],
      },
    ],
    next: ['payment-intents', 'webhooks'],
  },

  {
    slug: 'refunds',
    readMinutes: 5,
    intro:
      'Refunds come in two shapes because on-chain payments have a problem cards do not: the address that paid you is not always an address the customer can receive at.',
    sections: [
      {
        heading: 'Direct refunds',
        body: [
          'A direct refund pushes funds straight back to the paying address. It is the fastest path and the right default when the customer paid from a wallet they control.',
        ],
      },
      {
        heading: 'Claimable refunds',
        body: [
          'Sometimes the paying address cannot receive: an exchange hot wallet, a contract that does not accept transfers, a wallet the customer has since lost. A claimable refund issues a link instead. The customer opens it, connects any wallet they control, and pulls the funds to that address.',
          'The money stays in your balance until they claim it, so an unclaimed refund is not money you have lost track of.',
        ],
        endpoints: ['create-refund'],
      },
      {
        heading: 'Choosing between them',
        table: {
          headers: ['Situation', 'Method'],
          rows: [
            ['Customer paid from their own wallet', 'direct'],
            ['Payment came from an exchange address', 'claimable'],
            ['Customer asked to be refunded elsewhere', 'claimable'],
            ['Refunding in bulk after an outage', 'claimable'],
          ],
        },
      },
      {
        heading: 'Claim link lifecycle',
        body: [
          'Claim links expire. Until they do, you can revoke one and pull the funds back — useful if a refund was issued in error. Once claimed, it is final: the transaction is on-chain.',
        ],
        note: {
          tone: 'info',
          text: 'Reminders go out automatically to unclaimed links where we have an email on file. You can see the full claim timeline on each refund in the dashboard.',
        },
      },
    ],
    next: ['payment-intents', 'webhooks'],
  },

  {
    slug: 'agent-payments',
    readMinutes: 4,
    intro:
      'AI agents are starting to pay for things on their owners’ behalf. Chain Payments records whether a human wallet or an agent initiated each payment, and lets merchants issue agents their own constrained wallets.',
    sections: [
      {
        heading: 'Detection',
        body: [
          'Every payment intent and invoice carries `initiated_by`, which is either `human` or `agent`. When it is an agent, `agent_id` names which one. This is recorded at authorization time from the credential used, not inferred after the fact from behaviour.',
        ],
        code: {
          language: 'node',
          label: 'Reacting to agent payments',
          source: `if (event.data.object.initiated_by === 'agent') {
  // Agents pay instantly and never dispute — but they also
  // do not read your upsell page. Skip the post-purchase flow.
  await fulfilOrder(orderId, { skipUpsell: true });
}`,
        },
      },
      {
        heading: 'Agent wallets',
        body: [
          'A merchant can issue an agent its own wallet with a daily cap and a per-transaction cap. The agent can spend within those limits without further approval, and cannot exceed them — the limit is enforced when the transaction is built, not audited afterwards.',
        ],
        bullets: [
          'Per-transaction limit: the largest single payment the agent may make.',
          'Daily limit: resets at midnight UTC.',
          'Capabilities: which actions the agent may take at all, from issuing invoices to sending payments.',
        ],
      },
      {
        note: {
          tone: 'warn',
          text: 'Agent capabilities are permissions, not suggestions. Grant `send_payment` only to agents you would trust with a company card.',
        },
      },
    ],
    next: ['payment-intents', 'wallets'],
  },

  // --------------------------------------------------------------- Revenue
  {
    slug: 'invoicing',
    readMinutes: 4,
    intro:
      'Issue an invoice, send it, and get paid to a hosted page. Invoices settle in one currency — the one you choose when you create it.',
    sections: [
      {
        heading: 'One invoice, one currency',
        body: [
          'An invoice bills in a single currency. There is no FX conversion inside an invoice, because we do not quote a rate — if you need to bill someone in two currencies, that is two invoices.',
          'When you build invoices from catalog items, only items priced in the invoice’s currency can be added.',
        ],
        endpoints: ['create-invoice'],
      },
      {
        heading: 'Line items',
        body: [
          'Each line carries a description, quantity, unit price, and amount, all in minor units. `amount` should equal `quantity × unit_price`; we do not recompute it for you, so rounding decisions stay yours.',
        ],
      },
      {
        heading: 'Who paid',
        body: [
          'A paid invoice records `paid_by` as `human` or `agent`. For anyone selling to automated buyers, that is the field that tells you which half of your revenue is which.',
        ],
      },
    ],
    next: ['catalog', 'receipts', 'agent-payments'],
  },

  {
    slug: 'subscriptions',
    readMinutes: 4,
    intro:
      'Recurring billing on rails that were not designed for it. Cards have a stored credential you can charge again; wallets do not, so subscriptions work through renewable allowances.',
    sections: [
      {
        heading: 'How renewal works',
        body: [
          'At signup the customer grants an allowance covering the subscription amount for a number of periods ahead. Each period we draw one charge against it. When the allowance runs low we ask them to renew it — well before it lapses.',
        ],
        endpoints: ['create-subscription'],
      },
      {
        heading: 'Dunning',
        body: [
          'A failed renewal moves the subscription to `past_due` and starts the retry schedule. Retries back off, and after the maximum the subscription expires. Every step emits an event so you can email the customer in your own voice.',
        ],
        table: {
          headers: ['Status', 'Meaning'],
          rows: [
            ['trialing', 'In a free trial. No charge has been made.'],
            ['active', 'Paid and current.'],
            ['past_due', 'A renewal failed. Retries in progress.'],
            ['canceled', 'Ended deliberately.'],
            ['expired', 'Ended after exhausting retries.'],
          ],
        },
      },
    ],
    next: ['invoicing', 'webhooks'],
  },

  {
    slug: 'catalog',
    readMinutes: 3,
    intro:
      'Your products and services with prices, SKUs, and units — so invoices are assembled from things you already defined rather than retyped each time.',
    sections: [
      {
        heading: 'Items and categories',
        body: [
          'An item has a price in one currency, a unit ("each", "hour", "seat / month"), and a category. Categories exist so a long catalog stays navigable and so per-category performance is measurable.',
        ],
      },
      {
        heading: 'Performance data',
        body: [
          'Each item tracks units sold, lifetime revenue in its own currency, and a 30-day trend. Revenue is never converted across currencies — a EURC item reports EURC.',
        ],
      },
    ],
    next: ['invoicing', 'reporting'],
  },

  {
    slug: 'receipts',
    readMinutes: 3,
    intro:
      'Email receipts with the amount, the currency, and the transaction hash — so a customer can verify for themselves that they paid what they think they paid.',
    sections: [
      {
        heading: 'Automatic or explicit',
        body: [
          'With auto-send on, a receipt goes out whenever a payment succeeds and we have an email address. You can also send one explicitly, or re-send to a corrected address.',
        ],
        endpoints: ['send-receipt'],
      },
      {
        heading: 'Preview before sending',
        body: [
          'Pass `preview: true` to render the email and get it back without sending. Useful in tests, and for checking your footer copy and reply-to before a campaign of receipts goes out.',
        ],
      },
      {
        heading: 'Delivery state',
        body: [
          'Receipts report `sent`, `delivered`, `opened`, `bounced`, or `failed`. A bounce is worth surfacing to your support team — it usually means the address on the customer record is wrong.',
        ],
      },
    ],
    next: ['invoicing', 'payment-intents'],
  },

  {
    slug: 'reporting',
    readMinutes: 3,
    intro:
      'Volume, settlement, and fees across every currency and chain you accept.',
    sections: [
      {
        heading: 'Cross-currency totals are approximate',
        body: [
          'Any figure that sums more than one currency is marked with ≈ and computed from indicative reference rates. It exists to give you a sense of scale, not to be booked.',
          'Per-currency figures are exact, because no conversion happens: each coin settles as itself.',
        ],
        note: {
          tone: 'warn',
          text: 'Do not reconcile your books against a ≈ figure. Export per-currency totals instead.',
        },
      },
      {
        heading: 'What is measured',
        bullets: [
          'Gross volume and net settlement, by currency and by chain.',
          'Network fees paid, which vary by an order of magnitude between L1 and L2.',
          'Payment success rate, split by failure reason.',
          'Human versus agent-initiated volume.',
        ],
      },
    ],
    next: ['multi-currency', 'catalog'],
  },

  // ------------------------------------------------------------- Platforms
  {
    slug: 'connect',
    readMinutes: 5,
    intro:
      'Connect is for platforms that move money on behalf of other businesses: marketplaces, storefront builders, booking tools. Your sellers get their own settlement wallets, and you take a cut.',
    sections: [
      {
        heading: 'Connected accounts',
        body: [
          'Each seller is a connected account with its own settlement wallet. Funds route to them directly on-chain — they do not pass through your balance first, which keeps you out of the flow of funds and simplifies what you are on the hook for.',
        ],
        endpoints: ['create-connected-account'],
      },
      {
        heading: 'Onboarding states',
        table: {
          headers: ['Status', 'Can receive funds?'],
          rows: [
            ['onboarding', 'No. Details still outstanding.'],
            ['active', 'Yes.'],
            ['suspended', 'No. Payments to this account are rejected.'],
          ],
        },
      },
      {
        heading: 'Taking your cut',
        body: [
          'Define a split and the division happens in the settlement transaction itself. Both parties are paid atomically — there is no window where you hold the seller’s money.',
        ],
      },
    ],
    next: ['splits', 'payouts'],
  },

  {
    slug: 'splits',
    readMinutes: 3,
    intro:
      'Divide one payment across several recipients in the settlement transaction, so nobody has to trust anybody to forward funds afterwards.',
    sections: [
      {
        heading: 'Basis points or flat amounts',
        body: [
          'A split rule is either proportional (in basis points, where 250 is 2.5%) or a flat amount in minor units. Flat amounts are taken first, then the remainder is divided proportionally.',
        ],
        code: {
          language: 'node',
          label: 'A marketplace fee',
          source: `await cp.payments.create({
  amount: 10_000,          // $100.00 USDC
  chain: 'base',
  merchant_address: platformWallet,
  splits: [
    { recipient: platformWallet, bps: 250 },   // 2.5% to you
    { recipient: sellerWallet,  bps: 9750 },   // the rest to the seller
  ],
});`,
        },
      },
      {
        note: {
          tone: 'warn',
          text: 'Basis points across all recipients must total 10000. A split that does not add up is rejected at creation rather than at settlement.',
        },
      },
    ],
    next: ['connect', 'payouts'],
  },

  {
    slug: 'payouts',
    readMinutes: 3,
    intro:
      'Send accumulated balances to connected accounts on whatever schedule suits your platform.',
    sections: [
      {
        heading: 'Create a payout',
        endpoints: ['create-payout'],
      },
      {
        heading: 'When to use payouts instead of splits',
        body: [
          'Splits are right when the division is known at payment time. Payouts are right when it is not — when you settle weekly, net off refunds first, or hold funds through a return window.',
        ],
      },
    ],
    next: ['connect', 'splits'],
  },

  // ------------------------------------------------------- Money management
  {
    slug: 'wallets',
    readMinutes: 5,
    intro:
      'Where your money sits between settling and being spent. You can use a wallet we provision or connect one you already control.',
    sections: [
      {
        heading: 'Managed wallets are user-controlled',
        body: [
          'A wallet we create for you is MPC: the signing key is split so that no single party can move funds alone — including us. That is what makes the non-custodial claim in our terms true rather than marketing.',
          'The practical consequence is that recovery matters. Set it up when you create the wallet, not when you need it.',
        ],
        note: {
          tone: 'warn',
          text: 'We cannot move your funds, and we cannot recover your wallet for you. Complete recovery setup before you take real payments.',
        },
      },
      {
        heading: 'Or bring your own',
        body: [
          'Connect any wallet you already use — a company multisig, a hardware wallet, an exchange deposit address — and settle to it directly. Nothing about it is managed by us.',
        ],
      },
      {
        heading: 'One balance per currency, per chain',
        body: [
          'Balances do not pool across chains. USDC on Base and USDC on Polygon are separate balances of the same currency, and moving between them means bridging.',
        ],
      },
    ],
    next: ['transfers', 'bridge'],
  },

  {
    slug: 'transfers',
    readMinutes: 3,
    intro:
      'Send stablecoins out to any address — the same job a wire does, finished in seconds instead of days.',
    sections: [
      {
        heading: 'Saved recipients',
        body: [
          'Addresses are unforgiving, so save the ones you use repeatedly with a name and an email. A saved recipient carries its chain with it, which prevents the most expensive class of mistake: sending to a correct address on the wrong network.',
        ],
      },
      {
        heading: 'Fees',
        body: [
          'You pay the network fee for the chain you send on. On an L2 that is cents; on Ethereum mainnet it can exceed the value of a small transfer. The transfer form shows the fee before you confirm.',
        ],
        note: {
          tone: 'info',
          text: 'For payouts under about $50, sending on an L2 rather than mainnet is usually the difference between a sensible fee and an absurd one.',
        },
      },
    ],
    next: ['wallets', 'bridge'],
  },

  {
    slug: 'bridge',
    readMinutes: 3,
    intro:
      'Move a balance from one chain to another without changing what it is denominated in. USDC on Polygon becomes USDC on Base.',
    sections: [
      {
        heading: 'Why you need this',
        body: [
          'Customers pay where it is cheap for them; you may need to spend where your counterparties are. Bridging reconciles the two without converting currency.',
        ],
      },
      {
        heading: 'What it costs',
        body: [
          'Two network fees — one on each side — plus the bridge’s own fee. Settlement is typically under a minute between L2s and longer when mainnet is involved.',
        ],
        note: {
          tone: 'warn',
          text: 'Bridging is a real on-chain operation and is not reversible. Check the destination chain before confirming.',
        },
      },
    ],
    next: ['wallets', 'transfers'],
  },

  {
    slug: 'multi-currency',
    readMinutes: 4,
    intro:
      'Four stablecoins, each tracking a different fiat currency, each settling as itself. No conversion happens unless you ask for it.',
    sections: [
      {
        heading: 'The currencies',
        table: {
          headers: ['Ticker', 'Tracks', 'Minor unit', 'Networks'],
          rows: [
            ['USDC', 'US dollar', '1/100', 'Base, Ethereum, Polygon, Arbitrum, Optimism'],
            ['EURC', 'Euro', '1/100', 'Base, Ethereum'],
            ['JPYC', 'Japanese yen', 'whole yen', 'Ethereum, Polygon'],
            ['HTGC', 'Haitian gourde', '1/100', 'Base, Polygon'],
          ],
        },
      },
      {
        heading: 'Yen is the one that breaks integrations',
        body: [
          'JPYC has no subunit. An amount of 5000 is ¥5,000, not ¥50.00. Code that hardcodes a division by 100 will render every yen figure a hundredfold too small, and — worse — will accept a hundredfold too little if you use it to validate an amount.',
        ],
        code: {
          language: 'node',
          label: 'Formatting any currency correctly',
          source: `const MINOR_UNITS = { USDC: 100, EURC: 100, HTGC: 100, JPYC: 1 };

function toDecimal(minor, currency) {
  return minor / MINOR_UNITS[currency];   // never a bare / 100
}`,
        },
      },
      {
        heading: 'Cross-currency totals',
        body: [
          'Anywhere the product sums across currencies it shows ≈ and uses indicative reference rates. Per-currency values are always exact. We never silently convert one currency into another.',
        ],
      },
    ],
    next: ['payment-intents', 'reporting'],
  },

  // ----------------------------------------------------- Developer resources
  {
    slug: 'authentication',
    readMinutes: 3,
    intro:
      'Every request carries an API key. Which key you use decides both what you can do and which environment you touch.',
    sections: [
      {
        heading: 'Key types',
        table: {
          headers: ['Prefix', 'Where it runs', 'Can it move money?'],
          rows: [
            ['sk_live_…', 'Your server only', 'Yes'],
            ['sk_test_…', 'Your server only', 'No — sandbox only'],
            ['pk_live_…', 'Safe in a browser', 'No'],
            ['pk_test_…', 'Safe in a browser', 'No'],
          ],
        },
      },
      {
        heading: 'Making a request',
        code: {
          language: 'curl',
          source: `curl https://api.chainpayments.com/v1/payments \\
  -H "Authorization: Bearer $CHAIN_PAYMENTS_SECRET_KEY"`,
        },
      },
      {
        heading: 'Keeping secret keys secret',
        bullets: [
          'Never ship a secret key to a browser, a mobile binary, or a public repository.',
          'Read it from the environment, not from a checked-in config file.',
          'Rotate immediately if a key is exposed — including in a chat log or a screenshot.',
          'Give each service its own key so you can rotate one without an outage everywhere.',
        ],
        note: {
          tone: 'warn',
          text: 'A leaked live secret key can move your funds. Rotate first and investigate afterwards.',
        },
      },
    ],
    next: ['errors', 'sandbox'],
  },

  {
    slug: 'sandbox',
    readMinutes: 5,
    intro:
      'A complete copy of the API backed by testnets, so you can build and test the whole payment lifecycle without spending anything.',
    sections: [
      {
        heading: 'What is the same, and what is not',
        body: [
          'Objects, errors, webhooks, and confirmation behaviour are identical to live. What differs is that funds are testnet funds, data is stored separately, and you can reset the whole thing.',
        ],
      },
      {
        heading: 'Test wallets',
        body: [
          'The sandbox seeds a set of addresses that behave deterministically, so you can write assertions against them instead of hoping a testnet cooperates.',
        ],
      },
      {
        heading: 'Testing the paths that matter',
        body: [
          'Most integrations are tested only on the happy path and then meet reality. The states worth exercising deliberately are the ones a customer will hit at 2am.',
        ],
        bullets: [
          'A payment that stays pending long enough for the customer to close the tab.',
          'A transaction that reverts after broadcast, when your UI already said "submitted".',
          'A webhook delivered twice — your handler must be idempotent.',
          'A refund to an address that cannot receive, which is what claim links are for.',
          'A JPYC amount, to catch any hardcoded division by 100.',
        ],
        note: {
          tone: 'info',
          text: 'The sandbox tab in your dashboard has an API explorer that issues real requests against these endpoints, and an event builder that produces signed payloads you can replay at your own webhook handler.',
        },
      },
    ],
    next: ['webhooks', 'errors', 'api-reference'],
  },

  {
    slug: 'webhooks',
    readMinutes: 5,
    intro:
      'On-chain payments finish asynchronously and often after the customer has gone. Webhooks are how you find out.',
    sections: [
      {
        heading: 'Register an endpoint',
        endpoints: ['create-webhook'],
      },
      {
        heading: 'Verify every delivery',
        body: [
          'Each request carries a `Chain-Signature` header: an HMAC-SHA256 of the timestamp and the raw body, keyed by your endpoint secret. Verify it before you trust the payload, and compare in constant time.',
          'Verify against the raw request body. If your framework parses JSON before you see it, re-serializing will change the bytes and the signature will not match.',
        ],
        code: {
          language: 'node',
          label: 'Verification',
          source: `import crypto from 'node:crypto';

function verify(rawBody, header, secret) {
  const [ts, sig] = header.split(',').map(p => p.split('=')[1]);

  // Reject anything older than five minutes, so a captured
  // request cannot be replayed at you later.
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${ts}.\${rawBody}\`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(sig),
  );
}`,
        },
      },
      {
        heading: 'Be idempotent',
        body: [
          'We retry until you return a 2xx, which means your handler will sometimes run twice for the same event. Key your side effects on the event id, or on something stable in the payload, and make repeats harmless.',
        ],
        note: {
          tone: 'warn',
          text: 'Return 2xx as soon as you have durably recorded the event, then do the slow work asynchronously. Long handlers time out and get retried.',
        },
      },
      {
        heading: 'Retry schedule',
        body: [
          'Failed deliveries retry with exponential backoff over roughly three days: after 5 seconds, then 5 minutes, 30 minutes, 2 hours, 5 hours, and so on. After that the delivery is marked failed and left in your event log.',
        ],
      },
    ],
    next: ['errors', 'sandbox'],
  },

  {
    slug: 'errors',
    readMinutes: 4,
    intro:
      'What the API returns when something goes wrong, and how to retry a payment request without charging twice.',
    sections: [
      {
        heading: 'Status codes',
        table: {
          headers: ['Code', 'Meaning', 'Retry?'],
          rows: [
            ['200', 'Fine.', '—'],
            ['201', 'Created.', '—'],
            ['400', 'Your request was malformed or a value was invalid.', 'No — fix it first.'],
            ['401', 'Missing or invalid API key.', 'No.'],
            ['404', 'No such object, or not yours.', 'No.'],
            ['409', 'Conflicts with the object’s current state.', 'No — re-read and decide.'],
            ['429', 'Rate limited.', 'Yes, after backing off.'],
            ['500', 'Our fault.', 'Yes, with the same idempotency key.'],
          ],
        },
      },
      {
        heading: 'Error shape',
        code: {
          language: 'curl',
          label: 'A 400 response',
          source: `{
  "error": "Invalid chain. Must be one of: base, ethereum, polygon, arbitrum, optimism"
}`,
        },
      },
      {
        heading: 'Idempotency',
        body: [
          'Send an `Idempotency-Key` header on any request that creates something. If the same key arrives again within 24 hours we return the original result instead of creating a second object.',
          'This is what makes a network timeout safe. Without it, a request that succeeded but never returned leaves you unable to distinguish "not created" from "created, response lost".',
        ],
        code: {
          language: 'curl',
          source: `curl https://api.chainpayments.com/v1/payments \\
  -X POST \\
  -H "Authorization: Bearer $CHAIN_PAYMENTS_SECRET_KEY" \\
  -H "Idempotency-Key: order_8812_attempt_1" \\
  -d amount=5000 \\
  -d chain=base`,
        },
        note: {
          tone: 'info',
          text: 'Derive the key from something stable in your own system — an order id — rather than generating a fresh UUID per attempt, which defeats the purpose.',
        },
      },
      {
        heading: 'Rate limits',
        body: [
          'A hundred requests per second per key in live mode, twenty-five in sandbox. Exceeding it returns 429 with a `Retry-After` header. Back off exponentially rather than retrying immediately.',
        ],
      },
    ],
    next: ['authentication', 'webhooks'],
  },

  {
    slug: 'api-reference',
    readMinutes: 2,
    intro:
      'Every endpoint, grouped by what it is for. All requests go to https://api.chainpayments.com and require a secret key.',
    sections: [
      {
        heading: 'Conventions',
        bullets: [
          'Amounts are integers in the currency’s minor units.',
          'Timestamps are ISO 8601 in UTC.',
          'List endpoints take `limit` and `offset` and return `{ data, total, limit, offset, has_more }`.',
          'Unknown query parameters are ignored; unknown body fields are rejected.',
        ],
      },
    ],
    next: ['authentication', 'errors'],
  },
];

export function getGuide(slug: string): DevGuide | undefined {
  return DEV_GUIDES.find((g) => g.slug === slug);
}
