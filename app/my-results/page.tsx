'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Calendar, CheckCircle } from 'lucide-react';
import Header from '../components/Header';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type UserAnalysis = {
  id: string;
  season: string;
  sub_type: string;
  reasoning: string;
  recommended_colors: string[];
  image_path: string;
  created_at: string;
};

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

const SEASON_STYLE: Record<string, { gradient: string; bg: string; text: string }> = {
  Spring:  { gradient: 'from-rose-400 to-pink-300',    bg: 'bg-rose-50',   text: 'text-rose-600' },
  Summer:  { gradient: 'from-violet-400 to-purple-300', bg: 'bg-violet-50', text: 'text-violet-600' },
  Autumn:  { gradient: 'from-amber-400 to-orange-300',  bg: 'bg-amber-50',  text: 'text-amber-600' },
  Winter:  { gradient: 'from-sky-400 to-blue-300',      bg: 'bg-sky-50',    text: 'text-sky-600' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleString('mn-MN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function MyResultsPage() {
  const { user, isLoaded } = useUser();
  const [analyses, setAnalyses] = useState<UserAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    supabase
      .from('user_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setAnalyses(data as UserAnalysis[]);
        setLoading(false);
      });
  }, [isLoaded, user]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Нүүр хуудас руу буцах
        </Link>

        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-slate-900 mb-1">Миний үр дүн</h1>
          <p className="text-slate-400 text-sm">
            {user?.firstName ? `${user.firstName}-ийн` : 'Таны'} хувийн өнгөний шинжилгээний түүх
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-300 text-sm">
            Уншиж байна...
          </div>
        ) : analyses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Sparkles className="h-7 w-7 text-slate-300" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-slate-600 font-semibold">Одоохондоо үр дүн байхгүй байна</p>
              <p className="text-slate-400 text-sm mt-1">Нүүр хуудас руу буцаж зургаа оруулаарай</p>
            </div>
            <Link href="/" className="mt-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow hover:scale-105 transition-transform">
              Шинжилгээ эхлүүлэх
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {analyses.map((a, i) => {
              const style = SEASON_STYLE[a.season] ?? SEASON_STYLE.Spring;
              const colors = Array.isArray(a.recommended_colors) ? a.recommended_colors : [];
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden"
                >
                  <div className={`h-1.5 w-full bg-gradient-to-r ${style.gradient}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.bg}`}>
                          <Sparkles className={`h-5 w-5 ${style.text}`} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className={`text-base font-bold ${style.text}`}>
                            {SEASON_MN[a.season] ?? a.season}
                          </p>
                          <p className="text-xs text-slate-400">{a.sub_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {formatDate(a.created_at)}
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-600 mb-4">{a.reasoning}</p>

                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        {colors.map((color) => (
                          <div
                            key={color}
                            className="h-7 w-7 rounded-full border-2 border-white shadow-md ring-1 ring-black/5"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <span className="ml-auto flex items-center gap-1 text-xs text-emerald-500 font-medium">
                        <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                        Хадгалагдсан
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
