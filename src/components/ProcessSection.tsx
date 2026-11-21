import { motion } from 'motion/react';

const PROCESS_STAGES = [
  {
    step: '01',
    title: 'BRIEF',
    accent: '#315BFF',
    description: 'Understand the brand, audience and objectives.',
    detail: 'We align on voice, positioning, visual references, and what success looks like for your channel.',
  },
  {
    step: '02',
    title: 'STRATEGY',
    accent: '#D46B45',
    description: "Plan content around the client's goals.",
    detail: 'We map formats, hooks, narrative pillars, and production cadence before a single asset is built.',
  },
  {
    step: '03',
    title: 'CREATE',
    accent: '#171717',
    description: 'Design, edit and produce content.',
    detail: 'Writing, editing, motion design, carousel architecture, and packaging crafted under one direction.',
  },
  {
    step: '04',
    title: 'DELIVER',
    accent: '#315BFF',
    description: 'Deliver ready-to-use content.',
    detail: 'Cleanly organized, platform-spec exports with structured review rounds so you can publish immediately.',
  },
];

export function ProcessSection() {
  return (
    <section
      id="process"
      className="border-b-2 border-[#171717] bg-[#171717] text-[#F3F0E8] py-16 md:py-24"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#F3F0E8]/25">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#D46B45] mb-3">
              HOW WE WORK
            </div>
            <h2 className="font-display font-bold uppercase text-5xl sm:text-6xl md:text-7xl tracking-[-0.02em] leading-[0.9] text-[#F3F0E8]">
              FROM IDEA TO IMPACT.
            </h2>
          </div>
          <p className="text-base sm:text-lg text-[#F3F0E8]/75 max-w-md leading-relaxed">
            A clear four-stage production workflow built for speed, consistency, and zero back-and-forth friction.
          </p>
        </div>

        {/* Connected 4-Stage Pipeline */}
        <div className="relative mt-12">
          {/* Horizontal Connecting Line (Desktop) */}
          <div
            className="hidden lg:block absolute top-8 left-0 right-0 h-[2px] bg-[#F3F0E8]/25"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {PROCESS_STAGES.map((stage, idx) => (
              <motion.div
                key={stage.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative flex flex-col"
              >
                {/* Step Marker Box */}
                <div className="relative z-10 flex items-center gap-4 mb-6">
                  <div
                    className="w-16 h-16 border-2 border-[#F3F0E8] flex items-center justify-center font-display text-3xl font-bold tabular-nums text-white shrink-0"
                    style={{ backgroundColor: stage.accent }}
                  >
                    {stage.step}
                  </div>
                  <div className="lg:hidden h-[2px] flex-1 bg-[#F3F0E8]/25" aria-hidden="true" />
                </div>

                {/* Stage Content Card */}
                <div className="border-2 border-[#F3F0E8]/30 bg-[#1f1f1f] p-6 flex-1 flex flex-col justify-between hover:border-[#315BFF] transition-colors">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-[#D46B45] mb-2">
                      STAGE {stage.step}
                    </div>
                    <h3 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[#F3F0E8]">
                      {stage.title}
                    </h3>
                    <p className="mt-3 text-base font-bold text-[#F3F0E8] leading-snug">
                      {stage.description}
                    </p>
                  </div>

                  <p className="mt-4 pt-4 border-t border-[#F3F0E8]/15 text-sm text-[#F3F0E8]/70 leading-relaxed">
                    {stage.detail}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
