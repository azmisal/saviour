'use client';

import React, { useState, useEffect } from "react";
import { encryptData, decryptData } from "@/lib/crypto";
import { fetchVault } from "@/lib/vaultApi";
import { useRouter } from "next/navigation";
import { useCrypto } from "@/contexts/CryptoContext";

type TextItem = {
  id: string;
  title: string;
  text: string;
};

export default function TextPage() {
  const [items, setItems] = useState<TextItem[]>([]);
  const [form, setForm] = useState({
    title: '',
    text: ''
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();

  const { masterKey } = useCrypto();

  // =========================
  // LOAD + DECRYPT TEXTS
  // =========================
  useEffect(() => {
    const load = async () => {
      try {

        if (!masterKey) {
          router.push('/login');
          return;
        }

        const items = await fetchVault("text");

        const decrypted = await Promise.all(
          items.map(async (item: any) => {

            const text = await decryptData(
              item.data,
              item.iv,
              masterKey
            );

            return {
              id: item._id,
              title: item.title,
              text,
            };
          })
        );

        setItems(decrypted);

      } catch (err) {
        console.error("Text load error:", err);
      }
    };

    load();
  }, [masterKey]);

  // =========================
  // UI HELPERS
  // =========================
  const clearNotice = () => {
    window.setTimeout(() => setSuccessMessage(''), 1800);
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);

      setSuccessMessage('Text copied to clipboard');

      clearNotice();

    } catch {

      setSuccessMessage('Unable to copy text');

      clearNotice();
    }
  };

  // =========================
  // SAVE TEXT
  // =========================
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();

    setError('');

    try {

      if (!form.title.trim() || !form.text.trim()) {
        setError('Both title and text are required.');
        return;
      }

      if (!masterKey) {
        setError('Session expired. Please login again.');
        return;
      }

      // =========================
      // ENCRYPT TEXT
      // =========================
      const encrypted = await encryptData(
        form.text,
        masterKey
      );

      // =========================
      // SAVE TO BACKEND
      // =========================
      const res = await fetch('/api/vault', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        credentials: 'include',

        body: JSON.stringify({
          type: 'text',
          title: form.title.trim(),
          data: encrypted.data,
          iv: encrypted.iv,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error || 'Failed to save text'
        );
      }

      // =========================
      // UPDATE UI
      // =========================
      const newItem: TextItem = {
        id: result.id || crypto.randomUUID(),
        title: form.title.trim(),
        text: form.text.trim(),
      };

      setItems((prev) => [newItem, ...prev]);

      setForm({
        title: '',
        text: ''
      });

      setSuccessMessage('Text saved securely');

      clearNotice();

    } catch (err: any) {

      setError(
        err.message || 'Error saving text'
      );
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <main className="page-shell">

      <header className="page-header">
        <div>
          <p className="eyebrow">Text</p>

          <h1 className="page-title">
            Saved text entries
          </h1>

          <p className="page-copy">
            Store encrypted notes securely in your vault.
          </p>
        </div>
      </header>

      {/* ========================= */}
      {/* ADD TEXT */}
      {/* ========================= */}
      <section className="glass-panel page-section p-8">

        <div className="section-heading">

          <h2 className="section-title">
            Add text entry
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

          <input
            placeholder="Title"

            value={form.title}

            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value
              })
            }
          />

          <textarea
            rows={5}

            placeholder="Write your text"

            value={form.text}

            onChange={(e) =>
              setForm({
                ...form,
                text: e.target.value
              })
            }
          />

          <button
            type="submit"
            className="btn-primary"
          >
            Save text
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </section>

      {/* ========================= */}
      {/* LIST TEXTS */}
      {/* ========================= */}
      <section className="page-section">

        <h2 className="section-title">
          Text entries
        </h2>

        <div className="card-grid">

          {items.length === 0 ? (

            <div className="card">
              No text saved yet.
            </div>

          ) : (

            items.map((item) => (

              <article
                key={item.id}
                className="card card-text"
              >

                <div className="card-top-row">

                  <h3 className="card-name">
                    {item.title}
                  </h3>

                  <button
                    className="secondary-btn"

                    onClick={() =>
                      handleCopy(item.text)
                    }
                  >
                    Copy
                  </button>
                </div>

                <p className="card-value">
                  {item.text}
                </p>

              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}