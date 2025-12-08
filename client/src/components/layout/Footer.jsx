import React from 'react';

const Footer = ({ version }) => (
  <footer className="border-t border-gray-200 bg-white/90 backdrop-blur mt-6">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-center text-sm text-gray-700 gap-3 sm:gap-4 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 shadow-xs">
        <span role="img" aria-label="love">❤️</span>
        <span className="text-gray-700">Made with love by</span>
        <a
          href="https://github.com/nooblk-98/lighthouse"
          className="text-indigo-600 hover:text-indigo-700 font-semibold"
          target="_blank"
          rel="noreferrer"
        >
          nooblk
        </a>
      </div>
      <div className="inline-flex items-center gap-2 text-xs text-gray-600">
        <span className="uppercase tracking-wide text-gray-500">Version</span>
        <span className="font-semibold text-gray-800">{version}</span>
      </div>
    </div>
  </footer>
);

export default Footer;
