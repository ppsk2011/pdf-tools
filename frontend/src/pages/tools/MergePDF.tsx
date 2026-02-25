import { useState } from 'react';
import { GitMerge, Download, CheckCircle } from 'lucide-react';
import { DropZone } from '../../components/UI/DropZone';
import { FileList } from '../../components/UI/FileList';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { Button } from '../../components/UI/Button';
import { DonationModal } from '../../components/DonationModal';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { mergePDFs, downloadResult } from '../../services/api';

export function MergePDF() {
  const { files, status, progress, error, result, addFiles, removeFile, reorderFiles, process, reset } = useFileProcessor();
  const [showDonation, setShowDonation] = useState(false);

  const handleMerge = async () => {
    await process(async (fs) => mergePDFs(fs));
    setShowDonation(true);
  };

  const handleDownload = () => {
    if (result) downloadResult(result, 'merged.pdf');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 dark:bg-blue-950 rounded-2xl mb-4">
          <GitMerge className="w-7 h-7 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Merge PDF Files</h1>
        <p className="text-slate-500 dark:text-slate-400">Combine multiple PDF files into a single document</p>
      </div>

      {status !== 'done' && (
        <div className="space-y-4">
          <DropZone onFilesAdded={addFiles} multiple label="Drop PDF files here" />
          {files.length > 0 && (
            <FileList
              files={files}
              onRemove={removeFile}
              onMoveUp={(i) => reorderFiles(i, i - 1)}
              onMoveDown={(i) => reorderFiles(i, i + 1)}
              reorderable
            />
          )}
          {(status === 'uploading' || status === 'processing') && (
            <ProgressBar progress={progress} label={status === 'uploading' ? 'Uploading...' : 'Merging PDFs...'} />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            onClick={handleMerge}
            loading={status === 'uploading' || status === 'processing'}
            disabled={files.length < 2}
            className="w-full"
          >
            <GitMerge className="w-5 h-5" />
            Merge {files.length > 0 ? `${files.length} PDFs` : 'PDFs'}
          </Button>
          {files.length < 2 && files.length > 0 && (
            <p className="text-sm text-slate-400 text-center">Add at least 2 PDF files to merge</p>
          )}
        </div>
      )}

      {status === 'done' && result && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">PDF Merged!</h2>
          <p className="text-slate-500">Your PDF files have been successfully merged.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleDownload}>
              <Download className="w-5 h-5" />
              Download Merged PDF
            </Button>
            <Button variant="secondary" onClick={reset}>Merge More</Button>
          </div>
        </div>
      )}

      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
    </div>
  );
}
