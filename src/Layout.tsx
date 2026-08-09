import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { TOOLS, CATEGORIES, type ToolCategory } from "./tools/registry";
import { cn } from "./utils/cn";
import {
  Search,
  X,
  Menu,
  Star,
  Clock,
  Lock,
  Sparkles,
  ChevronDown,
} from "lucide-react";

/* ============================================================
   FAVORITES & RECENT TOOLS — localStorage backed
   ============================================================ */
const FAV_KEY = "xevio:favorites";
const RECENT_KEY = "xevio:recent";

export function useFavorites() {
  const [favs, setFavs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const toggle = useCallback((slug: string) => {
    setFavs((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFav = useCallback((slug: string) => favs.includes(slug), [favs]);

  return { favs, toggle, isFav };
}

export function useRecent() {
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const push = useCallback((slug: string) => {
    setRecent((prev) => {
      // Already at the front — return the SAME array reference so React
      // sees "no change" and doesn't trigger another render.
      if (prev[0] === slug) return prev;
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recent, push };
}

/* ============================================================
   SEARCH
   ============================================================ */
function ToolSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase().trim();
    return TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle) ||
        t.keywords.some((k) => k.includes(needle))
    ).slice(0, 6);
  }, [q]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#191715] border border-[#342821] rounded-lg text-sm text-[#91887D] hover:border-[#C96B4B]/40 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search tools…</span>
        <span className="text-[10px] bg-[#25211D] px-1.5 py-0.5 rounded border border-[#342821]">
          ⌘K
        </span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[#191715] border border-[#342821] rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#342821]">
          <Search className="w-4 h-4 text-[#91887D]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tools…"
            className="flex-1 bg-transparent text-sm text-[#E8E1D5] placeholder:text-[#91887D] outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="text-[#91887D] hover:text-[#E8E1D5]"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#91887D]">
              No tools match “{q}”
            </div>
          ) : (
            results.map((t) => (
              <button
                key={t.slug}
                onClick={() => {
                  navigate(t.path);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#25211D] text-left"
              >
                <div className="w-9 h-9 rounded-md bg-[#25211D] flex items-center justify-center text-[#C96B4B]">
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#E8E1D5]">{t.name}</p>
                  <p className="text-xs text-[#91887D] truncate">{t.description}</p>
                </div>
                <span className="text-[10px] text-[#91887D] uppercase tracking-wider">
                  {t.category}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR
   ============================================================ */
function SidebarContent({
  favs,
  isFav,
  toggle,
  recent,
  onClose,
}: {
  favs: string[];
  isFav: (s: string) => boolean;
  toggle: (s: string) => void;
  recent: string[];
  onClose?: () => void;
}) {
  const { pathname } = useLocation();

  const grouped: Record<ToolCategory, typeof TOOLS> = {
    PDF: [],
    Images: [],
    "Text & Data": [],
  };
  TOOLS.forEach((t) => grouped[t.category].push(t));

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-[#C96B4B] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[#E8E1D5]">
            Xevio
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-[#91887D] hover:text-[#E8E1D5]"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4">
        <ToolSearch />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Favorites */}
        {favs.length > 0 && (
          <div>
            <h3 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#91887D] mb-1.5 flex items-center gap-1.5">
              <Star className="w-3 h-3 fill-current" /> Favorites
            </h3>
            <div className="space-y-0.5">
              {favs.map((slug) => {
                const t = TOOLS.find((x) => x.slug === slug);
                if (!t) return null;
                return (
                  <NavLink
                    key={slug}
                    to={t.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-[#C96B4B]/10 text-[#E0805C]"
                          : "text-[#E8E1D5] hover:bg-[#25211D]"
                      )
                    }
                  >
                    <span className="text-[#C96B4B]">{t.icon}</span>
                    <span className="flex-1 truncate">{t.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <div>
            <h3 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#91887D] mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Recent
            </h3>
            <div className="space-y-0.5">
              {recent.map((slug) => {
                const t = TOOLS.find((x) => x.slug === slug);
                if (!t) return null;
                return (
                  <NavLink
                    key={slug}
                    to={t.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-[#C96B4B]/10 text-[#E0805C]"
                          : "text-[#E8E1D5] hover:bg-[#25211D]"
                      )
                    }
                  >
                    <span className="text-[#C96B4B]">{t.icon}</span>
                    <span className="flex-1 truncate">{t.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories */}
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <h3 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#91887D] mb-1.5">
              {cat}
            </h3>
            <div className="space-y-0.5">
              {grouped[cat].map((t) => (
                <NavLink
                  key={t.slug}
                  to={t.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-[#C96B4B]/10 text-[#E0805C]"
                        : "text-[#E8E1D5] hover:bg-[#25211D]",
                      pathname === "/" && "text-[#E8E1D5]"
                    )
                  }
                >
                  <span className="text-[#C96B4B]">{t.icon}</span>
                  <span className="flex-1 truncate">{t.name}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(t.slug);
                    }}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity",
                      isFav(t.slug) ? "opacity-100 text-[#C96B4B]" : "text-[#91887D] hover:text-[#E8E1D5]"
                    )}
                    aria-label={isFav(t.slug) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={cn("w-3.5 h-3.5", isFav(t.slug) && "fill-current")} />
                  </button>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#342821]">
        <div className="flex items-center gap-2 text-xs text-[#91887D]">
          <Lock className="w-3.5 h-3.5" />
          <span>Private by design</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LAYOUT
   ============================================================ */
export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { favs, toggle, isFav } = useFavorites();
  const { recent, push } = useRecent();
  const { pathname } = useLocation();

  // Track recently used tools
  useEffect(() => {
    const match = TOOLS.find((t) => t.path === pathname);
    if (match) push(match.slug);
  }, [pathname, push]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="flex h-full min-h-screen bg-[#11100F] text-[#E8E1D5]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r border-[#342821] bg-[#11100F] sticky top-0 h-screen">
        <SidebarContent favs={favs} isFav={isFav} toggle={toggle} recent={recent} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#11100F] border-r border-[#342821] lg:hidden">
            <SidebarContent
              favs={favs}
              isFav={isFav}
              toggle={toggle}
              recent={recent}
              onClose={() => setDrawerOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#342821] bg-[#11100F] sticky top-0 z-30">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 text-[#E8E1D5] hover:bg-[#25211D] rounded-md"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#C96B4B] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold tracking-tight">Xevio</span>
          </Link>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <Outlet />
        </main>

        <footer className="border-t border-[#342821] px-4 md:px-8 py-6 text-xs text-[#91887D]">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              <span>
                © 2026 Xevio. Free to use.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-[#E8E1D5]">
                Privacy
              </Link>
              <Link to="/" className="hover:text-[#E8E1D5]">
                Home
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export { ChevronDown };
