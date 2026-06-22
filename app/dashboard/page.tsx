'use client';

import { useEffect, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Download, Sparkles, Clock, Palette, User, ChevronRight,
  Star, Heart, Shirt, Gem, Layers, Moon, Sun,
} from 'lucide-react';
import { getStyleGuide } from '@/lib/personal-color/style-guide';

type Analysis = {
  id: string;
  seasonName: string;
  baseSeason: string;
  description: string;
  palette: string[];
  pdfUrl: string | null;
  date: string;
};

const SEASON_STYLE: Record<string, { gradient: string; bg: string; text: string; border: string; tag: string }> = {
  Spring: { gradient: 'from-rose-400 to-pink-300',     bg: 'bg-rose-50',   text: 'text-rose-600',   border: 'border-rose-100',   tag: 'bg-rose-100 text-rose-700'   },
  Summer: { gradient: 'from-violet-400 to-purple-300', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', tag: 'bg-violet-100 text-violet-700' },
  Autumn: { gradient: 'from-amber-400 to-orange-300',  bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100',  tag: 'bg-amber-100 text-amber-700'   },
  Winter: { gradient: 'from-sky-400 to-blue-300',      bg: 'bg-sky-50',    text: 'text-sky-600',    border: 'border-sky-100',    tag: 'bg-sky-100 text-sky-700'       },
};

const STYLE_ICON: Record<string, React.ReactNode> = {
  hair:        <Moon className="h-4 w-4" strokeWidth={2} />,
  makeup:      <Star className="h-4 w-4" strokeWidth={2} />,
  jewelry:     <Gem className="h-4 w-4" strokeWidth={2} />,
  accessories: <Heart className="h-4 w-4" strokeWidth={2} />,
  patterns:    <Layers className="h-4 w-4" strokeWidth={2} />,
  wardrobe:    <Shirt className="h-4 w-4" strokeWidth={2} />,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/analyses')
      .then(r => r.json())
      .then(d => { setAnalyses(d.analyses ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
          <p className="text-sm text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const latest = analyses[0] ?? null;
  const style = latest ? (SEASON_STYLE[latest.baseSeason] ?? SEASON_STYLE.Spring) : null;
  const styleGuide = latest ? getStyleGuide(latest.baseSeason) : [];
  const firstName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-serif text-lg font-bold text-slate-900">
            Personal Color
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors hidden sm:block"
            >
              New Analysis
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Welcome */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-pink-400 text-white font-semibold text-sm">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Your Personal Stylist</p>
            <h1 className="text-xl font-bold text-slate-900">{greeting()}, {firstName} 👋</h1>
          </div>
        </div>

        {/* No analyses yet */}
        {!latest && (
          <div className="rounded-2xl bg-white border border-slate-100 p-10 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-50">
                <Palette className="h-8 w-8 text-violet-400" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">No analysis yet</h2>
              <p className="text-sm text-slate-500">Complete your personal color analysis to see your results here.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow shadow-violet-200"
            >
              Start Analysis
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        )}

        {latest && style && (
          <>
            {/* Color Season */}
            <section className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
              <div className={`bg-gradient-to-r ${style.gradient} px-6 pt-6 pb-10`}>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Your Color Season</p>
                <h2 className="text-3xl font-serif font-bold text-white">{latest.seasonName}</h2>
              </div>
              <div className={`-mt-6 mx-4 mb-4 rounded-2xl ${style.bg} border ${style.border} p-4 space-y-3`}>
                <p className="text-sm text-slate-700 leading-relaxed">{latest.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Last Updated</p>
                    <p className={`text-sm font-semibold ${style.text}`}>{formatDate(latest.date)}</p>
                  </div>
                  {latest.pdfUrl && (
                    <a
                      href={latest.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold ${style.tag}`}
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={2} />
                      View Full Report
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* Color Palette */}
            <section className="rounded-2xl bg-white border border-slate-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-slate-400" strokeWidth={2} />
                  Your Color Palette
                </h3>
                <span className="text-xs text-slate-400">{latest.palette.length} colors</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {latest.palette.map((hex) => (
                  <div key={hex} className="group flex flex-col items-center gap-1">
                    <div
                      className="h-12 w-12 rounded-xl border-2 border-white shadow ring-1 ring-black/5"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-[10px] text-slate-400 font-mono">{hex}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Style Guide */}
            <section className="rounded-2xl bg-white border border-slate-100 p-5 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-400" strokeWidth={2} />
                Your Style Guide
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {styleGuide.map((s) => (
                  <button
                    key={s.category}
                    onClick={() => setActiveStyle(activeStyle === s.category ? null : s.category)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      activeStyle === s.category
                        ? `${style.bg} ${style.border} ${style.text}`
                        : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={activeStyle === s.category ? style.text : 'text-slate-400'}>
                        {STYLE_ICON[s.category]}
                      </span>
                      <span className="text-sm font-semibold">{s.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{s.best[0]}</p>
                  </button>
                ))}
              </div>

              {activeStyle && (() => {
                const s = styleGuide.find(g => g.category === activeStyle);
                if (!s) return null;
                return (
                  <div className={`rounded-xl ${style.bg} border ${style.border} p-4 space-y-3`}>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Best choices</p>
                      <div className="flex flex-wrap gap-2">
                        {s.best.map(b => (
                          <span key={b} className={`text-xs rounded-full px-3 py-1 font-medium ${style.tag}`}>{b}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Avoid</p>
                      <p className="text-xs text-slate-500">{s.avoid}</p>
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* Report */}
            {latest.pdfUrl && (
              <section className="rounded-2xl bg-white border border-slate-100 p-5 space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Download className="h-4 w-4 text-slate-400" strokeWidth={2} />
                  Your Report
                </h3>
                <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Personal Color Report</p>
                    <p className="text-xs text-slate-400">{latest.seasonName} · {formatDate(latest.date)}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={latest.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold ${style.tag}`}
                    >
                      <Sun className="h-3.5 w-3.5" strokeWidth={2} />
                      View Online
                    </a>
                    <a
                      href={latest.pdfUrl}
                      download
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-2 text-xs font-semibold text-white"
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={2} />
                      Download PDF
                    </a>
                  </div>
                </div>
              </section>
            )}

            {/* Analysis History */}
            {analyses.length > 1 && (
              <section className="rounded-2xl bg-white border border-slate-100 p-5 space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" strokeWidth={2} />
                  Analysis History
                </h3>
                <div className="space-y-3">
                  {analyses.map((a, i) => {
                    const s = SEASON_STYLE[a.baseSeason] ?? SEASON_STYLE.Spring;
                    return (
                      <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${s.tag}`}>
                            {i === 0 ? 'Latest' : `#${i + 1}`}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{a.seasonName}</p>
                            <p className="text-xs text-slate-400">{formatDate(a.date)}</p>
                          </div>
                        </div>
                        {a.pdfUrl && (
                          <a
                            href={a.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Download className="h-4 w-4" strokeWidth={2} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {/* AI Stylist — Coming Soon */}
        <section className="rounded-2xl bg-white border border-slate-100 p-5 space-y-4 opacity-70">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-400" strokeWidth={2} />
              AI Stylist
            </h3>
            <span className="text-xs rounded-full bg-violet-50 text-violet-500 font-semibold px-3 py-0.5 border border-violet-100">
              Coming Soon
            </span>
          </div>
          <div className="space-y-2">
            {['What should I wear today?', 'What lipstick matches this dress?', 'Is this jacket good for me?'].map(q => (
              <div key={q} className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-400">
                <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {q}
              </div>
            ))}
          </div>
        </section>

        {/* Account */}
        <section className="rounded-2xl bg-white border border-slate-100 p-5 space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" strokeWidth={2} />
            Account
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <div>
                <p className="text-xs text-slate-400">Name</p>
                <p className="text-sm font-medium text-slate-900">{user?.fullName ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-900">{user?.emailAddresses?.[0]?.emailAddress ?? '—'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <UserButton afterSignOutUrl="/" />
            <span className="text-sm text-slate-400">Manage account or sign out</span>
          </div>
        </section>

      </div>
    </div>
  );
}
