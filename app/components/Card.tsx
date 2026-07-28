'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Info, Loader2, Sparkles } from 'lucide-react';
import supabase from '@/utils/supabase';
import Questionnaire from './Questionnaire';
import UploadZone, { type UploadZoneHandle } from './UploadZone';
import CameraCapture, { type CameraCaptureHandle } from './CameraCapture';
import AnalysisResult from './AnalysisResult';
import type { QuestionnaireAnswers } from '@/lib/personal-color/questionnaire';
import { isQuestionnaireComplete } from '@/lib/personal-color/questionnaire';
import type { AnalysisStage } from '@/lib/personal-color/image-analysis';

// Real pipeline stage labels — reported live from analyzeImage(), not simulated.
const STAGE_LABELS: Record<AnalysisStage | 'model' | 'scoring', string> = {
  model:     'Loading face detection model...',
  landmarks: 'Detecting 468 facial points...',
  sampling:  'Measuring skin, hair & eye pixels...',
  color:     'Converting to CIE L*a*b* color space...',
  scoring:   'Scoring all 12 seasons...',
};

const MAX_SIZE = 1024;
const JPEG_QUALITY = 0.85;
const PRICE = 8900; // ₮ — үнийн дүнг зөвхөн энд өөрчил

// Түр зогсоох тугшлага — true байхад форм хаагдаж мессеж харагдана
const PAUSED = false;

// 2Checkout зөвшөөрөл авах хүлээгдэж байгаа тул төлбөрийг түр алгасаж,
// шинжилгээний дараа season-ыг шууд харуулна. Зөвшөөрөл авсны дараа
// false болгож, доорх payment gate урсгалыг сэргээ.
const SKIP_PAYMENT = true;

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
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Payment gate — set after successful analysis, never exposes season/colors to UI
  const [readyToPay, setReadyToPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const pendingSeason   = useRef<string | null>(null);
  const pendingImageUrl = useRef<string | null>(null);

  // SKIP_PAYMENT mode — season name shown directly, no payment gate
  const [resultSeason, setResultSeason] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement | null>(null);
  const isProcessing = useRef(false);
  const cameraRef = useRef<CameraCaptureHandle>(null);
  const uploadZoneRef = useRef<UploadZoneHandle>(null);

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
    setStageLabel(null);
    setReadyToPay(false);
    setPaying(false);
    setResultSeason(null);
    pendingSeason.current   = null;
    pendingImageUrl.current = null;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setSubmitError('Please upload an image file only.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setSubmitError('Image size must be less than 10MB.');
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setReadyToPay(false);
    setSubmitError(null);
    pendingSeason.current   = null;
    pendingImageUrl.current = null;
  };

  // Step 1 — upload photo, run client-side analysis, show payment gate
  const handleUpload = async () => {
    if (isProcessing.current) return;
    if (!file) { cameraRef.current?.open(); return; }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter your email address.');
      emailRef.current?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
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
        console.error('Supabase upload error:', uploadError);
        setSubmitError(`Upload error: ${uploadError.message} | url=${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
        return;
      }

      const imgUrl = supabase.storage.from('portraits').getPublicUrl(filePath).data.publicUrl;
      if (!imgUrl) { setSubmitError('An error occurred while retrieving the image URL.'); return; }

      setChecking(true);

      // 2. Client-side quality check (canvas math only — no AI)
      try {
        const { checkImageQuality } = await import('@/lib/personal-color/image-analysis');
        const quality = await checkImageQuality(compressed);
        if (!quality.ok) {
          setPhotoQualityError({ message: 'The photo does not meet the required quality standards.', issues: quality.issues });
          return;
        }
      } catch {
        // non-fatal — continue to face detection
      }

      // 3. MediaPipe face detection + Rule Engine → seasonName (client-side, result NOT shown to user)
      setChecking(false);
      setAnalyzing(true);
      setStageLabel(STAGE_LABELS.model);

      let seasonName: string;
      try {
        const { analyzeImage }              = await import('@/lib/personal-color/image-analysis');
        const { getPrimaryAndSecondarySeason } = await import('@/lib/personal-color/rule-engine');
        const { questionnaireToMetrics, mergeMetrics, isQuestionnaireComplete: isComplete, HAIR_LAB }
          = await import('@/lib/personal-color/questionnaire');

        // Dyed hair reads the dye color from the photo, not the true undertone
        // signal — override with the questionnaire's natural hair color LAB.
        const hairOverrideLab =
          questionnaireAnswers.hairDyed === 'yes' && questionnaireAnswers.naturalHairColor
            ? HAIR_LAB[questionnaireAnswers.naturalHairColor]
            : null;

        const imageMetrics  = await analyzeImage(compressed, hairOverrideLab, (stage) => {
          setStageLabel(STAGE_LABELS[stage]);
        });
        setStageLabel(STAGE_LABELS.scoring);

        const colorMetrics  = isComplete(questionnaireAnswers)
          ? mergeMetrics(imageMetrics, questionnaireToMetrics(questionnaireAnswers as QuestionnaireAnswers))
          : imageMetrics;

        seasonName = getPrimaryAndSecondarySeason(
          colorMetrics as Parameters<typeof getPrimaryAndSecondarySeason>[0],
        ).primary.season;
      } catch (err) {
        const rawMsg = err instanceof Error ? err.message : '';
        const isUserFacing = rawMsg && /[Ѐ-ӿ]/.test(rawMsg);
        setPhotoQualityError({
          message: isUserFacing
            ? rawMsg
            : 'Could not detect a face. Please upload a photo where your face is fully visible.',
          issues: [],
        });
        return;
      }

      // 4. Store result in refs (never touched by JSX) → show payment gate
      pendingSeason.current   = seasonName;
      pendingImageUrl.current = imgUrl;
      setChecking(false);
      setAnalyzing(false);
      setStageLabel(null);
      if (SKIP_PAYMENT) {
        setResultSeason(seasonName);
      } else {
        setReadyToPay(true);
      }

    } finally {
      isProcessing.current = false;
      setChecking(false);
      setAnalyzing(false);
      setStageLabel(null);
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
        setSubmitError(data.error ?? 'An error occurred while creating the payment. Please try again.');
        return;
      }

      if (data.orderId) {
        try { localStorage.setItem('pendingOrderId', data.orderId); } catch {}
      }

      window.location.href = data.followUpLink;
    } catch (err) {
      console.error('handlePay error:', err);
      setSubmitError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setPaying(false);
    }
  };

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
            <p className="text-lg font-bold text-slate-800">Coming Soon!</p>
            <p className="text-sm leading-relaxed text-slate-500">
              Please check back tomorrow to discover your personal color.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="relative flex flex-col gap-5 rounded-[2rem] border border-pink-100 p-8 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.6)] backdrop-blur-2xl"
          style={{ backgroundColor: 'oklch(97% 0.018 18.334)' }}
        >
          {/* Full-card loading overlay */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 rounded-[2rem] bg-white/80 backdrop-blur-sm"
              >
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-30" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-lg shadow-violet-200">
                    <Loader2 className="h-7 w-7 animate-spin text-white" strokeWidth={2} />
                  </div>
                </div>
                <div className="text-center space-y-1 px-6">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={analyzing ? stageLabel : checking ? 'checking' : 'uploading'}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-bold text-slate-800"
                    >
                      {analyzing ? (stageLabel ?? 'Analyzing...') : checking ? 'Checking photo quality...' : 'Uploading photo...'}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-xs text-slate-400">
                    {analyzing ? 'No AI guessing — deterministic pixel math only' : 'Please wait'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <UploadZone
            ref={uploadZoneRef}
            previewUrl={previewUrl}
            cameraError={cameraError}
            uploading={uploading}
            checking={checking}
            analyzing={analyzing}
            stageLabel={stageLabel}
            readyToPay={readyToPay}
            resultSeason={resultSeason}
            onOpenCamera={() => cameraRef.current?.open()}
            onFileSelect={handleFileSelect}
            onRemovePhoto={() => {
              setFile(null);
              setPreviewUrl(null);
              setSubmitError(null);
              setPhotoQualityError(null);
              setQuestionnaireAnswers({});
            }}
          />

          {/* Questionnaire — зураг сонгосон, payment gate харагдаагүй үед */}
          <AnimatePresence>
            {file && !readyToPay && !resultSeason && (
              <Questionnaire answers={questionnaireAnswers} onChange={setQuestionnaireAnswers} />
            )}
          </AnimatePresence>

          {/* Male notice */}
          <AnimatePresence>
            {questionnaireAnswers.gender === 'male' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl border px-5 py-4 flex items-start gap-3" style={{ background: '#FCFBFF', border: '1px solid #E9DDFE' }}>
                <Info className="h-4 w-4 shrink-0 text-violet-400 mt-0.5" strokeWidth={1.8} />
                <p className="text-xs text-violet-700 leading-relaxed">
                  A male report will be added soon — please check back later.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email input — payment gate харагдахаас өмнө л харагдана */}
          {(!file || isQuestionnaireComplete(questionnaireAnswers)) && !readyToPay && !resultSeason && questionnaireAnswers.gender !== 'male' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                Email Address
              </label>
              <input
                id="email"
                ref={emailRef}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); setEmailError(null); }}
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
                <p className="text-sm font-semibold text-amber-800">Photo quality insufficient</p>
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
          {(!file || isQuestionnaireComplete(questionnaireAnswers)) && !readyToPay && !resultSeason && questionnaireAnswers.gender !== 'male' && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-200/70 transition-all duration-300 hover:scale-[1.025] hover:shadow-xl hover:shadow-violet-300/50 active:scale-[0.975] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              <span className="relative z-10">
                {uploading
                  ? analyzing ? (stageLabel ?? 'Analyzing...')
                    : checking ? 'Checking photo quality...'
                    : 'Uploading photo...'
                  : file ? 'Analyze My Colors' : 'Take a Photo'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          )}

          <AnalysisResult
            readyToPay={readyToPay}
            paying={paying}
            price={PRICE}
            onPay={handlePay}
            resultSeason={resultSeason}
            onReset={resetCard}
          />
        </div>
      </motion.div>

      <CameraCapture
        ref={cameraRef}
        cameraError={cameraError}
        onError={setCameraError}
        onFallbackToFilePicker={() => uploadZoneRef.current?.openFilePicker()}
        onCapture={handleFileSelect}
      />
    </>
  );
}
