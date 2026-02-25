import { Link } from 'react-router-dom';
import { FileText, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                PDF<span className="text-red-500">Tools</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Free online PDF tools to merge, split, compress, and convert PDFs. 
              Files are deleted after 30 minutes.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Tools</h3>
            <ul className="space-y-2">
              {[
                ['Merge PDF', '/merge'],
                ['Split PDF', '/split'],
                ['Compress PDF', '/compress'],
                ['Rotate PDF', '/rotate'],
                ['Extract Pages', '/extract'],
                ['Convert PDF', '/convert'],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">More Tools</h3>
            <ul className="space-y-2">
              {[
                ['Protect PDF', '/protect'],
                ['Unlock PDF', '/unlock'],
                ['Watermark PDF', '/watermark'],
                ['Edit PDF', '/edit'],
              ].map(([label, to]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} PDFTools. Free to use, always.
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
            Open Source
          </a>
        </div>
      </div>
    </footer>
  );
}
