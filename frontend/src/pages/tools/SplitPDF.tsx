import { useState } from 'react';
import { Scissors, Download, CheckCircle } from 'lucide-react';
import { DropZone } from '../../components/UI/DropZone';
import { FileList } from '../../components/UI/FileList';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { Button } from '../../components/UI/Button';
import { DonationModal } from '../../components/DonationModal';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { splitPDF, downloadResult } from '../../services/api';

export function SplitPDF() {
  const { files, status, progress, error, result, addFiles, removeFile, process, reset } = useFileProcessor();
  const [ranges, setRanges] = useState('');
  const [splitAll, setSplitAll] = useState(false);
  const [showDonation, setShowDonation] = useState(false);

  const handleSplit = async () => {
    if (!files[0]) return;
    await process(async (fs) => splitPDF(fs[0], splitAll ? 'all' : ranges));
    setShowDonation(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-50 dark:bg-purple-950 rounded-2xl mb-4">
          <Scissors className="w-7 h-7 text-purple-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Split PDF</h1>
        <p className="text-slate-500 dark:text-slate-400">Extract pages or split your PDF into multiple files</p>
      </div>

      {status !== 'done' && (
        <div className="space-y-4">
          {files.length === 0 ? (
            <DropZone onFilesAdded={addFiles} multiple={false} label="Drop a PDF file here" />
          ) : (
            <FileList files={files} onRemove={removeFile} />
          )}

          {files.length > 0 && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitAll}
                  onChange={e => setSplitAll(e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">Split all pages into individual PDFs</span>
              </label>
              {!splitAll && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Page ranges (e.g., 1-3, 5, 7-9)
                  </label>
                  <input
                    type="text"
                    value={ranges}
                    onChange={e => setRanges(e.target.value)}
                    placeholder="1-3, 5, 7-9"
                    className="input"
                  />
                </div>
              )}
            </div>
          )}

          {(status === 'uploading' || status === 'processing') && (
            <ProgressBar progress={progress} label="Splitting PDF..." />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            onClick={handleSplit}
            loading={status === 'uploading' || status === 'processing'}
            disabled={files.length === 0 || (!splitAll && !ranges)}
            className="w-full"
          >
            <Scissors className="w-5 h-5" />
            Split PDF
          </Button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">PDF Split!</h2>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => downloadResult(result, 'split.zip')}>
              <Download className="w-5 h-5" />Download Split PDF
            </Button>
            <Button variant="secondary" onClick={reset}>Split Another</Button>
          </div>
        </div>
      )}

      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
    </div>
  );
}
