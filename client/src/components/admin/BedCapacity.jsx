import { useCallback, useEffect, useState } from 'react';
import { BedDouble, Loader2, Plus } from 'lucide-react';
import api from '../../api/client';
import { CAPACITY_STYLES, getCapacityLevel } from '../../utils/capacity';

const CATEGORIES = [
  { bedType: 'General', label: 'General' },
  { bedType: 'Emergency', label: 'Dedicated ER' },
  { bedType: 'ICU', label: 'ICU' },
];

function CapacityBar({ label, occupied, total }) {
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const s = CAPACITY_STYLES[getCapacityLevel(pct)];

  return (
    <div className={`rounded-xl border p-5 ${s.bg}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`font-semibold ${s.text}`}>{label}</span>
        <span className={`text-sm font-medium ${s.text}`}>
          {occupied} / {total} ({pct}%)
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full transition-all ${s.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function BedCapacity() {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ quantity: 1, bedType: 'General' });
  const [submitting, setSubmitting] = useState(false);
  const [addedMessage, setAddedMessage] = useState(null);

  const fetchBeds = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/beds');
      setBeds(data.beds);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBeds();
    const id = setInterval(fetchBeds, 5000);
    return () => clearInterval(id);
  }, [fetchBeds]);

  async function handleAddBeds(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setAddedMessage(null);
    try {
      const { data } = await api.post('/admin/beds', form);
      setAddedMessage(`Added ${data.beds.map((b) => b.bedNumber).join(', ')}.`);
      setForm({ quantity: 1, bedType: 'General' });
      fetchBeds();
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAddBeds}
        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end"
      >
        <label className="w-28">
          <span className="mb-1 block text-sm font-medium text-gray-700">Quantity</span>
          <input
            type="number"
            min="1"
            required
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            className="input"
          />
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-sm font-medium text-gray-700">Bed Type</span>
          <select
            value={form.bedType}
            onChange={(e) => setForm((f) => ({ ...f, bedType: e.target.value }))}
            className="input"
          >
            <option value="General">General</option>
            <option value="Emergency">Dedicated ER</option>
            <option value="ICU">ICU</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          Add Beds
        </button>
      </form>
      {addedMessage && <p className="text-sm text-green-600">{addedMessage}</p>}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BedDouble className="text-red-600" size={18} />
          <h3 className="font-semibold text-gray-800">Bed Capacity</h3>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="space-y-4">
            {CATEGORIES.map(({ bedType, label }) => {
              const bedsOfType = beds.filter((b) => b.bed_type === bedType);
              const occupied = bedsOfType.filter((b) => b.status === 'Occupied').length;
              return <CapacityBar key={bedType} label={label} occupied={occupied} total={bedsOfType.length} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BedCapacity;
