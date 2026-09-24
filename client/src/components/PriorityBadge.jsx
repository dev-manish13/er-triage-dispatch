const COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-300',
  urgent: 'bg-orange-100 text-orange-700 border-orange-300',
  moderate: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  low: 'bg-green-100 text-green-700 border-green-300',
};

function PriorityBadge({ level, score }) {
  const classes = COLORS[level] ?? 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold capitalize ${classes}`}>
      {level}
      {score !== undefined && score !== null && <span className="font-normal">· {score}</span>}
    </span>
  );
}

export default PriorityBadge;
