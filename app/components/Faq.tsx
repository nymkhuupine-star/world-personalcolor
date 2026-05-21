'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'Миний зургийг хадгалах уу?',
    answer: 'Үгүй. Бид таны нууцлалыг дээд зэргээр эрхэмлэдэг. Таны оруулсан зураг зөвхөн AI шинжилгээнд ашиглагдана.',
  },
  {
    question: 'Гэрэлтүүлэг ямар байх ёстой вэ?',
    answer: 'Өдрийн цагаар, цонхны дэргэд буюу байгалийн гэрэлд авсан зураг хамгийн тохиромжтой. Хиймэл шар гэрэл арьсны өнгийг хувиргаж харуулдаг тул зайлсхийгээрэй.',
  },
  {
    question: 'Нүүр будалттай зураг оруулж болох уу?',
    answer: 'Арьсны төрөлх туяаг тодорхойлохын тулд нүүр будалтгүй зураг оруулбал шинжилгээ илүү нарийн гарна. Хэрэв будалттай бол маш хөнгөн байхыг зөвлөе.',
  },
  {
    question: 'Үр дүн хэр нарийн вэ?',
    answer: 'Манай AI тэргүүний vision загвар ашиглан таны арьсны өнгө, нүдний гэрэл, үсний өнгийг цогцоор шинжилдэг тул дундаж нарийвчлал 95%-с дээш байдаг.',
  },
  {
    question: 'Төлбөрөө яаж төлөх вэ?',
    answer: 'Та оношлогоо дууссаны дараа QPay эсвэл SocialPay-ээр төлбөрөө төлөх боломжтой. Төлбөр төлөгдсөн даруйд тайлан мэйл хаягаар очих болно.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-28 bg-slate-50/60" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Түгээмэл асуулт
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900">
            Та бодсон <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">зүйлсийнхээ</em> хариулт
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`rounded-2xl border bg-white overflow-hidden transition-shadow duration-300 ${
                  isOpen ? 'border-violet-200 shadow-md shadow-violet-100/50' : 'border-slate-100 shadow-sm'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
                >
                  <span className={`text-sm font-semibold leading-snug transition-colors ${isOpen ? 'text-violet-700' : 'text-slate-800'}`}>
                    {faq.question}
                  </span>
                  <span className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
                    isOpen ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isOpen
                      ? <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    }
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-slate-500">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
