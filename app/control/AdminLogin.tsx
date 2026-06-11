'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setError('Нууц үг буруу байна.');
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-100 shadow-xl p-8 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 border border-violet-100">
            <Lock className="h-5 w-5 text-violet-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Admin панел</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Нууц үг"
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 py-3 text-sm font-semibold text-white shadow disabled:opacity-60"
          >
            {loading ? 'Нэвтрэж байна...' : 'Нэвтрэх'}
          </button>
        </form>
      </div>
    </main>
  );
}
