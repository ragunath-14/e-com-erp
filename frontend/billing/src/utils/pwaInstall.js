import { useSyncExternalStore } from 'react';

// `beforeinstallprompt` can fire before any component mounts, so the listener is
// registered at module load (imported from main.jsx) and the event is stashed
// here until the "Install App" button asks for it.
let deferredPrompt = null;
let installedThisSession = false;
const listeners = new Set();
const emit = () => listeners.forEach(l => l());

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  emit();
});
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  installedThisSession = true;
  emit();
});

const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };

// 'installed' — already running as an app; 'ready' — browser can show its install
// dialog; 'manual' — no prompt available (iOS Safari, Firefox, already dismissed…).
const getState = () => {
  if (installedThisSession || isStandalone()) return 'installed';
  return deferredPrompt ? 'ready' : 'manual';
};

export function usePwaInstall() {
  const state = useSyncExternalStore(subscribe, getState);

  const install = async () => {
    if (!deferredPrompt) return 'manual';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null; // a prompt event can only be used once
    emit();
    return outcome; // 'accepted' | 'dismissed'
  };

  return { state, install };
}

export function registerServiceWorker() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
    });
  }
}
