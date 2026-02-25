import { useState } from 'react';
import { FileDown, Download, CheckCircle } from 'lucide-react';
import { DropZone } from '../../components/UI/DropZone';
import { FileList } from '../../components/UI/FileList';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { Button } from '../../components/UI/Button';
import { DonationModal } from '../../components/DonationModal';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { compressPDF, downloadResult } from '../../services/api';
import type { CompressionLevel } from '../../types';
import { clsx } from 'clsx';

const LEVELS: { value: CompressionLevel; label: string; description: string }[] = [
  { value: 'low', label: 'Low Compression', description: 'Slight reduction, best quality' },
  { value: 'medium', label: 'Medium Compression', description: 'Balanced size and quality' },
  { value: 'high', label: 'High Compression', description: 'Maximum reduction, lower quality' },
];

function formatSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function CompressPDF() {
  const { files, status, progress, error, result, addFiles, removeFile, process, reset } = useFileProcessor();
  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [sizes, setSizes] = useState<{ original: number; compressed: number } | null>(null);
  const [showDonation, setShowDonation] = useState(false);

  const handleCompress = async () => {
    if (!files[0]) return;
    await process(async (fs) => {
      const res = await compressPDF(fs[0], level);
      setSizes({ original: res.originalSize, compressed: res.compressedSize });
      return res.blob;
    });
    setShowDonation(true);
  };

  const savings = sizes && sizes.original > 0
    ? Math.round((1 - sizes.compressed / sizes.original) * 100)
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 dark:bg-green-950 rounded-2xl mb-4">
          <FileDown className="w-7 h-7 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Compress PDF</h1>
        <p className="text-slate-500 dark:text-slate-400">Reduce PDF file size while maintaining quality</p>
      </div>

      {status !== 'done' && (
        <div className="space-y-4">
          {files.length === 0 ? (
            <DropZone onFilesAdded={addFiles} multiple={false} />
          ) : (
            <FileList files={files} onRemove={removeFile} />
          )}

          <div className="grid grid-cols-3 gap-3">
            {LEVELS.map(l => (
              <button
                key={l.value}
                onClick={() => setLevel(l.value)}
                className={clsx(
                  'p-4 rounded-xl border-2 text-left transition-all duration-200',
                  level === l.value
                    ? 'border-red-500 bg-red-50 dark:bg-red-950'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                <p className={clsx('font-semibold text-sm', level === l.value ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300')}>
                  {l.label}
                </p>
                <p className="text-xs text-slate-400 mt-1">{l.description}</p>
              </button>
            ))}
          </div>

          {(status === 'uploading' || status === 'processing') && (
            <ProgressBar progress={progress} label="Compressing PDF..." />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            onClick={handleCompress}
            loading={status === 'uploading' || status === 'processing'}
            disabled={files.length === 0}
            className="w-full"
          >
            <FileDown className="w-5 h-5" />
            Compress PDF
          </Button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Compression Complete!</h2>
          {sizes && (
            <div className="flex justify-center gap-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <p className="text-sm text-slate-500">Original</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatSize(sizes.original)}</p>
              </div>
              <div className="text-green-500 font-bold text-xl flex items-center">↓ {savings}%</div>
              <div>
                <p className="text-sm text-slate-500">Compressed</p>
                <p className="text-lg font-bold text-green-600">{formatSize(sizes.compressed)}</p>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => downloadResult(result, 'compressed.pdf')}>
              <Download className="w-5 h-5" />Download Compressed PDF
            </Button>
            <Button variant="secondary" onClick={reset}>Compress Another</Button>
          </div>
        </div>
      )}

      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
    </div>
  );
}
