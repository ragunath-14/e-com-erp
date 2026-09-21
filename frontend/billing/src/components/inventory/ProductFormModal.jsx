import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ImagePlus, X, Camera, Upload } from 'lucide-react';

// Resizes/compresses an uploaded image client-side (max 900px on the long edge,
// JPEG q0.8) and returns it as a data URI — stored directly in Product.imageUrl.
// Avoids needing a cloud storage bucket, and sidesteps Render's ephemeral disk
// (a file saved to local disk there would vanish on the next deploy/restart).
function compressImageFile(file, maxDim = 900, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read image'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const ProductFormModal = ({ show, editTarget, form, categories = [], saving = false, onChange, onSave, onClose }) => {
  const navigate = useNavigate();
  const [uploading, setUploading] = React.useState(false);
  const galleryInputRef = React.useRef(null);
  const cameraInputRef = React.useRef(null);
  if (!show) return null;

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please choose an image file');
    setUploading(true);
    try {
      onChange({ ...form, imageUrl: await compressImageFile(file) });
    } catch (err) {
      alert('Failed to process image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        {/* Capped to the visible viewport with a scrolling body so the footer
            buttons stay reachable on phones (dvh accounts for the mobile URL bar). */}
        <div className="modal-content border-0 shadow-lg rounded-4" style={{ maxHeight: 'calc(100dvh - 1.5rem)' }}>
          <div className="modal-header border-light">
            <h6 className="modal-title fw-bold text-primary">{editTarget ? 'Edit Product' : 'Add New Product'}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={onSave} className="d-flex flex-column" style={{ minHeight: 0 }}>
            <div className="modal-body px-3 px-sm-4 py-3" style={{ overflowY: 'auto' }}>
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
                  <label className="form-label small fw-bold text-muted">Product Image</label>
                  <div className="d-flex align-items-start gap-3">
                    {form.imageUrl ? (
                      <div className="position-relative flex-shrink-0">
                        <img src={form.imageUrl} alt="Product preview" className="rounded-3 border" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
                          style={{ width: 22, height: 22, position: 'absolute', top: -7, right: -7 }}
                          onClick={() => onChange({ ...form, imageUrl: '' })}
                          title="Remove image"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-3 border d-flex align-items-center justify-content-center text-muted flex-shrink-0" style={{ width: 80, height: 80 }}>
                        <ImagePlus size={24} />
                      </div>
                    )}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      {/* Two hidden inputs: the plain one opens the gallery/file picker,
                          the one with `capture` opens the camera directly on phones
                          (desktop browsers ignore `capture` and show the file picker). */}
                      <input ref={galleryInputRef} type="file" accept="image/*" className="d-none" onChange={handleImageFile} disabled={uploading} />
                      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="d-none" onChange={handleImageFile} disabled={uploading} />
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center justify-content-center gap-2 flex-fill"
                          onClick={() => galleryInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Upload size={15} /> Upload
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center justify-content-center gap-2 flex-fill"
                          onClick={() => cameraInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Camera size={15} /> Take Photo
                        </button>
                      </div>
                      <div className="form-text extra-small">
                        {uploading ? 'Processing image...' : `Optional — shown on the shop page and here. Left blank, a ${form.category || 'category'}-relevant icon is used instead.`}
                      </div>
                    </div>
                  </div>
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
              <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold" disabled={saving || uploading}>
                {saving ? 'Saving...' : (editTarget ? 'Update Product' : 'Save Product')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
