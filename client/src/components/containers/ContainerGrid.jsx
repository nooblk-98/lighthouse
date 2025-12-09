import React from 'react';
import ContainerCard from './ContainerCard';

const headers = ['Container / Image', 'Created', 'Status / Last update', 'Actions'];

const ContainerGrid = ({ containers, onCheckUpdate, onUpdate, onToggleExclusion, bulkResult }) => {
  const getBulkStatusForContainer = (containerId) => {
    if (!bulkResult?.results) return null;
    return bulkResult.results.find((r) => r.id === containerId);
  };

  return (
    <div className="w-full space-y-2">
      <div className="hidden md:grid grid-cols-12 text-xs uppercase tracking-wide text-slate-400 px-4">
        <div className="col-span-4">Container / Image</div>
        <div className="col-span-2">Created</div>
        <div className="col-span-4">Status / Last update</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
      <div className="flex flex-col divide-y divide-slate-800/70 rounded-xl border border-slate-800 bg-slate-900">
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
