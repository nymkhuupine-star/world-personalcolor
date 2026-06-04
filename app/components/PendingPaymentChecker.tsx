'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function PendingPaymentChecker() {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let orderId: string | null = null;
    try { orderId = localStorage.getItem('pendingOrderId'); } catch {}
    if (!orderId) return;

    fetch(`/api/payment/verify?orderId=${encodeURIComponent(orderId)}`)
      .then(r => r.json())
      .then((data: { success?: boolean; paid?: boolean; alreadyDelivered?: boolean }) => {
        if (data.success || data.alreadyDelivered) {
          try { localStorage.removeItem('pendingOrderId'); } catch {}
          setVerified(true);
          setTimeout(() => setVerified(false), 6000);
        }
      })
      .catch(() => {});
  }, []);

  if (!verified) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-emerald-600 px-5 py-3.5 text-white shadow-xl">
      <CheckCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
      <div>
        <p className="text-sm font-semibold">Төлбөр баталгаажлаа!</p>
        <p className="text-xs text-emerald-100">PDF тайлан имэйлрүү илгээгдлээ.</p>
      </div>
      <button onClick={() => setVerified(false)} className="ml-2 text-emerald-200 hover:text-white">
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
