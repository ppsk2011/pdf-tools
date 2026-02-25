import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '../components/UI/Button';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <FileQuestion className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-6" />
      <h1 className="text-6xl font-bold text-slate-900 dark:text-slate-100 mb-2">404</h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">Page not found</p>
      <Link to="/">
        <Button variant="primary">← Back to Home</Button>
      </Link>
    </div>
  );
}
