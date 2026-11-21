import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { studioApi } from '../lib/api';
import type { ProjectItem } from '../types/studio';

interface ProjectDetailPageProps {
  slug: string;
  initialProjects: ProjectItem[];
  onBackToWork: () => void;
  onOpenProject: (slug: string) => void;
  onStartProjectForCategory: (category: string) => void;
}

export function ProjectDetailPage({
  slug,
  initialProjects,
  onBackToWork,
  onOpenProject,
  onStartProjectForCategory,
}: ProjectDetailPageProps) {
  const cached = initialProjects.find((p) => p.slug === slug) || null;
  const [project, setProject] = useState<ProjectItem | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setImgFailed(false);
    const localMatch = initialProjects.find((p) => p.slug === slug);
    if (localMatch) {
      setProject(localMatch);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    studioApi
      .getProjectBySlug(slug)
      .then((res) => setProject(res))
      .catch((err) => setError(err instanceof Error ? err.message : 'Project not found.'))
      .finally(() => setLoading(false));
  }, [slug, initialProjects]);

  const related = initialProjects
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  if (loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-16">
        <div className="border-2 border-[#171717] bg-white/40 p-12 animate-pulse">
          <div className="h-8 w-48 bg-[#171717]/15 mb-6" />
          <div className="h-16 w-2/3 bg-[#171717]/15 mb-8" />
          <div className="aspect-[16/9] bg-[#171717]/10" />
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-20">
        <div className="border-2 border-[#171717] bg-[#F3F0E8] p-10 neo-shadow max-w-xl">
          <h1 className="font-display text-4xl uppercase text-[#171717]">
            Project Unavailable
          </h1>
          <p className="mt-3 text-base text-[#171717]/80">
            {error || 'This project could not be found or is currently unpublished.'}
          </p>
          <button
            type="button"
            onClick={onBackToWork}
            className="mt-6 inline-flex items-center gap-2 bg-[#171717] text-[#F3F0E8] px-5 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portfolio</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F3F0E8] border-b-2 border-[#171717]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 md:py-16">
        {/* Top Breadcrumb */}
        <button
          type="button"
          onClick={onBackToWork}
          className="inline-flex items-center gap-2 border-2 border-[#171717] bg-[#F3F0E8] px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#171717] hover:text-[#F3F0E8] transition-colors cursor-pointer mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO ALL WORK</span>
        </button>

        {/* Header Meta & Title */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b-2 border-[#171717]">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-widest mb-4">
              <span className="font-bold text-[#315BFF]">{project.category}</span>
              {project.is_concept && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="bg-[#171717] text-[#F3F0E8] px-2.5 py-0.5 font-bold">
                    CONCEPT PROJECT
                  </span>
                </>
              )}
            </div>

            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold uppercase tracking-[-0.02em] leading-[0.92] text-[#171717] text-balance">
              {project.title}
            </h1>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end gap-4">
            <p className="text-base font-medium text-[#171717]/85 leading-relaxed">
              {project.short_summary}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onStartProjectForCategory(project.category)}
                className="inline-flex items-center gap-2 bg-[#315BFF] text-white border-2 border-[#171717] px-5 py-3 text-xs font-bold uppercase tracking-wider neo-btn neo-shadow-sm cursor-pointer"
              >
                <span>REQUEST THIS FORMAT</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              {project.external_url && (
                <a
                  href={project.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#F3F0E8] text-[#171717] border-2 border-[#171717] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#171717] hover:text-[#F3F0E8] transition-colors"
                >
                  <span>LIVE LINK</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Visual Showcase Frame */}
        <div className="my-10 border-2 border-[#171717] bg-[#171717] neo-shadow-lg overflow-hidden">
          {!imgFailed && project.image_url ? (
            <img
              src={project.image_url}
              alt={project.title}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full max-h-[680px] object-cover"
            />
          ) : (
            <div className="aspect-[16/9] flex flex-col items-center justify-center text-[#F3F0E8] p-12">
              <ImageIcon className="w-12 h-12 text-[#D46B45] mb-3" />
              <span className="font-display text-3xl uppercase">{project.title}</span>
            </div>
          )}
        </div>

        {/* Description & Deliverables Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-6">
          <div className="lg:col-span-8">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#D46B45] mb-4">
              CREATIVE DIRECTION &amp; EXECUTION
            </h2>
            <div className="text-base sm:text-lg leading-relaxed text-[#171717]/90 whitespace-pre-line">
              {project.description}
            </div>
          </div>

          <aside className="lg:col-span-4 border-2 border-[#171717] bg-white/50 p-6 h-fit">
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#171717] border-b-2 border-[#171717] pb-3 mb-4">
              PROJECT DETAILS
            </h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-mono text-[11px] uppercase text-[#171717]/60">
                  FORMAT
                </dt>
                <dd className="font-bold text-[#171717] mt-0.5">{project.category}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase text-[#171717]/60">
                  CLASSIFICATION
                </dt>
                <dd className="font-bold text-[#171717] mt-0.5">
                  {project.is_concept ? 'Concept Project' : 'Studio Production'}
                </dd>
              </div>
              {project.tags.length > 0 && (
                <div>
                  <dt className="font-mono text-[11px] uppercase text-[#171717]/60">
                    FOCUS AREAS
                  </dt>
                  <dd className="font-medium text-[#171717] mt-1">
                    {project.tags.join(' · ')}
                  </dd>
                </div>
              )}
            </dl>
          </aside>
        </div>

        {/* More Works */}
        {related.length > 0 && (
          <div className="mt-14 pt-12 border-t-2 border-[#171717]">
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[#171717] mb-8">
              MORE STUDIO WORK
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenProject(item.slug)}
                  className="text-left border-2 border-[#171717] bg-[#F3F0E8] p-5 neo-shadow-sm hover:bg-[#171717] hover:text-[#F3F0E8] transition-colors cursor-pointer group"
                >
                  <div className="font-mono text-xs uppercase text-[#315BFF] group-hover:text-[#D46B45] mb-2">
                    {item.category}
                  </div>
                  <div className="font-display text-2xl uppercase leading-tight">
                    {item.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
