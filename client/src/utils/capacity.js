export function getCapacityLevel(pct) {
  if (pct > 85) return 'red';
  if (pct >= 70) return 'yellow';
  return 'green';
}

export const CAPACITY_STYLES = {
  green: { bar: 'bg-green-500', bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Normal' },
  yellow: { bar: 'bg-yellow-500', bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: 'Elevated' },
  red: { bar: 'bg-red-500', bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Surge Alert' },
};
