'use client';

import { motion } from 'framer-motion';
import { Upload, ScanLine, CreditCard, Mail } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Зургаа оруулах',
    description: 'Байгалийн гэрэлд авсан, нүүр будалтгүй, хөрөг зураг болон имэйл хаягаа оруулна.',
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    ring: 'ring-violet-100',
    gradStart: '#8b5cf6',
    gradEnd: '#7c3aed',
  },
  {
    icon: ScanLine,
    title: 'Сканнердах ба оношлох',
    description: 'Манай систем таны арьсны туяа, үс, нүдний өнгөний пигментийг нарийвчлан шинжилнэ.',
    color: 'from-fuchsia-500 to-pink-500',
    bg: 'bg-fuchsia-50',
    ring: 'ring-fuchsia-100',
    gradStart: '#d946ef',
    gradEnd: '#ec4899',
  },
  {
    icon: CreditCard,
    title: 'Төлбөр төлөх',
    description: 'QPay болон бусад цахим төлбөрийн хэрэгслээр үйлчилгээний төлбөрөө найдвартай төлнө.',
    color: 'from-sky-500 to-blue-500',
    bg: 'bg-sky-50',
    ring: 'ring-sky-100',
    gradStart: '#0ea5e9',
    gradEnd: '#3b82f6',
  },
  {
    icon: Mail,
    title: 'Тайлангаа имэйлээр авах',
    description: 'Өнгөний палитр, хувцаслалтын дэлгэрэнгүй зөвлөмжийг таны имэйл рүү хэдхэн секундэд илгээнэ.',
    color: 'from-rose-500 to-orange-400',
    bg: 'bg-rose-50',
    ring: 'ring-rose-100',
    gradStart: '#f43f5e',
    gradEnd: '#fb923c',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: 'easeOut' as const },
  }),
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-500">
            Хэрхэн ажилладаг вэ
          </p>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Хувийн өнгөө тодорхойлох 4 хялбар алхам
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* connector line */}
          <div className="absolute top-10 left-[12%] right-[12%] hidden h-px bg-gradient-to-r from-violet-200 via-fuchsia-200 via-sky-200 to-rose-200 lg:block" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center"
              >
                {/* icon */}
                <div
                  className={`relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-2xl ${step.bg} ring-8 ${step.ring} shadow-sm`}
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-10`} />
                  <Icon
                    strokeWidth={1.5}
                    className="relative h-8 w-8"
                    style={{ stroke: `url(#grad${i})` }}
                  />
                  <svg width="0" height="0" className="absolute">
                    <defs>
                      <linearGradient id={`grad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={step.gradStart} />
                        <stop offset="100%" stopColor={step.gradEnd} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${step.color} text-[10px] font-bold text-white shadow`}>
                    {i + 1}
                  </span>
                </div>

                <h3 className="mb-2 text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
