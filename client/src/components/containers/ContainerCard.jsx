import React, { useState, useEffect } from 'react';
import { RefreshCw, Box, AlertCircle, CheckCircle } from 'lucide-react';

const ContainerCard = ({ container, onCheckUpdate, onUpdate, onToggleExclusion, bulkStatus }) => {
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [updateResult, setUpdateResult] = useState(null);

  useEffect(() => {
    if (bulkStatus) {
      if (bulkStatus.status === 'updated') {
        setUpdateResult({ success: true, message: bulkStatus.message || 'Container updated successfully' });
        setUpdateStatus(null);
      } else if (bulkStatus.status === 'error') {
        setUpdateResult({ success: false, error: bulkStatus.message || bulkStatus.reason });
      } else if (bulkStatus.status === 'up_to_date') {
        setUpdateStatus({ update_available: false });
      } else if (bulkStatus.status === 'skipped') {
        setUpdateStatus({ skipped: true, reason: bulkStatus.reason || bulkStatus.message });
      }
    }
  }, [bulkStatus]);

  const isExcluded = !!container.excluded;
  const isRunning = container.state === 'running';
  const createdDisplay = (() => {
    if (!container.created) return 'Unknown';
    const parsed = new Date(container.created);
    if (Number.isNaN(parsed.getTime())) return container.created;
    return parsed.toLocaleString();
  })();

  const handleCheck = async () => {
    if (isExcluded) return;
    setChecking(true);
    setUpdateStatus(null);
    try {
      const result = await onCheckUpdate(container.id);
      setUpdateStatus(result);
    } catch (e) {
      setUpdateStatus({ error: e.message });
    } finally {
      setChecking(false);
    }
  };

  const handleUpdateClick = async () => {
    if (isExcluded) return;
    if (!confirm(`Are you sure you want to update ${container.name}? This will recreate the container.`)) return;

    setUpdating(true);
    setUpdateResult(null);
    try {
      const result = await onUpdate(container.id);
      setUpdateResult(result);
      if (result.success) {
        setUpdateStatus(null); // Clear update available status
      }
    } catch (e) {
      setUpdateResult({ success: false, error: e.message });
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleExclusion = async () => {
    setToggling(true);
    try {
      await onToggleExclusion(container.id, !isExcluded);
    } catch (e) {
      alert(e.message || 'Failed to update preference');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className={`p-2 rounded-full flex-shrink-0 ${isRunning ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            <Box size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 break-words">{container.name}</h3>
            <p className="text-sm text-gray-500 font-mono truncate" title={container.image}>{container.image}</p>
            <p className="text-xs text-gray-500 mt-1">Created: {createdDisplay}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {container.status}
        </span>
      </div>

      <div className="mt-4 border-t pt-4 flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleToggleExclusion}
              disabled={toggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isExcluded ? 'bg-gray-300' : 'bg-emerald-500'
              } disabled:opacity-50`}
              aria-pressed={!isExcluded}
              aria-label={isExcluded ? 'Enable updates' : 'Disable updates'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  isExcluded ? 'translate-x-0.5' : 'translate-x-5'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">{isExcluded ? 'Updates disabled' : 'Allow updates'}</span>
          </div>
          {isExcluded ? (
            <span className="text-xs text-gray-500 leading-tight">Opted out of auto/manual updates</span>
          ) : null}
        </div>

        {updateStatus ? (
          <div className={`p-3 rounded-md text-sm ${
            updateStatus.error
              ? 'bg-red-50 text-red-800 border border-red-200'
              : updateStatus.skipped
                ? 'bg-gray-50 text-gray-700 border border-gray-200'
                : updateStatus.update_available
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {updateStatus.error ? (
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>{updateStatus.error}</span>
              </div>
            ) : updateStatus.skipped ? (
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>{updateStatus.reason || 'Updates skipped'}</span>
              </div>
            ) : updateStatus.update_available ? (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center font-medium">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>Update Available!</span>
                </div>
                <div className="text-xs opacity-75">
                  Current: {updateStatus.current_id?.substring(0, 12)}...<br />
                  Latest: {updateStatus.latest_id?.substring(0, 12)}...
                </div>
                <button
                  onClick={handleUpdateClick}
                  disabled={updating || isExcluded}
                  className="bg-amber-600 text-white px-3 py-1.5 rounded hover:bg-amber-700 w-full text-center transition-colors disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Now'}
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Up to date</span>
              </div>
            )}
          </div>
        ) : null}

        {updateResult ? (
          <div className={`p-3 rounded-md text-sm ${updateResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {updateResult.message || updateResult.error}
          </div>
        ) : null}

        <div className="mt-auto space-y-3">
          {isExcluded ? (
            <div className="text-xs text-gray-500">
              Updates are turned off for this container. Toggle above to include it in manual and auto updates.
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              Updates allowed for manual checks and scheduled runs.
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleCheck}
              disabled={checking || updating || toggling || isExcluded}
              className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
              <span>{checking ? 'Checking...' : 'Check Status'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerCard;
