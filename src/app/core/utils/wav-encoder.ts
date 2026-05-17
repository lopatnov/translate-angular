/**
 * Encodes a mono Float32Array of PCM samples as a 16-bit WAV file.
 * Use this when you already have raw PCM (e.g. from an AudioWorklet).
 */
export function encodeWavFromPcm(
  pcm: Float32Array,
  sampleRate: number,
): ArrayBuffer {
  const dataBytes = pcm.length * 2;
  const ab = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(ab);
  const writeAscii = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i++)
      view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataBytes, true);
  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return ab;
}

/**
 * Encodes an AudioBuffer as a 16-bit mono PCM WAV file.
 * All channels are averaged (downmixed to mono). Sample rate is preserved;
 * the backend (NAudio inside WhisperRecognizer) resamples to 16 kHz.
 */
export function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  const numSamples = buffer.length;
  const dataBytes = numSamples * 2; // int16 = 2 bytes per sample

  // Downmix to mono float32 by averaging all channels.
  const mono = new Float32Array(numSamples);
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < numSamples; i++) {
      mono[i] += channelData[i];
    }
  }
  if (numChannels > 1) {
    for (let i = 0; i < numSamples; i++) mono[i] /= numChannels;
  }

  // 44-byte RIFF/WAVE header + int16 PCM body.
  const ab = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(ab);

  const writeAscii = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i++)
      view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true); // chunk size
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM sub-chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate (16-bit mono)
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return ab;
}
