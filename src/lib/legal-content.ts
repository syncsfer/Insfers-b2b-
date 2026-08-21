/**
 * Legal document content.
 *
 * DRAFTING NOTE — these documents are templates. Every `[BRACKETED]` value is a
 * decision that requires qualified counsel and cannot be guessed: the operating
 * entity, its jurisdiction, licensing posture, arbitration forum, and which
 * privacy regimes apply. See `LEGAL_REVIEW_NOTES` for the specific items.
 */

export interface LegalClause {
  /** e.g. "3.2" */
  number: string;
  heading: string;
  body?: string[];
  bullets?: string[];
  /** Emphasised box — used for the clauses a court would expect to be conspicuous. */
  callout?: { tone: 'info' | 'warn'; text: string };
}

export interface LegalSection {
  number: string;
  heading: string;
  clauses: LegalClause[];
}

export interface LegalDocument {
  slug: 'privacy' | 'terms';
  title: string;
  subtitle: string;
  lastUpdated: string;
  effectiveDate: string;
  preamble: string[];
  sections: LegalSection[];
}

const COMPANY = '[COMPANY LEGAL NAME]';
const PRODUCT = 'Chain Payments';
const JURISDICTION = '[STATE / COUNTRY]';

// ---------------------------------------------------------------------------
// PRIVACY POLICY
// ---------------------------------------------------------------------------

export const PRIVACY_POLICY: LegalDocument = {
  slug: 'privacy',
  title: 'Privacy Policy',
  subtitle:
    'How we collect, use, share, and protect personal information when you use Chain Payments.',
  lastUpdated: '[DATE]',
  effectiveDate: '[DATE]',
  preamble: [
    `This Privacy Policy explains how ${COMPANY} ("${PRODUCT}", "we", "us", or "our") collects, uses, discloses, and safeguards personal information in connection with the ${PRODUCT} platform, websites, APIs, and related services (collectively, the "Services").`,
    `Please read this Policy carefully. Because ${PRODUCT} facilitates settlement on public blockchain networks, certain information you generate through the Services is recorded permanently and publicly, and cannot be altered or erased by us or by anyone else. Section 4 explains this in detail, and it is the single most important part of this Policy to understand before you transact.`,
  ],
  sections: [
    {
      number: '1',
      heading: 'Scope and Roles',
      clauses: [
        {
          number: '1.1',
          heading: 'Who this Policy covers',
          body: [
            'This Policy applies to merchants and other business users who register for an account ("Merchants"), individuals who transact with a Merchant through the Services ("Payers"), visitors to our websites, and developers who access our APIs.',
          ],
        },
        {
          number: '1.2',
          heading: 'Controller and processor roles',
          body: [
            `Where we determine the purposes and means of processing — for example, operating Merchant accounts, securing the platform, and meeting our own legal obligations — ${COMPANY} acts as a data controller (or "business", where applicable law uses that term).`,
            'Where we process personal information on a Merchant\'s behalf and under its instructions — for example, storing customer email addresses that a Merchant supplies for receipts and invoices — we act as a processor (or "service provider"), and the Merchant is the controller. In those cases the Merchant is responsible for having a lawful basis to provide that information to us and for responding to its own customers\' requests.',
          ],
        },
        {
          number: '1.3',
          heading: 'Contact details',
          body: [
            `Controller: ${COMPANY}, [REGISTERED ADDRESS].`,
            'Privacy enquiries: [PRIVACY EMAIL]. Data Protection Officer / EU-UK representative, where one is appointed: [DPO CONTACT].',
          ],
        },
      ],
    },
    {
      number: '2',
      heading: 'Information We Collect',
      clauses: [
        {
          number: '2.1',
          heading: 'Information you provide directly',
          bullets: [
            'Account information — name, business name, email address, password credentials, and business website.',
            'Business verification information — where identity or business verification is required, this may include company registration details, beneficial ownership information, government-issued identification, and supporting documentation.',
            'Settlement configuration — blockchain wallet addresses you designate to receive funds, and the networks you enable.',
            'Commercial content — catalog items, prices, invoices, memos, customer email addresses you enter, and descriptions you attach to payments.',
            'Support communications — the contents of messages you send us, and records of our correspondence.',
          ],
        },
        {
          number: '2.2',
          heading: 'Information generated through your use of the Services',
          bullets: [
            'Transaction records — amounts, currencies, networks, timestamps, status, transaction hashes, wallet addresses, and associated fees.',
            'Refund and claim records — refund amounts and reasons, claim link status, expiry, and the address a refund was claimed to.',
            'Automated-agent activity — where you configure automated agents, records of the actions those agents take on your behalf and the wallets they use.',
            'Product usage — pages viewed, features used, API calls made, and webhook deliveries and their outcomes.',
          ],
        },
        {
          number: '2.3',
          heading: 'Information collected automatically',
          bullets: [
            'Device and connection information — IP address, browser type and version, operating system, and language preferences.',
            'Log data — access times, referring pages, and error diagnostics.',
            'Local storage — data stored in your browser to keep you signed in and to remember interface preferences. See Section 9.',
          ],
        },
        {
          number: '2.4',
          heading: 'Information from third parties',
          bullets: [
            'Identity and sanctions screening providers, where verification or compliance screening is performed.',
            'Blockchain analytics providers, used to assess transaction risk and to comply with sanctions obligations.',
            'Infrastructure providers, including blockchain node operators and RPC providers that relay transactions.',
          ],
        },
        {
          number: '2.5',
          heading: 'Information we do not collect',
          body: [
            'We do not collect or store your wallet\'s private keys, seed phrases, or recovery phrases. Anyone asking you for those — including anyone claiming to represent us — is attempting to defraud you.',
          ],
          callout: {
            tone: 'warn',
            text: 'We will never ask for your private key, seed phrase, or recovery phrase. Treat any such request as fraudulent and report it to [SECURITY EMAIL].',
          },
        },
      ],
    },
    {
      number: '3',
      heading: 'How We Use Information',
      clauses: [
        {
          number: '3.1',
          heading: 'Purposes',
          bullets: [
            'To provide the Services — creating and settling payments, issuing refunds, generating invoices and receipts, and maintaining your account.',
            'To communicate with you — transactional notices, receipts, service updates, and responses to support requests.',
            'To secure the platform — detecting and preventing fraud, abuse, unauthorised access, and other harmful activity.',
            'To comply with law — meeting anti-money-laundering, counter-terrorist-financing, sanctions, tax, and records obligations that apply to us.',
            'To improve the Services — understanding how features are used, diagnosing faults, and developing new functionality.',
            'To enforce our agreements — including investigating suspected breaches of our Terms of Service.',
          ],
        },
        {
          number: '3.2',
          heading: 'Legal bases (EEA and UK)',
          body: [
            'Where the EU or UK General Data Protection Regulation applies, we rely on the following legal bases:',
          ],
          bullets: [
            'Performance of a contract — to provide the Services you have requested and to administer your account.',
            'Legal obligation — to comply with financial-crime, sanctions, tax, and accounting requirements.',
            'Legitimate interests — to secure the platform, prevent fraud, improve the Services, and communicate about them, where those interests are not overridden by your rights.',
            'Consent — for optional communications and any non-essential analytics, which you may withdraw at any time.',
          ],
        },
        {
          number: '3.3',
          heading: 'No sale of personal information',
          body: [
            'We do not sell personal information, and we do not share personal information for cross-context behavioural advertising, as those terms are defined under applicable United States state privacy laws.',
          ],
        },
      ],
    },
    {
      number: '4',
      heading: 'Blockchain Data: Public and Permanent',
      clauses: [
        {
          number: '4.1',
          heading: 'What is recorded on-chain',
          body: [
            'The Services settle payments on public blockchain networks. When a transaction settles, the sending address, receiving address, amount, token, and timestamp are recorded on that network. This record is created by the network, not by us.',
          ],
        },
        {
          number: '4.2',
          heading: 'On-chain data cannot be deleted or corrected',
          body: [
            'Public blockchains are append-only and are maintained by independent participants worldwide. Once a transaction is confirmed, neither we nor you nor any other party can modify, delete, or restrict access to that record. It is visible to anyone, may be copied and indexed by third parties, and will in all likelihood persist indefinitely.',
            'This is an inherent property of the technology. It means that certain rights described in Section 8 — in particular erasure and rectification — cannot be given effect in respect of information already recorded on a public network, however validly they are exercised against our own systems.',
          ],
          callout: {
            tone: 'warn',
            text: 'Before transacting, understand that on-chain records are permanent and public. Wallet addresses can, in combination with other information, identify individuals. Do not use the Services in a way that would place information on-chain that you are unwilling to have published permanently.',
          },
        },
        {
          number: '4.3',
          heading: 'Wallet addresses as personal information',
          body: [
            'A wallet address may constitute personal information where it can be linked, directly or indirectly, to an identifiable person. We treat wallet addresses held in our own systems accordingly, and apply this Policy to them. We cannot extend that treatment to copies of the same address held on public networks or by third parties.',
          ],
        },
      ],
    },
    {
      number: '5',
      heading: 'How We Share Information',
      clauses: [
        {
          number: '5.1',
          heading: 'Service providers',
          body: [
            'We share information with vendors who process it on our behalf under written terms that restrict their use of it, including hosting and infrastructure providers, communications and email delivery providers, identity verification and screening providers, blockchain node and analytics providers, and customer support tooling.',
          ],
        },
        {
          number: '5.2',
          heading: 'Between Merchants and Payers',
          body: [
            'Where a Payer transacts with a Merchant, we share information between them as necessary to complete and evidence the transaction — for example, providing a Merchant with the payment details and any email address supplied at checkout, and providing a Payer with a receipt identifying the Merchant.',
          ],
        },
        {
          number: '5.3',
          heading: 'Legal and compliance disclosures',
          body: [
            'We may disclose information where we believe in good faith that disclosure is required to comply with applicable law, regulation, legal process, or an enforceable governmental request; to enforce our agreements; or to detect, prevent, or address fraud, security, or technical issues.',
            'Where we are legally permitted to notify you of such a request before responding, our practice is to do so.',
          ],
        },
        {
          number: '5.4',
          heading: 'Corporate transactions',
          body: [
            'If we are involved in a merger, acquisition, financing, reorganisation, or sale of assets, information may be transferred as part of that transaction. We will require the recipient to honour this Policy, or give you notice and an opportunity to object where the law requires it.',
          ],
        },
      ],
    },
    {
      number: '6',
      heading: 'International Transfers',
      clauses: [
        {
          number: '6.1',
          heading: 'Where information is processed',
          body: [
            'We and our service providers process information in [PRIMARY PROCESSING LOCATIONS]. Public blockchain networks are, by design, operated globally, and data recorded on them is replicated across jurisdictions without our involvement or control.',
          ],
        },
        {
          number: '6.2',
          heading: 'Transfer safeguards',
          body: [
            'Where we transfer personal information out of the EEA, the UK, or another jurisdiction that restricts transfers, we rely on an adequacy decision where one applies, or otherwise on Standard Contractual Clauses or an equivalent approved mechanism, together with supplementary measures where appropriate. You may request a copy of the relevant safeguards at [PRIVACY EMAIL].',
          ],
        },
      ],
    },
    {
      number: '7',
      heading: 'Retention',
      clauses: [
        {
          number: '7.1',
          heading: 'How long we keep information',
          body: [
            'We retain personal information for as long as needed to provide the Services and for the period required by law. Financial and transaction records are typically retained for [RETENTION PERIOD — commonly five to seven years] following the end of the relationship, to satisfy anti-money-laundering, tax, and accounting requirements.',
            'When information is no longer required, we delete it or irreversibly anonymise it. Information recorded on a public blockchain is outside this process, for the reasons given in Section 4.',
          ],
        },
      ],
    },
    {
      number: '8',
      heading: 'Your Rights',
      clauses: [
        {
          number: '8.1',
          heading: 'Rights you may have',
          body: [
            'Depending on where you live, you may have some or all of the following rights in respect of personal information we hold about you:',
          ],
          bullets: [
            'Access — to obtain confirmation of whether we process your information, and a copy of it.',
            'Rectification — to have inaccurate information corrected.',
            'Erasure — to have information deleted in certain circumstances.',
            'Restriction and objection — to limit or object to certain processing, including processing based on legitimate interests.',
            'Portability — to receive certain information in a structured, machine-readable format.',
            'Withdrawal of consent — where processing is based on consent, at any time and without affecting prior processing.',
            'Non-discrimination — to exercise these rights without receiving a degraded service, where applicable law so provides.',
          ],
        },
        {
          number: '8.2',
          heading: 'Limits arising from blockchain and legal obligations',
          body: [
            'Two limits apply to these rights and we want to be explicit about both. First, we cannot delete, correct, or restrict information recorded on a public blockchain, because we do not control those networks. Second, we may be legally required to retain certain records notwithstanding a deletion request, in which case we will retain only what the law requires and restrict its use accordingly.',
          ],
        },
        {
          number: '8.3',
          heading: 'How to exercise your rights',
          body: [
            'Contact [PRIVACY EMAIL]. We will respond within the period required by applicable law. We may need to verify your identity before acting, and we may decline requests that are manifestly unfounded or excessive, giving reasons.',
            'If you transact with a Merchant and your request concerns information that Merchant provided to us, please direct your request to that Merchant, who is the controller of it. We will assist them in responding.',
          ],
        },
        {
          number: '8.4',
          heading: 'Complaints',
          body: [
            'You may lodge a complaint with your local supervisory authority. In the EEA this is your national data protection authority; in the UK, the Information Commissioner\'s Office. We would appreciate the chance to address your concern first.',
          ],
        },
      ],
    },
    {
      number: '9',
      heading: 'Cookies and Local Storage',
      clauses: [
        {
          number: '9.1',
          heading: 'What we use',
          bullets: [
            'Strictly necessary — session and authentication cookies, and browser local storage used to keep you signed in and to remember interface preferences. These cannot be disabled without breaking the Services.',
            'Analytics — where used, to understand aggregate feature usage and diagnose faults. [CONFIRM ANALYTICS VENDORS, IF ANY.]',
          ],
        },
        {
          number: '9.2',
          heading: 'Your choices',
          body: [
            'Most browsers let you block or delete cookies and clear local storage. Doing so will sign you out and reset your preferences. Where the law requires consent for non-essential cookies, we obtain it before setting them.',
          ],
        },
      ],
    },
    {
      number: '10',
      heading: 'Security',
      clauses: [
        {
          number: '10.1',
          heading: 'Our measures',
          body: [
            'We maintain administrative, technical, and physical safeguards designed to protect personal information, including encryption of data in transit and at rest, access controls and least-privilege provisioning, logging and monitoring, and periodic review of our controls.',
            'No system is perfectly secure. We cannot guarantee absolute security, and you share information with us at your own risk.',
          ],
        },
        {
          number: '10.2',
          heading: 'Your responsibilities',
          body: [
            'You are responsible for safeguarding your account credentials, API keys, and the private keys to any wallet you use with the Services. Loss of a private key results in permanent, irreversible loss of the assets it controls, and we cannot restore access.',
          ],
        },
        {
          number: '10.3',
          heading: 'Breach notification',
          body: [
            'Where a personal data breach is likely to result in a risk to your rights and freedoms, we will notify the relevant supervisory authority and, where required, affected individuals, within the timeframes set by applicable law.',
          ],
        },
      ],
    },
    {
      number: '11',
      heading: 'Children',
      clauses: [
        {
          number: '11.1',
          heading: 'Age restriction',
          body: [
            'The Services are intended for businesses and for individuals aged 18 or over. We do not knowingly collect personal information from children. If you believe a child has provided us with information, contact [PRIVACY EMAIL] and we will delete it.',
          ],
        },
      ],
    },
    {
      number: '12',
      heading: 'Changes to this Policy',
      clauses: [
        {
          number: '12.1',
          heading: 'How we notify you',
          body: [
            'We may update this Policy from time to time. We will post the updated version with a revised "Last updated" date and, where changes are material, provide additional notice by email or in the product before they take effect. Continuing to use the Services after an update takes effect indicates acceptance of the revised Policy.',
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// TERMS OF SERVICE
// ---------------------------------------------------------------------------

export const TERMS_OF_SERVICE: LegalDocument = {
  slug: 'terms',
  title: 'Terms of Service',
  subtitle:
    'The agreement governing your use of Chain Payments, including the limits of what we do and do not do with your money.',
  lastUpdated: '[DATE]',
  effectiveDate: '[DATE]',
  preamble: [
    `These Terms of Service (the "Terms") form a binding agreement between you and ${COMPANY} ("${PRODUCT}", "we", "us", or "our") governing your access to and use of the ${PRODUCT} platform, websites, APIs, and related services (the "Services").`,
    'By creating an account, accessing, or using the Services, you agree to these Terms. If you are agreeing on behalf of a company or other legal entity, you represent that you have authority to bind that entity, and "you" refers to that entity.',
    'Please read Section 5 (Non-Custodial Service), Section 10 (Blockchain and Stablecoin Risks), Section 15 (Disclaimers), Section 16 (Limitation of Liability), and Section 19 (Dispute Resolution) carefully. They limit our obligations to you, allocate risk that you bear, and may affect how disputes between us are resolved.',
  ],
  sections: [
    {
      number: '1',
      heading: 'Definitions',
      clauses: [
        {
          number: '1.1',
          heading: 'Defined terms',
          bullets: [
            '"Merchant" means a business or individual that registers an account to accept or send payments through the Services.',
            '"Payer" means a person who sends funds to a Merchant using the Services.',
            '"Supported Stablecoin" means a digital asset we make available through the Services, currently including USDC, EURC, JPYC, and HTGC, as updated from time to time.',
            '"Supported Network" means a blockchain network we make available for settlement, currently including Base, Ethereum, Polygon, Arbitrum, and Optimism.',
            '"Settlement Wallet" means a blockchain address you designate to receive funds.',
            '"Claim Link" means a link that allows a recipient to withdraw a refund to an address of their choosing.',
            '"Automated Agent" means a software agent you configure to perform actions through the Services on your behalf.',
          ],
        },
      ],
    },
    {
      number: '2',
      heading: 'Eligibility and Registration',
      clauses: [
        {
          number: '2.1',
          heading: 'Eligibility',
          body: [
            'You must be at least 18 years old and capable of forming a binding contract. You must not be located in, organised under the laws of, or ordinarily resident in a jurisdiction subject to comprehensive sanctions, and must not be a person with whom dealings are prohibited under applicable sanctions programmes.',
          ],
        },
        {
          number: '2.2',
          heading: 'Verification',
          body: [
            'We may require identity and business verification before or during your use of the Services, and may suspend or limit access pending its completion. You agree to provide accurate, current, and complete information and to keep it updated.',
          ],
        },
        {
          number: '2.3',
          heading: 'Account security',
          body: [
            'You are responsible for all activity under your account, including actions taken by your team members, by your Automated Agents, and by anyone using your API keys. Notify us immediately at [SECURITY EMAIL] if you suspect unauthorised access.',
          ],
        },
      ],
    },
    {
      number: '3',
      heading: 'The Services',
      clauses: [
        {
          number: '3.1',
          heading: 'What we provide',
          body: [
            'The Services provide software that helps you request, receive, send, and record payments denominated in Supported Stablecoins on Supported Networks, together with related tooling including checkout pages, payment links, invoices, a product catalog, refunds, receipts, reporting, and APIs.',
          ],
        },
        {
          number: '3.2',
          heading: 'Changes to the Services',
          body: [
            'We may add, modify, or discontinue features, Supported Stablecoins, or Supported Networks. Where a change would materially and adversely affect your use, we will give reasonable advance notice where practicable.',
          ],
        },
        {
          number: '3.3',
          heading: 'Test mode',
          body: [
            'Test mode uses test networks and test credentials, and involves no real funds. Do not rely on test-mode behaviour as a guarantee of live-mode outcomes.',
          ],
        },
      ],
    },
    {
      number: '4',
      heading: 'Fees',
      clauses: [
        {
          number: '4.1',
          heading: 'Platform fees',
          body: [
            'We charge the fees set out at [PRICING PAGE URL], currently a platform fee of [FEE]% of each processed payment. Fees are exclusive of taxes, which you are responsible for where applicable.',
          ],
        },
        {
          number: '4.2',
          heading: 'Network fees',
          body: [
            'Blockchain networks charge fees ("gas") that are set by the network and paid to network validators, not to us. These vary with network conditions and are your responsibility. We do not control them and cannot refund them.',
          ],
        },
        {
          number: '4.3',
          heading: 'Fee changes',
          body: [
            'We may change our fees on [NOTICE PERIOD] notice. Continued use after a change takes effect constitutes acceptance.',
          ],
        },
      ],
    },
    {
      number: '5',
      heading: 'Non-Custodial Service',
      clauses: [
        {
          number: '5.1',
          heading: 'We do not hold your funds',
          body: [
            'The Services are non-custodial. Funds move directly between blockchain addresses controlled by you and by your counterparties. We do not take possession or control of your funds, do not hold balances on your behalf, and do not act as a bank, trustee, escrow agent, or fiduciary.',
          ],
          callout: {
            tone: 'warn',
            text: 'Because we never hold your funds, we cannot reverse a transaction, recover funds sent to a wrong address, restore access to a lost private key, or return assets sent on an unsupported network. These outcomes are permanent.',
          },
        },
        {
          number: '5.2',
          heading: 'You control your wallets',
          body: [
            'You are solely responsible for the security and operation of your wallets, including safeguarding private keys and seed phrases, and for verifying every address before transacting.',
          ],
        },
        {
          number: '5.3',
          heading: 'Regulatory status',
          body: [
            'We provide software. Nothing in the Services constitutes banking, money transmission, custody, investment advice, or brokerage, and we do not offer those services. [CONFIRM WITH COUNSEL WHETHER LICENSING OBLIGATIONS ARISE IN EACH OPERATING JURISDICTION — THIS CLAUSE DOES NOT BY ITSELF DETERMINE REGULATORY STATUS.]',
          ],
        },
      ],
    },
    {
      number: '6',
      heading: 'Merchant Obligations',
      clauses: [
        {
          number: '6.1',
          heading: 'Your business and your customers',
          bullets: [
            'You are solely responsible for the goods and services you sell, their description, delivery, and quality.',
            'You are responsible for your own relationship with your customers, including your refund, cancellation, and privacy policies.',
            'You must accurately describe what a customer is paying for, and must not misrepresent your identity or your business.',
            'You must comply with all laws applicable to your business, including consumer protection, tax, and data protection law.',
          ],
        },
        {
          number: '6.2',
          heading: 'Data you provide to us',
          body: [
            'Where you supply personal information about your customers — for example email addresses for receipts or invoices — you represent that you have a lawful basis to do so and that our processing on your instructions will not cause you or us to breach applicable law.',
          ],
        },
      ],
    },
    {
      number: '7',
      heading: 'Prohibited Uses',
      clauses: [
        {
          number: '7.1',
          heading: 'You must not use the Services',
          bullets: [
            'For any unlawful purpose, or to facilitate a transaction that is unlawful in any applicable jurisdiction.',
            'To launder money, finance terrorism, evade sanctions, or conceal the origin of funds.',
            'To transact with any person or jurisdiction subject to sanctions administered by [RELEVANT SANCTIONS AUTHORITIES].',
            'To defraud any person, or to sell goods or services you cannot or do not intend to provide.',
            'To infringe intellectual property, publicity, or privacy rights.',
            'To interfere with, probe, or attempt to gain unauthorised access to the Services or any related system.',
            'To circumvent rate limits, access controls, or security measures, or to use the Services to build a competing product.',
            'For any activity we identify as restricted at [ACCEPTABLE USE POLICY URL].',
          ],
        },
        {
          number: '7.2',
          heading: 'Enforcement',
          body: [
            'We may investigate suspected breaches and may suspend or terminate access, refuse to process transactions, or report activity to authorities. Where we can do so lawfully and safely, we will tell you why.',
          ],
        },
      ],
    },
    {
      number: '8',
      heading: 'Payments and Settlement',
      clauses: [
        {
          number: '8.1',
          heading: 'Finality',
          body: [
            'Blockchain transactions are final once confirmed. There is no chargeback mechanism, and no ability to reverse a confirmed transfer. Any remedy between you and your counterparty is a matter between you.',
          ],
        },
        {
          number: '8.2',
          heading: 'Currency and network matching',
          body: [
            'Each Supported Stablecoin settles only on the networks that carry it. Sending an asset on a network that does not support it, or to an address that cannot receive it, will in most cases result in permanent loss. You are responsible for selecting the correct asset and network.',
          ],
        },
        {
          number: '8.3',
          heading: 'No conversion without instruction',
          body: [
            'We do not convert between currencies unless you expressly instruct it. Where the Services display a combined figure across currencies, that figure is an approximate indicative equivalent for presentation only, is not a quoted rate, and must not be relied upon for accounting, tax, or settlement.',
          ],
        },
      ],
    },
    {
      number: '9',
      heading: 'Refunds and Claim Links',
      clauses: [
        {
          number: '9.1',
          heading: 'Refunds are yours to decide',
          body: [
            'Refund policy is a matter between you and your customer. We provide tooling to execute refunds you decide to make; we do not adjudicate disputes between you and your customers and are not a party to them.',
          ],
        },
        {
          number: '9.2',
          heading: 'Claim Links are bearer instruments',
          body: [
            'A Claim Link allows whoever holds it to withdraw the associated funds to an address of their choosing. It is not authenticated against a particular person. You are responsible for transmitting a Claim Link only to its intended recipient and through a channel you consider adequately secure.',
          ],
          callout: {
            tone: 'warn',
            text: 'Anyone who obtains a Claim Link can claim the funds. Treat it as you would cash or a bearer cheque. We cannot recover funds claimed by an unintended recipient.',
          },
        },
        {
          number: '9.3',
          heading: 'Expiry',
          body: [
            'Claim Links expire after the period shown at the time of issue. Funds not claimed before expiry return to the wallet from which they were reserved. You may revoke an unclaimed link before expiry.',
          ],
        },
      ],
    },
    {
      number: '10',
      heading: 'Blockchain and Stablecoin Risks',
      clauses: [
        {
          number: '10.1',
          heading: 'Risks you accept',
          body: [
            'You acknowledge and accept the following risks, which are inherent to the technology and are outside our control:',
          ],
          bullets: [
            'Network risk — congestion, forks, reorganisations, outages, or changes in protocol rules may delay, alter, or prevent settlement.',
            'Smart contract risk — contracts, including those of stablecoin issuers and of third parties, may contain vulnerabilities that result in loss.',
            'Issuer risk — a Supported Stablecoin depends on its issuer maintaining backing and redeemability. An issuer may fail, may lose its peg, may freeze or blacklist addresses, or may cease operating. We do not issue any Supported Stablecoin and do not guarantee its value, backing, or convertibility.',
            'Irreversibility — transfers cannot be undone, and funds sent in error are generally unrecoverable.',
            'Key loss — loss of a private key results in permanent loss of the assets it controls.',
            'Regulatory risk — changes in law may restrict or prohibit the use of particular assets, networks, or the Services in your jurisdiction.',
          ],
        },
        {
          number: '10.2',
          heading: 'No guarantee of value',
          body: [
            'Stablecoins are designed to track a reference currency but may deviate from it. We make no representation that any Supported Stablecoin will maintain its peg or be redeemable at any particular value.',
          ],
        },
      ],
    },
    {
      number: '11',
      heading: 'Automated Agents',
      clauses: [
        {
          number: '11.1',
          heading: 'You are responsible for what your agents do',
          body: [
            'Where you configure an Automated Agent, its actions are your actions. You are bound by them, and you are responsible for the capabilities, spending limits, and wallet funding you assign. You should review agent activity regularly.',
          ],
        },
        {
          number: '11.2',
          heading: 'No warranty of agent behaviour',
          body: [
            'Automated systems may act unexpectedly. We do not warrant that an Automated Agent will behave as you intend, and we are not liable for the consequences of actions taken within the permissions you granted it.',
          ],
        },
      ],
    },
    {
      number: '12',
      heading: 'API and Developer Terms',
      clauses: [
        {
          number: '12.1',
          heading: 'Use of the API',
          bullets: [
            'Keep secret keys confidential and server-side. You are responsible for all activity under your keys.',
            'Respect rate limits and do not attempt to circumvent them.',
            'Verify webhook signatures before acting on a payload, and design handlers to be idempotent, since delivery is at-least-once.',
            'Do not use the API to build a product that substantially replicates the Services.',
          ],
        },
        {
          number: '12.2',
          heading: 'Changes to the API',
          body: [
            'We may version, change, or deprecate API endpoints. We will give reasonable notice of breaking changes where practicable, except where a change is required urgently for security or legal reasons.',
          ],
        },
      ],
    },
    {
      number: '13',
      heading: 'Intellectual Property',
      clauses: [
        {
          number: '13.1',
          heading: 'Our rights',
          body: [
            `The Services, including all software, documentation, designs, and trademarks, are owned by ${COMPANY} or its licensors. We grant you a limited, non-exclusive, non-transferable, revocable licence to use the Services in accordance with these Terms. No other rights are granted.`,
          ],
        },
        {
          number: '13.2',
          heading: 'Your content',
          body: [
            'You retain ownership of the content you provide. You grant us a licence to host, process, and display it as necessary to provide the Services, and to use aggregated, de-identified data to operate and improve them.',
          ],
        },
        {
          number: '13.3',
          heading: 'Feedback',
          body: [
            'If you send us suggestions, we may use them without restriction or compensation.',
          ],
        },
      ],
    },
    {
      number: '14',
      heading: 'Third-Party Services',
      clauses: [
        {
          number: '14.1',
          heading: 'Not our responsibility',
          body: [
            'The Services interact with third-party systems including blockchain networks, wallet providers, stablecoin issuers, and node operators. We do not control them, do not endorse them, and are not responsible for their acts, omissions, availability, or terms.',
          ],
        },
      ],
    },
    {
      number: '15',
      heading: 'Disclaimers',
      clauses: [
        {
          number: '15.1',
          heading: 'Services provided "as is"',
          body: [
            'TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.',
            'WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT ANY TRANSACTION WILL SETTLE WITHIN A PARTICULAR TIME.',
          ],
        },
        {
          number: '15.2',
          heading: 'Consumer rights preserved',
          body: [
            'Some jurisdictions do not allow the exclusion of certain warranties. Where that is the case, the exclusions above apply only to the extent permitted, and nothing in these Terms limits rights you have as a consumer that cannot lawfully be limited.',
          ],
        },
      ],
    },
    {
      number: '16',
      heading: 'Limitation of Liability',
      clauses: [
        {
          number: '16.1',
          heading: 'Excluded losses',
          body: [
            'TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATING TO THE SERVICES.',
          ],
        },
        {
          number: '16.2',
          heading: 'Liability cap',
          body: [
            'OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES WILL NOT EXCEED THE GREATER OF (A) THE PLATFORM FEES YOU PAID US IN THE [TWELVE] MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, AND (B) [AMOUNT].',
          ],
        },
        {
          number: '16.3',
          heading: 'Losses we cannot be liable for',
          body: [
            'Without limiting the above, we are not liable for loss arising from: funds sent to an incorrect or unsupported address or network; loss or compromise of your private keys or credentials; the acts or omissions of a stablecoin issuer, blockchain network, or other third party; the depegging or failure of any stablecoin; actions taken by your Automated Agents within the permissions you granted; or disclosure of a Claim Link to an unintended recipient.',
          ],
        },
        {
          number: '16.4',
          heading: 'Exceptions',
          body: [
            'Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for any liability that cannot lawfully be excluded.',
          ],
        },
      ],
    },
    {
      number: '17',
      heading: 'Indemnification',
      clauses: [
        {
          number: '17.1',
          heading: 'Your indemnity',
          body: [
            'You will indemnify and hold harmless ' + COMPANY + ', its affiliates, and their officers, directors, employees, and agents from any claim, demand, loss, liability, or expense (including reasonable legal fees) arising out of your use of the Services, your breach of these Terms, your violation of law, your relationship with your customers, or content you provide.',
          ],
        },
      ],
    },
    {
      number: '18',
      heading: 'Term, Suspension, and Termination',
      clauses: [
        {
          number: '18.1',
          heading: 'Termination by you',
          body: [
            'You may stop using the Services and close your account at any time. Closing your account does not affect transactions already settled on-chain.',
          ],
        },
        {
          number: '18.2',
          heading: 'Suspension and termination by us',
          body: [
            'We may suspend or terminate your access, with or without notice, where we reasonably believe you have breached these Terms, where required by law, where necessary to prevent harm to us or others, or where continuing to provide the Services would expose us to unacceptable legal or regulatory risk.',
          ],
        },
        {
          number: '18.3',
          heading: 'Effect of termination',
          body: [
            'On termination your licence to use the Services ends. Sections that by their nature should survive — including Sections 13, 15, 16, 17, 19, and 20 — survive termination.',
          ],
        },
      ],
    },
    {
      number: '19',
      heading: 'Dispute Resolution',
      clauses: [
        {
          number: '19.1',
          heading: 'Informal resolution first',
          body: [
            'Before commencing formal proceedings, you agree to contact us at [LEGAL EMAIL] and attempt in good faith to resolve the dispute for at least [30] days.',
          ],
        },
        {
          number: '19.2',
          heading: 'Arbitration',
          body: [
            'Any dispute not resolved informally will be finally settled by binding arbitration administered by [ARBITRATION BODY] under its rules then in effect. The seat of arbitration is [SEAT], the language is [LANGUAGE], and the tribunal comprises [NUMBER] arbitrator(s). Judgment on the award may be entered in any court of competent jurisdiction.',
          ],
          callout: {
            tone: 'warn',
            text: 'This clause materially affects your rights, including any right to a court trial. Its enforceability, and whether a class-action waiver or a consumer opt-out is permitted, varies significantly by jurisdiction and must be settled with counsel before this document is published.',
          },
        },
        {
          number: '19.3',
          heading: 'Class action waiver',
          body: [
            'To the extent permitted by law, disputes will be resolved on an individual basis, and you and we waive any right to bring or participate in a class, collective, or representative action. [ENFORCEABILITY VARIES — CONFIRM WITH COUNSEL.]',
          ],
        },
        {
          number: '19.4',
          heading: 'Exceptions',
          body: [
            'Either party may seek injunctive relief in a court of competent jurisdiction to protect intellectual property or confidential information, and either party may bring an individual claim in small-claims court where it qualifies.',
          ],
        },
      ],
    },
    {
      number: '20',
      heading: 'Governing Law',
      clauses: [
        {
          number: '20.1',
          heading: 'Applicable law',
          body: [
            `These Terms are governed by the laws of ${JURISDICTION}, without regard to its conflict-of-laws rules. The United Nations Convention on Contracts for the International Sale of Goods does not apply.`,
            'If you are a consumer resident in the EEA or the UK, you retain the protection of the mandatory provisions of the law of your country of residence.',
          ],
        },
      ],
    },
    {
      number: '21',
      heading: 'General Provisions',
      clauses: [
        {
          number: '21.1',
          heading: 'Changes to these Terms',
          body: [
            'We may update these Terms. We will post the revised version with a new "Last updated" date and, for material changes, give notice by email or in the product at least [NOTICE PERIOD] before they take effect. Continued use after that date constitutes acceptance.',
          ],
        },
        {
          number: '21.2',
          heading: 'Entire agreement and severability',
          body: [
            'These Terms, together with the Privacy Policy and any documents they incorporate, are the entire agreement between us. If any provision is held unenforceable, it will be modified to the minimum extent necessary and the remainder will continue in force.',
          ],
        },
        {
          number: '21.3',
          heading: 'Assignment, waiver, and notices',
          body: [
            'You may not assign these Terms without our written consent; we may assign them in connection with a merger, acquisition, or sale of assets. A failure to enforce a provision is not a waiver of it. We give notices by email to your registered address or by posting in the product.',
          ],
        },
        {
          number: '21.4',
          heading: 'Force majeure',
          body: [
            'Neither party is liable for failure to perform due to events beyond its reasonable control, including network failures, blockchain outages, acts of government, or natural disasters.',
          ],
        },
        {
          number: '21.5',
          heading: 'Contact',
          body: [
            `${COMPANY}, [REGISTERED ADDRESS]. General: [SUPPORT EMAIL]. Legal notices: [LEGAL EMAIL]. Security: [SECURITY EMAIL].`,
          ],
        },
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS = [PRIVACY_POLICY, TERMS_OF_SERVICE];

/**
 * Items that require a lawyer's decision before publication. Surfaced in the
 * product so the placeholders cannot be shipped by accident.
 */
export const LEGAL_REVIEW_NOTES: { area: string; detail: string }[] = [
  {
    area: 'Operating entity and jurisdiction',
    detail:
      'The legal name, registered address, and governing law drive nearly every other choice in both documents and must be settled first.',
  },
  {
    area: 'Money transmission and licensing',
    detail:
      'Whether a non-custodial stablecoin payments platform requires money transmitter licensing, an EMI authorisation, or MiCA registration depends on jurisdiction and on architecture specifics. The "we provide software" clause does not by itself determine regulatory status.',
  },
  {
    area: 'AML, KYC, and sanctions',
    detail:
      'Verification thresholds, screening obligations, suspicious activity reporting, and record-keeping periods are jurisdiction-specific and are only gestured at in this draft.',
  },
  {
    area: 'Privacy regimes and blockchain immutability',
    detail:
      'The tension between GDPR erasure rights and permanent on-chain records is unsettled law. The approach in Section 4 and 8.2 is a reasonable disclosure position, not a safe harbour.',
  },
  {
    area: 'Arbitration and class-action waiver',
    detail:
      'Enforceability varies widely, and consumer-facing waivers are restricted or void in several jurisdictions. Requires a deliberate decision on forum, seat, and consumer carve-outs.',
  },
  {
    area: 'Liability cap and consumer protections',
    detail:
      'The cap in Section 16.2 must be checked against mandatory consumer protections in every market you serve, which may render parts unenforceable.',
  },
  {
    area: 'Stablecoin issuer risk disclosure',
    detail:
      'HTGC in particular has no established issuer in this draft. Its backing, redeemability, and regulatory treatment must be described accurately or removed.',
  },
];
