import React from 'react';

const Footer = ({ version }) => (
  <footer className="border-t border-gray-200 bg-white/90 backdrop-blur mt-6 dark:border-slate-800 dark:bg-slate-900/80">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-center text-sm text-gray-700 gap-3 sm:gap-4 text-center dark:text-slate-200">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 shadow-xs dark:bg-slate-800 dark:border-slate-700">
        <span role="img" aria-label="love">❤️</span>
        <span className="text-gray-700 dark:text-slate-200">Made with love by</span>
        <a
          href="https://github.com/nooblk-98/lighthouse"
          className="text-indigo-600 hover:text-indigo-700 font-semibold dark:text-indigo-300 dark:hover:text-indigo-200"
          target="_blank"
          rel="noreferrer"
        >
          nooblk
        </a>
      </div>
      <div className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
        <span className="uppercase tracking-wide text-gray-500 dark:text-slate-400">Version</span>
        <span className="font-semibold text-gray-800 dark:text-slate-100">{version}</span>
      </div>
    </div>
  </footer>
);

export default Footer;
