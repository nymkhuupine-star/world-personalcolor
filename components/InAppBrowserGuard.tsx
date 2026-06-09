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

    const currentUrl = window.location.href;
    setUrl(currentUrl);

    if (isAndroid) {
      // Android: intent scheme-ээр Chrome-д нээхийг оролдох
      const host = currentUrl.replace(/^https?:\/\//, '');
      window.location.href = `intent://${host}#Intent;scheme=https;package=com.android.chrome;end;`;
      // Chrome байхгүй тохиолдолд fallback modal
      setTimeout(() => setShow(true), 1500);
    } else {
      // iOS: автомат redirect хийхгүй — хуудас crash болдог тул шууд modal харуулна
      setShow(true);
    }
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select text
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
          Дараах аргуудын аль нэгийг ашиглана уу.
        </p>

        {/* Step-by-step iOS instruction */}
        {isIOS && (
          <div className="mb-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 leading-relaxed space-y-2">
            <p className="font-medium text-gray-800">Safari-д нээх заавар:</p>
            <p>1. Доор баруун булангийн <strong>···</strong> товч дарна уу</p>
            <p>2. <strong>&quot;Safari-д нээх&quot;</strong> гэснийг сонгоно уу</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCopy}
            className="w-full rounded-xl bg-pink-500 px-4 py-3 text-sm font-medium text-white active:opacity-80"
          >
            {copied ? '✅ Хуулагдлаа! Хөтчөө нээж paste хийнэ үү' : '🔗 Холбоос хуулах'}
          </button>

          {!isIOS && (
            <a
              href={`googlechrome-x-callback://x-callback-url/open?url=${encodeURIComponent(url)}`}
              className="block w-full rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-medium text-white active:opacity-80"
            >
              Chrome-д нээх
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
