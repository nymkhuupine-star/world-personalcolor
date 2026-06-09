'use client';

import { useEffect, useState } from 'react';

function detectInAppBrowser() {
  if (typeof window === 'undefined') return { inApp: false, isAndroid: false, isIOS: false };
  const ua = navigator.userAgent || '';
  const inApp = /FBAN|FBAV|FB_IAB|FBIOS|FBANDROID|MessengerForiOS|Instagram/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  return { inApp, isAndroid, isIOS };
}

export default function InAppBrowserGuard() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const { inApp, isAndroid, isIOS } = detectInAppBrowser();
    if (!inApp) return;

    const currentUrl = window.location.href;
    setUrl(currentUrl);

    if (isAndroid) {
      // Android: intent scheme-ээр Chrome-д нээхийг оролдох
      const host = currentUrl.replace(/^https?:\/\//, '');
      window.location.href = `intent://${host}#Intent;scheme=https;package=com.android.chrome;end;`;
      // Chrome байхгүй тохиолдолд fallback
      setTimeout(() => setShow(true), 1500);
    } else if (isIOS) {
      // iOS: Chrome-д нээхийг оролдох
      window.location.href = `googlechrome-x-callback://x-callback-url/open?url=${encodeURIComponent(currentUrl)}`;
      setTimeout(() => setShow(true), 1200);
    } else {
      setShow(true);
    }
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  if (!show) return null;

  const { isIOS } = detectInAppBrowser();

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mb-1 text-4xl">🌐</div>
        <h2 className="mb-2 text-base font-semibold text-gray-900">
          Хөтчөөр нээнэ үү
        </h2>
        <p className="mb-5 text-sm text-gray-500 leading-relaxed">
          Messenger дотоод хөтчөөс банкны апп руу шилжих боломжгүй.{' '}
          <strong>Safari</strong> эсвэл <strong>Chrome</strong> хөтчөөр нээснээр
          төлбөр болон бүх үйлчилгээ ажиллана.
        </p>

        <div className="flex flex-col gap-3">
          {isIOS && (
            <a
              href={`x-web-search://?${encodeURIComponent(url)}`}
              className="block rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white active:opacity-80"
            >
              🧭 Safari-д нээх
            </a>
          )}
          <a
            href={`googlechrome-x-callback://x-callback-url/open?url=${encodeURIComponent(url)}`}
            className="block rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white active:opacity-80"
          >
            Chrome-д нээх
          </a>

          <button
            onClick={handleCopy}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 active:bg-gray-50"
          >
            {copied ? '✅ Хуулагдлаа!' : '🔗 Холбоос хуулах'}
          </button>
        </div>

        {isIOS && (
          <p className="mt-4 text-xs text-gray-400 leading-relaxed">
            Эсвэл дээр баруун булангийн <strong>···</strong> товч дарж{' '}
            <strong>&quot;Safari-д нээх&quot;</strong> сонгоно уу.
          </p>
        )}
      </div>
    </div>
  );
}
