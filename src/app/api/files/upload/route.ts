import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import connectToDatabase from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';

type CloudinaryUploadResult = {
  secure_url: string;
};

function uploadEncryptedFile(buffer: Buffer, filename: string) {
  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'saviour/encrypted',
        filename_override: filename,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }

        resolve({ secure_url: result.secure_url });
      }
    );

    upload.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const filename = formData.get('filename');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const uploadName =
      typeof filename === 'string' && filename.trim()
        ? filename.trim()
        : 'encrypted-file.bin';

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadEncryptedFile(buffer, uploadName);

    return NextResponse.json({
      url: result.secure_url,
    });
  } catch (error) {
    console.error('File upload error:', error);

    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}
