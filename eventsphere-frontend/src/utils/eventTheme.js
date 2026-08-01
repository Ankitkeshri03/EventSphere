// Deterministic cover art per event, since events have no uploaded cover photo (yet).
// Rotates through a fixed set of on-brand gradients keyed by event id, so the same
// event always renders the same "cover" and the grid still reads as colorful/varied.
const GRADIENTS = [
  'from-violet-500 to-fuchsia-500',
  'from-indigo-500 to-sky-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-cyan-400',
];

export function eventGradient(id) {
  const index = Number(id) % GRADIENTS.length;
  return GRADIENTS[Number.isNaN(index) ? 0 : index];
}

export function eventInitial(title = '') {
  return title.trim().charAt(0).toUpperCase() || 'E';
}
