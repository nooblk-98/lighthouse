import React, { useState } from 'react';
import Header from './components/layout/Header';
import ErrorBanner from './components/feedback/ErrorBanner';
import LoadingSpinner from './components/feedback/LoadingSpinner';
import EmptyState from './components/feedback/EmptyState';
import SettingsModal from './components/SettingsModal';
import ContainerGrid from './components/containers/ContainerGrid';
import { useContainers } from './hooks/useContainers';
import { useSettings } from './hooks/useSettings';
import { useSchedule } from './hooks/useSchedule';
import HistoryView from './components/history/HistoryView';
import ScheduleSummary from './components/layout/ScheduleSummary';
import Footer from './components/layout/Footer';
import { useHistoryLog } from './hooks/useHistoryLog';
import { version as appVersion } from '../package.json';

const POLL_INTERVAL_MS = 30000;
const HISTORY_POLL_INTERVAL_MS = 60000;

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
  } = useSettings();
  const {
    schedule,
    error: scheduleError,
  } = useSchedule(POLL_INTERVAL_MS);
  const {
    entries: historyEntries,
    loading: historyLoading,
    error: historyError,
    refresh: refreshHistory,
  } = useHistoryLog(HISTORY_POLL_INTERVAL_MS);

  const [activeView, setActiveView] = useState('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const formatDateLabel = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

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

  const viewTabs = [
    { id: 'dashboard', label: 'Containers' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <Header
        onRefresh={refreshContainers}
        onOpenSettings={() => setSettingsOpen(true)}
        loading={containersLoading}
        lastCheckLabel={scheduleError ? 'Error' : formatDateLabel(schedule.last_check_time)}
        nextCheckLabel={scheduleError ? 'Error' : formatDateLabel(schedule.next_check_time)}
        scheduleEnabled={!!settings?.auto_update_enabled}
        notificationsEnabled={!!settings?.notifications_enabled}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            {viewTabs.map((tab) => {
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    active ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeView === 'dashboard' ? (
          <>
            <ScheduleSummary
              scheduleEnabled={!!settings?.auto_update_enabled}
              lastCheckLabel={scheduleError ? 'Error' : formatDateLabel(schedule.last_check_time)}
              nextCheckLabel={scheduleError ? 'Error' : formatDateLabel(schedule.next_check_time)}
            />

            {containersError ? (
              <ErrorBanner
                message={containersError}
                details="Make sure the backend is running."
              />
            ) : null}

            {settingsError ? <ErrorBanner message={settingsError} /> : null}
            {scheduleError ? <ErrorBanner message={scheduleError} /> : null}

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
                      className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {bulkUpdating ? 'Checking & updating...' : 'Check & Update All'}
                    </button>
                  </div>

                  {bulkResult && !bulkResult.error ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Updated: {bulkResult.summary?.updated ?? 0}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        Up to date: {bulkResult.summary?.up_to_date ?? 0}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        Skipped: {bulkResult.summary?.skipped ?? 0}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        Errors: {bulkResult.summary?.errors ?? 0}
                      </span>
                    </div>
                  ) : bulkResult?.error ? (
                    <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                      {bulkResult.error}
                    </div>
                  ) : null}
                </div>

                <ContainerGrid
                  containers={containers}
                  onCheckUpdate={checkUpdate}
                  onUpdate={update}
                  onToggleExclusion={setExclusion}
                  bulkResult={bulkResult}
                />
              </>
            ) : (
              <EmptyState
                title="No containers found."
                description="Start a container or refresh once it's running."
              />
            )}
          </>
        ) : (
          <HistoryView
            entries={historyEntries}
            loading={historyLoading}
            error={historyError}
            onRefresh={refreshHistory}
          />
        )}
      </main>

      {settingsOpen ? (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSave={saveSettings}
          loading={settingsLoading}
        />
      ) : null}

      <Footer version={appVersion || 'dev'} />
    </div>
  );
}

export default App;
