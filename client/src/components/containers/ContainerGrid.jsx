import React from 'react';
import ContainerCard from './ContainerCard';

const ContainerGrid = ({ containers, onCheckUpdate, onUpdate, onToggleExclusion, bulkResult }) => {
  const getBulkStatusForContainer = (containerId) => {
    if (!bulkResult?.results) return null;
    return bulkResult.results.find(r => r.id === containerId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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
  );
};

export default ContainerGrid;
