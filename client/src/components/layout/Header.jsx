import React from 'react';
import { LayoutDashboard, RefreshCcw, Settings } from 'lucide-react';

const Header = ({ onRefresh, onOpenSettings, loading }) => (
  <header className="bg-white shadow-sm sticky top-0 z-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <LayoutDashboard className="text-indigo-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">Light House</h1>
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
  </header>
);

export default Header;
