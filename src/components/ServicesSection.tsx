import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Film,
  Layers,
  Linkedin,
  Play,
  Video,
  Youtube,
} from 'lucide-react';
import type { ServiceItem } from '../types/studio';

interface ServicesSectionProps {
  services: ServiceItem[];
  highlightedSlug?: string | null;
  onInquireService: (serviceTitle: string) => void;
}

function ServiceMockup({ type }: { type: ServiceItem['mockup_type'] }) {
  const [carouselSlide, setCarouselSlide] = useState(0);
  const slides = [
    {
      kicker: 'SLIDE 01 / 05',
      headline: 'IDEAS NEED STRUCTURE BEFORE SCALE.',
      accent: '#315BFF',
    },
    {
      kicker: 'SLIDE 02 / 05',
      headline: 'ONE VISUAL SYSTEM ACROSS EVERY POST.',
      accent: '#D46B45',
    },
    {
      kicker: 'SLIDE 03 / 05',
      headline: 'DESIGN FOR MOBILE THUMB STOPS.',
      accent: '#171717',
    },
  ];

  if (type === 'linkedin') {
    return (
      <div className="border-2 border-[#171717] bg-[#F3F0E8] p-5 neo-shadow-sm">
        <div className="flex items-center justify-between border-b-2 border-[#171717] pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#171717] text-[#F3F0E8] flex items-center justify-center font-display font-bold text-lg">
              CF
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#171717] leading-tight">
                Founder Editorial Voice
              </div>
              <div className="text-xs font-mono text-[#171717]/70">
                Positioning · Ghostwriting · Cadence
              </div>
            </div>
          </div>
          <Linkedin className="w-5 h-5 text-[#315BFF]" aria-hidden="true" />
        </div>
        <div className="space-y-2.5 text-sm font-medium text-[#171717]">
          <p className="font-bold text-base leading-snug">
            Most founders don&apos;t lack ideas. They lack a repeatable editorial system.
          </p>
          <p className="text-xs text-[#171717]/75 leading-relaxed">
            Weekly narrative hooks, clear point-of-view essays, and cohesive visual posts crafted in your authentic voice.
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-[#171717]/20 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#171717]/70">
          <span>FORMAT: THOUGHT LEADERSHIP</span>
          <span className="text-[#315BFF] font-semibold">WEEKLY CADENCE</span>
        </div>
      </div>
    );
  }

  if (type === 'ugc') {
    return (
      <div className="border-2 border-[#171717] bg-[#171717] text-[#F3F0E8] p-4 neo-shadow-sm">
        <div className="grid grid-cols-12 gap-3 items-stretch">
          <div className="col-span-5 relative aspect-[9/14] border-2 border-[#F3F0E8]/30 overflow-hidden bg-[#242424]">
            <img
              src="/src/assets/images/project_ugc_studio_1795253942246.jpg"
              alt="UGC vertical creator production preview"
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full h-full object-cover grayscale contrast-125"
            />
            <div className="absolute top-2 left-2 bg-[#D46B45] text-white font-mono text-[10px] font-bold px-1.5 py-0.5">
              9:16
            </div>
          </div>
          <div className="col-span-7 flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center gap-2 text-[#D46B45] font-mono text-[11px] uppercase tracking-wider mb-2">
                <Video className="w-3.5 h-3.5" aria-hidden="true" />
                <span>CREATOR CAPTURE</span>
              </div>
              <div className="font-display text-2xl uppercase leading-[0.95] tracking-tight">
                NATIVE HOOKS BUILT FOR TRUST.
              </div>
            </div>
            <div className="space-y-2 border-t border-[#F3F0E8]/20 pt-3 mt-4 font-mono text-[11px] text-[#F3F0E8]/80">
              <div className="flex justify-between">
                <span>01 · 3S VISUAL HOOK</span>
                <span className="text-[#D46B45]">SCRIPTED</span>
              </div>
              <div className="flex justify-between">
                <span>02 · PRODUCT DEMO</span>
                <span className="text-[#315BFF]">HANDS-ON</span>
              </div>
              <div className="flex justify-between">
                <span>03 · MODULAR CUTS</span>
                <span>ORGANIC + PAID</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'reels') {
    return (
      <div className="border-2 border-[#171717] bg-[#171717] text-[#F3F0E8] p-5 neo-shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#315BFF]">
            <Film className="w-4 h-4" aria-hidden="true" />
            <span>TIMELINE SEQUENCE</span>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#F3F0E8]/80">
            <Play className="w-3.5 h-3.5 fill-current text-[#D46B45]" aria-hidden="true" />
            00:34:12
          </span>
        </div>
        <div className="relative h-28 border border-[#F3F0E8]/25 overflow-hidden mb-4">
          <img
            src="/src/assets/images/project_reels_motion_1795253941896.jpg"
            alt="Short-form reel motion timeline frame"
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171717]/80 via-transparent to-[#171717]/60 flex items-center px-4">
            <span className="font-display text-2xl uppercase tracking-tight text-white">
              PACING · CAPTIONS · SOUND
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="grid grid-cols-12 gap-1 h-4">
            <div className="col-span-3 bg-[#315BFF]" />
            <div className="col-span-4 bg-[#D46B45]" />
            <div className="col-span-2 bg-[#F3F0E8]" />
            <div className="col-span-3 bg-[#315BFF]/70" />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-[#F3F0E8]/60 uppercase">
            <span>HOOK CUT</span>
            <span>B-ROLL + MOTION TYPE</span>
            <span>CTA</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'carousels') {
    const active = slides[carouselSlide];
    return (
      <div className="border-2 border-[#171717] bg-[#F3F0E8] p-4 neo-shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#D46B45]" aria-hidden="true" />
            <span>INTERACTIVE SLIDE PREVIEW</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setCarouselSlide((s) => (s - 1 + slides.length) % slides.length)
              }
              className="w-8 h-8 border-2 border-[#171717] flex items-center justify-center hover:bg-[#171717] hover:text-[#F3F0E8] transition-colors cursor-pointer"
              aria-label="Previous carousel slide"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCarouselSlide((s) => (s + 1) % slides.length)}
              className="w-8 h-8 border-2 border-[#171717] flex items-center justify-center hover:bg-[#171717] hover:text-[#F3F0E8] transition-colors cursor-pointer"
              aria-label="Next carousel slide"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div
          className="border-2 border-[#171717] p-5 min-h-[150px] flex flex-col justify-between text-white transition-colors duration-200"
          style={{ backgroundColor: active.accent }}
        >
          <span className="font-mono text-[11px] tracking-widest opacity-85">
            {active.kicker}
          </span>
          <div className="font-display text-3xl uppercase leading-[0.94] tracking-tight my-3">
            {active.headline}
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] uppercase opacity-90">
            <span>CREATORFCTRY GRID</span>
            <span>SWIPE →</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#171717] bg-[#F3F0E8] p-4 neo-shadow-sm">
      <div className="relative aspect-video border-2 border-[#171717] overflow-hidden bg-[#171717]">
        <img
          src="/src/assets/images/project_youtube_thumb_1795253941534.jpg"
          alt="YouTube thumbnail composition preview"
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex flex-col justify-between p-3.5">
          <div className="flex items-center justify-between">
            <span className="bg-[#315BFF] text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase">
              1280 × 720
            </span>
            <Youtube className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="font-display text-2xl sm:text-3xl uppercase leading-none text-white tracking-tight">
              CLEAR CONCEPT. INSTANT READ.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServicesSection({
  services,
  highlightedSlug,
  onInquireService,
}: ServicesSectionProps) {
  return (
    <section
      id="services"
      className="border-b-2 border-[#171717] bg-[#F3F0E8] py-16 md:py-24"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b-2 border-[#171717]">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#D46B45] mb-3">
              STUDIO CAPABILITIES
            </div>
            <h2 className="font-display font-bold uppercase text-5xl sm:text-6xl md:text-7xl tracking-[-0.02em] leading-[0.9] text-[#171717]">
              WHAT WE MAKE.
            </h2>
          </div>
          <p className="text-base sm:text-lg font-medium text-[#171717]/80 max-w-md leading-relaxed">
            Five core content formats built under one creative roof so your brand reads and looks unmistakably cohesive everywhere.
          </p>
        </div>

        {/* Service Rows */}
        <div className="divide-y-2 divide-[#171717]">
          {services.map((service, index) => {
            const isHighlighted =
              highlightedSlug &&
              (service.slug.toLowerCase().includes(highlightedSlug.toLowerCase()) ||
                service.short_label.toLowerCase() === highlightedSlug.toLowerCase());

            return (
              <motion.article
                key={service.id}
                id={`service-${service.slug}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(index * 0.05, 0.2),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`py-10 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center transition-colors ${
                  isHighlighted ? 'bg-[#315BFF]/[0.06] -mx-4 px-4 sm:-mx-6 sm:px-6' : ''
                }`}
              >
                {/* Left Index & Copy */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-4xl sm:text-5xl font-bold text-[#315BFF] tabular-nums leading-none">
                      {service.number_label}
                    </span>
                    <span className="h-[2px] w-8 bg-[#171717] self-center" aria-hidden="true" />
                    <h3 className="font-display text-3xl sm:text-4xl md:text-[42px] font-bold uppercase tracking-tight leading-[0.95] text-[#171717]">
                      {service.title}
                    </h3>
                  </div>

                  <p className="text-base sm:text-lg text-[#171717]/85 max-w-2xl leading-relaxed font-medium">
                    {service.description}
                  </p>

                  {service.deliverables.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs sm:text-sm font-semibold text-[#171717]/80">
                      {service.deliverables.map((item, idx) => (
                        <span key={item} className="inline-flex items-center gap-2">
                          {idx > 0 && (
                            <span className="text-[#D46B45] font-bold" aria-hidden="true">
                              ·
                            </span>
                          )}
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onInquireService(service.title)}
                      className="inline-flex items-center gap-2 border-2 border-[#171717] bg-[#F3F0E8] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#171717] hover:bg-[#315BFF] hover:text-white transition-colors neo-shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <span>START WITH {service.short_label.toUpperCase()}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Right Bespoke Interactive Mockup */}
                <div className="lg:col-span-5">
                  <ServiceMockup type={service.mockup_type} />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
