import React, { useState } from 'react';
import Header from './components/layout/Header';
import ErrorBanner from './components/feedback/ErrorBanner';
import LoadingSpinner from './components/feedback/LoadingSpinner';
import EmptyState from './components/feedback/EmptyState';
import SettingsModal from './components/SettingsModal';
import ContainerGrid from './components/containers/ContainerGrid';
import { useContainers } from './hooks/useContainers';
import { useSettings } from './hooks/useSettings';

const POLL_INTERVAL_MS = 30000;

function App() {
  const {
    containers,
    loading: containersLoading,
    error: containersError,
    refresh: refreshContainers,
    checkUpdate,
    update,
    updateAll,
    setExclusion,
  } = useContainers(POLL_INTERVAL_MS);

  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    save: saveSettings,
    version: settingsVersion,
  } = useSettings();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const handleUpdateAll = async () => {
    setBulkUpdating(true);
    setBulkResult(null);
    try {
      const result = await updateAll();
      setBulkResult(result);
      refreshContainers();
    } catch (err) {
      setBulkResult({ error: err.message });
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header
        onRefresh={refreshContainers}
        onOpenSettings={() => setSettingsOpen(true)}
        loading={containersLoading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {containersError ? (
          <ErrorBanner
            message={containersError}
            details="Make sure the backend is running."
          />
        ) : null}

        {settingsError ? <ErrorBanner message={settingsError} /> : null}

        {containersLoading && containers.length === 0 ? (
          <LoadingSpinner />
        ) : containers.length ? (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Manual update</h2>
                  <p className="text-sm text-gray-600">Checks all containers and updates any that allow updates.</p>
                </div>
                <button
                  onClick={handleUpdateAll}
                  disabled={bulkUpdating || containersLoading}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {bulkUpdating ? 'Checking & updating...' : 'Check & Update All'}
                </button>
              </div>

              {bulkResult ? (
                <div className="mt-3">
                  {bulkResult.error ? (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                      {bulkResult.error}
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-700">
                        Updated: {bulkResult.summary?.updated ?? 0} • Up to date: {bulkResult.summary?.up_to_date ?? 0} • Skipped: {bulkResult.summary?.skipped ?? 0} • Errors: {bulkResult.summary?.errors ?? 0}
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {bulkResult.results?.map((item) => (
                          <div key={item.id} className="border border-gray-200 rounded p-2 bg-gray-50">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-600 capitalize">Status: {item.status}</div>
                            {item.message ? <div className="text-xs text-gray-600">{item.message}</div> : null}
                            {item.reason ? <div className="text-xs text-gray-600">{item.reason}</div> : null}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <ContainerGrid
              containers={containers}
              onCheckUpdate={checkUpdate}
              onUpdate={update}
              onToggleExclusion={setExclusion}
            />
          </>
        ) : (
          <EmptyState
            title="No containers found."
            description="Start a container or refresh once it's running."
          />
        )}
      </main>

      {settingsOpen ? (
        <SettingsModal
          key={settingsVersion}
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSave={saveSettings}
          loading={settingsLoading}
        />
      ) : null}
    </div>
  );
}

export default App;
