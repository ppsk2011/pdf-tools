import { Link } from 'react-router-dom';
import {
  GitMerge, Scissors, FileDown, RotateCw, FileSearch, Image,
  Lock, Unlock, Stamp, Edit, ShieldCheck, Zap, Heart
} from 'lucide-react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';

const TOOLS = [
  {
    id: 'merge', title: 'Merge PDF', description: 'Combine multiple PDFs into one document',
    icon: GitMerge, path: '/merge', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  },
  {
    id: 'split', title: 'Split PDF', description: 'Split PDF into separate pages or ranges',
    icon: Scissors, path: '/split', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
  },
  {
    id: 'compress', title: 'Compress PDF', description: 'Reduce PDF file size without losing quality',
    icon: FileDown, path: '/compress', color: 'text-green-500 bg-green-50 dark:bg-green-950',
  },
  {
    id: 'rotate', title: 'Rotate PDF', description: 'Rotate pages in your PDF document',
    icon: RotateCw, path: '/rotate', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
  },
  {
    id: 'extract', title: 'Extract Pages', description: 'Extract specific pages from a PDF',
    icon: FileSearch, path: '/extract', color: 'text-teal-500 bg-teal-50 dark:bg-teal-950',
  },
  {
    id: 'convert', title: 'Convert PDF', description: 'Convert PDF to JPG, Word, and more',
    icon: Image, path: '/convert', color: 'text-pink-500 bg-pink-50 dark:bg-pink-950',
  },
  {
    id: 'protect', title: 'Protect PDF', description: 'Add password protection to your PDF',
    icon: Lock, path: '/protect', color: 'text-red-500 bg-red-50 dark:bg-red-950',
  },
  {
    id: 'unlock', title: 'Unlock PDF', description: 'Remove password from a protected PDF',
    icon: Unlock, path: '/unlock', color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  },
  {
    id: 'watermark', title: 'Watermark PDF', description: 'Add text watermark to your PDF',
    icon: Stamp, path: '/watermark', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950',
  },
  {
    id: 'edit', title: 'Edit PDF', description: 'Edit text and content in your PDF',
    icon: Edit, path: '/edit', color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950',
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Process your PDFs in seconds with our optimized server infrastructure.',
    color: 'text-yellow-500',
  },
  {
    icon: ShieldCheck,
    title: '100% Secure',
    description: 'Your files are encrypted in transit and automatically deleted after 30 minutes.',
    color: 'text-green-500',
  },
  {
    icon: Heart,
    title: 'Always Free',
    description: 'All tools are completely free to use. No sign-up required.',
    color: 'text-red-500',
  },
];

export function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-red-50 to-white dark:from-slate-800 dark:to-slate-900 py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm font-medium px-3 py-1.5 rounded-full mb-5">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            100% Free · No sign-up required
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-6 leading-tight">
            Free PDF Tools<br />
            <span className="text-red-500">Online</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Merge, split, compress, convert, and edit PDF files with ease. 
            No registration. No watermarks. Files deleted after 30 minutes.
          </p>
          <Link to="/merge">
            <Button size="lg" className="w-full sm:w-auto">Get Started Free →</Button>
          </Link>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-12">
          All PDF Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            return (
              <Link key={tool.id} to={tool.path}>
                <Card hover className="p-5 h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{tool.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{tool.description}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-4">
            Why PDFTools?
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-12">
            Built for speed, security, and simplicity
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map(feature => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm mb-4 ${feature.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 px-4 max-w-5xl mx-auto text-center">
        <p className="text-slate-400 text-sm">
          🔒 SSL encrypted &nbsp;·&nbsp; 🗑️ Files deleted after 30 min &nbsp;·&nbsp; 🌍 Processed on secure servers &nbsp;·&nbsp; ✅ No watermarks
        </p>
      </section>
    </main>
  );
}
