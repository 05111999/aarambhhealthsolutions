import React, { useEffect, useRef, useState } from 'react';
import { Download, X, CheckCircle2 } from 'lucide-react';
import { getInstallState, installPlatform, promptInstall, subscribeInstall } from '../../lib/pwa';

// How to install by hand where the browser gives no install prompt.
const MANUAL_STEPS = {
  ios: ['Open this page in Safari.', 'Tap the Share button (the square with an arrow).', 'Choose “Add to Home Screen”, then “Add”.'],
  'mac-safari': ['In Safari’s menu bar choose File → “Add to Dock…”.', 'Click “Add”. AArambh opens from the Dock like any app.'],
  android: ['Open this page in Chrome.', 'Tap the ⋮ menu at the top-right.', 'Choose “Install app” (or “Add to Home screen”).'],
  firefox: ['Firefox can’t install apps on a computer.', 'Open this page in Google Chrome or Microsoft Edge and click “Install app” there.'],
  desktop: [
    'In Chrome or Edge, click the install icon at the right end of the address bar (a screen with a ↓ arrow).',
    'Or open the browser’s ⋮ / … menu → “Install AArambh” (Edge: Apps → “Install this site as an app”).',
    'Already installed? Open AArambh from your desktop, Start menu or Launchpad.',
  ],
};

// "Install app" — shown to every signed-in role until the app is installed. Works on
// Windows and Mac (Chrome / Edge), Android, and — with a short how-to — iPhone/iPad/Safari.
// variant: 'header' (compact, icon-only on phones) or 'link' (login page).
const InstallAppButton = ({ variant = 'header' }) => {
  const [state, setState] = useState(getInstallState);
  const [open, setOpen] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const ref = useRef(null);

  useEffect(() => subscribeInstall(() => setState(getInstallState())), []);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.key === 'Escape' || (e.type === 'mousedown' && !ref.current?.contains(e.target))) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  if (state.installed && !justInstalled) return null; // already running as the installed app

  const handleClick = async () => {
    if (state.canPrompt) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') setJustInstalled(true);
      return;
    }
    setOpen((v) => !v);
  };

  if (justInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-teal shrink-0">
        <CheckCircle2 size={16} />
        <span className={variant === 'header' ? 'hidden sm:inline' : ''}>Installed</span>
      </span>
    );
  }

  const steps = MANUAL_STEPS[installPlatform()] || MANUAL_STEPS.desktop;
  const buttonClass =
    variant === 'header'
      ? 'flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors p-2 sm:p-0 shrink-0'
      : 'inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-teal transition-colors';

  return (
    <div className="relative shrink-0" ref={ref}>
      <button onClick={handleClick} title="Install AArambh as an app on this device" aria-label="Install app" aria-expanded={open} className={buttonClass}>
        <Download size={16} />
        <span className={variant === 'header' ? 'hidden md:inline' : ''}>Install app</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="How to install the app"
          className={`z-50 bg-white rounded-2xl border border-border shadow-2xl shadow-text-dark/10 p-4 text-left ${
            variant === 'header'
              ? 'fixed inset-x-2 top-[60px] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[340px]'
              : 'absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[300px] max-w-[calc(100vw-2rem)]'
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-sm font-semibold text-text-dark mb-0">Install AArambh on this device</p>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-text-muted hover:text-text-dark p-1 -m-1">
              <X size={16} />
            </button>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-text-muted mb-0">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="text-xs text-text-muted mt-3 mb-0">The app opens in its own window and needs an internet connection, like the website.</p>
        </div>
      )}
    </div>
  );
};

export default InstallAppButton;
