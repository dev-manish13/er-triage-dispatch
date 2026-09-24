import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Stethoscope, Trash2 } from 'lucide-react';
import api from '../../api/client';

const STATUS_COLORS = {
  Available: 'bg-green-100 text-green-700 border-green-300',
  Booked: 'bg-orange-100 text-orange-700 border-orange-300',
  'Off-Duty': 'bg-gray-100 text-gray-600 border-gray-300',
};

const RANK_OPTIONS = ['Rank I (Senior Attending)', 'Rank II (Attending)', 'Rank III (Resident)', 'Rank IV (Intern)'];
const SHIFT_OPTIONS = ['Day: 8AM-8PM', 'Night: 8PM-8AM'];

const INITIAL_FORM = {
  fullName: '',
  rank: RANK_OPTIONS[2],
  shift: SHIFT_OPTIONS[0],
  status: 'Available',
};

function normalizeDoctorName(name) {
  const trimmed = name.trim();
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status] ?? ''}`}>
      {status}
    </span>
  );
}

function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const fetchDoctors = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/doctors');
      setDoctors(data.doctors);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  async function handleAddDoctor(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/admin/doctors', {
        fullName: normalizeDoctorName(form.fullName),
        rank: form.rank,
        shift: form.shift,
        status: form.status,
      });
      setForm(INITIAL_FORM);
      fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAvailability(doctor) {
    const nextStatus = doctor.status === 'Available' ? 'Off-Duty' : 'Available';
    setError(null);
    try {
      await api.patch(`/admin/doctors/${doctor.doctor_id}/status`, { status: nextStatus });
      fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    }
  }

  async function removeDoctor(doctor) {
    if (!window.confirm(`Remove ${doctor.full_name} permanently?`)) return;
    setRemovingId(doctor.doctor_id);
    setError(null);
    try {
      await api.delete(`/admin/doctors/${doctor.doctor_id}`);
      fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddDoctor} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-800">Add Doctor</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Full name (Dr. prefix added automatically)"
            required
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className="input lg:col-span-2"
          />
          <select value={form.rank} onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))} className="input">
            {RANK_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select value={form.shift} onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value }))} className="input">
            {SHIFT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="input"
          >
            <option value="Available">Available</option>
            <option value="Off-Duty">Off-Duty</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer sm:w-auto"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          Add Doctor
        </button>
      </form>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Stethoscope className="text-red-600" size={18} />
          <h3 className="font-semibold text-gray-800">All Doctors</h3>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : doctors.length === 0 ? (
          <p className="text-sm text-gray-400">No doctors added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2 pr-4">Shift</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Hours on Duty</th>
                  <th className="py-2 pr-4">Current Patient</th>
                  <th className="py-2 pr-4" />
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.doctor_id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-800">{d.full_name}</td>
                    <td className="py-2 pr-4 text-gray-600">{d.rank}</td>
                    <td className="py-2 pr-4 text-gray-600">{d.shift}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{d.hours_on_duty}</td>
                    <td className="py-2 pr-4 text-gray-600">{d.patient_name ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        disabled={d.status === 'Booked'}
                        onClick={() => toggleAvailability(d)}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        {d.status === 'Available' ? 'Set Off-Duty' : d.status === 'Off-Duty' ? 'Set Available' : 'Booked'}
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        disabled={d.status === 'Booked' || removingId === d.doctor_id}
                        onClick={() => removeDoctor(d)}
                        className="flex items-center gap-1 rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        {removingId === d.doctor_id ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                        Remove
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

export default DoctorManagement;
