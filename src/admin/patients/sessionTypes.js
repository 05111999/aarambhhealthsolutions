export const SESSION_TYPE_OPTIONS = [
  { value: 'free', label: 'Free Session' },
  { value: 'physioMorning', label: 'Physiotherapy — Morning' },
  { value: 'physioAfternoon', label: 'Physiotherapy — Afternoon' },
  { value: 'ot', label: 'OT Session' },
];

export const SESSION_TYPE_LABELS = Object.fromEntries(SESSION_TYPE_OPTIONS.map((o) => [o.value, o.label]));
