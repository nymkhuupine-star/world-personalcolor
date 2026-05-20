'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import Image from 'next/image';
import { Droplets, Eye, Sparkles, Sun, Upload, Users } from 'lucide-react';
import supabase from '@/utils/supabase';

type AnalysisResult = {
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  subType: string;
  reasoning: string;
  recommendedColors: string[];
};

export default function HeroSection() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileSelect = (selectedFile: File) => {
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(url);
    setAnalysisResult(null);
    setSuccessEmail(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      fileRef.current?.click();
      return;
    }

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

    setUploading(true);
    setAnalyzing(false);
    setAnalysisResult(null);
    setSuccessEmail(null);
    setEmailError(null);

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `${Math.random().toString(36).slice(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portraits')
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error(uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('portraits')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;
      if (!imageUrl) {
        console.error('Failed to get public URL for uploaded image.');
        return;
      }

      console.log(imageUrl);

      setAnalyzing(true);

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, email: trimmedEmail }),
      });

      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        console.error('Analyze API error:', analyzeResponse.status, errorText);
        return;
      }

      const result = (await analyzeResponse.json()) as AnalysisResult;
      setAnalysisResult(result);
      setSuccessEmail(trimmedEmail);
      console.log(result);
    } finally {
      setAnalyzing(false);
      setUploading(false);
    }
  };

  const avatarColors = ['bg-pink-300', 'bg-violet-300', 'bg-blue-300', 'bg-rose-300'];
  const avatarLetters = ['S', 'M', 'A', 'J'];

  const requirements = [
    { icon: Sun, label: 'Өдрийн гэрэл' },
    { icon: Droplets, label: 'Нүүр будалтгүй' },
    { icon: Eye, label: 'Урагш харах' },
  ];

  return (
    <section className="relative min-h-screen bg-slate-50 overflow-hidden flex items-center">
      <div className="pointer-events-none absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-pink-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full bg-yellow-100/50 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div
          className="flex flex-col gap-8 transition-all duration-700 ease-out"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(2rem)',
          }}
        >
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium text-slate-600">AI өнгөний шинжилгээ</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-900 lg:text-6xl">
            Танд төгс зохих{' '}
            <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-rose-400 bg-clip-text text-transparent">
              палитр
            </span>{' '}
            AI-гаар олъё
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-slate-500">
            Манай компьютерийн харааны AI таны онцлогийг шинжилж улирлын өнгөний төрлийг секундэд
            тодорхойлно. Өөрийн хэв маягаа илүү амархан шинэчлээрэй.
          </p>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {avatarColors.map((bg, i) => (
                <div
                  key={i}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${bg}`}
                >
                  {avatarLetters[i]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-500">
                Аль хэдийн <span className="font-semibold text-slate-700">1,000+</span> хэрэглэгч
                өөртөө зохих өнгөө олсон
              </span>
            </div>
          </div>
        </div>

        <div
          className="transition-all duration-700 ease-out delay-200"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(2rem)',
          }}
        >
          <div className="flex flex-col gap-6 rounded-3xl border border-white/80 bg-white/70 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur-xl">
            <div
              id="upload"
              className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 transition-colors duration-300 hover:border-violet-300"
              style={{ minHeight: '260px' }}
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Оруулсан зурагны урьдчилсан харагдац"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 transition-colors group-hover:bg-violet-50">
                    <Upload className="h-7 w-7 text-slate-400 transition-colors group-hover:text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Зургаа оруулахын тулд дарна уу</p>
                  <p className="text-xs text-slate-400">Нүүр тод харагдах хөрөг зураг тохиромжтой</p>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 bg-slate-900/10">
                  <div className="scanning-laser" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-violet-600 backdrop-blur-sm shadow">
                      {analyzing ? 'AI шинжилж байна...' : 'Uploading...'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelect(selectedFile);
              }}
            />

            <div className="grid grid-cols-3 gap-3">
              {requirements.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 px-2 py-3"
                >
                  <Icon className="h-4 w-4 text-violet-400" />
                  <span className="text-center text-xs font-medium text-slate-500">{label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-slate-700"
              >
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                  setSuccessEmail(null);
                }}
                disabled={uploading}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-200/50 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-300/40 disabled:cursor-not-allowed disabled:opacity-70"
                aria-invalid={emailError ? 'true' : 'false'}
              />
              {emailError && (
                <p className="text-xs font-medium text-rose-600">{emailError}</p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-4 text-base font-semibold text-white shadow-lg shadow-violet-200 transition-all duration-200 hover:scale-[1.02] hover:shadow-violet-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
              {uploading
                ? analyzing
                  ? 'AI шинжилж байна...'
                  : 'Uploading...'
                : 'Analyze My Color'}
            </button>

            {analysisResult && successEmail && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
                Баярлалаа! Таны тайлан {successEmail} хаягаар илгээгдлээ.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

