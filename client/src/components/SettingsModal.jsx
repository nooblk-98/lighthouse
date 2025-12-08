import React, { useMemo, useState } from 'react';
import { X, Save, Bell, Settings2, Mail, ShieldCheck } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../constants/settings';

const SectionTitle = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
      <Icon size={18} />
    </div>
    <div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description ? <p className="text-sm text-gray-600">{description}</p> : null}
    </div>
  </div>
);

const Toggle = ({ label, checked, onChange, helper }) => (
  <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-md px-3 py-2">
    <div>
      <div className="text-sm font-medium text-gray-800">{label}</div>
      {helper ? <div className="text-xs text-gray-500">{helper}</div> : null}
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
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

const SettingsModal = ({ isOpen, onClose, settings = DEFAULT_SETTINGS, onSave, loading }) => {
  const [formData, setFormData] = useState({
    ...DEFAULT_SETTINGS,
    ...settings,
  });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  if (!isOpen) return null;

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
      await onSave(formData);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const sections = useMemo(() => ([
    { id: 'general', label: 'General', icon: Settings2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]), []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 overflow-hidden">
        <div className="bg-gray-50 border-r border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 md:hidden">
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
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-transparent text-gray-700 hover:bg-gray-100'
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
            <button onClick={onClose} type="button" className="text-gray-500 hover:text-gray-700">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check Interval (minutes)
                  </label>
                  <input
                    type="number"
                    name="check_interval_minutes"
                    value={formData.check_interval_minutes}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    name="smtp_host"
                    value={formData.smtp_host}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input
                    type="number"
                    name="smtp_port"
                    value={formData.smtp_port}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="smtp_username"
                    value={formData.smtp_username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="smtp_password"
                    value={formData.smtp_password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="email"
                    name="smtp_from"
                    value={formData.smtp_from}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="noreply@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="email"
                    name="smtp_to"
                    value={formData.smtp_to}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
