import { useCallback } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { clsx } from 'clsx';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
  maxSize?: number;
  label?: string;
  description?: string;
}

export function DropZone({
  onFilesAdded,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  maxSize = 50 * 1024 * 1024,
  label = 'Drop PDF files here',
  description = 'or click to browse',
}: DropZoneProps) {
  const onDrop = useCallback((accepted: File[]) => {
    onFilesAdded(accepted);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize,
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 p-8',
        isDragActive && !isDragReject && 'border-red-500 bg-red-50 dark:bg-red-950',
        isDragReject && 'border-red-600 bg-red-100 dark:bg-red-900',
        !isDragActive && 'border-slate-300 dark:border-slate-600 hover:border-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-800/50'
      )}
      role="button"
      aria-label={label}
    >
      <input {...getInputProps()} aria-label="File upload input" />
      <div className="flex flex-col items-center gap-3 text-center">
        {isDragActive ? (
          <FileText className="w-12 h-12 text-red-500 animate-bounce" />
        ) : (
          <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500" />
        )}
        <div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            {isDragActive ? 'Drop files here' : label}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isDragReject ? 'Invalid file type' : description}
          </p>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Max file size: {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </div>
    </div>
  );
}
