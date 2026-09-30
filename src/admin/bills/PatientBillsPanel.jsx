import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { formatMoney } from '../billing/money';
import { useBills } from './billService';

// The patient's bills on their profile — each opens the full invoice.
const PatientBillsPanel = ({ patientId, canCreate }) => {
  const { user, profile } = useAuth();
  const { bills } = useBills({ patientId }, { uid: user?.uid, role: profile?.role });

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-text-dark mb-0">Bills</h3>
        </div>
        {canCreate && (
          <Link to={`/admin/bills/new?patient=${patientId}`} className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold cursor-pointer hover:text-teal transition-colors">
            <Plus size={16} />
            Create Bill
          </Link>
        )}
      </div>
      <div className="space-y-2">
        {(bills || []).map((b) => (
          <Link
            key={b.id}
            to={`/admin/bills/${b.id}`}
            className="group flex items-center justify-between gap-3 border border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary/30 hover:bg-bg transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold font-mono text-primary mb-0">{b.billNumber}</p>
              <p className="text-xs text-text-muted mb-0 truncate">
                {(b.invoiceDate?.toDate ? b.invoiceDate.toDate() : b.createdAt?.toDate?.())?.toLocaleDateString() || 'Just now'}
                {' · '}
                {b.items?.length || 0} item{b.items?.length === 1 ? '' : 's'}
                {b.createdByName && ` · by ${b.createdBy === user?.uid ? 'you' : b.createdByName}`}
              </p>
            </div>
            <span className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold text-text-dark">{formatMoney(b.total)}</span>
              <ChevronRight size={15} className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </span>
          </Link>
        ))}
        {bills && bills.length === 0 && <p className="text-text-muted text-sm py-4 text-center mb-0">No bills yet.</p>}
      </div>
    </div>
  );
};

export default PatientBillsPanel;
