export type CurrencyCode = 'INR' | 'USD';

export const CURRENCY_OPTIONS: Array<{
  code: CurrencyCode;
  symbol: string;
  label: string;
  shortLabel: string;
}> = [
  { code: 'INR', symbol: '₹', label: 'INR — ₹ Indian Rupee', shortLabel: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD — $ US Dollar', shortLabel: 'USD ($)' },
];

export const BUDGET_OPTIONS_BY_CURRENCY: Record<CurrencyCode, readonly string[]> = {
  INR: [
    'Under ₹5,000',
    '₹5,000 – ₹10,000',
    '₹10,000 – ₹25,000',
    '₹25,000 – ₹50,000',
    '₹50,000+',
    'Not sure yet / Custom quote',
  ],
  USD: [
    'Under $100',
    '$100 – $250',
    '$250 – $500',
    '$500 – $1,000',
    '$1,000+',
    'Not sure yet / Custom quote',
  ],
};

export function formatPackagePrice(
  priceDisplay: string,
  currency: CurrencyCode = 'USD'
): string {
  const trimmed = (priceDisplay || '').trim();
  if (!trimmed) return '';
  const symbol = currency === 'INR' ? '₹' : '$';
  // If admin entered a number or numeric price like "15,000" or "299/mo" or prefixed with another symbol
  const stripped = trimmed.replace(/^[₹$]\s*/, '');
  if (/^\d/.test(stripped)) {
    return `${symbol}${stripped}`;
  }
  return trimmed;
}

export type ProjectCategory =
  | 'LinkedIn'
  | 'UGC'
  | 'Reels'
  | 'Carousels'
  | 'Thumbnails';

export type InquiryStatus =
  | 'new'
  | 'contacted'
  | 'in_progress'
  | 'completed'
  | 'archived';

export interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  category: ProjectCategory;
  short_summary: string;
  description: string;
  image_url: string;
  tags: string[];
  external_url: string;
  is_concept: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceItem {
  id: string;
  number_label: string;
  title: string;
  slug: string;
  short_label: string;
  description: string;
  deliverables: string[];
  mockup_type: 'linkedin' | 'ugc' | 'reels' | 'carousels' | 'thumbnails';
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PackageItem {
  id: string;
  name: string;
  tagline: string;
  currency: CurrencyCode;
  price_display: string;
  billing_type: string;
  description: string;
  features: string[];
  deliverables_count: string;
  revisions_count: string;
  cta_label: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InquiryItem {
  id: string;
  full_name: string;
  email: string;
  brand_name: string;
  service_required: string;
  currency: CurrencyCode;
  budget_range: string;
  project_details: string;
  status: InquiryStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface TestimonialItem {
  id: string;
  author_name: string;
  author_role: string;
  company: string;
  quote: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SocialLinkItem {
  label: string;
  url: string;
}

export interface SiteSettings {
  id: number;
  brand_name: string;
  tagline: string;
  contact_email: string;
  instagram_handle: string;
  instagram_url: string;
  social_links: SocialLinkItem[];
  about_headline: string;
  about_body: string;
  hero_kicker: string;
  hero_headline_line1: string;
  hero_headline_line2: string;
  hero_subheadline: string;
  budget_options: string[];
  updated_at: string;
}

export interface PublicBootstrapData {
  projects: ProjectItem[];
  services: ServiceItem[];
  packages: PackageItem[];
  testimonials: TestimonialItem[];
  settings: SiteSettings;
}

export interface AdminOverviewStats {
  totalInquiries: number;
  newInquiries: number;
  publishedProjects: number;
  totalProjects: number;
  totalPackages: number;
  publishedPackages: number;
  publishedTestimonials: number;
  backendMode: 'supabase' | 'sqlite';
  recentInquiries: InquiryItem[];
}
