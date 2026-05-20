"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "Миний зургийг хадгалах уу?",
    answer: "Үгүй. Бид таны нууцлалыг дээд зэргээр эрхэмлэдэг. Таны оруулсан зураг зөвхөн AI шинжилгээнд ашиглагдаад системээс шууд устах болно.",
  },
  {
    question: "Гэрэлтүүлэг ямар байх ёстой вэ?",
    answer: "Хамгийн үнэн зөв хариуг авахын тулд өдрийн цагаар, цонхны дэргэд буюу байгалийн гэрэлд авсан зураг хамгийн тохиромжтой. Хиймэл шар гэрэл нь арьсны өнгийг хувиргаж харуулдаг тул зайлсхийгээрэй.",
  },
  {
    question: "Нүүр будалттай зураг оруулж болох уу?",
    answer: "Арьсны төрөлх туяаг (undertone) тодорхойлохын тулд нүүр будалтгүй зураг оруулбал шинжилгээ илүү нарийн гарна. Хэрэв будалттай бол маш хөнгөн байхыг зөвлөе.",
  },
  {
    question: "Төлбөрөө яаж төлөх вэ?",
    answer: "Та оношлогоо дууссаны дараа QPay эсвэл SocialPay-ээр төлбөрөө төлөх боломжтой. Төлбөр төлөгдсөн даруйд таны тайлан мэйл хаягаар тань очих болно.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-slate-50/50" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">Түгээмэл асуултууд</h2>
          <p className="text-slate-600 mt-4">Танд хэрэгтэй байж болох нэмэлт мэдээллүүд</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-slate-900">{faq.question}</span>
                {openIndex === i ? (
                  <ChevronUp className="text-slate-400" size={20} />
                ) : (
                  <ChevronDown className="text-slate-400" size={20} />
                )}
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed animate-in fade-in duration-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
