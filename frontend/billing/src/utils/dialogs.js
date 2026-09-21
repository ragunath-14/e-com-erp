// In-app replacements for window.alert / window.confirm. <DialogHost /> (mounted once
// in App) registers itself here; callers just import notify / confirmAction. If no
// host is mounted (e.g. in tests) they fall back to the native dialogs.
let host = null;

export const registerDialogHost = (h) => {
  host = h;
  return () => { if (host === h) host = null; };
};

const ERROR_HINT = /fail|error|cannot|can't|couldn't|invalid|required|no stock|out of stock|not allowed|warning|must|min order/i;

export function notify(message, type) {
  const text = String(message ?? '');
  if (!host) { window.alert(text); return; }
  host.notify(text, type || (ERROR_HINT.test(text) ? 'error' : 'success'));
}

export function confirmAction(message, { confirmLabel = 'Confirm', danger = true } = {}) {
  if (!host) return Promise.resolve(window.confirm(message));
  return host.confirm(String(message), { confirmLabel, danger });
}
