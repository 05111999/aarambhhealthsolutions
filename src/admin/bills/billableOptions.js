// Walks a department subtree and collects every priced, active node (at any depth) as
// a billable line item — a bill doesn't care how deep a service is nested.
export function getBillableOptions(allNodes, rootId) {
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
