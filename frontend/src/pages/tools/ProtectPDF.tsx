import { useState } from 'react';
import { Lock, Download, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { DropZone } from '../../components/UI/DropZone';
import { FileList } from '../../components/UI/FileList';
import { ProgressBar } from '../../components/UI/ProgressBar';
import { Button } from '../../components/UI/Button';
import { DonationModal } from '../../components/DonationModal';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { protectPDF, downloadResult } from '../../services/api';

export function ProtectPDF() {
  const { files, status, progress, error, result, addFiles, removeFile, process, reset } = useFileProcessor();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showDonation, setShowDonation] = useState(false);

  const mismatch = confirm && password !== confirm;

  const handleProtect = async () => {
    if (!files[0] || mismatch) return;
    await process(async (fs) => protectPDF(fs[0], password));
    setShowDonation(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 dark:bg-red-950 rounded-2xl mb-4">
          <Lock className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Protect PDF</h1>
        <p className="text-slate-500 dark:text-slate-400">Add password protection to your PDF document</p>
      </div>

      {status !== 'done' && (
        <div className="space-y-4">
          {files.length === 0 ? (
            <DropZone onFilesAdded={addFiles} multiple={false} />
          ) : (
            <FileList files={files} onRemove={removeFile} />
          )}
          {files.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-3">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input pr-10"
                />
                <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-8 text-slate-400 hover:text-slate-600" type="button">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  className={`input ${mismatch ? 'border-red-500' : ''}`}
                />
                {mismatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
              </div>
            </div>
          )}
          {(status === 'uploading' || status === 'processing') && (
            <ProgressBar progress={progress} label="Protecting PDF..." />
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleProtect} loading={status === 'uploading' || status === 'processing'} disabled={files.length === 0 || !password || !!mismatch} className="w-full">
            <Lock className="w-5 h-5" />Protect PDF
          </Button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="text-center space-y-4 py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">PDF Protected!</h2>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => downloadResult(result, 'protected.pdf')}><Download className="w-5 h-5" />Download</Button>
            <Button variant="secondary" onClick={reset}>Protect Another</Button>
          </div>
        </div>
      )}

      {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
    </div>
  );
}
