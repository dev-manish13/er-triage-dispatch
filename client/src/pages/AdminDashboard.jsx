import { useCallback, useEffect, useState } from 'react';
import { BedDouble, ClipboardList, History, LogOut, Shield, Stethoscope } from 'lucide-react';
import api from '../api/client';
import SurgeGauge from '../components/admin/SurgeGauge';
import DoctorManagement from '../components/admin/DoctorManagement';
import BedCapacity from '../components/admin/BedCapacity';
import ActiveTreatments from '../components/admin/ActiveTreatments';
import PatientHistory from '../components/admin/PatientHistory';

const SECTIONS = [
  { id: 'doctors', label: 'Doctor Management', icon: Stethoscope, Component: DoctorManagement },
  { id: 'beds', label: 'Bed Capacity', icon: BedDouble, Component: BedCapacity },
  { id: 'treatments', label: 'Active ER Treatments', icon: ClipboardList, Component: ActiveTreatments },
  { id: 'history', label: 'Patient History', icon: History, Component: PatientHistory },
];

const POLL_INTERVAL_MS = 5000;

function AdminDashboard({ onLogout }) {
  const [section, setSection] = useState('doctors');
  const [bedStats, setBedStats] = useState({ total: 0, occupied: 0 });

  const fetchBedStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/beds');
      const total = data.beds.length;
      const occupied = data.beds.filter((b) => b.status === 'Occupied').length;
      setBedStats({ total, occupied });
    } catch {
      // Surge gauge is non-critical: keep the last known reading rather than surfacing an error.
    }
  }, []);

  useEffect(() => {
    fetchBedStats();
    const id = setInterval(fetchBedStats, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchBedStats]);

  const ActiveSection = SECTIONS.find((s) => s.id === section)?.Component;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-red-600" size={24} />
          <h1 className="text-2xl font-semibold text-gray-800">Admin Panel</h1>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>

      <div className="mb-6">
        <SurgeGauge totalBeds={bedStats.total} occupiedBeds={bedStats.occupied} />
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              section === id ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {ActiveSection && <ActiveSection />}
    </div>
  );
}

export default AdminDashboard;
