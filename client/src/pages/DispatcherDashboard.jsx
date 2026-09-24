import { useCallback, useEffect, useState } from 'react';
import { BedDouble, Loader2, Stethoscope, Users, Zap } from 'lucide-react';
import api from '../api/client';
import Accordion from '../components/Accordion';
import PriorityBadge from '../components/PriorityBadge';

const BED_CATEGORIES = [
  { bedType: 'General', label: 'General Beds' },
  { bedType: 'Emergency', label: 'Dedicated ER Beds' },
  { bedType: 'ICU', label: 'ICU Beds' },
];

function DispatcherDashboard() {
  const [resources, setResources] = useState({ doctors: [], beds: [] });
  const [loadingResources, setLoadingResources] = useState(true);
  const [error, setError] = useState(null);

  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  const fetchResources = useCallback(async () => {
    try {
      const { data } = await api.get('/resources');
      setResources(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setLoadingResources(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  async function handleDispatch() {
    setDispatching(true);
    setError(null);
    try {
      const { data } = await api.post('/dispatch/execute', {});
      setDispatchResult(data);
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setDispatching(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="text-red-600" size={24} />
          <h1 className="text-2xl font-semibold text-gray-800">Dispatcher Dashboard</h1>
        </div>
        <button
          type="button"
          onClick={handleDispatch}
          disabled={dispatching}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {dispatching ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
          {dispatching ? 'Matching…' : 'Execute Hungarian Matching'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ResourcePanel
          title="Available Doctors"
          icon={Stethoscope}
          loading={loadingResources}
          items={resources.doctors}
          renderItem={(d) => (
            <>
              <p className="font-medium text-gray-800">{d.full_name}</p>
              <p className="text-sm text-gray-500">{d.rank}</p>
            </>
          )}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <BedDouble className="text-red-600" size={18} />
            <h2 className="font-semibold text-gray-800">Available Beds</h2>
            <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              {resources.beds.length}
            </span>
          </div>
          {loadingResources ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <div className="space-y-2">
              {BED_CATEGORIES.map(({ bedType, label }) => {
                const bedsOfType = resources.beds.filter((b) => b.bed_type === bedType);
                return (
                  <Accordion key={bedType} title={`${label} (${bedsOfType.length} Available)`}>
                    {bedsOfType.length === 0 ? (
                      <p className="text-sm text-gray-400">None available</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {bedsOfType.map((b) => (
                          <span
                            key={b.bed_id}
                            className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5 text-center text-sm text-gray-700"
                          >
                            {b.bed_number}
                          </span>
                        ))}
                      </div>
                    )}
                  </Accordion>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {dispatchResult && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Dispatch Result</h2>
            <span className="text-sm text-gray-500">
              {dispatchResult.assignedCount ?? 0} of {dispatchResult.waitingCount ?? 0} patients matched
            </span>
          </div>

          {dispatchResult.message && <p className="text-sm text-gray-500">{dispatchResult.message}</p>}

          {dispatchResult.assignments?.length > 0 && (
            <ul className="space-y-3">
              {dispatchResult.assignments.map((a) => (
                <li
                  key={a.assignmentId}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <PriorityBadge level={a.priorityLevel} score={a.priorityScore} />
                    <span className="font-medium text-gray-800">{a.patientName}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Stethoscope size={14} />
                      {a.doctor ? a.doctor.name : 'No doctor assigned'}
                    </span>
                    <span className="flex items-center gap-1">
                      <BedDouble size={14} />
                      {a.bed ? a.bed.bedNumber : 'No bed assigned'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ResourcePanel({ title, icon: Icon, loading, items, renderItem }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="text-red-600" size={18} />
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          {items.length}
        </span>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">None available</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.doctor_id ?? item.bed_id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DispatcherDashboard;
