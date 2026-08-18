import {
  AlertTriangle,
  Bell,
  Copyright,
  Database,
  EyeOff,
  FileText,
  Gavel,
  History,
  LineChart,
  MapPin,
  RefreshCw,
  Scale,
  ScanSearch,
  Settings,
  Share2,
  ShieldAlert,
  Timer,
  UserCog,
} from 'lucide-react'

export const CATEGORIES = [
  { key: 'privacy', label: 'Privacy Risk', icon: EyeOff, desc: 'How much personal data is collected & kept' },
  { key: 'dataSharing', label: 'Data Sharing', icon: Share2, desc: 'Who your data is sold, shared, or licensed to' },
  { key: 'ownership', label: 'Content Ownership', icon: Copyright, desc: 'Who owns what you post, upload, or create' },
  { key: 'control', label: 'Account Control', icon: UserCog, desc: 'How easily you can leave, export, or delete' },
]

export const RISK_META = {
  low: {
    label: 'Low risk',
    color: '#34d399',
    text: 'text-emerald-400',
    chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    bar: 'bg-emerald-500',
    ring: '#34d399',
  },
  moderate: {
    label: 'Moderate risk',
    color: '#fbbf24',
    text: 'text-amber-400',
    chip: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    bar: 'bg-amber-500',
    ring: '#fbbf24',
  },
  high: {
    label: 'High risk',
    color: '#f87171',
    text: 'text-red-400',
    chip: 'bg-red-500/10 text-red-300 border-red-500/30',
    bar: 'bg-red-500',
    ring: '#f87171',
  },
}

export const HIDDEN_CLAUSE_TYPES = {
  autoRenew: { label: 'Auto-renewal', icon: Timer },
  arbitration: { label: 'Forced arbitration', icon: Gavel },
  retention: { label: 'Post-deletion retention', icon: Database },
  contentLicense: { label: 'Broad content license', icon: Copyright },
  dataSale: { label: 'Third-party data sale', icon: Share2 },
  location: { label: 'Persistent location tracking', icon: MapPin },
  healthData: { label: 'Sensitive health data', icon: LineChart },
  unilateral: { label: 'Unilateral terms change', icon: RefreshCw },
}

export const ANALYZED_POLICIES = {
  'photobomb.app': {
    domain: 'photobomb.app',
    company: 'PhotoBomb',
    type: 'Terms & Privacy',
    overall: 'high',
    riskScore: 78,
    sentences: 342,
    pages: 28,
    readTime: '25 min',
    categories: { privacy: 74, dataSharing: 82, ownership: 88, control: 61 },
    hiddenClauses: [
      {
        type: 'contentLicense',
        severity: 'error',
        quote: 'You grant us a perpetual, irrevocable, worldwide, royalty-free, sublicensable license to all content you post.',
        plain: 'They can use, sell, and relicense your photos forever — even after you delete your account.',
        whyCare: 'Anything you upload can be repurposed commercially without paying or asking you.',
      },
      {
        type: 'autoRenew',
        severity: 'warn',
        quote: 'Your subscription renews automatically at the current rate unless cancelled 48 hours before renewal.',
        plain: 'You are charged again every billing cycle until you remember to cancel.',
        whyCare: 'Forgotten subscriptions cost users an estimated $2.6B/yr across apps.',
      },
      {
        type: 'retention',
        severity: 'error',
        quote: 'We may retain backup copies of deleted content for a period of up to 24 months.',
        plain: 'Your “deleted” photos keep living on their servers for two more years.',
        whyCare: 'Deletion is not immediate, giving companies and law enforcement lingering access.',
      },
      {
        type: 'dataSale',
        severity: 'warn',
        quote: 'Anonymized user data may be shared with advertising and analytics partners.',
        plain: 'Your behavior data becomes a product sold to third parties.',
        whyCare: 'You are the product — even if the data is “anonymized”.',
      },
    ],
    clauses: [
      { category: 'privacy', title: 'Data collection', severity: 'high', raw: 'We collect device identifiers, IP addresses, precise location, photos, contacts, and usage patterns.', plain: 'PhotoBomb collects far more than photos — including your contacts and precise location.' },
      { category: 'dataSharing', title: 'Data sharing', severity: 'high', raw: 'We may share personal information with affiliated companies, partners, and third-party vendors.', plain: 'Your data flows to affiliates and partners you never chose.', },
      { category: 'ownership', title: 'Content rights', severity: 'high', raw: 'You grant a perpetual, irrevocable, worldwide, sublicensable license to posted content.', plain: 'They can reuse, sell, and sublicense your content forever.' },
      { category: 'control', title: 'Account deletion', severity: 'medium', raw: 'Requests to delete your account may take up to 30 business days to process.', plain: 'Closing your account is slow — and backups can persist for 24 months after.' },
      { category: 'control', title: 'Jurisdiction & arbitration', severity: 'medium', raw: 'All disputes will be resolved by binding arbitration in Delaware.', plain: 'You cannot sue in court; disputes are decided by a private arbitrator.' },
      { category: 'privacy', title: 'Cookies & trackers', severity: 'low', raw: 'We use cookies, beacons, and similar technologies to personalize advertising.', plain: 'Standard ad-tracking cookies are used for targeted ads.' },
    ],
    recommendation: 'High-risk terms. Consider a privacy-friendly alternative before signing up.',
  },
  'cloudvault.io': {
    domain: 'cloudvault.io',
    company: 'CloudVault',
    type: 'Terms & Privacy',
    overall: 'low',
    riskScore: 26,
    sentences: 121,
    pages: 8,
    readTime: '8 min',
    categories: { privacy: 22, dataSharing: 15, ownership: 34, control: 28 },
    hiddenClauses: [
      {
        type: 'retention',
        severity: 'info',
        quote: 'Deleted files are purged from primary storage within 90 days.',
        plain: 'Deletion is guaranteed and reasonably fast.',
        whyCare: 'This is one of the better retention policies you will find.',
      },
    ],
    clauses: [
      { category: 'privacy', title: 'Data collection', severity: 'low', raw: 'We collect only your email address and payment details for account operation.', plain: 'Minimal collection: email and payment info only.' },
      { category: 'dataSharing', title: 'Data sharing', severity: 'low', raw: 'We do not sell or rent your personal data to any third party.', plain: 'No selling, renting, or sharing of your personal data.' },
      { category: 'ownership', title: 'Content ownership', severity: 'low', raw: 'You retain full ownership of all files you store.', plain: 'Your files stay yours — always.' },
      { category: 'control', title: 'Account control', severity: 'low', raw: 'You may export or delete your data at any time with immediate effect.', plain: 'Full control: export or delete whenever you want.' },
    ],
    recommendation: 'Low-risk policy — safe to accept. One of the best we have analyzed.',
  },
  'fitpulse.co': {
    domain: 'fitpulse.co',
    company: 'FitPulse',
    type: 'Privacy',
    overall: 'high',
    riskScore: 82,
    sentences: 388,
    pages: 31,
    readTime: '32 min',
    categories: { privacy: 85, dataSharing: 79, ownership: 71, control: 90 },
    hiddenClauses: [
      {
        type: 'healthData',
        severity: 'error',
        quote: 'We may share health metrics, including heart rate and sleep data, with insurance-linked wellness partners.',
        plain: 'Your biometrics can be shared with companies that price your insurance.',
        whyCare: 'Vital health data can quietly influence insurance pricing and coverage.',
      },
      {
        type: 'location',
        severity: 'error',
        quote: 'Location services run continuously, including in the background, to track outdoor activity.',
        plain: 'The app knows where you are at all times, even when closed.',
        whyCare: 'Continuous location data creates a complete movement history.',
      },
      {
        type: 'retention',
        severity: 'warn',
        quote: 'Health data may be retained for up to 7 years to comply with research requirements.',
        plain: 'Your health data is kept for years after you stop using the app.',
        whyCare: 'Long retention extends the window for misuse or breach exposure.',
      },
    ],
    clauses: [
      { category: 'privacy', title: 'Sensitive data', severity: 'high', raw: 'We process biometric, health, and menstrual-cycle data as core features.', plain: 'Deeply personal health data is the core of their business model.' },
      { category: 'dataSharing', title: 'Partner sharing', severity: 'high', raw: 'Data is shared with affiliated wellness, research, and insurance partners.', plain: 'Your health data reaches insurance-linked third parties.' },
      { category: 'control', title: 'Deletion', severity: 'high', raw: 'Deletion requests take up to 14 business days and may be refused while records are under research hold.', plain: 'Deleting your data is slow and can be denied.' },
    ],
    recommendation: 'Very high risk. Avoid sharing sensitive health data with this app.',
  },
  'snappay.co': {
    domain: 'snappay.co',
    company: 'SnapPay',
    type: 'Terms',
    overall: 'moderate',
    riskScore: 54,
    sentences: 188,
    pages: 14,
    readTime: '12 min',
    categories: { privacy: 51, dataSharing: 58, ownership: 40, control: 62 },
    hiddenClauses: [
      {
        type: 'autoRenew',
        severity: 'warn',
        quote: 'You authorize pre-approved recurring debits for transactions marked pre-approved.',
        plain: 'Some charges can be pulled from your account without a fresh confirmation.',
        whyCare: 'Recurring-debit authorizations are a common source of surprise charges.',
      },
      {
        type: 'arbitration',
        severity: 'warn',
        quote: 'Disputes are resolved through binding arbitration, waiving your right to a class action.',
        plain: 'You give up class-action and court rights for card disputes.',
        whyCare: 'Class-action waivers make small-value harms impossible to fight collectively.',
      },
    ],
    clauses: [
      { category: 'privacy', title: 'Card storage', severity: 'low', raw: 'Card details are stored using PCI-DSS compliant tokenization.', plain: 'Cards are stored securely via tokenized vaults.' },
      { category: 'dataSharing', title: 'Fraud analytics', severity: 'medium', raw: 'Transaction metadata is shared with parent and affiliate entities for fraud analytics.', plain: 'Your transaction history is pooled with affiliated companies.' },
      { category: 'control', title: 'Chargebacks', severity: 'medium', raw: 'Chargeback disputes must be filed within 21 days of the transaction.', plain: 'You have a short 21-day window to dispute a charge.' },
    ],
    recommendation: 'Moderate risk — mostly standard fintech language, but watch the pre-approved debits.',
  },
  'streamflix.tv': {
    domain: 'streamflix.tv',
    company: 'StreamFlix',
    type: 'Terms & Privacy',
    overall: 'moderate',
    riskScore: 58,
    sentences: 205,
    pages: 16,
    readTime: '14 min',
    categories: { privacy: 55, dataSharing: 60, ownership: 48, control: 66 },
    hiddenClauses: [
      {
        type: 'contentLicense',
        severity: 'warn',
        quote: 'Any user-generated content you post grants us a non-exclusive license to broadcast, distribute, and monetize.',
        plain: 'Your posts can be broadcast and monetized on other platforms.',
        whyCare: 'What you share can be repurposed for revenue without consent.',
      },
      {
        type: 'unilateral',
        severity: 'warn',
        quote: 'We may update these terms at any time, effective immediately upon posting.',
        plain: 'The contract can change instantly, with no notice period.',
        whyCare: 'You must keep re-checking to stay aware of new terms.',
      },
    ],
    clauses: [
      { category: 'privacy', title: 'Viewing data', severity: 'medium', raw: 'We track viewing history to recommend content and personalize ads.', plain: 'Your watch history is used for targeting and recommendations.' },
      { category: 'dataSharing', title: 'Advertisers', severity: 'medium', raw: 'De-identified viewing data is shared with advertising partners.', plain: 'Viewing patterns are sold to advertisers in aggregate.' },
      { category: 'ownership', title: 'User content', severity: 'medium', raw: 'User posts grant a broad, sublicensable distribution license.', plain: 'Your uploads can be redistributed and monetized.' },
    ],
    recommendation: 'Moderate risk. Standard streaming terms with aggressive content licensing.',
  },
  'chatterbox.io': {
    domain: 'chatterbox.io',
    company: 'Chatterbox',
    type: 'Terms & Privacy',
    overall: 'high',
    riskScore: 71,
    sentences: 297,
    pages: 24,
    readTime: '21 min',
    categories: { privacy: 68, dataSharing: 72, ownership: 74, control: 55 },
    hiddenClauses: [
      {
        type: 'dataSale',
        severity: 'error',
        quote: 'We may sell de-identified behavioral profiles to third-party data brokers.',
        plain: 'Detailed behavioral profiles about you are sold to data brokers.',
        whyCare: 'Data brokers assemble these profiles into marketable dossiers.',
      },
      {
        type: 'arbitration',
        severity: 'warn',
        quote: 'All claims are subject to binding individual arbitration; class actions are waived.',
        plain: 'You forfeit the right to sue in court or join a class action.',
        whyCare: 'Platforms with arbitration clauses face far fewer legal consequences.',
      },
      {
        type: 'unilateral',
        severity: 'warn',
        quote: 'We may modify or terminate the service at our sole discretion at any time.',
        plain: 'The service can change or shut down without warning.',
        whyCare: 'Your community and content can disappear overnight.',
      },
    ],
    clauses: [
      { category: 'dataSharing', title: 'Behavioral profiles', severity: 'high', raw: 'Behavioral profiles are sold to third-party data brokers.', plain: 'Your behavior is packaged and sold as a product.' },
      { category: 'ownership', title: 'Posting rights', severity: 'high', raw: 'Posts may be distributed and modified by the platform without further notice.', plain: 'Your posts can be edited and redistributed by the platform.' },
      { category: 'control', title: 'Banning', severity: 'medium', raw: 'Accounts may be suspended without notice for policy violations.', plain: 'You can be locked out of your account with no warning.' },
    ],
    recommendation: 'High risk. Consider whether the social value justifies the data cost.',
  },
}

export const HISTORY = [
  { id: 'h1', name: 'PhotoBomb', domain: 'photobomb.app', type: 'Terms & Privacy', date: 'Today, 4:12 PM', overall: 'high', riskScore: 78, tags: ['Photos', 'Content license', 'Auto-renewal'] },
  { id: 'h2', name: 'CloudVault', domain: 'cloudvault.io', type: 'Terms & Privacy', date: 'Yesterday, 9:40 AM', overall: 'low', riskScore: 26, tags: ['Storage', 'Encryption'] },
  { id: 'h3', name: 'FitPulse', domain: 'fitpulse.co', type: 'Privacy', date: 'Aug 14', overall: 'high', riskScore: 82, tags: ['Health', 'Location', 'Insurance'] },
  { id: 'h4', name: 'SnapPay', domain: 'snappay.co', type: 'Terms', date: 'Aug 12', overall: 'moderate', riskScore: 54, tags: ['Fintech', 'Arbitration'] },
  { id: 'h5', name: 'StreamFlix', domain: 'streamflix.tv', type: 'Terms & Privacy', date: 'Aug 9', overall: 'moderate', riskScore: 58, tags: ['Streaming', 'Content license'] },
  { id: 'h6', name: 'Chatterbox', domain: 'chatterbox.io', type: 'Terms & Privacy', date: 'Aug 5', overall: 'high', riskScore: 71, tags: ['Social', 'Data brokers'] },
  { id: 'h7', name: 'Pixelfeed', domain: 'pixelfeed.io', type: 'Privacy', date: 'Jul 30', overall: 'high', riskScore: 74, tags: ['Social', 'Profiling'] },
  { id: 'h8', name: 'ZenSleep', domain: 'zensleep.dev', type: 'Privacy', date: 'Jul 22', overall: 'low', riskScore: 19, tags: ['Sleep', 'Wellness'] },
]

export const RECENT = [
  { id: 'r1', name: 'PhotoBomb', domain: 'photobomb.app', overall: 'high', riskScore: 78, time: 'Today, 4:12 PM' },
  { id: 'r2', name: 'CloudVault', domain: 'cloudvault.io', overall: 'low', riskScore: 26, time: 'Yesterday, 9:40 AM' },
  { id: 'r3', name: 'FitPulse', domain: 'fitpulse.co', overall: 'high', riskScore: 82, time: 'Aug 14' },
]

export const DASH_STATS = [
  { id: 's1', label: 'Policies analyzed', value: '132', delta: '+18 this week', icon: FileText, tone: 'info' },
  { id: 's2', label: 'Hidden clauses found', value: '57', delta: '9 critical', icon: ShieldAlert, tone: 'danger' },
  { id: 's3', label: 'Avg. risk score', value: '48/100', delta: 'Moderate baseline', icon: Scale, tone: 'warn' },
  { id: 's4', label: 'Comparisons made', value: '36', delta: '11 this week', icon: LineChart, tone: 'success' },
]

export const QUICK_ACTIONS = [
  { id: 'q1', title: 'Analyze a policy', desc: 'Paste text, a URL, or app permissions', icon: ScanSearch, tone: 'primary', tab: 'analyze' },
  { id: 'q2', title: 'Compare services', desc: 'Benchmark two apps side-by-side', icon: Scale, tone: 'indigo', tab: 'compare' },
  { id: 'q3', title: 'Risk history', desc: 'Every analysis, verdict & flag', icon: History, tone: 'emerald', tab: 'history' },
  { id: 'q4', title: 'Settings', desc: 'Alerts, API keys, extension', icon: Settings, tone: 'amber', tab: 'settings' },
]

export const PIPELINE = [
  { id: 'ingest', label: 'Ingesting document' },
  { id: 'parse', label: 'Parsing & classifying clauses' },
  { id: 'score', label: 'Computing risk scores' },
  { id: 'simplify', label: 'Translating legalese to plain English' },
  { id: 'profile', label: 'Building risk profile' },
]

export function clampMeter(value) {
  const v = Math.min(Math.max(value, 0), 100)
  if (v < 40) return { color: '#34d399', label: 'Low' }
  if (v <= 65) return { color: '#fbbf24', label: 'Moderate' }
  return { color: '#f87171', label: 'High' }
}

export const SEVERITY_STYLE = {
  error: { icon: ShieldAlert, chip: 'text-red-400', title: 'text-red-300', box: 'border-red-500/30 bg-red-500/10', label: 'Critical' },
  warn: { icon: AlertTriangle, chip: 'text-amber-400', title: 'text-amber-300', box: 'border-amber-500/30 bg-amber-500/10', label: 'Warning' },
  info: { icon: Bell, chip: 'text-sky-400', title: 'text-sky-300', box: 'border-sky-500/30 bg-sky-500/10', label: 'Note' },
}

export const CLAUSE_SEVERITY = {
  high: { badge: 'danger', label: 'High risk' },
  medium: { badge: 'warn', label: 'Medium risk' },
  low: { badge: 'success', label: 'Low risk' },
}
