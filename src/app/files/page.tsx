'use client';

import React, { useEffect, useState } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
import { fetchVault } from '@/lib/vaultApi';
import { useRouter } from 'next/navigation';
import { useCrypto } from '@/contexts/CryptoContext';
import { FileUp, FileText, Download, ShieldCheck, UploadCloud } from 'lucide-react';
import axios from 'axios';

type FileItem = { id: string; title: string; url: string };

export default function FilesPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const router = useRouter();
  const { masterKey } = useCrypto();

  useEffect(() => {
    const loadFiles = async () => {
      try {
        if (!masterKey) return;
        const vaultItems = await fetchVault('file');
        const decryptedItems: FileItem[] = await Promise.all(
          vaultItems.map(async (item: any) => {
            const decryptedUrl = await decryptData(item.data, item.iv, masterKey);
            return { id: item._id, title: item.title || item.filename, url: decryptedUrl };
          })
        );
        setItems(decryptedItems);
      } catch (err) {
        console.error('File load error:', err);
        setError('Failed to load files');
      }
    };
    loadFiles();
  }, [masterKey]);

  const clearNotice = () => setTimeout(() => setSuccessMessage(''), 1800);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
  };

  const cloudinaryUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        formData
      );

      return response.data.secure_url;
    } catch (error: any) {
      throw error;
    }
  }


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setError('');
      if (!title.trim()) return setError('Title is required');
      if (!file) return setError('File is required');
      if (!masterKey) return setError('Encryption unavailable');

      setUploading(true);

      const fileUrl = await cloudinaryUpload(file)
      const encrypted = await encryptData(fileUrl, masterKey);
      const dataObj = {
        type: 'file',
        filename: file.name,
        title: title.trim(),
        data: encrypted.data,
        iv: encrypted.iv,
      }

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/vault`,
        dataObj
        ,
        { withCredentials: true }
      );
      const result = await res.data;
      if (!(res.status === 200 || res.status === 201)) throw new Error(result.error || 'Save failed');

      const newItem: FileItem = { id: result.id, title, url: fileUrl };
      setItems((prev) => [newItem, ...prev]);
      setTitle('');
      setFile(null);
      setSuccessMessage('File saved securely');
      clearNotice();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };



  const handleDownload = (item: FileItem) => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.title;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <main className="min-h-screen bg-[#0b0f17] text-white">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .fade-up { animation: fadeUp .5s ease-out both; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-0 -right-40 h-[380px] w-[380px] rounded-full bg-cyan-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-8 py-10 flex flex-col gap-10">
        <header className="fade-up flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-blue-400">
              <ShieldCheck size={14} /> Files
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold mt-2">Saved Files</h1>
            <p className="text-sm text-white/60 mt-2">File URLs are encrypted before storage.</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/60">
            {items.length} {items.length === 1 ? 'file' : 'files'}
          </div>
        </header>

        <section
          className="fade-up rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8"
          style={{ animationDelay: '60ms' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300">
                <FileUp size={16} />
              </div>
              <h2 className="text-lg font-medium">Add File Entry</h2>
            </div>
            {successMessage && (
              <span className="fade-up text-xs px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-200">
                {successMessage}
              </span>
            )}
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs uppercase tracking-wider text-white/50">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resume, invoice..."
                className="mt-1 w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-white/50">File</label>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) setFile(f);
                }}
                className={`mt-1 flex flex-col items-center justify-center gap-2 px-6 py-10 rounded-xl border-2 border-dashed cursor-pointer transition
                  ${dragOver ? 'border-blue-400/60 bg-blue-500/5' : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/40'}`}
              >
                <UploadCloud size={28} className="text-blue-300" />
                <p className="text-sm text-white/70">
                  {file ? <span className="text-white">{file.name}</span> : 'Drop a file or click to browse'}
                </p>
                <p className="text-xs text-white/40">Encrypted before upload</p>
                <input type="file" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="group relative overflow-hidden rounded-xl py-3 font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition active:scale-[0.99]"
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                <ShieldCheck size={16} />
                {uploading ? 'Uploading…' : 'Save File'}
              </span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>
          </form>

          {error && (
            <div className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2">
              {error}
            </div>
          )}
        </section>

        <section className="fade-up" style={{ animationDelay: '120ms' }}>
          <h2 className="text-lg font-medium mb-4">Stored Files</h2>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-white/50">
              No files saved yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item, i) => (
                <article
                  key={item.id}
                  className="fade-up group relative rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] hover:border-blue-500/30 p-5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start gap-3 mb-5">
                    <div className="grid place-items-center h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/10 border border-blue-500/30 text-blue-200">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-white/40">Title</p>
                      <p className="font-semibold truncate">{item.title}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-blue-600 hover:border-blue-500 transition text-sm font-medium active:scale-[0.98]"
                  >
                    <Download size={16} /> Download
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
