type VaultType = 'password' | 'text' | 'file';

interface Vault {
  userId: string;
  type: VaultType;

  // metadata (depends on type)
  website?: string;
  username?: string;
  email?: string;
  title?: string;
  filename?: string;

  // encrypted payload
  data: string;

  // IV for decryption
  iv: number[];

  createdAt: Date;
}