import mongoose, { Schema, Document } from 'mongoose';

export type VaultType = 'password' | 'text' | 'file';

export interface IVault extends Document {
  userId: string;
  type: VaultType;

  // ---------- PASSWORD ----------
  website?: string;
  username?: string;
  email?: string;

  // ---------- TEXT ----------
  title?: string;

  // ---------- FILE ----------
  filename?: string;

  // ---------- ENCRYPTED DATA ----------
  data: string; // encrypted payload (password / text / fileUrl)
  iv: number[];

  createdAt: Date;
  updatedAt: Date;
}

const VaultSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['password', 'text', 'file'],
      required: true,
    },

    website: String,
    username: String,
    email: String,

    title: String,
    filename: String,

    data: {
      type: String,
      required: true,
    },

    iv: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

// Index for fast vault loading per user
VaultSchema.index({ userId: 1, type: 1 });

const Vault =
  mongoose.models.Vault || mongoose.model<IVault>('Vault', VaultSchema);

export default Vault;