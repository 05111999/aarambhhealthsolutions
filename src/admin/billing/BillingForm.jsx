import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Receipt } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { toDateInputValue, dateInputToTimestamp, isTodayInputValue } from '../../lib/dateInput';
import { roundMoney, formatMoney } from './money';

const inputClasses =
  'w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

// Walks a department subtree and collects every priced, active node (at any depth) as
// a billable line item — the billing form doesn't care how deep a service is nested.
function getBillableOptions(allNodes, rootId) {
  const options = [];
  const walk = (nodeId, pathNames) => {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) return;
    const path = [...pathNames, node.name];
    if (node.price != null && node.isActive !== false) {
      options.push({ id: node.id, name: node.name, price: node.price, pathLabel: path.slice(1).join(' → ') || node.name });
    }
    allNodes.filter((n) => n.parentId === nodeId).forEach((child) => walk(child.id, path));
  };
  walk(rootId, []);
  return options;
}

const BillingForm = ({ isOpen, onClose, patientId, encounterId, onCreated }) => {
  const { user } = useAuth();
  const canDiscount = usePermission('billing', 'discount');
  const canBackdate = usePermission('billing', 'backdate');

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [billDate, setBillDate] = useState(toDateInputValue(new Date()));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getDocs(collection(db, 'departments')).then((snap) => {
      setDepartments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    setDepartmentId('');
    setServiceId('');
    setPrice('');
    setDiscount('');
    setBillDate(toDateInputValue(new Date()));
  }, [isOpen]);

  const roots = departments.filter((d) => d.parentId === null && d.isActive !== false);
  const billableOptions = useMemo(
    () => (departmentId ? getBillableOptions(departments, departmentId) : []),
    [departments, departmentId]
  );

  const netAmount = Math.max(0, roundMoney((Number(price) || 0) - (Number(discount) || 0)));

  const handleServiceChange = (id) => {
    setServiceId(id);
    const option = billableOptions.find((o) => o.id === id);
    setPrice(option ? String(option.price) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const department = departments.find((d) => d.id === departmentId);
    const service = billableOptions.find((o) => o.id === serviceId);
    if (!department || !service) return;

    setSubmitting(true);
    try {
      const amount = roundMoney(price);
      const discountAmount = canDiscount ? roundMoney(discount) : 0;
      await addDoc(collection(db, 'patients', patientId, 'transactions'), {
        type: 'charge',
        departmentId: department.id,
        departmentName: department.name,
        serviceName: service.pathLabel,
        amount,
        discountAmount,
        discountReason: '',
        netAmount: Math.max(0, roundMoney(amount - discountAmount)),
        encounterId: encounterId || null,
        date: canBackdate && !isTodayInputValue(billDate) ? dateInputToTimestamp(billDate) : serverTimestamp(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      onCreated?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-text-dark/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[101] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-border bg-bg">
                <h3 className="text-xl font-bold text-primary mb-0">Bill a Service</h3>
                <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors p-1">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {canBackdate && (
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">
                      Bill Date <span className="text-text-muted font-normal">(defaults to today)</span>
                    </label>
                    <input
                      type="date"
                      value={billDate}
                      max={toDateInputValue(new Date())}
                      onChange={(e) => setBillDate(e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Department *</label>
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      setServiceId('');
                      setPrice('');
                    }}
                    className={`${inputClasses} bg-white`}
                  >
                    <option value="">Select a department</option>
                    {roots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {departmentId && (
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Service *</label>
                    <select
                      required
                      value={serviceId}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      className={`${inputClasses} bg-white`}
                    >
                      <option value="">Select a service</option>
                      {billableOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.pathLabel} — ₹{o.price}
                        </option>
                      ))}
                    </select>
                    {billableOptions.length === 0 && (
                      <p className="text-xs text-text-muted mt-1">
                        No priced services under this department yet — add pricing in Departments &amp; Services first.
                      </p>
                    )}
                  </div>
                )}

                {serviceId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className={inputClasses}
                      />
                    </div>

                    {canDiscount && (
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Discount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          className={inputClasses}
                        />
                      </div>
                    )}

                    <div className="bg-bg rounded-lg px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-text-dark">Net Amount</span>
                      <span className="text-lg font-bold text-primary">{formatMoney(netAmount)}</span>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={submitting || !serviceId}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
                >
                  {submitting ? 'Billing…' : 'Add Charge'}
                  {!submitting && <Receipt size={18} />}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BillingForm;
