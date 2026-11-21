import Database from 'better-sqlite3';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  AdminOverviewStats,
  CurrencyCode,
  InquiryItem,
  InquiryStatus,
  PackageItem,
  ProjectItem,
  ServiceItem,
  SiteSettings,
  TestimonialItem,
} from '../src/types/studio';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'creatorfctry.db');
export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const supabaseUrl =
  (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim() || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
const supabaseAnonKey =
  (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)?.trim() || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseServiceKey &&
    /^https?:\/\//.test(supabaseUrl)
);

export function getPublicSupabaseConfig(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
} | null {
  if (!supabaseUrl || !supabaseAnonKey || !/^https?:\/\//.test(supabaseUrl)) {
    return null;
  }
  return { supabaseUrl, supabaseAnonKey };
}

const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const supabaseAnonClient: SupabaseClient | null =
  isSupabaseConfigured && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

const supabaseAuthClient: SupabaseClient | null =
  supabaseAnonClient || supabaseAdmin;

function getUserSupabaseClient(accessToken?: string): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (supabaseAnonKey && accessToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }
  return supabaseAdmin;
}

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Initialize SQLite Schema
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    short_summary TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    external_url TEXT NOT NULL DEFAULT '',
    is_concept INTEGER NOT NULL DEFAULT 1,
    is_published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    number_label TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_label TEXT NOT NULL,
    description TEXT NOT NULL,
    deliverables TEXT NOT NULL DEFAULT '[]',
    mockup_type TEXT NOT NULL DEFAULT 'linkedin',
    is_published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL DEFAULT '',
    currency TEXT NOT NULL DEFAULT 'USD',
    price_display TEXT NOT NULL,
    billing_type TEXT NOT NULL DEFAULT 'Monthly',
    description TEXT NOT NULL DEFAULT '',
    features TEXT NOT NULL DEFAULT '[]',
    deliverables_count TEXT NOT NULL DEFAULT '',
    revisions_count TEXT NOT NULL DEFAULT '',
    cta_label TEXT NOT NULL DEFAULT 'GET A CUSTOM QUOTE',
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    brand_name TEXT NOT NULL DEFAULT '',
    service_required TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    budget_range TEXT NOT NULL,
    project_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    admin_notes TEXT NOT NULL DEFAULT '',
    source_ip_hash TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    quote TEXT NOT NULL,
    is_published INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    brand_name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    instagram_handle TEXT NOT NULL,
    instagram_url TEXT NOT NULL,
    social_links TEXT NOT NULL DEFAULT '[]',
    about_headline TEXT NOT NULL,
    about_body TEXT NOT NULL,
    hero_kicker TEXT NOT NULL,
    hero_headline_line1 TEXT NOT NULL,
    hero_headline_line2 TEXT NOT NULL,
    hero_subheadline TEXT NOT NULL,
    budget_options TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_credentials (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Idempotent column migration for existing SQLite databases
function ensureSqliteCurrencyColumns() {
  const packageCols = sqlite
    .prepare('PRAGMA table_info(packages)')
    .all() as Array<{ name: string }>;
  if (!packageCols.some((c) => c.name === 'currency')) {
    sqlite.exec("ALTER TABLE packages ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD'");
  }

  const inquiryCols = sqlite
    .prepare('PRAGMA table_info(inquiries)')
    .all() as Array<{ name: string }>;
  if (!inquiryCols.some((c) => c.name === 'currency')) {
    sqlite.exec("ALTER TABLE inquiries ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD'");
  }

  sqlite.exec(
    'CREATE INDEX IF NOT EXISTS idx_inquiries_currency ON inquiries (currency, created_at DESC)'
  );
}

ensureSqliteCurrencyColumns();

function nowIso(): string {
  return new Date().toISOString();
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function parseJsonArray<T>(val: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

const DEFAULT_SITE_SETTINGS_SEED = {
  id: 1,
  brand_name: 'CREATORFCTRY',
  tagline: 'One Factory. Every Format.',
  contact_email: 'creatorfctry@gmail.com',
  instagram_handle: '@creatorfctry',
  instagram_url: 'https://instagram.com/creatorfctry',
  social_links: [
    { label: 'Instagram', url: 'https://instagram.com/creatorfctry' },
    { label: 'Email', url: 'mailto:creatorfctry@gmail.com' },
  ],
  about_headline: 'A SMALL STUDIO. BIG CREATIVE ENERGY.',
  about_body:
    'CreatorFctry is a creative content studio focused on helping brands, founders and creators show up with better content.\n\nWe bring multiple content formats together under one creative direction — making content creation simpler, more consistent and more impactful.',
  hero_kicker: 'CONTENT & CREATOR GROWTH STUDIO',
  hero_headline_line1: 'ONE FACTORY.',
  hero_headline_line2: 'EVERY FORMAT.',
  hero_subheadline:
    'We turn ideas into content that makes brands, founders and creators stand out.',
  budget_options: [
    'Under $1,000',
    '$1,000 – $2,500',
    '$2,500 – $5,000',
    '$5,000+',
    "Custom / Let's Discuss",
  ],
};

const DEFAULT_SERVICES_SEED = [
  {
    number_label: '01',
    title: 'LINKEDIN PERSONAL BRANDING',
    slug: 'linkedin-personal-branding',
    short_label: 'LinkedIn',
    description:
      'Build authority through strategic personal branding, ghostwriting, thought leadership and content planning.',
    deliverables: [
      'Founder Voice & Positioning',
      'Weekly Ghostwritten Posts',
      'Profile & Banner Direction',
      'Monthly Content Calendar',
    ],
    mockup_type: 'linkedin',
    sort_order: 1,
  },
  {
    number_label: '02',
    title: 'UGC CONTENT',
    slug: 'ugc-content',
    short_label: 'UGC',
    description: 'Create authentic creator-style video content for brands.',
    deliverables: [
      'Hook & Script Concepts',
      'Creator-Led Product Framing',
      'Native Vertical Delivery',
      'Ad-Ready Hook Variations',
    ],
    mockup_type: 'ugc',
    sort_order: 2,
  },
  {
    number_label: '03',
    title: 'REELS & SHORT-FORM VIDEO',
    slug: 'reels-short-form-video',
    short_label: 'Reels',
    description:
      'Create engaging short-form video content for Instagram and other platforms.',
    deliverables: [
      'Pacing & Retention Editing',
      'Kinetic Typography & Captions',
      'Sound Design & Color Grade',
      'Multi-Platform Exports',
    ],
    mockup_type: 'reels',
    sort_order: 3,
  },
  {
    number_label: '04',
    title: 'CAROUSEL DESIGN',
    slug: 'carousel-design',
    short_label: 'Carousels',
    description:
      'Turn complex ideas into engaging, visually compelling carousel content.',
    deliverables: [
      'Editorial Slide Architecture',
      'Custom Visual Systems',
      'LinkedIn PDF & IG Ready',
      'High-Clarity Typography',
    ],
    mockup_type: 'carousels',
    sort_order: 4,
  },
  {
    number_label: '05',
    title: 'YOUTUBE THUMBNAILS',
    slug: 'youtube-thumbnails',
    short_label: 'Thumbnails',
    description:
      'Design high-impact thumbnails that communicate clearly and attract clicks.',
    deliverables: [
      'Concept & Visual Hook Strategy',
      'Subject Cutout & Lighting',
      'Title-Thumbnail Contrast Check',
      'Mobile-Legible Compositions',
    ],
    mockup_type: 'thumbnails',
    sort_order: 5,
  },
];

const DEFAULT_PROJECTS_SEED = [
  {
    title: 'Founder Authority Editorial System',
    slug: 'founder-authority-editorial-system',
    category: 'LinkedIn',
    short_summary:
      'Concept identity, narrative pillars, and typographic post system designed for B2B founders building credibility on LinkedIn.',
    description:
      'A complete concept direction demonstrating how CreatorFctry structures a founder’s LinkedIn presence: sharp profile art direction, recurring editorial post formats, structured thought-leadership hooks, and cohesive visual grids built for consistent publishing.',
    image_url: '/src/assets/images/project_linkedin_brand_1795253941857.jpg',
    tags: ['Ghostwriting', 'Visual Identity', 'Content Calendar'],
    external_url: '',
    sort_order: 1,
  },
  {
    title: 'Studio-Lit Creator UGC Framework',
    slug: 'studio-lit-creator-ugc-framework',
    category: 'UGC',
    short_summary:
      'Concept vertical video production system balancing raw creator authenticity with deliberate lighting and crisp product storytelling.',
    description:
      'Designed as a concept production template for consumer and DTC brands. Combines scripted 3-second visual hooks, hands-on product demonstrations, natural conversational pacing, and multiple modular cutdowns for paid social and organic feeds.',
    image_url: '/src/assets/images/project_ugc_studio_1795253942246.jpg',
    tags: ['Creator Direction', 'Hook Scripting', 'Vertical 9:16'],
    external_url: '',
    sort_order: 2,
  },
  {
    title: 'Kinetic Short-Form Reel Cut',
    slug: 'kinetic-short-form-reel-cut',
    category: 'Reels',
    short_summary:
      'Concept editing language using bold frame markers, rhythmic sound cuts, and monochrome-plus-electric-blue motion typography.',
    description:
      'A short-form editing concept built to hold viewer attention without cheap sensory overload. Features structured visual chapters, intentional b-roll pacing, tactile sound design cues, and clean editorial captions readable with or without sound.',
    image_url: '/src/assets/images/project_reels_motion_1795253941896.jpg',
    tags: ['Retention Editing', 'Motion Graphics', 'Sound Design'],
    external_url: '',
    sort_order: 3,
  },
  {
    title: 'Swiss Grid Idea-to-Slide Carousel',
    slug: 'swiss-grid-idea-to-slide-carousel',
    category: 'Carousels',
    short_summary:
      'Concept multi-slide carousel deck translating dense industry frameworks into scannable neo-brutalist visual cards.',
    description:
      'Built for high-save educational storytelling across LinkedIn PDFs and Instagram carousels. Uses strict grid proportions, bold burnt orange visual anchors, and crisp typographic hierarchy so complex concepts read clearly on mobile screens.',
    image_url: '/src/assets/images/project_carousel_grid_1795253941514.jpg',
    tags: ['Carousel Architecture', 'Information Design', 'Editorial Layout'],
    external_url: '',
    sort_order: 4,
  },
  {
    title: 'High-Contrast Creator Thumbnail Kit',
    slug: 'high-contrast-creator-thumbnail-kit',
    category: 'Thumbnails',
    short_summary:
      'Concept YouTube packaging exploring expressive monochrome portraits against geometric burnt orange and electric blue planes.',
    description:
      'A packaging concept focused on instant visual comprehension at small mobile feed sizes. Pairs clean subject separation and dramatic key lighting with disciplined color blocking so the title and thumbnail reinforce a single curiosity gap.',
    image_url: '/src/assets/images/project_youtube_thumb_1795253941534.jpg',
    tags: ['Packaging Strategy', 'Photo Compositing', 'Color Contrast'],
    external_url: '',
    sort_order: 5,
  },
];

const DEFAULT_PACKAGES_SEED = [
  {
    name: 'STARTER',
    tagline: 'Focused single-format momentum',
    currency: 'USD' as CurrencyCode,
    price_display: 'Custom Scope',
    billing_type: 'Project or Monthly',
    description:
      'Built for creators and emerging brands launching a single consistent content channel with sharp creative direction.',
    features: [
      '1 Core Content Format (Reels, Carousels, or Thumbnails)',
      'Creative Direction & Hook Planning',
      'Brand-Consistent Visual System',
      'Ready-to-Publish Asset Delivery',
    ],
    deliverables_count: '4–8 Assets / mo',
    revisions_count: '2 Rounds per Asset',
    cta_label: 'GET A CUSTOM QUOTE',
    is_featured: false,
    sort_order: 1,
  },
  {
    name: 'GROWTH',
    tagline: 'Multi-format studio production',
    currency: 'USD' as CurrencyCode,
    price_display: 'Custom Retainer',
    billing_type: 'Monthly',
    description:
      'Our unified creative factory for brands scaling across short-form video, UGC, carousels, and visual packaging.',
    features: [
      'Up to 3 Formats Under One Creative Direction',
      'Monthly Content Strategy & Scripting',
      'Reels Editing + Carousel Design + Thumbnails/UGC',
      'Dedicated Studio Review Workflow',
    ],
    deliverables_count: '12–20 Assets / mo',
    revisions_count: 'Priority Revisions',
    cta_label: 'GET A CUSTOM QUOTE',
    is_featured: true,
    sort_order: 2,
  },
  {
    name: 'PERSONAL BRAND',
    tagline: 'Founder authority & executive presence',
    currency: 'USD' as CurrencyCode,
    price_display: 'Custom Retainer',
    billing_type: 'Monthly',
    description:
      'End-to-end LinkedIn positioning, ghostwriting, and companion visual carousels for founders and industry voices.',
    features: [
      'Founder Voice Extraction & Editorial Calendar',
      'LinkedIn Ghostwriting & Thought Leadership',
      'Custom Editorial Carousel Design',
      'Profile & Visual Identity Alignment',
    ],
    deliverables_count: '12–16 Posts + Carousels',
    revisions_count: 'Collaborative Refinement',
    cta_label: 'GET A CUSTOM QUOTE',
    is_featured: false,
    sort_order: 3,
  },
];

// Seed default data once if SQLite tables are empty
function seedInitialData() {
  const ts = nowIso();

  const settingsCount = sqlite.prepare('SELECT COUNT(*) as c FROM site_settings').get() as { c: number };
  if (settingsCount.c === 0) {
    sqlite.prepare(`
      INSERT INTO site_settings (
        id, brand_name, tagline, contact_email, instagram_handle, instagram_url,
        social_links, about_headline, about_body, hero_kicker, hero_headline_line1,
        hero_headline_line2, hero_subheadline, budget_options, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      DEFAULT_SITE_SETTINGS_SEED.brand_name,
      DEFAULT_SITE_SETTINGS_SEED.tagline,
      DEFAULT_SITE_SETTINGS_SEED.contact_email,
      DEFAULT_SITE_SETTINGS_SEED.instagram_handle,
      DEFAULT_SITE_SETTINGS_SEED.instagram_url,
      JSON.stringify(DEFAULT_SITE_SETTINGS_SEED.social_links),
      DEFAULT_SITE_SETTINGS_SEED.about_headline,
      DEFAULT_SITE_SETTINGS_SEED.about_body,
      DEFAULT_SITE_SETTINGS_SEED.hero_kicker,
      DEFAULT_SITE_SETTINGS_SEED.hero_headline_line1,
      DEFAULT_SITE_SETTINGS_SEED.hero_headline_line2,
      DEFAULT_SITE_SETTINGS_SEED.hero_subheadline,
      JSON.stringify(DEFAULT_SITE_SETTINGS_SEED.budget_options),
      ts
    );
  }

  const servicesCount = sqlite.prepare('SELECT COUNT(*) as c FROM services').get() as { c: number };
  if (servicesCount.c === 0) {
    const insertService = sqlite.prepare(`
      INSERT INTO services (id, number_label, title, slug, short_label, description, deliverables, mockup_type, is_published, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedServices = [
      {
        id: crypto.randomUUID(),
        number_label: '01',
        title: 'LINKEDIN PERSONAL BRANDING',
        slug: 'linkedin-personal-branding',
        short_label: 'LinkedIn',
        description:
          'Build authority through strategic personal branding, ghostwriting, thought leadership and content planning.',
        deliverables: [
          'Founder Voice & Positioning',
          'Weekly Ghostwritten Posts',
          'Profile & Banner Direction',
          'Monthly Content Calendar',
        ],
        mockup_type: 'linkedin',
        sort_order: 1,
      },
      {
        id: crypto.randomUUID(),
        number_label: '02',
        title: 'UGC CONTENT',
        slug: 'ugc-content',
        short_label: 'UGC',
        description:
          'Create authentic creator-style video content for brands.',
        deliverables: [
          'Hook & Script Concepts',
          'Creator-Led Product Framing',
          'Native Vertical Delivery',
          'Ad-Ready Hook Variations',
        ],
        mockup_type: 'ugc',
        sort_order: 2,
      },
      {
        id: crypto.randomUUID(),
        number_label: '03',
        title: 'REELS & SHORT-FORM VIDEO',
        slug: 'reels-short-form-video',
        short_label: 'Reels',
        description:
          'Create engaging short-form video content for Instagram and other platforms.',
        deliverables: [
          'Pacing & Retention Editing',
          'Kinetic Typography & Captions',
          'Sound Design & Color Grade',
          'Multi-Platform Exports',
        ],
        mockup_type: 'reels',
        sort_order: 3,
      },
      {
        id: crypto.randomUUID(),
        number_label: '04',
        title: 'CAROUSEL DESIGN',
        slug: 'carousel-design',
        short_label: 'Carousels',
        description:
          'Turn complex ideas into engaging, visually compelling carousel content.',
        deliverables: [
          'Editorial Slide Architecture',
          'Custom Visual Systems',
          'LinkedIn PDF & IG Ready',
          'High-Clarity Typography',
        ],
        mockup_type: 'carousels',
        sort_order: 4,
      },
      {
        id: crypto.randomUUID(),
        number_label: '05',
        title: 'YOUTUBE THUMBNAILS',
        slug: 'youtube-thumbnails',
        short_label: 'Thumbnails',
        description:
          'Design high-impact thumbnails that communicate clearly and attract clicks.',
        deliverables: [
          'Concept & Visual Hook Strategy',
          'Subject Cutout & Lighting',
          'Title-Thumbnail Contrast Check',
          'Mobile-Legible Compositions',
        ],
        mockup_type: 'thumbnails',
        sort_order: 5,
      },
    ];

    for (const s of seedServices) {
      insertService.run(
        s.id,
        s.number_label,
        s.title,
        s.slug,
        s.short_label,
        s.description,
        JSON.stringify(s.deliverables),
        s.mockup_type,
        1,
        s.sort_order,
        ts,
        ts
      );
    }
  }

  const projectsCount = sqlite.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number };
  if (projectsCount.c === 0) {
    const insertProject = sqlite.prepare(`
      INSERT INTO projects (id, title, slug, category, short_summary, description, image_url, tags, external_url, is_concept, is_published, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedProjects = [
      {
        id: crypto.randomUUID(),
        title: 'Founder Authority Editorial System',
        slug: 'founder-authority-editorial-system',
        category: 'LinkedIn',
        short_summary:
          'Concept identity, narrative pillars, and typographic post system designed for B2B founders building credibility on LinkedIn.',
        description:
          'A complete concept direction demonstrating how CreatorFctry structures a founder’s LinkedIn presence: sharp profile art direction, recurring editorial post formats, structured thought-leadership hooks, and cohesive visual grids built for consistent publishing.',
        image_url: '/src/assets/images/project_linkedin_brand_1795253941857.jpg',
        tags: ['Ghostwriting', 'Visual Identity', 'Content Calendar'],
        external_url: '',
        sort_order: 1,
      },
      {
        id: crypto.randomUUID(),
        title: 'Studio-Lit Creator UGC Framework',
        slug: 'studio-lit-creator-ugc-framework',
        category: 'UGC',
        short_summary:
          'Concept vertical video production system balancing raw creator authenticity with deliberate lighting and crisp product storytelling.',
        description:
          'Designed as a concept production template for consumer and DTC brands. Combines scripted 3-second visual hooks, hands-on product demonstrations, natural conversational pacing, and multiple modular cutdowns for paid social and organic feeds.',
        image_url: '/src/assets/images/project_ugc_studio_1795253942246.jpg',
        tags: ['Creator Direction', 'Hook Scripting', 'Vertical 9:16'],
        external_url: '',
        sort_order: 2,
      },
      {
        id: crypto.randomUUID(),
        title: 'Kinetic Short-Form Reel Cut',
        slug: 'kinetic-short-form-reel-cut',
        category: 'Reels',
        short_summary:
          'Concept editing language using bold frame markers, rhythmic sound cuts, and monochrome-plus-electric-blue motion typography.',
        description:
          'A short-form editing concept built to hold viewer attention without cheap sensory overload. Features structured visual chapters, intentional b-roll pacing, tactile sound design cues, and clean editorial captions readable with or without sound.',
        image_url: '/src/assets/images/project_reels_motion_1795253941896.jpg',
        tags: ['Retention Editing', 'Motion Graphics', 'Sound Design'],
        external_url: '',
        sort_order: 3,
      },
      {
        id: crypto.randomUUID(),
        title: 'Swiss Grid Idea-to-Slide Carousel',
        slug: 'swiss-grid-idea-to-slide-carousel',
        category: 'Carousels',
        short_summary:
          'Concept multi-slide carousel deck translating dense industry frameworks into scannable neo-brutalist visual cards.',
        description:
          'Built for high-save educational storytelling across LinkedIn PDFs and Instagram carousels. Uses strict grid proportions, bold burnt orange visual anchors, and crisp typographic hierarchy so complex concepts read clearly on mobile screens.',
        image_url: '/src/assets/images/project_carousel_grid_1795253941514.jpg',
        tags: ['Carousel Architecture', 'Information Design', 'Editorial Layout'],
        external_url: '',
        sort_order: 4,
      },
      {
        id: crypto.randomUUID(),
        title: 'High-Contrast Creator Thumbnail Kit',
        slug: 'high-contrast-creator-thumbnail-kit',
        category: 'Thumbnails',
        short_summary:
          'Concept YouTube packaging exploring expressive monochrome portraits against geometric burnt orange and electric blue planes.',
        description:
          'A packaging concept focused on instant visual comprehension at small mobile feed sizes. Pairs clean subject separation and dramatic key lighting with disciplined color blocking so the title and thumbnail reinforce a single curiosity gap.',
        image_url: '/src/assets/images/project_youtube_thumb_1795253941534.jpg',
        tags: ['Packaging Strategy', 'Photo Compositing', 'Color Contrast'],
        external_url: '',
        sort_order: 5,
      },
    ];

    for (const p of seedProjects) {
      insertProject.run(
        p.id,
        p.title,
        p.slug,
        p.category,
        p.short_summary,
        p.description,
        p.image_url,
        JSON.stringify(p.tags),
        p.external_url,
        1,
        1,
        p.sort_order,
        ts,
        ts
      );
    }
  }

  const packagesCount = sqlite.prepare('SELECT COUNT(*) as c FROM packages').get() as { c: number };
  if (packagesCount.c === 0) {
    const insertPkg = sqlite.prepare(`
      INSERT INTO packages (id, name, tagline, currency, price_display, billing_type, description, features, deliverables_count, revisions_count, cta_label, is_featured, is_published, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedPackages = [
      {
        id: crypto.randomUUID(),
        name: 'STARTER',
        tagline: 'Focused single-format momentum',
        currency: 'USD' as CurrencyCode,
        price_display: 'Custom Scope',
        billing_type: 'Project or Monthly',
        description:
          'Built for creators and emerging brands launching a single consistent content channel with sharp creative direction.',
        features: [
          '1 Core Content Format (Reels, Carousels, or Thumbnails)',
          'Creative Direction & Hook Planning',
          'Brand-Consistent Visual System',
          'Ready-to-Publish Asset Delivery',
        ],
        deliverables_count: '4–8 Assets / mo',
        revisions_count: '2 Rounds per Asset',
        cta_label: 'GET A CUSTOM QUOTE',
        is_featured: 0,
        sort_order: 1,
      },
      {
        id: crypto.randomUUID(),
        name: 'GROWTH',
        tagline: 'Multi-format studio production',
        currency: 'USD' as CurrencyCode,
        price_display: 'Custom Retainer',
        billing_type: 'Monthly',
        description:
          'Our unified creative factory for brands scaling across short-form video, UGC, carousels, and visual packaging.',
        features: [
          'Up to 3 Formats Under One Creative Direction',
          'Monthly Content Strategy & Scripting',
          'Reels Editing + Carousel Design + Thumbnails/UGC',
          'Dedicated Studio Review Workflow',
        ],
        deliverables_count: '12–20 Assets / mo',
        revisions_count: 'Priority Revisions',
        cta_label: 'GET A CUSTOM QUOTE',
        is_featured: 1,
        sort_order: 2,
      },
      {
        id: crypto.randomUUID(),
        name: 'PERSONAL BRAND',
        tagline: 'Founder authority & executive presence',
        currency: 'USD' as CurrencyCode,
        price_display: 'Custom Retainer',
        billing_type: 'Monthly',
        description:
          'End-to-end LinkedIn positioning, ghostwriting, and companion visual carousels for founders and industry voices.',
        features: [
          'Founder Voice Extraction & Editorial Calendar',
          'LinkedIn Ghostwriting & Thought Leadership',
          'Custom Editorial Carousel Design',
          'Profile & Visual Identity Alignment',
        ],
        deliverables_count: '12–16 Posts + Carousels',
        revisions_count: 'Collaborative Refinement',
        cta_label: 'GET A CUSTOM QUOTE',
        is_featured: 0,
        sort_order: 3,
      },
    ];

    for (const pkg of seedPackages) {
      insertPkg.run(
        pkg.id,
        pkg.name,
        pkg.tagline,
        pkg.currency,
        pkg.price_display,
        pkg.billing_type,
        pkg.description,
        JSON.stringify(pkg.features),
        pkg.deliverables_count,
        pkg.revisions_count,
        pkg.cta_label,
        pkg.is_featured,
        1,
        pkg.sort_order,
        ts,
        ts
      );
    }
  }
}

seedInitialData();

// Row mapping helpers
function mapProject(row: Record<string, unknown>): ProjectItem {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    category: row.category as ProjectItem['category'],
    short_summary: String(row.short_summary || ''),
    description: String(row.description || ''),
    image_url: String(row.image_url || ''),
    tags: parseJsonArray<string>(row.tags),
    external_url: String(row.external_url || ''),
    is_concept: Boolean(row.is_concept),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order || 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapService(row: Record<string, unknown>): ServiceItem {
  return {
    id: String(row.id),
    number_label: String(row.number_label),
    title: String(row.title),
    slug: String(row.slug),
    short_label: String(row.short_label),
    description: String(row.description),
    deliverables: parseJsonArray<string>(row.deliverables),
    mockup_type: row.mockup_type as ServiceItem['mockup_type'],
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order || 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapPackage(row: Record<string, unknown>): PackageItem {
  return {
    id: String(row.id),
    name: String(row.name),
    tagline: String(row.tagline || ''),
    currency: (row.currency === 'INR' ? 'INR' : 'USD') as CurrencyCode,
    price_display: String(row.price_display),
    billing_type: String(row.billing_type || 'Monthly'),
    description: String(row.description || ''),
    features: parseJsonArray<string>(row.features),
    deliverables_count: String(row.deliverables_count || ''),
    revisions_count: String(row.revisions_count || ''),
    cta_label: String(row.cta_label || 'GET A CUSTOM QUOTE'),
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order || 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapInquiry(row: Record<string, unknown>): InquiryItem {
  const inferredCurrency: CurrencyCode =
    row.currency === 'INR' ||
    (row.currency !== 'USD' && String(row.budget_range || '').includes('₹'))
      ? 'INR'
      : 'USD';

  return {
    id: String(row.id),
    full_name: String(row.full_name),
    email: String(row.email),
    brand_name: String(row.brand_name || ''),
    service_required: String(row.service_required),
    currency: inferredCurrency,
    budget_range: String(row.budget_range),
    project_details: String(row.project_details),
    status: (row.status as InquiryStatus) || 'new',
    admin_notes: String(row.admin_notes || ''),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapTestimonial(row: Record<string, unknown>): TestimonialItem {
  return {
    id: String(row.id),
    author_name: String(row.author_name),
    author_role: String(row.author_role || ''),
    company: String(row.company || ''),
    quote: String(row.quote),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order || 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapSettings(row: Record<string, unknown>): SiteSettings {
  return {
    id: Number(row.id || 1),
    brand_name: String(row.brand_name || 'CREATORFCTRY'),
    tagline: String(row.tagline || 'One Factory. Every Format.'),
    contact_email: String(row.contact_email || 'creatorfctry@gmail.com'),
    instagram_handle: String(row.instagram_handle || '@creatorfctry'),
    instagram_url: String(row.instagram_url || 'https://instagram.com/creatorfctry'),
    social_links: parseJsonArray(row.social_links),
    about_headline: String(row.about_headline || 'A SMALL STUDIO. BIG CREATIVE ENERGY.'),
    about_body: String(row.about_body || ''),
    hero_kicker: String(row.hero_kicker || 'CONTENT & CREATOR GROWTH STUDIO'),
    hero_headline_line1: String(row.hero_headline_line1 || 'ONE FACTORY.'),
    hero_headline_line2: String(row.hero_headline_line2 || 'EVERY FORMAT.'),
    hero_subheadline: String(row.hero_subheadline || ''),
    budget_options: parseJsonArray<string>(row.budget_options),
    updated_at: String(row.updated_at || nowIso()),
  };
}

// ---------- Password & Token Security ----------
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

export function createSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 12, // 12h
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyLocalSessionToken(token: string): { email: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return { email: String(parsed.email || 'admin') };
  } catch {
    return null;
  }
}

let cachedSupabaseReady: boolean | null = null;
let lastSupabaseCheckAt = 0;

export async function isSupabaseReady(): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const now = Date.now();
  if (cachedSupabaseReady === true) return true;
  if (cachedSupabaseReady === false && now - lastSupabaseCheckAt < 15000) {
    return false;
  }
  lastSupabaseCheckAt = now;
  try {
    const [pkgRes, inqRes] = await Promise.all([
      supabaseAdmin.from('packages').select('id').limit(1),
      supabaseAdmin.from('inquiries').select('id').limit(1),
    ]);
    if (pkgRes.error || inqRes.error) {
      cachedSupabaseReady = false;
      return false;
    }
    cachedSupabaseReady = true;
    return true;
  } catch {
    cachedSupabaseReady = false;
    return false;
  }
}

export async function getAuthSetupState(): Promise<{
  needsSetup: boolean;
  hasEnvPasscode: boolean;
  supabaseEnabled: boolean;
}> {
  const envPass = process.env.ADMIN_PASSCODE?.trim() || '';
  if (await isSupabaseReady()) {
    return { needsSetup: false, hasEnvPasscode: false, supabaseEnabled: true };
  }
  if (envPass) {
    return { needsSetup: false, hasEnvPasscode: true, supabaseEnabled: false };
  }
  const existing = sqlite
    .prepare('SELECT id FROM admin_credentials WHERE id = 1')
    .get();
  return {
    needsSetup: !existing,
    hasEnvPasscode: false,
    supabaseEnabled: false,
  };
}

export function claimInitialAdminPassword(email: string, password: string): { ok: boolean; error?: string } {
  const envPass = process.env.ADMIN_PASSCODE?.trim() || '';
  if (envPass) {
    return { ok: false, error: 'Admin passcode is managed via environment configuration.' };
  }
  const existing = sqlite.prepare('SELECT id FROM admin_credentials WHERE id = 1').get();
  if (existing) {
    return { ok: false, error: 'Admin password has already been claimed.' };
  }
  const ts = nowIso();
  const passwordHash = hashPassword(password);
  sqlite
    .prepare(
      'INSERT INTO admin_credentials (id, email, password_hash, created_at, updated_at) VALUES (1, ?, ?, ?, ?)'
    )
    .run(email.trim().toLowerCase(), passwordHash, ts, ts);
  return { ok: true };
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ ok: boolean; token?: string; email?: string; error?: string }> {
  if ((await isSupabaseReady()) && supabaseAuthClient && supabaseAdmin) {
    const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.session || !data.user) {
      return { ok: false, error: error?.message || 'Invalid credentials.' };
    }
    const { data: adminRow, error: adminErr } = await supabaseAdmin
      .from('admin_users')
      .select('user_id, email, role')
      .eq('user_id', data.user.id)
      .in('role', ['admin', 'owner'])
      .maybeSingle();
    if (adminErr || !adminRow) {
      return { ok: false, error: 'Account does not have studio admin permissions.' };
    }
    return {
      ok: true,
      token: data.session.access_token,
      email: data.user.email || email,
    };
  }

  const envPass = process.env.ADMIN_PASSCODE?.trim() || '';
  const envEmail = (process.env.ADMIN_EMAIL?.trim() || 'creatorfctry@gmail.com').toLowerCase();

  if (envPass) {
    const passA = Buffer.from(password);
    const passB = Buffer.from(envPass);
    if (passA.length !== passB.length || !crypto.timingSafeEqual(passA, passB)) {
      return { ok: false, error: 'Invalid admin credentials.' };
    }
    const token = createSessionToken(email.trim() || envEmail);
    return { ok: true, token, email: email.trim() || envEmail };
  }

  const cred = sqlite
    .prepare('SELECT email, password_hash FROM admin_credentials WHERE id = 1')
    .get() as { email: string; password_hash: string } | undefined;

  if (!cred) {
    return { ok: false, error: 'Admin account not yet initialized.' };
  }

  if (email.trim().toLowerCase() !== cred.email.toLowerCase()) {
    return { ok: false, error: 'Invalid admin credentials.' };
  }

  if (!verifyPasswordHash(password, cred.password_hash)) {
    return { ok: false, error: 'Invalid admin credentials.' };
  }

  const token = createSessionToken(cred.email);
  return { ok: true, token, email: cred.email };
}

export async function verifyAdminRequest(
  authHeader: string | undefined
): Promise<{ email: string; accessToken?: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  if ((await isSupabaseReady()) && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    const { data: adminRow, error: adminErr } = await supabaseAdmin
      .from('admin_users')
      .select('user_id, email, role')
      .eq('user_id', data.user.id)
      .in('role', ['admin', 'owner'])
      .maybeSingle();
    if (adminErr || !adminRow) return null;
    return { email: data.user.email || 'admin', accessToken: token };
  }

  const local = verifyLocalSessionToken(token);
  return local ? { email: local.email } : null;
}

export async function logoutAdminSession(authHeader: string | undefined): Promise<void> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return;
  const token = authHeader.slice(7).trim();
  if (!token || !supabaseAdmin || !(await isSupabaseReady())) return;
  try {
    await supabaseAdmin.auth.admin.signOut(token, 'local');
  } catch {
    // Ignore sign-out errors if token is already expired or invalid
  }
}

let supabaseSeedChecked = false;

// ---------- Data Access Layer (Supabase OR SQLite) ----------
export const studioDb = {
  async ensureSupabaseSeeded(): Promise<void> {
    if (supabaseSeedChecked) return;
    if (!(await isSupabaseReady()) || !supabaseAdmin) return;

    try {
      const [svcCountRes, projCountRes, pkgCountRes, settingsRes] = await Promise.all([
        supabaseAdmin.from('services').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('packages').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('site_settings').select('id').eq('id', 1).maybeSingle(),
      ]);

      if (svcCountRes.count === 0) {
        await supabaseAdmin.from('services').insert(
          DEFAULT_SERVICES_SEED.map((s) => ({
            ...s,
            is_published: true,
          }))
        );
      }

      if (projCountRes.count === 0) {
        await supabaseAdmin.from('projects').insert(
          DEFAULT_PROJECTS_SEED.map((p) => ({
            ...p,
            is_concept: true,
            is_published: true,
          }))
        );
      }

      if (pkgCountRes.count === 0) {
        await supabaseAdmin.from('packages').insert(
          DEFAULT_PACKAGES_SEED.map((pkg) => ({
            ...pkg,
            is_published: true,
          }))
        );
      }

      if (!settingsRes.data) {
        await supabaseAdmin.from('site_settings').upsert(DEFAULT_SITE_SETTINGS_SEED, {
          onConflict: 'id',
        });
      }

      supabaseSeedChecked = true;
    } catch (err) {
      console.error(
        'Supabase initial seed check skipped:',
        err instanceof Error ? err.message : err
      );
    }
  },

  async checkSupabaseSchema(): Promise<{
    supabaseSchemaReady: boolean;
    supabaseAnonKeyConfigured: boolean;
    supabaseError?: string;
  }> {
    const supabaseAnonKeyConfigured = Boolean(supabaseAnonKey);
    if (!supabaseAdmin) {
      return { supabaseSchemaReady: false, supabaseAnonKeyConfigured };
    }
    try {
      const [pkgRes, inqRes] = await Promise.all([
        supabaseAdmin.from('packages').select('id, currency').limit(1),
        supabaseAdmin.from('inquiries').select('id, currency').limit(1),
      ]);
      if (pkgRes.error) {
        return {
          supabaseSchemaReady: false,
          supabaseAnonKeyConfigured,
          supabaseError: `packages: ${pkgRes.error.code || ''} ${pkgRes.error.message}`,
        };
      }
      if (inqRes.error) {
        return {
          supabaseSchemaReady: false,
          supabaseAnonKeyConfigured,
          supabaseError: `inquiries: ${inqRes.error.code || ''} ${inqRes.error.message}`,
        };
      }
      return { supabaseSchemaReady: true, supabaseAnonKeyConfigured };
    } catch (err) {
      return {
        supabaseSchemaReady: false,
        supabaseAnonKeyConfigured,
        supabaseError: err instanceof Error ? err.message : 'Unknown Supabase error',
      };
    }
  },

  async getPublicBootstrap() {
    if (await isSupabaseReady()) {
      await this.ensureSupabaseSeeded();
      const sb = supabaseAnonClient || supabaseAdmin;
      if (sb) {
        const [projectsRes, servicesRes, packagesRes, testimonialsRes, settingsRes] =
          await Promise.all([
            sb
              .from('projects')
              .select('*')
              .eq('is_published', true)
              .order('sort_order', { ascending: true })
              .order('created_at', { ascending: false }),
            sb
              .from('services')
              .select('*')
              .eq('is_published', true)
              .order('sort_order', { ascending: true }),
            sb
              .from('packages')
              .select('*')
              .eq('is_published', true)
              .order('sort_order', { ascending: true }),
            sb
              .from('testimonials')
              .select('*')
              .eq('is_published', true)
              .order('sort_order', { ascending: true }),
            sb.from('site_settings').select('*').eq('id', 1).maybeSingle(),
          ]);

        if (projectsRes.error) throw new Error(projectsRes.error.message);
        if (servicesRes.error) throw new Error(servicesRes.error.message);
        if (packagesRes.error) throw new Error(packagesRes.error.message);
        if (testimonialsRes.error) throw new Error(testimonialsRes.error.message);
        if (settingsRes.error) throw new Error(settingsRes.error.message);

        return {
          projects: (projectsRes.data || []).map(mapProject),
          services: (servicesRes.data || []).map(mapService),
          packages: (packagesRes.data || []).map(mapPackage),
          testimonials: (testimonialsRes.data || []).map(mapTestimonial),
          settings: mapSettings(settingsRes.data || DEFAULT_SITE_SETTINGS_SEED),
        };
      }
    }

    const projects = sqlite
      .prepare('SELECT * FROM projects WHERE is_published = 1 ORDER BY sort_order ASC, created_at DESC')
      .all() as Record<string, unknown>[];
    const services = sqlite
      .prepare('SELECT * FROM services WHERE is_published = 1 ORDER BY sort_order ASC')
      .all() as Record<string, unknown>[];
    const packages = sqlite
      .prepare('SELECT * FROM packages WHERE is_published = 1 ORDER BY sort_order ASC')
      .all() as Record<string, unknown>[];
    const testimonials = sqlite
      .prepare('SELECT * FROM testimonials WHERE is_published = 1 ORDER BY sort_order ASC')
      .all() as Record<string, unknown>[];
    const settings = sqlite
      .prepare('SELECT * FROM site_settings WHERE id = 1')
      .get() as Record<string, unknown>;

    return {
      projects: projects.map(mapProject),
      services: services.map(mapService),
      packages: packages.map(mapPackage),
      testimonials: testimonials.map(mapTestimonial),
      settings: mapSettings(settings),
    };
  },

  async getPublishedProjectBySlug(slug: string): Promise<ProjectItem | null> {
    if (await isSupabaseReady()) {
      const sb = supabaseAnonClient || supabaseAdmin;
      if (sb) {
        const { data, error } = await sb
          .from('projects')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data ? mapProject(data) : null;
      }
    }
    const row = sqlite
      .prepare('SELECT * FROM projects WHERE slug = ? AND is_published = 1')
      .get(slug) as Record<string, unknown> | undefined;
    return row ? mapProject(row) : null;
  },

  async createInquiry(input: {
    full_name: string;
    email: string;
    brand_name: string;
    service_required: string;
    currency: CurrencyCode;
    budget_range: string;
    project_details: string;
    source_ip_hash: string;
  }): Promise<InquiryItem> {
    const id = crypto.randomUUID();
    const ts = nowIso();
    if (await isSupabaseReady()) {
      const sb = supabaseAnonClient || supabaseAdmin;
      if (sb) {
        const { error } = await sb.from('inquiries').insert({
          id,
          full_name: input.full_name,
          email: input.email,
          brand_name: input.brand_name,
          service_required: input.service_required,
          currency: input.currency,
          budget_range: input.budget_range,
          project_details: input.project_details,
          status: 'new',
          admin_notes: '',
          source_ip_hash: input.source_ip_hash,
        });
        if (error) throw new Error(error.message);
        return {
          id,
          full_name: input.full_name,
          email: input.email,
          brand_name: input.brand_name,
          service_required: input.service_required,
          currency: input.currency,
          budget_range: input.budget_range,
          project_details: input.project_details,
          status: 'new',
          admin_notes: '',
          created_at: ts,
          updated_at: ts,
        };
      }
    }

    sqlite
      .prepare(
        `INSERT INTO inquiries (id, full_name, email, brand_name, service_required, currency, budget_range, project_details, status, admin_notes, source_ip_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', '', ?, ?, ?)`
      )
      .run(
        id,
        input.full_name,
        input.email,
        input.brand_name,
        input.service_required,
        input.currency,
        input.budget_range,
        input.project_details,
        input.source_ip_hash,
        ts,
        ts
      );
    const created = sqlite
      .prepare('SELECT * FROM inquiries WHERE id = ?')
      .get(id) as Record<string, unknown>;
    return mapInquiry(created);
  },

  // --- ADMIN OVERVIEW ---
  async getAdminOverview(accessToken?: string): Promise<AdminOverviewStats> {
    if (await isSupabaseReady()) {
      await this.ensureSupabaseSeeded();
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const [inqAll, inqNew, projAll, pkgAll, testPub, recent] = await Promise.all([
          sb.from('inquiries').select('id', { count: 'exact', head: true }),
          sb
            .from('inquiries')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'new'),
          sb.from('projects').select('id, is_published'),
          sb.from('packages').select('id, is_published'),
          sb
            .from('testimonials')
            .select('id', { count: 'exact', head: true })
            .eq('is_published', true),
          sb
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        if (inqAll.error) throw new Error(inqAll.error.message);
        if (projAll.error) throw new Error(projAll.error.message);
        if (pkgAll.error) throw new Error(pkgAll.error.message);
        if (recent.error) throw new Error(recent.error.message);

        const projRows = projAll.data || [];
        const pkgRows = pkgAll.data || [];
        return {
          totalInquiries: inqAll.count || 0,
          newInquiries: inqNew.count || 0,
          publishedProjects: projRows.filter((p) => p.is_published).length,
          totalProjects: projRows.length,
          totalPackages: pkgRows.length,
          publishedPackages: pkgRows.filter((p) => p.is_published).length,
          publishedTestimonials: testPub.count || 0,
          backendMode: 'supabase',
          recentInquiries: (recent.data || []).map(mapInquiry),
        };
      }
    }

    const totalInq = (sqlite.prepare('SELECT COUNT(*) as c FROM inquiries').get() as { c: number }).c;
    const newInq = (
      sqlite.prepare("SELECT COUNT(*) as c FROM inquiries WHERE status = 'new'").get() as { c: number }
    ).c;
    const pubProj = (
      sqlite.prepare('SELECT COUNT(*) as c FROM projects WHERE is_published = 1').get() as { c: number }
    ).c;
    const totalProj = (sqlite.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number }).c;
    const totalPkg = (sqlite.prepare('SELECT COUNT(*) as c FROM packages').get() as { c: number }).c;
    const pubPkg = (
      sqlite.prepare('SELECT COUNT(*) as c FROM packages WHERE is_published = 1').get() as { c: number }
    ).c;
    const pubTest = (
      sqlite.prepare('SELECT COUNT(*) as c FROM testimonials WHERE is_published = 1').get() as { c: number }
    ).c;
    const recent = sqlite
      .prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 5')
      .all() as Record<string, unknown>[];

    return {
      totalInquiries: totalInq,
      newInquiries: newInq,
      publishedProjects: pubProj,
      totalProjects: totalProj,
      totalPackages: totalPkg,
      publishedPackages: pubPkg,
      publishedTestimonials: pubTest,
      backendMode: 'sqlite',
      recentInquiries: recent.map(mapInquiry),
    };
  },

  // --- PROJECTS CRUD ---
  async listAllProjects(accessToken?: string): Promise<ProjectItem[]> {
    if (await isSupabaseReady()) {
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('projects')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data || []).map(mapProject);
      }
    }
    const rows = sqlite
      .prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC')
      .all() as Record<string, unknown>[];
    return rows.map(mapProject);
  },

  async createProject(
    input: Omit<ProjectItem, 'id' | 'created_at' | 'updated_at'>,
    accessToken?: string
  ): Promise<ProjectItem> {
    const id = crypto.randomUUID();
    const ts = nowIso();
    if (await isSupabaseReady()) {
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('projects')
          .insert({ id, ...input })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return mapProject(data);
      }
    }
    sqlite
      .prepare(
        `INSERT INTO projects (id, title, slug, category, short_summary, description, image_url, tags, external_url, is_concept, is_published, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.title,
        input.slug,
        input.category,
        input.short_summary,
        input.description,
        input.image_url,
        JSON.stringify(input.tags),
        input.external_url,
        input.is_concept ? 1 : 0,
        input.is_published ? 1 : 0,
        input.sort_order,
        ts,
        ts
      );
    const created = sqlite
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(id) as Record<string, unknown>;
    return mapProject(created);
  },

  async updateProject(
    id: string,
    input: Partial<Omit<ProjectItem, 'id' | 'created_at' | 'updated_at'>>,
    accessToken?: string
  ): Promise<ProjectItem | null> {
    const ts = nowIso();
    if (await isSupabaseReady()) {
      if (!isValidUuid(id)) return null;
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('projects')
          .update(input)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data ? mapProject(data) : null;
      }
    }

    const existing = sqlite
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;
    if (!existing) return null;
    const current = mapProject(existing);
    const merged = { ...current, ...input };

    sqlite
      .prepare(
        `UPDATE projects SET title = ?, slug = ?, category = ?, short_summary = ?, description = ?, image_url = ?, tags = ?, external_url = ?, is_concept = ?, is_published = ?, sort_order = ?, updated_at = ? WHERE id = ?`
      )
      .run(
        merged.title,
        merged.slug,
        merged.category,
        merged.short_summary,
        merged.description,
        merged.image_url,
        JSON.stringify(merged.tags),
        merged.external_url,
        merged.is_concept ? 1 : 0,
        merged.is_published ? 1 : 0,
        merged.sort_order,
        ts,
        id
      );
    const updated = sqlite
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(id) as Record<string, unknown>;
    return mapProject(updated);
  },

  async deleteProject(id: string, accessToken?: string): Promise<boolean> {
    if (await isSupabaseReady()) {
      if (!isValidUuid(id)) return false;
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('projects')
          .delete()
          .eq('id', id)
          .select('id');
        if (error) throw new Error(error.message);
        return Boolean(data && data.length > 0);
      }
    }
    const info = sqlite.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return info.changes > 0;
  },

  // --- SERVICES CRUD ---
  async listAllServices(accessToken?: string): Promise<ServiceItem[]> {
    if (await isSupabaseReady()) {
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('services')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw new Error(error.message);
        return (data || []).map(mapService);
      }
    }
    const rows = sqlite
      .prepare('SELECT * FROM services ORDER BY sort_order ASC')
      .all() as Record<string, unknown>[];
    return rows.map(mapService);
  },

  async updateService(
    id: string,
    input: Partial<Omit<ServiceItem, 'id' | 'created_at' | 'updated_at'>>,
    accessToken?: string
  ): Promise<ServiceItem | null> {
    const ts = nowIso();
    if (await isSupabaseReady()) {
      if (!isValidUuid(id)) return null;
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('services')
          .update(input)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data ? mapService(data) : null;
      }
    }
    const existing = sqlite
      .prepare('SELECT * FROM services WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;
    if (!existing) return null;
    const current = mapService(existing);
    const merged = { ...current, ...input };
    sqlite
      .prepare(
        `UPDATE services SET number_label = ?, title = ?, slug = ?, short_label = ?, description = ?, deliverables = ?, mockup_type = ?, is_published = ?, sort_order = ?, updated_at = ? WHERE id = ?`
      )
      .run(
        merged.number_label,
        merged.title,
        merged.slug,
        merged.short_label,
        merged.description,
        JSON.stringify(merged.deliverables),
        merged.mockup_type,
        merged.is_published ? 1 : 0,
        merged.sort_order,
        ts,
        id
      );
    const updated = sqlite
      .prepare('SELECT * FROM services WHERE id = ?')
      .get(id) as Record<string, unknown>;
    return mapService(updated);
  },

  // --- PACKAGES CRUD ---
  async listAllPackages(accessToken?: string): Promise<PackageItem[]> {
    if (await isSupabaseReady()) {
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('packages')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw new Error(error.message);
        return (data || []).map(mapPackage);
      }
    }
    const rows = sqlite
      .prepare('SELECT * FROM packages ORDER BY sort_order ASC')
      .all() as Record<string, unknown>[];
    return rows.map(mapPackage);
  },

  async createPackage(
    input: Omit<PackageItem, 'id' | 'created_at' | 'updated_at'>,
    accessToken?: string
  ): Promise<PackageItem> {
    const id = crypto.randomUUID();
    const ts = nowIso();
    if (await isSupabaseReady()) {
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('packages')
          .insert({ id, ...input })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return mapPackage(data);
      }
    }
    sqlite
      .prepare(
        `INSERT INTO packages (id, name, tagline, currency, price_display, billing_type, description, features, deliverables_count, revisions_count, cta_label, is_featured, is_published, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.name,
        input.tagline,
        input.currency || 'USD',
        input.price_display,
        input.billing_type,
        input.description,
        JSON.stringify(input.features),
        input.deliverables_count,
        input.revisions_count,
        input.cta_label,
        input.is_featured ? 1 : 0,
        input.is_published ? 1 : 0,
        input.sort_order,
        ts,
        ts
      );
    const created = sqlite
      .prepare('SELECT * FROM packages WHERE id = ?')
      .get(id) as Record<string, unknown>;
    return mapPackage(created);
  },

  async updatePackage(
    id: string,
    input: Partial<Omit<PackageItem, 'id' | 'created_at' | 'updated_at'>>,
    accessToken?: string
  ): Promise<PackageItem | null> {
    const ts = nowIso();
    if (await isSupabaseReady()) {
      if (!isValidUuid(id)) return null;
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('packages')
          .update(input)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data ? mapPackage(data) : null;
      }
    }
    const existing = sqlite
      .prepare('SELECT * FROM packages WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;
    if (!existing) return null;
    const current = mapPackage(existing);
    const merged = { ...current, ...input };
    sqlite
      .prepare(
        `UPDATE packages SET name = ?, tagline = ?, currency = ?, price_display = ?, billing_type = ?, description = ?, features = ?, deliverables_count = ?, revisions_count = ?, cta_label = ?, is_featured = ?, is_published = ?, sort_order = ?, updated_at = ? WHERE id = ?`
      )
      .run(
        merged.name,
        merged.tagline,
        merged.currency || 'USD',
        merged.price_display,
        merged.billing_type,
        merged.description,
        JSON.stringify(merged.features),
        merged.deliverables_count,
        merged.revisions_count,
        merged.cta_label,
        merged.is_featured ? 1 : 0,
        merged.is_published ? 1 : 0,
        merged.sort_order,
        ts,
        id
      );
    const updated = sqlite
      .prepare('SELECT * FROM packages WHERE id = ?')
      .get(id) as Record<string, unknown>;
    return mapPackage(updated);
  },

  async deletePackage(id: string, accessToken?: string): Promise<boolean> {
    if (await isSupabaseReady()) {
      if (!isValidUuid(id)) return false;
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('packages')
          .delete()
          .eq('id', id)
          .select('id');
        if (error) throw new Error(error.message);
        return Boolean(data && data.length > 0);
      }
    }
    const info = sqlite.prepare('DELETE FROM packages WHERE id = ?').run(id);
    return info.changes > 0;
  },

  // --- INQUIRIES MANAGEMENT ---
  async listAllInquiries(accessToken?: string): Promise<InquiryItem[]> {
    if (await isSupabaseReady()) {
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data || []).map(mapInquiry);
      }
    }
    const rows = sqlite
      .prepare('SELECT * FROM inquiries ORDER BY created_at DESC')
      .all() as Record<string, unknown>[];
    return rows.map(mapInquiry);
  },

  async updateInquiry(
    id: string,
    input: { status?: InquiryStatus; admin_notes?: string },
    accessToken?: string
  ): Promise<InquiryItem | null> {
    const ts = nowIso();
    if (await isSupabaseReady()) {
      if (!isValidUuid(id)) return null;
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('inquiries')
          .update(input)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data ? mapInquiry(data) : null;
      }
    }
    const existing = sqlite
      .prepare('SELECT * FROM inquiries WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;
    if (!existing) return null;
    const current = mapInquiry(existing);
    const status = input.status ?? current.status;
    const adminNotes = input.admin_notes ?? current.admin_notes;
    sqlite
      .prepare('UPDATE inquiries SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?')
      .run(status, adminNotes, ts, id);
    const updated = sqlite
      .prepare('SELECT * FROM inquiries WHERE id = ?')
      .get(id) as Record<string, unknown>;
    return mapInquiry(updated);
  },

  async deleteInquiry(id: string, accessToken?: string): Promise<boolean> {
    if (await isSupabaseReady()) {
      if (!isValidUuid(id)) return false;
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('inquiries')
          .delete()
          .eq('id', id)
          .select('id');
        if (error) throw new Error(error.message);
        return Boolean(data && data.length > 0);
      }
    }
    const info = sqlite.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
    return info.changes > 0;
  },

  // --- TESTIMONIALS CRUD ---
  async listAllTestimonials(accessToken?: string): Promise<TestimonialItem[]> {
    if (await isSupabaseReady()) {
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('testimonials')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data || []).map(mapTestimonial);
      }
    }
    const rows = sqlite
      .prepare('SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC')
      .all() as Record<string, unknown>[];
    return rows.map(mapTestimonial);
  },

  async createTestimonial(
    input: Omit<TestimonialItem, 'id' | 'created_at' | 'updated_at'>,
    accessToken?: string
  ): Promise<TestimonialItem> {
    const id = crypto.randomUUID();
    const ts = nowIso();
    if (await isSupabaseReady()) {
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('testimonials')
          .insert({ id, ...input })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return mapTestimonial(data);
      }
    }
    sqlite
      .prepare(
        `INSERT INTO testimonials (id, author_name, author_role, company, quote, is_published, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.author_name,
        input.author_role,
        input.company,
        input.quote,
        input.is_published ? 1 : 0,
        input.sort_order,
        ts,
        ts
      );
    const created = sqlite
      .prepare('SELECT * FROM testimonials WHERE id = ?')
      .get(id) as Record<string, unknown>;
    return mapTestimonial(created);
  },

  async updateTestimonial(
    id: string,
    input: Partial<Omit<TestimonialItem, 'id' | 'created_at' | 'updated_at'>>,
    accessToken?: string
  ): Promise<TestimonialItem | null> {
    const ts = nowIso();
    if (await isSupabaseReady()) {
      if (!isValidUuid(id)) return null;
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('testimonials')
          .update(input)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data ? mapTestimonial(data) : null;
      }
    }
    const existing = sqlite
      .prepare('SELECT * FROM testimonials WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;
    if (!existing) return null;
    const current = mapTestimonial(existing);
    const merged = { ...current, ...input };
    sqlite
      .prepare(
        `UPDATE testimonials SET author_name = ?, author_role = ?, company = ?, quote = ?, is_published = ?, sort_order = ?, updated_at = ? WHERE id = ?`
      )
      .run(
        merged.author_name,
        merged.author_role,
        merged.company,
        merged.quote,
        merged.is_published ? 1 : 0,
        merged.sort_order,
        ts,
        id
      );
    const updated = sqlite
      .prepare('SELECT * FROM testimonials WHERE id = ?')
      .get(id) as Record<string, unknown>;
    return mapTestimonial(updated);
  },

  async deleteTestimonial(id: string, accessToken?: string): Promise<boolean> {
    if (await isSupabaseReady()) {
      if (!isValidUuid(id)) return false;
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('testimonials')
          .delete()
          .eq('id', id)
          .select('id');
        if (error) throw new Error(error.message);
        return Boolean(data && data.length > 0);
      }
    }
    const info = sqlite.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
    return info.changes > 0;
  },

  // --- SITE SETTINGS ---
  async getSettings(accessToken?: string): Promise<SiteSettings> {
    if (await isSupabaseReady()) {
      await this.ensureSupabaseSeeded();
      const sb = accessToken
        ? getUserSupabaseClient(accessToken)
        : supabaseAnonClient || supabaseAdmin;
      if (sb) {
        const { data, error } = await sb
          .from('site_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (data) return mapSettings(data);
        return mapSettings(DEFAULT_SITE_SETTINGS_SEED);
      }
    }
    const row = sqlite
      .prepare('SELECT * FROM site_settings WHERE id = 1')
      .get() as Record<string, unknown>;
    return mapSettings(row);
  },

  async updateSettings(
    input: Partial<Omit<SiteSettings, 'id' | 'updated_at'>>,
    accessToken?: string
  ): Promise<SiteSettings> {
    const ts = nowIso();
    if (await isSupabaseReady()) {
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const { data, error } = await sb
          .from('site_settings')
          .upsert({ id: 1, ...input }, { onConflict: 'id' })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return mapSettings(data);
      }
    }
    const current = await this.getSettings();
    const merged = { ...current, ...input };
    sqlite
      .prepare(
        `UPDATE site_settings SET
          brand_name = ?, tagline = ?, contact_email = ?, instagram_handle = ?, instagram_url = ?,
          social_links = ?, about_headline = ?, about_body = ?, hero_kicker = ?,
          hero_headline_line1 = ?, hero_headline_line2 = ?, hero_subheadline = ?,
          budget_options = ?, updated_at = ?
         WHERE id = 1`
      )
      .run(
        merged.brand_name,
        merged.tagline,
        merged.contact_email,
        merged.instagram_handle,
        merged.instagram_url,
        JSON.stringify(merged.social_links),
        merged.about_headline,
        merged.about_body,
        merged.hero_kicker,
        merged.hero_headline_line1,
        merged.hero_headline_line2,
        merged.hero_subheadline,
        JSON.stringify(merged.budget_options),
        ts
      );
    return this.getSettings();
  },

  // --- ASSET UPLOAD ---
  async saveUploadedImage(
    buffer: Buffer,
    mimeType: string,
    accessToken?: string
  ): Promise<string> {
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const ext = extMap[mimeType];
    if (!ext) {
      throw new Error('Unsupported image format. Allowed: JPEG, PNG, WebP, GIF.');
    }
    const filename = `${crypto.randomUUID()}${ext}`;

    if (await isSupabaseReady()) {
      const sb = getUserSupabaseClient(accessToken);
      if (sb) {
        const storagePath = `projects/${filename}`;
        const { error } = await sb.storage
          .from('portfolio-assets')
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: false,
          });
        if (error) throw new Error(error.message);
        const { data } = sb.storage
          .from('portfolio-assets')
          .getPublicUrl(storagePath);
        return data.publicUrl;
      }
    }

    const destPath = path.resolve(UPLOADS_DIR, filename);
    if (!destPath.startsWith(UPLOADS_DIR + path.sep)) {
      throw new Error('Invalid destination path.');
    }
    fs.writeFileSync(destPath, buffer);
    return `/uploads/${filename}`;
  },
};
