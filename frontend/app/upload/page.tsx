'use client';

import { FileUp, Loader2, Upload, Sparkles } from 'lucide-react';
import { useState } from 'react';

const uploadApiUrl =
  process.env.NEXT_PUBLIC_UPLOAD_API_URL || 'http://localhost:4000/upload';

export default function UploadPage() {
  console.log('a');

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file || loading) return;

    setLoading(true);
    setStatus('Uploading and processing...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadApiUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload PDF.');
      }

      setStatus('Successfully uploaded and ingested!');
    } catch (error) {
      console.error(error);
      setStatus('Failed to upload PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-lg flex flex-col bg-zinc-900 rounded-2xl border border-zinc-700/50 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-700/50 bg-zinc-900/80">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Sparkles size={15} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100 tracking-wide">
              Gemini
            </p>
            <p className="text-[11px] text-zinc-500">PDF Ingestion</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-800 hover:bg-zinc-700 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload size={30} className="text-zinc-500 mb-2" />
              <p className="text-sm text-zinc-400">
                {file ? file.name : 'Click to upload PDF'}
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf"
            />
          </label>

          <button
            onClick={uploadFile}
            disabled={!file || loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 hover:bg-amber-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileUp size={16} />
            )}
            Upload and Process
          </button>

          {status && (
            <p className="text-center text-sm text-zinc-400 mt-2">{status}</p>
          )}
        </div>
      </div>
    </div>
  );
}
