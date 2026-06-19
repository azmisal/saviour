'use client';

import React, { useEffect, useState } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
import { fetchVault } from '@/lib/vaultApi';
import { useCrypto } from '@/contexts/CryptoContext';
import { Eye, EyeOff, KeyRound, Copy, Globe, Mail, User, Lock, ShieldCheck } from 'lucide-react';

type VaultItem = {
  id: string;
  website: string;
  username: string;
  email: string;
  password: string;
  show: boolean;
};

export default function PasswordsPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ website: '', username: '', email: '', password: '' });
  const [msg, setMsg] = useState('');

  const { masterKey } = useCrypto();

  useEffect(() => {
    const loadVault = async () => {
      try {
        if (!masterKey) {
          setMsg('Encryption key unavailable');
          return;
        }
        const vaultItems = await fetchVault('password');
        const decryptedItems: VaultItem[] = await Promise.all(
          vaultItems.map(async (item: any) => {
            const decryptedPassword = await decryptData(item.data, item.iv, masterKey);
            return {
              id: item._id,
              website: item.website || '',
              username: item.username || '',
              email: item.email || '',
              password: decryptedPassword,
              show: false,
            };
          })
        );
        setItems(decryptedItems);
      } catch (err) {
        console.error(err);
        setMsg('Failed to load passwords');
      }
    };
    loadVault();
  }, [masterKey]);

  const addPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMsg('');
      if (!masterKey) return setMsg('Encryption key unavailable');
      if (!form.password.trim()) return setMsg('Password required');
      if (!form.email.trim() && !form.username.trim())
        return setMsg('Username or email required');

      const encrypted = await encryptData(form.password, masterKey);

      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'password',
          website: form.website,
          username: form.username,
          email: form.email,
          data: encrypted.data,
          iv: encrypted.iv,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      const newItem: VaultItem = {
        id: data.id,
        website: form.website,
        username: form.username,
        email: form.email,
        password: form.password,
        show: false,
      };
      setItems((prev) => [newItem, ...prev]);
      setForm({ website: '', username: '', email: '', password: '' });
      setMsg('Saved securely');
      setTimeout(() => setMsg(''), 1500);
    } catch (err: any) {
      console.error(err);
      setMsg(err.message || 'Failed to save');
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMsg('Copied');
      setTimeout(() => setMsg(''), 1000);
    } catch {
      setMsg('Copy failed');
    }
  };

  const toggleShow = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, show: !item.show } : item))
    );
  };

  return (
    <main className="min-h-screen bg-[#0b0f17] text-white">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
        .fade-up { animation: fadeUp .5s ease-out both; }
        .glow-border { background: linear-gradient(135deg, rgba(59,130,246,.4), rgba(59,130,246,0) 60%); }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[380px] w-[380px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-8 py-10 flex flex-col gap-10">
        <header className="fade-up flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-blue-400">
              <ShieldCheck size={14} /> Secure Vault
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold mt-2">Password Manager</h1>
            <p className="text-sm text-white/60 mt-2">
              End-to-end encrypted before it ever leaves your device.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/60">
            {items.length} {items.length === 1 ? 'entry' : 'entries'}
          </div>
        </header>

        <section
          className="fade-up relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8"
          style={{ animationDelay: '60ms' }}
        >
          <div className="absolute inset-x-0 -top-px h-px glow-border" />
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-8 w-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300">
                <KeyRound size={16} />
              </div>
              <h2 className="text-lg font-medium">Add Credential</h2>
            </div>
            {msg && (
              <span className="fade-up text-xs px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-200">
                {msg}
              </span>
            )}
          </div>

          <form onSubmit={addPassword} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field icon={<Globe size={16} />} placeholder="Website" value={form.website}
              onChange={(v) => setForm({ ...form, website: v })} />
            <Field icon={<User size={16} />} placeholder="Username" value={form.username}
              onChange={(v) => setForm({ ...form, username: v })} />
            <Field icon={<Mail size={16} />} placeholder="Email" value={form.email}
              onChange={(v) => setForm({ ...form, email: v })} />

            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-300 transition">
                <Lock size={16} />
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
              >
                {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            <button
              type="submit"
              className="md:col-span-2 group relative overflow-hidden rounded-xl py-3 font-medium bg-blue-600 hover:bg-blue-500 transition active:scale-[0.99]"
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                <ShieldCheck size={16} /> Save Securely
              </span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>
          </form>
        </section>

        <section className="fade-up" style={{ animationDelay: '120ms' }}>
          <h2 className="text-lg font-medium mb-4">Saved Credentials</h2>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-white/50">
              No passwords saved yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item, i) => (
                <article
                  key={item.id}
                  className="fade-up group relative rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] hover:border-blue-500/30 p-5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/10 border border-blue-500/30 text-blue-200 font-semibold">
                        {(item.website || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-white/40">Website</p>
                        <p className="font-semibold truncate">{item.website || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 flex items-center justify-between gap-2 mb-4">
                    <code className="text-sm text-white/90 break-all">
                      {item.show ? item.password : '•'.repeat(Math.min(item.password.length, 14))}
                    </code>
                    <div className="flex gap-1.5 shrink-0">
                      <IconBtn onClick={() => handleCopy(item.password)} label="Copy">
                        <Copy size={14} />
                      </IconBtn>
                      <IconBtn onClick={() => toggleShow(item.id)} label="Toggle">
                        {item.show ? <EyeOff size={14} /> : <Eye size={14} />}
                      </IconBtn>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Meta label="Username" value={item.username} />
                    <Meta label="Email" value={item.email} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ icon, placeholder, value, onChange }:
  { icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative group">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-300 transition">
        {icon}
      </span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
      />
    </div>
  );
}

function IconBtn({ children, onClick, label }:
  { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="h-8 w-8 grid place-items-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/40 text-white/70 hover:text-white transition active:scale-95"
    >
      {children}
    </button>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="truncate text-white/80">{value || '—'}</p>
    </div>
  );
}
