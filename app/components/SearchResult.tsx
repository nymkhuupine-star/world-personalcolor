'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Key, Sparkles, Calendar, ArrowRight, RefreshCw, CheckCircle, Send } from 'lucide-react';

type Analysis = {
  id: string;
  season: string;
  sub_type: string;
  reasoning: string | null;
  recommended_colors: string[] | null;
  created_at: string;
};

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

const SEASON_STYLE: Record<string, { gradient: string; bg: string; text: string }> = {
  Spring: { gradient: 'from-rose-400 to-pink-300',     bg: 'bg-rose-50',   text: 'text-rose-600' },
  Summer: { gradient: 'from-violet-400 to-purple-300', bg: 'bg-violet-50', text: 'text-violet-600' },
  Autumn: { gradient: 'from-amber-400 to-orange-300',  bg: 'bg-amber-50',  text: 'text-amber-600' },
  Winter: { gradient: 'from-sky-400 to-blue-300',      bg: 'bg-sky-50',    text: 'text-sky-600' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });
}

const SESSION_KEY = 'pc_search_session';

type Step = 'email' | 'code' | 'results';

export default function SearchResult() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // On mount: restore session from localStorage (silent background check)
  useEffect(() => {
    let cancelled = false;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    let token: string;
    try {
      token = (JSON.parse(raw) as { token: string }).token;
      if (!token) return;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    fetch('/api/verify/results-by-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then((data: { success?: boolean; email?: string; analyses?: Analysis[]; error?: string }) => {
        if (cancelled) return;
        if (data.success && data.analyses) {
          setEmail(data.email ?? '');
          setAnalyses(data.analyses);
          setStep('results');
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      })
      .catch(() => localStorage.removeItem(SESSION_KEY));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Алдаа гарлаа.'); return; }
      setStep('code');
      setCountdown(60);
    } catch {
      setError('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    const code = digits.join('');
    if (code.length < 6 || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify/check-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json() as { error?: string; token?: string; analyses?: Analysis[] };
      if (!res.ok) { setError(data.error ?? 'Код буруу байна.'); return; }
      if (data.token) localStorage.setItem(SESSION_KEY, JSON.stringify({ token: data.token }));
      setAnalyses(data.analyses ?? []);
      setStep('results');
    } catch {
      setError('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  }

  async function resendResult(analysisId: string) {
    if (sendingId) return;
    setSendingId(analysisId);
    setSentId(null);
    try {
      const res = await fetch('/api/verify/resend-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, analysisId }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) setSentId(analysisId);
      else console.error(data.error);
    } catch {
      // silent fail — button returns to default state
    } finally {
      setSendingId(null);
    }
  }

  function handleDigitChange(index: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 5) digitRefs.current[index + 1]?.focus();
    // auto-submit when all 6 filled
    if (next.every(d => d) && index === 5) setTimeout(() => verifyCode(), 0);
  }

  function handleDigitKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0)
      digitRefs.current[index - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...pasted.split(''), ...Array(6).fill('')].slice(0, 6);
    setDigits(next);
    digitRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function reset() {
    localStorage.removeItem(SESSION_KEY);
    setStep('email');
    setEmail('');
    setDigits(['', '', '', '', '', '']);
    setError('');
    setCountdown(0);
  }

  return (
    <section id="search-result" className="py-20 px-6 bg-pink-100/100 from-slate-50 to-white">
      <div className="mx-auto max-w-lg">
        <div className="text-center mb-10">
          <span className="inline-block mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-500">
            Өмнөх үр дүн
          </span>
          <h2 className="font-serif text-4xl font-bold text-slate-900 mb-2">
            Өмнөх <em className="not-italic bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">үр дүн</em> хайх
          </h2>
          <p className="text-slate-500 text-sm">
            Шинжилгээ хийхдээ ашигласан имэйлээрээ үр дүнгээ хайна уу
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Email ─────────────────────────────────────────────── */}
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={sendCode} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 border border-violet-100">
                    <Mail className="h-6 w-6 text-violet-500" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-center text-sm text-slate-500 mb-6">
                  Таны имэйл рүү <span className="font-semibold text-slate-700">6 оронтой нэг удаагийн код</span> илгээгдэнэ.
                  Код зөв бол өмнөх үр дүн нь гарч ирнэ.
                </p>
                <div className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="example@email.com"
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm text-slate-700 placeholder-slate-300 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition"
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Илгээж байна…' : <><span>Баталгаажуулах код илгээх</span><ArrowRight className="h-4 w-4" /></>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── Step 2: Code ──────────────────────────────────────────────── */}
          {step === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={verifyCode} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 border border-violet-100">
                    <Key className="h-6 w-6 text-violet-500" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-center text-sm font-medium text-slate-700 mb-1">{email}</p>
                <p className="text-center text-xs text-slate-400 mb-7">
                  руу илгээсэн 6 оронтой кодыг оруулна уу
                </p>

                <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { digitRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      className="h-14 w-11 rounded-xl border-2 border-slate-200 text-center text-2xl font-bold text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition caret-transparent"
                    />
                  ))}
                </div>

                {error && <p className="text-xs text-red-500 text-center mb-4">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || digits.some(d => !d)}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Шалгаж байна…' : 'Баталгаажуулах'}
                </button>

                <div className="mt-4 text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-slate-400">
                      Дахин илгээх:{' '}
                      <span className="font-semibold text-slate-600">{countdown}с</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setDigits(['', '', '', '', '', '']); setError(''); sendCode(); }}
                      disabled={loading}
                      className="text-xs text-violet-500 hover:text-violet-700 font-medium flex items-center gap-1 mx-auto transition"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Код дахин илгээх
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={reset}
                  className="mt-3 w-full text-xs text-slate-400 hover:text-slate-600 transition"
                >
                  ← Өөр имэйл ашиглах
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Step 3: Results ───────────────────────────────────────────── */}
          {step === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {analyses.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-slate-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-slate-700 font-semibold">Үр дүн олдсонгүй</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {email} имэйлтэй холбоотой шинжилгээ байхгүй байна
                  </p>
                  <button
                    onClick={reset}
                    className="mt-5 rounded-full border border-violet-200 text-violet-500 hover:bg-violet-50 px-5 py-2 text-sm font-medium transition"
                  >
                    Өөр имэйлээр хайх
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-700">{analyses.length}</span> үр дүн олдлоо
                    </p>
                    <button
                      onClick={reset}
                      className="text-xs text-violet-500 hover:text-violet-700 font-medium transition"
                    >
                      Өөр имэйл
                    </button>
                  </div>

                  {analyses.map((a, i) => {
                    const style = SEASON_STYLE[a.season] ?? SEASON_STYLE.Spring;
                    const colors = Array.isArray(a.recommended_colors) ? a.recommended_colors : [];
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                      >
                        <div className={`h-1.5 w-full bg-gradient-to-r ${style.gradient}`} />
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${style.bg}`}>
                                <Sparkles className={`h-4 w-4 ${style.text}`} strokeWidth={1.5} />
                              </div>
                              <div>
                                <p className={`text-sm font-bold ${style.text}`}>
                                  {SEASON_MN[a.season] ?? a.season}
                                </p>
                                <p className="text-xs text-slate-400">{a.sub_type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                              <Calendar className="h-3 w-3" strokeWidth={1.5} />
                              {formatDate(a.created_at)}
                            </div>
                          </div>

                          {a.reasoning && (
                            <p className="text-sm text-slate-600 leading-relaxed mb-3">{a.reasoning}</p>
                          )}

                          {colors.length > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1.5">
                                {colors.slice(0, 8).map(color => (
                                  <div
                                    key={color}
                                    className="h-6 w-6 rounded-full border-2 border-white shadow ring-1 ring-black/5"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                              <span className="ml-auto flex items-center gap-1 text-xs text-emerald-500 font-medium">
                                <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                                Баталгаажсан
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() => resendResult(a.id)}
                            disabled={sendingId === a.id}
                            className={`mt-3 w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all
                              ${sentId === a.id
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                                : 'border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 active:scale-[0.98]'}
                              disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            {sentId === a.id ? (
                              <><CheckCircle className="h-4 w-4" strokeWidth={2} />Имэйл илгээгдлээ</>
                            ) : sendingId === a.id ? (
                              <><span className="h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />Илгээж байна…</>
                            ) : (
                              <><Send className="h-4 w-4" strokeWidth={1.5} />Имэйлээр авах</>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}
