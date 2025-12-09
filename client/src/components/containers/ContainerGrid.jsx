import React from 'react';
import ContainerCard from './ContainerCard';

const ContainerGrid = ({ containers, onCheckUpdate, onUpdate, onToggleExclusion, bulkResult }) => {
  const getBulkStatusForContainer = (containerId) => {
    if (!bulkResult?.results) return null;
    return bulkResult.results.find((r) => r.id === containerId);
  };

  return (
    <div className="w-full space-y-2">
      <div className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide px-4 text-slate-500 dark:text-slate-400">
        <div className="col-span-4">Container / Image</div>
        <div className="col-span-3 text-center">Created</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-3 text-center">Actions</div>
      </div>
      <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {containers.map((container) => (
          <ContainerCard
            key={container.id}
            container={container}
            onCheckUpdate={onCheckUpdate}
            onUpdate={onUpdate}
            onToggleExclusion={onToggleExclusion}
            bulkStatus={getBulkStatusForContainer(container.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ContainerGrid;
