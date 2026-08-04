import React from 'react';
import { Plus } from 'lucide-react';

const PaymentsHeader = ({ onAdd }) => (
  <div className="d-flex align-items-start justify-content-between mb-4">
    <div><h5 className="fw-bold mb-1">Pending Payments</h5><p className="text-muted small">Track customer dues</p></div>
    <button className="btn btn-primary d-flex align-items-center gap-2" onClick={onAdd}><Plus size={18} /> Add New</button>
  </div>
);

export default PaymentsHeader;
