import { useState } from 'react';
import { Unlock, Download, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { DropZone } from '../../components/UI/DropZone';
import { FileList } from '../../components/UI/FileList';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { Button } from '../../components/UI/Button';
import { DonationModal } from '../../components/DonationModal';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { unlockPDF, downloadResult } from '../../services/api';

export function UnlockPDF() {
  const { files, status, progress, error, result, addFiles, removeFile, process, reset } = useFileProcessor();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showDonation, setShowDonation] = useState(false);

  const handleUnlock = async () => {
    if (!files[0]) return;
    await process(async (fs) => unlockPDF(fs[0], password));
    setShowDonation(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-50 dark:bg-yellow-950 rounded-2xl mb-4">
          <Unlock className="w-7 h-7 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Unlock PDF</h1>
        <p className="text-slate-500 dark:text-slate-400">Remove password protection from your PDF</p>
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">PDF Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter PDF password"
                  className="input pr-10"
                />
                <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600" type="button">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
          {(status === 'uploading' || status === 'processing') && (
            <ProgressBar progress={progress} label="Unlocking PDF..." />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleUnlock} loading={status === 'uploading' || status === 'processing'} disabled={files.length === 0 || !password} className="w-full">
            <Unlock className="w-5 h-5" />Unlock PDF
          </Button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">PDF Unlocked!</h2>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => downloadResult(result, 'unlocked.pdf')}><Download className="w-5 h-5" />Download</Button>
            <Button variant="secondary" onClick={reset}>Unlock Another</Button>
          </div>
        </div>
      )}

      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
    </div>
  );
}
