// Which partner hospital brands a patient's bills and payment receipts.
// - Referred by a hospital (Inpatient) → that hospital.
// - Direct patients (Out Patient, Home Visit, Virtual) → the clinic's own hospital,
//   chosen by the Super Admin in Settings › Bill Settings.

const active = (hospitals) => hospitals.filter((h) => h.isActive !== false);
const sameName = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

// The clinic's own hospital entry. Until the Super Admin picks one, an entry named
// "AArambh…" (or the only active hospital) is used.
export function ownHospital(hospitals, ownHospitalId) {
  const list = active(hospitals);
  return (
    list.find((h) => h.id === ownHospitalId) ||
    list.find((h) => /aarambh/i.test(h.name || '')) ||
    (list.length === 1 ? list[0] : null)
  );
}

// The referring hospital of a hospital-referred patient. Older records only have the
// hospital's name, so a name match is tried too. null if it isn't a partner hospital.
export function referringHospital(patient, hospitals) {
  if (!patient?.referredFromHospital) return null;
  const list = active(hospitals);
  return list.find((h) => h.id === patient.referringHospitalId) || list.find((h) => sameName(h.name, patient.referringHospitalName)) || null;
}

// null → the biller has to choose (e.g. referred by a hospital that isn't set up).
export function defaultHospitalFor(patient, hospitals, ownHospitalId) {
  if (!patient) return null;
  if (patient.referredFromHospital) return referringHospital(patient, hospitals);
  return ownHospital(hospitals, ownHospitalId);
}

// Text snapshot stored on bills and receipts, so they print unchanged later.
export const hospitalSnapshot = (h) => ({
  name: h?.name || '',
  addressLine1: h?.addressLine1 || '',
  addressLine2: h?.addressLine2 || '',
  phone: h?.phone || '',
  email: h?.email || '',
  website: h?.website || '',
  footerLines: h?.footerLines || [],
});
