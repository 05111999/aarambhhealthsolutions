import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { timeAgo } from '../timeAgo';

const KIND_LABELS = { patients: 'Patients', billing: 'Billing', sessions: 'Sessions', inquiries: 'Inquiries' };
const MAX_ITEMS = 12;

const ActivityFeed = ({ events, kinds }) => {
  const [kind, setKind] = useState('all');
  const visible = useMemo(
    () => events.filter((e) => kind === 'all' || e.kind === kind).slice(0, MAX_ITEMS),
    [events, kind]
  );

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      {kinds.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', ...kinds].map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                kind === k ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:text-text-dark hover:bg-border/60'
              }`}
            >
              {k === 'all' ? 'All' : KIND_LABELS[k]}
            </button>
          ))}
        </div>
      )}

      <div className="divide-y divide-border">
        {visible.map((e) => (
          <Link
            key={e.id}
            to={e.to}
            className="group flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-bg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className={`p-2 rounded-full shrink-0 ${e.tone}`}>
              <e.icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-dark group-hover:text-primary transition-colors truncate">{e.title}</p>
              <p className="text-xs text-text-muted truncate">{e.detail}</p>
            </div>
            <span className="text-xs text-text-muted shrink-0">{timeAgo(e.at)}</span>
            <ChevronRight size={14} className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
        {visible.length === 0 && <p className="text-sm text-text-muted text-center py-8">No recent activity.</p>}
      </div>
    </div>
  );
};

export default ActivityFeed;
