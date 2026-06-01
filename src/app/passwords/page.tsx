'use client';

import React, { useState, useEffect } from "react";
import { encryptData, decryptData } from "@/lib/crypto";
import { fetchVault } from "@/lib/vaultApi";

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
  const [form, setForm] = useState({
    website: "",
    username: "",
    email: "",
    password: ""
  });
  const [msg, setMsg] = useState("");

  // =========================
  // LOAD + DECRYPT
  // =========================
  useEffect(() => {
    const load = async () => {
      try {
        const masterKey = (window as any).masterKey;
        if (!masterKey) {
          console.warn("No master key available");
          return;
        }

        const items = await fetchVault("password");

        const decrypted: VaultItem[] = await Promise.all(
          items.map(async (item: any) => {
            const password = await decryptData(
              item.data,
              item.iv,
              masterKey
            );

            return {
              id: item._id,
              website: item.website,
              username: item.username,
              email: item.email,
              password,
              show: false,
            };
          })
        );

        setItems(decrypted);

      } catch (err) {
        console.error("Vault load error:", err);
        setMsg("Failed to load vault");
      }
    };

    load();
  }, []);

  // =========================
  // ADD CREDENTIAL
  // =========================
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    try {
      if (!form.password.trim()) return setMsg("Password required");
      if (!form.email.trim() && !form.username.trim())
        return setMsg("Provide email or username");

      const masterKey = (window as any).masterKey;

      if (!masterKey) {
        setMsg("Session expired. Please login again.");
        return;
      }

      const encrypted = await encryptData(form.password, masterKey);

      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "password",
          website: form.website,
          username: form.username,
          email: form.email,
          data: encrypted.data,
          iv: encrypted.iv,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      const newItem: VaultItem = {
        id: data.id || crypto.randomUUID(),
        website: form.website,
        username: form.username,
        email: form.email,
        password: form.password, // UI only (not stored anywhere)
        show: false,
      };

      setItems((s) => [newItem, ...s]);

      setForm({ website: "", username: "", email: "", password: "" });

      setMsg("Saved securely");
      setTimeout(() => setMsg(""), 1500);

    } catch (err: any) {
      setMsg(err.message || "Error saving credential");
    }
  };

  // =========================
  // HELPERS
  // =========================
  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMsg("Copied");
      setTimeout(() => setMsg(""), 1200);
    } catch {
      setMsg("Copy failed");
      setTimeout(() => setMsg(""), 1200);
    }
  };

  const toggleShow = (id: string) => {
    setItems((s) =>
      s.map((it) =>
        it.id === id ? { ...it, show: !it.show } : it
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
          All credentials are encrypted on your device before storage
        </p>
      </header>

      {/* FORM */}
      <section className="max-w-4xl bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Add Credential</h2>
          {msg && (
            <span className="text-xs px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/30">
              {msg}
            </span>
          )}
        </div>

        <form
          onSubmit={add}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <input
            placeholder="Website"
            value={form.website}
            onChange={(e) =>
              setForm({ ...form, website: e.target.value })
            }
            className="p-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-blue-500"
          />

          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            className="p-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-blue-500"
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="p-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="p-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="md:col-span-2 p-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-medium"
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
          <p className="text-white/50">No credentials saved yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((it) => (
              <div
                key={it.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                {/* WEBSITE */}
                <div className="mb-3">
                  <p className="text-sm text-white/50">Website</p>
                  <p className="font-semibold">
                    {it.website || "—"}
                  </p>
                </div>

                {/* PASSWORD */}
                <div className="mb-3">
                  <p className="text-sm text-white/50">Password</p>

                  <div className="flex justify-between items-center gap-2">
                    <code className="text-sm break-all">
                      {it.show ? it.password : "••••••••••"}
                    </code>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(it.password)}
                        className="px-2 py-1 text-xs rounded-lg border border-white/10 hover:bg-white/10"
                      >
                        Copy
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleShow(it.id)}
                        className="px-2 py-1 text-xs rounded-lg border border-white/10 hover:bg-white/10"
                      >
                        {it.show ? "Hide" : "View"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* META */}
                <div className="grid gap-2 text-sm text-white/70">
                  <div>
                    <span className="text-white/40">Username: </span>
                    {it.username || "—"}
                  </div>
                  <div>
                    <span className="text-white/40">Email: </span>
                    {it.email || "—"}
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