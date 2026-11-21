import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

interface NavbarProps {
  brandName?: string;
  onNavigateHome: (hash?: string) => void;
  onStartProject: () => void;
}

const NAV_ITEMS = [
  { label: 'Work', hash: '#work' },
  { label: 'Services', hash: '#services' },
  { label: 'About', hash: '#about' },
  { label: 'Process', hash: '#process' },
  { label: 'Contact', hash: '#contact' },
];

export function Navbar({
  brandName = 'CREATORFCTRY',
  onNavigateHome,
  onStartProject,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const normalized = brandName.trim().toUpperCase();
  const hasSplitBrand = normalized === 'CREATORFCTRY';

  const handleLinkClick = (hash: string) => {
    setMobileOpen(false);
    onNavigateHome(hash);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F3F0E8]/95 backdrop-blur-sm border-b-2 border-[#171717]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-16 md:h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setMobileOpen(false);
            onNavigateHome();
          }}
          className="font-display text-2xl sm:text-[28px] font-bold tracking-tight leading-none whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#315BFF] focus-visible:outline-offset-4"
          aria-label="CreatorFctry Home"
        >
          {hasSplitBrand ? (
            <>
              <span className="text-[#171717]">CREATOR</span>
              <span className="text-[#D46B45]">FCTRY</span>
            </>
          ) : (
            <span className="text-[#171717]">{brandName}</span>
          )}
        </a>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 lg:gap-9 text-[15px] font-semibold text-[#171717]"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.hash}
              href={item.hash}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item.hash);
              }}
              className="relative py-1 whitespace-nowrap shrink-0 transition-colors hover:text-[#315BFF] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-[#315BFF] after:transition-all after:duration-200 hover:after:w-full focus-visible:outline-2 focus-visible:outline-[#315BFF] focus-visible:outline-offset-4"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action + Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onStartProject();
            }}
            className="hidden sm:inline-flex items-center gap-2 bg-[#315BFF] text-white border-2 border-[#171717] px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wider uppercase whitespace-nowrap shrink-0 neo-btn neo-shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-[#171717] focus-visible:outline-offset-2"
          >
            <span>START A PROJECT</span>
            <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 border-2 border-[#171717] bg-[#F3F0E8] text-[#171717] hover:bg-[#171717] hover:text-[#F3F0E8] transition-colors cursor-pointer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t-2 border-[#171717] bg-[#F3F0E8] px-4 py-6"
          >
            <nav aria-label="Mobile" className="flex flex-col divide-y-2 divide-[#171717]/15">
              {NAV_ITEMS.map((item, idx) => (
                <a
                  key={item.hash}
                  href={item.hash}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(item.hash);
                  }}
                  className="flex items-center justify-between py-4 text-xl font-bold text-[#171717] hover:text-[#315BFF] transition-colors"
                >
                  <span>{item.label}</span>
                  <span className="font-mono text-xs text-[#171717]/60">0{idx + 1}</span>
                </a>
              ))}
            </nav>
            <div className="pt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onStartProject();
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#315BFF] text-white border-2 border-[#171717] px-5 py-3.5 text-sm font-bold tracking-wider uppercase neo-shadow-sm cursor-pointer"
              >
                <span>START A PROJECT</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
