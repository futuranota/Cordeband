/** Minimal silent PCM WAV for mock stem uploads (mono 16-bit). */

function writeWavHeader(
  buffer: Buffer,
  dataSize: number,
  sampleRate: number,
  numChannels = 1,
  bitsPerSample = 16,
) {
  const blockAlign = (numChannels * bitsPerSample) / 8;
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
}

export function createSilentWavBuffer(durationSeconds = 30, sampleRate = 44100): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const numSamples = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);
  writeWavHeader(buffer, dataSize, sampleRate, numChannels, bitsPerSample);
  return buffer;
}

/** Short mono tone WAV for landing demo stems (audible in browser). */
export function createToneWavBuffer(
  durationSeconds = 18,
  frequencyHz = 329.63,
  sampleRate = 44100,
  amplitude = 0.22,
): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const numSamples = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);
  writeWavHeader(buffer, dataSize, sampleRate, numChannels, bitsPerSample);

  const fadeSamples = Math.min(numSamples, Math.floor(sampleRate * 0.08));
  for (let i = 0; i < numSamples; i++) {
    let env = 1;
    if (i < fadeSamples) env = i / fadeSamples;
    else if (i > numSamples - fadeSamples) env = (numSamples - i) / fadeSamples;
    const sample = Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate) * amplitude * env;
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }

  return buffer;
}
