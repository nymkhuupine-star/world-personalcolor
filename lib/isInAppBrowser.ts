export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Twitter|LinkedInApp|Snapchat|Pinterest|TikTok|BytedanceWebview|Musical\.ly/i.test(ua);
}
