import { useState } from 'react';
import { Image, Download, CheckCircle, ArrowRight } from 'lucide-react';
import type { Accept } from 'react-dropzone';
import { DropZone } from '../../components/UI/DropZone';
import { FileList } from '../../components/UI/FileList';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { Button } from '../../components/UI/Button';
import { DonationModal } from '../../components/DonationModal';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { convertFile, downloadResult } from '../../services/api';
import { clsx } from 'clsx';

const CONVERSIONS: { from: string; to: string; format: string; accept: Accept; outputExt: string; note?: string }[] = [
  { from: 'PDF', to: 'JPG', format: 'jpg', accept: { 'application/pdf': ['.pdf'] }, outputExt: 'zip' },
  { from: 'PDF', to: 'Word', format: 'docx', accept: { 'application/pdf': ['.pdf'] }, outputExt: 'docx', note: 'Requires server support' },
  { from: 'JPG', to: 'PDF', format: 'pdf-from-jpg', accept: { 'image/jpeg': ['.jpg', '.jpeg'] }, outputExt: 'pdf' },
  { from: 'Images', to: 'PDF', format: 'pdf-from-images', accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }, outputExt: 'pdf' },
];

export function ConvertPDF() {
  const { files, status, progress, error, result, addFiles, removeFile, process, reset } = useFileProcessor();
  const [selected, setSelected] = useState(0);
  const [showDonation, setShowDonation] = useState(false);

  const conv = CONVERSIONS[selected];

  const handleConvert = async () => {
    if (!files[0]) return;
    await process(async (fs) => convertFile(fs[0], conv.format));
    setShowDonation(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-pink-50 dark:bg-pink-950 rounded-2xl mb-4">
          <Image className="w-7 h-7 text-pink-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Convert PDF</h1>
        <p className="text-slate-500 dark:text-slate-400">Convert PDFs to other formats and vice versa</p>
      </div>

      {status !== 'done' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {CONVERSIONS.map((c, i) => (
              <button
                key={i}
                onClick={() => { setSelected(i); reset(); }}
                className={clsx(
                  'flex items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium',
                  selected === i
                    ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                )}
              >
                <span>{c.from}</span>
                <ArrowRight className="w-4 h-4 opacity-60" />
                <span>{c.to}</span>
                {c.note && <span className="text-xs opacity-60 ml-1">(β)</span>}
              </button>
            ))}
          </div>

          {files.length === 0 ? (
            <DropZone onFilesAdded={addFiles} accept={conv.accept} multiple={conv.format.includes('images')} />
          ) : (
            <FileList files={files} onRemove={removeFile} />
          )}

          {(status === 'uploading' || status === 'processing') && (
            <ProgressBar progress={progress} label="Converting..." />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleConvert} loading={status === 'uploading' || status === 'processing'} disabled={files.length === 0} className="w-full">
            <ArrowRight className="w-5 h-5" />Convert {conv.from} to {conv.to}
          </Button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Conversion Complete!</h2>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => downloadResult(result, `converted.${conv.outputExt}`)}><Download className="w-5 h-5" />Download</Button>
            <Button variant="secondary" onClick={reset}>Convert Another</Button>
          </div>
        </div>
      )}

      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
    </div>
  );
}
