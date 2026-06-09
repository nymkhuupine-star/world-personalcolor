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
    const { inApp, isAndroid } = detectInAppBrowser();
    if (!inApp) return;

    setUrl(window.location.href);

    if (isAndroid) {
      // Android: head script-ийн intent:// redirect амжаагүй бол fallback modal
      setTimeout(() => setShow(true), 1800);
    } else {
      // iOS: head script-ийн window.open амжаагүй бол шууд modal харуулна
      setShow(true);
    }
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // clipboard API unavailable
    }
  }

  if (!show) return null;

  const { isIOS } = detectInAppBrowser();

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-4 pb-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-3 text-center text-4xl">🌐</div>
        <h2 className="mb-2 text-center text-base font-semibold text-gray-900">
          Safari эсвэл Chrome-д нээнэ үү
        </h2>
        <p className="mb-5 text-center text-sm text-gray-500 leading-relaxed">
          Messenger дотоод хөтчид банкны апп ажилладаггүй.
        </p>

        {isIOS && (
          <div className="mb-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 leading-relaxed space-y-1.5">
            <p className="font-semibold text-gray-800">Safari-д нээх заавар:</p>
            <p>1. Доор баруун булангийн <strong>···</strong> товч дарна уу</p>
            <p>2. <strong>&quot;Safari-д нээх&quot;</strong> сонгоно уу</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCopy}
            className="w-full rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white active:opacity-80 transition-opacity"
          >
            {copied ? '✅ Хуулагдлаа — хөтчөө нээж paste хийнэ үү' : '🔗 Холбоос хуулах'}
          </button>

          {!isIOS && (
            <a
              href={`googlechrome-x-callback://x-callback-url/open?url=${encodeURIComponent(url)}`}
              className="block w-full rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white active:opacity-80"
            >
              Chrome-д нээх
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
