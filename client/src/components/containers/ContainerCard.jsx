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
    <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-4 py-3">
      <div className="col-span-4 lg:col-span-3 flex items-start gap-3">
        <div className={`p-2 rounded-md flex-shrink-0 ${isRunning ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
          <Box size={18} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate">{container.name}</h3>
          <p className="text-xs text-slate-400 font-mono truncate" title={container.image}>{container.image}</p>
        </div>
      </div>

      <div className="col-span-3 lg:col-span-2 text-xs text-slate-400 flex items-center">
        {createdDisplay}
      </div>

      <div className="col-span-3 lg:col-span-4 text-xs flex flex-wrap gap-2 items-center text-slate-300">
        <span className={`font-semibold px-2 py-1 rounded-sm flex items-center gap-2 ${isRunning ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-800 text-slate-300'}`}>
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          {isRunning ? 'RUNNING' : container.state?.toUpperCase() || 'N/A'}
        </span>
        <span className="text-slate-400">| Last Update: <span className="text-slate-200">N/A</span></span>
        {updateStatus?.update_available ? (
          <span className="text-amber-300 font-semibold">Update available</span>
        ) : null}
      </div>

      <div className="col-span-2 lg:col-span-3 flex items-center justify-end gap-3 text-xs md:text-sm">
        <label className="flex items-center cursor-pointer" htmlFor={`update-toggle-${container.id}`}>
          <input
            checked={!isExcluded}
            onChange={handleToggleExclusion}
            className="sr-only peer toggle-switch-input"
            id={`update-toggle-${container.id}`}
            type="checkbox"
          />
          <div className="relative w-10 h-5 bg-slate-700 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-slate-700 after:rounded-full after:h-4 after:w-4 after:transition-all toggle-switch-bg" />
          <span className={`ml-2 transition-colors ${isExcluded ? 'text-slate-400' : 'text-emerald-300'}`}>Updates</span>
        </label>
        <button
          onClick={handleCheck}
          disabled={checking || updating || toggling || isExcluded}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors ${
            isExcluded
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/40'
          }`}
        >
          <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Checking...' : 'Check'}
        </button>
      </div>

      {updateStatus ? (
        <div className="col-span-12">
          <div
            className={`mt-2 text-xs md:text-sm rounded-md px-3 py-2 ${
              updateStatus.error
                ? 'bg-red-900/40 text-red-100 border border-red-800'
                : updateStatus.skipped
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : updateStatus.update_available
                    ? 'bg-amber-900/40 text-amber-100 border border-amber-800'
                    : 'bg-blue-900/40 text-blue-100 border border-blue-800'
            }`}
          >
            {updateStatus.error
              ? updateStatus.error
              : updateStatus.skipped
                ? updateStatus.reason || 'Updates skipped'
                : updateStatus.update_available
                  ? 'Update available'
                  : 'Up to date'}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ContainerCard;
