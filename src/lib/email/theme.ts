/**
 * Design tokens for transactional email.
 *
 * Email is not the web. There is no stylesheet, no flexbox, no custom
 * properties, and no reliable media queries — every value here gets inlined
 * into a `style` attribute on a table cell. Keeping the palette in one place is
 * the only way four templates stay visually identical.
 */

export const COLOR = {
  ink: '#111827',
  body: '#374151',
  muted: '#6b7280',
  faint: '#9ca3af',
  hairline: '#e5e7eb',
  hairlineSoft: '#f3f4f6',
  surface: '#ffffff',
  canvas: '#f4f5f7',
  brand: '#2563eb',
  brandInk: '#ffffff',
  positive: '#047857',
  positiveWash: '#ecfdf5',
  positiveEdge: '#a7f3d0',
  warning: '#b45309',
  warningWash: '#fffbeb',
  warningEdge: '#fde68a',
  danger: '#b91c1c',
  dangerWash: '#fef2f2',
  dangerEdge: '#fecaca',
} as const;

/**
 * Two stacks, both ending in a generic family. Outlook on Windows ignores web
 * fonts entirely, so the first *installed* face is what most recipients see.
 */
export const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
export const FONT_MONO =
  "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

export const WIDTH = 600;

export type Tone = 'neutral' | 'positive' | 'warning' | 'danger';

export const TONE: Record<Tone, { wash: string; edge: string; ink: string }> = {
  neutral: { wash: COLOR.hairlineSoft, edge: COLOR.hairline, ink: COLOR.body },
  positive: { wash: COLOR.positiveWash, edge: COLOR.positiveEdge, ink: COLOR.positive },
  warning: { wash: COLOR.warningWash, edge: COLOR.warningEdge, ink: COLOR.warning },
  danger: { wash: COLOR.dangerWash, edge: COLOR.dangerEdge, ink: COLOR.danger },
};

/** Brand and contact details a merchant controls, applied to every template. */
export interface EmailBrand {
  merchantName: string;
  /** Hex, used for the primary button and accents. */
  brandColor: string;
  logoUrl?: string | null;
  supportEmail?: string | null;
  /** Appended above the Chain Payments line. */
  footerMessage?: string | null;
  /** Postal address. Not legally required for transactional mail, but reassuring. */
  postalAddress?: string | null;
}

export const DEFAULT_BRAND: EmailBrand = {
  merchantName: 'Acme Corp',
  brandColor: COLOR.brand,
  logoUrl: null,
  supportEmail: 'support@acme.com',
  footerMessage: null,
  postalAddress: null,
};
