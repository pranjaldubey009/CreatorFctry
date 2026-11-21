import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'What services does CreatorFctry offer?',
    answer:
      'CreatorFctry produces five core content formats under one creative direction: LinkedIn Personal Branding (strategy, ghostwriting, and positioning), UGC Content, Reels & Short-Form Video editing, Carousel Design, and YouTube Thumbnails.',
  },
  {
    question: 'Who do you work with?',
    answer:
      'We partner with founders, executives, independent creators, and modern consumer or B2B brands that want consistent, cohesive content across formats without coordinating multiple disconnected freelancers.',
  },
  {
    question: 'How does the process work?',
    answer:
      'Every engagement moves through four clear stages: Brief (aligning on voice, audience, and goals), Strategy (planning formats and hooks), Create (writing, designing, and editing assets), and Deliver (exporting ready-to-publish files with structured revision rounds).',
  },
  {
    question: 'Do you offer monthly packages?',
    answer:
      'Yes. We offer both focused single-format retainers and multi-format monthly studio packages (such as Starter, Growth, and Personal Brand), as well as custom project scopes tailored to your publishing cadence.',
  },
  {
    question: 'How long does a project take?',
    answer:
      'Turnaround depends on format and volume. Initial strategy and visual direction typically begin within days of kickoff, with single assets or sprint batches delivered on an agreed weekly schedule.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Submit a quick project inquiry using the form below or email creatorfctry@gmail.com with the formats you are looking for. We review every brief directly and reply with next steps and a tailored scope.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="border-b-2 border-[#171717] bg-[#F3F0E8] py-16 md:py-24"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-4">
            <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#D46B45] mb-3">
              COMMON QUESTIONS
            </div>
            <h2 className="font-display font-bold uppercase text-5xl sm:text-6xl tracking-[-0.02em] leading-[0.92] text-[#171717]">
              STUDIO FAQ.
            </h2>
            <p className="mt-4 text-base font-medium text-[#171717]/80 leading-relaxed">
              Clear answers on formats, workflow, monthly retainers, and starting a project with CreatorFctry.
            </p>
          </div>

          <div className="lg:col-span-8 border-t-2 border-[#171717]">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={item.question} className="border-b-2 border-[#171717]">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full py-5 sm:py-6 flex items-center justify-between gap-6 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-[#315BFF] focus-visible:outline-offset-2"
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="font-mono text-xs font-bold text-[#315BFF] tabular-nums">
                        0{idx + 1}
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-[#171717] group-hover:text-[#315BFF] transition-colors">
                        {item.question}
                      </span>
                    </div>
                    <span
                      className={`w-9 h-9 border-2 border-[#171717] flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-[#171717] text-[#F3F0E8]'
                          : 'bg-[#F3F0E8] text-[#171717] group-hover:bg-[#315BFF] group-hover:text-white'
                      }`}
                    >
                      {isOpen ? (
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      )}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pl-8 sm:pl-9 pr-12 text-base text-[#171717]/80 leading-relaxed">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
