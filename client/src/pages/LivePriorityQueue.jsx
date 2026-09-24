import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ListOrdered, RefreshCw } from 'lucide-react';
import api from '../api/client';
import PriorityBadge from '../components/PriorityBadge';

const POLL_INTERVAL_MS = 5000;
const RECHECK_THRESHOLD_MINUTES = 15;

function formatAge(dateOfBirth) {
  if (!dateOfBirth) return '—';
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return '—';
  const years = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return `${years}y`;
}

function minutesSince(timestamp) {
  return Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatClockTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function LivePriorityQueue() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await api.get('/queue/live');
      setPatients(data.patients);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const id = setInterval(fetchQueue, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchQueue]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="text-red-600" size={24} />
          <h1 className="text-2xl font-semibold text-gray-800">Live Priority Queue</h1>
        </div>
        <button
          type="button"
          onClick={fetchQueue}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading queue…</p>
      ) : patients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500">
          No patients currently waiting.
        </div>
      ) : (
        <ul className="space-y-3">
          {patients.map((p, i) => {
            const waitedMinutes = minutesSince(p.arrival_time);
            const needsRecheck = waitedMinutes > RECHECK_THRESHOLD_MINUTES;
            return (
              <li
                key={p.patient_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{p.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {formatAge(p.date_of_birth)} · {p.gender} · Arrived {formatClockTime(p.arrival_time)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-400">waiting {formatDuration(waitedMinutes)}</span>
                  {needsRecheck && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300 bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                      <AlertTriangle size={12} />
                      Needs Vitals Re-Check
                    </span>
                  )}
                  <PriorityBadge level={p.priority_level} score={p.severity_score} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default LivePriorityQueue;
