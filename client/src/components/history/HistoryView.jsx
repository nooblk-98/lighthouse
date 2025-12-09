import React, { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock3,
  History as HistoryIcon,
  RefreshCw,
} from 'lucide-react';
import ErrorBanner from '../feedback/ErrorBanner';
import LoadingSpinner from '../feedback/LoadingSpinner';

const statusStyles = {
  updated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  up_to_date: 'bg-blue-50 text-blue-700 border-blue-200',
  skipped: 'bg-gray-50 text-gray-700 border-gray-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  update_available: 'bg-amber-50 text-amber-800 border-amber-200',
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
    <div className="rounded-md border border-gray-200 bg-gray-50/80 px-3 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{entry.container || 'System'}</span>
            <StatusBadge status={entry.status} />
          </div>
          <div className="text-sm text-gray-700">
            {entry.message || 'No additional details.'}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <MetaTag icon={Activity} label={entry.action || 'update'} />
            {entry.trigger ? <MetaTag icon={RefreshCw} label={`${entry.trigger} trigger`} /> : null}
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600">
              <Clock3 size={14} className="text-gray-500" />
              {formatTimestamp(entry.timestamp)}
            </span>
          </div>
          {details.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              {details.map((item) => (
                <span key={item} className="inline-flex items-center rounded-full bg-white px-2 py-1 ring-1 ring-gray-200">
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
  <section className="h-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <Icon size={18} />
      </span>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    {entries.length === 0 ? (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/60 p-6 text-sm text-gray-600">
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

const HistoryView = ({ entries = [], loading, error, onRefresh }) => {
  const errorEntries = useMemo(
    () => entries.filter((entry) => (entry.status || '').toLowerCase() === 'error'),
    [entries],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-gray-900">
            <HistoryIcon size={20} className="text-indigo-600" />
            <h2 className="text-xl font-bold">History</h2>
          </div>
          <p className="text-sm text-gray-600">Recent update attempts, auto-runs, and errors.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh history
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading && (!entries || entries.length === 0) ? (
        <div className="rounded-lg border border-gray-200 bg-white py-8 shadow-sm">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <HistorySection
            title="Update history"
            description="Manual and automatic update attempts."
            icon={Activity}
            entries={entries}
            emptyMessage="No update activity recorded yet."
          />
          <HistorySection
            title="Error history"
            description="Failures captured during checks or updates."
            icon={AlertTriangle}
            entries={errorEntries}
            emptyMessage="No errors have been recorded."
          />
        </div>
      )}
    </div>
  );
};

export default HistoryView;
