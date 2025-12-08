import { useCallback, useEffect, useState } from 'react';
import { getSchedule } from '../api/schedule';

const DEFAULT_SCHEDULE = {
  last_check_time: null,
  next_check_time: null,
  interval_minutes: null,
};

export function useSchedule(pollIntervalMs = 30000) {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSchedule();
      setSchedule({ ...DEFAULT_SCHEDULE, ...(data || {}) });
    } catch (err) {
      setError(err.message || 'Failed to load schedule info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, pollIntervalMs]);

  return { schedule, loading, error, refresh };
}
