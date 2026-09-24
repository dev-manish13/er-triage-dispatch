import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Loader2 } from 'lucide-react';
import api from '../../api/client';

function ActiveTreatments() {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [releasingId, setReleasingId] = useState(null);

  const fetchTreatments = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/active-treatments');
      setTreatments(data.treatments);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  async function handleRelease(assignmentId) {
    setReleasingId(assignmentId);
    setError(null);
    try {
      await api.post('/admin/release-treatment', { assignmentId, outcome: 'Stable' });
      fetchTreatments();
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setReleasingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="text-red-600" size={18} />
          <h3 className="font-semibold text-gray-800">Active ER Treatments</h3>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : treatments.length === 0 ? (
          <p className="text-sm text-gray-400">No patients currently in treatment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-4">Patient</th>
                  <th className="py-2 pr-4">Doctor Name & Rank</th>
                  <th className="py-2 pr-4">Bed / Room Number</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {treatments.map((t) => (
                  <tr key={t.assignment_id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-800">{t.patient_name}</td>
                    <td className="py-2 pr-4 text-gray-600">
                      {t.doctor_name ? (
                        <>
                          {t.doctor_name}
                          <span className="block text-xs text-gray-400">{t.doctor_rank}</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{t.bed_number ?? '—'}</td>
                    <td className="py-2 pr-4 text-gray-600">{t.treatment_status}</td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        disabled={releasingId === t.assignment_id}
                        onClick={() => handleRelease(t.assignment_id)}
                        className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60 cursor-pointer"
                      >
                        {releasingId === t.assignment_id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Mark Stable & Release
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActiveTreatments;
