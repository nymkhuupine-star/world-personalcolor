'use client';

import { CheckCircle, XCircle, Loader2, Users, ChevronDown } from 'lucide-react';
import type { Analysis } from '../types';
import { toUBDate, ubDayLabel, formatDate, today as getToday } from '../utils';

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

type Props = {
  analyses: Analysis[];
  loading: boolean;
  regSearch: string;
  setRegSearch: (v: string) => void;
  expandedDays: Set<string>;
  setExpandedDays: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export default function RegistrationsSection({
  analyses, loading, regSearch, setRegSearch, expandedDays, setExpandedDays,
}: Props) {
  const todayStr = getToday();

  const filtered = analyses.filter(a =>
    !regSearch ||
    a.email.toLowerCase().includes(regSearch.toLowerCase()) ||
    a.sub_type?.toLowerCase().includes(regSearch.toLowerCase())
  );

  const groups: { day: string; label: string; items: Analysis[] }[] = [];
  filtered.forEach(a => {
    const d = toUBDate(a.created_at);
    if (!groups.length || groups[groups.length - 1].day !== d) {
      groups.push({ day: d, label: ubDayLabel(d), items: [] });
    }
    groups[groups.length - 1].items.push(a);
  });

  const toggle = (day: string) => setExpandedDays(prev => {
    const next = new Set(prev);
    if (next.has(day)) next.delete(day); else next.add(day);
    return next;
  });

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 md:px-6 md:py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-slate-900">Шинжилгээний бүртгэл</h2>
          <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600">
            {analyses.length}
          </span>
        </div>
        <div className="relative w-full sm:w-56">
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
        <div>
          {groups.map(({ day, label, items }) => {
            const isToday = day === todayStr;
            const isOpen = isToday || expandedDays.has(day);
            return (
              <div key={day}>
                <button
                  onClick={() => toggle(day)}
                  className="flex w-full items-center justify-between px-5 py-2.5 bg-slate-50 border-y border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-[11px] font-semibold text-slate-500 tracking-wide">
                    {isToday ? `Өнөөдөр — ${label}` : label}
                  </span>
                  <span className="flex items-center gap-2 text-[11px] text-slate-400">
                    {items.length} бүртгэл
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
                  </span>
                </button>
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      {isToday && (
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            {['#', 'Имэйл хаяг', 'Өнгөний төрөл', 'Огноо', 'Төлбөр', 'Имэйл'].map((h, i) => (
                              <th key={h} className={`px-5 py-2.5 text-left text-[11px] font-semibold text-slate-400 ${i >= 4 ? 'text-center' : ''}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {items.map((a, idx) => (
                          <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3 text-xs text-slate-300 font-mono w-10">{idx + 1}</td>
                            <td className="px-5 py-3 text-sm font-medium text-slate-800">{a.email}</td>
                            <td className="px-5 py-3">
                              {a.season
                                ? <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{a.sub_type || SEASON_MN[a.season] || a.season}</span>
                                : <span className="text-xs text-slate-300">—</span>}
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(a.created_at)}</td>
                            <td className="px-5 py-3 text-center">
                              {a.paid
                                ? <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-3 w-3" strokeWidth={2.5} />Төлсөн</span>
                                : <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-400"><XCircle className="h-3 w-3" strokeWidth={2} />Үгүй</span>}
                            </td>
                            <td className="px-5 py-3 text-center">
                              {a.email_sent
                                ? <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600"><CheckCircle className="h-3 w-3" strokeWidth={2.5} />Илгээсэн</span>
                                : <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-500"><XCircle className="h-3 w-3" strokeWidth={2} />Үгүй</span>}
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
  );
}
