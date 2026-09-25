import React, { useEffect, useState } from 'react';
import { collection, doc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ClipboardList, Plus, Pencil, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { usePermission } from '../permissions/usePermission';
import { SESSION_TYPE_LABELS } from './sessionTypes';
import AddEditSessionLogModal from './AddEditSessionLogModal';

// readOnly: the patient is in the Trash — show history, allow no changes.
const SessionLogPanel = ({ patientId, readOnly = false }) => {
  const canCreate = usePermission('sessionLogs', 'create') && !readOnly;
  const canManage = usePermission('sessionLogs', 'manage') && !readOnly;

  const [logs, setLogs] = useState([]);
  const [modalState, setModalState] = useState(null); // null | 'new' | logObject

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'patients', patientId, 'sessionLogs'), orderBy('date', 'desc')),
      (snap) => setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsubscribe;
  }, [patientId]);

  const handleDelete = async (logId) => {
    if (!window.confirm('Delete this session log entry? This cannot be undone.')) return;
    await deleteDoc(doc(db, 'patients', patientId, 'sessionLogs', logId));
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-text-dark mb-0">Treatment Progress</h3>
        </div>
        {canCreate && (
          <button
            onClick={() => setModalState('new')}
            className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:text-teal transition-colors"
          >
            <Plus size={16} />
            Add Entry
          </button>
        )}
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-3 border border-border rounded-lg px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-medium text-text-dark">
                  {log.date?.toDate ? log.date.toDate().toLocaleDateString() : '—'}
                </span>
                <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full font-medium">
                  {SESSION_TYPE_LABELS[log.sessionType] || log.sessionType}
                </span>
              </div>
              {log.notes && <p className="text-sm text-text-muted">{log.notes}</p>}
            </div>
            {canManage && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setModalState(log)}
                  title="Edit"
                  className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(log.id)}
                  title="Delete"
                  className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
        {logs.length === 0 && <p className="text-text-muted text-sm py-4 text-center">No session logs yet.</p>}
      </div>

      <AddEditSessionLogModal
        isOpen={!!modalState}
        onClose={() => setModalState(null)}
        patientId={patientId}
        log={modalState === 'new' ? null : modalState}
      />
    </div>
  );
};

export default SessionLogPanel;
