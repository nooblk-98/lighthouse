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
import { useTheme } from './hooks/useTheme';
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
    clear: clearHistory,
  } = useHistoryLog(HISTORY_POLL_INTERVAL_MS);

  const { theme, toggleTheme } = useTheme();
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
    <div className={`min-h-screen font-mono flex flex-col transition-colors ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      <Header
        onRefresh={refreshContainers}
        onOpenSettings={() => setSettingsOpen(true)}
        loading={containersLoading}
        lastCheckLabel={scheduleError ? 'Error' : formatDateLabel(schedule.last_check_time)}
        nextCheckLabel={scheduleError ? 'Error' : formatDateLabel(schedule.next_check_time)}
        scheduleEnabled={!!settings?.auto_update_enabled}
        notificationsEnabled={!!settings?.notifications_enabled}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className={`inline-flex rounded-lg border p-1 shadow-sm ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            {viewTabs.map((tab) => {
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-slate-600 hover:bg-slate-100'
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
                <div className={`border rounded-lg p-4 mb-6 shadow-sm ${theme === 'dark' ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Manual update</h2>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Checks all containers and updates any that allow updates.</p>
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
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        theme === 'dark'
                          ? 'bg-emerald-500/20 text-emerald-200 border-emerald-700/60'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        Updated: {bulkResult.summary?.updated ?? 0}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        theme === 'dark'
                          ? 'bg-blue-500/20 text-blue-200 border-blue-700/60'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        Up to date: {bulkResult.summary?.up_to_date ?? 0}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        theme === 'dark'
                          ? 'bg-slate-700 text-slate-200 border-slate-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        Skipped: {bulkResult.summary?.skipped ?? 0}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                        theme === 'dark'
                          ? 'bg-red-500/20 text-red-200 border-red-700/60'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        Errors: {bulkResult.summary?.errors ?? 0}
                      </span>
                    </div>
                  ) : bulkResult?.error ? (
                    <div className={`mt-4 text-sm rounded-md p-3 border ${
                      theme === 'dark'
                        ? 'text-red-200 bg-red-900/40 border-red-800'
                        : 'text-red-700 bg-red-50 border-red-200'
                    }`}>
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
            onClear={clearHistory}
            theme={theme}
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
