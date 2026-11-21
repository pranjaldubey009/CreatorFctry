import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, CheckCircle2, Instagram, Loader2, Mail } from 'lucide-react';
import { studioApi } from '../lib/api';
import {
  BUDGET_OPTIONS_BY_CURRENCY,
  CURRENCY_OPTIONS,
  type CurrencyCode,
  type SiteSettings,
} from '../types/studio';

interface ContactSectionProps {
  settings: SiteSettings;
  preselectedService?: string;
  preselectedCurrency?: CurrencyCode;
  preselectionKey?: number;
}

const SERVICE_OPTIONS = [
  'LinkedIn Personal Branding',
  'UGC Content',
  'Reels',
  'Carousels',
  'YouTube Thumbnails',
  'Multiple Services',
  'Other',
];

function mapServicePreselection(input?: string): string {
  if (!input) return 'LinkedIn Personal Branding';
  const lower = input.toLowerCase();
  if (lower.includes('linkedin') || lower.includes('personal brand')) {
    return 'LinkedIn Personal Branding';
  }
  if (lower.includes('ugc')) return 'UGC Content';
  if (lower.includes('reel') || lower.includes('short-form')) return 'Reels';
  if (lower.includes('carousel')) return 'Carousels';
  if (lower.includes('thumbnail') || lower.includes('youtube')) return 'YouTube Thumbnails';
  if (lower.includes('growth') || lower.includes('multiple')) return 'Multiple Services';
  return 'Other';
}

export function ContactSection({
  settings,
  preselectedService,
  preselectedCurrency,
  preselectionKey = 0,
}: ContactSectionProps) {
  const [currency, setCurrency] = useState<CurrencyCode>(preselectedCurrency || 'USD');
  const budgetOptions = BUDGET_OPTIONS_BY_CURRENCY[currency];

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [brandName, setBrandName] = useState('');
  const [serviceRequired, setServiceRequired] = useState(
    mapServicePreselection(preselectedService)
  );
  const [budgetRange, setBudgetRange] = useState(
    BUDGET_OPTIONS_BY_CURRENCY[preselectedCurrency || 'USD'][1]
  );
  const [projectDetails, setProjectDetails] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(''); // Honeypot

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (preselectionKey > 0) {
      setSubmittedId(null);
      setError(null);
    }
    if (preselectedService) {
      setServiceRequired(mapServicePreselection(preselectedService));
      if (
        preselectedService === 'STARTER' ||
        preselectedService === 'GROWTH' ||
        preselectedService === 'PERSONAL BRAND'
      ) {
        setProjectDetails((prev) =>
          prev.trim()
            ? prev
            : `Interested in the ${preselectedService} package. Here is what we are building:`
        );
      }
    }
  }, [preselectedService, preselectionKey]);

  useEffect(() => {
    if (preselectedCurrency) {
      setCurrency(preselectedCurrency);
      const nextOptions = BUDGET_OPTIONS_BY_CURRENCY[preselectedCurrency];
      setBudgetRange(nextOptions[1] || nextOptions[0]);
    }
  }, [preselectedCurrency, preselectionKey]);

  const handleCurrencyChange = (nextCurrency: CurrencyCode) => {
    if (nextCurrency === currency) return;
    const prevIndex = budgetOptions.indexOf(budgetRange);
    const nextOptions = BUDGET_OPTIONS_BY_CURRENCY[nextCurrency];
    setCurrency(nextCurrency);
    setBudgetRange(
      prevIndex >= 0 && prevIndex < nextOptions.length
        ? nextOptions[prevIndex]
        : nextOptions[1] || nextOptions[0]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!BUDGET_OPTIONS_BY_CURRENCY[currency].includes(budgetRange)) {
      setError(`Please select a valid budget range for ${currency}.`);
      return;
    }
    if (projectDetails.trim().length < 10) {
      setError('Please include a brief description of your project (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await studioApi.submitInquiry({
        full_name: fullName.trim(),
        email: email.trim(),
        brand_name: brandName.trim(),
        service_required: serviceRequired,
        currency,
        budget_range: budgetRange,
        project_details: projectDetails.trim(),
        website_url: websiteUrl,
      });
      setSubmittedId(res.inquiry.id);
      setFullName('');
      setEmail('');
      setBrandName('');
      setProjectDetails('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not submit inquiry. Please email creatorfctry@gmail.com directly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="border-b-2 border-[#171717] bg-[#F3F0E8] py-16 md:py-24"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Studio Contact Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#315BFF] mb-3">
                START A PROJECT
              </div>
              <h2 className="font-display font-bold uppercase text-5xl sm:text-6xl md:text-7xl tracking-[-0.02em] leading-[0.9] text-[#171717] text-balance">
                LET&apos;S BUILD YOUR NEXT FORMAT.
              </h2>
              <p className="mt-5 text-base sm:text-lg font-medium text-[#171717]/85 leading-relaxed">
                Tell us what you are creating, which formats you need, and your timeline. Every inquiry goes straight to our studio team.
              </p>
            </div>

            <div className="border-2 border-[#171717] bg-[#171717] text-[#F3F0E8] p-6 sm:p-7 neo-shadow space-y-5">
              <div className="font-mono text-xs uppercase tracking-widest text-[#D46B45]">
                DIRECT CHANNELS
              </div>

              <a
                href={`mailto:${settings.contact_email}`}
                className="flex items-center justify-between gap-4 py-3 border-b border-[#F3F0E8]/20 hover:text-[#315BFF] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-5 h-5 text-[#D46B45] shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] uppercase text-[#F3F0E8]/60">
                      EMAIL
                    </div>
                    <div className="text-base font-bold truncate">
                      {settings.contact_email}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 py-2 hover:text-[#315BFF] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Instagram className="w-5 h-5 text-[#315BFF] shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] uppercase text-[#F3F0E8]/60">
                        INSTAGRAM
                      </div>
                      <div className="text-base font-bold truncate">
                        {settings.instagram_handle}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              )}
            </div>
          </div>

          {/* Right Inquiry Form */}
          <div className="lg:col-span-7 border-2 border-[#171717] bg-white/75 p-6 sm:p-8 md:p-10 neo-shadow-lg">
            {submittedId ? (
              <div className="py-10 space-y-5">
                <div className="w-14 h-14 bg-[#315BFF] text-white border-2 border-[#171717] flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                </div>
                <h3 className="font-display text-4xl uppercase text-[#171717]">
                  PROJECT BRIEF RECEIVED.
                </h3>
                <p className="text-base text-[#171717]/85 max-w-lg leading-relaxed">
                  Thank you for reaching out to CreatorFctry. Your inquiry has been logged in our studio database and we will follow up via email shortly.
                </p>
                <div className="font-mono text-xs text-[#171717]/60">
                  REFERENCE ID: {submittedId.slice(0, 8).toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={() => setSubmittedId(null)}
                  className="inline-flex items-center gap-2 border-2 border-[#171717] bg-[#F3F0E8] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#171717] hover:text-[#F3F0E8] transition-colors cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* Honeypot anti-spam field */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website_url">Website</label>
                  <input
                    id="website_url"
                    name="website_url"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="border-2 border-[#171717] bg-[#D46B45]/15 px-4 py-3 text-sm font-bold text-[#171717]"
                  >
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="inquiry-name"
                      className="block font-mono text-xs font-bold uppercase tracking-wider text-[#171717] mb-2"
                    >
                      FULL NAME *
                    </label>
                    <input
                      id="inquiry-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-4 py-3 text-sm font-medium text-[#171717] placeholder:text-[#171717]/40 focus:outline-none focus:border-[#315BFF]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="inquiry-email"
                      className="block font-mono text-xs font-bold uppercase tracking-wider text-[#171717] mb-2"
                    >
                      EMAIL ADDRESS *
                    </label>
                    <input
                      id="inquiry-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-4 py-3 text-sm font-medium text-[#171717] placeholder:text-[#171717]/40 focus:outline-none focus:border-[#315BFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="inquiry-brand"
                      className="block font-mono text-xs font-bold uppercase tracking-wider text-[#171717] mb-2"
                    >
                      BRAND / BUSINESS NAME
                    </label>
                    <input
                      id="inquiry-brand"
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Studio or Personal Brand"
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-4 py-3 text-sm font-medium text-[#171717] placeholder:text-[#171717]/40 focus:outline-none focus:border-[#315BFF]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="inquiry-service"
                      className="block font-mono text-xs font-bold uppercase tracking-wider text-[#171717] mb-2"
                    >
                      SERVICE REQUIRED *
                    </label>
                    <select
                      id="inquiry-service"
                      value={serviceRequired}
                      onChange={(e) => setServiceRequired(e.target.value)}
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-4 py-3 text-sm font-semibold text-[#171717] focus:outline-none focus:border-[#315BFF]"
                    >
                      {SERVICE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <span
                      id="inquiry-currency-label"
                      className="block font-mono text-xs font-bold uppercase tracking-wider text-[#171717] mb-2"
                    >
                      CURRENCY *
                    </span>
                    <div
                      role="radiogroup"
                      aria-labelledby="inquiry-currency-label"
                      className="grid grid-cols-2 gap-2"
                    >
                      {CURRENCY_OPTIONS.map((opt) => {
                        const isSelected = currency === opt.code;
                        return (
                          <button
                            key={opt.code}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleCurrencyChange(opt.code)}
                            className={`border-2 border-[#171717] px-3 py-3 text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#171717] text-[#F3F0E8]'
                                : 'bg-[#F3F0E8] text-[#171717] hover:bg-[#315BFF]/10'
                            }`}
                          >
                            <div className="font-mono text-xs font-bold uppercase tracking-wider">
                              {opt.code} · {opt.symbol}
                            </div>
                            <div
                              className={`text-[11px] font-medium mt-0.5 truncate ${
                                isSelected ? 'text-[#F3F0E8]/75' : 'text-[#171717]/70'
                              }`}
                            >
                              {opt.code === 'INR' ? 'Indian Rupee' : 'US Dollar'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="inquiry-budget"
                      className="block font-mono text-xs font-bold uppercase tracking-wider text-[#171717] mb-2"
                    >
                      BUDGET RANGE ({currency}) *
                    </label>
                    <select
                      id="inquiry-budget"
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-4 py-3 text-sm font-semibold text-[#171717] focus:outline-none focus:border-[#315BFF]"
                    >
                      {budgetOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="inquiry-details"
                    className="block font-mono text-xs font-bold uppercase tracking-wider text-[#171717] mb-2"
                  >
                    PROJECT DETAILS *
                  </label>
                  <textarea
                    id="inquiry-details"
                    rows={4}
                    required
                    value={projectDetails}
                    onChange={(e) => setProjectDetails(e.target.value)}
                    placeholder="Share your goals, target formats, publishing cadence, or links to your current channels..."
                    className="w-full border-2 border-[#171717] bg-[#F3F0E8] px-4 py-3 text-sm font-medium text-[#171717] placeholder:text-[#171717]/40 focus:outline-none focus:border-[#315BFF]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2.5 bg-[#D46B45] text-white border-2 border-[#171717] px-7 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap neo-btn neo-shadow disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>SENDING BRIEF...</span>
                      </>
                    ) : (
                      <>
                        <span>SEND PROJECT INQUIRY</span>
                        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                  <span className="text-xs font-mono text-[#171717]/65">
                    No spam. Direct studio response.
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
