'use client';

import { CheckCircle, XCircle, Loader2, CreditCard, ChevronDown, Mail, Download } from 'lucide-react';
import type { Order } from '../types';
import { toUBDate, ubDayLabel, formatDate, today as getToday } from '../utils';

type Props = {
  orders: Order[];
  loading: boolean;
  paySearch: string;
  setPaySearch: (v: string) => void;
  payDate: string;
  setPayDate: (v: string) => void;
  expandedDays: Set<string>;
  setExpandedDays: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleConfirmOrder: (id: string) => Promise<void>;
  confirmingId: string | null;
  confirmedId: string | null;
};

export default function PaymentsSection({
  orders, loading, paySearch, setPaySearch,
  payDate, setPayDate,
  expandedDays, setExpandedDays,
  handleConfirmOrder, confirmingId, confirmedId,
}: Props) {
  const todayStr = getToday();
  const paidOrders = orders.filter(o => o.paid);
  const bonumOrders = paidOrders.filter(o => !o.admin_confirmed);
  const totalRevenue = paidOrders.filter(o => (o.amount ?? 0) >= 1000).reduce((s, o) => s + (o.amount ?? 0), 0);

  const dateKey = (o: Order) => toUBDate((o.paid && o.paid_at) ? o.paid_at : o.created_at);

  // Build sorted list of unique dates that have PAID orders
  const availablePaidDates = Array.from(
    new Set(paidOrders.map(o => toUBDate(o.paid_at!)))
  ).sort((a, b) => b.localeCompare(a));

  const filtered = orders.filter(o => {
    if (payDate) {
      // Filter only paid orders by their paid_at date
      if (!o.paid || !o.paid_at) return false;
      if (toUBDate(o.paid_at) !== payDate) return false;
    }
    if (!paySearch) return true;
    return (
      o.email.toLowerCase().includes(paySearch.toLowerCase()) ||
      (o.analysis_result?.seasonName ?? '').toLowerCase().includes(paySearch.toLowerCase())
    );
  });

  const groups: { day: string; label: string; items: Order[] }[] = [];
  filtered.forEach(o => {
    const d = dateKey(o);
    if (!groups.length || groups[groups.length - 1].day !== d) {
      groups.push({ day: d, label: ubDayLabel(d), items: [] });
    }
    groups[groups.length - 1].items.push(o);
  });

  const toggle = (day: string) => setExpandedDays(prev => {
    const next = new Set(prev);
    if (next.has(day)) next.delete(day); else next.add(day);
    return next;
  });

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: 'Нийт орлого', value: `${totalRevenue.toLocaleString()}₮`, note: `${paidOrders.length} амжилттай захиалга`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Bonum төлбөр', value: String(bonumOrders.length), note: 'Бодит төлбөр', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Дуусаагүй захиалга', value: String(orders.filter(o => !o.paid).length), note: 'Төлбөр хийгдээгүй', color: 'text-slate-500', bg: 'bg-slate-50' },
        ].map(({ label, value, note, color, bg }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
              <CreditCard className={`h-4 w-4 ${color}`} strokeWidth={1.5} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">{note}</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 md:px-6 md:py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900">Захиалгын бүртгэл</h2>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600">{orders.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <input
                value={paySearch}
                onChange={e => setPaySearch(e.target.value)}
                placeholder="Имэйлээр хайх..."
                className={`w-full rounded-xl border bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:ring-2 ${
                  paySearch && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paySearch)
                    ? 'border-rose-300 focus:border-rose-300 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-violet-300 focus:ring-violet-100'
                }`}
              />
              <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              {paySearch && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paySearch) && (
                <p className="absolute left-0 top-full mt-1 text-[10px] text-rose-500">Буруу имэйл формат</p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
              >
                <option value="">Бүх өдрүүд</option>
                {availablePaidDates.map(d => {
                  const [, m, day] = d.split('-');
                  return (
                    <option key={d} value={d}>{m}/{day}</option>
                  );
                })}
              </select>
              {payDate && (
                <button
                  onClick={() => setPayDate('')}
                  className="rounded-lg bg-slate-100 px-2 py-2 text-xs text-slate-400 hover:bg-slate-200 transition-colors"
                >✕</button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...
          </div>
        ) : (
          <div>
            {groups.map(({ day, label, items }) => {
              const isToday = day === todayStr;
              const isOpen = isToday || expandedDays.has(day) || !!paySearch || !!payDate;
              const dayRevenue = items.filter(o => o.paid && (o.amount ?? 0) >= 1000).reduce((s, o) => s + (o.amount ?? 0), 0);
              return (
                <div key={day}>
                  <button
                    onClick={() => toggle(day)}
                    className="flex w-full items-center justify-between px-5 py-2.5 bg-slate-50 border-y border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-[11px] font-semibold text-slate-500 tracking-wide">
                      {isToday ? `Өнөөдөр — ${label}` : label}
                    </span>
                    <span className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="font-semibold text-emerald-600">{dayRevenue.toLocaleString()}₮</span>
                      {items.length} захиалга
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        {isToday && (
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                              {['#', 'Имэйл хаяг', 'Өнгөний төрөл', 'Дүн', 'Статус', 'Огноо', 'Үйлдэл', ''].map((h, i) => (
                                <th key={i} className={`px-5 py-2.5 text-left text-[11px] font-semibold text-slate-400 ${i === 3 ? 'text-right' : ''} ${i === 4 ? 'text-center' : ''}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        <tbody>
                          {items.map((o, idx) => (
                            <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                              <td className="px-5 py-3 text-xs text-slate-300 font-mono w-10">{idx + 1}</td>
                              <td className="px-5 py-3 text-sm font-medium text-slate-800">{o.email}</td>
                              <td className="px-5 py-3">
                                {o.analysis_result?.seasonName
                                  ? <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{o.analysis_result.seasonName}</span>
                                  : <span className="text-xs text-slate-300">—</span>}
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-sm text-slate-800">{(o.amount ?? 0).toLocaleString()}₮</td>
                              <td className="px-5 py-3 text-center">
                                {o.paid
                                  ? o.admin_confirmed
                                    ? <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"><CheckCircle className="h-3 w-3" strokeWidth={2.5} />Гараар</span>
                                    : <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-3 w-3" strokeWidth={2.5} />Bonum</span>
                                  : <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-500"><XCircle className="h-3 w-3" strokeWidth={2} />Дуусаагүй</span>}
                              </td>
                              <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">{o.paid && o.paid_at ? formatDate(o.paid_at) : formatDate(o.created_at)}</td>
                              <td className="px-5 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${o.email_sent_at ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                                    <Mail className="h-3 w-3" strokeWidth={2} />
                                    {o.email_sent_at ? formatDate(o.email_sent_at) : 'Имэйл илгээгүй'}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${o.pdf_downloaded_at ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                                    <Download className="h-3 w-3" strokeWidth={2} />
                                    {o.pdf_downloaded_at ? formatDate(o.pdf_downloaded_at) : 'Татаагүй'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center">
                                {!o.paid && (confirmedId === o.id
                                  ? <span className="text-xs text-emerald-600 font-semibold">✓ Илгээгдлээ</span>
                                  : <button onClick={() => handleConfirmOrder(o.id)} disabled={confirmingId === o.id} className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition disabled:opacity-50">{confirmingId === o.id ? '...' : 'Баталгаажуулах'}</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
