import { Link } from "react-router-dom";
import { TOOLS, CATEGORIES, TOOLS_BY_SLUG, type ToolCategory } from "./tools/registry";
import { useFavorites, useRecent } from "./Layout";
import { Lock, Sparkles, ArrowRight, Star, Clock, Shield } from "lucide-react";
import { cn } from "./utils/cn";

function CategorySection({
  category,
  isFav,
  toggle,
}: {
  category: ToolCategory;
  isFav: (s: string) => boolean;
  toggle: (s: string) => void;
}) {
  const items = TOOLS.filter((t) => t.category === category);
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight">{category}</h2>
        <span className="text-xs text-[#91887D]">{items.length} tools</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((t) => (
          <Link
            key={t.slug}
            to={t.path}
            className="group relative block bg-[#191715] border border-[#342821] rounded-xl p-5 hover:border-[#C96B4B]/50 hover:bg-[#25211D]/60 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#25211D] border border-[#342821] flex items-center justify-center text-[#C96B4B] group-hover:bg-[#C96B4B]/10 transition-colors">
                {t.icon}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggle(t.slug);
                }}
                aria-label={isFav(t.slug) ? "Remove from favorites" : "Add to favorites"}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  isFav(t.slug)
                    ? "text-[#C96B4B]"
                    : "text-[#91887D] opacity-0 group-hover:opacity-100 hover:text-[#E8E1D5]"
                )}
              >
                <Star className={cn("w-4 h-4", isFav(t.slug) && "fill-current")} />
              </button>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#E8E1D5]">{t.name}</h3>
            <p className="mt-1 text-xs text-[#91887D] line-clamp-2">{t.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400/90">
                <Lock className="w-3 h-3" /> Local
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#C96B4B] opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { isFav, toggle } = useFavorites();
  const { recent } = useRecent();

  return (
    <div className="fade-in">
      {/* HERO */}
      <section className="relative py-12 md:py-20">
        {/* Subtle background accent */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#C96B4B]/5 blur-3xl" />
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#191715] border border-[#342821] text-xs text-[#91887D] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#C96B4B]" />
            <span>Free tools. Private by design.</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter bg-gradient-to-b from-[#E8E1D5] to-[#91887D] bg-clip-text text-transparent">
            XEVIO
          </h1>
          <p className="mt-5 text-2xl md:text-3xl font-medium text-[#E8E1D5] max-w-2xl">
            Free tools.
            <br />
            <span className="text-[#C96B4B]">Private by design.</span>
          </p>
          <p className="mt-4 text-sm md:text-base text-[#91887D] max-w-xl">
            PDF, image, text and utility tools that work directly in your browser.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href="#tools" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C96B4B] hover:bg-[#E0805C] rounded-lg font-medium text-sm transition-colors">
              Explore Tools <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/privacy"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#342821] hover:border-[#C96B4B]/40 hover:bg-[#191715] rounded-lg font-medium text-sm transition-colors"
            >
              <Shield className="w-4 h-4" /> How privacy works
            </Link>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-[#191715] border border-[#342821] rounded-full text-sm">
            <Lock className="w-4 h-4 text-[#C96B4B]" />
            <span className="text-[#E8E1D5]">Your files stay on your device</span>
          </div>
        </div>
      </section>

      {/* STATS / FEATURES */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
        {[
          { label: "Tools", value: `${TOOLS.length}` },
          { label: "Categories", value: `${CATEGORIES.length}` },
          { label: "No signup", value: "Required" },
          { label: "Files", value: "Never uploaded" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#191715] border border-[#342821] rounded-xl p-4 text-center"
          >
            <div className="text-2xl font-semibold text-[#E8E1D5]">{s.value}</div>
            <div className="text-xs text-[#91887D] mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* RECENT TOOLS */}
      {recent.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#C96B4B]" />
            <h2 className="text-lg font-semibold tracking-tight">Recently used</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recent.map((slug) => {
              const t = TOOLS_BY_SLUG[slug];
              if (!t) return null;
              return (
                <Link
                  key={slug}
                  to={t.path}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-[#191715] border border-[#342821] hover:border-[#C96B4B]/40 rounded-lg text-sm"
                >
                  <span className="text-[#C96B4B]">{t.icon}</span>
                  <span>{t.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* TOOLS BY CATEGORY */}
      <div id="tools" className="space-y-12 scroll-mt-8">
        {CATEGORIES.map((cat) => (
          <CategorySection key={cat} category={cat} isFav={isFav} toggle={toggle} />
        ))}
      </div>

      {/* PRIVACY CALLOUT */}
      <section className="mt-16 mb-8 bg-gradient-to-br from-[#191715] to-[#11100F] border border-[#342821] rounded-2xl p-8 md:p-10">
        <div className="flex items-center gap-2 mb-3 text-[#C96B4B]">
          <Lock className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Privacy</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight max-w-2xl">
          Your files never leave your device.
        </h2>
        <p className="mt-3 text-[#91887D] max-w-2xl">
          Xevio is designed to process files locally in your browser whenever
          possible. No account required. No cloud storage. Just open a tool and
          get to work.
        </p>
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            "No uploads to servers",
            "No account required",
            "Everything in your browser",
          ].map((t) => (
            <li
              key={t}
              className="flex items-center gap-2 text-sm text-[#E8E1D5] bg-[#11100F] border border-[#342821] rounded-lg px-3 py-2"
            >
              <div className="w-4 h-4 rounded-full bg-[#C96B4B]/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C96B4B]" />
              </div>
              {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
