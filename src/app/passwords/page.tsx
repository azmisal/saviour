'use client';

import React, { useEffect, useState } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
import { fetchVault } from '@/lib/vaultApi';
import { useCrypto } from '@/contexts/CryptoContext';
import { Eye, EyeOff } from "lucide-react";

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
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    website: '',
    username: '',
    email: '',
    password: '',
  });

  const [msg, setMsg] = useState('');

  const { masterKey } = useCrypto();

  // =========================
  // LOAD + DECRYPT
  // =========================
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
            const decryptedPassword = await decryptData(
              item.data,
              item.iv,
              masterKey
            );

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

  // =========================
  // SAVE PASSWORD
  // =========================
  const addPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setMsg('');

      if (!masterKey) {
        setMsg('Encryption key unavailable');
        return;
      }

      if (!form.password.trim()) {
        setMsg('Password required');
        return;
      }

      if (!form.email.trim() && !form.username.trim()) {
        setMsg('Username or email required');
        return;
      }

      // 🔐 encrypt password
      const encrypted = await encryptData(
        form.password,
        masterKey
      );

      // 📡 save encrypted data
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!res.ok) {
        throw new Error(data.error || 'Save failed');
      }

      // UI only
      const newItem: VaultItem = {
        id: data.id,
        website: form.website,
        username: form.username,
        email: form.email,
        password: form.password,
        show: false,
      };

      setItems((prev) => [newItem, ...prev]);

      setForm({
        website: '',
        username: '',
        email: '',
        password: '',
      });

      setMsg('Saved securely');

      setTimeout(() => {
        setMsg('');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setMsg(err.message || 'Failed to save');
    }
  };

  // =========================
  // HELPERS
  // =========================
  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);

      setMsg('Copied');

      setTimeout(() => {
        setMsg('');
      }, 1000);

    } catch {
      setMsg('Copy failed');
    }
  };

  const toggleShow = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, show: !item.show }
          : item
      )
    );
  };

  // =========================
  // UI
  // =========================
  return (
    <main className="min-h-screen bg-[#0b0f17] text-white px-4 md:px-10 py-10 flex flex-col gap-8">

      {/* HEADER */}
      <header className="max-w-4xl">
        <p className="text-xs tracking-widest uppercase text-blue-400">
          Secure Vault
        </p>

        <h1 className="text-3xl md:text-4xl font-semibold mt-1">
          Encrypted Password Manager
        </h1>

        <p className="text-sm text-white/60 mt-2">
          Everything is encrypted before storage
        </p>
      </header>

      {/* FORM */}
      <section className="max-w-4xl bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">
            Add Credential
          </h2>

          {msg && (
            <span className="text-xs px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30">
              {msg}
            </span>
          )}
        </div>

        <form
          onSubmit={addPassword}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <input
            placeholder="Website"
            value={form.website}
            onChange={(e) =>
              setForm({
                ...form,
                website: e.target.value,
              })
            }
            className="p-3 rounded-xl bg-black/40 border border-white/10"
          />

          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm({
                ...form,
                username: e.target.value,
              })
            }
            className="p-3 rounded-xl bg-black/40 border border-white/10"
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="p-3 rounded-xl bg-black/40 border border-white/10"
          />

          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              className="w-full p-3 pr-12 rounded-xl bg-black/40 border border-white/10"
            />

            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white"
            >
              {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="md:col-span-2 p-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition"
          >
            Save Securely
          </button>
        </form>
      </section>

      {/* LIST */}
      <section className="max-w-4xl">

        <h2 className="text-lg font-medium mb-4">
          Saved Credentials
        </h2>

        {items.length === 0 ? (
          <p className="text-white/50">
            No passwords saved yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                <div className="mb-3">
                  <p className="text-sm text-white/50">
                    Website
                  </p>

                  <p className="font-semibold">
                    {item.website || '—'}
                  </p>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-white/50">
                    Password
                  </p>

                  <div className="flex justify-between items-center gap-2">

                    <code className="text-sm break-all">
                      {item.show
                        ? item.password
                        : '••••••••'}
                    </code>

                    <div className="flex gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(item.password)
                        }
                        className="px-2 py-1 text-xs rounded-lg border border-white/10"
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleShow(item.id)
                        }
                        className="px-2 py-1 text-xs rounded-lg border border-white/10"
                      >
                        {item.show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>

                    </div>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-white/70">

                  <div>
                    <span className="text-white/40">
                      Username:
                    </span>{' '}
                    {item.username || '—'}
                  </div>

                  <div>
                    <span className="text-white/40">
                      Email:
                    </span>{' '}
                    {item.email || '—'}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
