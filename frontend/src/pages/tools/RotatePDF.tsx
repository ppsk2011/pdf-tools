import { useState } from 'react';
import { RotateCw, Download, CheckCircle } from 'lucide-react';
import { DropZone } from '../../components/UI/DropZone';
import { FileList } from '../../components/UI/FileList';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { Button } from '../../components/UI/Button';
import { DonationModal } from '../../components/DonationModal';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { rotatePDF, downloadResult } from '../../services/api';
import { clsx } from 'clsx';

const DEGREES = [90, 180, 270];

export function RotatePDF() {
  const { files, status, progress, error, result, addFiles, removeFile, process, reset } = useFileProcessor();
  const [degrees, setDegrees] = useState(90);
  const [allPages, setAllPages] = useState(true);
  const [pageInput, setPageInput] = useState('');
  const [showDonation, setShowDonation] = useState(false);

  const handleRotate = async () => {
    if (!files[0]) return;
    const pages = allPages ? [] : pageInput.split(',').map(p => parseInt(p.trim(), 10)).filter(Boolean);
    await process(async (fs) => rotatePDF(fs[0], pages, degrees));
    setShowDonation(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-50 dark:bg-orange-950 rounded-2xl mb-4">
          <RotateCw className="w-7 h-7 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Rotate PDF</h1>
        <p className="text-slate-500 dark:text-slate-400">Rotate pages in your PDF document</p>
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
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rotation angle</p>
                <div className="flex gap-3">
                  {DEGREES.map(d => (
                    <button
                      key={d}
                      onClick={() => setDegrees(d)}
                      className={clsx(
                        'flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all',
                        degrees === d
                          ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      )}
                    >
                      {d}°
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={allPages} onChange={e => setAllPages(e.target.checked)} className="w-4 h-4 accent-red-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Rotate all pages</span>
                </label>
                {!allPages && (
                  <input
                    type="text"
                    value={pageInput}
                    onChange={e => setPageInput(e.target.value)}
                    placeholder="e.g. 1, 3, 5"
                    className="input mt-2"
                  />
                )}
              </div>
            </div>
          )}

          {(status === 'uploading' || status === 'processing') && (
            <ProgressBar progress={progress} label="Rotating pages..." />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleRotate} loading={status === 'uploading' || status === 'processing'} disabled={files.length === 0} className="w-full">
            <RotateCw className="w-5 h-5" />Rotate PDF
          </Button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">PDF Rotated!</h2>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => downloadResult(result, 'rotated.pdf')}><Download className="w-5 h-5" />Download</Button>
            <Button variant="secondary" onClick={reset}>Rotate Another</Button>
          </div>
        </div>
      )}

      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
    </div>
  );
}
