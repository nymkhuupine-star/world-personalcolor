/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { UserButton } from '@clerk/nextjs';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  LayoutDashboard, Users, CreditCard, FileText, Images,
  TrendingUp, Clock, RefreshCw, ShieldCheck,
  CheckCircle, Loader2, ChevronRight,
} from 'lucide-react';
import { REPORT_GROUPS, reportId, type SeasonKey } from '@/utils/reportPdfs';
import { toUBDate, formatDate, UB_TZ, MIN_REAL_PAYMENT } from './utils';
import ConfirmDialog from './ConfirmDialog';
import type { Section, Order, Analysis, PdfStatuses, ImageStatuses, GalleryStatuses } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Lazy-load дэд секцүүд — хэрэглэгч тухайн tab руу орохдоо л татна
const RegistrationsSection = dynamic(() => import('./sections/RegistrationsSection'), {
  loading: () => <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...</div>,
});
const PaymentsSection = dynamic(() => import('./sections/PaymentsSection'), {
  loading: () => <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...</div>,
});
const PdfsSection = dynamic(() => import('./sections/PdfsSection'), {
  loading: () => <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...</div>,
});
const GallerySection = dynamic(() => import('./sections/GallerySection'), {
  loading: () => <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...</div>,
});

const NAV = [
  { key: 'overview' as Section, label: 'Тойм', icon: LayoutDashboard },
  { key: 'registrations' as Section, label: 'Бүртгэл', icon: Users },
  { key: 'payments' as Section, label: 'Төлбөр', icon: CreditCard },
  { key: 'gallery' as Section, label: 'Зураг', icon: Images },
  { key: 'pdfs' as Section, label: 'PDF файлууд', icon: FileText },
];

export default function Dashboard({
  initialOrders = [],
  initialAnalyses = [],
}: {
  initialOrders?: Order[];
  initialAnalyses?: Analysis[];
}) {
  const [section, setSection] = useState<Section>('overview');
  const [analyses, setAnalyses] = useState<Analysis[]>(initialAnalyses);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [regSearch, setRegSearch] = useState('');
  const [paySearch, setPaySearch] = useState('');
  const [payDateFrom, setPayDateFrom] = useState('');
  const [payDateTo, setPayDateTo] = useState('');
  const [pdfStatuses, setPdfStatuses] = useState<PdfStatuses>({});
  const [pdfUploading, setPdfUploading] = useState<string | null>(null);
  const [pdfDeleting, setPdfDeleting] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [imageStatuses, setImageStatuses] = useState<ImageStatuses>({});
  const [imageUploading, setImageUploading] = useState<string | null>(null);
  const [imageDeleting, setImageDeleting] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [galleryStatuses, setGalleryStatuses] = useState<GalleryStatuses>({});
  const [galleryUploading, setGalleryUploading] = useState<string | null>(null);
  const [galleryDeleting, setGalleryDeleting] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [confirmOrderError, setConfirmOrderError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const preloaded = new Set<Section>();
  if (initialOrders.length > 0) { preloaded.add('overview'); preloaded.add('payments'); }
  if (initialAnalyses.length > 0) preloaded.add('registrations');
  const loadedSections = useRef<Set<Section>>(preloaded);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/orders').then(r => r.ok ? r.json() : []);
    setOrders(Array.isArray(res) ? res as Order[] : []);
    setLoading(false);
  }, []);

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('analyses')
      .select('id,email,image_path,season,sub_type,email_sent,paid,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) setAnalyses(data as Analysis[]);
    setLoading(false);
  }, []);

  const fetchPdfStatuses = useCallback(async () => {
    const res = await fetch('/api/admin/pdf');
    if (res.ok) setPdfStatuses(await res.json());
  }, []);

  const fetchImageStatuses = useCallback(async () => {
    const res = await fetch('/api/admin/image');
    if (res.ok) setImageStatuses(await res.json());
  }, []);

  const fetchGalleryStatuses = useCallback(async () => {
    const entries = await Promise.all(
      REPORT_GROUPS.flatMap((group) => group.subtypes.map(async (s) => {
        const id = reportId(group.key, s.key);
        const res = await fetch(`/api/admin/gallery?season=${group.key}&subtype=${s.key}`);
        const data = res.ok ? await res.json() as { images: GalleryStatuses[string] } : { images: [] };
        return [id, data.images] as const;
      }))
    );
    setGalleryStatuses(Object.fromEntries(entries));
  }, []);

  const handleConfirmOrder = async (orderId: string) => {
    if (confirmingId) return;
    setConfirmingId(orderId);
    setConfirmOrderError(null);
    try {
      const res = await fetch('/api/admin/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        setConfirmedId(orderId);
        await fetchOrders();
        setTimeout(() => setConfirmedId(null), 4000);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setConfirmOrderError(data.error ?? `Баталгаажуулж чадсангүй (${res.status}).`);
      }
    } catch {
      setConfirmOrderError('Сервертэй холбогдож чадсангүй.');
    }
    setConfirmingId(null);
  };

  const doPdfDelete = async (season: SeasonKey, subtype: string) => {
    const id = reportId(season, subtype);
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

  const handlePdfDelete = (season: SeasonKey, subtype: string) => {
    setPendingDelete({
      message: `"${subtype}.pdf" файлыг устгах уу?`,
      onConfirm: () => { setPendingDelete(null); void doPdfDelete(season, subtype); },
    });
  };

  const handlePdfUpload = async (season: SeasonKey, subtype: string, file: File) => {
    const id = reportId(season, subtype);
    setPdfUploading(id);
    setPdfSuccess(null);
    setPdfError(null);
    try {
      const signRes = await fetch('/api/admin/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, subtype }),
      });
      if (!signRes.ok) {
        const data = await signRes.json().catch(() => ({})) as { error?: string };
        setPdfError(data.error ?? `Алдаа гарлаа (${signRes.status}).`);
        setPdfUploading(null);
        return;
      }
      const { token, path } = await signRes.json() as { signedUrl: string; token: string; path: string };
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .uploadToSignedUrl(path, token, file, { contentType: 'application/pdf' });
      if (uploadError) {
        setPdfError(uploadError.message ?? 'Upload амжилтгүй боллоо.');
      } else {
        setPdfSuccess(id);
        await fetchPdfStatuses();
        setTimeout(() => setPdfSuccess(null), 3000);
      }
    } catch {
      setPdfError('Сервертэй холбогдож чадсангүй.');
    }
    setPdfUploading(null);
  };

  const doImageDelete = async (season: SeasonKey, subtype: string) => {
    const id = reportId(season, subtype);
    setImageDeleting(id);
    setImageSuccess(null);
    setImageError(null);
    try {
      const res = await fetch('/api/admin/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, subtype }),
      });
      if (res.ok) {
        await fetchImageStatuses();
      } else {
        const data = (await res.json()) as { error?: string };
        setImageError(data.error ?? `Алдаа гарлаа (${res.status}).`);
      }
    } catch {
      setImageError('Сервертэй холбогдож чадсангүй.');
    }
    setImageDeleting(null);
  };

  const handleImageDelete = (season: SeasonKey, subtype: string) => {
    setPendingDelete({
      message: `"${subtype}" улирлын зургийг устгах уу?`,
      onConfirm: () => { setPendingDelete(null); void doImageDelete(season, subtype); },
    });
  };

  const handleImageUpload = async (season: SeasonKey, subtype: string, file: File) => {
    const id = reportId(season, subtype);
    setImageUploading(id);
    setImageSuccess(null);
    setImageError(null);
    try {
      const signRes = await fetch('/api/admin/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, subtype, mimeType: file.type }),
      });
      if (!signRes.ok) {
        const data = await signRes.json().catch(() => ({})) as { error?: string };
        setImageError(data.error ?? `Алдаа гарлаа (${signRes.status}).`);
        setImageUploading(null);
        return;
      }
      const { token, path } = await signRes.json() as { signedUrl: string; token: string; path: string; ext: string };
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (uploadError) {
        setImageError(uploadError.message ?? 'Upload амжилтгүй боллоо.');
      } else {
        setImageSuccess(id);
        await fetchImageStatuses();
        setTimeout(() => setImageSuccess(null), 3000);
      }
    } catch {
      setImageError('Сервертэй холбогдож чадсангүй.');
    }
    setImageUploading(null);
  };

  const doGalleryDelete = async (season: SeasonKey, subtype: string, name: string) => {
    const id = reportId(season, subtype);
    const deletingKey = `${id}/${name}`;
    setGalleryDeleting(deletingKey);
    setGalleryError(null);
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, subtype, name }),
      });
      if (res.ok) {
        setGalleryStatuses((prev) => ({ ...prev, [id]: (prev[id] ?? []).filter((img) => img.name !== name) }));
      } else {
        const data = (await res.json()) as { error?: string };
        setGalleryError(data.error ?? `Алдаа гарлаа (${res.status}).`);
      }
    } catch {
      setGalleryError('Сервертэй холбогдож чадсангүй.');
    }
    setGalleryDeleting(null);
  };

  const handleGalleryDelete = (season: SeasonKey, subtype: string, name: string) => {
    setPendingDelete({
      message: 'Энэ зургийг устгах уу?',
      onConfirm: () => { setPendingDelete(null); void doGalleryDelete(season, subtype, name); },
    });
  };

  const handleGalleryUpload = async (season: SeasonKey, subtype: string, file: File) => {
    const id = reportId(season, subtype);
    setGalleryUploading(id);
    setGalleryError(null);
    try {
      const signRes = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season, subtype, mimeType: file.type }),
      });
      if (!signRes.ok) {
        const data = await signRes.json().catch(() => ({})) as { error?: string };
        setGalleryError(data.error ?? `Алдаа гарлаа (${signRes.status}).`);
        setGalleryUploading(null);
        return;
      }
      const { token, path } = await signRes.json() as { signedUrl: string; token: string; path: string };
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (uploadError) {
        setGalleryError(uploadError.message ?? 'Upload амжилтгүй боллоо.');
      } else {
        const name = path.split('/').pop()!;
        const url = supabase.storage.from('reports').getPublicUrl(path).data.publicUrl;
        setGalleryStatuses((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), { name, url }] }));
      }
    } catch {
      setGalleryError('Сервертэй холбогдож чадсангүй.');
    }
    setGalleryUploading(null);
  };

  // Load data only when section is first visited
  useEffect(() => {
    if (loadedSections.current.has(section)) return;
    loadedSections.current.add(section);
    if (section === 'overview' || section === 'payments') void fetchOrders();
    if (section === 'registrations') void fetchAnalyses();
    if (section === 'pdfs') { void fetchPdfStatuses(); void fetchImageStatuses(); }
    if (section === 'gallery') void fetchGalleryStatuses();
  }, [section, fetchOrders, fetchAnalyses, fetchPdfStatuses, fetchImageStatuses, fetchGalleryStatuses]);

  // Fetch orders on mount only if server didn't preload
  useEffect(() => {
    if (initialOrders.length > 0) return;
    loadedSections.current.add('overview');
    void fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Overview calculations ──
  const today = new Date().toLocaleDateString('en-CA', { timeZone: UB_TZ });
  const paidOrders = orders.filter(o => o.paid);
  const realPaidOrders = paidOrders.filter(o => (o.amount ?? 0) >= MIN_REAL_PAYMENT);
  const totalRevenue = realPaidOrders.reduce((sum, o) => sum + (o.amount ?? 0), 0);

  const now = new Date();
  const ubNow = new Date(now.toLocaleString('en-US', { timeZone: UB_TZ }));
  const daysInMonth = new Date(ubNow.getFullYear(), ubNow.getMonth() + 1, 0).getDate();

  const thisMonthRevenue = realPaidOrders
    .filter(o => {
      if (!o.paid_at) return false;
      const d = new Date(new Date(o.paid_at).toLocaleString('en-US', { timeZone: UB_TZ }));
      return d.getMonth() === ubNow.getMonth() && d.getFullYear() === ubNow.getFullYear();
    })
    .reduce((sum, o) => sum + (o.amount ?? 0), 0);

  const todayOrders = realPaidOrders.filter(o => o.paid_at && toUBDate(o.paid_at) === today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.amount ?? 0), 0);

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const revenue = realPaidOrders
      .filter(o => {
        if (!o.paid_at) return false;
        const d = new Date(new Date(o.paid_at).toLocaleString('en-US', { timeZone: UB_TZ }));
        return d.getDate() === day && d.getMonth() === ubNow.getMonth() && d.getFullYear() === ubNow.getFullYear();
      })
      .reduce((sum, o) => sum + (o.amount ?? 0), 0);
    return { day: String(day).padStart(2, '0'), revenue };
  });

  const handleRefresh = () => {
    if (section === 'overview' || section === 'payments') void fetchOrders();
    if (section === 'registrations') void fetchAnalyses();
    if (section === 'pdfs') { void fetchPdfStatuses(); void fetchImageStatuses(); }
    if (section === 'gallery') void fetchGalleryStatuses();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-60 md:flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-400 shadow-sm">
            <ShieldCheck className="h-4.5 w-4.5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Personal Color</p>
            <p className="text-[11px] text-slate-400">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = section === key;
            return (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-violet-500' : 'text-slate-400'}`} strokeWidth={1.5} />
                {label}
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-violet-400" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 px-5 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <UserButton />
            <span className="text-xs text-slate-500">Гарах / бүртгэл</span>
          </div>
          <Link href="/" className="block text-xs text-slate-400 hover:text-slate-600 transition-colors">
            ← Үндсэн хуудас руу буцах
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-60 pb-20 md:pb-0">
        {/* Topbar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 md:px-8 md:py-4 backdrop-blur-md">
          <div>
            <h1 className="text-sm font-bold text-slate-900 md:text-base">
              {NAV.find(n => n.key === section)?.label}
            </h1>
            <p className="text-[10px] text-slate-400 md:text-xs">Personal Color AI — Admin</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              <span className="hidden sm:inline">Шинэчлэх</span>
            </button>
            <div className="md:hidden">
              <UserButton />
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4 md:px-8 md:py-8 md:space-y-6">

          {/* ── OVERVIEW ── */}
          {section === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                {[
                  { label: 'Өнөөдрийн орлого', value: `${todayRevenue.toLocaleString()}₮`, sub: `${todayOrders.length} захиалга (${today})`, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                  { label: 'Нийт орлого', value: `${totalRevenue.toLocaleString()}₮`, sub: 'Нийт төлөгдсөн дүн', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { label: 'Энэ сарын орлого', value: `${thisMonthRevenue.toLocaleString()}₮`, sub: 'Одоогийн сарын дүн', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: 'Төлөгдсөн захиалга', value: paidOrders.length, sub: 'Амжилттай баталгаажсан', icon: CheckCircle, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
                  { label: 'Хүлээгдэж буй', value: orders.filter(o => !o.paid).length, sub: 'Төлбөр хийгдээгүй', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
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

              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-sm font-bold text-slate-900">Нийт орлого</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ubNow.getFullYear()} оны {ubNow.getMonth() + 1}-р сарын өдөр тутмын орлого
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
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => v === 0 ? '0' : `${(v / 1000).toFixed(0)}к`} />
                        <Tooltip
                          formatter={(v) => [`${Number(v).toLocaleString()}₮`, 'Орлого']}
                          labelFormatter={l => `${ubNow.getMonth() + 1}/${l}`}
                          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#7c3aed', strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

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
          {section === 'registrations' && (
            <RegistrationsSection
              analyses={analyses}
              loading={loading}
              regSearch={regSearch}
              setRegSearch={setRegSearch}
              expandedDays={expandedDays}
              setExpandedDays={setExpandedDays}
            />
          )}

          {/* ── PAYMENTS ── */}
          {section === 'payments' && (
            <PaymentsSection
              orders={orders}
              loading={loading}
              paySearch={paySearch}
              setPaySearch={setPaySearch}
              payDateFrom={payDateFrom}
              setPayDateFrom={setPayDateFrom}
              payDateTo={payDateTo}
              setPayDateTo={setPayDateTo}
              expandedDays={expandedDays}
              setExpandedDays={setExpandedDays}
              handleConfirmOrder={handleConfirmOrder}
              confirmingId={confirmingId}
              confirmedId={confirmedId}
              confirmError={confirmOrderError}
            />
          )}

          {/* ── Gallery ── */}
          {section === 'gallery' && (
            <GallerySection
              galleryStatuses={galleryStatuses}
              galleryError={galleryError}
              galleryUploading={galleryUploading}
              galleryDeleting={galleryDeleting}
              expandedSeason={expandedSeason}
              setExpandedSeason={setExpandedSeason}
              handleGalleryUpload={handleGalleryUpload}
              handleGalleryDelete={handleGalleryDelete}
            />
          )}

          {/* ── PDFs ── */}
          {section === 'pdfs' && (
            <PdfsSection
              pdfStatuses={pdfStatuses}
              pdfError={pdfError}
              pdfUploading={pdfUploading}
              pdfDeleting={pdfDeleting}
              pdfSuccess={pdfSuccess}
              expandedSeason={expandedSeason}
              setExpandedSeason={setExpandedSeason}
              handlePdfUpload={handlePdfUpload}
              handlePdfDelete={handlePdfDelete}
              imageStatuses={imageStatuses}
              imageError={imageError}
              imageUploading={imageUploading}
              imageDeleting={imageDeleting}
              imageSuccess={imageSuccess}
              handleImageUpload={handleImageUpload}
              handleImageDelete={handleImageDelete}
            />
          )}
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex border-t border-slate-200 bg-white md:hidden">
        {NAV.map(({ key, label, icon: Icon }) => {
          const active = section === key;
          return (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                active ? 'text-violet-600' : 'text-slate-400'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-violet-500' : 'text-slate-400'}`} strokeWidth={1.5} />
              {label}
            </button>
          );
        })}
      </nav>

      {pendingDelete && (
        <ConfirmDialog
          message={pendingDelete.message}
          onConfirm={pendingDelete.onConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
