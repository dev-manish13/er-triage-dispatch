import { AlertTriangle } from 'lucide-react';
import { CAPACITY_STYLES, getCapacityLevel } from '../../utils/capacity';

function SurgeGauge({ totalBeds, occupiedBeds }) {
  const pct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const s = CAPACITY_STYLES[getCapacityLevel(pct)];

  return (
    <div className={`rounded-xl border p-5 ${s.bg}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className={s.text} size={18} />
          <span className={`font-semibold ${s.text}`}>ER Surge Capacity — {s.label}</span>
        </div>
        <span className={`text-sm font-medium ${s.text}`}>
          {occupiedBeds} / {totalBeds} beds occupied ({pct}%)
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full transition-all ${s.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export default SurgeGauge;
