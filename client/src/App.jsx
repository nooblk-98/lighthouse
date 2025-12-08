import React, { useEffect, useState } from 'react';
import { LayoutDashboard, RefreshCcw, AlertCircle } from 'lucide-react';
import ContainerCard from './components/ContainerCard';

function App() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchContainers();
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
          // Refresh list after successful update
          fetchContainers();
      }
      return data;
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
            <button 
                onClick={fetchContainers}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Refresh List"
            >
                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
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
                        <p className="text-xs text-red-600 mt-1">Make sure the backend is running on port 8000.</p>
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
    </div>
  );
}

// Basic import for Error component (AlertCircle usage fix if missing import)
// Wait, I imported AlertCircle in ContainerCard but not App? 
// Actually I imported Update functionality.
// Let me double check imports in the code block above.
// Only LayoutDashboard and RefreshCcw are imported in App.
// I used AlertCircle in error block. I should add it to imports.

export default App;
