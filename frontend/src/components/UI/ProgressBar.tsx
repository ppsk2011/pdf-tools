import { clsx } from 'clsx';

interface ProgressBarProps {
  progress: number;
  className?: string;
  label?: string;
}

export function ProgressBar({ progress, className, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{clamped}%</span>
        </div>
      )}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-red-500 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
