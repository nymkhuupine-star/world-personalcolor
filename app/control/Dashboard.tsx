/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  ImageIcon,
  TrendingUp,
  Clock,
  RefreshCw,
  ShieldCheck,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Section = 'overview' | 'registrations' | 'payments' | 'pdfs';

type Portrait = {
  name: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
};

type Analysis = {
  id: string;
  email: string;
  image_path: string;
  season: string;
  sub_type: string;
  email_sent: boolean;
  paid: boolean;
  created_at: string;
};

type PdfStatuses = Record<string, boolean>;

const SEASONS = [
  { key: 'spring', label: 'Хавар', en: 'Spring', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  { key: 'summer', label: 'Зун', en: 'Summer', color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-100' },
  { key: 'autumn', label: 'Намар', en: 'Autumn', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
  { key: 'winter', label: 'Өвөл', en: 'Winter', color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-100' },
];

const NAV = [
  { key: 'overview' as Section, label: 'Тойм', icon: LayoutDashboard },
  { key: 'registrations' as Section, label: 'Бүртгэл', icon: Users },
  { key: 'payments' as Section, label: 'Төлбөр', icon: CreditCard },
  { key: 'pdfs' as Section, label: 'PDF файлууд', icon: FileText },
];

function formatDate(d: string) {
  return new Date(d).toLocaleString('mn-MN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Dashboard() {
  const [section, setSection] = useState<Section>('overview');
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfStatuses, setPdfStatuses] = useState<PdfStatuses>({});
  const [pdfUploading, setPdfUploading] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchPortraits = useCallback(async () => {
    setLoading(true);
    const [storageRes, dbRes] = await Promise.all([
      supabase.storage.from('portraits').list('', {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      }),
      supabase.from('analyses').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    if (!storageRes.error && storageRes.data) setPortraits(storageRes.data as Portrait[]);
    if (!dbRes.error && dbRes.data) setAnalyses(dbRes.data as Analysis[]);
    setLoading(false);
  }, []);

  const fetchPdfStatuses = useCallback(async () => {
    const res = await fetch('/api/admin/pdf');
    if (res.ok) setPdfStatuses(await res.json());
  }, []);

  useEffect(() => {
    void fetchPortraits();
    void fetchPdfStatuses();
  }, [fetchPortraits, fetchPdfStatuses]);

  const handlePdfUpload = async (season: string, file: File) => {
    setPdfUploading(season);
    setPdfSuccess(null);
    const form = new FormData();
    form.append('season', season);
    form.append('file', file);
    const res = await fetch('/api/admin/pdf', { method: 'POST', body: form });
    if (res.ok) {
      setPdfSuccess(season);
      await fetchPdfStatuses();
      setTimeout(() => setPdfSuccess(null), 3000);
    }
    setPdfUploading(null);
  };

  const today = new Date().toDateString();
  const todayCount = portraits.filter(p => new Date(p.created_at).toDateString() === today).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-400 shadow-sm">
            <ShieldCheck className="h-4.5 w-4.5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Personal Color</p>
            <p className="text-[11px] text-slate-400">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = section === key;
            return (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-violet-500' : 'text-slate-400'}`} strokeWidth={1.5} />
                {label}
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-violet-400" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 px-5 py-4">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            ← Үндсэн хуудас руу буцах
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-60 flex-1">
        {/* Topbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-md">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {NAV.find(n => n.key === section)?.label}
            </h1>
            <p className="text-xs text-slate-400">Personal Color AI — Admin</p>
          </div>
          <button
            onClick={() => { fetchPortraits(); fetchPdfStatuses(); }}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            Шинэчлэх
          </button>
        </div>

        <div className="px-8 py-8 space-y-6">

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: 'Нийт шинжилгээ', value: portraits.length, icon: ImageIcon, color: 'text-violet-500', bg: 'bg-violet-50' },
                  { label: 'Өнөөдөр', value: todayCount, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'Нийт хэрэглэгч', value: portraits.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Сүүлийн 7 хоног', value: portraits.filter(p => {
                    const d = new Date(p.created_at);
                    const week = new Date();
                    week.setDate(week.getDate() - 7);
                    return d >= week;
                  }).length, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Recent 5 */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-sm font-bold text-slate-900">Сүүлийн шинжилгээнүүд</h2>
                </div>
                <div className="divide-y divide-slate-50">
                  {portraits.slice(0, 5).map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-300">{i + 1}</span>
                        <span className="text-sm text-slate-700 font-medium truncate max-w-[260px]">{p.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(p.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── REGISTRATIONS ── */}
          {section === 'registrations' && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Бүртгэлийн жагсаалт</h2>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">
                  {analyses.length} нийт
                </span>
              </div>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...
                </div>
              ) : analyses.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400 text-sm">
                  <Users className="h-8 w-8 text-slate-200" strokeWidth={1.5} />
                  <p>Одоохондоо бүртгэл байхгүй байна</p>
                  <p className="text-xs">Шинжилгээ хийгдсэний дараа энд харагдана</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-3">#</th>
                        <th className="px-6 py-3">Gmail хаяг</th>
                        <th className="px-6 py-3">Цаг, огноо</th>
                        <th className="px-6 py-3 text-center">Төлбөр төлсөн</th>
                        <th className="px-6 py-3 text-center">Имэйл хүлээн авсан</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {analyses.map((a, i) => (
                        <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-800">{a.email}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                            {formatDate(a.created_at)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {a.paid ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} /> Төлсөн
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-400">
                                <XCircle className="h-3.5 w-3.5" strokeWidth={2} /> Төлөөгүй
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {a.email_sent ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} /> Илгээсэн
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">
                                <XCircle className="h-3.5 w-3.5" strokeWidth={2} /> Илгээгээгүй
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {section === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Нийт орлого', value: '₮0', note: 'Төлбөрийн систем холбогдоогүй' },
                  { label: 'Төлбөр төлсөн', value: '0', note: 'Хэрэглэгч' },
                  { label: 'Үнэгүй ашигласан', value: String(portraits.length), note: 'Хэрэглэгч' },
                ].map(({ label, value, note }) => (
                  <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-400 mt-1">{note}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-sm font-bold text-slate-900">Төлбөрийн бүртгэл</h2>
                </div>
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                    <CreditCard className="h-7 w-7 text-amber-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Төлбөрийн систем холбогдоогүй</p>
                    <p className="mt-1 max-w-xs text-xs text-slate-400">
                      Stripe эсвэл бусад төлбөрийн системийг холбосны дараа энд харагдана.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
                    Stripe нэмэхийн тулд{' '}
                    <code className="font-mono text-violet-600">STRIPE_SECRET_KEY</code>-г{' '}
                    <code className="font-mono text-violet-600">.env.local</code>-д нэм
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PDFs ── */}
          {section === 'pdfs' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Шинжилгээний дараа имэйлээр илгээгдэх PDF тайлангуудыг энд оруулна уу.
                Улирал тус бүрд нэг PDF файл байна.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {SEASONS.map(({ key, label, en, color, bg, border }) => {
                  const exists = pdfStatuses[key];
                  const isUploading = pdfUploading === key;
                  const isSuccess = pdfSuccess === key;

                  return (
                    <div key={key} className={`rounded-2xl border ${border} bg-white shadow-sm p-6 flex flex-col gap-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                            <FileText className={`h-5 w-5 ${color}`} strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{label}</p>
                            <p className="text-xs text-slate-400">{en.toLowerCase()}.pdf</p>
                          </div>
                        </div>
                        {isSuccess ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle className="h-4 w-4" strokeWidth={1.5} /> Амжилттай
                          </span>
                        ) : exists === true ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle className="h-4 w-4" strokeWidth={1.5} /> Байна
                          </span>
                        ) : exists === false ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-rose-500">
                            <XCircle className="h-4 w-4" strokeWidth={1.5} /> Байхгүй
                          </span>
                        ) : null}
                      </div>

                      <input
                        ref={el => { fileRefs.current[key] = el; }}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handlePdfUpload(key, f);
                          e.target.value = '';
                        }}
                      />

                      <button
                        onClick={() => fileRefs.current[key]?.click()}
                        disabled={isUploading}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                          isUploading
                            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                            : `border-current ${color} hover:${bg}`
                        }`}
                      >
                        {isUploading ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Хуулж байна...</>
                        ) : (
                          <><Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                          {exists ? 'PDF солих' : 'PDF оруулах'}</>
                        )}
                      </button>

                      {exists && (
                        <a
                          href={`/reports/${key}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Одоогийн файлыг харах →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
