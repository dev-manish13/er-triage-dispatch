import { useState } from 'react';
import { ClipboardPlus, Loader2 } from 'lucide-react';
import api from '../api/client';
import PriorityBadge from '../components/PriorityBadge';

const INITIAL_FORM = {
  fullName: '',
  dateOfBirth: '',
  gender: 'male',
  phone: '',
  heartRate: '',
  systolicBP: '',
  diastolicBP: '',
  spo2: '',
  painScore: '',
  consciousnessLevel: 'alert',
};

const DOB_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

// Local calendar date, not UTC — toISOString() would report the previous day
// for hours after local midnight in any timezone ahead of UTC (e.g. Nepal,
// UTC+5:45), which made the date input's `max` reject today's date as "invalid".
function todayLocalISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function TriageIntakeForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!DOB_PATTERN.test(form.dateOfBirth)) {
      setError('Please enter a valid Date of Birth.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/triage/assess', {
        patient: {
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          phone: form.phone || null,
          arrivalTime: new Date().toISOString(),
        },
        vitals: {
          heartRate: toNumberOrNull(form.heartRate),
          systolicBP: toNumberOrNull(form.systolicBP),
          diastolicBP: toNumberOrNull(form.diastolicBP),
          spo2: toNumberOrNull(form.spo2),
          painScore: toNumberOrNull(form.painScore),
          consciousnessLevel: form.consciousnessLevel,
        },
      });
      setResult(data);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-2">
        <ClipboardPlus className="text-red-600" size={24} />
        <h1 className="text-2xl font-semibold text-gray-800">Triage Intake</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Patient Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" required>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Date of Birth" required>
              <input
                type="date"
                required
                max={todayLocalISODate()}
                value={form.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Gender" required>
              <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className="input">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="input"
              />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Vitals</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Heart Rate (bpm)">
              <input
                type="number"
                value={form.heartRate}
                onChange={(e) => updateField('heartRate', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="SpO2 (%)">
              <input
                type="number"
                min="0"
                max="100"
                value={form.spo2}
                onChange={(e) => updateField('spo2', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Systolic BP (mmHg)">
              <input
                type="number"
                value={form.systolicBP}
                onChange={(e) => updateField('systolicBP', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Diastolic BP (mmHg)">
              <input
                type="number"
                value={form.diastolicBP}
                onChange={(e) => updateField('diastolicBP', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Pain Index (0-10)">
              <input
                type="number"
                min="0"
                max="10"
                value={form.painScore}
                onChange={(e) => updateField('painScore', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Consciousness Level">
              <select
                value={form.consciousnessLevel}
                onChange={(e) => updateField('consciousnessLevel', e.target.value)}
                className="input"
              >
                <option value="alert">Alert</option>
                <option value="verbal">Responds to Verbal</option>
                <option value="pain">Responds to Pain</option>
                <option value="unresponsive">Unresponsive</option>
              </select>
            </Field>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="animate-spin" size={18} />}
          {submitting ? 'Assessing...' : 'Assess & Submit'}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Triage Result</h2>
            <PriorityBadge level={result.priorityLevel} score={result.priorityScore} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 sm:grid-cols-3">
            <div>
              <dt className="text-gray-400">Patient ID</dt>
              <dd className="font-medium text-gray-800">{result.patientId}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Triage ID</dt>
              <dd className="font-medium text-gray-800">{result.triageId}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Consistency Ratio</dt>
              <dd className="font-medium text-gray-800">
                {result.consistencyRatio} ({result.isConsistent ? 'consistent' : 'inconsistent'})
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export default TriageIntakeForm;
