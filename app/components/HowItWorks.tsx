'use client';

import { motion } from 'framer-motion';
import { Upload, ScanLine, CreditCard, Mail } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Your Photo',
    description: 'A close-up portrait in natural light, plus your email address.',
    dot: '#f97316',
    valley: true,
  },
  {
    icon: CreditCard,
    title: 'Make Payment',
    description: 'Pay securely with Stripe, PayPal, or any major card.',
    dot: '#14b8a6',
    valley: false,
  },
  {
    icon: ScanLine,
    title: 'Scan & Analyze',
    description: 'We read your skin, hair, and eye color pigments.',
    dot: '#ec4899',
    valley: true,
  },
  {
    icon: Mail,
    title: 'Receive Your Report',
    description: 'Your palette and style guide, emailed within 24 hours.',
    dot: '#8b5cf6',
    valley: false,
  },
];

// Points the road passes through — viewBox is 1100 x 380, valleys sit low (y=280), peaks sit high (y=100).
const points = [
  { x: 90, y: 280 },
  { x: 400, y: 100 },
  { x: 720, y: 280 },
  { x: 1010, y: 100 },
];

const roadPath = `M${points[0].x},${points[0].y} ` +
  points.slice(1).map((p, i) => {
    const prev = points[i];
    const midX = (prev.x + p.x) / 2;
    return `C${midX},${prev.y} ${midX},${p.y} ${p.x},${p.y}`;
  }).join(' ');

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
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

        {/* Winding road — desktop only */}
        <div className="relative hidden lg:block" style={{ aspectRatio: '1100 / 380' }}>
          <svg
            viewBox="0 0 1100 380"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <filter id="road-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.14" />
              </filter>
            </defs>

            {/* the ribbon */}
            <motion.path
              d={roadPath}
              fill="none"
              stroke="#F9D0E4"
              strokeWidth="34"
              strokeLinecap="round"
              filter="url(#road-shadow)"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* step markers — dark ring + colored center dot, sitting on the ribbon */}
            {points.map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r="13" fill="#1e293b" />
                <circle cx={pt.x} cy={pt.y} r="6" fill={steps[i].dot} />
              </g>
            ))}
          </svg>

          {steps.map((step, i) => {
            const Icon = step.icon;
            const pt = points[i];
            const leftPct = (pt.x / 1100) * 100;
            const topPct = (pt.y / 380) * 100;
            return (
              // Plain positioning wrapper — centers the point on the road via translate(-50%,-50%).
              // The fade/slide-in animation lives on the motion.div *inside* it instead of here,
              // because framer-motion's animated `y` would otherwise overwrite this transform.
              <div
                key={i}
                className="absolute"
                style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: 'translate(-50%, -50%)' }}
              >
                <motion.div
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  variants={fadeUp}
                  className={`absolute left-1/2 w-52 -translate-x-1/2 text-left ${
                    step.valley ? 'bottom-full mb-6' : 'top-full mt-6'
                  }`}
                >
                  <Icon className="mb-2 h-5 w-5" strokeWidth={1.75} style={{ color: step.dot }} />
                  <p className="mb-1 text-sm font-extrabold tracking-wide text-slate-900">
                    STEP <span style={{ color: step.dot }}>0{i + 1}</span>
                  </p>
                  <h3 className="mb-1 text-sm font-bold text-slate-800">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-500">{step.description}</p>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Stacked list — mobile / tablet */}
        <div className="grid gap-8 sm:grid-cols-2 lg:hidden">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                className="flex items-start gap-4"
              >
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Icon className="h-6 w-6" strokeWidth={1.75} style={{ color: step.dot }} />
                  <span
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: step.dot }}
                  >
                    {i + 1}
                  </span>
                </div>
                <div>
                  <p className="mb-0.5 text-[11px] font-extrabold tracking-wide" style={{ color: step.dot }}>
                    STEP 0{i + 1}
                  </p>
                  <h3 className="mb-1 text-sm font-bold text-slate-900">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-500">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
