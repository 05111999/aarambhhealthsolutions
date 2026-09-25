// Shared by the Departments page filter and the dashboard counts, so a card's number
// always equals the number of rows its link lands on.
export const DEPARTMENT_FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'priced', label: 'Priced' },
  { value: 'unpriced', label: 'Needs Pricing' },
];

const isLeaf = (node, allNodes) => !allNodes.some((n) => n.parentId === node.id);

export function matchesDepartmentFilter(node, allNodes, filter) {
  switch (filter) {
    case 'active':
      return node.isActive !== false;
    case 'inactive':
      return node.isActive === false;
    case 'priced':
      return node.price != null;
    case 'unpriced':
      // Only active leaf services can actually be billed, so only they "need" a price —
      // a parent department is a container and never carries one.
      return node.isActive !== false && node.price == null && isLeaf(node, allNodes);
    default:
      return true;
  }
}

export function departmentPath(node, allNodes) {
  const names = [];
  let cursor = node;
  while (cursor) {
    names.unshift(cursor.name);
    cursor = cursor.parentId ? allNodes.find((n) => n.id === cursor.parentId) : null;
  }
  return names.join(' → ');
}
