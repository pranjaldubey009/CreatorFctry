import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  CurrencyCode,
  PackageItem,
  ProjectCategory,
  ProjectItem,
  PublicBootstrapData,
  ServiceItem,
  SiteSettings,
  SocialLinkItem,
  TestimonialItem,
} from '../types/studio';

interface PublicSupabaseConfigResponse {
  supabaseEnabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

let browserClientPromise: Promise<SupabaseClient | null> | null = null;
let cachedEnvClient: SupabaseClient | null = null;

function createAnonSupabaseClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getBrowserSupabaseClient(): Promise<SupabaseClient | null> {
  const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (envUrl && envAnonKey && /^https?:\/\//.test(envUrl)) {
    if (!cachedEnvClient) {
      cachedEnvClient = createAnonSupabaseClient(envUrl, envAnonKey);
    }
    return cachedEnvClient;
  }

  if (!browserClientPromise) {
    browserClientPromise = (async () => {
      try {
        const res = await fetch('/api/public/config');
        if (!res.ok) return null;
        const cfg = (await res.json()) as PublicSupabaseConfigResponse;
        if (
          !cfg.supabaseEnabled ||
          !cfg.supabaseUrl ||
          !cfg.supabaseAnonKey ||
          !/^https?:\/\//.test(cfg.supabaseUrl)
        ) {
          return null;
        }
        return createAnonSupabaseClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      } catch {
        return null;
      }
    })();
  }

  return browserClientPromise;
}

function parseJsonArray<T>(val: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function mapProjectRow(row: Record<string, unknown>): ProjectItem {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    category: (row.category as ProjectCategory) || 'LinkedIn',
    short_summary: String(row.short_summary ?? ''),
    description: String(row.description ?? ''),
    image_url: String(row.image_url ?? ''),
    tags: parseJsonArray<string>(row.tags),
    external_url: String(row.external_url ?? ''),
    is_concept: Boolean(row.is_concept),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function mapServiceRow(row: Record<string, unknown>): ServiceItem {
  return {
    id: String(row.id),
    number_label: String(row.number_label ?? ''),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    short_label: String(row.short_label ?? ''),
    description: String(row.description ?? ''),
    deliverables: parseJsonArray<string>(row.deliverables),
    mockup_type: (row.mockup_type as ServiceItem['mockup_type']) || 'linkedin',
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function mapPackageRow(row: Record<string, unknown>): PackageItem {
  const rawCurrency = String(row.currency ?? 'USD').toUpperCase();
  const currency: CurrencyCode = rawCurrency === 'INR' ? 'INR' : 'USD';
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    tagline: String(row.tagline ?? ''),
    currency,
    price_display: String(row.price_display ?? ''),
    billing_type: String(row.billing_type ?? 'Monthly'),
    description: String(row.description ?? ''),
    features: parseJsonArray<string>(row.features),
    deliverables_count: String(row.deliverables_count ?? ''),
    revisions_count: String(row.revisions_count ?? ''),
    cta_label: String(row.cta_label ?? 'GET A CUSTOM QUOTE'),
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function mapTestimonialRow(row: Record<string, unknown>): TestimonialItem {
  return {
    id: String(row.id),
    author_name: String(row.author_name ?? ''),
    author_role: String(row.author_role ?? ''),
    company: String(row.company ?? ''),
    quote: String(row.quote ?? ''),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function mapSettingsRow(row: Record<string, unknown>): SiteSettings {
  return {
    id: Number(row.id ?? 1),
    brand_name: String(row.brand_name ?? 'CREATORFCTRY'),
    tagline: String(row.tagline ?? 'One Factory. Every Format.'),
    contact_email: String(row.contact_email ?? 'creatorfctry@gmail.com'),
    instagram_handle: String(row.instagram_handle ?? '@creatorfctry'),
    instagram_url: String(row.instagram_url ?? 'https://instagram.com/creatorfctry'),
    social_links: parseJsonArray<SocialLinkItem>(row.social_links),
    about_headline: String(row.about_headline ?? ''),
    about_body: String(row.about_body ?? ''),
    hero_kicker: String(row.hero_kicker ?? 'CONTENT & CREATOR GROWTH STUDIO'),
    hero_headline_line1: String(row.hero_headline_line1 ?? 'ONE FACTORY.'),
    hero_headline_line2: String(row.hero_headline_line2 ?? 'EVERY FORMAT.'),
    hero_subheadline: String(row.hero_subheadline ?? ''),
    budget_options: parseJsonArray<string>(row.budget_options),
    updated_at: String(row.updated_at ?? ''),
  };
}

export async function fetchPublicBootstrapFromSupabase(): Promise<PublicBootstrapData | null> {
  const client = await getBrowserSupabaseClient();
  if (!client) return null;

  const [projRes, svcRes, pkgRes, testRes, settingsRes] = await Promise.all([
    client
      .from('projects')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    client
      .from('services')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true }),
    client
      .from('packages')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true }),
    client
      .from('testimonials')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    client.from('site_settings').select('*').eq('id', 1).maybeSingle(),
  ]);

  if (
    projRes.error ||
    svcRes.error ||
    pkgRes.error ||
    testRes.error ||
    settingsRes.error ||
    !settingsRes.data
  ) {
    return null;
  }

  return {
    projects: (projRes.data || []).map((row) => mapProjectRow(row as Record<string, unknown>)),
    services: (svcRes.data || []).map((row) => mapServiceRow(row as Record<string, unknown>)),
    packages: (pkgRes.data || []).map((row) => mapPackageRow(row as Record<string, unknown>)),
    testimonials: (testRes.data || []).map((row) =>
      mapTestimonialRow(row as Record<string, unknown>)
    ),
    settings: mapSettingsRow(settingsRes.data as Record<string, unknown>),
  };
}

export async function fetchPublishedProjectBySlugFromSupabase(
  slug: string
): Promise<ProjectItem | null> {
  const client = await getBrowserSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;
  return mapProjectRow(data as Record<string, unknown>);
}
