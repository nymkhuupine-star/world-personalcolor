'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SignInButton } from '@clerk/nextjs';
import { X, Sparkles } from 'lucide-react';

type AnalysisResult = {
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  subType: string;
  reasoning: string;
  recommendedColors: string[];
};

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

const SEASON_GRADIENT: Record<string, string> = {
  Spring: 'from-rose-400 to-pink-300',
  Summer: 'from-violet-400 to-purple-300',
  Autumn: 'from-amber-400 to-orange-300',
  Winter: 'from-sky-400 to-blue-300',
};

type Props = {
  result: AnalysisResult;
  onDismiss: () => void;
};

export default function HookModal({ result, onDismiss }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-3xl border border-white/60 bg-white shadow-2xl shadow-black/10 overflow-hidden"
        >
          {/* Gradient top banner */}
          <div className={`h-2 w-full bg-gradient-to-r ${SEASON_GRADIENT[result.season]}`} />

          <div className="p-7">
            {/* Close */}
            <button
              onClick={onDismiss}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${SEASON_GRADIENT[result.season]}`}>
                <Sparkles className="h-4 w-4 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Таны өнгө тодорхойлогдлоо 🎉</p>
              </div>
            </div>

            {/* Result preview */}
            <div className="mb-5 rounded-2xl bg-slate-50 p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Улирал</p>
                <p className="text-lg font-bold text-slate-900">
                  {SEASON_MN[result.season]}
                  <span className="ml-2 text-sm font-normal text-slate-400">— {result.subType}</span>
                </p>
              </div>
              <div className="flex gap-2">
                {result.recommendedColors.map((color) => (
                  <div
                    key={color}
                    className="h-8 w-8 rounded-full border-2 border-white shadow-md ring-1 ring-black/5"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <p className="text-xs leading-relaxed text-slate-500 line-clamp-2">{result.reasoning}</p>
            </div>

            {/* Hook message */}
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Үр дүнгээ хадгалж, дараа  ньнь хүссэн үедээ нэвтэрч харахыг хүсвэл{' '}
              <span className="font-semibold text-slate-900">бүртгүүлнэ үү.</span>{' '}
              Нэвтэрсний дараа таны хариулт автоматаар хадгалагдаж, имэйлээр PDF тайлан илгээгдэнэ.
            </p>

            {/* CTA */}
            <SignInButton mode="modal" forceRedirectUrl="/">
              <button className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:scale-[1.02] hover:shadow-violet-300 active:scale-[0.98]">
                Нэвтрэх / Бүртгүүлэх
              </button>
            </SignInButton>

            <button
              onClick={onDismiss}
              className="mt-3 w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Дараа нь
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
