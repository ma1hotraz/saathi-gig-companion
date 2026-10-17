import { LIMITS } from '@shared/api';

const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.85;

export type FileCheck = 'ok' | 'type' | 'size';

/** Client-side pre-check so the worker gets a fast message; the server validates again. */
export function checkFile(file: File): FileCheck {
  if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) return 'type';
  if (file.size > LIMITS.uploadBytes) return 'size';
  return 'ok';
}

/** Downscales photos to 1600px / JPEG 0.85. PDFs, and images the browser cannot decode, are sent as they are. */
export async function prepareFile(file: File): Promise<{ blob: Blob; filename: string }> {
  if (!file.type.startsWith('image/')) return { blob: file, filename: file.name };
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return { blob: file, filename: file.name };
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) return { blob: file, filename: file.name };
    return { blob, filename: file.name.replace(/\.[^.]+$/, '') + '.jpg' };
  } catch {
    return { blob: file, filename: file.name };
  }
}
