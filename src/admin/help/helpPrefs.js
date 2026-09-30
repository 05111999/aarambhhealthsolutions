// Bookmarks and recently viewed guides — kept in this browser only (no database writes).
// Every access is guarded: private windows or blocked storage simply mean no history.
const KEY = 'aarambh.help.v1';

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [], recent: Array.isArray(data.recent) ? data.recent : [] };
  } catch {
    return { bookmarks: [], recent: [] };
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage unavailable — preferences just aren't remembered
  }
}

export const getHelpPrefs = read;

export function toggleBookmark(id) {
  const data = read();
  data.bookmarks = data.bookmarks.includes(id) ? data.bookmarks.filter((b) => b !== id) : [id, ...data.bookmarks].slice(0, 30);
  write(data);
  return data;
}

export function markViewed(id) {
  const data = read();
  data.recent = [id, ...data.recent.filter((r) => r !== id)].slice(0, 8);
  write(data);
  return data;
}
