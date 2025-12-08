import React from 'react';
import { RefreshCcw, Settings, Clock3, Bell } from 'lucide-react';

const Pill = ({ active, icon: Icon, label }) => (
  <span
    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold gap-1.5 border ${
      active
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-gray-50 text-gray-600 border-gray-200'
    }`}
  >
    <Icon size={14} className={active ? 'text-emerald-600' : 'text-gray-500'} />
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
}) => (
  <header className="bg-white/95 backdrop-blur sticky top-0 z-10 shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <img src="/logo.svg" alt="Light House logo" className="h-10 w-10 rounded-full shadow-sm" />
          <div className="flex flex-col gap-1 leading-tight">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Light House</h1>
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

            {scheduleEnabled ? (
              <div className="flex flex-wrap items-center gap-5 text-sm text-gray-700">
                <div className="inline-flex items-center gap-1.5">
                  <Clock3 size={16} className="text-gray-500" />
                  <span className="font-medium">Last check:</span>
                  <span>{lastCheckLabel || '--'}</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <Clock3 size={16} className="text-gray-500" />
                  <span className="font-medium">Next:</span>
                  <span>{nextCheckLabel || '--'}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 inline-flex items-center gap-2 shadow-xs">
                <Clock3 size={16} className="text-gray-500" />
                <span>Scheduling is turned off. Enable auto-update to see upcoming checks.</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
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
