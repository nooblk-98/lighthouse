import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorBanner = ({ message, details }) => (
  <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm dark:bg-red-900/30 dark:border-red-700">
    <div className="flex">
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-200" />
      </div>
      <div className="ml-3">
        <p className="text-sm text-red-700 dark:text-red-100">{message}</p>
        {details ? <p className="text-xs text-red-600 dark:text-red-200 mt-1">{details}</p> : null}
      </div>
    </div>
  </div>
);

export default ErrorBanner;
