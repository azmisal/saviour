'use client';

import React, { useState, useEffect } from "react";
import { encryptData, decryptData } from "@/lib/crypto";
import { fetchVault } from "@/lib/vaultApi";
import { useRouter } from "next/navigation";

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

  // =========================
  // LOAD + DECRYPT FILES
  // =========================
  useEffect(() => {
    const load = async () => {
      try {
        const masterKey = (window as any).masterKey;
        if (!masterKey) return;
        console.warn("No master key available - redirecting to login");
        router.push('/login');
        return;

        const items = await fetchVault("file");

        const decrypted = await Promise.all(
          items.map(async (item: any) => {
            const url = await decryptData(
              item.data,
              item.iv,
              masterKey
            );

            return {
              id: item._id,
              title: item.title || item.filename,
              url,
            };
          })
        );

        setItems(decrypted);
      } catch (err) {
        console.error("File load error:", err);
      }
    };

    load();
  }, []);

  // =========================
  // UI HELPERS
  // =========================
  const clearNotice = () => {
    window.setTimeout(() => setSuccessMessage(''), 1800);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
  };

  // =========================
  // UPLOAD + SAVE FILE
  // =========================
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      if (!title.trim()) {
        setError('Title is required.');
        return;
      }

      if (!file) {
        setError('File is required.');
        return;
      }

      const masterKey = (window as any).masterKey;

      if (!masterKey) {
        setError('Session expired. Please login again.');
        return;
      }

      // =========================
      // 1. UPLOAD TO CLOUDINARY
      // =========================
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      );

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudData = await cloudRes.json();

      if (!cloudRes.ok) {
        throw new Error("File upload failed");
      }

      const fileUrl = cloudData.secure_url;

      // =========================
      // 2. ENCRYPT URL
      // =========================
      const encrypted = await encryptData(fileUrl, masterKey);

      // =========================
      // 3. SAVE TO BACKEND
      // =========================
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "file",
          filename: file.name,
          title: title.trim(),
          data: encrypted.data,
          iv: encrypted.iv,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Save failed");
      }

      // =========================
      // 4. UPDATE UI
      // =========================
      const newItem: FileItem = {
        id: result.id || crypto.randomUUID(),
        title,
        url: fileUrl,
      };

      setItems((c) => [newItem, ...c]);

      setTitle('');
      setFile(null);

      setSuccessMessage('File saved securely');
      clearNotice();

    } catch (err: any) {
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

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Files</p>
          <h1 className="page-title">Saved files</h1>
          <p className="page-copy">
            Save a title and file securely (encrypted URL stored in database).
          </p>
        </div>
      </header>

      {/* ========================= */}
      {/* UPLOAD FORM */}
      {/* ========================= */}
      <section className="glass-panel page-section p-8">
        <div className="section-heading">
          <h2 className="section-title">Add file entry</h2>
          {successMessage && (
            <span className="notice-pill">{successMessage}</span>
          )}
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resume, invoice, design file"
            />
          </div>

          <div className="form-group">
            <label className="form-label">File</label>
            <input
              type="file"
              className="input-field"
              onChange={handleFileChange}
            />
          </div>

          <button type="submit" className="btn-primary">
            Save file
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
      </section>

      {/* ========================= */}
      {/* FILE LIST */}
      {/* ========================= */}
      <section className="page-section">
        <h2 className="section-title">Stored files</h2>

        <div className="card-grid">
          {items.length === 0 ? (
            <div className="card">
              No files saved yet.
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="card">
                <div className="card-row">
                  <div>
                    <p className="card-label">Title</p>
                    <p className="card-value">{item.title}</p>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => handleDownload(item)}
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