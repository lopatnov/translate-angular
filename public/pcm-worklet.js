/**
 * AudioWorklet processor — collects 128-sample PCM frames from the microphone
 * and forwards them to the main thread via the MessagePort.
 * Each postMessage payload is a Float32Array (mono, browser native sample rate).
 *
 * Registered as 'pcm-collector'; loaded with audioContext.audioWorklet.addModule('/pcm-worklet.js').
 */
class PcmCollectorProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel?.length) {
      // slice() copies the typed array — the original is a shared memory view
      // that the browser may reuse before postMessage completes.
      this.port.postMessage(channel.slice());
    }
    return true; // keep the processor alive
  }
}

registerProcessor('pcm-collector', PcmCollectorProcessor);
