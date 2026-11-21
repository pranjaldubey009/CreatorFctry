/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { PackagesSection } from './components/PackagesSection';
import { PortfolioSection } from './components/PortfolioSection';
import { ProcessSection } from './components/ProcessSection';
import { ProjectDetailPage } from './components/ProjectDetailPage';
import { ServicesSection } from './components/ServicesSection';
import { studioApi } from './lib/api';
import type { CurrencyCode, PublicBootstrapData } from './types/studio';

const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

const DEFAULT_BOOTSTRAP: PublicBootstrapData = {
  projects: [],
  services: [],
  packages: [],
  testimonials: [],
  settings: {
    id: 1,
    brand_name: 'CREATORFCTRY',
    tagline: 'One Factory. Every Format.',
    contact_email: 'creatorfctry@gmail.com',
    instagram_handle: '@creatorfctry',
    instagram_url: 'https://instagram.com/creatorfctry',
    social_links: [],
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
    updated_at: '',
  },
};

export default function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const [data, setData] = useState<PublicBootstrapData>(DEFAULT_BOOTSTRAP);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [preselectedService, setPreselectedService] = useState<string | undefined>(
    undefined
  );
  const [preselectedCurrency, setPreselectedCurrency] = useState<CurrencyCode | undefined>(
    undefined
  );
  const [preselectionNonce, setPreselectionNonce] = useState(0);
  const [highlightedServiceSlug, setHighlightedServiceSlug] = useState<string | null>(
    null
  );

  const loadBootstrap = useCallback(async () => {
    try {
      const res = await studioApi.getBootstrap();
      setData(res);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load studio content.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = useCallback((path: string, hash?: string) => {
    const nextUrl = path + (hash || '');
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', nextUrl);
      setPathname(path);
    } else if (window.location.hash !== (hash || '')) {
      window.history.replaceState({}, '', nextUrl);
    }
    if (hash) {
      window.setTimeout(() => {
        const target = document.querySelector(hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 90);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleStartProject = useCallback(
    (serviceOrPackage?: string, currency?: CurrencyCode) => {
      if (serviceOrPackage) {
        setPreselectedService(serviceOrPackage);
      }
      if (currency) {
        setPreselectedCurrency(currency);
      }
      setPreselectionNonce((n) => n + 1);
      navigateTo('/', '#contact');
    },
    [navigateTo]
  );

  const handleSelectHeroTile = useCallback(
    (shortLabel: string) => {
      setHighlightedServiceSlug(shortLabel);
      navigateTo('/', '#services');
      window.setTimeout(() => {
        setHighlightedServiceSlug(null);
      }, 2600);
    },
    [navigateTo]
  );

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const workMatch = pathname.match(/^\/work\/([a-z0-9-]+)$/i);
  const projectSlug = workMatch ? workMatch[1] : null;

  if (isAdminRoute) {
    return (
      <MotionConfig reducedMotion="user">
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#F3F0E8] flex items-center justify-center p-6">
              <div className="border-2 border-[#171717] bg-white px-8 py-6 neo-shadow font-mono text-xs font-bold uppercase tracking-wider">
                Loading Studio Admin...
              </div>
            </div>
          }
        >
          <AdminDashboard
            onBackToSite={() => navigateTo('/')}
            onDataChanged={loadBootstrap}
          />
        </Suspense>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#F3F0E8] text-[#171717]">
        <Navbar
          brandName={data.settings.brand_name}
          onNavigateHome={(hash) => navigateTo('/', hash)}
          onStartProject={() => handleStartProject()}
        />

        {loadError && (
          <div className="bg-[#D46B45] text-white border-b-2 border-[#171717] px-6 py-3 text-xs font-mono flex items-center justify-between">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={loadBootstrap}
              className="underline font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {projectSlug ? (
          <ProjectDetailPage
            slug={projectSlug}
            initialProjects={data.projects}
            onBackToWork={() => navigateTo('/', '#work')}
            onOpenProject={(slug) => navigateTo(`/work/${slug}`)}
            onStartProjectForCategory={(cat) => handleStartProject(cat)}
          />
        ) : (
          <main className="flex-1">
            <HeroSection
              settings={data.settings}
              onExploreWork={() => navigateTo('/', '#work')}
              onStartProject={() => handleStartProject()}
              onSelectServiceTile={handleSelectHeroTile}
            />

            {loading ? (
              <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-16">
                <div className="border-2 border-[#171717] bg-white/50 p-12 animate-pulse space-y-4">
                  <div className="h-8 w-64 bg-[#171717]/15" />
                  <div className="h-4 w-full max-w-xl bg-[#171717]/10" />
                </div>
              </section>
            ) : (
              <>
                <ServicesSection
                  services={data.services}
                  highlightedSlug={highlightedServiceSlug}
                  onInquireService={(title) => handleStartProject(title)}
                />

                <PortfolioSection
                  projects={data.projects}
                  onOpenProject={(slug) => navigateTo(`/work/${slug}`)}
                />

                <AboutSection settings={data.settings} />

                <ProcessSection />

                <PackagesSection
                  packages={data.packages}
                  testimonials={data.testimonials}
                  onRequestQuote={(pkgName, pkgCurrency) =>
                    handleStartProject(pkgName, pkgCurrency)
                  }
                />

                <FaqSection />

                <ContactSection
                  settings={data.settings}
                  preselectedService={preselectedService}
                  preselectedCurrency={preselectedCurrency}
                  preselectionKey={preselectionNonce}
                />
              </>
            )}
          </main>
        )}

        <Footer
          settings={data.settings}
          onNavigateHome={(hash) => navigateTo('/', hash)}
          onOpenAdmin={() => navigateTo('/admin')}
        />
      </div>
    </MotionConfig>
  );
}
