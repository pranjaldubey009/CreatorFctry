import { motion } from 'motion/react';
import { ArrowUpRight, Check, Quote } from 'lucide-react';
import {
  formatPackagePrice,
  type CurrencyCode,
  type PackageItem,
  type TestimonialItem,
} from '../types/studio';

interface PackagesSectionProps {
  packages: PackageItem[];
  testimonials: TestimonialItem[];
  onRequestQuote: (packageName: string, currency?: CurrencyCode) => void;
}

export function PackagesSection({
  packages,
  testimonials,
  onRequestQuote,
}: PackagesSectionProps) {
  return (
    <section
      id="packages"
      className="border-b-2 border-[#171717] bg-[#F3F0E8] py-16 md:py-24"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b-2 border-[#171717]">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#315BFF] mb-3">
              STUDIO ENGAGEMENTS
            </div>
            <h2 className="font-display font-bold uppercase text-5xl sm:text-6xl md:text-7xl tracking-[-0.02em] leading-[0.9] text-[#171717]">
              FLEXIBLE PACKAGES.
            </h2>
          </div>
          <p className="text-base sm:text-lg font-medium text-[#171717]/80 max-w-md leading-relaxed">
            Built around the formats and cadence you actually need — from single-channel momentum to full multi-format production.
          </p>
        </div>

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <div className="mt-10 border-2 border-[#171717] bg-white/50 p-10 text-center">
            <p className="font-display text-2xl uppercase text-[#171717]">
              Custom Scopes Tailored to Your Brief
            </p>
            <p className="mt-2 text-sm text-[#171717]/80">
              Tell us which formats you need and we will prepare a clear studio proposal.
            </p>
            <button
              type="button"
              onClick={() => onRequestQuote('Custom Package')}
              className="mt-6 inline-flex items-center gap-2 bg-[#315BFF] text-white border-2 border-[#171717] px-6 py-3 text-xs font-bold uppercase tracking-wider neo-btn neo-shadow-sm cursor-pointer"
            >
              <span>GET A CUSTOM QUOTE</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 items-stretch">
            {packages.map((pkg, idx) => {
              const isFeatured = pkg.is_featured;
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`flex flex-col justify-between border-2 border-[#171717] p-7 neo-shadow ${
                    isFeatured
                      ? 'bg-[#171717] text-[#F3F0E8]'
                      : 'bg-[#F3F0E8] text-[#171717]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span
                        className={`font-mono text-xs font-bold uppercase tracking-widest ${
                          isFeatured ? 'text-[#D46B45]' : 'text-[#315BFF]'
                        }`}
                      >
                        {pkg.billing_type}
                      </span>
                      {isFeatured && (
                        <span className="bg-[#315BFF] text-white font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                          MULTI-FORMAT
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-4xl sm:text-[42px] font-bold uppercase tracking-tight leading-none">
                      {pkg.name}
                    </h3>

                    {pkg.tagline && (
                      <p
                        className={`mt-2 text-sm font-medium ${
                          isFeatured ? 'text-[#F3F0E8]/75' : 'text-[#171717]/75'
                        }`}
                      >
                        {pkg.tagline}
                      </p>
                    )}

                    <div
                      className={`mt-6 py-4 border-y-2 ${
                        isFeatured ? 'border-[#F3F0E8]/20' : 'border-[#171717]'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="font-display text-3xl font-bold uppercase tabular-nums">
                          {formatPackagePrice(pkg.price_display, pkg.currency)}
                        </div>
                        <span
                          className={`font-mono text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                            isFeatured
                              ? 'border-[#F3F0E8]/40 text-[#F3F0E8]/85'
                              : 'border-[#171717]/40 text-[#171717]/75'
                          }`}
                        >
                          {pkg.currency}
                        </span>
                      </div>
                      {(pkg.deliverables_count || pkg.revisions_count) && (
                        <div
                          className={`mt-1.5 font-mono text-xs flex flex-wrap items-center gap-x-3 gap-y-1 ${
                            isFeatured ? 'text-[#F3F0E8]/70' : 'text-[#171717]/70'
                          }`}
                        >
                          {pkg.deliverables_count && <span>{pkg.deliverables_count}</span>}
                          {pkg.deliverables_count && pkg.revisions_count && (
                            <span aria-hidden="true">·</span>
                          )}
                          {pkg.revisions_count && <span>{pkg.revisions_count}</span>}
                        </div>
                      )}
                    </div>

                    {pkg.description && (
                      <p
                        className={`mt-5 text-sm leading-relaxed ${
                          isFeatured ? 'text-[#F3F0E8]/85' : 'text-[#171717]/85'
                        }`}
                      >
                        {pkg.description}
                      </p>
                    )}

                    {pkg.features.length > 0 && (
                      <ul className="mt-5 space-y-2.5 text-sm">
                        {pkg.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5">
                            <Check
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                isFeatured ? 'text-[#D46B45]' : 'text-[#315BFF]'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="pt-8">
                    <button
                      type="button"
                      onClick={() => onRequestQuote(pkg.name, pkg.currency)}
                      className={`w-full inline-flex items-center justify-center gap-2 border-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap neo-btn cursor-pointer ${
                        isFeatured
                          ? 'bg-[#D46B45] text-white border-[#F3F0E8] hover:bg-[#315BFF]'
                          : 'bg-[#315BFF] text-white border-[#171717] neo-shadow-sm'
                      }`}
                    >
                      <span>{pkg.cta_label || 'GET A CUSTOM QUOTE'}</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Genuine Published Testimonials (only rendered if real testimonials are published in DB) */}
        {testimonials.length > 0 && (
          <div className="mt-16 pt-14 border-t-2 border-[#171717]">
            <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#D46B45] mb-6">
              CLIENT PERSPECTIVES
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((item) => (
                <blockquote
                  key={item.id}
                  className="border-2 border-[#171717] bg-white/60 p-6 flex flex-col justify-between neo-shadow-sm"
                >
                  <div>
                    <Quote className="w-6 h-6 text-[#315BFF] mb-4" aria-hidden="true" />
                    <p className="text-base font-medium text-[#171717] leading-relaxed">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </div>
                  <footer className="mt-6 pt-4 border-t border-[#171717]/20">
                    <div className="text-sm font-extrabold text-[#171717]">
                      {item.author_name}
                    </div>
                    {(item.author_role || item.company) && (
                      <div className="text-xs font-mono text-[#171717]/70 mt-0.5">
                        {[item.author_role, item.company].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
