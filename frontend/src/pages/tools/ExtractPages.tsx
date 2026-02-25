import { useState } from 'react';
import { FileSearch, Download, CheckCircle } from 'lucide-react';
import { DropZone } from '../../components/UI/DropZone';
import { FileList } from '../../components/UI/FileList';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { Button } from '../../components/UI/Button';
import { DonationModal } from '../../components/DonationModal';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { extractPages, downloadResult } from '../../services/api';

export function ExtractPages() {
  const { files, status, progress, error, result, addFiles, removeFile, process, reset } = useFileProcessor();
  const [pages, setPages] = useState('');
  const [showDonation, setShowDonation] = useState(false);

  const handleExtract = async () => {
    if (!files[0]) return;
    await process(async (fs) => extractPages(fs[0], pages));
    setShowDonation(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-50 dark:bg-teal-950 rounded-2xl mb-4">
          <FileSearch className="w-7 h-7 text-teal-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Extract Pages</h1>
        <p className="text-slate-500 dark:text-slate-400">Extract specific pages from your PDF</p>
      </div>

      {status !== 'done' && (
        <div className="space-y-4">
          {files.length === 0 ? (
            <DropZone onFilesAdded={addFiles} multiple={false} />
          ) : (
            <FileList files={files} onRemove={removeFile} />
          )}
          {files.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pages to extract (e.g., 1-3, 5, 7-9)
              </label>
              <input
                type="text"
                value={pages}
                onChange={e => setPages(e.target.value)}
                placeholder="1-3, 5, 7-9"
                className="input"
              />
            </div>
          )}
          {(status === 'uploading' || status === 'processing') && (
            <ProgressBar progress={progress} label="Extracting pages..." />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleExtract} loading={status === 'uploading' || status === 'processing'} disabled={files.length === 0 || !pages} className="w-full">
            <FileSearch className="w-5 h-5" />Extract Pages
          </Button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pages Extracted!</h2>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => downloadResult(result, 'extracted.pdf')}><Download className="w-5 h-5" />Download</Button>
            <Button variant="secondary" onClick={reset}>Extract More</Button>
          </div>
        </div>
      )}

      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
    </div>
  );
}
