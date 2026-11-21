import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  ArrowUpRight,
  Layers,
  Linkedin,
  Play,
  Video,
  Youtube,
} from 'lucide-react';
import type { SiteSettings } from '../types/studio';

interface HeroSectionProps {
  settings: SiteSettings;
  onExploreWork: () => void;
  onStartProject: () => void;
  onSelectServiceTile: (shortLabel: string) => void;
}

const FORMAT_TILES = [
  {
    key: 'LinkedIn',
    title: 'LinkedIn',
    subtitle: 'Personal Branding',
    icon: Linkedin,
  },
  {
    key: 'UGC',
    title: 'UGC',
    subtitle: 'Content',
    icon: Video,
  },
  {
    key: 'Reels',
    title: 'Reels',
    subtitle: 'Short-Form Video',
    icon: Play,
  },
  {
    key: 'Carousels',
    title: 'Carousels',
    subtitle: 'Design',
    icon: Layers,
  },
  {
    key: 'Thumbnails',
    title: 'Thumbnails',
    subtitle: 'YouTube',
    icon: Youtube,
  },
];

export function HeroSection({
  settings,
  onExploreWork,
  onStartProject,
  onSelectServiceTile,
}: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const sculptureY = useTransform(scrollYProgress, [0, 1], [0, 28]);
  const wedgeY = useTransform(scrollYProgress, [0, 1], [0, -18]);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden border-b-2 border-[#171717] bg-[#F3F0E8]"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pt-10 pb-8 md:pt-14 md:pb-10 lg:pt-16 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-stretch">
          {/* Left Typographic Anchor */}
          <div className="lg:col-span-7 flex flex-col justify-center z-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 mb-5 md:mb-7"
            >
              <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-[#171717] uppercase whitespace-nowrap">
                {settings.hero_kicker}
              </span>
              <span className="h-[1.5px] flex-1 max-w-[160px] bg-[#171717]" aria-hidden="true" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-bold uppercase tracking-[-0.03em] leading-[0.88] text-[64px] sm:text-[96px] md:text-[116px] xl:text-[134px] text-balance"
            >
              <span className="block text-[#171717]">
                {settings.hero_headline_line1}
              </span>
              <span className="block text-[#315BFF]">
                {settings.hero_headline_line2}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 md:mt-8 text-lg sm:text-xl md:text-[22px] font-medium text-[#171717]/90 max-w-xl leading-snug"
            >
              {settings.hero_subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 md:mt-10 flex flex-wrap items-center gap-4"
            >
              <button
                type="button"
                onClick={onExploreWork}
                className="inline-flex items-center gap-2.5 bg-[#D46B45] text-white border-2 border-[#171717] px-6 sm:px-7 py-3.5 text-xs sm:text-sm font-bold tracking-wider uppercase whitespace-nowrap shrink-0 neo-btn neo-shadow cursor-pointer focus-visible:outline-2 focus-visible:outline-[#315BFF] focus-visible:outline-offset-2"
              >
                <span>EXPLORE OUR WORK</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onStartProject}
                className="inline-flex items-center gap-2.5 bg-[#F3F0E8] text-[#171717] border-2 border-[#171717] px-6 sm:px-7 py-3.5 text-xs sm:text-sm font-bold tracking-wider uppercase whitespace-nowrap shrink-0 neo-btn neo-shadow cursor-pointer hover:bg-[#171717] hover:text-[#F3F0E8] focus-visible:outline-2 focus-visible:outline-[#315BFF] focus-visible:outline-offset-2"
              >
                <span>START A PROJECT</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </motion.div>
          </div>

          {/* Right Art-Directed Neo-Brutalist Composition */}
          <div className="lg:col-span-5 relative min-h-[380px] sm:min-h-[460px] lg:min-h-[500px] flex items-end justify-center select-none">
            {/* Architectural Crop Marks */}
            <div
              className="hidden sm:block absolute top-3 left-2 w-7 h-7 border-t-2 border-l-2 border-[#171717]/80 pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="hidden sm:block absolute bottom-8 left-2 w-7 h-7 border-b-2 border-l-2 border-[#171717]/80 pointer-events-none"
              aria-hidden="true"
            />

            {/* Checker Geometric Squares (Top Right) */}
            <div
              className="absolute top-2 right-0 grid grid-cols-2 w-12 h-12 pointer-events-none z-20"
              aria-hidden="true"
            >
              <span className="col-start-2 bg-[#171717] w-6 h-6" />
              <span className="col-start-1 row-start-2 bg-[#171717] w-6 h-6" />
            </div>

            {/* Precision Arc Hairline */}
            <svg
              viewBox="0 0 220 220"
              className="absolute right-0 top-1/2 -translate-y-1/2 w-52 h-52 pointer-events-none z-0 opacity-85"
              aria-hidden="true"
            >
              <path
                d="M 110 12 A 98 98 0 0 1 180 180"
                fill="none"
                stroke="#171717"
                strokeWidth="1.5"
              />
            </svg>

            {/* Burnt Orange Geometric Polygon */}
            <motion.div
              style={{ y: wedgeY }}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-4 sm:inset-x-8 top-4 bottom-0 z-0 pointer-events-none"
              aria-hidden="true"
            >
              <svg viewBox="0 0 420 460" className="w-full h-full overflow-visible">
                <polygon
                  points="95,18 405,34 335,455 15,455"
                  fill="#D46B45"
                />
                {/* Lower Charcoal Angular Texture Block */}
                <polygon
                  points="0,415 415,355 415,460 0,460"
                  fill="#171717"
                />
              </svg>
            </motion.div>

            {/* Grayscale Classical Sculpture + Electric Blue Brushstroke Overlay */}
            <motion.div
              style={{ y: sculptureY }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-[290px] sm:w-[340px] lg:w-[360px] h-[380px] sm:h-[440px] lg:h-[470px] flex items-end justify-center"
            >
              <img
                src="/src/assets/images/hero_classical_bust_1795253941534.jpg"
                alt="Classical marble bust artwork representing CreatorFctry editorial direction"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain object-bottom grayscale contrast-125 mix-blend-multiply drop-shadow-[0_12px_20px_rgba(0,0,0,0.22)]"
              />
              {/* Electric Blue Painterly Eye-Slash Stroke */}
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                viewBox="0 0 280 120"
                className="absolute top-[25%] left-[12%] w-[78%] pointer-events-none z-20 -rotate-12"
                aria-hidden="true"
              >
                <path
                  d="M12,72 L54,54 L66,64 L125,36 L142,46 L212,18 L248,26 L264,14 L252,42 L195,58 L164,74 L112,86 L72,98 L34,104 L8,88 Z"
                  fill="#315BFF"
                />
                <path
                  d="M28,84 L235,28"
                  stroke="#171717"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                  opacity="0.35"
                />
              </motion.svg>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom 5-Column Studio Format Strip */}
      <div className="border-t-2 border-[#171717] bg-[#F3F0E8]">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y-2 lg:divide-y-0 sm:divide-x-2 divide-[#171717]">
          {FORMAT_TILES.map((tile, idx) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => onSelectServiceTile(tile.key)}
                className={`group flex items-center gap-3.5 px-5 py-4 sm:py-5 text-left transition-colors hover:bg-[#171717] hover:text-[#F3F0E8] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#315BFF] focus-visible:outline-inset ${
                  idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                }`}
              >
                <span className="inline-flex items-center justify-center w-10 h-10 border-2 border-[#171717] bg-[#171717] text-[#F3F0E8] group-hover:bg-[#315BFF] group-hover:border-[#F3F0E8] transition-colors shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-extrabold tracking-tight leading-tight truncate">
                    {tile.title}
                  </div>
                  <div className="text-xs font-medium opacity-75 truncate">
                    {tile.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
