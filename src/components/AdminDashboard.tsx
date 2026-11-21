import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Check,
  Database,
  Edit3,
  Eye,
  EyeOff,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  MessageSquareQuote,
  Package as PackageIcon,
  Plus,
  Settings as SettingsIcon,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  getAdminToken,
  setAdminToken,
  setUnauthorizedHandler,
  studioApi,
} from '../lib/api';
import {
  BUDGET_OPTIONS_BY_CURRENCY,
  CURRENCY_OPTIONS,
  formatPackagePrice,
  type AdminOverviewStats,
  type CurrencyCode,
  type InquiryItem,
  type InquiryStatus,
  type PackageItem,
  type ProjectCategory,
  type ProjectItem,
  type ServiceItem,
  type SiteSettings,
  type TestimonialItem,
} from '../types/studio';

interface AdminDashboardProps {
  onBackToSite: () => void;
  onDataChanged: () => void;
}

type AdminTab =
  | 'overview'
  | 'projects'
  | 'services'
  | 'packages'
  | 'inquiries'
  | 'testimonials'
  | 'settings';

const CATEGORIES: ProjectCategory[] = [
  'LinkedIn',
  'UGC',
  'Reels',
  'Carousels',
  'Thumbnails',
];

const INQUIRY_STATUSES: InquiryStatus[] = [
  'new',
  'contacted',
  'in_progress',
  'completed',
  'archived',
];

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
};

function slugify(val: string): string {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminDashboard({
  onBackToSite,
  onDataChanged,
}: AdminDashboardProps) {
  const [authLoading, setAuthLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [hasEnvPasscode, setHasEnvPasscode] = useState(false);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('creatorfctry@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<AdminOverviewStats | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loadingTab, setLoadingTab] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Project Editor State
  const [editingProject, setEditingProject] = useState<Partial<ProjectItem> | null>(null);
  const [projectTagsText, setProjectTagsText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  // Package Editor State
  const [editingPackage, setEditingPackage] = useState<Partial<PackageItem> | null>(null);
  const [packageFeaturesText, setPackageFeaturesText] = useState('');
  const [savingPackage, setSavingPackage] = useState(false);

  // Service Editor State
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceDeliverablesText, setServiceDeliverablesText] = useState('');
  const [savingService, setSavingService] = useState(false);

  // Inquiry Filter & Detail State
  const [inquiryFilter, setInquiryFilter] = useState<'all' | InquiryStatus>('all');
  const [inquiryCurrencyFilter, setInquiryCurrencyFilter] = useState<'all' | CurrencyCode>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [inquiryNotesDraft, setInquiryNotesDraft] = useState('');
  const [savingInquiry, setSavingInquiry] = useState(false);

  // Testimonial Editor State
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<TestimonialItem> | null>(
    null
  );
  const [savingTestimonial, setSavingTestimonial] = useState(false);

  // Settings Editor State
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings | null>(null);
  const [socialLinksText, setSocialLinksText] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const notify = (type: 'success' | 'error', text: string) => {
    setBannerMessage({ type, text });
    window.setTimeout(() => {
      setBannerMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const checkAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const status = await studioApi.getAuthStatus();
      setNeedsSetup(status.needsSetup);
      setHasEnvPasscode(status.hasEnvPasscode);
      setSupabaseEnabled(status.supabaseEnabled);
      setAuthenticated(status.authenticated && Boolean(getAdminToken()));
      if (status.email) setAdminEmail(status.email);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to check auth status.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthenticated(false);
      setOverview(null);
      setAuthError('Your admin session expired. Please sign in again.');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const loadTabData = useCallback(
    async (tab: AdminTab) => {
      if (!authenticated) return;
      setLoadingTab(true);
      try {
        if (tab === 'overview') {
          setOverview(await studioApi.getOverview());
        } else if (tab === 'projects') {
          setProjects(await studioApi.listProjects());
        } else if (tab === 'services') {
          setServices(await studioApi.listServices());
        } else if (tab === 'packages') {
          setPackages(await studioApi.listPackages());
        } else if (tab === 'inquiries') {
          setInquiries(await studioApi.listInquiries());
        } else if (tab === 'testimonials') {
          setTestimonials(await studioApi.listTestimonials());
        } else if (tab === 'settings') {
          const s = await studioApi.getSettings();
          setSettings(s);
          setSettingsDraft(s);
          setSocialLinksText(
            s.social_links.map((item) => `${item.label} | ${item.url}`).join('\n')
          );
        }
      } catch (err) {
        notify('error', err instanceof Error ? err.message : 'Failed to load data.');
      } finally {
        setLoadingTab(false);
      }
    },
    [authenticated]
  );

  useEffect(() => {
    if (authenticated) {
      loadTabData(activeTab);
    }
  }, [authenticated, activeTab, loadTabData]);

  const handleSetupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const res = await studioApi.setupAdmin(adminEmail, passwordInput);
      setAdminToken(res.token);
      setNeedsSetup(false);
      setAuthenticated(true);
      setPasswordInput('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Setup failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const res = await studioApi.loginAdmin(adminEmail, passwordInput);
      setAdminToken(res.token);
      setAuthenticated(true);
      setPasswordInput('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    void studioApi.logoutAdmin().catch(() => {});
    setAdminToken(null);
    setAuthenticated(false);
    setOverview(null);
  };

  // --- Image Upload Handler ---
  const handleImageFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const file = inputEl.files?.[0];
    if (!file || !editingProject) return;
    setUploadingImage(true);
    try {
      const res = await studioApi.uploadImage(file);
      setEditingProject({ ...editingProject, image_url: res.url });
      notify('success', 'Image uploaded successfully.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      inputEl.value = '';
      setUploadingImage(false);
    }
  };

  // --- Save Project ---
  const handleSaveProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    const resolvedSlug = slugify(editingProject.slug || editingProject.title || '');
    if (resolvedSlug.length < 2) {
      notify('error', 'Please provide a valid URL slug (at least 2 letters or numbers).');
      return;
    }
    setSavingProject(true);
    try {
      const tags = projectTagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: editingProject.title || '',
        slug: resolvedSlug,
        category: editingProject.category || 'LinkedIn',
        short_summary: editingProject.short_summary || '',
        description: editingProject.description || '',
        image_url: editingProject.image_url || '',
        tags,
        external_url: editingProject.external_url || '',
        is_concept: Boolean(editingProject.is_concept),
        is_published: Boolean(editingProject.is_published),
        sort_order: Number(editingProject.sort_order || 0),
      };

      if (editingProject.id) {
        await studioApi.updateProject(editingProject.id, payload);
        notify('success', 'Project updated.');
      } else {
        await studioApi.createProject(payload);
        notify('success', 'Project created.');
      }
      setEditingProject(null);
      await loadTabData('projects');
      onDataChanged();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Could not save project.');
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await studioApi.deleteProject(id);
      notify('success', 'Project deleted.');
      await loadTabData('projects');
      onDataChanged();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to delete project.');
    }
  };

  const handleToggleProjectPublish = async (project: ProjectItem) => {
    try {
      await studioApi.updateProject(project.id, {
        is_published: !project.is_published,
      });
      await loadTabData('projects');
      onDataChanged();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to toggle visibility.');
    }
  };

  // --- Save Package ---
  const handleSavePackage = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    setSavingPackage(true);
    try {
      const features = packageFeaturesText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        name: editingPackage.name || '',
        tagline: editingPackage.tagline || '',
        currency: (editingPackage.currency === 'INR' ? 'INR' : 'USD') as CurrencyCode,
        price_display: editingPackage.price_display || 'Custom',
        billing_type: editingPackage.billing_type || 'Monthly',
        description: editingPackage.description || '',
        features,
        deliverables_count: editingPackage.deliverables_count || '',
        revisions_count: editingPackage.revisions_count || '',
        cta_label: editingPackage.cta_label || 'GET A CUSTOM QUOTE',
        is_featured: Boolean(editingPackage.is_featured),
        is_published: Boolean(editingPackage.is_published),
        sort_order: Number(editingPackage.sort_order || 0),
      };

      if (editingPackage.id) {
        await studioApi.updatePackage(editingPackage.id, payload);
        notify('success', 'Package updated.');
      } else {
        await studioApi.createPackage(payload);
        notify('success', 'Package created.');
      }
      setEditingPackage(null);
      await loadTabData('packages');
      onDataChanged();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Could not save package.');
    } finally {
      setSavingPackage(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    try {
      await studioApi.deletePackage(id);
      notify('success', 'Package deleted.');
      await loadTabData('packages');
      onDataChanged();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to delete package.');
    }
  };

  const handleTogglePackagePublish = async (pkg: PackageItem) => {
    try {
      await studioApi.updatePackage(pkg.id, { is_published: !pkg.is_published });
      await loadTabData('packages');
      onDataChanged();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to update package.');
    }
  };

  // --- Save Service ---
  const handleSaveService = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setSavingService(true);
    try {
      const deliverables = serviceDeliverablesText
        .split('\n')
        .map((d) => d.trim())
        .filter(Boolean);
      await studioApi.updateService(editingService.id, {
        number_label: editingService.number_label,
        title: editingService.title,
        short_label: editingService.short_label,
        description: editingService.description,
        deliverables,
        is_published: editingService.is_published,
      });
      setEditingService(null);
      notify('success', 'Service updated.');
      await loadTabData('services');
      onDataChanged();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Could not update service.');
    } finally {
      setSavingService(false);
    }
  };

  // --- Inquiry Actions ---
  const handleInquiryStatusChange = async (id: string, status: InquiryStatus) => {
    try {
      const updated = await studioApi.updateInquiry(id, { status });
      setInquiries((prev) => prev.map((item) => (item.id === id ? updated : item)));
      if (selectedInquiry?.id === id) setSelectedInquiry(updated);
      notify('success', `Inquiry marked as ${STATUS_LABELS[status]}.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handleSaveInquiryNotes = async () => {
    if (!selectedInquiry) return;
    setSavingInquiry(true);
    try {
      const updated = await studioApi.updateInquiry(selectedInquiry.id, {
        admin_notes: inquiryNotesDraft,
      });
      setInquiries((prev) =>
        prev.map((item) => (item.id === selectedInquiry.id ? updated : item))
      );
      setSelectedInquiry(updated);
      notify('success', 'Notes saved.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to save notes.');
    } finally {
      setSavingInquiry(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    try {
      await studioApi.deleteInquiry(id);
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
      notify('success', 'Inquiry deleted.');
      await loadTabData('inquiries');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to delete inquiry.');
    }
  };

  // --- Save Testimonial ---
  const handleSaveTestimonial = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    setSavingTestimonial(true);
    try {
      const payload = {
        author_name: editingTestimonial.author_name || '',
        author_role: editingTestimonial.author_role || '',
        company: editingTestimonial.company || '',
        quote: editingTestimonial.quote || '',
        is_published: Boolean(editingTestimonial.is_published),
        sort_order: Number(editingTestimonial.sort_order ?? testimonials.length + 1),
      };
      if (editingTestimonial.id) {
        await studioApi.updateTestimonial(editingTestimonial.id, payload);
        notify('success', 'Testimonial updated.');
      } else {
        await studioApi.createTestimonial(payload);
        notify('success', 'Testimonial added.');
      }
      setEditingTestimonial(null);
      await loadTabData('testimonials');
      onDataChanged();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to save testimonial.');
    } finally {
      setSavingTestimonial(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      await studioApi.deleteTestimonial(id);
      notify('success', 'Testimonial deleted.');
      await loadTabData('testimonials');
      onDataChanged();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to delete testimonial.');
    }
  };

  // --- Save Website Settings ---
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settingsDraft) return;
    setSavingSettings(true);
    try {
      const social_links = socialLinksText
        .split('\n')
        .map((line) => {
          const [label, url] = line.split('|').map((s) => s.trim());
          return label && url ? { label, url } : null;
        })
        .filter((x): x is { label: string; url: string } => Boolean(x));

      const updated = await studioApi.updateSettings({
        brand_name: settingsDraft.brand_name,
        tagline: settingsDraft.tagline,
        contact_email: settingsDraft.contact_email,
        instagram_handle: settingsDraft.instagram_handle,
        instagram_url: settingsDraft.instagram_url,
        about_headline: settingsDraft.about_headline,
        about_body: settingsDraft.about_body,
        hero_kicker: settingsDraft.hero_kicker,
        hero_headline_line1: settingsDraft.hero_headline_line1,
        hero_headline_line2: settingsDraft.hero_headline_line2,
        hero_subheadline: settingsDraft.hero_subheadline,
        budget_options: settingsDraft.budget_options,
        social_links,
      });
      setSettings(updated);
      setSettingsDraft(updated);
      notify('success', 'Website settings saved.');
      onDataChanged();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Auth Gate Render
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F3F0E8] flex items-center justify-center p-6">
        <div className="border-2 border-[#171717] bg-white px-8 py-6 neo-shadow flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#315BFF]" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            Verifying Studio Session...
          </span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F3F0E8] flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-lg w-full mx-auto my-auto">
          <button
            type="button"
            onClick={onBackToSite}
            className="inline-flex items-center gap-2 border-2 border-[#171717] bg-[#F3F0E8] px-4 py-2 text-xs font-bold uppercase tracking-wider mb-6 hover:bg-[#171717] hover:text-[#F3F0E8] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to CreatorFctry</span>
          </button>

          <div className="border-2 border-[#171717] bg-white p-7 sm:p-10 neo-shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 bg-[#171717] text-[#F3F0E8] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </span>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-[#315BFF] font-bold">
                  {supabaseEnabled ? 'SUPABASE AUTH' : 'STUDIO ADMIN'}
                </div>
                <h1 className="font-display text-3xl uppercase leading-none text-[#171717]">
                  {needsSetup ? 'CLAIM ADMIN ACCESS' : 'ADMIN SIGN IN'}
                </h1>
              </div>
            </div>

            <p className="text-sm text-[#171717]/80 mb-6 leading-relaxed">
              {needsSetup
                ? 'First-run setup: create your private studio admin password (minimum 8 characters). This locks immediately once claimed.'
                : hasEnvPasscode
                  ? 'Enter your configured studio admin passcode to manage projects, packages, inquiries, and settings.'
                  : 'Sign in with your studio admin credentials to manage CreatorFctry.'}
            </p>

            {authError && (
              <div
                role="alert"
                className="mb-5 border-2 border-[#171717] bg-[#D46B45]/15 px-4 py-3 text-sm font-bold text-[#171717]"
              >
                {authError}
              </div>
            )}

            <form
              onSubmit={needsSetup ? handleSetupSubmit : handleLoginSubmit}
              className="space-y-4"
            >
              {!hasEnvPasscode && (
                <div>
                  <label
                    htmlFor="admin-email"
                    className="block font-mono text-xs font-bold uppercase tracking-wider mb-1.5"
                  >
                    ADMIN EMAIL
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#315BFF]"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-password"
                  className="block font-mono text-xs font-bold uppercase tracking-wider mb-1.5"
                >
                  {needsSetup ? 'CREATE PASSWORD (MIN 8 CHARS)' : 'PASSWORD / PASSCODE'}
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  minLength={needsSetup ? 8 : 1}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#315BFF]"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#315BFF] text-white border-2 border-[#171717] px-6 py-3.5 text-xs font-bold uppercase tracking-wider neo-btn neo-shadow-sm cursor-pointer disabled:opacity-60"
              >
                {authSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <span>{needsSetup ? 'CREATE ADMIN ACCOUNT' : 'ENTER DASHBOARD'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inquiries', label: 'Inquiries', icon: Inbox },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'packages', label: 'Packages', icon: PackageIcon },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
    { id: 'settings', label: 'Website Settings', icon: SettingsIcon },
  ];

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesStatus = inquiryFilter === 'all' || inq.status === inquiryFilter;
    const matchesCurrency =
      inquiryCurrencyFilter === 'all' || inq.currency === inquiryCurrencyFilter;
    return matchesStatus && matchesCurrency;
  });

  return (
    <div className="min-h-screen bg-[#F3F0E8] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-[270px] bg-[#171717] text-[#F3F0E8] border-b-2 lg:border-b-0 lg:border-r-2 border-[#171717] flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-[#F3F0E8]/20">
            <div className="font-display text-2xl font-bold tracking-tight">
              <span className="text-[#F3F0E8]">CREATOR</span>
              <span className="text-[#D46B45]">FCTRY</span>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-[#F3F0E8]/60 mt-1">
              STUDIO ADMIN CONSOLE
            </div>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#315BFF] text-white'
                      : 'text-[#F3F0E8]/80 hover:bg-[#262626] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#F3F0E8]/20 flex flex-row lg:flex-col gap-2">
          <button
            type="button"
            onClick={onBackToSite}
            className="flex-1 inline-flex items-center justify-center gap-2 border border-[#F3F0E8]/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#F3F0E8] hover:text-[#171717] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Public Site</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 border border-[#D46B45]/60 text-[#D46B45] px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#D46B45] hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#171717] mb-8">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#315BFF] font-bold">
              ADMIN / {activeTab.toUpperCase()}
            </div>
            <h1 className="font-display text-4xl uppercase text-[#171717] mt-1">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>
          <div className="font-mono text-xs text-[#171717]/70 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#D46B45]" />
            <span>
              STORAGE: {supabaseEnabled ? 'SUPABASE POSTGRESQL' : 'LOCAL SQLITE'}
            </span>
          </div>
        </div>

        {bannerMessage && (
          <div
            role="status"
            className={`mb-6 border-2 border-[#171717] px-4 py-3 text-sm font-bold flex items-center justify-between ${
              bannerMessage.type === 'success'
                ? 'bg-[#315BFF] text-white'
                : 'bg-[#D46B45] text-white'
            }`}
          >
            <span>{bannerMessage.text}</span>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="text-xs underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {loadingTab ? (
          <div className="py-16 flex items-center justify-center gap-3 text-sm font-mono uppercase">
            <Loader2 className="w-5 h-5 animate-spin text-[#315BFF]" />
            <span>Loading {activeTab}...</span>
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {[
                    {
                      label: 'TOTAL INQUIRIES',
                      value: overview.totalInquiries,
                      accent: '#171717',
                    },
                    {
                      label: 'NEW INQUIRIES',
                      value: overview.newInquiries,
                      accent: '#D46B45',
                    },
                    {
                      label: 'PUBLISHED PROJECTS',
                      value: `${overview.publishedProjects} / ${overview.totalProjects}`,
                      accent: '#315BFF',
                    },
                    {
                      label: 'TOTAL PACKAGES',
                      value: `${overview.publishedPackages} / ${overview.totalPackages}`,
                      accent: '#171717',
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="border-2 border-[#171717] bg-white p-6 neo-shadow-sm"
                    >
                      <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#171717]/65">
                        {stat.label}
                      </div>
                      <div
                        className="font-display text-5xl font-bold tabular-nums mt-3"
                        style={{ color: stat.accent }}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Inquiries */}
                <div className="border-2 border-[#171717] bg-white p-6 neo-shadow-sm">
                  <div className="flex items-center justify-between border-b-2 border-[#171717] pb-4 mb-4">
                    <h2 className="font-display text-2xl uppercase">RECENT INQUIRIES</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('inquiries')}
                      className="font-mono text-xs font-bold uppercase text-[#315BFF] hover:underline cursor-pointer"
                    >
                      MANAGE ALL →
                    </button>
                  </div>

                  {overview.recentInquiries.length === 0 ? (
                    <p className="text-sm text-[#171717]/70 py-6">
                      No inquiries submitted yet. New leads from the Contact form will appear here immediately.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#171717]/15">
                      {overview.recentInquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-sm text-[#171717]">
                              {inq.full_name}{' '}
                              {inq.brand_name && (
                                <span className="font-normal text-[#171717]/65">
                                  · {inq.brand_name}
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-[#171717]/65 mt-0.5">
                              {inq.service_required} · [{inq.currency}] {inq.budget_range}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('inquiries');
                              setSelectedInquiry(inq);
                              setInquiryNotesDraft(inq.admin_notes || '');
                            }}
                            className="border border-[#171717] px-3 py-1.5 text-xs font-mono font-bold uppercase hover:bg-[#171717] hover:text-white transition-colors self-start sm:self-center cursor-pointer"
                          >
                            {STATUS_LABELS[inq.status]}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. INQUIRIES */}
            {activeTab === 'inquiries' && (
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {(['all', ...INQUIRY_STATUSES] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setInquiryFilter(status)}
                        className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider border-2 border-[#171717] cursor-pointer ${
                          inquiryFilter === status
                            ? 'bg-[#171717] text-[#F3F0E8]'
                            : 'bg-white text-[#171717] hover:bg-[#315BFF] hover:text-white'
                        }`}
                      >
                        {status === 'all' ? 'All' : STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#171717]/65 mr-1">
                      CURRENCY:
                    </span>
                    {(['all', 'INR', 'USD'] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setInquiryCurrencyFilter(curr)}
                        className={`px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#171717] cursor-pointer ${
                          inquiryCurrencyFilter === curr
                            ? 'bg-[#315BFF] text-white'
                            : 'bg-white text-[#171717] hover:bg-[#171717] hover:text-[#F3F0E8]'
                        }`}
                      >
                        {curr === 'all'
                          ? 'All'
                          : curr === 'INR'
                            ? 'INR (₹)'
                            : 'USD ($)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  <div className="xl:col-span-7 border-2 border-[#171717] bg-white divide-y-2 divide-[#171717]">
                    {filteredInquiries.length === 0 ? (
                      <div className="p-10 text-center text-sm text-[#171717]/70">
                        No inquiries match this filter.
                      </div>
                    ) : (
                      filteredInquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className={`p-5 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                            selectedInquiry?.id === inq.id
                              ? 'bg-[#315BFF]/10'
                              : 'hover:bg-[#F3F0E8]/60'
                          }`}
                          onClick={() => {
                            setSelectedInquiry(inq);
                            setInquiryNotesDraft(inq.admin_notes || '');
                          }}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-base text-[#171717]">
                                {inq.full_name}
                              </span>
                              <span className="font-mono text-[11px] uppercase px-2 py-0.5 border border-[#171717] bg-[#F3F0E8]">
                                {STATUS_LABELS[inq.status]}
                              </span>
                              <span
                                className={`font-mono text-[11px] font-bold uppercase px-2 py-0.5 border border-[#171717] ${
                                  inq.currency === 'INR'
                                    ? 'bg-[#D46B45]/15 text-[#171717]'
                                    : 'bg-[#315BFF]/15 text-[#171717]'
                                }`}
                              >
                                {inq.currency} · {inq.currency === 'INR' ? '₹' : '$'}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-[#171717]/70 mt-1">
                              {inq.email} {inq.brand_name ? `· ${inq.brand_name}` : ''}
                            </div>
                            <div className="text-xs font-semibold text-[#315BFF] mt-1.5">
                              {inq.service_required} · {inq.budget_range}
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-[#171717]/60 shrink-0 tabular-nums">
                            {new Date(inq.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Inquiry Detail Panel */}
                  <div className="xl:col-span-5 border-2 border-[#171717] bg-white p-6 neo-shadow-sm">
                    {!selectedInquiry ? (
                      <div className="py-12 text-center text-sm text-[#171717]/70">
                        Select an inquiry from the list to inspect full details, update status, or add internal notes.
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex items-start justify-between gap-4 border-b-2 border-[#171717] pb-4">
                          <div>
                            <h3 className="font-display text-3xl uppercase text-[#171717]">
                              {selectedInquiry.full_name}
                            </h3>
                            <p className="text-xs font-mono text-[#171717]/70 mt-1">
                              {selectedInquiry.email}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                            className="p-2 border-2 border-[#171717] text-[#D46B45] hover:bg-[#D46B45] hover:text-white transition-colors cursor-pointer"
                            aria-label="Delete inquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <dl className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <dt className="font-mono uppercase text-[#171717]/60">BRAND</dt>
                            <dd className="font-bold mt-0.5">
                              {selectedInquiry.brand_name || '—'}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-mono uppercase text-[#171717]/60">SERVICE</dt>
                            <dd className="font-bold mt-0.5">
                              {selectedInquiry.service_required}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-mono uppercase text-[#171717]/60">CURRENCY</dt>
                            <dd className="font-bold mt-0.5">
                              {selectedInquiry.currency === 'INR'
                                ? 'INR — ₹ Indian Rupee'
                                : 'USD — $ US Dollar'}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-mono uppercase text-[#171717]/60">BUDGET RANGE</dt>
                            <dd className="font-bold mt-0.5 text-[#315BFF]">
                              {selectedInquiry.budget_range}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="font-mono uppercase text-[#171717]/60">SUBMITTED</dt>
                            <dd className="font-bold mt-0.5 tabular-nums">
                              {new Date(selectedInquiry.created_at).toLocaleString()}
                            </dd>
                          </div>
                        </dl>

                        <div>
                          <div className="font-mono text-[11px] uppercase text-[#171717]/60 mb-1.5">
                            PROJECT BRIEF
                          </div>
                          <div className="border border-[#171717]/30 bg-[#F3F0E8] p-4 text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedInquiry.project_details}
                          </div>
                        </div>

                        <div>
                          <div className="font-mono text-[11px] uppercase text-[#171717]/60 mb-2">
                            UPDATE STATUS
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {INQUIRY_STATUSES.map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() =>
                                  handleInquiryStatusChange(selectedInquiry.id, st)
                                }
                                className={`px-3 py-1.5 text-[11px] font-bold uppercase border border-[#171717] cursor-pointer ${
                                  selectedInquiry.status === st
                                    ? 'bg-[#315BFF] text-white'
                                    : 'bg-[#F3F0E8] hover:bg-[#171717] hover:text-white'
                                }`}
                              >
                                {STATUS_LABELS[st]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="inq-notes"
                            className="block font-mono text-[11px] uppercase text-[#171717]/60 mb-1.5"
                          >
                            INTERNAL STUDIO NOTES
                          </label>
                          <textarea
                            id="inq-notes"
                            rows={3}
                            value={inquiryNotesDraft}
                            onChange={(e) => setInquiryNotesDraft(e.target.value)}
                            className="w-full border-2 border-[#171717] bg-[#F3F0E8] p-3 text-sm"
                          />
                          <button
                            type="button"
                            disabled={savingInquiry}
                            onClick={handleSaveInquiryNotes}
                            className="mt-2 inline-flex items-center gap-2 bg-[#171717] text-[#F3F0E8] px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                          >
                            {savingInquiry ? 'Saving...' : 'Save Notes'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-[#171717]/75">
                    Manage portfolio entries, upload project visuals, and toggle published visibility.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject({
                        title: '',
                        slug: '',
                        category: 'LinkedIn',
                        short_summary: '',
                        description: '',
                        image_url: '',
                        external_url: '',
                        is_concept: true,
                        is_published: true,
                        sort_order: projects.length + 1,
                      });
                      setProjectTagsText('');
                    }}
                    className="inline-flex items-center gap-2 bg-[#315BFF] text-white border-2 border-[#171717] px-5 py-2.5 text-xs font-bold uppercase tracking-wider neo-shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Project</span>
                  </button>
                </div>

                {editingProject && (
                  <form
                    onSubmit={handleSaveProject}
                    className="border-2 border-[#171717] bg-white p-6 neo-shadow space-y-5"
                  >
                    <div className="flex items-center justify-between border-b-2 border-[#171717] pb-3">
                      <h3 className="font-display text-2xl uppercase">
                        {editingProject.id ? 'Edit Project' : 'New Project'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingProject(null)}
                        className="text-xs font-mono uppercase underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          TITLE *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProject.title || ''}
                          onChange={(e) => {
                            const title = e.target.value;
                            setEditingProject((prev) => ({
                              ...prev,
                              title,
                              slug: prev?.id ? prev.slug : slugify(title),
                            }));
                          }}
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          URL SLUG *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProject.slug || ''}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              slug: slugify(e.target.value),
                            })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          CATEGORY *
                        </label>
                        <select
                          value={editingProject.category || 'LinkedIn'}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              category: e.target.value as ProjectCategory,
                            })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm font-semibold"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          TAGS (COMMA SEPARATED)
                        </label>
                        <input
                          type="text"
                          value={projectTagsText}
                          onChange={(e) => setProjectTagsText(e.target.value)}
                          placeholder="Ghostwriting, Strategy, Design"
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-1">
                        SHORT SUMMARY
                      </label>
                      <input
                        type="text"
                        value={editingProject.short_summary || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            short_summary: e.target.value,
                          })
                        }
                        className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-1">
                        FULL DESCRIPTION
                      </label>
                      <textarea
                        rows={4}
                        value={editingProject.description || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            description: e.target.value,
                          })
                        }
                        className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          PROJECT IMAGE URL OR UPLOAD
                        </label>
                        <input
                          type="text"
                          value={editingProject.image_url || ''}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              image_url: e.target.value,
                            })
                          }
                          placeholder="/uploads/... or https://..."
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="inline-flex items-center gap-2 border-2 border-[#171717] bg-[#F3F0E8] px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#171717] hover:text-white transition-colors cursor-pointer">
                          {uploadingImage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-1">
                        OPTIONAL EXTERNAL LINK
                      </label>
                      <input
                        type="url"
                        value={editingProject.external_url || ''}
                        onChange={(e) =>
                          setEditingProject({
                            ...editingProject,
                            external_url: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <label className="inline-flex items-center gap-2 text-sm font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProject.is_concept)}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              is_concept: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-[#315BFF]"
                        />
                        <span>Label as Concept Project</span>
                      </label>

                      <label className="inline-flex items-center gap-2 text-sm font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProject.is_published)}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              is_published: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-[#315BFF]"
                        />
                        <span>Published on Website</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={savingProject}
                      className="inline-flex items-center gap-2 bg-[#D46B45] text-white border-2 border-[#171717] px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{savingProject ? 'Saving...' : 'Save Project'}</span>
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="border-2 border-[#171717] bg-white p-5 flex flex-col justify-between gap-4 neo-shadow-sm"
                    >
                      <div className="flex gap-4">
                        {p.image_url && (
                          <img
                            src={p.image_url}
                            alt={p.title}
                            referrerPolicy="no-referrer"
                            className="w-24 h-20 object-cover border border-[#171717] shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-mono text-[11px] uppercase text-[#315BFF] font-bold">
                            {p.category} {p.is_concept ? '· CONCEPT' : ''}
                          </div>
                          <h4 className="font-display text-2xl uppercase leading-tight truncate">
                            {p.title}
                          </h4>
                          <p className="text-xs text-[#171717]/75 line-clamp-2 mt-1">
                            {p.short_summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#171717]/15">
                        <button
                          type="button"
                          onClick={() => handleToggleProjectPublish(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-[#171717] cursor-pointer ${
                            p.is_published
                              ? 'bg-[#171717] text-white'
                              : 'bg-[#F3F0E8] text-[#171717]'
                          }`}
                        >
                          {p.is_published ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProject(p);
                              setProjectTagsText(p.tags.join(', '));
                            }}
                            className="p-2 border border-[#171717] hover:bg-[#315BFF] hover:text-white transition-colors cursor-pointer"
                            aria-label="Edit project"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-2 border border-[#171717] text-[#D46B45] hover:bg-[#D46B45] hover:text-white transition-colors cursor-pointer"
                            aria-label="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. SERVICES */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                {editingService && (
                  <form
                    onSubmit={handleSaveService}
                    className="border-2 border-[#171717] bg-white p-6 neo-shadow space-y-4"
                  >
                    <div className="flex items-center justify-between border-b-2 border-[#171717] pb-3">
                      <h3 className="font-display text-2xl uppercase">
                        Edit Service {editingService.number_label}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingService(null)}
                        className="text-xs font-mono uppercase underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          TITLE
                        </label>
                        <input
                          type="text"
                          required
                          value={editingService.title}
                          onChange={(e) =>
                            setEditingService({ ...editingService, title: e.target.value })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          SHORT LABEL
                        </label>
                        <input
                          type="text"
                          required
                          value={editingService.short_label}
                          onChange={(e) =>
                            setEditingService({
                              ...editingService,
                              short_label: e.target.value,
                            })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-1">
                        DESCRIPTION
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editingService.description}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            description: e.target.value,
                          })
                        }
                        className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-1">
                        DELIVERABLES (ONE PER LINE)
                      </label>
                      <textarea
                        rows={4}
                        value={serviceDeliverablesText}
                        onChange={(e) => setServiceDeliverablesText(e.target.value)}
                        className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingService.is_published}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            is_published: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-[#315BFF]"
                      />
                      <span>Published on Website</span>
                    </label>
                    <div>
                      <button
                        type="submit"
                        disabled={savingService}
                        className="bg-[#315BFF] text-white border-2 border-[#171717] px-6 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {savingService ? 'Saving...' : 'Save Service'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="divide-y-2 divide-[#171717] border-2 border-[#171717] bg-white">
                  {services.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-mono text-xs font-bold text-[#315BFF]">
                          {svc.number_label} · {svc.is_published ? 'PUBLISHED' : 'HIDDEN'}
                        </div>
                        <h4 className="font-display text-2xl uppercase">{svc.title}</h4>
                        <p className="text-sm text-[#171717]/75 mt-1">{svc.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingService(svc);
                          setServiceDeliverablesText(svc.deliverables.join('\n'));
                        }}
                        className="inline-flex items-center gap-2 border-2 border-[#171717] px-4 py-2 text-xs font-bold uppercase hover:bg-[#171717] hover:text-white transition-colors shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. PACKAGES */}
            {activeTab === 'packages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-[#171717]/75">
                    Configure studio tiers, deliverables, revisions, pricing labels, and visibility.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPackage({
                        name: '',
                        tagline: '',
                        currency: 'USD',
                        price_display: 'Custom Scope',
                        billing_type: 'Monthly',
                        description: '',
                        deliverables_count: '',
                        revisions_count: '',
                        cta_label: 'GET A CUSTOM QUOTE',
                        is_featured: false,
                        is_published: true,
                        sort_order: packages.length + 1,
                      });
                      setPackageFeaturesText('');
                    }}
                    className="inline-flex items-center gap-2 bg-[#315BFF] text-white border-2 border-[#171717] px-5 py-2.5 text-xs font-bold uppercase tracking-wider neo-shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Package</span>
                  </button>
                </div>

                {editingPackage && (
                  <form
                    onSubmit={handleSavePackage}
                    className="border-2 border-[#171717] bg-white p-6 neo-shadow space-y-4"
                  >
                    <div className="flex items-center justify-between border-b-2 border-[#171717] pb-3">
                      <h3 className="font-display text-2xl uppercase">
                        {editingPackage.id ? 'Edit Package' : 'New Package'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingPackage(null)}
                        className="text-xs font-mono uppercase underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          PACKAGE NAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingPackage.name || ''}
                          onChange={(e) =>
                            setEditingPackage({ ...editingPackage, name: e.target.value })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          CURRENCY *
                        </label>
                        <select
                          value={editingPackage.currency || 'USD'}
                          onChange={(e) =>
                            setEditingPackage({
                              ...editingPackage,
                              currency: e.target.value as CurrencyCode,
                            })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm font-semibold"
                        >
                          {CURRENCY_OPTIONS.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          PRICE DISPLAY *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingPackage.price_display || ''}
                          onChange={(e) =>
                            setEditingPackage({
                              ...editingPackage,
                              price_display: e.target.value,
                            })
                          }
                          placeholder={
                            editingPackage.currency === 'INR'
                              ? 'e.g. 25,000 or Custom Scope'
                              : 'e.g. 500 or Custom Scope'
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                        <div className="font-mono text-[11px] text-[#315BFF] mt-1">
                          Display:{' '}
                          {formatPackagePrice(
                            editingPackage.price_display || '',
                            editingPackage.currency || 'USD'
                          ) || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          BILLING TYPE
                        </label>
                        <input
                          type="text"
                          value={editingPackage.billing_type || ''}
                          onChange={(e) =>
                            setEditingPackage({
                              ...editingPackage,
                              billing_type: e.target.value,
                            })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          TAGLINE
                        </label>
                        <input
                          type="text"
                          value={editingPackage.tagline || ''}
                          onChange={(e) =>
                            setEditingPackage({ ...editingPackage, tagline: e.target.value })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          DELIVERABLES
                        </label>
                        <input
                          type="text"
                          value={editingPackage.deliverables_count || ''}
                          onChange={(e) =>
                            setEditingPackage({
                              ...editingPackage,
                              deliverables_count: e.target.value,
                            })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          REVISIONS
                        </label>
                        <input
                          type="text"
                          value={editingPackage.revisions_count || ''}
                          onChange={(e) =>
                            setEditingPackage({
                              ...editingPackage,
                              revisions_count: e.target.value,
                            })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-1">
                        DESCRIPTION
                      </label>
                      <textarea
                        rows={2}
                        value={editingPackage.description || ''}
                        onChange={(e) =>
                          setEditingPackage({
                            ...editingPackage,
                            description: e.target.value,
                          })
                        }
                        className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-1">
                        INCLUDED FEATURES (ONE PER LINE)
                      </label>
                      <textarea
                        rows={4}
                        value={packageFeaturesText}
                        onChange={(e) => setPackageFeaturesText(e.target.value)}
                        className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <label className="inline-flex items-center gap-2 text-sm font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingPackage.is_featured)}
                          onChange={(e) =>
                            setEditingPackage({
                              ...editingPackage,
                              is_featured: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-[#315BFF]"
                        />
                        <span>Highlight as Featured Tier</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingPackage.is_published)}
                          onChange={(e) =>
                            setEditingPackage({
                              ...editingPackage,
                              is_published: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-[#315BFF]"
                        />
                        <span>Published on Website</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={savingPackage}
                      className="bg-[#D46B45] text-white border-2 border-[#171717] px-6 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {savingPackage ? 'Saving...' : 'Save Package'}
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="border-2 border-[#171717] bg-white p-5 flex flex-col justify-between gap-4 neo-shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-mono text-[11px] uppercase text-[#315BFF] font-bold">
                            {pkg.billing_type} {pkg.is_featured ? '· FEATURED' : ''}
                          </div>
                          <span className="font-mono text-[11px] font-bold uppercase px-1.5 py-0.5 border border-[#171717] bg-[#F3F0E8]">
                            {pkg.currency}
                          </span>
                        </div>
                        <h4 className="font-display text-3xl uppercase mt-1">{pkg.name}</h4>
                        <div className="font-bold text-lg text-[#D46B45] mt-1">
                          {formatPackagePrice(pkg.price_display, pkg.currency)}
                        </div>
                        <p className="text-xs text-[#171717]/75 mt-2">{pkg.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#171717]/15">
                        <button
                          type="button"
                          onClick={() => handleTogglePackagePublish(pkg)}
                          className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border border-[#171717] cursor-pointer ${
                            pkg.is_published ? 'bg-[#171717] text-white' : 'bg-[#F3F0E8]'
                          }`}
                        >
                          {pkg.is_published ? 'Published' : 'Hidden'}
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPackage(pkg);
                              setPackageFeaturesText(pkg.features.join('\n'));
                            }}
                            className="p-2 border border-[#171717] hover:bg-[#315BFF] hover:text-white cursor-pointer"
                            aria-label="Edit package"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="p-2 border border-[#171717] text-[#D46B45] hover:bg-[#D46B45] hover:text-white cursor-pointer"
                            aria-label="Delete package"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. TESTIMONIALS */}
            {activeTab === 'testimonials' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-[#171717] bg-white p-5">
                  <p className="text-sm font-medium text-[#171717]/85">
                    Only genuine, verified client testimonials should be published. Unverified entries can remain hidden as drafts.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingTestimonial({
                        author_name: '',
                        author_role: '',
                        company: '',
                        quote: '',
                        is_published: false,
                      })
                    }
                    className="inline-flex items-center gap-2 bg-[#315BFF] text-white border-2 border-[#171717] px-5 py-2.5 text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Testimonial</span>
                  </button>
                </div>

                {editingTestimonial && (
                  <form
                    onSubmit={handleSaveTestimonial}
                    className="border-2 border-[#171717] bg-white p-6 neo-shadow space-y-4"
                  >
                    <div className="flex justify-between items-center border-b-2 border-[#171717] pb-3">
                      <h3 className="font-display text-2xl uppercase">
                        {editingTestimonial.id ? 'Edit Testimonial' : 'Add Genuine Testimonial'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingTestimonial(null)}
                        className="text-xs font-mono uppercase underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          CLIENT NAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingTestimonial.author_name || ''}
                          onChange={(e) =>
                            setEditingTestimonial({
                              ...editingTestimonial,
                              author_name: e.target.value,
                            })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          ROLE
                        </label>
                        <input
                          type="text"
                          value={editingTestimonial.author_role || ''}
                          onChange={(e) =>
                            setEditingTestimonial({
                              ...editingTestimonial,
                              author_role: e.target.value,
                            })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-xs font-bold uppercase mb-1">
                          COMPANY / BRAND
                        </label>
                        <input
                          type="text"
                          value={editingTestimonial.company || ''}
                          onChange={(e) =>
                            setEditingTestimonial({
                              ...editingTestimonial,
                              company: e.target.value,
                            })
                          }
                          className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono text-xs font-bold uppercase mb-1">
                        QUOTE *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editingTestimonial.quote || ''}
                        onChange={(e) =>
                          setEditingTestimonial({
                            ...editingTestimonial,
                            quote: e.target.value,
                          })
                        }
                        className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingTestimonial.is_published)}
                        onChange={(e) =>
                          setEditingTestimonial({
                            ...editingTestimonial,
                            is_published: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-[#315BFF]"
                      />
                      <span>Publish on Public Website</span>
                    </label>
                    <div>
                      <button
                        type="submit"
                        disabled={savingTestimonial}
                        className="bg-[#D46B45] text-white border-2 border-[#171717] px-6 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {savingTestimonial ? 'Saving...' : 'Save Testimonial'}
                      </button>
                    </div>
                  </form>
                )}

                {testimonials.length === 0 ? (
                  <div className="border-2 border-dashed border-[#171717]/40 p-12 text-center bg-white/50">
                    <p className="font-display text-2xl uppercase">
                      No Testimonials Added Yet
                    </p>
                    <p className="text-sm text-[#171717]/70 mt-1">
                      CreatorFctry never publishes fabricated testimonials. Add real client feedback here when ready.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {testimonials.map((t) => (
                      <div
                        key={t.id}
                        className="border-2 border-[#171717] bg-white p-5 flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="font-mono text-[11px] uppercase text-[#315BFF] font-bold">
                            {t.is_published ? 'PUBLISHED' : 'DRAFT'}
                          </div>
                          <p className="text-sm font-medium mt-2">&ldquo;{t.quote}&rdquo;</p>
                          <div className="text-xs font-bold mt-3">
                            {t.author_name}{' '}
                            <span className="font-normal text-[#171717]/70">
                              {[t.author_role, t.company].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t border-[#171717]/15">
                          <button
                            type="button"
                            onClick={() => setEditingTestimonial(t)}
                            className="p-2 border border-[#171717] hover:bg-[#315BFF] hover:text-white cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTestimonial(t.id)}
                            className="p-2 border border-[#171717] text-[#D46B45] hover:bg-[#D46B45] hover:text-white cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. WEBSITE SETTINGS */}
            {activeTab === 'settings' && settingsDraft && (
              <form
                onSubmit={handleSaveSettings}
                className="border-2 border-[#171717] bg-white p-6 sm:p-8 neo-shadow space-y-6 max-w-4xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      BRAND NAME
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.brand_name}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, brand_name: e.target.value })
                      }
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      TAGLINE
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.tagline}
                      onChange={(e) =>
                        setSettingsDraft({ ...settingsDraft, tagline: e.target.value })
                      }
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      CONTACT EMAIL
                    </label>
                    <input
                      type="email"
                      value={settingsDraft.contact_email}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          contact_email: e.target.value,
                        })
                      }
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      INSTAGRAM HANDLE
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.instagram_handle}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          instagram_handle: e.target.value,
                        })
                      }
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      INSTAGRAM URL
                    </label>
                    <input
                      type="url"
                      value={settingsDraft.instagram_url}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          instagram_url: e.target.value,
                        })
                      }
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="border-t-2 border-[#171717] pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      HERO LINE 1
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.hero_headline_line1}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          hero_headline_line1: e.target.value,
                        })
                      }
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      HERO LINE 2 (ELECTRIC BLUE)
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.hero_headline_line2}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          hero_headline_line2: e.target.value,
                        })
                      }
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      HERO SUPPORTING COPY
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.hero_subheadline}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          hero_subheadline: e.target.value,
                        })
                      }
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="border-t-2 border-[#171717] pt-5 space-y-4">
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      ABOUT HEADLINE
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.about_headline}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          about_headline: e.target.value,
                        })
                      }
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      ABOUT DESCRIPTION
                    </label>
                    <textarea
                      rows={4}
                      value={settingsDraft.about_body}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          about_body: e.target.value,
                        })
                      }
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t-2 border-[#171717] pt-5">
                  <div>
                    <div className="font-mono text-xs font-bold uppercase mb-1.5">
                      ACTIVE INQUIRY BUDGET TIERS (INR &amp; USD)
                    </div>
                    <div className="border-2 border-[#171717] bg-[#F3F0E8] p-3.5 text-xs font-mono space-y-2.5">
                      <div>
                        <div className="font-bold text-[#D46B45]">INR (₹ Indian Rupee)</div>
                        <div className="text-[#171717]/80 mt-0.5">
                          {BUDGET_OPTIONS_BY_CURRENCY.INR.join(' · ')}
                        </div>
                      </div>
                      <div className="border-t border-[#171717]/20 pt-2">
                        <div className="font-bold text-[#315BFF]">USD ($ US Dollar)</div>
                        <div className="text-[#171717]/80 mt-0.5">
                          {BUDGET_OPTIONS_BY_CURRENCY.USD.join(' · ')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-xs font-bold uppercase mb-1.5">
                      SOCIAL LINKS (LABEL | URL PER LINE)
                    </label>
                    <textarea
                      rows={5}
                      value={socialLinksText}
                      onChange={(e) => setSocialLinksText(e.target.value)}
                      placeholder="LinkedIn | https://linkedin.com/..."
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 bg-[#315BFF] text-white border-2 border-[#171717] px-6 py-3 text-xs font-bold uppercase tracking-wider neo-shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingSettings ? 'Saving...' : 'Save Website Settings'}</span>
                  </button>
                  {settings?.updated_at && (
                    <span className="font-mono text-[11px] text-[#171717]/60">
                      Updated {new Date(settings.updated_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
