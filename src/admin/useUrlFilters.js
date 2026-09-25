import { useSearchParams } from 'react-router-dom';

// Filters live in the URL so dashboard links can land on a pre-filtered list, and the
// back button / a shared link reproduce exactly the same view. A value equal to its
// default is dropped from the URL to keep links short.
export function useUrlFilters(defaults) {
  const [params, setParams] = useSearchParams();

  const values = Object.fromEntries(Object.entries(defaults).map(([key, def]) => [key, params.get(key) ?? def]));

  const setFilters = (updates, { reset = false } = {}) => {
    const next = reset ? new URLSearchParams() : new URLSearchParams(params);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === null || value === '' || value === defaults[key]) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  const isDefault = Object.entries(defaults).every(([key, def]) => values[key] === def);

  return [values, setFilters, isDefault];
}
