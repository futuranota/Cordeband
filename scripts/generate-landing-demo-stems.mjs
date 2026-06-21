import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/demo/stems');

const instruments = {
  guitar: 329.63,
  piano: 523.25,
  bass: 82.41,
  drums: 220,
  vocals: 440,
  other: 392,
};

function writeWavHeader(buffer, dataSize, sampleRate, numChannels = 1, bitsPerSample = 16) {
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

function createToneWav(durationSeconds, frequencyHz, sampleRate = 44100, amplitude = 0.22) {
  const numSamples = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  writeWavHeader(buffer, dataSize, sampleRate);

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

mkdirSync(outDir, { recursive: true });

for (const [name, freq] of Object.entries(instruments)) {
  const wav = createToneWav(18, freq);
  writeFileSync(join(outDir, `${name}.wav`), wav);
  console.log(`Wrote ${name}.wav`);
}
