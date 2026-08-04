import React from 'react';
import { Plus } from 'lucide-react';

const CustomerHeader = ({ onAdd }) => (
  <div className="d-flex align-items-start justify-content-between mb-4">
    <div><h5 className="fw-bold mb-1">Customer Management</h5><p className="text-muted small mb-0">Maintain your directory</p></div>
    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={onAdd}>
      <Plus size={18} /> Add Customer</button>
  </div>
);

export default CustomerHeader;
