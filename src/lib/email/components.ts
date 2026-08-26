/**
 * Shared building blocks for transactional email.
 *
 * Everything is table-based with inline styles because that is what survives
 * Outlook, Gmail's clipper, and the long tail of mobile clients. Divs and
 * modern layout would look right in a browser preview and wrong in an inbox.
 */

import { COLOR, FONT, FONT_MONO, WIDTH, TONE, type Tone, type EmailBrand } from './theme';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only allow links we would be willing to put in front of a customer. */
export function safeUrl(url: string): string {
  const trimmed = url.trim();
  return /^(https?:\/\/|mailto:|\/)/i.test(trimmed) ? escapeHtml(trimmed) : '#';
}

/**
 * The grey line an inbox shows after the subject.
 *
 * Left unset, clients scrape the first visible text — usually "View in browser"
 * or the merchant name — which wastes the most valuable line in the message.
 * The trailing whitespace stops Gmail from bleeding body copy into it.
 */
export function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${COLOR.canvas};opacity:0;">${escapeHtml(text)}${'&#8203;&nbsp;'.repeat(60)}</div>`;
}

/** Section padding used by every block, so blocks stack without measuring. */
const PAD = '32px';

export function eyebrow(text: string): string {
  return `<p style="margin:0 0 6px;font-family:${FONT};font-size:11px;line-height:16px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${COLOR.muted};">${escapeHtml(text)}</p>`;
}

export function heading(text: string): string {
  return `<h1 style="margin:0;font-family:${FONT};font-size:22px;line-height:30px;font-weight:700;color:${COLOR.ink};">${escapeHtml(text)}</h1>`;
}

export function paragraph(text: string, opts: { muted?: boolean; small?: boolean } = {}): string {
  const size = opts.small ? '13px' : '15px';
  const line = opts.small ? '20px' : '23px';
  const color = opts.muted ? COLOR.muted : COLOR.body;
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:${size};line-height:${line};color:${color};">${text}</p>`;
}

/**
 * The headline figure. Rendered large and on its own so the recipient can
 * answer "how much?" without reading a word.
 */
export function amountBlock(amount: string, caption?: string): string {
  return `
    <p style="margin:0;font-family:${FONT};font-size:34px;line-height:42px;font-weight:700;color:${COLOR.ink};letter-spacing:-.02em;">${escapeHtml(amount)}</p>
    ${caption ? `<p style="margin:6px 0 0;font-family:${FONT};font-size:13px;line-height:19px;color:${COLOR.muted};">${escapeHtml(caption)}</p>` : ''}`;
}

export interface DetailRow {
  label: string;
  /** Pre-escaped HTML when `html` is true, otherwise escaped for you. */
  value: string;
  html?: boolean;
  mono?: boolean;
  strong?: boolean;
}

/** Label/value table — the spine of every transactional email. */
export function detailTable(rows: DetailRow[]): string {
  const body = rows
    .map((r, i) => {
      const border = i === 0 ? 'none' : `1px solid ${COLOR.hairlineSoft}`;
      const value = r.html ? r.value : escapeHtml(r.value);
      return `<tr>
        <td style="padding:11px 0;border-top:${border};font-family:${FONT};font-size:13px;line-height:19px;color:${COLOR.muted};vertical-align:top;">${escapeHtml(r.label)}</td>
        <td style="padding:11px 0;border-top:${border};font-family:${r.mono ? FONT_MONO : FONT};font-size:13px;line-height:19px;color:${COLOR.ink};font-weight:${r.strong ? 700 : 400};text-align:right;vertical-align:top;">${value}</td>
      </tr>`;
    })
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${body}</table>`;
}

/** Line-item table for invoices. */
export function lineItemTable(
  items: { description: string; quantity: number; unitPrice: string; amount: string }[],
  total: { label: string; value: string },
): string {
  const head = `<tr>
    <th align="left" style="padding:0 0 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${COLOR.faint};border-bottom:1px solid ${COLOR.hairline};">Description</th>
    <th align="right" style="padding:0 0 8px 12px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${COLOR.faint};border-bottom:1px solid ${COLOR.hairline};">Qty</th>
    <th align="right" style="padding:0 0 8px 12px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${COLOR.faint};border-bottom:1px solid ${COLOR.hairline};">Amount</th>
  </tr>`;

  const rows = items
    .map(
      it => `<tr>
        <td style="padding:11px 0;border-bottom:1px solid ${COLOR.hairlineSoft};font-family:${FONT};font-size:14px;line-height:20px;color:${COLOR.ink};">${escapeHtml(it.description)}<br><span style="font-size:12px;color:${COLOR.muted};">${escapeHtml(it.unitPrice)} each</span></td>
        <td align="right" style="padding:11px 0 11px 12px;border-bottom:1px solid ${COLOR.hairlineSoft};font-family:${FONT};font-size:14px;line-height:20px;color:${COLOR.body};">${it.quantity}</td>
        <td align="right" style="padding:11px 0 11px 12px;border-bottom:1px solid ${COLOR.hairlineSoft};font-family:${FONT};font-size:14px;line-height:20px;color:${COLOR.ink};white-space:nowrap;">${escapeHtml(it.amount)}</td>
      </tr>`,
    )
    .join('');

  const totalRow = `<tr>
    <td colspan="2" style="padding:14px 0 0;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:${COLOR.ink};">${escapeHtml(total.label)}</td>
    <td align="right" style="padding:14px 0 0 12px;font-family:${FONT};font-size:16px;line-height:22px;font-weight:700;color:${COLOR.ink};white-space:nowrap;">${escapeHtml(total.value)}</td>
  </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">${head}${rows}${totalRow}</table>`;
}

/**
 * A "bulletproof" button: an Outlook VML rectangle behind a normal anchor.
 *
 * A padded `<a>` alone collapses to a bare text link in Outlook's Word
 * renderer, which on a payment email is the difference between getting paid and
 * not.
 */
export function button(label: string, href: string, color: string): string {
  const url = safeUrl(href);
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
    <tr>
      <td align="center" bgcolor="${escapeHtml(color)}" style="border-radius:8px;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:46px;v-text-anchor:middle;width:260px;" arcsize="18%" stroke="f" fillcolor="${escapeHtml(color)}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:${FONT};font-size:15px;font-weight:600;">${escapeHtml(label)}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${url}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;line-height:18px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background:${escapeHtml(color)};">${escapeHtml(label)}</a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}

/** Tinted callout for deadlines, warnings, and reassurance. */
export function callout(text: string, tone: Tone = 'neutral'): string {
  const t = TONE[tone];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;">
    <tr>
      <td style="padding:13px 16px;background:${t.wash};border:1px solid ${t.edge};border-radius:8px;font-family:${FONT};font-size:13px;line-height:20px;color:${t.ink};">${text}</td>
    </tr>
  </table>`;
}

/** A copyable URL, for recipients whose client strips the button. */
export function fallbackLink(url: string): string {
  const safe = safeUrl(url);
  return `<p style="margin:16px 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.faint};">
    Button not working? Copy this link:<br>
    <a href="${safe}" style="color:${COLOR.muted};text-decoration:underline;word-break:break-all;">${safe}</a>
  </p>`;
}

/** One padded section of the card. */
export function section(content: string, opts: { divider?: boolean; tight?: boolean } = {}): string {
  return `<tr>
    <td style="padding:${opts.tight ? '20px' : PAD} ${PAD};${opts.divider ? `border-top:1px solid ${COLOR.hairlineSoft};` : ''}">${content}</td>
  </tr>`;
}

function header(brand: EmailBrand): string {
  const mark = brand.logoUrl
    ? `<img src="${safeUrl(brand.logoUrl)}" width="120" alt="${escapeHtml(brand.merchantName)}" style="display:block;border:0;max-width:120px;height:auto;">`
    : `<span style="font-family:${FONT};font-size:16px;line-height:24px;font-weight:700;color:${COLOR.ink};">${escapeHtml(brand.merchantName)}</span>`;
  return `<tr>
    <td style="padding:24px ${PAD};border-bottom:1px solid ${COLOR.hairlineSoft};">${mark}</td>
  </tr>`;
}

function footer(brand: EmailBrand, why: string): string {
  // Deliberately not "reply to this email" — transactional mail often sends
  // from an unmonitored address, and the merchant's own footer message
  // frequently says it already.
  const support = brand.supportEmail
    ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};">Questions? Contact <a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:${COLOR.muted};">${escapeHtml(brand.supportEmail)}</a>.</p>`
    : '';
  const custom = brand.footerMessage
    ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};">${escapeHtml(brand.footerMessage)}</p>`
    : '';
  const postal = brand.postalAddress
    ? `<p style="margin:0 0 8px;font-family:${FONT};font-size:11px;line-height:17px;color:${COLOR.faint};">${escapeHtml(brand.postalAddress)}</p>`
    : '';

  return `<tr>
    <td style="padding:20px ${PAD} 28px;border-top:1px solid ${COLOR.hairlineSoft};">
      ${custom}
      ${support}
      <p style="margin:0;font-family:${FONT};font-size:11px;line-height:17px;color:${COLOR.faint};">${escapeHtml(why)}</p>
      ${postal}
    </td>
  </tr>`;
}

/**
 * Wraps sections in the outer shell.
 *
 * `why` explains to the recipient why this landed in their inbox — the single
 * most effective thing a transactional email can do to not read like phishing,
 * which matters doubly when the subject is money.
 */
export function shell(opts: {
  brand: EmailBrand;
  preheaderText: string;
  sections: string;
  why: string;
  title: string;
}): string {
  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(opts.title)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    /* The one place a media query is worth trying: phones below the card width. */
    @media only screen and (max-width:620px) {
      .cp-card { width:100% !important; border-radius:0 !important; border-left:0 !important; border-right:0 !important; }
      .cp-pad { padding-left:20px !important; padding-right:20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${COLOR.canvas};-webkit-font-smoothing:antialiased;">
  ${preheader(opts.preheaderText)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${COLOR.canvas};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" class="cp-card" width="${WIDTH}" cellpadding="0" cellspacing="0" border="0" style="width:${WIDTH}px;max-width:${WIDTH}px;background:${COLOR.surface};border:1px solid ${COLOR.hairline};border-radius:14px;border-collapse:separate;overflow:hidden;">
          ${header(opts.brand)}
          ${opts.sections}
          ${footer(opts.brand, opts.why)}
        </table>
        <p style="margin:16px auto 0;font-family:${FONT};font-size:11px;line-height:17px;color:${COLOR.faint};">
          Payments secured by Chain Payments
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Assembles the plain-text alternative, trimming blank runs. */
export function plainText(lines: (string | null | false | undefined)[]): string {
  return lines
    .filter((l): l is string => typeof l === 'string')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
