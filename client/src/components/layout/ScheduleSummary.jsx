import React from 'react';
import { Clock3 } from 'lucide-react';

const ScheduleSummary = ({ scheduleEnabled, lastCheckLabel, nextCheckLabel }) => {
  const lastLabel = lastCheckLabel || '--';
  const nextLabel = nextCheckLabel || '--';

  if (!scheduleEnabled) {
    return (
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 shadow-xs">
          <Clock3 size={16} className="text-slate-400" />
          <span className="text-slate-200">Scheduling is turned off. Enable auto-update to see upcoming checks.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-6 rounded-md border border-slate-800 bg-slate-900 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 text-slate-200">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 text-indigo-300">
            <Clock3 size={16} />
          </span>
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Last check</div>
            <div className="text-sm font-semibold">{lastLabel}</div>
          </div>
        </div>

        <span className="hidden h-10 w-px bg-slate-800 sm:block" />

        <div className="flex items-center gap-3 text-slate-200">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 text-emerald-300">
            <Clock3 size={16} />
          </span>
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-[0.15em] text-slate-400">Next check</div>
            <div className="text-sm font-semibold">{nextLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSummary;
