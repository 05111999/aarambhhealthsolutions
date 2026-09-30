import React from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, ArrowRight } from 'lucide-react';
import { useHelp } from './useHelp';

// Small "Need help?" link to a guide, shown on a page only if the viewer can see that guide.
const HelpLink = ({ article, label, className = '' }) => {
  const { byId } = useHelp();
  const target = byId.get(article);
  if (!target) return null;
  return (
    <Link
      to={`/admin/help/${article}`}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-teal transition-colors ${className}`}
      data-testid="help-link"
    >
      <LifeBuoy size={14} className="shrink-0" />
      <span>Need help? {label || target.title}</span>
      <ArrowRight size={12} className="shrink-0" />
    </Link>
  );
};

export default HelpLink;
