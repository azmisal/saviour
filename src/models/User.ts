import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  salt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    salt: {
      type: String,
      required: true, // Don't return salt by default
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in development
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
