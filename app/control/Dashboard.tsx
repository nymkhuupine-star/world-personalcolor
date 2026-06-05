/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Folder,
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
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { REPORT_GROUPS, reportId, type SeasonKey } from '@/utils/reportPdfs';

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

type Order = {
  id: string;
  email: string;
  invoice_id: string | null;
  transaction_id: string | null;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  analysis_result: { seasonName?: string } | null;
};

type PdfStatuses = Record<string, boolean>;

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [regSearch, setRegSearch] = useState('');
  const [paySearch, setPaySearch] = useState('');
  const [pdfStatuses, setPdfStatuses] = useState<PdfStatuses>({});
  const [pdfUploading, setPdfUploading] = useState<string | null>(null);
  const [pdfDeleting, setPdfDeleting] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleConfirmOrder = async (orderId: string) => {
    if (confirmingId) return;
    setConfirmingId(orderId);
    try {
      const res = await fetch('/api/admin/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        setConfirmedId(orderId);
        await fetchPortraits();
        setTimeout(() => setConfirmedId(null), 4000);
      }
    } catch { /* silent */ }
    setConfirmingId(null);
  };

  const fetchPortraits = useCallback(async () => {
    setLoading(true);
    const [storageRes, dbRes, ordersRes] = await Promise.all([
      supabase.storage.from('portraits').list('', {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      }),
      supabase.from('analyses').select('*').order('created_at', { ascending: false }).limit(200),
      fetch('/api/admin/orders').then(r => r.ok ? r.json() : []),
    ]);
    if (!storageRes.error && storageRes.data) setPortraits(storageRes.data as Portrait[]);
    if (!dbRes.error && dbRes.data) setAnalyses(dbRes.data as Analysis[]);
    setOrders(Array.isArray(ordersRes) ? ordersRes as Order[] : []);
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

  const handlePdfDelete = async (season: SeasonKey, subtype: string) => {
    const id = reportId(season, subtype);
    if (!confirm(`"${subtype}.pdf" файлыг устгах уу?`)) return;
    setPdfDeleting(id);
    setPdfSuccess(null);
    setPdfError(null);
    try {
      const res = await fetch('/api/admin/pdf', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, subtype }),
      });
      if (res.ok) {
        await fetchPdfStatuses();
      } else {
        const data = (await res.json()) as { error?: string };
        setPdfError(data.error ?? `Алдаа гарлаа (${res.status}).`);
      }
    } catch {
      setPdfError('Сервертэй холбогдож чадсангүй.');
    }
    setPdfDeleting(null);
  };

  const handlePdfUpload = async (season: SeasonKey, subtype: string, file: File) => {
    const id = reportId(season, subtype);
    setPdfUploading(id);
    setPdfSuccess(null);
    setPdfError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('season', season);
    formData.append('subtype', subtype);

    try {
      const res = await fetch('/api/admin/pdf', { method: 'POST', body: formData });
      if (res.ok) {
        setPdfSuccess(id);
        await fetchPdfStatuses();
        setTimeout(() => setPdfSuccess(null), 3000);
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setPdfError(data.error ?? `Алдаа гарлаа (${res.status}).`);
      }
    } catch {
      setPdfError('Сервертэй холбогдож чадсангүй.');
    }
    setPdfUploading(null);
  };

  const today        = new Date().toDateString();
  const todayCount   = portraits.filter(p => new Date(p.created_at).toDateString() === today).length;
  const paidOrders   = orders.filter(o => o.paid);
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount ?? 0), 0);

  // Build daily revenue chart data for current month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const thisMonthRevenue = paidOrders
    .filter(o => o.paid_at && new Date(o.paid_at).getMonth() === now.getMonth() && new Date(o.paid_at).getFullYear() === now.getFullYear())
    .reduce((sum, o) => sum + (o.amount ?? 0), 0);

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const label = String(day).padStart(2, '0');
    const revenue = paidOrders
      .filter(o => {
        if (!o.paid_at) return false;
        const d = new Date(o.paid_at);
        return d.getDate() === day && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, o) => sum + (o.amount ?? 0), 0);
    return { day: label, revenue };
  });

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
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  {
                    label: 'Нийт орлого',
                    value: `${totalRevenue.toLocaleString()}₮`,
                    sub: 'Нийт төлөгдсөн дүн',
                    icon: CreditCard,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-100',
                  },
                  {
                    label: 'Энэ сарын орлого',
                    value: `${thisMonthRevenue.toLocaleString()}₮`,
                    sub: 'Одоогийн сарын дүн',
                    icon: TrendingUp,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    border: 'border-blue-100',
                  },
                  {
                    label: 'Төлөгдсөн захиалга',
                    value: paidOrders.length,
                    sub: 'Амжилттай баталгаажсан',
                    icon: CheckCircle,
                    color: 'text-violet-600',
                    bg: 'bg-violet-50',
                    border: 'border-violet-100',
                  },
                  {
                    label: 'Хүлээгдэж буй',
                    value: orders.filter(o => !o.paid).length,
                    sub: 'Төлбөр хийгдээгүй',
                    icon: Clock,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                    border: 'border-amber-100',
                  },
                ].map(({ label, value, sub, icon: Icon, color, bg, border }) => (
                  <div key={label} className={`rounded-2xl border ${border} bg-white p-5 shadow-sm`}>
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.5} />
                    </div>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-600">{label}</p>
                    <p className="text-[11px] text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Revenue chart */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-sm font-bold text-slate-900">Нийт орлого</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {now.getFullYear()} оны {now.getMonth() + 1}-р сарын өдөр тутмын орлого
                  </p>
                </div>
                <div className="px-2 py-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-48 text-slate-300 text-sm">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Уншиж байна...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}к`}
                        />
                        <Tooltip
                          formatter={(v) => [`${Number(v).toLocaleString()}₮`, 'Орлого']}
                          labelFormatter={l => `${now.getMonth() + 1}/${l}`}
                          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#7c3aed"
                          strokeWidth={2.5}
                          fill="url(#revenueGrad)"
                          dot={false}
                          activeDot={{ r: 5, fill: '#7c3aed', strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Recent paid orders */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-sm font-bold text-slate-900">Сүүлийн төлбөрүүд</h2>
                </div>
                <div className="divide-y divide-slate-50">
                  {paidOrders.slice(0, 6).map((o, i) => (
                    <div key={o.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-300">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{o.email}</p>
                          <p className="text-xs text-slate-400">{o.analysis_result?.seasonName ?? '—'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{(o.amount ?? 0).toLocaleString()}₮</p>
                        <p className="text-xs text-slate-400">{o.paid_at ? formatDate(o.paid_at) : '—'}</p>
                      </div>
                    </div>
                  ))}
                  {paidOrders.length === 0 && (
                    <div className="flex items-center justify-center py-10 text-slate-300 text-sm">
                      Одоохондоо төлбөр байхгүй
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── REGISTRATIONS ── */}
          {section === 'registrations' && (() => {
            const filtered = analyses.filter(a =>
              !regSearch || a.email.toLowerCase().includes(regSearch.toLowerCase()) ||
              a.sub_type?.toLowerCase().includes(regSearch.toLowerCase())
            );
            return (
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                {/* Header + Search */}
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-slate-900">Шинжилгээний бүртгэл</h2>
                    <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600">
                      {analyses.length}
                    </span>
                  </div>
                  <div className="relative w-56">
                    <input
                      value={regSearch}
                      onChange={e => setRegSearch(e.target.value)}
                      placeholder="Хайх..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    />
                    <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400 text-sm">
                    <Users className="h-8 w-8 text-slate-200" strokeWidth={1.5} />
                    <p>{regSearch ? 'Хайлтад тохирох бүртгэл олдсонгүй' : 'Одоохондоо бүртгэл байхгүй'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          {['#', 'Имэйл хаяг', 'Өнгөний төрөл', 'Огноо', 'Төлбөр', 'Имэйл'].map((h, i) => (
                            <th key={h} className={`px-5 py-3 text-left text-[11px] font-semibold text-slate-400 ${i >= 4 ? 'text-center' : ''}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((a, i) => {
                          return (
                            <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                              <td className="px-5 py-4 text-xs text-slate-300 font-mono w-10">{i + 1}</td>
                              <td className="px-5 py-4">
                                <span className="text-sm font-medium text-slate-800">{a.email}</span>
                              </td>
                              <td className="px-5 py-4">
                                {a.season ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    {a.sub_type || `${SEASON_MN[a.season] ?? a.season}`}
                                  </span>
                                ) : <span className="text-xs text-slate-300">—</span>}
                              </td>
                              <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                                {formatDate(a.created_at)}
                              </td>
                              <td className="px-5 py-4 text-center">
                                {a.paid
                                  ? <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-3 w-3" strokeWidth={2.5} />Төлсөн</span>
                                  : <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-400"><XCircle className="h-3 w-3" strokeWidth={2} />Үгүй</span>
                                }
                              </td>
                              <td className="px-5 py-4 text-center">
                                {a.email_sent
                                  ? <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-3 w-3" strokeWidth={2.5} />Илгээсэн</span>
                                  : <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-500"><XCircle className="h-3 w-3" strokeWidth={2} />Үгүй</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── PAYMENTS ── */}
          {section === 'payments' && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: 'Нийт орлого',
                    value: `${totalRevenue.toLocaleString()}₮`,
                    note: `${paidOrders.length} амжилттай захиалга`,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                  },
                  {
                    label: 'Төлбөр төлсөн',
                    value: String(paidOrders.length),
                    note: 'Хэрэглэгч',
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                  },
                  {
                    label: 'Дуусаагүй захиалга',
                    value: String(orders.filter(o => !o.paid).length),
                    note: 'Төлбөр хийгдээгүй',
                    color: 'text-slate-500',
                    bg: 'bg-slate-50',
                  },
                ].map(({ label, value, note, color, bg }) => (
                  <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                      <CreditCard className={`h-4.5 w-4.5 ${color}`} strokeWidth={1.5} />
                    </div>
                    <p className={`text-3xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-400 mt-1">{label}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">{note}</p>
                  </div>
                ))}
              </div>

              {/* Orders table */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-slate-900">Захиалгын бүртгэл</h2>
                    <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600">{orders.length}</span>
                  </div>
                  <div className="relative w-56">
                    <input
                      value={paySearch}
                      onChange={e => setPaySearch(e.target.value)}
                      placeholder="Хайх..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    />
                    <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          {['#', 'Имэйл хаяг', 'Өнгөний төрөл', 'Дүн', 'Статус', 'Огноо', ''].map((h, i) => (
                            <th key={i} className={`px-5 py-3 text-left text-[11px] font-semibold text-slate-400 ${i === 3 ? 'text-right' : ''} ${i === 4 ? 'text-center' : ''}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .filter(o => !paySearch || o.email.toLowerCase().includes(paySearch.toLowerCase()) || (o.analysis_result?.seasonName ?? '').toLowerCase().includes(paySearch.toLowerCase()))
                          .map((o, i) => {
                            const sName = o.analysis_result?.seasonName ?? '';
                            return (
                              <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-4 text-xs text-slate-300 font-mono w-10">{i + 1}</td>
                                <td className="px-5 py-4">
                                  <span className="text-sm font-medium text-slate-800">{o.email}</span>
                                </td>
                                <td className="px-5 py-4">
                                  {sName ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                      {sName}
                                    </span>
                                  ) : <span className="text-xs text-slate-300">—</span>}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="text-sm font-bold text-slate-800">{(o.amount ?? 0).toLocaleString()}₮</span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  {o.paid
                                    ? <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-3 w-3" strokeWidth={2.5} />Амжилттай</span>
                                    : <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-500"><XCircle className="h-3 w-3" strokeWidth={2} />Дуусаагүй</span>
                                  }
                                </td>
                                <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                                  {o.paid && o.paid_at ? formatDate(o.paid_at) : formatDate(o.created_at)}
                                </td>
                                <td className="px-5 py-4 text-center">
                                  {!o.paid && (
                                    confirmedId === o.id ? (
                                      <span className="text-xs text-emerald-600 font-semibold">✓ Илгээгдлээ</span>
                                    ) : (
                                      <button
                                        onClick={() => handleConfirmOrder(o.id)}
                                        disabled={confirmingId === o.id}
                                        className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition disabled:opacity-50"
                                      >
                                        {confirmingId === o.id ? '...' : 'Баталгаажуулах'}
                                      </button>
                                    )
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PDFs ── */}
          {section === 'pdfs' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Шинжилгээний дараа имэйлээр илгээгдэх PDF тайлангуудыг энд оруулна уу.
                Улирал бүр дотроо 3 PDF файлтай (Light/True/Bright гэх мэт).
              </p>
              {pdfError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {pdfError}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {REPORT_GROUPS.map(({ key, label, en, color, bg, border, subtypes }) => {
                  const expanded = expandedSeason === key;
                  const uploadedCount = subtypes.filter((s) => pdfStatuses[reportId(key, s.key)]).length;

                  return (
                    <div key={key} className={`rounded-2xl border ${border} bg-white shadow-sm p-6`}>
                      <button
                        onClick={() => setExpandedSeason(expanded ? null : key)}
                        className="flex w-full items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                            <Folder className={`h-5 w-5 ${color}`} strokeWidth={1.5} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-800">{label}</p>
                            <p className="text-xs text-slate-400">{en}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-400">
                            {uploadedCount}/{subtypes.length}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            strokeWidth={1.5}
                          />
                        </div>
                      </button>

                      {expanded && (
                        <div className="mt-4 space-y-3">
                          {subtypes.map((s) => {
                            const id = reportId(key, s.key);
                            const exists = pdfStatuses[id];
                            const isUploading = pdfUploading === id;
                            const isSuccess = pdfSuccess === id;

                            return (
                              <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-slate-700">{s.label}</p>
                                    <p className="text-[11px] text-slate-400">{key}/{s.key}.pdf</p>
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
                                  ref={(el) => { fileRefs.current[id] = el; }}
                                  type="file"
                                  accept="application/pdf"
                                  className="sr-only"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handlePdfUpload(key, s.key, f);
                                    e.target.value = '';
                                  }}
                                />

                                <div className="mt-3 flex items-center gap-2">
                                  <button
                                    onClick={() => fileRefs.current[id]?.click()}
                                    disabled={isUploading || pdfDeleting === id}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition-all ${
                                      isUploading || pdfDeleting === id
                                        ? 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
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
                                      href={supabase.storage.from('reports').getPublicUrl(`${key}/${s.key}.pdf`).data.publicUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
                                    >
                                      Харах →
                                    </a>
                                  )}

                                  {exists && (
                                    <button
                                      onClick={() => handlePdfDelete(key, s.key)}
                                      disabled={pdfDeleting === id || isUploading}
                                      title="Устгах"
                                      className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-500 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {pdfDeleting === id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
