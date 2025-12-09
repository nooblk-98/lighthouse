import React from 'react';
import { Clock3 } from 'lucide-react';

const ScheduleSummary = ({ scheduleEnabled, lastCheckLabel, nextCheckLabel }) => {
  const lastLabel = lastCheckLabel || '--';
  const nextLabel = nextCheckLabel || '--';

  if (!scheduleEnabled) {
    return (
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <Clock3 size={16} className="text-gray-500 dark:text-slate-300" />
          <span className="dark:text-slate-200">Scheduling is turned off. Enable auto-update to see upcoming checks.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-stretch gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-gray-800 dark:text-slate-100">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-200">
            <Clock3 size={18} />
          </span>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Last check</div>
            <div className="text-sm font-semibold dark:text-slate-100">{lastLabel}</div>
          </div>
        </div>

        <div className="hidden h-12 w-px bg-gray-200 sm:block dark:bg-slate-700" />

        <div className="flex items-center gap-2 text-gray-800 dark:text-slate-100">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200">
            <Clock3 size={18} />
          </span>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Next check</div>
            <div className="text-sm font-semibold dark:text-slate-100">{nextLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSummary;
