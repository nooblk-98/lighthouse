import { useCallback, useEffect, useState } from 'react';
import { clearHistory, getHistory } from '../api/history';

const DEFAULT_ERROR = 'Failed to load history. Make sure the backend is reachable.';

export function useHistoryLog(pollIntervalMs = 60000) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await getHistory();
      setEntries(data || []);
    } catch (err) {
      setError(err.message || DEFAULT_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await clearHistory();
      setEntries([]);
    } catch (err) {
      setError(err.message || DEFAULT_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, pollIntervalMs]);

  return {
    entries,
    loading,
    error,
    refresh,
    clear,
  };
}
