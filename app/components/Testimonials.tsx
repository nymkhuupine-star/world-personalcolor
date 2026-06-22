'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Content Creator',
    content: 'I was shocked to realize I had been wearing makeup colors that didn\'t suit me at all. Since getting my analysis, choosing beauty products and clothes has become so much easier and more exciting!',
    stars: 5,
    season: 'Spring',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    name: 'Brandon T.',
    role: 'Digital Marketer',
    content: 'The analysis is incredibly precise and accurate. It pinpointed my personal coloring exactly and delivered such a clear, helpful report. Thank you so much!',
    stars: 5,
    season: 'Winter',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'Diana K.',
    role: 'Fashion Stylist',
    content: 'I never thought discovering my personal color could be this easy and fast. The website design is beautiful and the service is incredibly user-friendly.',
    stars: 5,
    season: 'Summer',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
];

const SEASON_COLOR: Record<string, string> = {
  'Spring': 'bg-rose-50 text-rose-600',
  'Summer': 'bg-violet-50 text-violet-600',
  'Autumn': 'bg-amber-50 text-amber-600',
  'Winter': 'bg-sky-50 text-sky-600',
};

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.05,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 56 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Testimonials() {
  return (
    <section className="py-28 bg-pink-100/100">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Customer Stories
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900">
            Real <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">results</em>
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={cardVariant}
              className="flex flex-col rounded-2xl border border-slate-100/80 bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
            >
              <Quote className="h-6 w-6 text-slate-200 mb-4" strokeWidth={1.5} />

              <div className="flex gap-1 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
                ))}
              </div>

              <p className="text-sm leading-relaxed text-slate-600 flex-1 mb-6">
                &ldquo;{t.content}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="h-10 w-10 rounded-full overflow-hidden shadow-sm flex-shrink-0">
                  <Image src={t.avatar} alt={t.name} width={40} height={40} className="object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${SEASON_COLOR[t.season]}`}>
                  {t.season}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 grid grid-cols-3 gap-4 rounded-3xl border border-slate-100 bg-white p-10 shadow-sm"
        >
          {[
            { value: '1,000+', label: 'Analyses Completed' },
            { value: '98%', label: 'Satisfaction Rate' },
            { value: '4.9★', label: 'Average Rating' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-serif text-5xl font-bold text-violet-600">{value}</p>
              <p className="mt-2 text-sm font-medium text-slate-400">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
