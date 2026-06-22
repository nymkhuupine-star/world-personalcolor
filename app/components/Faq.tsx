'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'Will my photo be saved?',
    answer: 'No. We place the highest importance on your privacy. Your uploaded photo is only used for the analysis at that moment and is automatically and permanently deleted from our system as soon as the results are ready.',
  },
  {
    question: 'What kind of lighting is best?',
    answer: 'For the most accurate analysis, photos taken during the day near a window or in natural light are ideal. We recommend avoiding photos taken under artificial or warm-toned lighting, as these can alter the appearance of your natural skin tone.',
  },
  {
    question: 'Can I upload a photo with makeup on?',
    answer: 'For the most precise analysis of your natural skin tone, we recommend uploading a makeup-free photo. If you do have makeup on, please keep it as minimal as possible.',
  },
  {
    question: 'How accurate are the results?',
    answer: 'Because this service analyzes not just your skin, but also your hair and eye color together, the results are highly accurate and personalized.',
  },
  {
    question: 'How do I make a payment?',
    answer: 'Payment is completed after the analysis is finished. Please note that your report will be sent by email as soon as the payment is confirmed.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-28 bg-white" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Frequently Asked Questions
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900">
            Everything<em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent"> you want to know</em>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
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
