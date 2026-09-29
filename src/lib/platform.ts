export type Platform = 'ios' | 'android' | 'desktop';

export interface PlatformInfo {
  platform: Platform;
  /** En iPhone, "Agregar a inicio" está en el menú Compartir de Safari (y de Chrome desde iOS 16.4). */
  browser: 'safari' | 'chrome' | 'other';
}

/** Detecta el sistema y el navegador a partir del user agent (función pura para poder testearla). */
export function detectPlatform(userAgent: string, maxTouchPoints = 0): PlatformInfo {
  const ua = userAgent.toLowerCase();
  // iPadOS se presenta como Mac, pero con pantalla táctil.
  const ios = /iphone|ipad|ipod/.test(ua) || (ua.includes('macintosh') && maxTouchPoints > 1);
  const android = ua.includes('android');

  let browser: PlatformInfo['browser'] = 'other';
  if (ios) {
    if (/crios/.test(ua)) browser = 'chrome';
    else if (!/fxios|edgios|opios|instagram|fban|fbav|line\//.test(ua) && ua.includes('safari')) browser = 'safari';
  } else if (/chrome|chromium/.test(ua) && !/edg|opr|samsungbrowser/.test(ua)) browser = 'chrome';

  return { platform: ios ? 'ios' : android ? 'android' : 'desktop', browser };
}

/** true si la app ya se abrió desde el acceso directo (pantalla completa, sin barra del navegador). */
export function isRunningAsInstalledApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
