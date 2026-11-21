import type {
  AdminOverviewStats,
  CurrencyCode,
  InquiryItem,
  InquiryStatus,
  PackageItem,
  ProjectItem,
  PublicBootstrapData,
  ServiceItem,
  SiteSettings,
  TestimonialItem,
} from '../types/studio';
import {
  fetchPublicBootstrapFromSupabase,
  fetchPublishedProjectBySlugFromSupabase,
} from './supabase';

// Session token held strictly in memory (never localStorage or sessionStorage)
let adminBearerToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAdminToken(token: string | null) {
  adminBearerToken = token;
}

export function getAdminToken(): string | null {
  return adminBearerToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const hadToken = Boolean(adminBearerToken);
  if (adminBearerToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${adminBearerToken}`);
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (
      res.status === 401 &&
      hadToken &&
      url.startsWith('/api/admin/') &&
      !url.startsWith('/api/admin/auth/')
    ) {
      adminBearerToken = null;
      unauthorizedHandler?.();
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const studioApi = {
  // Public
  getBootstrap: async (): Promise<PublicBootstrapData> => {
    const supabaseData = await fetchPublicBootstrapFromSupabase();
    if (supabaseData) return supabaseData;
    return request<PublicBootstrapData>('/api/public/bootstrap');
  },

  getProjectBySlug: async (slug: string): Promise<ProjectItem> => {
    const supabaseProject = await fetchPublishedProjectBySlugFromSupabase(slug);
    if (supabaseProject) return supabaseProject;
    return request<ProjectItem>(`/api/public/projects/${encodeURIComponent(slug)}`);
  },

  submitInquiry: (payload: {
    full_name: string;
    email: string;
    brand_name: string;
    service_required: string;
    currency: CurrencyCode;
    budget_range: string;
    project_details: string;
    website_url?: string;
  }) =>
    request<{ ok: boolean; inquiry: { id: string; created_at: string } }>(
      '/api/public/inquiries',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Admin Auth
  getAuthStatus: () =>
    request<{
      needsSetup: boolean;
      hasEnvPasscode: boolean;
      supabaseEnabled: boolean;
      authenticated: boolean;
      email: string | null;
    }>('/api/admin/auth/status'),

  setupAdmin: (email: string, password: string) =>
    request<{ ok: boolean; token: string; email: string }>('/api/admin/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  loginAdmin: (email: string, password: string) =>
    request<{ ok: boolean; token: string; email: string }>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logoutAdmin: () =>
    request<{ ok: boolean }>('/api/admin/auth/logout', {
      method: 'POST',
    }),

  // Admin Overview
  getOverview: () => request<AdminOverviewStats>('/api/admin/overview'),

  // Projects
  listProjects: () => request<ProjectItem[]>('/api/admin/projects'),
  createProject: (payload: Partial<ProjectItem>) =>
    request<ProjectItem>('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProject: (id: string, payload: Partial<ProjectItem>) =>
    request<ProjectItem>(`/api/admin/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProject: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Upload
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ url: string }>('/api/admin/upload', {
      method: 'POST',
      body: form,
    });
  },

  // Services
  listServices: () => request<ServiceItem[]>('/api/admin/services'),
  updateService: (id: string, payload: Partial<ServiceItem>) =>
    request<ServiceItem>(`/api/admin/services/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Packages
  listPackages: () => request<PackageItem[]>('/api/admin/packages'),
  createPackage: (payload: Partial<PackageItem>) =>
    request<PackageItem>('/api/admin/packages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePackage: (id: string, payload: Partial<PackageItem>) =>
    request<PackageItem>(`/api/admin/packages/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deletePackage: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/packages/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Inquiries
  listInquiries: () => request<InquiryItem[]>('/api/admin/inquiries'),
  updateInquiry: (
    id: string,
    payload: { status?: InquiryStatus; admin_notes?: string }
  ) =>
    request<InquiryItem>(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteInquiry: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Testimonials
  listTestimonials: () => request<TestimonialItem[]>('/api/admin/testimonials'),
  createTestimonial: (payload: Partial<TestimonialItem>) =>
    request<TestimonialItem>('/api/admin/testimonials', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTestimonial: (id: string, payload: Partial<TestimonialItem>) =>
    request<TestimonialItem>(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteTestimonial: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Settings
  getSettings: () => request<SiteSettings>('/api/admin/settings'),
  updateSettings: (payload: Partial<SiteSettings>) =>
    request<SiteSettings>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
