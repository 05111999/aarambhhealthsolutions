import React, { useEffect, useState } from 'react';
import { collection, doc, query, orderBy, onSnapshot, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Inbox, Phone, Mail, Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { useUrlFilters } from '../useUrlFilters';

const FILTER_DEFAULTS = { tab: 'inquiries', status: 'all', type: 'all' };

const INQUIRY_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'booking', label: 'Consultation Requests' },
  { value: 'contact', label: 'Messages' },
];

const chipClass = (selected) =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium capitalize cursor-pointer transition-colors ${
    selected ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:text-text-dark hover:bg-border/60'
  }`;

const TABS = [
  { key: 'inquiries', label: 'Consultations & Messages', collection: 'inquiries' },
  { key: 'applications', label: 'Job Applications', collection: 'jobApplications' },
];

const STATUS_OPTIONS = {
  inquiries: ['new', 'contacted', 'closed'],
  applications: ['new', 'reviewed', 'closed'],
};

const StatusBadge = ({ status }) => {
  const tone = status === 'new' ? 'bg-amber-50 text-amber-600' : status === 'closed' ? 'bg-bg text-text-muted' : 'bg-teal/10 text-teal';
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${tone}`}>{status}</span>;
};

const InquiriesPage = () => {
  const { user } = useAuth();
  const canManage = usePermission('inquiries', 'manage');

  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const activeTab = TABS.some((t) => t.key === filters.tab) ? filters.tab : 'inquiries';
  const [items, setItems] = useState([]);

  const tab = TABS.find((t) => t.key === activeTab);

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, tab.collection), orderBy('createdAt', 'desc')), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [tab.collection]);

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, tab.collection, id), { status, updatedBy: user.uid, updatedAt: serverTimestamp() });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission? This cannot be undone.')) return;
    await deleteDoc(doc(db, tab.collection, id));
  };

  const newCount = items.filter((i) => i.status === 'new').length;
  const visibleItems = items
    .filter((i) => filters.status === 'all' || i.status === filters.status)
    .filter((i) => activeTab !== 'inquiries' || filters.type === 'all' || i.type === filters.type);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-1">Inquiries &amp; Applications</h1>
          <p className="text-text-muted text-sm">Booking requests, contact messages, and job applications from the public site.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            // Status/type options differ per tab, so switching tabs starts from a clean filter.
            onClick={() => setFilters({ tab: t.key }, { reset: true })}
            className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px cursor-pointer transition-colors ${
              activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-dark'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border p-4 mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-14">Status</span>
          {['all', ...STATUS_OPTIONS[activeTab]].map((s) => (
            <button key={s} onClick={() => setFilters({ status: s })} className={chipClass(filters.status === s)}>
              {s}
            </button>
          ))}
        </div>
        {activeTab === 'inquiries' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-14">Type</span>
            {INQUIRY_TYPES.map((t) => (
              <button key={t.value} onClick={() => setFilters({ type: t.value })} className={chipClass(filters.type === t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {newCount > 0 && filters.status !== 'new' && (
        <button
          onClick={() => setFilters({ status: 'new' })}
          className="bg-amber-50 border border-amber-100 text-amber-700 text-sm font-medium px-4 py-2.5 rounded-lg mb-6 inline-flex items-center gap-2 cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <Inbox size={16} />
          {newCount} new {newCount === 1 ? 'submission' : 'submissions'} awaiting review — show only new
        </button>
      )}

      <div className="space-y-3">
        {visibleItems.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-border/50 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h3 className="text-base font-bold text-text-dark mb-0">{item.name}</h3>
                  <StatusBadge status={item.status} />
                  {activeTab === 'inquiries' && (
                    <span className="text-xs bg-bg text-text-muted px-2 py-0.5 rounded-full capitalize">{item.type}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted mb-3">
                  {item.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={12} /> {item.phone}
                    </span>
                  )}
                  {item.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail size={12} /> {item.email}
                    </span>
                  )}
                  {item.preferredDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> {item.preferredDate}
                    </span>
                  )}
                  <span>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Just now'}</span>
                </div>

                {activeTab === 'inquiries' ? (
                  <>
                    {item.service && <p className="text-sm text-text-dark font-medium mb-1">Interested in: {item.service}</p>}
                    {item.message && <p className="text-sm text-text-muted">{item.message}</p>}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-text-dark font-medium mb-1">
                      Applying for: {item.roleAppliedFor} {item.yearsOfExperience && `· ${item.yearsOfExperience} yrs experience`}
                    </p>
                    {item.coverNote && <p className="text-sm text-text-muted mb-2">{item.coverNote}</p>}
                  </>
                )}
              </div>

              {canManage && (
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item.id, e.target.value)}
                    className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-primary/20 outline-none capitalize"
                  >
                    {STATUS_OPTIONS[activeTab].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                    className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {visibleItems.length === 0 && (
          <div className="bg-white rounded-2xl border border-border/50 p-12 text-center text-text-muted">
            <CheckCircle2 size={28} className="mx-auto mb-3 opacity-40" />
            {items.length === 0 ? `No ${tab.label.toLowerCase()} yet.` : 'Nothing matches these filters.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiriesPage;
