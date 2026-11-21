import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import {
  authenticateAdmin,
  claimInitialAdminPassword,
  createSessionToken,
  getAuthSetupState,
  getPublicSupabaseConfig,
  isSupabaseConfigured,
  isSupabaseReady,
  logoutAdminSession,
  studioDb,
  UPLOADS_DIR,
  verifyAdminRequest,
} from './server/db';
import { BUDGET_OPTIONS_BY_CURRENCY } from './src/types/studio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Rate limiting store for inquiry submissions (in-memory sliding window)
const inquiryRateMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 6;

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex').slice(0, 16);
}

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const timestamps = (inquiryRateMap.get(ipHash) || []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) {
    inquiryRateMap.set(ipHash, timestamps);
    return false;
  }
  timestamps.push(now);
  inquiryRateMap.set(ipHash, timestamps);
  return true;
}

const inquirySchema = z
  .object({
    full_name: z.string().trim().min(2, 'Please enter your full name.').max(120),
    email: z.string().trim().email('Please provide a valid email address.').max(160),
    brand_name: z.string().trim().max(140).optional().default(''),
    service_required: z.string().trim().min(2, 'Please select a service.').max(120),
    currency: z.enum(['INR', 'USD'], {
      error: 'Please select INR or USD currency.',
    }),
    budget_range: z.string().trim().min(2, 'Please select a budget range.').max(120),
    project_details: z
      .string()
      .trim()
      .min(10, 'Please share a bit more detail (at least 10 characters).')
      .max(4000),
    website_url: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    const allowedBudgets = BUDGET_OPTIONS_BY_CURRENCY[data.currency];
    if (!allowedBudgets.includes(data.budget_range)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['budget_range'],
        message: `Selected budget range is not valid for ${data.currency}.`,
      });
    }
  });

const projectSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens.'),
  category: z.enum(['LinkedIn', 'UGC', 'Reels', 'Carousels', 'Thumbnails']),
  short_summary: z.string().trim().max(400).optional().default(''),
  description: z.string().trim().max(5000).optional().default(''),
  image_url: z
    .string()
    .trim()
    .max(1000)
    .refine(
      (val) =>
        val === '' ||
        val.startsWith('/') ||
        val.startsWith('https://') ||
        val.startsWith('http://'),
      'Image URL must be a valid path or HTTP(S) URL.'
    )
    .optional()
    .default(''),
  tags: z.array(z.string().trim().max(40)).max(10).optional().default([]),
  external_url: z
    .string()
    .trim()
    .max(500)
    .refine(
      (val) => val === '' || val.startsWith('https://') || val.startsWith('http://'),
      'External link must start with http:// or https://'
    )
    .optional()
    .default(''),
  is_concept: z.boolean().optional().default(true),
  is_published: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
});

const packageSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(160).optional().default(''),
  currency: z.enum(['INR', 'USD']).optional().default('USD'),
  price_display: z.string().trim().min(1).max(80),
  billing_type: z.string().trim().max(60).optional().default('Monthly'),
  description: z.string().trim().max(1000).optional().default(''),
  features: z.array(z.string().trim().min(1).max(160)).max(12).optional().default([]),
  deliverables_count: z.string().trim().max(80).optional().default(''),
  revisions_count: z.string().trim().max(80).optional().default(''),
  cta_label: z.string().trim().max(60).optional().default('GET A CUSTOM QUOTE'),
  is_featured: z.boolean().optional().default(false),
  is_published: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
});

const serviceUpdateSchema = z.object({
  number_label: z.string().trim().min(1).max(10).optional(),
  title: z.string().trim().min(2).max(120).optional(),
  short_label: z.string().trim().min(1).max(40).optional(),
  description: z.string().trim().min(5).max(1000).optional(),
  deliverables: z.array(z.string().trim().max(120)).max(10).optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
});

const testimonialSchema = z.object({
  author_name: z.string().trim().min(2).max(120),
  author_role: z.string().trim().max(120).optional().default(''),
  company: z.string().trim().max(120).optional().default(''),
  quote: z.string().trim().min(10).max(1500),
  is_published: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).max(9999).optional().default(0),
});

const inquiryUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'in_progress', 'completed', 'archived']).optional(),
  admin_notes: z.string().trim().max(2000).optional(),
});

const settingsSchema = z.object({
  brand_name: z.string().trim().min(2).max(60).optional(),
  tagline: z.string().trim().min(2).max(160).optional(),
  contact_email: z.string().trim().email().max(160).optional(),
  instagram_handle: z.string().trim().max(80).optional(),
  instagram_url: z
    .string()
    .trim()
    .max(300)
    .refine(
      (val) => val === '' || val.startsWith('https://') || val.startsWith('http://'),
      'Instagram URL must start with http:// or https://'
    )
    .optional(),
  social_links: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        url: z
          .string()
          .trim()
          .max(300)
          .refine(
            (val) =>
              val.startsWith('https://') ||
              val.startsWith('http://') ||
              val.startsWith('mailto:'),
            'Social link URL must use https://, http://, or mailto:'
          ),
      })
    )
    .max(10)
    .optional(),
  about_headline: z.string().trim().max(200).optional(),
  about_body: z.string().trim().max(3000).optional(),
  hero_kicker: z.string().trim().max(120).optional(),
  hero_headline_line1: z.string().trim().max(80).optional(),
  hero_headline_line2: z.string().trim().max(80).optional(),
  hero_subheadline: z.string().trim().max(400).optional(),
  budget_options: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
});

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
      return;
    }
    cb(null, true);
  },
});

interface AdminRequest extends Request {
  adminEmail?: string;
  adminToken?: string;
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = await verifyAdminRequest(req.headers.authorization);
    if (!admin) {
      res.status(401).json({ error: 'Unauthorized. Please sign in to the studio admin.' });
      return;
    }
    (req as AdminRequest).adminEmail = admin.email;
    (req as AdminRequest).adminToken = admin.accessToken;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication verification failed.' });
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Invalid JSON request body.' });
      return;
    }
    next(err);
  });

  app.get('/uploads/:filename', (req, res) => {
    const rawName = path.basename(req.params.filename || '');
    if (!/^[a-zA-Z0-9._-]+$/.test(rawName)) {
      res.status(400).send('Invalid file name.');
      return;
    }
    const resolved = path.resolve(UPLOADS_DIR, rawName);
    if (!resolved.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(resolved)) {
      res.status(404).send('Not found.');
      return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(resolved);
  });

  app.get('/api/health', async (_req, res) => {
    const schemaStatus = await studioDb.checkSupabaseSchema();
    res.json({
      status: 'ok',
      backendMode: schemaStatus.supabaseSchemaReady ? 'supabase' : 'sqlite',
      supabaseConfigured: isSupabaseConfigured,
      ...schemaStatus,
    });
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl =
      process.env.APP_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
    res
      .type('text/plain')
      .send(
        `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`
      );
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl =
        process.env.APP_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
      const { projects } = await studioDb.getPublicBootstrap();
      const urls = [`${baseUrl}/`, ...projects.map((p) => `${baseUrl}/work/${p.slug}`)];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map(
          (loc) =>
            `  <url>\n    <loc>${loc.replace(/&/g, '&amp;')}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`
        )
        .join('\n')}\n</urlset>`;
      res.type('application/xml').send(xml);
    } catch {
      res.status(500).send('Error generating sitemap.');
    }
  });

  app.get('/api/public/config', async (_req, res) => {
    try {
      const enabled = await isSupabaseReady();
      if (enabled) {
        await studioDb.ensureSupabaseSeeded();
      }
      const cfg = enabled ? getPublicSupabaseConfig() : null;
      res.json({
        supabaseEnabled: Boolean(enabled && cfg),
        supabaseUrl: cfg?.supabaseUrl || '',
        supabaseAnonKey: cfg?.supabaseAnonKey || '',
      });
    } catch {
      res.json({
        supabaseEnabled: false,
        supabaseUrl: '',
        supabaseAnonKey: '',
      });
    }
  });

  app.get('/api/public/bootstrap', async (_req, res) => {
    try {
      const data = await studioDb.getPublicBootstrap();
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Failed to load studio content.' });
    }
  });

  app.get('/api/public/projects/:slug', async (req, res) => {
    try {
      const slug = req.params.slug.trim();
      const project = await studioDb.getPublishedProjectBySlug(slug);
      if (!project) {
        res.status(404).json({ error: 'Project not found.' });
        return;
      }
      res.json(project);
    } catch {
      res.status(500).json({ error: 'Failed to load project.' });
    }
  });

  app.post('/api/public/inquiries', async (req, res) => {
    try {
      const parsed = inquirySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid inquiry submission.',
        });
        return;
      }

      if (parsed.data.website_url && parsed.data.website_url.trim().length > 0) {
        res.status(200).json({ ok: true, id: 'accepted' });
        return;
      }

      const ipHash = hashIp(req.ip || req.socket.remoteAddress || 'unknown');
      if (!checkRateLimit(ipHash)) {
        res.status(429).json({
          error:
            'Too many submissions in a short window. Please email creatorfctry@gmail.com directly or try again shortly.',
        });
        return;
      }

      const created = await studioDb.createInquiry({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        brand_name: parsed.data.brand_name,
        service_required: parsed.data.service_required,
        currency: parsed.data.currency,
        budget_range: parsed.data.budget_range,
        project_details: parsed.data.project_details,
        source_ip_hash: ipHash,
      });

      res.status(201).json({
        ok: true,
        inquiry: {
          id: created.id,
          currency: created.currency,
          budget_range: created.budget_range,
          created_at: created.created_at,
        },
      });
    } catch (err) {
      console.error('Inquiry submission failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Unable to submit inquiry right now. Please try again.' });
    }
  });

  app.get('/api/admin/auth/status', async (req, res) => {
    const setupState = await getAuthSetupState();
    const admin = await verifyAdminRequest(req.headers.authorization);
    res.json({
      ...setupState,
      authenticated: Boolean(admin),
      email: admin?.email || null,
    });
  });

  app.post('/api/admin/auth/setup', async (req, res) => {
    const setupSchema = z.object({
      email: z.string().trim().email('Please enter a valid admin email.'),
      password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
    });
    const parsed = setupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid setup input.' });
      return;
    }

    const result = claimInitialAdminPassword(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      res.status(409).json({ error: result.error });
      return;
    }
    const token = createSessionToken(parsed.data.email.trim().toLowerCase());
    res.status(201).json({ ok: true, token, email: parsed.data.email.trim().toLowerCase() });
  });

  app.post('/api/admin/auth/login', async (req, res) => {
    const loginSchema = z.object({
      email: z.string().trim().email('Enter a valid email address.').optional().default('creatorfctry@gmail.com'),
      password: z.string().min(1, 'Password is required.').max(128),
    });
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid credentials.' });
      return;
    }

    const authResult = await authenticateAdmin(parsed.data.email, parsed.data.password);
    if (!authResult.ok || !authResult.token) {
      res.status(401).json({ error: authResult.error || 'Invalid credentials.' });
      return;
    }

    res.json({ ok: true, token: authResult.token, email: authResult.email });
  });

  app.post('/api/admin/auth/logout', async (req, res) => {
    await logoutAdminSession(req.headers.authorization);
    res.json({ ok: true });
  });

  app.get('/api/admin/overview', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      res.json(await studioDb.getAdminOverview(token));
    } catch {
      res.status(500).json({ error: 'Failed to load overview metrics.' });
    }
  });

  app.get('/api/admin/projects', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      res.json(await studioDb.listAllProjects(token));
    } catch {
      res.status(500).json({ error: 'Failed to load projects.' });
    }
  });

  app.post('/api/admin/projects', requireAdmin, async (req, res) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid project data.' });
      return;
    }
    try {
      const token = (req as AdminRequest).adminToken;
      const created = await studioDb.createProject(
        {
          title: parsed.data.title,
          slug: parsed.data.slug,
          category: parsed.data.category,
          short_summary: parsed.data.short_summary,
          description: parsed.data.description,
          image_url: parsed.data.image_url,
          tags: parsed.data.tags,
          external_url: parsed.data.external_url,
          is_concept: parsed.data.is_concept,
          is_published: parsed.data.is_published,
          sort_order: parsed.data.sort_order,
        },
        token
      );
      res.status(201).json(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project.';
      const isDuplicate =
        message.includes('UNIQUE') ||
        message.toLowerCase().includes('duplicate key') ||
        message.includes('projects_slug_key');
      res.status(isDuplicate ? 409 : 400).json({
        error: isDuplicate ? 'A project with this slug already exists.' : message,
      });
    }
  });

  app.put('/api/admin/projects/:id', requireAdmin, async (req, res) => {
    const parsed = projectSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid project update.' });
      return;
    }
    try {
      const token = (req as AdminRequest).adminToken;
      const updated = await studioDb.updateProject(req.params.id, parsed.data, token);
      if (!updated) {
        res.status(404).json({ error: 'Project not found.' });
        return;
      }
      res.json(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project.';
      const isDuplicate =
        message.includes('UNIQUE') ||
        message.toLowerCase().includes('duplicate key') ||
        message.includes('projects_slug_key');
      res.status(isDuplicate ? 409 : 400).json({
        error: isDuplicate ? 'A project with this slug already exists.' : message,
      });
    }
  });

  app.delete('/api/admin/projects/:id', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      const ok = await studioDb.deleteProject(req.params.id, token);
      if (!ok) {
        res.status(404).json({ error: 'Project not found.' });
        return;
      }
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete project.' });
    }
  });

  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    upload.single('file')(req, res, async (uploadErr) => {
      if (uploadErr) {
        res.status(400).json({ error: uploadErr.message || 'Image upload failed.' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'Please select an image file to upload.' });
        return;
      }
      try {
        const token = (req as AdminRequest).adminToken;
        const url = await studioDb.saveUploadedImage(req.file.buffer, req.file.mimetype, token);
        res.status(201).json({ url });
      } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to store uploaded file.' });
      }
    });
  });

  app.get('/api/admin/services', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      res.json(await studioDb.listAllServices(token));
    } catch {
      res.status(500).json({ error: 'Failed to load services.' });
    }
  });

  app.put('/api/admin/services/:id', requireAdmin, async (req, res) => {
    const parsed = serviceUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid service update.' });
      return;
    }
    try {
      const token = (req as AdminRequest).adminToken;
      const updated = await studioDb.updateService(req.params.id, parsed.data, token);
      if (!updated) {
        res.status(404).json({ error: 'Service not found.' });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update service.' });
    }
  });

  app.get('/api/admin/packages', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      res.json(await studioDb.listAllPackages(token));
    } catch {
      res.status(500).json({ error: 'Failed to load packages.' });
    }
  });

  app.post('/api/admin/packages', requireAdmin, async (req, res) => {
    const parsed = packageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid package data.' });
      return;
    }
    try {
      const token = (req as AdminRequest).adminToken;
      const created = await studioDb.createPackage(
        {
          name: parsed.data.name,
          tagline: parsed.data.tagline,
          currency: parsed.data.currency,
          price_display: parsed.data.price_display,
          billing_type: parsed.data.billing_type,
          description: parsed.data.description,
          features: parsed.data.features,
          deliverables_count: parsed.data.deliverables_count,
          revisions_count: parsed.data.revisions_count,
          cta_label: parsed.data.cta_label,
          is_featured: parsed.data.is_featured,
          is_published: parsed.data.is_published,
          sort_order: parsed.data.sort_order,
        },
        token
      );
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: 'Failed to create package.' });
    }
  });

  app.put('/api/admin/packages/:id', requireAdmin, async (req, res) => {
    const parsed = packageSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid package update.' });
      return;
    }
    try {
      const token = (req as AdminRequest).adminToken;
      const updated = await studioDb.updatePackage(req.params.id, parsed.data, token);
      if (!updated) {
        res.status(404).json({ error: 'Package not found.' });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update package.' });
    }
  });

  app.delete('/api/admin/packages/:id', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      const ok = await studioDb.deletePackage(req.params.id, token);
      if (!ok) {
        res.status(404).json({ error: 'Package not found.' });
        return;
      }
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete package.' });
    }
  });

  app.get('/api/admin/inquiries', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      res.json(await studioDb.listAllInquiries(token));
    } catch {
      res.status(500).json({ error: 'Failed to load inquiries.' });
    }
  });

  app.patch('/api/admin/inquiries/:id', requireAdmin, async (req, res) => {
    const parsed = inquiryUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid inquiry update.' });
      return;
    }
    try {
      const token = (req as AdminRequest).adminToken;
      const updated = await studioDb.updateInquiry(req.params.id, parsed.data, token);
      if (!updated) {
        res.status(404).json({ error: 'Inquiry not found.' });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update inquiry.' });
    }
  });

  app.delete('/api/admin/inquiries/:id', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      const ok = await studioDb.deleteInquiry(req.params.id, token);
      if (!ok) {
        res.status(404).json({ error: 'Inquiry not found.' });
        return;
      }
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete inquiry.' });
    }
  });

  app.get('/api/admin/testimonials', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      res.json(await studioDb.listAllTestimonials(token));
    } catch {
      res.status(500).json({ error: 'Failed to load testimonials.' });
    }
  });

  app.post('/api/admin/testimonials', requireAdmin, async (req, res) => {
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid testimonial data.' });
      return;
    }
    try {
      const token = (req as AdminRequest).adminToken;
      const created = await studioDb.createTestimonial(
        {
          author_name: parsed.data.author_name,
          author_role: parsed.data.author_role,
          company: parsed.data.company,
          quote: parsed.data.quote,
          is_published: parsed.data.is_published,
          sort_order: parsed.data.sort_order,
        },
        token
      );
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: 'Failed to create testimonial.' });
    }
  });

  app.put('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
    const parsed = testimonialSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid testimonial update.' });
      return;
    }
    try {
      const token = (req as AdminRequest).adminToken;
      const updated = await studioDb.updateTestimonial(req.params.id, parsed.data, token);
      if (!updated) {
        res.status(404).json({ error: 'Testimonial not found.' });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update testimonial.' });
    }
  });

  app.delete('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      const ok = await studioDb.deleteTestimonial(req.params.id, token);
      if (!ok) {
        res.status(404).json({ error: 'Testimonial not found.' });
        return;
      }
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete testimonial.' });
    }
  });

  app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const token = (req as AdminRequest).adminToken;
      res.json(await studioDb.getSettings(token));
    } catch {
      res.status(500).json({ error: 'Failed to load settings.' });
    }
  });

  app.put('/api/admin/settings', requireAdmin, async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid settings update.' });
      return;
    }
    try {
      const token = (req as AdminRequest).adminToken;
      const updated = await studioDb.updateSettings(parsed.data, token);
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update site settings.' });
    }
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.resolve(__dirname, 'index.html'))
      ? __dirname
      : path.resolve(__dirname, 'dist');
    const assetsDist = path.join(distPath, 'src/assets');
    if (fs.existsSync(assetsDist)) {
      app.use('/src/assets', express.static(assetsDist));
    }
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  await studioDb.ensureSupabaseSeeded();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CreatorFctry server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CreatorFctry server:', err);
  process.exit(1);
});
