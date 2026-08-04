import { Plus, Search } from 'lucide-react';
import SuggestionInput from '../common/SuggestionInput';

const ProductHeader = ({ search, onSearch, products = [], onAdd, onBulk }) => (
  <div className="d-flex align-items-start justify-content-between mb-3 px-1">
    <div className="d-flex align-items-center gap-4 flex-grow-1">
      <div>
        <h5 className="fw-bold mb-1">Stock & Operations</h5>
        <p className="text-muted extra-small mb-0">Manage everything from crackers to quantities</p>
      </div>
      <div className="flex-grow-1" style={{ maxWidth: '400px' }}>
        <SuggestionInput value={search} onChange={onSearch} onSelect={onSearch} 
          placeholder="Filter stock by name..." options={products.map(p => ({ label: p.name, subText: p.brand, data: p.name }))} />
      </div>
    </div>
    <div className="d-flex gap-2">
      <label className="btn btn-light mb-0 border shadow-sm fw-bold px-3 d-flex align-items-center">
        Bulk CSV <input type="file" hidden accept=".csv" onChange={onBulk} />
      </label>
      <button className="btn btn-primary shadow-sm px-4 fw-bold" onClick={onAdd}>
        <Plus size={16} className="me-1" /> New Stock
      </button>
    </div>
  </div>
);

export default ProductHeader;
