import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { timeAgo } from '../timeAgo';

const NotificationRow = ({ n, onOpen }) => (
  <button
    onClick={() => onOpen(n)}
    className={`group w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-bg focus:outline-none focus-visible:bg-bg ${
      n.unread ? 'bg-primary/[0.04]' : ''
    }`}
  >
    <div className={`p-2 rounded-full shrink-0 ${n.tone}`}>
      <n.icon size={14} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm leading-snug group-hover:text-primary transition-colors ${n.unread ? 'font-semibold text-text-dark' : 'text-text-dark'}`}>
        {n.title}
      </p>
      {n.detail && <p className="text-xs text-text-muted truncate mt-0.5">{n.detail}</p>}
      {n.at && <p className="text-[11px] text-text-muted mt-0.5">{timeAgo(n.at)}</p>}
    </div>
    <div className="flex items-center gap-1.5 shrink-0 pt-1">
      {n.unread && <span className="w-2 h-2 rounded-full bg-primary" aria-label="Unread" />}
      <ChevronRight size={14} className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </div>
  </button>
);

const NotificationBell = ({ notifications }) => {
  const { items, unreadCount, markRead, markAllRead } = notifications;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openNotification = (n) => {
    if (n.unread) markRead(n.id);
    setOpen(false);
    navigate(n.to);
  };

  const alerts = items.filter((n) => n.kind === 'alert');
  const events = items.filter((n) => n.kind === 'event');

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        className={`relative p-2 rounded-lg cursor-pointer transition-colors ${open ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-bg hover:text-primary'}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-border shadow-2xl shadow-text-dark/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-text-dark">
              Notifications
              {unreadCount > 0 && <span className="ml-1.5 text-xs font-medium text-text-muted">{unreadCount} unread</span>}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary cursor-pointer hover:text-teal transition-colors"
              >
                <CheckCheck size={14} />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {alerts.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Needs attention</p>
                <div className="divide-y divide-border">
                  {alerts.map((n) => (
                    <NotificationRow key={n.id} n={n} onOpen={openNotification} />
                  ))}
                </div>
              </>
            )}
            {events.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Recent</p>
                <div className="divide-y divide-border">
                  {events.map((n) => (
                    <NotificationRow key={n.id} n={n} onOpen={openNotification} />
                  ))}
                </div>
              </>
            )}
            {items.length === 0 && (
              <div className="px-4 py-10 text-center">
                <CheckCheck size={24} className="mx-auto mb-2 text-teal" />
                <p className="text-sm font-medium text-text-dark">You&apos;re all caught up</p>
                <p className="text-xs text-text-muted mt-0.5">New notifications will show up here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
