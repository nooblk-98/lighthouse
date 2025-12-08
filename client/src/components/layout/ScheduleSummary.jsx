import React from 'react';
import { Clock3 } from 'lucide-react';

const ScheduleSummary = ({ scheduleEnabled, lastCheckLabel, nextCheckLabel }) => {
  const lastLabel = lastCheckLabel || '--';
  const nextLabel = nextCheckLabel || '--';

  if (!scheduleEnabled) {
    return (
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-xs">
          <Clock3 size={16} className="text-gray-500" />
          <span>Scheduling is turned off. Enable auto-update to see upcoming checks.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-stretch gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-gray-800">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Clock3 size={18} />
          </span>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Last check</div>
            <div className="text-sm font-semibold">{lastLabel}</div>
          </div>
        </div>

        <div className="hidden h-12 w-px bg-gray-200 sm:block" />

        <div className="flex items-center gap-2 text-gray-800">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Clock3 size={18} />
          </span>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Next check</div>
            <div className="text-sm font-semibold">{nextLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSummary;
