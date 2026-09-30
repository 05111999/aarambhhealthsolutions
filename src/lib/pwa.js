// Installable-app (PWA) support: registers the service worker and keeps hold of the
// browser's "install" prompt so the staff app can offer an Install button.
//
// Chrome/Edge (Windows, Mac, Android) fire `beforeinstallprompt`; it can arrive before
// the admin screens load, so it is captured here, as early as possible. Safari (iPhone,
// iPad, Mac) has no such prompt — the button shows how to add the app by hand instead.

let deferredPrompt = null;
let installed = false;
const listeners = new Set();
const notify = () => listeners.forEach((cb) => cb());

export const isStandalone = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) || window.navigator.standalone === true;

export function initPwa() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // keep it for our own button instead of the browser's mini-bar
    deferredPrompt = event;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
  // The service worker is only for the real site; in development it would get in the way.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

export const getInstallState = () => ({ canPrompt: !!deferredPrompt, installed: installed || isStandalone() });

export function subscribeInstall(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Shows the browser's install dialog. Resolves to 'accepted', 'dismissed' or 'unavailable'.
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  const event = deferredPrompt;
  deferredPrompt = null; // a prompt can only be used once
  notify();
  event.prompt();
  const { outcome } = await event.userChoice;
  return outcome;
}

// Which manual instructions fit this device when there is no install prompt.
export function installPlatform() {
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (iOS) return 'ios';
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/.test(ua);
  if (safari && /Macintosh/.test(ua)) return 'mac-safari';
  if (/Android/.test(ua)) return 'android';
  if (/Firefox/.test(ua)) return 'firefox';
  return 'desktop';
}
