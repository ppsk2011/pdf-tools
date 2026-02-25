import { Link } from 'react-router-dom';
import { Edit, ArrowRight } from 'lucide-react';
import { Card } from '../../components/UI/Card';

const RELATED_TOOLS = [
  { label: 'Watermark PDF', path: '/watermark', description: 'Add text to your PDF' },
  { label: 'Rotate PDF', path: '/rotate', description: 'Rotate pages' },
  { label: 'Extract Pages', path: '/extract', description: 'Extract specific pages' },
];

export function EditPDF() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-50 dark:bg-cyan-950 rounded-2xl mb-4">
          <Edit className="w-7 h-7 text-cyan-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Edit PDF</h1>
        <p className="text-slate-500 dark:text-slate-400">Advanced PDF editing capabilities</p>
      </div>

      <Card className="p-8 text-center mb-8">
        <Edit className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Full PDF Editor</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Advanced text editing, annotation, and form filling features are coming soon. 
          In the meantime, try our other powerful tools below.
        </p>
        <span className="inline-block bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-sm font-medium px-3 py-1 rounded-full">
          Coming Soon
        </span>
      </Card>

      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Related Tools</h3>
      <div className="space-y-3">
        {RELATED_TOOLS.map(tool => (
          <Link key={tool.path} to={tool.path}>
            <Card hover className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{tool.label}</p>
                <p className="text-sm text-slate-400">{tool.description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
