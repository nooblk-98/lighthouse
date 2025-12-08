import React from 'react';
import ContainerCard from './ContainerCard';

const ContainerGrid = ({ containers, onCheckUpdate, onUpdate }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {containers.map((container) => (
      <ContainerCard
        key={container.id}
        container={container}
        onCheckUpdate={onCheckUpdate}
        onUpdate={onUpdate}
      />
    ))}
  </div>
);

export default ContainerGrid;
