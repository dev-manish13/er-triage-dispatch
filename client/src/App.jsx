import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TriageIntakeForm from './pages/TriageIntakeForm';
import LivePriorityQueue from './pages/LivePriorityQueue';
import DispatcherDashboard from './pages/DispatcherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

const ADMIN_AUTH_KEY = 'jeevanMilanAdminAuthed';

const PAGES = {
  intake: TriageIntakeForm,
  queue: LivePriorityQueue,
  dispatch: DispatcherDashboard,
};

function App() {
  const [activeTab, setActiveTab] = useState('intake');
  const [adminAuthed, setAdminAuthed] = useState(() => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true');

  function handleAdminLogin() {
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    setAdminAuthed(true);
  }

  function handleAdminLogout() {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    setAdminAuthed(false);
  }

  const ActivePage = PAGES[activeTab];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1">
        {activeTab === 'admin' ? (
          adminAuthed ? (
            <AdminDashboard onLogout={handleAdminLogout} />
          ) : (
            <AdminLogin onLoginSuccess={handleAdminLogin} />
          )
        ) : (
          <ActivePage />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
