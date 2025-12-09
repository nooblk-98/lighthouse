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
  updated: { accent: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-200', border: 'border-emerald-100 dark:border-emerald-900/60' },
  success: { accent: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-200', border: 'border-emerald-100 dark:border-emerald-900/60' },
  up_to_date: { accent: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-200', border: 'border-blue-100 dark:border-blue-900/60' },
  skipped: { accent: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-200', border: 'border-amber-100 dark:border-amber-900/60' },
  error: { accent: 'bg-red-500', text: 'text-red-700 dark:text-red-200', border: 'border-red-100 dark:border-red-900/60' },
  update_available: { accent: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-200', border: 'border-blue-100 dark:border-blue-900/60' },
};

const formatTimestamp = (value) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const MetaTag = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200 dark:bg-slate-800 dark:ring-slate-700 dark:text-slate-300">
    <Icon size={14} className="text-gray-500 dark:text-slate-300" />
    {label}
  </span>
);

const HistoryItem = ({ entry }) => {
  const details = [];
  if (entry.details?.image) details.push(`Image: ${entry.details.image}`);
  if (entry.details?.latest_id) details.push(`Latest: ${entry.details.latest_id}`);
  if (entry.details?.new_id) details.push(`New ID: ${entry.details.new_id}`);
  const key = (entry.status || '').toLowerCase();
  const tone = statusStyles[key] || { accent: 'bg-slate-400', text: 'text-slate-700 dark:text-slate-200', border: 'border-slate-200 dark:border-slate-800' };
  const statusLabel = (entry.status || 'unknown').replace(/_/g, ' ');

  return (
    <div className={`relative overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-slate-900 ${tone.border}`}>
      <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${tone.accent}`} aria-hidden />
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className={`text-xs font-semibold uppercase tracking-wide ${tone.text}`}>{statusLabel}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.container || 'System'}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{entry.message || 'No additional details.'}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <Clock3 size={14} className="text-slate-400 dark:text-slate-500" />
            <span className="font-medium">{formatTimestamp(entry.timestamp)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MetaTag icon={Activity} label={entry.action || 'update'} />
          {entry.trigger ? <MetaTag icon={RefreshCw} label={`${entry.trigger} trigger`} /> : null}
          {details.map((item) => (
            <span key={item} className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const HistorySection = ({ title, description, icon: Icon, entries, emptyMessage }) => (
  <section className="rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col dark:border-slate-800 dark:bg-slate-900/70">
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200">
        <Icon size={18} />
      </span>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-slate-300">{description}</p>
      </div>
    </div>
    {entries.length === 0 ? (
      <div className="w-full rounded-lg border border-dashed border-transparent bg-gray-50 px-4 py-10 text-sm text-gray-600 text-center dark:bg-slate-800/60 dark:text-slate-300">
        {emptyMessage}
      </div>
    ) : (
      <div className="text-xs space-y-3 p-3">
        {entries.map((entry) => (
          <HistoryItem key={entry.id} entry={entry} />
        ))}
      </div>
    )}
  </section>
);

const HistoryView = ({ entries = [], loading, error, onRefresh, onClear, theme }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200">
              <HistoryIcon size={18} />
            </span>
            <h2 className="text-xl font-bold tracking-tight">History</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-300">Recent update attempts, auto-runs, and errors.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50
              border-gray-200 bg-white text-gray-700 hover:bg-gray-50
              dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh history
          </button>
          <button
            onClick={onClear}
            disabled={loading || entries.length === 0}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50
              border-red-200 bg-red-50 text-red-700 hover:bg-red-100
              dark:border-red-800 dark:bg-red-900/40 dark:text-red-100 dark:hover:bg-red-900/60"
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
