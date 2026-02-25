import { useState, useCallback } from 'react';
import type { FileItem, ProcessingStatus } from '../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function useFileProcessor() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    const items: FileItem[] = newFiles.map(file => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      status: 'idle',
      progress: 0,
    }));
    setFiles(prev => [...prev, ...items]);
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  const process = useCallback(async (processFn: (files: File[]) => Promise<Blob>) => {
    if (files.length === 0) return;
    setStatus('uploading');
    setProgress(10);
    setError(null);
    try {
      setStatus('processing');
      setProgress(40);
      const blob = await processFn(files.map(f => f.file));
      setProgress(100);
      setStatus('done');
      setResult(blob);
    } catch (err: unknown) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Processing failed';
      setError(message);
    }
  }, [files]);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    files,
    status,
    progress,
    error,
    result,
    addFiles,
    removeFile,
    reorderFiles,
    clearFiles,
    process,
    reset,
  };
}
