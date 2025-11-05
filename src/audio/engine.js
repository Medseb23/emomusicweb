export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.node = null;
  }
  async start() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    await this.ctx.audioWorklet.addModule('src/audio/looper-worklet.js');
    this.node = new AudioWorkletNode(this.ctx, 'looper-processor', { outputChannelCount: [2] });
    this.node.connect(this.ctx.destination);
  }
  setState(s) {
    if (this.node) this.node.port.postMessage({ type: 'set-state', state: s });
  }
}