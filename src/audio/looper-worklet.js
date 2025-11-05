class LooperProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sampleRate = sampleRate;
    this.state = 'neutral';
    this.phase = 0;
    this.noteOn = [];
    this.stinger = null;
    this.time = 0;

    this.presets = {
      neutral:  { bpm: 70,  osc: 'sine',     pattern: [ {freqs:[130.81,196.00,261.63], beats:4.0} ] },
      happy:    { bpm: 124, osc: 'square',   pattern: [ {freqs:[261.63,329.63,392.00], beats:0.5},
                                                         {freqs:[392.00,493.88,587.33], beats:0.5},
                                                         {freqs:[440.00,523.25,659.26], beats:0.5},
                                                         {freqs:[349.23,440.00,523.25], beats:0.5} ] },
      sad:      { bpm: 68,  osc: 'sine',     pattern: [ {freqs:[220.00,261.63,329.63], beats:2.0},
                                                         {freqs:[196.00,246.94,293.66], beats:2.0} ] },
      angry:    { bpm: 112, osc: 'sawtooth', pattern: [ {freqs:[82.41], beats:0.25}, {freqs:[87.31], beats:0.25},
                                                         {freqs:[98.00], beats:0.25}, {freqs:[110.00],beats:0.25},
                                                         {freqs:[82.41], beats:0.25}, {freqs:[87.31], beats:0.25},
                                                         {freqs:[98.00], beats:0.25}, {freqs:[116.54],beats:0.25} ] },
      fear:     { bpm: 60,  osc: 'triangle', pattern: [ {freqs:[130.81,184.99], beats:1.5},
                                                         {freqs:[123.47,174.61], beats:1.5} ] },
      surprise: { bpm: 140, osc: 'square',   pattern: [ {freqs:[261.63], beats:0.25}, {freqs:[311.13], beats:0.25},
                                                         {freqs:[392.00], beats:0.25}, {freqs:[493.88], beats:0.25},
                                                         {freqs:[], beats:0.25} ] },
      disgust:  { bpm: 98,  osc: 'sawtooth', pattern: [ {freqs:[146.83,174.61], beats:0.5},
                                                         {freqs:[130.81,155.56], beats:0.5} ] }
    };
    this.stepIndex = 0;
    this.samplesLeftInStep = this._stepSamples(this.presets[this.state], 0);

    this.port.onmessage = (e) => {
      const { type, state } = e.data || {};
      if (type === 'set-state') {
        if (state && state !== this.state) {
          this.state = state;
          this.stepIndex = 0;
          const st = this._stingerFor(state);
          this.stinger = { freqs: st.freqs, samples: Math.floor(0.10 * this.sampleRate), gain: 0.6 };
        }
      }
    };
  }

  _stingerFor(s) {
    const map = {
      happy:    {freqs:[1046.50,1318.51,1567.98]},
      sad:      {freqs:[220.00,261.63,329.63]},
      angry:    {freqs:[196.00]},
      fear:     {freqs:[185.00]},
      surprise: {freqs:[987.77]},
      disgust:  {freqs:[155.56,185.00]},
      neutral:  {freqs:[440.00]}
    };
    return map[s] || map['neutral'];
  }

  _stepSamples(preset, idx){
    const beats = preset.pattern[idx].beats;
    const spb = 60 / preset.bpm;
    return Math.max(1, Math.floor((spb * beats) * this.sampleRate));
  }

  _wave(osc, phase){
    switch(osc){
      case 'square': return phase < 0.5 ? 1 : -1;
      case 'sawtooth': return 2*(phase - Math.floor(phase + 0.5));
      case 'triangle': return 1 - 4*Math.abs(Math.round(phase - 0.25) - (phase - 0.25));
      default: return Math.sin(2*Math.PI*phase);
    }
  }

  process(inputs, outputs) {
    const outL = outputs[0][0];
    const outR = outputs[0][1] || outputs[0][0];
    const preset = this.presets[this.state];
    const osc = preset.osc;

    for (let i=0;i<outL.length;i++) {
      let sample = 0;

      if (this.stinger && this.stinger.samples > 0) {
        for (const f of this.stinger.freqs) {
          const ph = (this.time * f) % 1;
          sample += this._wave('sine', ph) * this.stinger.gain;
        }
        this.stinger.samples--;
      } else {
        const step = preset.pattern[this.stepIndex];
        for (const f of step.freqs) {
          const ph = (this.time * f) % 1;
          sample += this._wave(osc, ph) * 0.35;
        }
        this.samplesLeftInStep--;
        if (this.samplesLeftInStep <= 0) {
          this.stepIndex = (this.stepIndex + 1) % preset.pattern.length;
          this.samplesLeftInStep = this._stepSamples(preset, this.stepIndex);
        }
      }

      outL[i] = sample;
      outR[i] = sample;
      this.time += 1/this.sampleRate;
    }
    return true;
  }
}

registerProcessor('looper-processor', LooperProcessor);