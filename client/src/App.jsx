import React, { useEffect, useState } from 'react';
import { LayoutDashboard, RefreshCcw, AlertCircle, Settings } from 'lucide-react';
import ContainerCard from './components/ContainerCard';
import SettingsModal from './components/SettingsModal';

function App() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  const API_URL = '/api';

  const fetchContainers = async () => {
    setLoading(true);
    setError(null);
    try {
        const res = await fetch(`${API_URL}/containers`);
        if (!res.ok) throw new Error('Failed to fetch containers');
        const data = await res.json();
        setContainers(data);
    } catch (e) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  };

  const fetchSettings = async () => {
      try {
          const res = await fetch(`${API_URL}/settings`);
          const data = await res.json();
          setSettings(data);
      } catch (e) {
          console.error("Failed to fetch settings", e);
      }
  };

  useEffect(() => {
    fetchContainers();
    fetchSettings();

    // Poll every 30 seconds to keep list updated (e.g. for background scans)
    const interval = setInterval(fetchContainers, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckUpdate = async (id) => {
      const res = await fetch(`${API_URL}/containers/${id}/check-update`, { method: 'POST' });
      const data = await res.json();
      return data;
  };

  const handleUpdate = async (id) => {
      const res = await fetch(`${API_URL}/containers/${id}/update`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
          fetchContainers();
      }
      return data;
  };

  const handleSaveSettings = async (newSettings) => {
      try {
          const res = await fetch(`${API_URL}/settings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newSettings)
          });
          const data = await res.json();
          setSettings(data);
      } catch (e) {
          alert("Failed to save settings: " + e.message);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <LayoutDashboard className="text-indigo-600" size={28} />
                <h1 className="text-2xl font-bold text-gray-900">Light House</h1>
            </div>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={() => setSettingsOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
                <button 
                    onClick={fetchContainers}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                    title="Refresh List"
                >
                    <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                        <p className="text-xs text-red-600 mt-1">Make sure the backend is running.</p>
                    </div>
                </div>
            </div>
        )}

        {loading && containers.length === 0 ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {containers.map(container => (
                    <ContainerCard 
                        key={container.id} 
                        container={container} 
                        onCheckUpdate={handleCheckUpdate}
                        onUpdate={handleUpdate}
                    />
                ))}
            </div>
        )}

        {!loading && containers.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
                No containers found.
            </div>
        )}
      </main>

      {settings && (
        <SettingsModal 
            isOpen={settingsOpen} 
            onClose={() => setSettingsOpen(false)}
            settings={settings}
            onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}

export default App;
