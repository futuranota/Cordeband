import { describe, expect, it } from 'vitest';
import {
  isAudioSignature,
  isImageSignature,
  MAX_IMAGE_BYTES,
  validateUpload,
} from '@/lib/upload-validation';

function fileFrom(bytes: number[], { name = 'f.bin', type = '', pad = 0 } = {}): File {
  const padding = new Uint8Array(pad);
  const buf = new Uint8Array([...bytes, ...padding]);
  return new File([buf], name, { type });
}

describe('isAudioSignature', () => {
  it('accepts MP3 with ID3 tag', () => {
    expect(isAudioSignature(new Uint8Array([0x49, 0x44, 0x33, 0x04, 0, 0, 0, 0]))).toBe(true);
  });

  it('accepts MP3 with bare frame sync', () => {
    expect(isAudioSignature(new Uint8Array([0xff, 0xfb, 0x90, 0x44]))).toBe(true);
  });

  it('accepts WAV', () => {
    expect(
      isAudioSignature(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45,
        ]),
      ),
    ).toBe(true);
  });

  it('accepts FLAC', () => {
    expect(isAudioSignature(new Uint8Array([0x66, 0x4c, 0x61, 0x43, 0, 0, 0, 0]))).toBe(true);
  });

  it('rejects random bytes', () => {
    expect(isAudioSignature(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]))).toBe(false);
  });

  it('rejects PNG header', () => {
    expect(isAudioSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
  });
});

describe('isImageSignature', () => {
  it('accepts JPEG', () => {
    expect(isImageSignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
  });

  it('accepts PNG', () => {
    expect(
      isImageSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe(true);
  });

  it('accepts WEBP', () => {
    expect(
      isImageSignature(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
        ]),
      ),
    ).toBe(true);
  });

  it('accepts GIF89a', () => {
    expect(
      isImageSignature(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0])),
    ).toBe(true);
  });

  it('rejects MP3 ID3 header', () => {
    expect(isImageSignature(new Uint8Array([0x49, 0x44, 0x33, 0x04]))).toBe(false);
  });
});

describe('validateUpload', () => {
  it('rejects empty file', async () => {
    const f = new File([], 'x.mp3', { type: 'audio/mpeg' });
    const r = await validateUpload(f, { kind: 'audio', maxBytes: 1024 });
    expect(r.ok).toBe(false);
  });

  it('rejects files larger than max', async () => {
    const f = fileFrom([0x49, 0x44, 0x33], { pad: 2048 });
    const r = await validateUpload(f, { kind: 'audio', maxBytes: 1024 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(413);
  });

  it('rejects audio with image content', async () => {
    const f = fileFrom([0x89, 0x50, 0x4e, 0x47], { name: 'fake.mp3', type: 'audio/mpeg' });
    const r = await validateUpload(f, { kind: 'audio', maxBytes: 1024 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/audio/i);
  });

  it('accepts valid MP3', async () => {
    const f = fileFrom([0x49, 0x44, 0x33, 0x04, 0, 0, 0, 0], { pad: 32 });
    const r = await validateUpload(f, { kind: 'audio', maxBytes: 4096 });
    expect(r.ok).toBe(true);
  });

  it('accepts valid PNG under image cap', async () => {
    const f = fileFrom([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], { pad: 32 });
    const r = await validateUpload(f, { kind: 'image', maxBytes: MAX_IMAGE_BYTES });
    expect(r.ok).toBe(true);
  });
});
