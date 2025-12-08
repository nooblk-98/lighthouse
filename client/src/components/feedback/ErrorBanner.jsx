import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorBanner = ({ message, details }) => (
  <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
    <div className="flex">
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-red-500" />
      </div>
      <div className="ml-3">
        <p className="text-sm text-red-700">{message}</p>
        {details ? <p className="text-xs text-red-600 mt-1">{details}</p> : null}
      </div>
    </div>
  </div>
);

export default ErrorBanner;
