import { ShieldAlert } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

export default function Unauthorized() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-100 shadow-xl p-8 space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100">
            <ShieldAlert className="h-5 w-5 text-rose-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Хандах эрхгүй</h1>
          <p className="text-sm text-slate-500">
            Энэ бүртгэл admin панелд хандах эрхгүй байна.
          </p>
        </div>
        <div className="flex justify-center">
          <UserButton />
        </div>
      </div>
    </main>
  );
}
