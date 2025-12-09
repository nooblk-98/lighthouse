import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Save, Bell, Settings2, Mail, ShieldCheck, Download, Upload, Shield } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { validateRegistry, validateSmtp, exportSettingsBackup, importSettingsBackup } from '../api/settings';

const SectionTitle = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-200">
      <Icon size={18} />
    </div>
    <div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
      {description ? <p className="text-sm text-gray-600 dark:text-slate-300">{description}</p> : null}
    </div>
  </div>
);

const Toggle = ({ label, checked, onChange, helper }) => (
  <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-md px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
    <div>
      <div className="text-sm font-medium text-gray-800 dark:text-slate-100">{label}</div>
      {helper ? <div className="text-xs text-gray-500 dark:text-slate-400">{helper}</div> : null}
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 shadow transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

const StatusChip = ({ state, message }) => {
  const map = {
    success: { text: 'Success', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-800' },
    error: { text: 'Error', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-100 dark:border-red-800' },
    validating: { text: 'Validating', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800' },
    idle: { text: 'Not validated', className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700' },
  };
  const cfg = map[state] || map.idle;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${cfg.className}`} aria-live="polite">
      {cfg.text}{message ? ` • ${message}` : ''}
    </span>
  );
};

const SettingsModal = ({ isOpen, onClose, settings = DEFAULT_SETTINGS, onSave, loading }) => {
  const [formData, setFormData] = useState({
    ...DEFAULT_SETTINGS,
    ...settings,
  });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [registryStatus, setRegistryStatus] = useState({
    dockerhub: { state: 'idle', message: '' },
    ghcr: { state: 'idle', message: '' },
  });
  const [smtpStatus, setSmtpStatus] = useState({ state: 'idle', message: '' });
  const [backupPassword, setBackupPassword] = useState('');
  const [backupFormat, setBackupFormat] = useState('json');
  const [backupStatus, setBackupStatus] = useState(null);
  const [importPassword, setImportPassword] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [importFileName, setImportFileName] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  useEffect(() => {
    setFormData({
      ...DEFAULT_SETTINGS,
      ...settings,
    });
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleFlag = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await onSave(formData);
      if (updated) {
        setFormData(updated);
      }
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const statusClasses = (type) => {
    if (type === 'success') return 'text-green-700 bg-green-50 border border-green-200 dark:text-green-100 dark:bg-green-900/40 dark:border-green-800';
    if (type === 'error') return 'text-red-700 bg-red-50 border border-red-200 dark:text-red-100 dark:bg-red-900/40 dark:border-red-800';
    return 'text-gray-700 dark:text-slate-200 bg-gray-50 border border-gray-200 dark:text-slate-200 dark:bg-slate-800 dark:border-slate-700';
  };

  const handleExport = async () => {
    if (!backupPassword) {
      setBackupStatus({ type: 'error', message: 'Enter a password to encrypt the backup.' });
      return;
    }
    setBackupStatus({ type: 'info', message: 'Preparing encrypted backup...' });
    try {
      const { blob, filename } = await exportSettingsBackup({ password: backupPassword, format: backupFormat });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `lighthouse-settings-backup.${backupFormat === 'yaml' ? 'yaml' : 'json'}`;
      link.click();
      URL.revokeObjectURL(url);
      setBackupStatus({ type: 'success', message: 'Backup downloaded.' });
    } catch (err) {
      setBackupStatus({ type: 'error', message: err.message || 'Failed to export settings.' });
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setImportStatus({ type: 'error', message: 'Choose a backup file to import.' });
      return;
    }
    if (!importPassword) {
      setImportStatus({ type: 'error', message: 'Enter the password used to encrypt the backup.' });
      return;
    }
    setImportStatus({ type: 'info', message: 'Importing and decrypting backup...' });
    try {
      const content = await file.text();
      const response = await importSettingsBackup({ password: importPassword, content });
      const restored = { ...DEFAULT_SETTINGS, ...(response?.settings || {}) };
      setFormData(restored);
      setImportStatus({ type: 'success', message: 'Settings restored. Review and save if needed.' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setImportStatus({ type: 'error', message: err.message || 'Failed to import backup.' });
    }
  };

  const validateRegistryFields = (provider) => {
    const username = formData[`${provider}_username`];
    const token = formData[`${provider}_token`];
    if (!username || !token) {
      return `${provider === 'dockerhub' ? 'Docker Hub' : 'GHCR'} username and token are required.`;
    }
    return null;
  };

  const handleRegistrySave = async (provider) => {
    const validationError = validateRegistryFields(provider);
    if (validationError) {
      setRegistryStatus((prev) => ({ ...prev, [provider]: { state: 'error', message: validationError } }));
      return;
    }

    setActiveSection('registries');
    setRegistryStatus((prev) => ({ ...prev, [provider]: { state: 'validating', message: 'Validating credentials...' } }));
    try {
      const username = formData[`${provider}_username`];
      const token = formData[`${provider}_token`];
      const validation = await validateRegistry({ provider, username, token });
      if (!validation?.valid) {
        throw new Error(validation?.message || 'Validation failed');
      }

      const updated = await onSave(formData);
      if (updated) {
        setFormData(updated);
      }
      setRegistryStatus((prev) => ({ ...prev, [provider]: { state: 'success', message: 'Credentials validated and saved.' } }));
    } catch (err) {
      setRegistryStatus((prev) => ({
        ...prev,
        [provider]: { state: 'error', message: err.message || 'Failed to validate credentials.' },
      }));
    }
  };

  const handleSmtpValidate = async () => {
    const requiredFields = ['smtp_host', 'smtp_port'];
    const missing = requiredFields.filter((k) => !formData[k]);
    if (missing.length) {
      setSmtpStatus({ state: 'error', message: 'SMTP host and port are required.' });
      return;
    }

    setActiveSection('notifications');
    setSmtpStatus({ state: 'validating', message: 'Validating SMTP connection...' });
    try {
      const res = await validateSmtp({
        host: formData.smtp_host,
        port: Number(formData.smtp_port),
        username: formData.smtp_username,
        password: formData.smtp_password,
        use_tls: !!formData.smtp_use_tls,
      });
      if (!res?.valid) {
        throw new Error(res?.message || 'Validation failed');
      }
      setSmtpStatus({ state: 'success', message: res.message || 'SMTP validated.' });
    } catch (err) {
      setSmtpStatus({ state: 'error', message: err.message || 'SMTP validation failed.' });
    }
  };

  const sections = useMemo(() => ([
    { id: 'general', label: 'General', icon: Settings2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'registries', label: 'Registries', icon: ShieldCheck },
    { id: 'backup', label: 'Backup', icon: Shield },
  ]), []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 overflow-hidden dark:border dark:border-slate-800">
        <div className="bg-gray-50 border-r border-gray-200 p-4 md:p-6 dark:bg-slate-950 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Settings</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-200 md:hidden dark:text-slate-300 dark:hover:text-slate-100">
              <X size={22} />
            </button>
          </div>
          <nav className="space-y-2">
            {sections.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border ${
                    active
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-100'
                      : 'border-transparent text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="md:col-span-3 p-4 md:p-8 space-y-8">
          <div className="hidden md:flex items-center justify-end">
            <button onClick={onClose} type="button" className="text-gray-500 hover:text-gray-700 dark:text-slate-200 dark:text-slate-300 dark:hover:text-slate-100">
              <X size={22} />
            </button>
          </div>

          {activeSection === 'general' ? (
            <div className="space-y-6">
              <SectionTitle
                icon={Settings2}
                title="General"
                description="Core update behavior and housekeeping."
              />

              <Toggle
                label="Enable Auto-Update"
                checked={formData.auto_update_enabled}
                onChange={() => toggleFlag('auto_update_enabled')}
                helper="Automatically update containers during scheduled scans."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                    Check Interval (minutes)
                  </label>
                  <input
                    type="number"
                    name="check_interval_minutes"
                    value={formData.check_interval_minutes}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <Toggle
                label="Cleanup Old Images"
                checked={formData.cleanup_enabled}
                onChange={() => toggleFlag('cleanup_enabled')}
                helper="Remove old images after successful updates to save disk space."
              />
            </div>
          ) : null}

          {activeSection === 'notifications' ? (
            <div className="space-y-6">
              <SectionTitle
                icon={Bell}
                title="Notifications"
                description="SMTP settings for email alerts after updates."
              />

              <Toggle
                label="Enable Notifications"
                checked={formData.notifications_enabled}
                onChange={() => toggleFlag('notifications_enabled')}
                helper="Send an email after each container update."
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <StatusChip state={smtpStatus.state} message={smtpStatus.message} />
                <button
                  type="button"
                  onClick={handleSmtpValidate}
                  className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  disabled={smtpStatus.state === 'validating' || loading}
                >
                  {smtpStatus.state === 'validating' ? 'Validating...' : 'Validate SMTP'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    name="smtp_host"
                    value={formData.smtp_host}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">SMTP Port</label>
                  <input
                    type="number"
                    name="smtp_port"
                    value={formData.smtp_port}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Username</label>
                  <input
                    type="text"
                    name="smtp_username"
                    value={formData.smtp_username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Password</label>
                  <input
                    type="password"
                    name="smtp_password"
                    value={formData.smtp_password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">From</label>
                  <input
                    type="email"
                    name="smtp_from"
                    value={formData.smtp_from}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="noreply@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">To</label>
                  <input
                    type="email"
                    name="smtp_to"
                    value={formData.smtp_to}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ops@example.com"
                  />
                </div>
              </div>

              <Toggle
                label="Use TLS"
                checked={formData.smtp_use_tls}
                onChange={() => toggleFlag('smtp_use_tls')}
                helper="Enable TLS when connecting to your SMTP server."
              />
            </div>
          ) : null}

          {activeSection === 'registries' ? (
            <div className="space-y-6">
              <SectionTitle
                icon={ShieldCheck}
                title="Registry credentials"
                description="Use scoped credentials when checking for updates in Docker Hub or GitHub Container Registry."
              />

              <div className="space-y-3">
                <div className="text-xs text-gray-600">
                  Tokens are sent only to your backend for update checks. Keep them limited to read/pull scopes.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Docker Hub username</label>
                    <input
                      type="text"
                      name="dockerhub_username"
                      value={formData.dockerhub_username}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="dockerhub user"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Docker Hub token</label>
                    <input
                      type="password"
                      name="dockerhub_token"
                      value={formData.dockerhub_token}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="access token / PAT"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <StatusChip
                    state={registryStatus.dockerhub?.state}
                    message={registryStatus.dockerhub?.message}
                  />
                  <button
                    type="button"
                    onClick={() => handleRegistrySave('dockerhub')}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                    disabled={registryStatus.dockerhub?.state === 'validating' || loading}
                  >
                    {registryStatus.dockerhub?.state === 'validating' ? 'Validating...' : 'Save'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">GHCR username</label>
                    <input
                      type="text"
                      name="ghcr_username"
                      value={formData.ghcr_username}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="github user"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">GHCR token</label>
                    <input
                      type="password"
                      name="ghcr_token"
                      value={formData.ghcr_token}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="ghcr PAT with read:packages"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <StatusChip
                    state={registryStatus.ghcr?.state}
                    message={registryStatus.ghcr?.message}
                  />
                  <button
                    type="button"
                    onClick={() => handleRegistrySave('ghcr')}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                    disabled={registryStatus.ghcr?.state === 'validating' || loading}
                  >
                    {registryStatus.ghcr?.state === 'validating' ? 'Validating...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === 'backup' ? (
            <div className="space-y-6">
              <SectionTitle
                icon={Shield}
                title="Backup &amp; Restore"
                description="Encrypted backups keep all settings (including credentials) safe to move between installs."
              />

              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Download size={16} />
                  Export encrypted backup
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Encryption password</label>
                    <input
                      type="password"
                      value={backupPassword}
                      onChange={(e) => {
                        setBackupPassword(e.target.value);
                        setImportPassword(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Required for export and import"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Export format</label>
                      <select
                        value={backupFormat}
                        onChange={(e) => setBackupFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                      >
                        <option value="json">JSON</option>
                        <option value="yaml">YAML</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">&nbsp;</label>
                      <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex items-center justify-center px-4 py-2 w-full text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Download size={16} className="mr-2" />
                        Export backup
                      </button>
                    </div>
                  </div>
                  {backupStatus ? (
                    <div className={`text-sm rounded-md px-3 py-2 ${statusClasses(backupStatus.type)}`}>
                      {backupStatus.message}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Upload size={16} />
                  Import backup
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Encryption password</label>
                    <input
                      type="password"
                      value={importPassword}
                      onChange={(e) => setImportPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Password used when exporting"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Backup file</label>
                      <label className="flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 cursor-pointer text-sm text-gray-700 dark:text-slate-200 hover:border-indigo-400 transition">
                        <span className="truncate">{importFileName || 'Choose backup file'}</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json,.yaml,.yml"
                          className="hidden"
                          onChange={() => {
                            const fileName = fileInputRef.current?.files?.[0]?.name || '';
                            setImportFileName(fileName);
                            if (fileName) {
                              setImportStatus(null);
                            }
                          }}
                        />
                      </label>
                      <div className="text-xs text-gray-500 mt-1">
                        JSON or YAML backup
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">&nbsp;</label>
                      <button
                        type="button"
                        onClick={handleImport}
                        className="inline-flex items-center justify-center px-4 py-2 w-full text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Upload size={16} className="mr-2" />
                        Import backup
                      </button>
                    </div>
                  </div>
                  {importStatus ? (
                    <div className={`text-sm rounded-md px-3 py-2 ${statusClasses(importStatus.type)}`}>
                      {importStatus.message}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeSection !== 'backup' && activeSection !== 'registries' ? (
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || loading}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save size={16} className="mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
