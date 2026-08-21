'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Image from 'next/image';

type Testimonial = {
  name: string;
  season: string;
  content: string;
  avatar: string;
  bg: string;
};

const topRow: Testimonial[] = [
  {
    name: 'Olivia Richardson',
    season: 'Light Spring',
    content: 'I finally stopped second-guessing every color in my closet. Everything just makes sense now.',
    avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
    bg: '#FFD9D2',
  },
  {
    name: 'Sophia Mitchell',
    season: 'Cool Winter',
    content: 'The palette they gave me matched my skin tone perfectly. Shopping feels effortless now.',
    avatar: 'https://randomuser.me/api/portraits/women/23.jpg',
    bg: '#E4D9FF',
  },
  {
    name: 'Aisha Khan',
    season: 'Soft Autumn',
    content: 'I never knew warm tones could suit me this well. My makeup routine is so much easier.',
    avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
    bg: '#FFF3C4',
  },
  {
    name: 'Emily Sanders',
    season: 'True Summer',
    content: 'This changed how I shop completely. I only buy things I know I\'ll actually wear now.',
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    bg: '#D7F2DA',
  },
  {
    name: 'Priya Deshmukh',
    season: 'Bright Spring',
    content: 'Such a simple process but the results were spot on. I finally understand my undertone.',
    avatar: 'https://randomuser.me/api/portraits/women/56.jpg',
    bg: '#D3EBFF',
  },
];

const bottomRow: Testimonial[] = [
  {
    name: 'Mia Lawrence',
    season: 'Dark Winter',
    content: 'I\'m obsessed with my results! Every recommendation felt accurate and so easy to use.',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    bg: '#F3D9FF',
  },
  {
    name: 'Grace Turner',
    season: 'True Autumn',
    content: 'My closet finally makes sense. I know exactly what to buy and what to skip now.',
    avatar: 'https://randomuser.me/api/portraits/women/71.jpg',
    bg: '#FFD9EC',
  },
  {
    name: 'Hannah Wells',
    season: 'Light Summer',
    content: 'The color breakdown was so detailed and easy to follow. Honestly worth every penny.',
    avatar: 'https://randomuser.me/api/portraits/women/82.jpg',
    bg: '#FFD9D2',
  },
  {
    name: 'Chloe Bennett',
    season: 'Dark Autumn',
    content: 'I\'ve recommended this to all my friends. It genuinely changed how I get dressed.',
    avatar: 'https://randomuser.me/api/portraits/women/90.jpg',
    bg: '#E4D9FF',
  },
  {
    name: 'Zara Nasser',
    season: 'Bright Winter',
    content: 'Fast, accurate, and so easy to use. I finally feel confident picking my own colors.',
    avatar: 'https://randomuser.me/api/portraits/women/19.jpg',
    bg: '#FFF3C4',
  },
];

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div
      className="flex w-[300px] shrink-0 flex-col gap-4 rounded-3xl p-6 shadow-sm sm:w-[340px]"
      style={{ backgroundColor: t.bg }}
    >
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, j) => (
          <Star key={j} className="h-3.5 w-3.5 fill-slate-900/70 text-slate-900/70" strokeWidth={0} />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-slate-800">&ldquo;{t.content}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 shadow-sm">
          <Image src={t.avatar} alt={t.name} width={40} height={40} className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{t.name}</p>
          <p className="text-xs text-slate-600">{t.season}</p>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ items, direction }: { items: Testimonial[]; direction: 'left' | 'right' }) {
  const doubled = [...items, ...items];
  return (
    <div
      className="overflow-hidden"
      style={{
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
      }}
    >
      <div className={`flex w-max gap-5 ${direction === 'left' ? 'marquee-left' : 'marquee-right'}`}>
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-28" style={{ backgroundColor: '#FFF7FA' }}>
      <div className="mx-auto max-w-2xl px-6 text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Real Stories, Real Colors
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900">
            Loved by people who found{' '}
            <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">their colors</em>
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            See how discovering the right colors made everyday choices simpler and easier.
          </p>
        </motion.div>
      </div>

      <div className="space-y-5">
        <MarqueeRow items={topRow} direction="right" />
        <MarqueeRow items={bottomRow} direction="left" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-2xl border border-slate-100 bg-white px-8 py-5"
        >
          <span className="text-sm text-slate-600">
            <strong className="font-bold text-slate-900">1,000+</strong> analyses
          </span>
          <span className="hidden text-slate-400 sm:inline">•</span>
          <span className="text-sm text-slate-600">
            <strong className="font-bold text-slate-900">4.9/5</strong> average rating
          </span>
          <span className="hidden text-slate-400 sm:inline">•</span>
          <span className="text-sm text-slate-600">
            <strong className="font-bold text-slate-900">98%</strong> satisfied customers
          </span>
        </motion.div>
      </div>
    </section>
  );
}
