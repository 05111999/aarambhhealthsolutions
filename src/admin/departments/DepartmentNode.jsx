import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';

const DepartmentNode = ({ node, allNodes, depth, canManage, onEdit, onAddChild, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  const children = allNodes.filter((n) => n.parentId === node.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-bg transition-colors group"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`text-text-muted shrink-0 ${hasChildren ? '' : 'invisible'}`}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <span className={`text-sm font-medium ${node.isActive === false ? 'text-text-muted line-through' : 'text-text-dark'}`}>
          {node.name}
        </span>

        {node.isActive === false && (
          <span className="text-xs bg-bg text-text-muted px-2 py-0.5 rounded-full">Inactive</span>
        )}

        {node.price != null && <span className="text-xs font-mono text-teal font-semibold">₹{node.price}</span>}

        {canManage && (
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddChild(node)}
              title="Add sub-item"
              className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              <Plus size={15} />
            </button>
            <button
              onClick={() => onEdit(node)}
              title="Edit"
              className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onDelete(node)}
              disabled={hasChildren}
              title={hasChildren ? 'Remove sub-items first' : 'Delete'}
              className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted disabled:cursor-not-allowed"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <DepartmentNode
              key={child.id}
              node={child}
              allNodes={allNodes}
              depth={depth + 1}
              canManage={canManage}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentNode;
