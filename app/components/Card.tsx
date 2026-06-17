'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import Image from 'next/image';
import { CreditCard, Droplets, Eye, Lock, Sparkles, Sun, Upload, X } from 'lucide-react';
import supabase from '@/utils/supabase';
import Questionnaire from './Questionnaire';
import type { QuestionnaireAnswers } from '@/lib/personal-color/questionnaire';
import { isQuestionnaireComplete } from '@/lib/personal-color/questionnaire';

const MAX_SIZE = 1024;
const JPEG_QUALITY = 0.85;
const PRICE = 8900; // ₮ — үнийн дүнг зөвхөн энд өөрчил

// Түр зогсоох тугшлага — true байхад форм хаагдаж мессеж харагдана
const PAUSED = false;

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, MAX_SIZE / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function Card() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoQualityError, setPhotoQualityError] = useState<{ message: string; issues: string[] } | null>(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Partial<QuestionnaireAnswers>>({});

  // Payment gate — set after successful analysis, never exposes season/colors to UI
  const [readyToPay, setReadyToPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const pendingSeason   = useRef<string | null>(null);
  const pendingImageUrl = useRef<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const resetCard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setEmail('');
    setEmailError(null);
    setSubmitError(null);
    setPhotoQualityError(null);
    setQuestionnaireAnswers({});
    setReadyToPay(false);
    setPaying(false);
    pendingSeason.current   = null;
    pendingImageUrl.current = null;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setSubmitError('Зөвхөн зураг файл оруулна уу.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setSubmitError('Зургийн хэмжээ 10MB-с бага байх шаардлагатай.');
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setReadyToPay(false);
    setSubmitError(null);
    pendingSeason.current   = null;
    pendingImageUrl.current = null;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  // Step 1 — upload photo, run client-side analysis, show payment gate
  const handleUpload = async () => {
    if (isProcessing.current) return;
    if (!file) { fileRef.current?.click(); return; }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Имэйл хаягаа оруулна уу.');
      emailRef.current?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Зөв имэйл хаяг оруулна уу.');
      emailRef.current?.focus();
      return;
    }

    isProcessing.current = true;
    setUploading(true);
    setChecking(false);
    setAnalyzing(false);
    setReadyToPay(false);
    setEmailError(null);
    setSubmitError(null);
    setPhotoQualityError(null);

    try {
      // 1. Compress → upload to Supabase Storage
      const compressed = await compressImage(file);
      const filePath = `${Math.random().toString(36).slice(2)}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('portraits')
        .upload(filePath, compressed, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) {
        setSubmitError('Зураг оруулахад алдаа гарлаа. Дахин оролдоно уу.');
        return;
      }

      const imgUrl = supabase.storage.from('portraits').getPublicUrl(filePath).data.publicUrl;
      if (!imgUrl) { setSubmitError('Зургийн URL авахад алдаа гарлаа.'); return; }

      setChecking(true);

      // 2. Client-side quality check (canvas math only — no AI)
      try {
        const { checkImageQuality } = await import('@/lib/personal-color/image-analysis');
        const quality = await checkImageQuality(compressed);
        if (!quality.ok) {
          setPhotoQualityError({ message: 'Зургийн чанар шаардлага хангаагүй байна.', issues: quality.issues });
          return;
        }
      } catch {
        // non-fatal — continue to face detection
      }

      // 3. MediaPipe face detection + Rule Engine → seasonName (client-side, result NOT shown to user)
      let seasonName: string;
      try {
        const { analyzeImage }              = await import('@/lib/personal-color/image-analysis');
        const { getPrimaryAndSecondarySeason } = await import('@/lib/personal-color/rule-engine');
        const { questionnaireToMetrics, mergeMetrics, isQuestionnaireComplete: isComplete }
          = await import('@/lib/personal-color/questionnaire');

        const imageMetrics  = await analyzeImage(compressed);
        const colorMetrics  = isComplete(questionnaireAnswers)
          ? mergeMetrics(imageMetrics, questionnaireToMetrics(questionnaireAnswers as QuestionnaireAnswers))
          : imageMetrics;

        seasonName = getPrimaryAndSecondarySeason(
          colorMetrics as Parameters<typeof getPrimaryAndSecondarySeason>[0],
        ).primary.season;
      } catch (err) {
        setPhotoQualityError({
          message: err instanceof Error
            ? err.message
            : 'Нүүр илрүүлж чадсангүй. Нүүрээ бүтэн харагдуулсан зураг оруулна уу.',
          issues: [],
        });
        return;
      }

      // 4. Store result in refs (never touched by JSX) → show payment gate
      pendingSeason.current   = seasonName;
      pendingImageUrl.current = imgUrl;
      setChecking(false);
      setAnalyzing(false);
      setReadyToPay(true);

    } finally {
      isProcessing.current = false;
      setChecking(false);
      setAnalyzing(false);
      setUploading(false);
    }
  };

  // Step 2 — user clicks "PDF тайлан авах" → create invoice → redirect to Bonum
  const handlePay = async () => {
    if (paying || !pendingSeason.current || !pendingImageUrl.current) return;
    setPaying(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/payment/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:          email.trim(),
          analysisResult: { seasonName: pendingSeason.current, imageUrl: pendingImageUrl.current },
          amount:         PRICE,
        }),
      });
      const data = await res.json().catch(() => ({} as { followUpLink?: string; orderId?: string; error?: string }));

      if (!res.ok || !data.followUpLink) {
        setSubmitError(data.error ?? 'Төлбөр үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
        return;
      }

      if (data.orderId) {
        try { localStorage.setItem('pendingOrderId', data.orderId); } catch {}
      }

      window.location.href = data.followUpLink;
    } catch (err) {
      console.error('handlePay error:', err);
      setSubmitError(err instanceof Error ? err.message : 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setPaying(false);
    }
  };

  const requirements = [
    { icon: Sun,      label: 'Өдрийн гэрэл' },
    { icon: Droplets, label: 'Будалтгүй' },
    { icon: Eye,      label: 'Урагш харах' },
  ];

  if (PAUSED) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="flex flex-col items-center gap-6 rounded-[2rem] border border-pink-100 p-10 text-center shadow-[0_24px_64px_-12px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.6)] backdrop-blur-2xl"
          style={{ backgroundColor: 'oklch(97% 0.018 18.334)' }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
            <Sparkles className="h-8 w-8 text-violet-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-slate-800">Удахгүй нээгдэнэ!</p>
            <p className="text-sm leading-relaxed text-slate-500">
              Та маргааш дахин орж өөрийн хувийн өнгөө тодорхойлуулаарай.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="flex flex-col gap-5 rounded-[2rem] border border-pink-100 p-8 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.6)] backdrop-blur-2xl"
        style={{ backgroundColor: 'oklch(97% 0.018 18.334)' }}
      >

        {/* Upload zone */}
        <div
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white/60 transition-all duration-300 hover:border-violet-300/70 hover:bg-violet-50/30"
          style={{ minHeight: '240px' }}
          onClick={() => !readyToPay && fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {previewUrl ? (
            <>
              <Image src={previewUrl} alt="Оруулсан зураг" fill unoptimized className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw" />
              {!readyToPay && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreviewUrl(null);
                    setSubmitError(null);
                    setPhotoQualityError(null);
                    setQuestionnaireAnswers({});
                  }}
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                  aria-label="Зураг устгах"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 group-hover:border-violet-200 group-hover:shadow-md group-hover:shadow-violet-100/60">
                <Upload className="h-5 w-5 text-slate-500 transition-colors duration-300 group-hover:text-violet-500" strokeWidth={1.5} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-700">Зургаа оруулахын тулд дарна уу</p>
                <p className="text-xs text-slate-500">Нүүр тод харагдах хөрөг зураг</p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {uploading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/20 backdrop-blur-[3px]">
                <div className="scanning-laser" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2.5 rounded-full bg-white/95 px-5 py-2.5 shadow-lg">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
                    </span>
                    <span className="text-xs font-semibold tracking-wide text-slate-600">
                      {analyzing ? 'Шинжилж байна...' : checking ? 'Зургийн чанар шалгаж байна...' : 'Зураг оруулж байна...'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelect(f);
            e.target.value = '';
          }} />

        {/* Questionnaire — зураг сонгосон, payment gate харагдаагүй үед */}
        <AnimatePresence>
          {file && !readyToPay && (
            <Questionnaire answers={questionnaireAnswers} onChange={setQuestionnaireAnswers} />
          )}
        </AnimatePresence>

        {/* Tips — зураг оруулахаас өмнө л харагдана */}
        {!file && (
          <div className="grid grid-cols-3 gap-2">
            {requirements.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100/80 bg-white/60 px-2 py-3">
                <Icon className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.5} />
                <span className="text-center text-[11px] font-medium text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Email input — payment gate харагдахаас өмнө л харагдана */}
        {(!file || isQuestionnaireComplete(questionnaireAnswers)) && !readyToPay && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              Имэйл хаяг
            </label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
              disabled={uploading}
              className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-violet-300 focus:ring-2 focus:ring-violet-200/40 disabled:opacity-60"
              aria-invalid={emailError ? 'true' : 'false'}
            />
            {emailError && <p className="text-xs text-rose-400">{emailError}</p>}
          </motion.div>
        )}

        {/* Photo quality error */}
        <AnimatePresence>
          {photoQualityError && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 space-y-2">
              <p className="text-sm font-semibold text-amber-800">Зургийн чанар хангалтгүй</p>
              <p className="text-xs leading-relaxed text-amber-700">{photoQualityError.message}</p>
              {photoQualityError.issues.length > 0 && (
                <ul className="text-xs text-amber-600 space-y-0.5 list-disc list-inside">
                  {photoQualityError.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit error */}
        <AnimatePresence>
          {submitError && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-rose-200 bg-rose-50/70 px-5 py-4 text-sm text-rose-700">
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA — зураг оруулаагүй эсвэл асуулт дуусаагүй, payment gate харагдахгүй үед */}
        {(!file || isQuestionnaireComplete(questionnaireAnswers)) && !readyToPay && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-200/70 transition-all duration-300 hover:scale-[1.025] hover:shadow-xl hover:shadow-violet-300/50 active:scale-[0.975] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            <span className="relative z-10">
              {uploading
                ? analyzing ? 'Шинжилж байна...'
                  : checking ? 'Зургийн чанар шалгаж байна...'
                  : 'Зураг оруулж байна...'
                : file ? 'Миний өнгийг шинжлэх' : 'Зураг оруулах'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>
        )}

        {/* Payment gate — шинжилгээ дууссаны дараа л харагдана, result харуулахгүй */}
        <AnimatePresence>
          {readyToPay && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-violet-100 bg-violet-50/60 px-6 py-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                  <Sparkles className="h-5 w-5 text-violet-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Таны шинжилгээ бэлэн боллоо!</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Бүрэн PDF тайлангаа авахын тулд төлбөр төлнө үү
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between rounded-xl border border-violet-100 bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Дэлгэрэнгүй үр дүн + PDF тайлан
                </div>
                <span className="text-base font-bold text-slate-800">8,900₮</span>
              </div>

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={paying}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-200/70 transition-all duration-300 hover:scale-[1.025] active:scale-[0.975] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {paying ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                      QPay руу шилжиж байна...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" strokeWidth={1.75} />
                      PDF тайлан авах — 8,900₮
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>

              {/* Reset link */}
              <button
                type="button"
                onClick={resetCard}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors text-center"
              >
                ← Дахин шинжилгээ хийх
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
