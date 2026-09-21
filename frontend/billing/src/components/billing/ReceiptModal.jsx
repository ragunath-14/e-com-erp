import { createPortal } from 'react-dom';
import { Printer, CheckCircle2, Trash2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { confirmAction } from '../../utils/dialogs';

const inr = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Full-page A4 invoice. Hidden on screen; index.css shows only this (and hides the
// rest of the app) inside @media print. Rendered through a portal on <body> so no
// app-layout container can clip or scroll it when printing.
const A4Invoice = ({ sale, settings }) => {
  const isGst = sale.billType === 'GST';
  const discountAmt = sale.discount?.value > 0
    ? (sale.discount.type === 'percentage' ? (sale.subt * sale.discount.value) / 100 : sale.discount.value)
    : 0;
  const created = new Date(sale.createdAt || Date.now());

  return createPortal(
    <div className="invoice-a4">
      <div className="inv-head">
        <div>
          <div className="inv-shop">{settings.shopName || 'Shop'}</div>
          {settings.address && <div>{settings.address}</div>}
          {(settings.phone || settings.email) && <div>{[settings.phone && `Ph: ${settings.phone}`, settings.email].filter(Boolean).join('  |  ')}</div>}
          {settings.gstin && <div>GSTIN: {settings.gstin}</div>}
        </div>
        <div className="inv-meta">
          <div className="inv-title">{isGst ? 'TAX INVOICE' : 'INVOICE'}</div>
          {sale._id && <div>Bill No: <b>{String(sale._id).slice(-8).toUpperCase()}</b></div>}
          <div>Date: <b>{created.toLocaleDateString('en-IN')}</b> {created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <div className="inv-billto">
        <div className="inv-label">Billed To</div>
        <div><b>{sale.customerName}</b></div>
        {sale.customerPhone && <div>Ph: {sale.customerPhone}</div>}
      </div>

      <table className="inv-table">
        <thead>
          <tr><th style={{ width: '6%' }}>#</th><th>Description</th><th className="r" style={{ width: '10%' }}>Qty</th><th className="r" style={{ width: '18%' }}>Rate</th><th className="r" style={{ width: '20%' }}>Amount</th></tr>
        </thead>
        <tbody>
          {sale.products.map((p, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{p.name}</td>
              <td className="r">{p.quantity}</td>
              <td className="r">{inr(p.sellingPrice)}</td>
              <td className="r">{inr(p.sellingPrice * p.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-totals">
        <div><span>Subtotal</span><span>{inr(sale.subt)}</span></div>
        {discountAmt > 0 && (
          <div><span>Discount ({sale.discount.type === 'percentage' ? `${sale.discount.value}%` : 'Flat'})</span><span>-{inr(discountAmt)}</span></div>
        )}
        {isGst && <div><span>GST ({sale.taxRate || 18}%)</span><span>{inr(sale.gst)}</span></div>}
        <div className="inv-grand"><span>Total Payable</span><span>{inr(sale.totalAmount)}</span></div>
      </div>

      <div className="inv-foot">
        <div>Payment: <b>{sale.paymentMethod}</b></div>
        <div className="inv-sign">Authorised Signatory</div>
      </div>
      <div className="inv-thanks">Thank you! Visit Again!</div>
    </div>,
    document.body
  );
};

const ReceiptModal = ({ show, sale, onClose, onDelete }) => {
  const { settings } = useSettings();
  if (!show || !sale) return null;
  const handlePrint = () => window.print();

  const handleVoid = async () => {
    if ((await confirmAction('Void this bill? The record will be deleted and stock will be restored.'))) {
      onDelete(sale._id);
    }
  };
  
  return (<>
  <A4Invoice sale={sale} settings={settings} />
  <div className="modal show d-block no-print" style={{ background: 'rgba(0,0,0,0.6)' }}>
    <div className="modal-dialog modal-dialog-centered"><div className="modal-content shadow-lg border-0">
      <div className="modal-header border-0 pb-0"><button className="btn-close" onClick={onClose} /></div>
      <div className="modal-body pt-0 text-center">
        <div className="mb-4"><CheckCircle2 size={48} color="#16a34a" /><h5 className="fw-bold mt-2">Sale Completed!</h5><p className="text-muted small">The transaction has been recorded</p></div>
        <div className="receipt-box border p-4 text-start bg-white shadow-sm" style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4' }}>
          <div className="text-center mb-3">
            <div className="fw-bold h5 mb-0">✨ {settings.shopName || 'Shop Hub'}</div>
            <div style={{ fontSize: '0.72rem' }}>{settings.address || 'Loading...'}<br/>GSTIN: {settings.gstin || 'N/A'}</div>
          </div>
          <hr className="my-2 border-dark" />
          <div className="d-flex justify-content-between extra-small mb-1"><span>Bill: {sale.billType}</span><span>Date: {new Date(sale.createdAt || Date.now()).toLocaleDateString()}</span></div>
          <div className="d-flex justify-content-between extra-small"><span>Cust: {sale.customerName}</span><span>{sale.customerPhone}</span></div>
          <hr className="my-2 border-dark" />
          <table className="w-100 mb-2"><thead><tr className="border-bottom border-dark"><th>Item</th><th className="text-center">Qty</th><th className="text-end">Price</th></tr></thead>
            <tbody>{sale.products.map((p, i) => <tr key={i}><td>{p.name}</td><td className="text-center">x{p.quantity}</td><td className="text-end">₹{(p.sellingPrice * p.quantity).toLocaleString()}</td></tr>)}</tbody></table>
          <hr className="my-1 border-dark opacity-25" />
          <div className="d-flex justify-content-between small"><span>Subtotal:</span><span>₹{(sale.subt || 0).toLocaleString()}</span></div>
          {sale.discount?.value > 0 && (
            <div className="d-flex justify-content-between small text-danger">
              <span>Overall Discount ({sale.discount.type === 'percentage' ? `${sale.discount.value}%` : `₹${sale.discount.value}`}):</span>
              <span>-₹{(sale.discount.type === 'percentage' ? (sale.subt * sale.discount.value / 100) : sale.discount.value).toLocaleString()}</span>
            </div>
          )}
          {sale.billType === 'GST' && <div className="d-flex justify-content-between small"><span>GST ({sale.taxRate || 18}%):</span><span>₹{(sale.gst || 0).toLocaleString()}</span></div>}
          <hr className="my-2 border-dark" />
          <div className="d-flex justify-content-between fw-bold h6 mb-1"><span>Total Payable:</span><span>₹{(sale.totalAmount || 0).toLocaleString()}</span></div>
          <div className="text-center mt-3 extra-small text-muted" style={{ fontSize: '0.65rem' }}>Paid via {sale.paymentMethod} — Handled by Admin</div>
          <div className="text-center mt-2 extra-small text-muted border-top pt-2">Thank you! Visit Again!</div>
        </div>
      </div>
      <div className="modal-footer border-0 justify-content-center pb-4 pt-0 gap-2 flex-column flex-sm-row">
        <button className="btn btn-outline-danger d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-center" onClick={handleVoid}><Trash2 size={16} /> Void Bill</button>
        <button className="btn btn-light px-4 w-100 w-sm-auto justify-content-center" onClick={onClose}>Close</button>
        <button className="btn btn-primary px-4 d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-center" onClick={handlePrint}><Printer size={16} /> Print Bill (A4)</button>
      </div></div></div></div>
  </>);
};

export default ReceiptModal;
