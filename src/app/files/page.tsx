'use client';

import React, { useEffect, useState } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
import { fetchVault } from '@/lib/vaultApi';
import { useRouter } from 'next/navigation';
import { useCrypto } from '@/contexts/CryptoContext';

type FileItem = {
  id: string;
  title: string;
  url: string;
};

export default function FilesPage() {
  const [items, setItems] = useState<FileItem[]>([]);

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  const { masterKey } = useCrypto();

  // =========================
  // LOAD + DECRYPT FILES
  // =========================
  useEffect(() => {
    const loadFiles = async () => {
      try {
        if (!masterKey) {
          return;
        }

        const vaultItems = await fetchVault('file');

        const decryptedItems: FileItem[] = await Promise.all(
          vaultItems.map(async (item: any) => {
            const decryptedUrl = await decryptData(
              item.data,
              item.iv,
              masterKey
            );

            return {
              id: item._id,
              title: item.title || item.filename,
              url: decryptedUrl,
            };
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

  // =========================
  // HELPERS
  // =========================
  const clearNotice = () => {
    setTimeout(() => {
      setSuccessMessage('');
    }, 1800);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
  };

  // =========================
  // UPLOAD + SAVE FILE
  // =========================
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setError('');

      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      if (!file) {
        setError('File is required');
        return;
      }

      if (!masterKey) {
        setError('Encryption unavailable');
        return;
      }

      // =========================
      // 1. UPLOAD TO CLOUDINARY
      // =========================
      const uploadData = new FormData();

      uploadData.append('file', file);

      uploadData.append(
        'upload_preset',
        process.env
          .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      );

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: uploadData,
        }
      );

      const cloudData = await cloudRes.json();

      if (!cloudRes.ok) {
        throw new Error('File upload failed');
      }

      const fileUrl = cloudData.secure_url;

      // =========================
      // 2. ENCRYPT FILE URL
      // =========================
      const encrypted = await encryptData(
        fileUrl,
        masterKey
      );

      // =========================
      // 3. SAVE ENCRYPTED DATA
      // =========================
      const res = await fetch('/api/vault', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        credentials: 'include',

        body: JSON.stringify({
          type: 'file',

          filename: file.name,
          title: title.trim(),

          data: encrypted.data,
          iv: encrypted.iv,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Save failed');
      }

      // =========================
      // 4. UPDATE UI
      // =========================
      const newItem: FileItem = {
        id: result.id,
        title,
        url: fileUrl,
      };

      setItems((prev) => [newItem, ...prev]);

      setTitle('');
      setFile(null);

      setSuccessMessage('File saved securely');

      clearNotice();

    } catch (err: any) {
      console.error(err);

      setError(err.message || 'Upload failed');
    }
  };

  // =========================
  // DOWNLOAD FILE
  // =========================
  const handleDownload = (item: FileItem) => {
    const link = document.createElement('a');

    link.href = item.url;
    link.download = item.title;

    document.body.appendChild(link);

    link.click();

    link.remove();
  };

  // =========================
  // UI
  // =========================
  return (
    <main className="page-shell">

      <header className="page-header">
        <div>
          <p className="eyebrow">
            Files
          </p>

          <h1 className="page-title">
            Saved files
          </h1>

          <p className="page-copy">
            File URLs are encrypted before storage
          </p>
        </div>
      </header>

      {/* FORM */}
      <section className="glass-panel page-section p-8">

        <div className="section-heading">

          <h2 className="section-title">
            Add file entry
          </h2>

          {successMessage && (
            <span className="notice-pill">
              {successMessage}
            </span>
          )}
        </div>

        <form
          className="form-grid"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label className="form-label">
              Title
            </label>

            <input
              type="text"
              className="input-field"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Resume, invoice..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              File
            </label>

            <input
              type="file"
              className="input-field"
              onChange={handleFileChange}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
          >
            Save file
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </section>

      {/* FILE LIST */}
      <section className="page-section">

        <h2 className="section-title">
          Stored files
        </h2>

        <div className="card-grid">

          {items.length === 0 ? (
            <div className="card">
              No files saved yet.
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="card"
              >
                <div className="card-row">
                  <div>
                    <p className="card-label">
                      Title
                    </p>

                    <p className="card-value">
                      {item.title}
                    </p>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      handleDownload(item)
                    }
                  >
                    Download
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
