import { TERMS_OF_SERVICE } from '@/lib/legal-content';
import { LegalDocumentPage } from '../legal-document';

export const metadata = {
  title: 'Terms of Service — Chain Payments',
  description:
    'The agreement governing use of Chain Payments, including its non-custodial nature, blockchain risks, and limitations of liability.',
};

export default function TermsPage() {
  return <LegalDocumentPage doc={TERMS_OF_SERVICE} />;
}
