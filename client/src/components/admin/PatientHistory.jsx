import { useCallback, useEffect, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import api from '../../api/client';
import Modal from '../Modal';
import PriorityBadge from '../PriorityBadge';

const STATUS_COLORS = {
  Stable: 'bg-blue-100 text-blue-700 border-blue-300',
  Discharged: 'bg-gray-100 text-gray-600 border-gray-300',
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDuration(minutes) {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function PatientHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/history');
      setHistory(data.history);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function openDetail(patientId) {
    setSelectedId(patientId);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/history/${patientId}`);
      setDetail(data);
    } catch (err) {
      setDetailError(err.response?.data?.error ?? err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
  }

  const totalErMinutes =
    detail?.patient?.arrival_time && detail?.assignment?.released_at
      ? Math.round(
          (new Date(detail.assignment.released_at).getTime() - new Date(detail.patient.arrival_time).getTime()) /
            60000,
        )
      : null;

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <History className="text-red-600" size={18} />
          <h3 className="font-semibold text-gray-800">Patient History</h3>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">No released patients yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-4">Patient</th>
                  <th className="py-2 pr-4">Arrival Time</th>
                  <th className="py-2 pr-4">Treated By</th>
                  <th className="py-2 pr-4">Room / Bed</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr
                    key={h.patient_id}
                    onClick={() => openDetail(h.patient_id)}
                    className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="py-2 pr-4 font-medium text-gray-800">{h.full_name}</td>
                    <td className="py-2 pr-4 text-gray-600">{formatDateTime(h.arrival_time)}</td>
                    <td className="py-2 pr-4 text-gray-600">{h.doctor_name ?? '—'}</td>
                    <td className="py-2 pr-4 text-gray-600">{h.bed_number ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_COLORS[h.treatment_status] ?? ''
                        }`}
                      >
                        {h.treatment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <Modal title="Patient Record" onClose={closeDetail}>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : detailError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {detailError}
            </div>
          ) : detail ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">{detail.patient.full_name}</h3>
                {detail.triage && (
                  <PriorityBadge level={detail.triage.priority_level} score={detail.triage.severity_score} />
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <DetailItem label="Arrival Time" value={formatDateTime(detail.patient.arrival_time)} />
                <DetailItem label="Total Time in ER" value={formatDuration(totalErMinutes)} />
                <DetailItem label="Doctor" value={detail.assignment?.doctor_name ?? '—'} />
                <DetailItem label="Doctor Rank" value={detail.assignment?.doctor_rank ?? '—'} />
                <DetailItem label="Bed / Room" value={detail.assignment?.bed_number ?? '—'} />
                <DetailItem label="Status" value={detail.patient.treatment_status} />
              </dl>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Initial Vitals</h4>
                {detail.vitals ? (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                    <DetailItem label="Heart Rate" value={detail.vitals.heart_rate != null ? `${detail.vitals.heart_rate} bpm` : '—'} />
                    <DetailItem
                      label="Blood Pressure"
                      value={
                        detail.vitals.systolic_bp != null
                          ? `${detail.vitals.systolic_bp}/${detail.vitals.diastolic_bp ?? '—'}`
                          : '—'
                      }
                    />
                    <DetailItem label="SpO2" value={detail.vitals.spo2 != null ? `${detail.vitals.spo2}%` : '—'} />
                    <DetailItem label="Pain Index" value={detail.vitals.pain_score ?? '—'} />
                    <DetailItem label="Consciousness" value={detail.vitals.consciousness_level ?? '—'} />
                  </dl>
                ) : (
                  <p className="text-sm text-gray-400">No vitals recorded.</p>
                )}
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-medium capitalize text-gray-800">{value}</dd>
    </div>
  );
}

export default PatientHistory;
