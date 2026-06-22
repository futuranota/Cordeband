export const MAX_FEATURED_AUDIO_BYTES = 100 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const SIGNATURE_BYTES = 16;

async function readHeader(file: Blob): Promise<Uint8Array> {
  const slice = file.slice(0, SIGNATURE_BYTES);
  const buf = await slice.arrayBuffer();
  return new Uint8Array(buf);
}

function startsWith(header: Uint8Array, bytes: number[], offset = 0): boolean {
  if (header.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (header[offset + i] !== bytes[i]) return false;
  }
  return true;
}

export function isAudioSignature(header: Uint8Array): boolean {
  // MP3 with ID3v2 tag: "ID3"
  if (startsWith(header, [0x49, 0x44, 0x33])) return true;
  // MP3 frame sync: 0xFF followed by 0xFB / 0xF3 / 0xF2 / 0xFA / 0xE3 (common MPEG audio)
  if (header[0] === 0xff) {
    const b1 = header[1];
    if (b1 === 0xfb || b1 === 0xf3 || b1 === 0xf2 || b1 === 0xfa || b1 === 0xe3) return true;
  }
  // WAV: "RIFF" .... "WAVE"
  if (
    startsWith(header, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(header, [0x57, 0x41, 0x56, 0x45], 8)
  ) {
    return true;
  }
  // FLAC: "fLaC"
  if (startsWith(header, [0x66, 0x4c, 0x61, 0x43])) return true;
  return false;
}

export function isImageSignature(header: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (startsWith(header, [0xff, 0xd8, 0xff])) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return true;
  // WEBP: "RIFF" .... "WEBP"
  if (
    startsWith(header, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(header, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return true;
  }
  // GIF: "GIF87a" or "GIF89a"
  if (startsWith(header, [0x47, 0x49, 0x46, 0x38])) {
    const b4 = header[4];
    if ((b4 === 0x37 || b4 === 0x39) && header[5] === 0x61) return true;
  }
  return false;
}

export type UploadKind = 'audio' | 'image';

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function validateUpload(
  file: File,
  options: { kind: UploadKind; maxBytes: number },
): Promise<UploadValidationResult> {
  if (file.size === 0) {
    return { ok: false, error: 'File is empty', status: 400 };
  }
  if (file.size > options.maxBytes) {
    const mb = Math.round(options.maxBytes / (1024 * 1024));
    return { ok: false, error: `File exceeds ${mb} MB limit`, status: 413 };
  }
  const header = await readHeader(file);
  const valid =
    options.kind === 'audio' ? isAudioSignature(header) : isImageSignature(header);
  if (!valid) {
    return {
      ok: false,
      error: options.kind === 'audio' ? 'Unsupported audio format' : 'Unsupported image format',
      status: 400,
    };
  }
  return { ok: true };
}
