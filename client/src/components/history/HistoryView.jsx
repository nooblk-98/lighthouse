import React from 'react';
import {
  Activity,
  Clock3,
  Eraser,
  History as HistoryIcon,
  RefreshCw,
} from 'lucide-react';
import ErrorBanner from '../feedback/ErrorBanner';
import LoadingSpinner from '../feedback/LoadingSpinner';

const statusStyles = {
  updated: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-800',
  up_to_date: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-800',
  skipped: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-100 dark:border-red-800',
  update_available: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800',
};

const formatTimestamp = (value) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const StatusBadge = ({ status }) => {
  const key = (status || '').toLowerCase();
  const classes = statusStyles[key] || 'bg-slate-50 text-slate-700 border-slate-200';
  const label = (status || 'unknown').replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${classes}`}>
      {label}
    </span>
  );
};

const MetaTag = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-white/60 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
    <Icon size={14} className="text-gray-500" />
    {label}
  </span>
);

const HistoryItem = ({ entry }) => {
  const details = [];
  if (entry.details?.image) details.push(`Image: ${entry.details.image}`);
  if (entry.details?.latest_id) details.push(`Latest: ${entry.details.latest_id}`);
  if (entry.details?.new_id) details.push(`New ID: ${entry.details.new_id}`);

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50/80 px-3 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{entry.container || 'System'}</span>
            <StatusBadge status={entry.status} />
          </div>
          <div className="text-sm text-gray-700 dark:text-slate-200">
            {entry.message || 'No additional details.'}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
            <MetaTag icon={Activity} label={entry.action || 'update'} />
            {entry.trigger ? <MetaTag icon={RefreshCw} label={`${entry.trigger} trigger`} /> : null}
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 dark:text-slate-300">
              <Clock3 size={14} className="text-gray-500 dark:text-slate-300" />
              {formatTimestamp(entry.timestamp)}
            </span>
          </div>
          {details.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-slate-300">
              {details.map((item) => (
                <span key={item} className="inline-flex items-center rounded-full bg-white px-2 py-1 ring-1 ring-gray-200 dark:bg-slate-800 dark:ring-slate-700">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const HistorySection = ({ title, description, icon: Icon, entries, emptyMessage }) => (
  <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-4 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-200">
        <Icon size={18} />
      </span>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-slate-300">{description}</p>
      </div>
    </div>
    {entries.length === 0 ? (
      <div className="w-full rounded-md border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-sm text-gray-600 text-center dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        {emptyMessage}
      </div>
    ) : (
      <div className="space-y-3">
        {entries.map((entry) => (
          <HistoryItem key={entry.id} entry={entry} />
        ))}
      </div>
    )}
  </section>
);

const HistoryView = ({ entries = [], loading, error, onRefresh, onClear }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
            <HistoryIcon size={20} className="text-indigo-600 dark:text-indigo-300" />
            <h2 className="text-xl font-bold">History</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-300">Recent update attempts, auto-runs, and errors.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh history
          </button>
          <button
            onClick={onClear}
            disabled={loading || entries.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/40 dark:text-red-100 dark:hover:bg-red-900/60"
          >
            <Eraser size={16} />
            Clear history
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading && (!entries || entries.length === 0) ? (
        <div className="rounded-lg border border-gray-200 bg-white py-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <LoadingSpinner />
        </div>
      ) : (
        <HistorySection
          title="Update history"
          description="Manual and automatic update attempts (including errors)."
          icon={Activity}
          entries={entries}
          emptyMessage="No update activity recorded yet."
        />
      )}
    </div>
  );
};

export default HistoryView;
