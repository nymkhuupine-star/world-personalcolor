export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Twitter|LinkedInApp/i.test(ua)
  );
}

export function getOpenInBrowserUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}
