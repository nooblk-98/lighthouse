import React, { useState } from 'react';
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
  updated: {
    accent: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-500/40',
    card: 'bg-emerald-50 dark:bg-emerald-500/5',
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-emerald-500/30',
  },
  success: {
    accent: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-500/40',
    card: 'bg-emerald-50 dark:bg-emerald-500/5',
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-emerald-500/30',
  },
  up_to_date: {
    accent: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-500/40',
    card: 'bg-blue-50 dark:bg-blue-500/5',
    badge: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-100 dark:border-blue-500/30',
  },
  skipped: {
    accent: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-500/40',
    card: 'bg-amber-50 dark:bg-amber-500/5',
    badge: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-100 dark:border-amber-500/30',
  },
  error: {
    accent: 'bg-red-500',
    text: 'text-red-700 dark:text-red-200',
    border: 'border-red-200 dark:border-red-500/40',
    card: 'bg-red-50 dark:bg-red-500/5',
    badge: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-100 dark:border-red-500/30',
  },
  update_available: {
    accent: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-500/40',
    card: 'bg-blue-50 dark:bg-blue-500/5',
    badge: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-100 dark:border-blue-500/30',
  },
};

const formatTimestamp = (value) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const MetaTag = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-slate-200 dark:bg-slate-800/70 dark:ring-slate-700 dark:text-slate-200">
    <Icon size={14} className="text-gray-500 dark:text-slate-300" />
    {label}
  </span>
);

const HistoryItem = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const details = [];
  if (entry.details?.image) details.push(`Image: ${entry.details.image}`);
  if (entry.details?.latest_id) details.push(`Latest: ${entry.details.latest_id}`);
  if (entry.details?.new_id) details.push(`New ID: ${entry.details.new_id}`);
  const key = (entry.status || '').toLowerCase();
  const tone = statusStyles[key] || {
    accent: 'bg-slate-500',
    text: 'text-slate-200',
    border: 'border-slate-800',
    card: 'bg-slate-900/50',
    badge: 'bg-slate-700/50 text-slate-100 border border-slate-700',
  };
  const statusLabel = (entry.status || 'unknown').replace(/_/g, ' ');
  const hasBody = Boolean(entry.message || details.length);

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm ${tone.border} ${tone.card || 'bg-slate-900/50'} dark:text-slate-100`}>
      <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${tone.accent}`} aria-hidden />
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone.badge}`}>
              <span className={`inline-block h-2 w-2 rounded-full ${tone.accent}`} />
              {statusLabel}
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.container || 'System'}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            <div className="flex items-center gap-1">
              <Clock3 size={14} className="text-slate-400 dark:text-slate-500" />
              <span className="font-medium">{formatTimestamp(entry.timestamp)}</span>
            </div>
            {hasBody ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-[11px] font-semibold px-2 py-1 rounded-md border border-slate-700/50 text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
              >
                {expanded ? 'Collapse' : 'Expand'}
              </button>
            ) : null}
          </div>
        </div>
        {expanded && hasBody ? (
          <>
            {entry.message ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {entry.message}
              </p>
            ) : null}
            {details.length ? (
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                {details.map((item) => (
                  <span key={item} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-800">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};

const HistorySection = ({ title, description, icon: Icon, entries, emptyMessage }) => (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col dark:border-slate-800 dark:bg-slate-950/40">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800/80">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200">
        <Icon size={18} />
      </span>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-slate-300">{description}</p>
      </div>
    </div>
    {entries.length === 0 ? (
      <div className="w-full rounded-lg border border-dashed border-transparent bg-gray-50 px-5 py-10 text-sm text-gray-600 text-center dark:bg-slate-900/40 dark:text-slate-300">
        {emptyMessage}
      </div>
    ) : (
      <div className="text-xs space-y-3 p-4">
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
      <div className="flex flex-wrap items-center justify-end gap-2">
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
