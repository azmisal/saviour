'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { deriveKey } from '@/lib/crypto';

import {
  saveCryptoKey,
  getCryptoKey,
  clearCryptoKey,
} from '@/lib/cryptoStorage';

type CryptoContextType = {
  salt: string | null;
  masterKey: CryptoKey | null;

  setSalt: (salt: string) => void;

  initCrypto: (
    password: string,
    salt: string
  ) => Promise<void>;

  restoreCrypto: () => Promise<boolean>;

  clearCrypto: () => Promise<void>;

  getKey: () => CryptoKey | null;
};

const CryptoContext =
  createContext<CryptoContextType | null>(null);

export function CryptoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [salt, setSaltState] =
    useState<string | null>(null);

  const [masterKey, setMasterKey] =
    useState<CryptoKey | null>(null);

  /**
   * LOGIN
   */
  const initCrypto = async (
    password: string,
    saltValue: string
  ) => {
    try {
      const key = await deriveKey(
        password,
        saltValue
      );

      setSaltState(saltValue);

      setMasterKey(key);

      await saveCryptoKey(key);

    } catch (err) {
      console.error('Crypto init failed:', err);

      throw new Error(
        'Failed to initialize encryption'
      );
    }
  };

  /**
   * RESTORE AFTER REFRESH
   */
  const restoreCrypto = async (): Promise<boolean> => {
    try {
      const storedKey = await getCryptoKey();

      if (!storedKey) {
        return false;
      }

      setMasterKey(storedKey);

      return true;

    } catch (err) {
      console.error('Restore crypto failed:', err);

      return false;
    }
  };

  /**
   * GET KEY
   */
  const getKey = () => {
    return masterKey;
  };

  /**
   * LOGOUT
   */
  const clearCrypto = async () => {
    setSaltState(null);

    setMasterKey(null);

    await clearCryptoKey();
  };

  return (
    <CryptoContext.Provider
      value={{
        salt,
        masterKey,
        setSalt: setSaltState,
        initCrypto,
        restoreCrypto,
        clearCrypto,
        getKey,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const ctx = useContext(CryptoContext);

  if (!ctx) {
    throw new Error(
      'useCrypto must be used inside CryptoProvider'
    );
  }

  return ctx;
}