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
  } = useContainers(POLL_INTERVAL_MS);

  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    save: saveSettings,
    version: settingsVersion,
  } = useSettings();

  const [settingsOpen, setSettingsOpen] = useState(false);

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
          <ContainerGrid
            containers={containers}
            onCheckUpdate={checkUpdate}
            onUpdate={update}
          />
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
