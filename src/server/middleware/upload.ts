import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { LIMITS } from '../../shared/api.js';
import { HttpError } from '../lib/errors.js';

export interface UploadedFile {
  buffer: Buffer;
  mimeType: string;
}

const DOCUMENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
// MediaRecorder output is detected as video/* for some containers; Gemini needs an audio/* type.
const AUDIO_TYPES = new Map([
  ['audio/webm', 'audio/webm'],
  ['video/webm', 'audio/webm'],
  ['audio/ogg', 'audio/ogg'],
  ['audio/mp4', 'audio/mp4'],
  ['audio/x-m4a', 'audio/mp4'],
  ['video/mp4', 'audio/mp4'],
  ['audio/mpeg', 'audio/mpeg'],
  ['audio/wav', 'audio/wav'],
  ['audio/x-wav', 'audio/wav'],
]);

const memory = multer.memoryStorage();
export const documentUpload = multer({ storage: memory, limits: { fileSize: LIMITS.uploadBytes, files: 1 } });
export const audioUpload = multer({ storage: memory, limits: { fileSize: LIMITS.audioBytes, files: 1 } });

/**
 * Trusts the file's magic bytes, not the client-declared Content-Type, and returns the
 * canonical MIME type. Throws 415 if the content is not an allowed kind.
 */
export async function verifyUpload(
  file: Express.Multer.File | undefined,
  kind: 'document' | 'image' | 'audio',
): Promise<UploadedFile> {
  if (!file) throw new HttpError('bad_request', 'No file was uploaded');
  const detected = await fileTypeFromBuffer(file.buffer);
  const mime = detected?.mime;
  const canonical =
    kind === 'audio'
      ? mime && AUDIO_TYPES.get(mime)
      : mime && (kind === 'image' ? IMAGE_TYPES : DOCUMENT_TYPES).has(mime)
        ? mime
        : undefined;
  if (!canonical) {
    throw new HttpError('unsupported_media', 'This file type is not supported');
  }
  return { buffer: file.buffer, mimeType: canonical };
}
