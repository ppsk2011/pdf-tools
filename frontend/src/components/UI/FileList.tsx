import { FileText, X, ArrowUp, ArrowDown } from 'lucide-react';
import type { FileItem } from '../../types';
import { clsx } from 'clsx';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

interface FileListProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  reorderable?: boolean;
}

export function FileList({ files, onRemove, onMoveUp, onMoveDown, reorderable = false }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <ul className="space-y-2" aria-label="File list">
      {files.map((file, index) => (
        <li
          key={file.id}
          className={clsx(
            'flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
            file.status === 'error' && 'border-red-300 dark:border-red-700'
          )}
        >
          <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
            {file.error && <p className="text-xs text-red-500 mt-0.5">{file.error}</p>}
          </div>
          {reorderable && (
            <div className="flex gap-1">
              <button
                onClick={() => onMoveUp?.(index)}
                disabled={index === 0}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Move up"
              >
                <ArrowUp className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={() => onMoveDown?.(index)}
                disabled={index === files.length - 1}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Move down"
              >
                <ArrowDown className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}
          <button
            onClick={() => onRemove(file.id)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 transition-colors touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label={`Remove ${file.name}`}
          >
            <X className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
