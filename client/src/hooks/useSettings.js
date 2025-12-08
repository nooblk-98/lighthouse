import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { getSettings, saveSettings } from '../api/settings';

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      setSettings(data || DEFAULT_SETTINGS);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (payload) => {
    const updated = await saveSettings(payload);
    setSettings(updated);
    setVersion((v) => v + 1);
    return updated;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    settings,
    loading,
    error,
    refresh,
    save,
    version,
  };
}
