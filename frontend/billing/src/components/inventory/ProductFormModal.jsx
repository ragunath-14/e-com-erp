import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

const ProductFormModal = ({ show, editTarget, form, categories = [], onChange, onSave, onClose }) => {
  const navigate = useNavigate();
  if (!show) return null;
  
  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-light">
            <h6 className="modal-title fw-bold text-primary">{editTarget ? 'Edit Product' : 'Add New Product'}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={onSave}>
            <div className="modal-body px-4 py-3">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Product Name *</label>
                  <input required className="form-control rounded-3" value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} placeholder="e.g. 10cm Sparklers" />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-muted">Manufacturer *</label>
                  <input required className="form-control rounded-3" value={form.brand} onChange={e => onChange({ ...form, brand: e.target.value })} placeholder="e.g. Standard" />
                </div>
                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-bold text-muted mb-0">Category</label>
                    <button 
                      type="button" 
                      className="btn btn-link p-0 small text-decoration-none d-flex align-items-center gap-1"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => navigate('/categories')}
                    >
                      <PlusCircle size={12} /> New
                    </button>
                  </div>
                  <select className="form-select rounded-3" value={form.category} onChange={e => onChange({ ...form, category: e.target.value })}>
                    <option value="Other">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-muted">Cost Price (₹) *</label>
                  <input required type="number" className="form-control rounded-3" value={form.buyingPrice} onChange={e => onChange({ ...form, buyingPrice: e.target.value })} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-muted">Selling Price (₹) *</label>
                  <input required type="number" className="form-control rounded-3" value={form.sellingPrice} onChange={e => onChange({ ...form, sellingPrice: e.target.value })} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Image URL</label>
                  <input className="form-control rounded-3" placeholder="e.g. https://..." value={form.imageUrl || ''} onChange={e => onChange({ ...form, imageUrl: e.target.value })} />
                  <div className="form-text extra-small">Optional — if left blank, a {form.category || 'category'}-relevant icon is shown automatically.</div>
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-muted">Stock Quantity *</label>
                  <input required type="number" className="form-control rounded-3" value={form.stock} onChange={e => onChange({ ...form, stock: e.target.value })} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold text-muted">Barcode</label>
                  <input className="form-control rounded-3" value={form.barcode || ''} onChange={e => onChange({ ...form, barcode: e.target.value })} placeholder="Scan or type" />
                </div>
                {form.category === 'Gift Boxes' && (
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted">Gift Box Contents</label>
                    <textarea
                      className="form-control rounded-3"
                      rows={4}
                      placeholder={'One item per line, e.g.\n10x Sparklers\n5x Flower Pots\n2x Rockets'}
                      value={Array.isArray(form.boxContents) ? form.boxContents.join('\n') : (form.boxContents || '')}
                      onChange={e => onChange({ ...form, boxContents: e.target.value })}
                    />
                    <div className="form-text extra-small">Shown to customers on the shop page when they click "Info" on this box.</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer border-light">
              <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold">{editTarget ? 'Update Product' : 'Save Product'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
