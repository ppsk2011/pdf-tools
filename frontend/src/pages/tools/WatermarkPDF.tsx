import { useState } from 'react';
import { Stamp, Download, CheckCircle } from 'lucide-react';
import { DropZone } from '../../components/UI/DropZone';
import { FileList } from '../../components/UI/FileList';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { Button } from '../../components/UI/Button';
import { DonationModal } from '../../components/DonationModal';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { watermarkPDF, downloadResult } from '../../services/api';
import { clsx } from 'clsx';

const POSITIONS = ['center', 'top', 'bottom'] as const;

export function WatermarkPDF() {
  const { files, status, progress, error, result, addFiles, removeFile, process, reset } = useFileProcessor();
  const [text, setText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState<'center' | 'top' | 'bottom'>('center');
  const [opacity, setOpacity] = useState(50);
  const [color, setColor] = useState('#000000');
  const [showDonation, setShowDonation] = useState(false);

  const handleWatermark = async () => {
    if (!files[0] || !text) return;
    await process(async (fs) => watermarkPDF(fs[0], text, { position, opacity: opacity / 100, color }));
    setShowDonation(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 dark:bg-indigo-950 rounded-2xl mb-4">
          <Stamp className="w-7 h-7 text-indigo-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Watermark PDF</h1>
        <p className="text-slate-500 dark:text-slate-400">Add a text watermark to your PDF document</p>
      </div>

      {status !== 'done' && (
        <div className="space-y-4">
          {files.length === 0 ? (
            <DropZone onFilesAdded={addFiles} multiple={false} />
          ) : (
            <FileList files={files} onRemove={removeFile} />
          )}
          {files.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Watermark Text</label>
                <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="e.g. CONFIDENTIAL" className="input" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Position</p>
                <div className="flex gap-2">
                  {POSITIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPosition(p)}
                      className={clsx(
                        'flex-1 py-2 rounded-lg border-2 capitalize text-sm font-medium transition-all',
                        position === p
                          ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Opacity: {opacity}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={opacity}
                  onChange={e => setOpacity(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer" />
                  <span className="text-sm text-slate-500">{color}</span>
                </div>
              </div>
            </div>
          )}
          {(status === 'uploading' || status === 'processing') && (
            <ProgressBar progress={progress} label="Adding watermark..." />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleWatermark} loading={status === 'uploading' || status === 'processing'} disabled={files.length === 0 || !text} className="w-full">
            <Stamp className="w-5 h-5" />Apply Watermark
          </Button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Watermark Applied!</h2>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => downloadResult(result, 'watermarked.pdf')}><Download className="w-5 h-5" />Download</Button>
            <Button variant="secondary" onClick={reset}>Watermark Another</Button>
          </div>
        </div>
      )}

      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
    </div>
  );
}
