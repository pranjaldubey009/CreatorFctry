import { motion } from 'motion/react';
import type { SiteSettings } from '../types/studio';

interface AboutSectionProps {
  settings: SiteSettings;
}

export function AboutSection({ settings }: AboutSectionProps) {
  const paragraphs = settings.about_body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section
      id="about"
      className="border-b-2 border-[#171717] bg-[#F3F0E8] py-16 md:py-24 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Grayscale Studio Visual + Neo-Brutalist Framing */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative"
          >
            {/* Offset Burnt Orange Geometric Plate */}
            <div
              className="absolute -top-3 -left-3 sm:-top-5 sm:-left-5 w-full h-full bg-[#D46B45] border-2 border-[#171717] pointer-events-none"
              aria-hidden="true"
            />
            <div className="relative border-2 border-[#171717] bg-[#171717] overflow-hidden">
              <img
                src="/src/assets/images/studio_creative_desk_1795253941621.jpg"
                alt="CreatorFctry creative production workspace with cinema camera and storyboards"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full aspect-[4/3] object-cover grayscale contrast-125"
              />
              <div className="border-t-2 border-[#171717] bg-[#171717] text-[#F3F0E8] px-5 py-3.5 flex items-center justify-between gap-4">
                <span className="font-mono text-xs uppercase tracking-widest">
                  ONE CREATIVE DIRECTION
                </span>
                <span className="font-serif italic text-sm text-[#D46B45]">
                  Every format aligned
                </span>
              </div>
            </div>
            {/* Electric Blue Corner Anchor */}
            <div
              className="hidden sm:block absolute -bottom-4 -right-4 w-12 h-12 bg-[#315BFF] border-2 border-[#171717] pointer-events-none"
              aria-hidden="true"
            />
          </motion.div>

          {/* Right Editorial Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#315BFF]">
                THE STUDIO
              </span>
              <span className="h-[1.5px] w-16 bg-[#171717]" aria-hidden="true" />
            </div>

            <h2 className="font-display font-bold uppercase text-5xl sm:text-6xl md:text-[68px] tracking-[-0.02em] leading-[0.92] text-[#171717] text-balance">
              {settings.about_headline}
            </h2>

            <p className="font-serif italic text-xl sm:text-2xl text-[#D46B45] leading-snug pt-1">
              Focused craft, cohesive systems, zero agency bloat.
            </p>

            <div className="space-y-4 text-base sm:text-lg text-[#171717]/85 leading-relaxed font-medium">
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="pt-4 border-t-2 border-[#171717] grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-[#171717]/60">
                  CORE FOCUS
                </div>
                <div className="text-sm font-extrabold text-[#171717] mt-1">
                  Brands, Founders &amp; Creators
                </div>
              </div>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-[#171717]/60">
                  FORMAT SYSTEM
                </div>
                <div className="text-sm font-extrabold text-[#171717] mt-1">
                  5 Disciplines · 1 Direction
                </div>
              </div>
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-[#171717]/60">
                  MODEL
                </div>
                <div className="text-sm font-extrabold text-[#171717] mt-1">
                  Direct Studio Collaboration
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
