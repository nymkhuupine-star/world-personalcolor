'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { CheckCircle, Droplets, Eye, Sun, Upload, X } from 'lucide-react';
import supabase from '@/utils/supabase';
import HookModal from './HookModal';
import Questionnaire from './Questionnaire';
import type { QuestionnaireAnswers } from '@/lib/personal-color/questionnaire';
import { isQuestionnaireComplete } from '@/lib/personal-color/questionnaire';

type AnalysisResult = {
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  subType: string;
  reasoning: string;
  recommendedColors: string[];
};

const PENDING_KEY = 'pendingAnalysis';

const MAX_SIZE = 1024; // px
const JPEG_QUALITY = 0.85;

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
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
  const { isSignedIn, user } = useUser();

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
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dbSaved, setDbSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Нэвтэрсний дараа pending analysis-г user_analyses-д хадгална
  useEffect(() => {
    if (!isSignedIn || !user) return;
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const { result, imageUrl: imgUrl } = JSON.parse(raw) as { result: AnalysisResult; imageUrl: string };
      localStorage.removeItem(PENDING_KEY);
      queueMicrotask(() => {
        setAnalysisResult(result);
        setShowModal(false);
      });
      fetch('/api/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, imageUrl: imgUrl }),
      }).then(() => setDbSaved(true));
    } catch { localStorage.removeItem(PENDING_KEY); }
  }, [isSignedIn, user]);

  const resetCard = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setEmail('');
    setAnalysisResult(null);
    setSentEmail(null);
    setDbSaved(false);
    setImageUrl(null);
    setShowModal(false);
    setQuestionnaireAnswers({});
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
    setAnalysisResult(null);
    setSentEmail(null);
    setSubmitError(null);
    setDbSaved(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleUpload = async () => {
    if (isProcessing.current) return;   // синхрон блок — давхар дарахыг шууд зогсооно
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
    setAnalysisResult(null);
    setSentEmail(null);
    setEmailError(null);
    setSubmitError(null);
    setPhotoQualityError(null);
    setDbSaved(false);

    try {
      // 1. Compress → Upload image to Supabase
      const compressed = await compressImage(file);
      const filePath = `${Math.random().toString(36).slice(2)}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('portraits')
        .upload(filePath, compressed, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) {
        setSubmitError('Зураг оруулахад алдаа гарлаа. Дахин оролдоно уу.');
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('portraits').getPublicUrl(filePath);
      const imgUrl = publicUrlData.publicUrl;
      if (!imgUrl) { setSubmitError('Зургийн URL авахад алдаа гарлаа.'); return; }

      setImageUrl(imgUrl);
      setChecking(true);

      // 2. Client-side quality check (brightness + blur — no AI, canvas math only)
      try {
        const { checkImageQuality } = await import('@/lib/personal-color/image-analysis');
        const quality = await checkImageQuality(compressed);
        if (!quality.ok) {
          setPhotoQualityError({ message: 'Зургийн чанар шаардлага хангаагүй байна.', issues: quality.issues });
          return;
        }
      } catch {
        // quality check failure is non-fatal — continue to face detection
      }

      // 3. Client-side: MediaPipe face detection + Questionnaire + Rule Engine → season (no AI)
      let seasonName: string;
      let colorMetrics: unknown;
      let confidence: string;
      try {
        const { analyzeImage } = await import('@/lib/personal-color/image-analysis');
        const { getPrimaryAndSecondarySeason } = await import('@/lib/personal-color/rule-engine');
        const { questionnaireToMetrics, mergeMetrics } = await import('@/lib/personal-color/questionnaire');

        const imageMetrics = await analyzeImage(compressed);

        // Merge with questionnaire if user answered all 4 questions
        const { isQuestionnaireComplete } = await import('@/lib/personal-color/questionnaire');
        const answeredAll = isQuestionnaireComplete(questionnaireAnswers);
        colorMetrics = answeredAll
          ? mergeMetrics(imageMetrics, questionnaireToMetrics(questionnaireAnswers as QuestionnaireAnswers))
          : imageMetrics;

        const ruleResult = getPrimaryAndSecondarySeason(
          colorMetrics as Parameters<typeof getPrimaryAndSecondarySeason>[0]
        );
        seasonName = ruleResult.primary.season;
        confidence = ruleResult.confidence;
      } catch (err) {
        setPhotoQualityError({
          message: err instanceof Error
            ? err.message
            : 'Нүүр илрүүлж чадсангүй. Нүүрээ бүтэн харагдуулсан зураг оруулна уу.',
          issues: [],
        });
        return;
      }

      // 4. Server: static reasoning text + DB save + email (no AI)
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imgUrl,
          email: trimmedEmail,
          colorMetrics,
          seasonName,
          confidence,
        }),
      });

      const data = await analyzeRes.json() as {
        canAnalyze?: boolean;
        message?: string;
        issues?: string[];
        season?: AnalysisResult['season'];
        subType?: string;
        reasoning?: string;
        recommendedColors?: string[];
        confidence?: string;
      };

      if (!analyzeRes.ok || data.canAnalyze === false) {
        setPhotoQualityError({
          message: data.message ?? 'Зургийн чанар шаардлага хангаагүй байна.',
          issues: data.issues ?? [],
        });
        return;
      }

      setChecking(false);
      setAnalyzing(true);

      const result: AnalysisResult = {
        season: data.season!,
        subType: data.subType!,
        reasoning: data.reasoning!,
        recommendedColors: data.recommendedColors!,
      };
      setAnalysisResult(result);
      setSentEmail(trimmedEmail);

      // 3. Нэвтэрсэн бол шууд user_analyses-д хадгална
      if (isSignedIn) {
        await fetch('/api/save-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result, imageUrl: imgUrl }),
        });
        setDbSaved(true);
      } else {
        // Нэвтрээгүй бол localStorage-д хадгалж hook modal харуулна
        localStorage.setItem(PENDING_KEY, JSON.stringify({ result, imageUrl: imgUrl }));
        setShowModal(true);
      }

    } finally {
      isProcessing.current = false;
      setChecking(false);
      setAnalyzing(false);
      setUploading(false);
    }
  };

  const requirements = [
    { icon: Sun, label: 'Өдрийн гэрэл' },
    { icon: Droplets, label: 'Будалтгүй' },
    { icon: Eye, label: 'Урагш харах' },
  ];

  return (
    <>
      {showModal && analysisResult && (
        <HookModal onDismiss={resetCard} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col gap-5 rounded-[2rem] border border-pink-100 p-8 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.6)] backdrop-blur-2xl" style={{ backgroundColor: 'oklch(97% 0.018 18.334)' }}>

          {/* Upload zone */}
          <div
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white/60 transition-all duration-300 hover:border-violet-300/70 hover:bg-violet-50/30"
            style={{ minHeight: '240px' }}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {previewUrl ? (
              <>
                <Image src={previewUrl} alt="Оруулсан зураг" fill unoptimized className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreviewUrl(null);
                    setAnalysisResult(null);
                    setSentEmail(null);
                    setSubmitError(null);
                    setPhotoQualityError(null);
                    setQuestionnaireAnswers({});
                    setDbSaved(false);
                  }}
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                  aria-label="Зураг устгах"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
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
                        {analyzing ? 'AI шинжилж байна...' : checking ? 'Зургийн чанар шалгаж байна...' : 'Зураг оруулж байна...'}
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

          {/* Questionnaire — зураг сонгосны дараа харагдана */}
          <AnimatePresence>
            {file && !analysisResult && (
              <Questionnaire
                answers={questionnaireAnswers}
                onChange={setQuestionnaireAnswers}
              />
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

          {/* Email — зураг оруулаагүй эсвэл асуулт бүрэн дууссаны дараа л харагдана */}
          {(!file || isQuestionnaireComplete(questionnaireAnswers)) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
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
                <p className="text-sm font-semibold text-amber-800">⚠ Зургийн чанар хангалтгүй</p>
                <p className="text-xs leading-relaxed text-amber-700">{photoQualityError.message}</p>
                {photoQualityError.issues.length > 0 && (
                  <ul className="text-xs text-amber-600 space-y-0.5 list-disc list-inside">
                    {photoQualityError.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
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

          {/* CTA — зураг оруулаагүй эсвэл асуулт дууссаны дараа л харагдана */}
          {(!file || isQuestionnaireComplete(questionnaireAnswers)) && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-200/70 transition-all duration-300 hover:scale-[1.025] hover:shadow-xl hover:shadow-violet-300/50 active:scale-[0.975] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              <span className="relative z-10">
                {uploading
                  ? analyzing ? 'AI шинжилж байна...'
                    : checking ? 'Зургийн чанар шалгаж байна...'
                    : 'Зураг оруулж байна...'
                  : file ? 'Миний өнгийг шинжлэх' : 'Зураг оруулах'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          )}

          {/* Success confirmation */}
          <AnimatePresence>
            {sentEmail && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
                  <span className="text-sm font-semibold text-emerald-700">Үр дүн илгээгдлээ</span>
                </div>
                <p className="text-xs text-emerald-600">
                  {sentEmail} хаягаар PDF тайлан илгээгдлээ
                </p>
                <button
                  onClick={resetCard}
                  className="w-full rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
                >
                  Шинэ зураг оруулах →
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </>
  );
}
