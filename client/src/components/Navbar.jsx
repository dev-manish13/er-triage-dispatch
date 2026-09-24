import { Activity, ClipboardPlus, ListOrdered, Shield, Users } from 'lucide-react';

const TABS = [
  { id: 'intake', label: 'Intake Form', icon: ClipboardPlus },
  { id: 'queue', label: 'Live Queue', icon: ListOrdered },
  { id: 'dispatch', label: 'Dispatch Dashboard', icon: Users },
  { id: 'admin', label: 'Admin Panel', icon: Shield },
];

function Navbar({ activeTab, onTabChange }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-red-600" size={28} />
          <span className="text-xl font-semibold text-gray-800">Jeevan Milan</span>
        </div>
        <nav className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === id ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
