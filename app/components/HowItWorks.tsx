'use client';

import { motion } from 'framer-motion';
import { Upload, ScanLine, CreditCard, Mail } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Photo',
    description: 'Upload a close-up portrait taken in natural light, without makeup, along with your email address.',
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    ring: 'ring-violet-100',
    gradStart: '#8b5cf6',
    gradEnd: '#7c3aed',
  },
  {
    icon: CreditCard,
    title: 'Make Payment',
    description: 'Securely pay for the service using Stripe, PayPal, or any major credit card.',
    color: 'from-fuchsia-500 to-pink-500',
    bg: 'bg-fuchsia-50',
    ring: 'ring-fuchsia-100',
    gradStart: '#d946ef',
    gradEnd: '#ec4899',
  },
  {
    icon: ScanLine,
    title: 'Scan & Analyze',
    description: 'Our system precisely analyzes your skin tone, hair, and eye color pigments.',
    color: 'from-sky-500 to-blue-500',
    bg: 'bg-sky-50',
    ring: 'ring-sky-100',
    gradStart: '#0ea5e9',
    gradEnd: '#3b82f6',
  },
  {
    icon: Mail,
    title: 'Receive Your Report by Email',
    description: 'Your personalized color palette and detailed style guide will be sent to your email within 24 hours.',
    color: 'from-rose-500 to-orange-400',
    bg: 'bg-rose-50',
    ring: 'ring-rose-100',
    gradStart: '#f43f5e',
    gradEnd: '#fb923c',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 52 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-40 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-20 text-center"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            How It Works
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900">
            Discover your personal color in{' '}
            <em className="italic text-violet-600">4</em>{' '}
            <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">simple steps</em>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative grid gap-14 sm:grid-cols-2 lg:grid-cols-4">
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
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center pt-6"
              >
                {/* icon */}
                <div
                  className={`relative z-10 mb-8 flex h-20 w-20 items-center justify-center rounded-2xl ${step.bg} ring-8 ${step.ring} shadow-sm`}
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

                <h3 className="mb-3 text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 px-2">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
