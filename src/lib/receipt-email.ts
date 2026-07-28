import { formatUSDC, formatDate, truncateAddress, getExplorerUrl } from '@/lib/utils';
import type { Receipt, ReceiptSettings, PaymentIntent } from '@/types';

export interface RenderedEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders the customer-facing receipt email. Returns both HTML and a plain-text
 * fallback so the message degrades gracefully in text-only clients.
 */
export function renderReceiptEmail(
  receipt: Receipt,
  settings: ReceiptSettings,
  payment?: PaymentIntent,
  baseUrl = '',
): RenderedEmail {
  const amount = formatUSDC(receipt.amount);
  const paidAt = payment?.confirmed_at ?? receipt.created_at;
  const receiptLink = `${baseUrl}${receipt.receipt_url}`;
  const explorerLink = receipt.tx_hash ? getExplorerUrl(receipt.chain, receipt.tx_hash) : null;

  const subject = fillTemplate(settings.subject_template, {
    merchant: settings.from_name,
    amount,
    receipt_id: receipt.id,
  });

  const txRow = settings.include_tx_link && receipt.tx_hash && explorerLink
    ? `<tr>
        <td style="padding:6px 0;color:#6b7280;font-size:13px;">Transaction</td>
        <td style="padding:6px 0;text-align:right;font-size:13px;">
          <a href="${explorerLink}" style="color:#2563eb;text-decoration:none;font-family:monospace;">
            ${escapeHtml(truncateAddress(receipt.tx_hash))}
          </a>
        </td>
      </tr>`
    : '';

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
      <tr>
        <td style="padding:32px 32px 24px;border-bottom:1px solid #f3f4f6;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;font-weight:600;">Receipt</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#111827;">${escapeHtml(settings.from_name)}</p>
          <p style="margin:16px 0 0;font-size:32px;font-weight:700;color:#111827;">${amount}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Paid on ${escapeHtml(formatDate(paidAt))}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Description</td>
              <td style="padding:6px 0;text-align:right;font-size:13px;color:#111827;">${escapeHtml(payment?.description || 'Payment')}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Amount</td>
              <td style="padding:6px 0;text-align:right;font-size:13px;color:#111827;font-weight:600;">${amount} USDC</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Network</td>
              <td style="padding:6px 0;text-align:right;font-size:13px;color:#111827;text-transform:capitalize;">${escapeHtml(receipt.chain)}</td>
            </tr>
            ${txRow}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;">
          <a href="${receiptLink}" style="display:block;padding:12px;background:#2563eb;color:#ffffff;text-align:center;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
            View full receipt
          </a>
        </td>
      </tr>
      ${settings.footer_message ? `<tr>
        <td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#6b7280;">${escapeHtml(settings.footer_message)}</p>
        </td>
      </tr>` : ''}
    </table>
    <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:11px;color:#9ca3af;">
      Secured by Chain Payments
    </p>
  </body>
</html>`;

  const text = [
    `${settings.from_name} — Receipt`,
    ``,
    `Amount: ${amount} USDC`,
    `Paid on: ${formatDate(paidAt)}`,
    `Network: ${receipt.chain}`,
    payment?.description ? `Description: ${payment.description}` : null,
    explorerLink ? `Transaction: ${explorerLink}` : null,
    ``,
    `View full receipt: ${receiptLink}`,
    settings.footer_message ? `\n${settings.footer_message}` : null,
  ].filter(Boolean).join('\n');

  return { to: receipt.customer_email, subject, html, text };
}
