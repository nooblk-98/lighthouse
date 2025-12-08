import React from 'react';

const EmptyState = ({ title = 'No data found.', description }) => (
  <div className="text-center py-12 text-gray-500">
    <p className="font-medium">{title}</p>
    {description ? <p className="text-sm text-gray-400 mt-2">{description}</p> : null}
  </div>
);

export default EmptyState;
