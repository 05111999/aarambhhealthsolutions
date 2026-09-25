import React, { useEffect, useState } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Plus, Building2, Pencil } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { useUrlFilters } from '../useUrlFilters';
import DepartmentNode from './DepartmentNode';
import DepartmentFormModal from './DepartmentFormModal';
import { DEPARTMENT_FILTERS, matchesDepartmentFilter, departmentPath } from './departmentFilters';

const chipClass = (selected) =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
    selected ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:text-text-dark hover:bg-border/60'
  }`;

const DepartmentTree = () => {
  const { user } = useAuth();
  const canManage = usePermission('departments', 'manage');
  const [nodes, setNodes] = useState([]);
  const [modal, setModal] = useState(null); // { parent } | { node } | null
  const [{ filter }, setFilters] = useUrlFilters({ filter: '' });
  const activeFilter = DEPARTMENT_FILTERS.some((f) => f.value === filter) ? filter : '';

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'departments'), (snap) => {
      setNodes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const roots = nodes.filter((n) => n.parentId === null).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const nextSortOrder = (parentId) => {
    const siblings = nodes.filter((n) => n.parentId === parentId);
    return siblings.length === 0 ? 0 : Math.max(...siblings.map((n) => n.sortOrder ?? 0)) + 1;
  };

  const handleCreate = async (data) => {
    const parentId = modal?.parent?.id ?? null;
    await addDoc(collection(db, 'departments'), {
      ...data,
      parentId,
      sortOrder: nextSortOrder(parentId),
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    });
  };

  const handleEdit = async (data) => {
    await updateDoc(doc(db, 'departments', modal.node.id), {
      ...data,
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    });
  };

  const handleDelete = async (node) => {
    const hasChildren = nodes.some((n) => n.parentId === node.id);
    if (hasChildren) return; // guarded by disabled button too; defensive no-op
    if (!window.confirm(`Delete "${node.name}"? This can't be undone.`)) return;
    await deleteDoc(doc(db, 'departments', node.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-1">Departments &amp; Services</h1>
          <p className="text-text-muted text-sm">The full service catalog — unlimited nesting, fully editable.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setModal({ parent: null })}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-light-blue transition-colors"
          >
            <Plus size={18} />
            Add Department
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={() => setFilters({ filter: '' })} className={chipClass(!activeFilter)}>
          Full Tree
        </button>
        {DEPARTMENT_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilters({ filter: f.value })} className={chipClass(activeFilter === f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {activeFilter ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {nodes
            .filter((n) => matchesDepartmentFilter(n, nodes, activeFilter))
            .map((n) => ({ node: n, path: departmentPath(n, nodes) }))
            .sort((a, b) => a.path.localeCompare(b.path))
            .map(({ node, path }) => (
              <div key={node.id} className="group flex items-center gap-3 px-5 py-3 hover:bg-bg transition-colors">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${node.isActive === false ? 'text-text-muted line-through' : 'text-text-dark'}`}>
                    {node.name}
                  </p>
                  <p className="text-xs text-text-muted truncate">{path}</p>
                </div>
                {node.isActive === false && <span className="text-xs bg-bg text-text-muted px-2 py-0.5 rounded-full">Inactive</span>}
                {node.price != null ? (
                  <span className="text-xs font-mono text-teal font-semibold">₹{node.price}</span>
                ) : (
                  !nodes.some((c) => c.parentId === node.id) && <span className="text-xs text-amber-600 font-medium">No price</span>
                )}
                {canManage && (
                  <button
                    onClick={() => setModal({ node })}
                    title="Edit"
                    className="p-1.5 text-text-muted cursor-pointer hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>
            ))}
          {nodes.filter((n) => matchesDepartmentFilter(n, nodes, activeFilter)).length === 0 && (
            <p className="px-6 py-12 text-center text-text-muted text-sm">Nothing matches this filter.</p>
          )}
        </div>
      ) : (
      <div className="bg-white rounded-2xl border border-border p-4">
        {roots.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <Building2 size={32} className="mx-auto mb-3 opacity-40" />
            No departments yet.
          </div>
        ) : (
          roots.map((node) => (
            <DepartmentNode
              key={node.id}
              node={node}
              allNodes={nodes}
              depth={0}
              canManage={canManage}
              onEdit={(n) => setModal({ node: n })}
              onAddChild={(n) => setModal({ parent: n })}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
      )}

      <DepartmentFormModal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        onSubmit={modal?.node ? handleEdit : handleCreate}
        parentName={modal?.parent?.name}
        node={modal?.node}
      />
    </div>
  );
};

export default DepartmentTree;
