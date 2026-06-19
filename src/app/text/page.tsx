'use client';

import React, { useState, useEffect } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
import { fetchVault } from '@/lib/vaultApi';
import { useRouter } from 'next/navigation';
import { useCrypto } from '@/contexts/CryptoContext';
import { StickyNote, Copy, ShieldCheck, Plus } from 'lucide-react';

type TextItem = { id: string; title: string; text: string };

export default function TextPage() {
  const [items, setItems] = useState<TextItem[]>([]);
  const [form, setForm] = useState({ title: '', text: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const router = useRouter();
  const { masterKey } = useCrypto();

  useEffect(() => {
    const load = async () => {
      try {
        if (!masterKey) {
          router.push('/login');
          return;
        }
        const items = await fetchVault('text');
        const decrypted = await Promise.all(
          items.map(async (item: any) => {
            const text = await decryptData(item.data, item.iv, masterKey);
            return { id: item._id, title: item.title, text };
          })
        );
        setItems(decrypted);
      } catch (err) {
        console.error('Text load error:', err);
      }
    };
    load();
  }, [masterKey]);

  const clearNotice = () => window.setTimeout(() => setSuccessMessage(''), 1800);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      const encrypted = await encryptData(form.text, masterKey);
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'text',
          title: form.title.trim(),
          data: encrypted.data,
          iv: encrypted.iv,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save text');

      const newItem: TextItem = {
        id: result.id || crypto.randomUUID(),
        title: form.title.trim(),
        text: form.text.trim(),
      };
      setItems((prev) => [newItem, ...prev]);
      setForm({ title: '', text: '' });
      setSuccessMessage('Text saved securely');
      clearNotice();
    } catch (err: any) {
      setError(err.message || 'Error saving text');
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0f17] text-white">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .fade-up { animation: fadeUp .5s ease-out both; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-0 -left-40 h-[380px] w-[380px] rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-8 py-10 flex flex-col gap-10">
        <header className="fade-up flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-blue-400">
              <ShieldCheck size={14} /> Notes
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold mt-2">Saved Text Entries</h1>
            <p className="text-sm text-white/60 mt-2">
              Store encrypted notes securely in your vault.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/60">
            {items.length} {items.length === 1 ? 'note' : 'notes'}
          </div>
        </header>

        <section
          className="fade-up rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8"
          style={{ animationDelay: '60ms' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300">
                <Plus size={16} />
              </div>
              <h2 className="text-lg font-medium">Add Text Entry</h2>
            </div>
            {successMessage && (
              <span className="fade-up text-xs px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-200">
                {successMessage}
              </span>
            )}
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <textarea
              rows={5}
              placeholder="Write your text"
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition resize-y"
            />
            <button
              type="submit"
              className="group relative overflow-hidden rounded-xl py-3 font-medium bg-blue-600 hover:bg-blue-500 transition active:scale-[0.99]"
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                <ShieldCheck size={16} /> Save Text
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
          <h2 className="text-lg font-medium mb-4">Text Entries</h2>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-white/50">
              No text saved yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item, i) => (
                <article
                  key={item.id}
                  className="fade-up group relative rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] hover:border-blue-500/30 p-5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-500/10 border border-blue-500/30 text-blue-200">
                        <StickyNote size={18} />
                      </div>
                      <h3 className="font-semibold truncate">{item.title}</h3>
                    </div>
                    <button
                      onClick={() => handleCopy(item.text)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-white/10 bg-white/5 hover:bg-blue-600 hover:border-blue-500 transition active:scale-95"
                    >
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                  <p className="text-sm text-white/80 whitespace-pre-wrap break-words leading-relaxed">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
