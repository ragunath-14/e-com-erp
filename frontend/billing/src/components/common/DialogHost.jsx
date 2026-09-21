import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { registerDialogHost } from '../../utils/dialogs';

// Renders the toasts and the confirm dialog behind notify() / confirmAction().
const DialogHost = () => {
  const [toasts, setToasts] = React.useState([]);
  const [confirmState, setConfirmState] = React.useState(null);
  const idRef = React.useRef(0);

  const dismiss = React.useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  React.useEffect(() => registerDialogHost({
    notify: (message, type) => {
      const id = ++idRef.current;
      setToasts(t => [...t.slice(-3), { id, message, type }]);
      setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500);
    },
    confirm: (message, opts) => new Promise(resolve => setConfirmState({ message, opts, resolve })),
  }), [dismiss]);

  const answer = (value) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 4000, display: 'flex', flexDirection: 'column', gap: 8, width: 'min(420px, calc(100vw - 32px))', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} role="status" className="d-flex align-items-start gap-2 shadow-lg rounded-3 px-3 py-2 bg-white"
            style={{ pointerEvents: 'auto', borderLeft: `4px solid ${t.type === 'error' ? '#dc2626' : '#16a34a'}` }}>
            {t.type === 'error' ? <AlertCircle size={18} color="#dc2626" className="mt-1 flex-shrink-0" /> : <CheckCircle2 size={18} color="#16a34a" className="mt-1 flex-shrink-0" />}
            <div className="flex-grow-1 small" style={{ whiteSpace: 'pre-line' }}>{t.message}</div>
            <button type="button" className="btn btn-sm p-0 border-0 text-muted" onClick={() => dismiss(t.id)} aria-label="Dismiss"><X size={16} /></button>
          </div>
        ))}
      </div>

      {confirmState && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 4100 }} onClick={() => answer(false)}>
          <div className="modal-dialog modal-dialog-centered modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-body p-4 text-center">
                <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{confirmState.message}</p>
              </div>
              <div className="modal-footer border-0 pt-0 pb-4 justify-content-center gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => answer(false)}>Cancel</button>
                <button type="button" autoFocus className={`btn rounded-pill px-4 fw-bold ${confirmState.opts.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => answer(true)}>{confirmState.opts.confirmLabel}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DialogHost;
