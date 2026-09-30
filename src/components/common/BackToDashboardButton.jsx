import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';

// When staff open the public website from the admin panel ("Website" button), this
// shows a small "Back to Dashboard" button that returns them to the admin page they
// left. It only reads a note kept in this browser tab — no sign-in code is loaded on the
// public site, and the admin pages still require login as usual.
export const STAFF_RETURN_KEY = 'aarambh.staffReturnTo';

const readReturnPath = () => {
  try {
    const path = sessionStorage.getItem(STAFF_RETURN_KEY);
    return path && path.startsWith('/admin') ? path : null;
  } catch {
    return null;
  }
};

const BackToDashboardButton = () => {
  const navigate = useNavigate();
  const [returnTo, setReturnTo] = useState(readReturnPath);
  if (!returnTo) return null;

  const clear = () => {
    try {
      sessionStorage.removeItem(STAFF_RETURN_KEY);
    } catch {
      // storage unavailable — nothing to clear
    }
    setReturnTo(null);
  };

  return (
    <div className="fixed top-[84px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-text-dark text-white rounded-full shadow-lg pl-1 pr-1.5 py-1 max-w-[calc(100vw-2rem)]">
      <button
        onClick={() => {
          clear();
          navigate(returnTo);
        }}
        className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors whitespace-nowrap"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>
      <button onClick={clear} aria-label="Hide" className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

export default BackToDashboardButton;
