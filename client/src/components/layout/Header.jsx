import React from 'react';
import { RefreshCcw, Settings, Clock3, Bell, Sun, Moon } from 'lucide-react';

const Pill = ({ active, icon: Icon, label }) => (
  <span
    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold gap-1.5 border ${
      active
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800'
        : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    }`}
  >
    <Icon size={14} className={active ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-500 dark:text-slate-300'} />
    {label}
  </span>
);

const Header = ({
  onRefresh,
  onOpenSettings,
  loading,
  lastCheckLabel,
  nextCheckLabel,
  scheduleEnabled,
  notificationsEnabled,
  theme,
  onToggleTheme,
}) => (
  <header className="bg-white/95 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-10 shadow-sm border-b border-gray-200 dark:border-slate-800 transition-colors">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <img src="/logo.svg" alt="Light House logo" className="h-10 w-10 rounded-full shadow-sm" />
          <div className="flex flex-col gap-1 leading-tight">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">Light House</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Pill
                  active={!!scheduleEnabled}
                  icon={Clock3}
                  label={scheduleEnabled ? 'Auto-update on' : 'Auto-update off'}
                />
                <Pill
                  active={!!notificationsEnabled}
                  icon={Bell}
                  label={notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-200"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-200"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-200"
            title="Refresh List"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
