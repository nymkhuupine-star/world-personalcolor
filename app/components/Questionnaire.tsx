'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuestionnaireAnswers, NaturalHairColor, EyeColor } from '@/lib/personal-color/questionnaire';

type PartialAnswers = Partial<QuestionnaireAnswers>;

interface Props {
  answers: PartialAnswers;
  onChange: (next: PartialAnswers) => void;
}

const HAIR_COLORS: { value: NaturalHairColor; label: string; swatch: string }[] = [
  { value: 'black',        label: 'Black',       swatch: '#1A1008' },
  { value: 'dark_brown',   label: 'Dark Brown',  swatch: '#3B2314' },
  { value: 'medium_brown', label: 'Brown',       swatch: '#7B4F2E' },
  { value: 'light_brown',  label: 'Light Brown', swatch: '#A07850' },
  { value: 'blonde',       label: 'Blonde',      swatch: '#C8A046' },
];

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
    </button>
  );
}

const EYE_COLORS: { value: EyeColor; label: string; swatch: string }[] = [
  { value: 'black',       label: 'Black',       swatch: '#1A1008' },
  { value: 'dark_brown',  label: 'Dark Brown',  swatch: '#3B2314' },
  { value: 'light_brown', label: 'Light Brown', swatch: '#8B5E3C' },
  { value: 'green',       label: 'Green',       swatch: '#4A7C59' },
  { value: 'grey',        label: 'Grey',        swatch: '#7A8899' },
  { value: 'blue',        label: 'Blue',        swatch: '#4A7AB5' },
];

type StepKey = 'gender' | 'vein' | 'hairDyed' | 'naturalHairColor' | 'eyeColor' | 'jewelryPreference';

function getSteps(answers: PartialAnswers): StepKey[] {
  const steps: StepKey[] = ['gender'];
  if (answers.gender !== 'male') {
    steps.push('vein', 'hairDyed');
    if (answers.hairDyed === 'yes') steps.push('naturalHairColor');
    steps.push('eyeColor', 'jewelryPreference');
  }
  return steps;
}

export default function Questionnaire({ answers, onChange }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dir, setDir] = useState(1);

  const steps = getSteps(answers);
  const safeStep = Math.min(currentStep, steps.length - 1);
  const currentKey = steps[safeStep];
  const totalSteps = steps.length;
  const isLast = safeStep >= totalSteps - 1;

  const goBack = () => {
    if (safeStep > 0) {
      setDir(-1);
      setCurrentStep(s => Math.max(s - 1, 0));
    }
  };

  const pick = (next: PartialAnswers) => {
    onChange(next);
    if (!isLast) {
      setTimeout(() => {
        setDir(1);
        setCurrentStep(s => s + 1);
      }, 180);
    }
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 24 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -24 }),
  };

  const renderStep = (key: StepKey) => {
    switch (key) {
      case 'gender':
        return (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-slate-600">Who are you?</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'female' as const, label: 'Female', icon: '👩' },
                { value: 'male'   as const, label: 'Male',   icon: '👨' },
              ].map(o => (
                <OptionBtn key={o.value} active={answers.gender === o.value}
                  onClick={() => pick({ ...answers, gender: o.value })}>
                  <span className="text-xl leading-none">{o.icon}</span>
                  <span className={`text-[10px] font-medium ${answers.gender === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                    {o.label}
                  </span>
                </OptionBtn>
              ))}
            </div>
          </div>
        );

      case 'vein':
        return (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-slate-600">
              Look at the veins on the inside of your wrist. What color do they appear?
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'blue_green' as const, label: 'Blue / Green',    swatch: '#6EA8D8' },
                { value: 'purple_red' as const, label: 'Purple / Red',    swatch: '#9966BB' },
                { value: 'both'       as const, label: 'Both',            swatch: '#8899AA' },
              ].map(o => (
                <OptionBtn key={o.value} active={answers.vein === o.value}
                  onClick={() => pick({ ...answers, vein: o.value })}>
                  <span className="block h-5 w-5 rounded-full border border-white shadow-sm ring-1 ring-black/10"
                        style={{ backgroundColor: o.swatch }} />
                  <span className={`text-[10px] font-medium leading-tight ${answers.vein === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                    {o.label}
                  </span>
                </OptionBtn>
              ))}
            </div>
          </div>
        );

      case 'hairDyed':
        return (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-slate-600">
              Have you dyed your hair?
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'yes' as const, label: 'Yes', icon: '🎨' },
                { value: 'no'  as const, label: 'No',  icon: '✨' },
              ].map(o => (
                <OptionBtn key={o.value} active={answers.hairDyed === o.value}
                  onClick={() => {
                    const next: PartialAnswers = { ...answers, hairDyed: o.value };
                    if (o.value === 'no') delete next.naturalHairColor;
                    pick(next);
                  }}>
                  <span className="text-base leading-none">{o.icon}</span>
                  <span className={`text-[10px] font-medium ${answers.hairDyed === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                    {o.label}
                  </span>
                </OptionBtn>
              ))}
            </div>
          </div>
        );

      case 'naturalHairColor':
        return (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-slate-600">
              What was your natural hair color before dyeing?
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {HAIR_COLORS.map(o => (
                <OptionBtn key={o.value} active={answers.naturalHairColor === o.value}
                  onClick={() => pick({ ...answers, naturalHairColor: o.value })}>
                  <span className="block h-7 w-7 rounded-full border-2 border-white shadow ring-1 ring-black/10"
                        style={{ backgroundColor: o.swatch }} />
                  <span className={`text-[10px] font-medium leading-tight ${answers.naturalHairColor === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                    {o.label}
                  </span>
                </OptionBtn>
              ))}
            </div>
          </div>
        );

      case 'eyeColor':
        return (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-slate-600">
              What is your eye color?
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {EYE_COLORS.map(o => (
                <OptionBtn key={o.value} active={answers.eyeColor === o.value}
                  onClick={() => pick({ ...answers, eyeColor: o.value })}>
                  <span className="block h-7 w-7 rounded-full border-2 border-white shadow ring-1 ring-black/10"
                        style={{ backgroundColor: o.swatch }} />
                  <span className={`text-[10px] font-medium leading-tight ${answers.eyeColor === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                    {o.label}
                  </span>
                </OptionBtn>
              ))}
            </div>
          </div>
        );

      case 'jewelryPreference':
        return (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-slate-600">
              Which suits you better — gold or silver jewelry?
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'gold'   as const, label: 'Gold',    swatch: 'linear-gradient(135deg,#F5C842,#D4A017,#F5C842)' },
                { value: 'silver' as const, label: 'Silver',  swatch: 'linear-gradient(135deg,#D8D8D8,#A0A0A0,#D8D8D8)' },
                { value: 'both'   as const, label: 'Both',    swatch: 'linear-gradient(135deg,#F5C842 0%,#F5C842 50%,#D8D8D8 50%,#D8D8D8 100%)' },
                { value: 'unsure' as const, label: 'Not sure', swatch: 'linear-gradient(135deg,#E2E8F0,#CBD5E1)' },
              ].map(o => (
                <OptionBtn key={o.value} active={answers.jewelryPreference === o.value}
                  onClick={() => pick({ ...answers, jewelryPreference: o.value })}>
                  <span
                    className="block h-7 w-7 rounded-full border-2 border-white shadow ring-1 ring-black/10"
                    style={{ background: o.swatch }}
                  />
                  <span className={`text-[10px] font-medium leading-tight ${answers.jewelryPreference === o.value ? 'text-violet-700' : 'text-slate-600'}`}>
                    {o.label}
                  </span>
                </OptionBtn>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {safeStep > 0 && (
            <button type="button" onClick={goBack}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
              ← Back
            </button>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Additional Info
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          {safeStep + 1}/{totalSteps}
        </span>
      </div>

      {/* Animated question — one at a time */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={currentKey}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderStep(currentKey)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-violet-400"
          animate={{ width: `${((safeStep + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
