'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { QuestionnaireAnswers, NaturalHairColor } from '@/lib/personal-color/questionnaire';
import { isQuestionnaireComplete } from '@/lib/personal-color/questionnaire';

type PartialAnswers = Partial<QuestionnaireAnswers>;

interface Props {
  answers: PartialAnswers;
  onChange: (next: PartialAnswers) => void;
}

// ── Hair color swatches ───────────────────────────────────────────────────────

const HAIR_COLORS: { value: NaturalHairColor; label: string; swatch: string }[] = [
  { value: 'black',        label: 'Хар',            swatch: '#1A1008' },
  { value: 'dark_brown',   label: 'Харлуу хүрэн',   swatch: '#3B2314' },
  { value: 'medium_brown', label: 'Хүрэн',           swatch: '#7B4F2E' },
  { value: 'light_brown',  label: 'Цайвар хүрэн',   swatch: '#A07850' },
  { value: 'blonde',       label: 'Шаргал / Алтан', swatch: '#C8A046' },
  { value: 'auburn',       label: 'Улаан / Буурцаг', swatch: '#8B3A22' },
];

// ── Shared button ─────────────────────────────────────────────────────────────

function OptionBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-all ${
        active
          ? 'border-violet-400 bg-violet-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40'
      }`}
    >
      {children}
      {active && <span className="text-[9px] font-bold text-violet-500">✓</span>}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Questionnaire({ answers, onChange }: Props) {
  const complete = isQuestionnaireComplete(answers);
  const totalSteps = answers.hairDyed === 'yes' ? 5 : 4;
  const doneSteps  = [
    answers.vein,
    answers.hairDyed,
    answers.hairDyed === 'yes' ? answers.naturalHairColor : 'skip',
    answers.contrast,
    answers.sunReaction,
  ].filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Нэмэлт мэдээлэл
        </p>
        <span className={`text-[11px] font-semibold ${complete ? 'text-emerald-500' : 'text-slate-400'}`}>
          {complete ? '✓ Бүрэн' : `${doneSteps}/${totalSteps}`}
        </span>
      </div>

      {/* Q1: Vein color */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">
          Гарынхаа дотор талыг харна уу. Венийн өнгө ямар вэ?
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: 'blue_green' as const, label: 'Хөх / Ногоон',  swatch: '#6EA8D8' },
            { value: 'purple_red' as const, label: 'Нил / Улаавтар', swatch: '#9966BB' },
            { value: 'both'       as const, label: 'Хоёулаа',        swatch: '#8899AA' },
          ].map(o => (
            <OptionBtn key={o.value} active={answers.vein === o.value}
              onClick={() => onChange({ ...answers, vein: o.value })}>
              <span className="block h-5 w-5 rounded-full border border-white shadow-sm ring-1 ring-black/10"
                    style={{ backgroundColor: o.swatch }} />
              <span className={`text-[10px] font-medium leading-tight ${answers.vein === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                {o.label}
              </span>
            </OptionBtn>
          ))}
        </div>
      </div>

      {/* Q2a: Hair dyed? */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">
          Үсэндээ будаг хийлгэсэн үү?
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { value: 'yes' as const, label: 'Тийм', icon: '🎨' },
            { value: 'no'  as const, label: 'Үгүй', icon: '✨' },
          ].map(o => (
            <OptionBtn key={o.value} active={answers.hairDyed === o.value}
              onClick={() => {
                const next: PartialAnswers = { ...answers, hairDyed: o.value };
                if (o.value === 'no') delete next.naturalHairColor;
                onChange(next);
              }}>
              <span className="text-base leading-none">{o.icon}</span>
              <span className={`text-[10px] font-medium ${answers.hairDyed === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                {o.label}
              </span>
            </OptionBtn>
          ))}
        </div>
      </div>

      {/* Q2b: Natural hair color (conditional) */}
      <AnimatePresence>
        {answers.hairDyed === 'yes' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <p className="text-xs font-medium text-slate-600">
              Будаагүй үедээ үсний байгалийн өнгө ямар байсан бэ?
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {HAIR_COLORS.map(o => (
                <OptionBtn key={o.value} active={answers.naturalHairColor === o.value}
                  onClick={() => onChange({ ...answers, naturalHairColor: o.value })}>
                  <span className="block h-5 w-5 rounded-full border border-white shadow-sm ring-1 ring-black/10"
                        style={{ backgroundColor: o.swatch }} />
                  <span className={`text-[10px] font-medium leading-tight ${answers.naturalHairColor === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                    {o.label}
                  </span>
                </OptionBtn>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Q3: Contrast */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">
          Таны арьс, үс, нүдний өнгө хоорондоо хэр ялгаатай вэ?
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: 'high'   as const, label: 'Маш ялгаатай',    icon: '◼◻' },
            { value: 'medium' as const, label: 'Дундаж',           icon: '▪▫' },
            { value: 'low'    as const, label: 'Ойролцоо өнгөтэй', icon: '▫▫' },
          ].map(o => (
            <OptionBtn key={o.value} active={answers.contrast === o.value}
              onClick={() => onChange({ ...answers, contrast: o.value })}>
              <span className="text-base leading-none">{o.icon}</span>
              <span className={`text-[10px] font-medium leading-tight ${answers.contrast === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                {o.label}
              </span>
            </OptionBtn>
          ))}
        </div>
      </div>

      {/* Q4: Sun reaction */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">
          Нарны туяанд удаан байвал таны арьс:
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: 'burns' as const, label: 'Амархан түлэгддэг, бараг борлодоггүй',         icon: '🔴' },
            { value: 'mixed' as const, label: 'Эхлээд түлэгдэж улайгаад, дараа нь борлодог', icon: '🟡' },
            { value: 'tans'  as const, label: 'Хурдан борлодог, бараг түлэгддэггүй',          icon: '🟤' },
          ].map(o => (
            <OptionBtn key={o.value} active={answers.sunReaction === o.value}
              onClick={() => onChange({ ...answers, sunReaction: o.value })}>
              <span className="text-base leading-none">{o.icon}</span>
              <span className={`text-[10px] font-medium leading-tight ${answers.sunReaction === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                {o.label}
              </span>
            </OptionBtn>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-violet-400"
          initial={{ width: 0 }}
          animate={{ width: `${(doneSteps / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
