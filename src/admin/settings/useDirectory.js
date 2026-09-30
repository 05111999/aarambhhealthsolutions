import { useMemo } from 'react';
import { useLiveSource } from '../data/liveStore';
import { SOURCES } from '../data/sources';

// Shared live sources: every screen and dropdown that needs these reuses one listener,
// kept for a while after the last screen closes so navigating back costs no reads.
function useSortedByName(spec) {
  const { data, loaded } = useLiveSource(spec);
  const rows = useMemo(() => [...(data || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [data]);
  return { rows, loaded };
}

// Partner hospitals that brand a bill (Settings › Hospitals).
export function useHospitals() {
  const { rows, loaded } = useSortedByName(SOURCES.hospitals);
  return { hospitals: rows, loaded };
}

// Super Admin's bill settings (Settings › Bill Settings): the tax % applied to every new
// bill, and the clinic's own hospital (brands direct patients' bills and receipts).
export function useBillSettings() {
  const { data, loaded } = useLiveSource(SOURCES.billSettings);
  return { taxPercent: data?.taxPercent ?? 0, ownHospitalId: data?.ownHospitalId ?? null, loaded };
}

// Therapists selectable as a bill's physician and assignable to patients (Settings › Therapists).
export function useTherapists() {
  const { rows, loaded } = useSortedByName(SOURCES.therapists);
  return { therapists: rows, loaded };
}
