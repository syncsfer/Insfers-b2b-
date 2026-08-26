/**
 * Customer-facing transactional emails.
 *
 * Every template returns HTML *and* plain text. The text part is not a
 * courtesy: clients that show it are also the ones most likely to junk a
 * message that has no text alternative, and it is what a screen reader gets.
 *
 * Amounts always go through `formatAmount` with the record's own currency —
 * never a bare division by 100, which would render every JPYC figure a
 * hundredfold too small.
 */

import { formatAmount, getCoin } from '@/lib/currencies';
import { formatDate, truncateAddress, getExplorerUrl } from '@/lib/utils';
import {
  amountBlock, button, callout, detailTable, escapeHtml, fallbackLink, heading,
  eyebrow, lineItemTable, paragraph, plainText, section, shell, safeUrl,
  type DetailRow,
} from './components';
import { COLOR, DEFAULT_BRAND, FONT_MONO, type EmailBrand } from './theme';
import type {
  Receipt, ReceiptSettings, PaymentIntent, Invoice, Refund, PaymentLink,
} from '@/types';

export interface RenderedEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** The inbox preview line, exposed so previews can show what recipients see. */
  preheader: string;
}

/** Fills {{merchant}}, {{amount}}, {{receipt_id}} placeholders in a template string. */
export function fillTemplate(
  template: string,
  vars: { merchant: string; amount: string; receipt_id: string },
): string {
  return template
    .replace(/\{\{\s*merchant\s*\}\}/g, vars.merchant)
    .replace(/\{\{\s*amount\s*\}\}/g, vars.amount)
    .replace(/\{\{\s*receipt_id\s*\}\}/g, vars.receipt_id);
}

function txRow(chain: string, hash: string | null): DetailRow | null {
  if (!hash) return null;
  const url = getExplorerUrl(chain, hash);
  return {
    label: 'Transaction',
    html: true,
    value: `<a href="${safeUrl(url)}" style="color:${COLOR.brand};text-decoration:none;font-family:${FONT_MONO};">${escapeHtml(truncateAddress(hash))}</a>`,
  };
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Date without a time.
 *
 * A due date or a claim deadline is a day, not an instant — printing
 * "due Aug 11, 2026, 2:48 PM UTC" invites the recipient to wonder whether
 * 3pm is late, and reads like a machine wrote it.
 */
function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

/** Whole days from now until `iso`, floored at zero. */
function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

// ---------------------------------------------------------------------------
// Receipt
// ---------------------------------------------------------------------------

export function renderReceiptEmail(
  receipt: Receipt,
  settings: ReceiptSettings,
  payment?: PaymentIntent,
  baseUrl = '',
  brand: EmailBrand = DEFAULT_BRAND,
): RenderedEmail {
  const coin = getCoin(receipt.currency);
  const amount = formatAmount(receipt.amount, coin.symbol);
  const paidAt = payment?.confirmed_at ?? receipt.created_at;
  const receiptLink = `${baseUrl}${receipt.receipt_url}`;
  const merchant = settings.from_name || brand.merchantName;

  const subject = fillTemplate(settings.subject_template, {
    merchant,
    amount: `${amount} ${coin.symbol}`,
    receipt_id: receipt.id,
  });

  const rows: DetailRow[] = [
    { label: 'Description', value: payment?.description || 'Payment' },
    { label: 'Amount paid', value: `${amount} ${coin.symbol}`, strong: true },
    { label: 'Currency', value: `${coin.symbol} — ${coin.name}` },
    { label: 'Network', value: capitalise(receipt.chain) },
    { label: 'Receipt', value: receipt.id, mono: true },
  ];
  const tx = settings.include_tx_link ? txRow(receipt.chain, receipt.tx_hash) : null;
  if (tx) rows.push(tx);

  const sections = [
    section(`
      ${eyebrow('Payment receipt')}
      ${heading(`Thanks — we received your payment`)}
      <div style="height:18px;"></div>
      ${amountBlock(`${amount} ${coin.symbol}`, `Paid to ${merchant} on ${formatDate(paidAt)}`)}
    `),
    section(detailTable(rows), { divider: true, tight: true }),
    section(`
      ${button('View full receipt', receiptLink, brand.brandColor)}
      ${fallbackLink(receiptLink)}
    `, { tight: true }),
    section(
      callout(
        `This payment settled on-chain and is final. Keep this receipt for your records — you can verify the transaction yourself on the block explorer.`,
        'positive',
      ),
      { tight: true },
    ),
  ].join('');

  const preheaderText = `${amount} ${coin.symbol} paid to ${merchant} — receipt ${receipt.id}`;

  return {
    to: receipt.customer_email,
    subject,
    preheader: preheaderText,
    html: shell({
      brand: { ...brand, merchantName: merchant, footerMessage: settings.footer_message || brand.footerMessage },
      preheaderText,
      title: subject,
      why: `You are receiving this because you made a payment to ${merchant}.`,
      sections,
    }),
    text: plainText([
      `${merchant} — payment receipt`,
      ``,
      `Amount paid: ${amount} ${coin.symbol}`,
      `Currency:    ${coin.symbol} (${coin.name})`,
      `Paid on:     ${formatDate(paidAt)}`,
      `Network:     ${capitalise(receipt.chain)}`,
      payment?.description ? `Description: ${payment.description}` : null,
      `Receipt:     ${receipt.id}`,
      receipt.tx_hash && settings.include_tx_link
        ? `Transaction: ${getExplorerUrl(receipt.chain, receipt.tx_hash)}`
        : null,
      ``,
      `View full receipt: ${receiptLink}`,
      ``,
      settings.footer_message || null,
      `You are receiving this because you made a payment to ${merchant}.`,
    ]),
  };
}

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

export type InvoiceEmailKind = 'sent' | 'reminder' | 'overdue' | 'paid';

export function renderInvoiceEmail(
  invoice: Invoice,
  kind: InvoiceEmailKind = 'sent',
  baseUrl = '',
  brand: EmailBrand = DEFAULT_BRAND,
): RenderedEmail {
  const coin = getCoin(invoice.currency);
  const total = `${formatAmount(invoice.amount, coin.symbol)} ${coin.symbol}`;
  const link = `${baseUrl}/i/${invoice.id}`;
  const due = formatDay(invoice.due_date);
  const days = daysUntil(invoice.due_date);
  const isPaid = kind === 'paid';

  const subject = {
    sent: `Invoice ${invoice.id} from ${brand.merchantName} — ${total}`,
    reminder: `Reminder: invoice ${invoice.id} is due ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}`,
    overdue: `Overdue: invoice ${invoice.id} from ${brand.merchantName}`,
    paid: `Invoice ${invoice.id} is paid — thank you`,
  }[kind];

  const headline = {
    sent: `You have a new invoice`,
    reminder: `A quick reminder about your invoice`,
    overdue: `This invoice is past due`,
    paid: `Invoice paid in full`,
  }[kind];

  const intro = {
    sent: `${escapeHtml(brand.merchantName)} has sent you an invoice. You can pay it with any supported wallet — no account needed.`,
    reminder: `Invoice <strong>${escapeHtml(invoice.id)}</strong> is due on ${escapeHtml(due)}. If you have already paid, please ignore this.`,
    overdue: `Invoice <strong>${escapeHtml(invoice.id)}</strong> was due on ${escapeHtml(due)} and is still outstanding.`,
    paid: `We have received your payment for invoice <strong>${escapeHtml(invoice.id)}</strong>. Nothing further is needed.`,
  }[kind];

  const dueCallout = isPaid
    ? callout('Paid in full. This invoice is now closed.', 'positive')
    : kind === 'overdue'
      ? callout(`<strong>Past due.</strong> This invoice was due on ${escapeHtml(due)}.`, 'danger')
      : days <= 3
        ? callout(`<strong>Due ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}</strong> — ${escapeHtml(due)}.`, 'warning')
        : callout(`Payable in ${escapeHtml(coin.symbol)} on ${escapeHtml(coin.networks.map(capitalise).join(', '))}.`, 'neutral');

  const rows: DetailRow[] = [
    { label: 'Invoice', value: invoice.id, mono: true },
    { label: 'Issued to', value: invoice.customer_email },
    { label: 'Due date', value: due },
    { label: 'Currency', value: `${coin.symbol} — ${coin.name}` },
  ];
  if (invoice.paid_at) rows.push({ label: 'Paid on', value: formatDate(invoice.paid_at) });

  const items = invoice.items.map(it => ({
    description: it.description,
    quantity: it.quantity,
    unitPrice: formatAmount(it.unit_price, coin.symbol),
    amount: `${formatAmount(it.amount, coin.symbol)}`,
  }));

  const sections = [
    section(`
      ${eyebrow(isPaid ? 'Invoice paid' : 'Invoice')}
      ${heading(headline)}
      <div style="height:14px;"></div>
      ${paragraph(intro)}
      ${amountBlock(total, isPaid ? 'Paid in full' : `Due ${due}`)}
    `),
    items.length > 0
      ? section(lineItemTable(items, { label: 'Total due', value: total }), { divider: true, tight: true })
      : '',
    section(detailTable(rows), { divider: true, tight: true }),
    invoice.memo
      ? section(`${eyebrow('Note')}${paragraph(escapeHtml(invoice.memo), { muted: true })}`, { divider: true, tight: true })
      : '',
    section(`
      ${button(isPaid ? 'View invoice' : `Pay ${total}`, link, brand.brandColor)}
      ${fallbackLink(link)}
    `, { tight: true }),
    section(dueCallout, { tight: true }),
  ].join('');

  const preheaderText = isPaid
    ? `Invoice ${invoice.id} is paid — ${total}`
    : `${total} due ${due} · pay with any supported wallet`;

  return {
    to: invoice.customer_email,
    subject,
    preheader: preheaderText,
    html: shell({
      brand,
      preheaderText,
      title: subject,
      why: `You are receiving this because ${brand.merchantName} issued you an invoice.`,
      sections,
    }),
    text: plainText([
      `${brand.merchantName} — ${headline}`,
      ``,
      `Invoice:  ${invoice.id}`,
      `Amount:   ${total}`,
      `Due date: ${due}`,
      `Currency: ${coin.symbol} (${coin.name})`,
      invoice.paid_at ? `Paid on:  ${formatDate(invoice.paid_at)}` : null,
      ``,
      items.length ? `Items:` : null,
      ...items.map(it => `  ${it.quantity} x ${it.description} — ${it.amount}`),
      items.length ? `  Total: ${total}` : null,
      ``,
      invoice.memo ? `Note: ${invoice.memo}` : null,
      ``,
      isPaid ? `View invoice: ${link}` : `Pay this invoice: ${link}`,
      ``,
      `You are receiving this because ${brand.merchantName} issued you an invoice.`,
    ]),
  };
}

// ---------------------------------------------------------------------------
// Refund claim link
// ---------------------------------------------------------------------------

export type ClaimEmailKind = 'ready' | 'reminder' | 'expiring' | 'claimed';

/**
 * The claim-link email.
 *
 * This one carries the most risk of being mistaken for a scam — it tells
 * someone they have money waiting and asks them to follow a link and connect a
 * wallet. The copy leans hard on naming the original payment so the recipient
 * can place it, and never asks for a seed phrase or private key.
 */
export function renderClaimLinkEmail(
  refund: Refund,
  kind: ClaimEmailKind = 'ready',
  baseUrl = '',
  brand: EmailBrand = DEFAULT_BRAND,
): RenderedEmail {
  const coin = getCoin(refund.currency);
  const amount = `${formatAmount(refund.amount, coin.symbol)} ${coin.symbol}`;
  const link = refund.claim_link
    ? (refund.claim_link.startsWith('http') ? refund.claim_link : `${baseUrl}${refund.claim_link}`)
    : `${baseUrl}/r/${refund.id}`;
  const expires = refund.claim_expires_at ? formatDay(refund.claim_expires_at) : null;
  const days = refund.claim_expires_at ? daysUntil(refund.claim_expires_at) : null;
  const isClaimed = kind === 'claimed';

  const subject = {
    ready: `Your ${amount} refund from ${brand.merchantName} is ready to claim`,
    reminder: `Reminder: ${amount} refund waiting from ${brand.merchantName}`,
    expiring: `Your refund expires ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`} — claim ${amount}`,
    claimed: `Refund complete — ${amount} sent`,
  }[kind];

  const headline = {
    ready: 'Your refund is ready',
    reminder: 'Your refund is still waiting',
    expiring: 'Your refund is about to expire',
    claimed: 'Refund sent',
  }[kind];

  const intro = {
    ready: `${escapeHtml(brand.merchantName)} has issued you a refund. Choose the wallet address you would like it sent to, and we will send it there.`,
    reminder: `You have an unclaimed refund from ${escapeHtml(brand.merchantName)}. It takes about a minute to claim.`,
    expiring: `Your refund from ${escapeHtml(brand.merchantName)} has not been claimed yet and the link is about to expire.`,
    claimed: `Your refund has been sent on-chain. It should already be in your wallet.`,
  }[kind];

  const rows: DetailRow[] = [
    { label: 'Refund amount', value: amount, strong: true },
    { label: 'Currency', value: `${coin.symbol} — ${coin.name}` },
    { label: 'Network', value: capitalise(refund.chain) },
    { label: 'Reason', value: refund.reason || 'Refund' },
    { label: 'Reference', value: refund.payment_intent_id, mono: true },
  ];
  if (expires && !isClaimed) rows.push({ label: 'Claim before', value: expires });
  if (refund.claimed_at) rows.push({ label: 'Claimed on', value: formatDate(refund.claimed_at) });
  const tx = txRow(refund.chain, refund.tx_hash);
  if (tx) rows.push(tx);

  const urgency = isClaimed
    ? callout('This refund is complete. No further action is needed.', 'positive')
    : kind === 'expiring'
      ? callout(`<strong>Expires ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}.</strong> After that the funds return to ${escapeHtml(brand.merchantName)} and you will need to contact them.`, 'danger')
      : expires
        ? callout(`Claim this by <strong>${escapeHtml(expires)}</strong>. After that the link stops working and the funds return to ${escapeHtml(brand.merchantName)}.`, 'warning')
        : '';

  const safetyNote = isClaimed
    ? ''
    : callout(
        `<strong>Staying safe:</strong> claiming only ever asks you to connect a wallet and pick a receiving address. We will never ask for your seed phrase, private key, or a payment to release these funds.`,
        'neutral',
      );

  const sections = [
    section(`
      ${eyebrow(isClaimed ? 'Refund complete' : 'Refund available')}
      ${heading(headline)}
      <div style="height:14px;"></div>
      ${paragraph(intro)}
      ${amountBlock(amount, isClaimed ? 'Sent to your wallet' : `Refunded by ${brand.merchantName}`)}
    `),
    section(detailTable(rows), { divider: true, tight: true }),
    isClaimed
      ? ''
      : section(`
          ${button(`Claim ${amount}`, link, brand.brandColor)}
          ${fallbackLink(link)}
        `, { tight: true }),
    urgency ? section(urgency, { tight: true }) : '',
    safetyNote ? section(safetyNote, { tight: true }) : '',
  ].join('');

  const preheaderText = isClaimed
    ? `${amount} has been sent to your wallet`
    : `${amount} is waiting for you${expires ? ` — claim by ${expires}` : ''}`;

  return {
    to: refund.recipient_email ?? '',
    subject,
    preheader: preheaderText,
    html: shell({
      brand,
      preheaderText,
      title: subject,
      why: `You are receiving this because ${brand.merchantName} issued a refund for a payment you made.`,
      sections,
    }),
    text: plainText([
      `${brand.merchantName} — ${headline}`,
      ``,
      `Refund amount: ${amount}`,
      `Currency:      ${coin.symbol} (${coin.name})`,
      `Network:       ${capitalise(refund.chain)}`,
      `Reason:        ${refund.reason || 'Refund'}`,
      `Reference:     ${refund.payment_intent_id}`,
      expires && !isClaimed ? `Claim before:  ${expires}` : null,
      refund.claimed_at ? `Claimed on:    ${formatDate(refund.claimed_at)}` : null,
      refund.tx_hash ? `Transaction:   ${getExplorerUrl(refund.chain, refund.tx_hash)}` : null,
      ``,
      isClaimed ? null : `Claim your refund: ${link}`,
      isClaimed ? null : ``,
      isClaimed
        ? null
        : `Staying safe: claiming only asks you to connect a wallet and choose a receiving address. We will never ask for your seed phrase, private key, or a payment to release these funds.`,
      ``,
      `You are receiving this because ${brand.merchantName} issued a refund for a payment you made.`,
    ]),
  };
}

// ---------------------------------------------------------------------------
// Payment link / payment request
// ---------------------------------------------------------------------------

export function renderPaymentLinkEmail(
  link: PaymentLink,
  to: string,
  opts: { note?: string | null; baseUrl?: string; brand?: EmailBrand } = {},
): RenderedEmail {
  const { note = null, baseUrl = '', brand = DEFAULT_BRAND } = opts;
  const coin = getCoin(link.currency);
  const url = link.url.startsWith('http') ? link.url : `${baseUrl}${link.url}`;
  const fixed = link.amount !== null;
  const amount = fixed ? `${formatAmount(link.amount as number, coin.symbol)} ${coin.symbol}` : null;

  const subject = fixed
    ? `${brand.merchantName} requests ${amount} — ${link.name}`
    : `${brand.merchantName} sent you a payment request — ${link.name}`;

  const rows: DetailRow[] = [
    { label: 'For', value: link.name },
    { label: 'Amount', value: amount ?? 'You choose', strong: true },
    { label: 'Currency', value: `${coin.symbol} — ${coin.name}` },
    { label: 'Pay on', value: link.chains.map(capitalise).join(', ') },
  ];

  const sections = [
    section(`
      ${eyebrow('Payment request')}
      ${heading(`${brand.merchantName} would like to be paid`)}
      <div style="height:14px;"></div>
      ${paragraph(`This is a request for payment for <strong>${escapeHtml(link.name)}</strong>. You can pay with any supported wallet — there is no account to create.`)}
      ${amountBlock(amount ?? 'Your choice', fixed ? `Payable in ${coin.symbol}` : `Enter any amount in ${coin.symbol}`)}
    `),
    note
      ? section(`${eyebrow(`Note from ${brand.merchantName}`)}${paragraph(escapeHtml(note), { muted: true })}`, { divider: true, tight: true })
      : '',
    section(detailTable(rows), { divider: true, tight: true }),
    section(`
      ${button(fixed ? `Pay ${amount}` : 'Continue to payment', url, brand.brandColor)}
      ${fallbackLink(url)}
    `, { tight: true }),
    section(
      callout(
        `Payment settles directly to ${escapeHtml(brand.merchantName)} on-chain, usually within a minute. You will get a receipt by email once it confirms.`,
        'neutral',
      ),
      { tight: true },
    ),
  ].join('');

  const preheaderText = fixed
    ? `${amount} requested for ${link.name}`
    : `${brand.merchantName} requested a payment for ${link.name}`;

  return {
    to,
    subject,
    preheader: preheaderText,
    html: shell({
      brand,
      preheaderText,
      title: subject,
      why: `You are receiving this because ${brand.merchantName} sent you a payment request.`,
      sections,
    }),
    text: plainText([
      `${brand.merchantName} — payment request`,
      ``,
      `For:      ${link.name}`,
      `Amount:   ${amount ?? 'You choose'}`,
      `Currency: ${coin.symbol} (${coin.name})`,
      `Pay on:   ${link.chains.map(capitalise).join(', ')}`,
      ``,
      note ? `Note: ${note}` : null,
      ``,
      `Pay here: ${url}`,
      ``,
      `You are receiving this because ${brand.merchantName} sent you a payment request.`,
    ]),
  };
}
