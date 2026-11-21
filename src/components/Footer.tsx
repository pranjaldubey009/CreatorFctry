import { ArrowUpRight } from 'lucide-react';
import type { SiteSettings } from '../types/studio';

interface FooterProps {
  settings: SiteSettings;
  onNavigateHome: (hash?: string) => void;
  onOpenAdmin: () => void;
}

export function Footer({
  settings,
  onNavigateHome,
  onOpenAdmin,
}: FooterProps) {
  const normalized = settings.brand_name.trim().toUpperCase();
  const hasSplitBrand = normalized === 'CREATORFCTRY';

  return (
    <footer className="bg-[#171717] text-[#F3F0E8]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#F3F0E8]/20">
          {/* Brand Lockup */}
          <div className="md:col-span-6 space-y-4">
            <div className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-none">
              {hasSplitBrand ? (
                <>
                  <span className="text-[#F3F0E8]">CREATOR</span>
                  <span className="text-[#D46B45]">FCTRY</span>
                </>
              ) : (
                <span>{settings.brand_name}</span>
              )}
            </div>
            <div className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-[#315BFF]">
              {settings.tagline.toUpperCase()}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-mono text-xs uppercase tracking-widest text-[#F3F0E8]/55">
              STUDIO
            </div>
            <ul className="space-y-2.5 text-sm font-semibold">
              {[
                { label: 'Work', hash: '#work' },
                { label: 'Services', hash: '#services' },
                { label: 'About', hash: '#about' },
                { label: 'Contact', hash: '#contact' },
              ].map((link) => (
                <li key={link.hash}>
                  <a
                    href={link.hash}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateHome(link.hash);
                    }}
                    className="hover:text-[#D46B45] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Direct Channels */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-mono text-xs uppercase tracking-widest text-[#F3F0E8]/55">
              CONNECT
            </div>
            <ul className="space-y-2.5 text-sm font-semibold">
              {settings.instagram_url && (
                <li>
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-[#315BFF] transition-colors"
                  >
                    <span>Instagram ({settings.instagram_handle})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="inline-flex items-center gap-1.5 hover:text-[#D46B45] transition-colors"
                >
                  <span>Email ({settings.contact_email})</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
              {settings.social_links
                .filter(
                  (s) =>
                    s.label.toLowerCase() !== 'instagram' &&
                    s.label.toLowerCase() !== 'email'
                )
                .map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-[#315BFF] transition-colors"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright + Admin Portal Entry */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-[#F3F0E8]/65">
          <span>© 2026 CreatorFctry.</span>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="hover:text-[#F3F0E8] underline underline-offset-4 transition-colors cursor-pointer"
          >
            Studio Admin
          </button>
        </div>
      </div>
    </footer>
  );
}
