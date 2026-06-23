'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const seasons = [
  {
    name: 'Spring',
    label: 'Хавар',
    colors: ['#F9C5D1', '#F4A7B9', '#F7E7A6', '#A8D5A2', '#FAB87F'],
  },
  {
    name: 'Summer',
    label: 'Зун',
    colors: ['#B5D5E8', '#7EC8E3', '#C4B7D7', '#D4A5A5', '#E8C4D4'],
  },
  {
    name: 'Autumn',
    label: 'Намар',
    colors: ['#C4956A', '#E8735A', '#D4A017', '#8B6914', '#A0522D'],
  },
  {
    name: 'Winter',
    label: 'Өвөл',
    colors: ['#2C4770', '#8B2252', '#B5A4D8', '#1A1A2E', '#C0C0C0'],
  },
];

const allArchColors = [
  '#F9C5D1', '#F4A7B9', '#FAB87F', '#F7E7A6', '#A8D5A2',
  '#7EC8E3', '#B5D5E8', '#C4B7D7', '#D4A5A5',
  '#C4956A', '#E8735A', '#D4A017',
  '#2C4770', '#8B2252', '#B5A4D8',
];

function ColorArch() {
  const n = allArchColors.length;
  const R = 210;
  const cx = 260;
  const cy = 230;

  return (
    <svg
      viewBox="0 0 520 240"
      className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg"
      aria-hidden="true"
    >
      {allArchColors.map((color, i) => {
        const angle = Math.PI - (i / (n - 1)) * Math.PI;
        const x = cx + R * Math.cos(angle);
        const y = cy - R * Math.sin(angle);
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <circle cx={x} cy={y} r={14} fill="white" opacity={0.6} />
            <circle cx={x} cy={y} r={12} fill={color} />
          </motion.g>
        );
      })}
    </svg>
  );
}

export default function ColorShowcase() {
  return (
    <section
      className="relative overflow-hidden py-24 px-6"
      style={{ background: 'linear-gradient(180deg, #fdf4f0 0%, #ffffff 100%)' }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Personal Color Seasons
          </span>
          <h2
            className="mt-3 text-3xl font-bold text-slate-900 lg:text-4xl"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            Таны өнгийг олж мэд
          </h2>
          <p className="mt-4 text-slate-500 text-base max-w-md mx-auto">
            4 улирлын өнгөний хэлбэрт суурилан таны арьс, үс, нүдний өнгөтэй хамгийн таарах палитрыг тодорхойлно.
          </p>
        </motion.div>

        {/* Main visual */}
        <div className="relative flex flex-col items-center">
          {/* Color arch */}
          <div className="relative w-full max-w-lg" style={{ height: 240 }}>
            <ColorArch />
          </div>

          {/* Model image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative -mt-8 z-10"
          >
            <div
              className="relative overflow-hidden rounded-3xl shadow-2xl border-4 border-white"
              style={{ width: 280, height: 380 }}
            >
              <Image
                src="/personal1.png"
                alt="Personal color model"
                fill
                className="object-cover object-top"
                priority
              />
              {/* gradient overlay bottom */}
              <div
                className="absolute inset-x-0 bottom-0 h-24"
                style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.85), transparent)' }}
              />
            </div>
          </motion.div>

          {/* Season cards row */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 w-full max-w-3xl">
            {seasons.map((season, si) => (
              <motion.div
                key={season.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * si, duration: 0.5 }}
                className="rounded-2xl bg-white shadow-md p-4 flex flex-col gap-2"
              >
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{season.name}</p>
                <p className="text-sm font-bold text-slate-800">{season.label}</p>
                <div className="flex gap-1.5 mt-1">
                  {season.colors.map((c, ci) => (
                    <div
                      key={ci}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
