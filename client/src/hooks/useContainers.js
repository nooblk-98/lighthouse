import { useCallback, useEffect, useState } from 'react';
import {
  getContainers,
  checkContainerUpdate,
  updateContainer,
  updateAllContainers,
  setContainerExclusion,
} from '../api/containers';

const DEFAULT_ERROR = 'Failed to fetch containers. Make sure the backend is running.';

export function useContainers(pollIntervalMs = 30000) {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadContainers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getContainers();
      setContainers(data || []);
    } catch (err) {
      setError(err.message || DEFAULT_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkUpdate = useCallback(async (id) => checkContainerUpdate(id), []);

  const update = useCallback(async (id) => {
    const result = await updateContainer(id);
    await loadContainers();
    return result;
  }, [loadContainers]);

  const updateAll = useCallback(async () => {
    const result = await updateAllContainers();
    await loadContainers();
    return result;
  }, [loadContainers]);

  const setExclusion = useCallback(async (id, excluded) => {
    const result = await setContainerExclusion(id, excluded);
    await loadContainers();
    return result;
  }, [loadContainers]);

  useEffect(() => {
    loadContainers();
    const interval = setInterval(loadContainers, pollIntervalMs);
    return () => clearInterval(interval);
  }, [loadContainers, pollIntervalMs]);

  return {
    containers,
    loading,
    error,
    refresh: loadContainers,
    checkUpdate,
    update,
    updateAll,
    setExclusion,
  };
}
