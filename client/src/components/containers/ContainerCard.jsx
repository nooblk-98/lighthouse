import React, { useState } from 'react';
import { RefreshCw, Box, AlertCircle, CheckCircle } from 'lucide-react';

const ContainerCard = ({ container, onCheckUpdate, onUpdate }) => {
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [updateResult, setUpdateResult] = useState(null);

  const handleCheck = async () => {
    setChecking(true);
    setUpdateStatus(null);
    try {
        const result = await onCheckUpdate(container.id);
        setUpdateStatus(result);
    } catch (e) {
        setUpdateStatus({ error: e.message });
    } finally {
        setChecking(false);
    }
  };

  const handleUpdateClick = async () => {
      if (!confirm(`Are you sure you want to update ${container.name}? This will recreate the container.`)) return;
      
      setUpdating(true);
      setUpdateResult(null);
      try {
          const result = await onUpdate(container.id);
          setUpdateResult(result);
          if (result.success) {
              setUpdateStatus(null); // Clear update available status
          }
      } catch (e) {
          setUpdateResult({ success: false, error: e.message });
      } finally {
          setUpdating(false);
      }
  };

  const isRunning = container.state === 'running';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isRunning ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                <Box size={24} />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{container.name.replace('/', '')}</h3>
                <p className="text-sm text-gray-500 font-mono truncate max-w-xs" title={container.image}>{container.image}</p>
            </div>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {container.status}
        </span>
      </div>

      <div className="mt-4 border-t pt-4">
        {updateStatus ? (
            <div className={`mb-3 p-3 rounded-md text-sm ${updateStatus.update_available ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                {updateStatus.update_available ? (
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center font-medium">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span>Update Available!</span>
                        </div>
                        <div className="text-xs opacity-75">
                            Current: {updateStatus.current_id?.substring(0, 12)}...<br/>
                            Latest: {updateStatus.latest_id?.substring(0, 12)}...
                        </div>
                        <button 
                            onClick={handleUpdateClick}
                            disabled={updating}
                            className="bg-amber-600 text-white px-3 py-1.5 rounded hover:bg-amber-700 w-full text-center transition-colors disabled:opacity-50"
                        >
                            {updating ? 'Updating...' : 'Update Now'}
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>Up to date</span>
                    </div>
                )}
            </div>
        ) : null}

        {updateResult && (
            <div className={`mb-3 p-3 rounded-md text-sm ${updateResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {updateResult.message || updateResult.error}
            </div>
        )}

        <div className="flex justify-end space-x-2">
            <button 
                onClick={handleCheck}
                disabled={checking || updating}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
                <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
                <span>{checking ? 'Checking...' : 'Check Status'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default ContainerCard;
