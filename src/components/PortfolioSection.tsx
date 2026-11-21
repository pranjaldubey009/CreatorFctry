import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Image as ImageIcon } from 'lucide-react';
import type { ProjectCategory, ProjectItem } from '../types/studio';

interface PortfolioSectionProps {
  projects: ProjectItem[];
  onOpenProject: (slug: string) => void;
}

const CATEGORIES: Array<'All' | ProjectCategory> = [
  'All',
  'LinkedIn',
  'UGC',
  'Reels',
  'Carousels',
  'Thumbnails',
];

export function PortfolioSection({
  projects,
  onOpenProject,
}: PortfolioSectionProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | ProjectCategory>('All');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'All') return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  return (
    <section
      id="work"
      className="border-b-2 border-[#171717] bg-[#F3F0E8] py-16 md:py-24"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Header + Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b-2 border-[#171717]">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#315BFF] mb-3">
              PORTFOLIO &amp; FORMAT SHOWCASE
            </div>
            <h2 className="font-display font-bold uppercase text-5xl sm:text-6xl md:text-7xl tracking-[-0.02em] leading-[0.9] text-[#171717]">
              MADE TO STAND OUT.
            </h2>
          </div>

          {/* Interactive Category Filter Buttons */}
          <div
            role="tablist"
            aria-label="Filter projects by format"
            className="flex flex-wrap items-center gap-2"
          >
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider border-2 border-[#171717] whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#171717] text-[#F3F0E8] neo-shadow-sm'
                      : 'bg-[#F3F0E8] text-[#171717] hover:bg-[#315BFF] hover:text-white'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-[#171717]/40 mt-10 bg-white/40 px-6">
            <p className="font-display text-2xl uppercase text-[#171717]">
              No published works in {activeCategory} yet
            </p>
            <p className="text-sm text-[#171717]/75 mt-2">
              Select another format category or publish projects from the studio admin.
            </p>
            {activeCategory !== 'All' && (
              <button
                type="button"
                onClick={() => setActiveCategory('All')}
                className="mt-5 inline-flex items-center gap-2 border-2 border-[#171717] bg-[#171717] text-[#F3F0E8] px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Show All Work
              </button>
            )}
          </div>
        ) : (
          <motion.div
            layout
            className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => {
                const imgFailed = failedImages[project.id] || !project.image_url;

                return (
                  <motion.article
                    layout
                    key={project.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{
                      duration: 0.28,
                      delay: Math.min(index * 0.04, 0.16),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`group border-2 border-[#171717] bg-[#F3F0E8] flex flex-col neo-shadow hover:-translate-y-1 transition-transform duration-200 ${
                      index === 0 && activeCategory === 'All'
                        ? 'md:col-span-2 lg:col-span-2'
                        : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenProject(project.slug)}
                      className="text-left flex flex-col flex-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#315BFF] focus-visible:outline-offset-2"
                    >
                      {/* Image Preview */}
                      <div
                        className={`relative w-full overflow-hidden border-b-2 border-[#171717] bg-[#171717] ${
                          index === 0 && activeCategory === 'All'
                            ? 'aspect-[16/9]'
                            : 'aspect-[4/3]'
                        }`}
                      >
                        {!imgFailed ? (
                          <img
                            src={project.image_url}
                            alt={project.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onError={() =>
                              setFailedImages((prev) => ({
                                ...prev,
                                [project.id]: true,
                              }))
                            }
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-[#F3F0E8] bg-gradient-to-br from-[#171717] to-[#2c2c2c]">
                            <ImageIcon className="w-10 h-10 text-[#D46B45] mb-3" />
                            <span className="font-display text-2xl uppercase text-center">
                              {project.title}
                            </span>
                          </div>
                        )}

                        {project.is_concept && (
                          <div className="absolute top-3 left-3 bg-[#171717] text-[#F3F0E8] border border-[#F3F0E8]/40 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                            CONCEPT PROJECT
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                        <div>
                          <div className="flex items-center justify-between gap-3 text-xs font-mono uppercase tracking-wider text-[#171717]/70 mb-2.5">
                            <span className="font-bold text-[#315BFF]">
                              {project.category}
                            </span>
                            {project.is_concept && <span>STUDIO CONCEPT</span>}
                          </div>

                          <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight leading-[0.98] text-[#171717] group-hover:text-[#315BFF] transition-colors">
                            {project.title}
                          </h3>

                          <p className="mt-3 text-sm text-[#171717]/80 leading-relaxed line-clamp-3">
                            {project.short_summary || project.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-[#171717]/20 flex items-center justify-between gap-4">
                          <div className="text-xs font-medium text-[#171717]/70 truncate">
                            {project.tags.slice(0, 3).join(' · ')}
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#171717] group-hover:text-[#D46B45] whitespace-nowrap shrink-0">
                            <span>VIEW</span>
                            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </button>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}
