'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'Will my photo be saved?',
    answer: 'Your privacy is our top priority. Your photos are securely stored in our encrypted database solely for the analysis and are never shared with third parties. You can request to permanently delete your data at any time.',
  },
  {
    question: 'What kind of lighting is best?',
    answer: 'Natural daylight is best! Please take your photo indoors facing a window during the day. Avoid direct sunlight, harsh overhead indoor lights, or using a flash, as they can distort your natural skin undertones.',
  },
  {
    question: 'Can I upload a photo with makeup on?',
    answer: 'For the most accurate results, we highly recommend uploading a completely makeup-free photo. Even light foundation or tinted moisturizer can mask your skin\'s natural pigment and alter your color season analysis.',
  },
  {
    question: 'How accurate are the results?',
    answer: 'Our analysis is highly accurate. Each photo is carefully reviewed by trained color specialists who assess your skin\'s reaction to digital drapes, rather than relying on fully automated, unpredictable AI filters.',
  },
  {
    question: 'Is my payment secure?',
    answer: 'Yes, 100%. We use industry-standard encryption protocols. Your payment is securely processed through Stripe and PayPal, and we never store your credit card information on our servers.',
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
