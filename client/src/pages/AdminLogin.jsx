import { useState } from 'react';
import { Activity, HeartPulse, Loader2, Lock, Pill, Shield, Stethoscope, Syringe, User } from 'lucide-react';
import api from '../api/client';

const WATERMARK_ICONS = [Stethoscope, HeartPulse, Pill, Activity, Syringe, Shield];

function IconWatermark() {
  const icons = Array.from({ length: 24 }, (_, i) => {
    const Icon = WATERMARK_ICONS[i % WATERMARK_ICONS.length];
    const top = (i * 37) % 100;
    const left = (i * 53) % 100;
    const size = 28 + ((i * 11) % 40);
    const rotate = (i * 29) % 360;
    return { Icon, top, left, size, rotate, key: i };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {icons.map(({ Icon, top, left, size, rotate, key }) => (
        <Icon
          key={key}
          size={size}
          className="absolute text-white/10"
          style={{ top: `${top}%`, left: `${left}%`, transform: `rotate(${rotate}deg)` }}
        />
      ))}
    </div>
  );
}

function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/auth/admin-login', { username, password });
      onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-120px)] items-center justify-center overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-slate-900">
      <IconWatermark />

      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="text-red-600" size={24} />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Admin Login</h1>
          <p className="text-sm text-gray-500">Jeevan Milan Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Username</span>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input pl-9"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-9"
              />
            </div>
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {submitting && <Loader2 className="animate-spin" size={18} />}
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
