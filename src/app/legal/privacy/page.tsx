import { PRIVACY_POLICY } from '@/lib/legal-content';
import { LegalDocumentPage } from '../legal-document';

export const metadata = {
  title: 'Privacy Policy — Chain Payments',
  description:
    'How Chain Payments collects, uses, shares, and protects personal information, including what blockchain immutability means for your data rights.',
};

export default function PrivacyPage() {
  return <LegalDocumentPage doc={PRIVACY_POLICY} />;
}
