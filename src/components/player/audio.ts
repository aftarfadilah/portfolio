// Procedural sound effects for the turntable. Nothing is sampled: every sound
// is synthesised with the Web Audio API, so there is nothing to license or
// download. This layer sits beside the YouTube embed (whose audio can't be
// routed through Web Audio), so "record wear" only adds noise on top of it.

const NOISE_SECONDS = 2;
const POP_VARIANTS = 10;

type AudioContextCtor = typeof AudioContext;

interface BurstOptions {
  at: number;
  duration: number;
  peak: number;
  attack?: number;
  filter?: BiquadFilterType;
  from: number;
  to?: number;
  q?: number;
  out?: AudioNode;
}

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private popBus: GainNode | null = null;
  private hiss: GainNode | null = null;
  private motor: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private pops: AudioBuffer[] = [];

  private wear = 0.35;
  private enabled = true;
  private surfaceOn = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextPop = 0;
  private motorLevel = 0;

  /** Creates (or resumes) the audio context. Call from a user gesture. */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioContextCtor })
          .webkitAudioContext;
      if (!Ctor) return;
      this.build(new Ctor());
    }
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  private build(ctx: AudioContext) {
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = this.enabled ? 0.9 : 0;
    master.connect(ctx.destination);
    this.master = master;

    // One shared noise buffer feeds hiss and every noise burst.
    const length = Math.floor(ctx.sampleRate * NOISE_SECONDS);
    const noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = noise;

    // Short decaying clicks of different lengths for pops and dust.
    for (let n = 0; n < POP_VARIANTS; n++) {
      const len = Math.floor(ctx.sampleRate * (0.0015 + Math.random() * 0.009));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      const sign = Math.random() < 0.5 ? -1 : 1;
      for (let i = 0; i < len; i++) {
        const env = Math.exp((-i / len) * 6);
        d[i] = (i < 3 ? sign : Math.random() * 2 - 1) * env;
      }
      this.pops.push(buf);
    }

    const popBus = ctx.createGain();
    const popHigh = ctx.createBiquadFilter();
    popHigh.type = "highpass";
    popHigh.frequency.value = 900;
    popBus.connect(popHigh).connect(master);
    this.popBus = popBus;

    // Surface hiss: looped noise, band-limited, level follows the wear slider.
    const hissSource = ctx.createBufferSource();
    hissSource.buffer = noise;
    hissSource.loop = true;
    const hissHigh = ctx.createBiquadFilter();
    hissHigh.type = "highpass";
    hissHigh.frequency.value = 2200;
    const hissLow = ctx.createBiquadFilter();
    hissLow.type = "lowpass";
    hissLow.frequency.value = 9000;
    const hiss = ctx.createGain();
    hiss.gain.value = 0;
    hissSource.connect(hissHigh).connect(hissLow).connect(hiss).connect(master);
    hissSource.start();
    this.hiss = hiss;

    // Faint motor hum while the platter turns.
    const motor = ctx.createGain();
    motor.gain.value = 0;
    const motorLow = ctx.createBiquadFilter();
    motorLow.type = "lowpass";
    motorLow.frequency.value = 220;
    for (const freq of [50, 100]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = freq === 50 ? 1 : 0.4;
      osc.connect(g).connect(motorLow);
      osc.start();
    }
    motorLow.connect(motor).connect(master);
    this.motor = motor;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(
        on ? 0.9 : 0,
        this.ctx.currentTime,
        0.05,
      );
    }
  }

  /** Record wear from 0 (clean) to 1 (heavily worn). More wear, more noise. */
  setWear(value: number) {
    this.wear = Math.min(1, Math.max(0, value));
    this.applyHiss();
  }

  /** Platter speed as a 0..1 fraction of full speed. */
  setMotor(level: number) {
    if (!this.ctx || !this.motor) return;
    if (Math.abs(level - this.motorLevel) < 0.02 && level !== 0) return;
    this.motorLevel = level;
    this.motor.gain.setTargetAtTime(0.035 * level, this.ctx.currentTime, 0.2);
  }

  private applyHiss() {
    if (!this.ctx || !this.hiss) return;
    const level = this.surfaceOn ? 0.07 * Math.pow(this.wear, 1.3) : 0;
    this.hiss.gain.setTargetAtTime(level, this.ctx.currentTime, 0.18);
  }

  // Surface noise ------------------------------------------------------

  private startSurface() {
    if (!this.ctx) return;
    this.surfaceOn = true;
    this.nextPop = this.ctx.currentTime + 0.2;
    this.applyHiss();
    if (!this.timer) this.timer = setInterval(() => this.schedulePops(), 100);
  }

  private stopSurface() {
    this.surfaceOn = false;
    this.applyHiss();
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private schedulePops() {
    const ctx = this.ctx;
    if (!ctx || !this.popBus || !this.surfaceOn) return;
    const rate = 60 * Math.pow(this.wear, 1.6); // events per second
    const horizon = ctx.currentTime + 0.25;
    if (rate < 0.2) {
      this.nextPop = horizon;
      return;
    }
    while (this.nextPop < horizon) {
      if (this.nextPop >= ctx.currentTime) {
        // Mostly dust, with the odd loud pop.
        const amp =
          (0.03 + 0.5 * Math.pow(Math.random(), 4)) * (0.35 + this.wear);
        this.pop(this.nextPop, amp);
      }
      this.nextPop += -Math.log(1 - Math.random()) / rate;
    }
  }

  private pop(at: number, amp: number) {
    const ctx = this.ctx;
    if (!ctx || !this.popBus || this.pops.length === 0) return;
    const src = ctx.createBufferSource();
    src.buffer = this.pops[Math.floor(Math.random() * this.pops.length)];
    src.playbackRate.value = 0.7 + Math.random() * 0.8;
    const g = ctx.createGain();
    g.gain.value = amp;
    src.connect(g).connect(this.popBus);
    src.start(at);
  }

  // One-shot building blocks -------------------------------------------

  private burst({
    at,
    duration,
    peak,
    attack = 0.005,
    filter = "bandpass",
    from,
    to = from,
    q = 0.8,
    out,
  }: BurstOptions) {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.master) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, at);
    if (to !== from)
      f.frequency.exponentialRampToValueAtTime(to, at + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    src
      .connect(f)
      .connect(g)
      .connect(out ?? this.master);
    src.start(at, Math.random() * (NOISE_SECONDS - duration - 0.05));
    src.stop(at + duration + 0.05);
  }

  private thunk(
    at: number,
    from: number,
    to: number,
    peak: number,
    dur: number,
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(this.master);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  private ready() {
    return !!(this.ctx && this.master && this.noise && this.enabled);
  }

  // Events -------------------------------------------------------------

  /** The record sliding out of its paper sleeve. */
  sleeveSlide() {
    if (!this.ready() || !this.ctx) return;
    const t = this.ctx.currentTime;
    // The long papery swish, brightening as the disc clears the edge.
    this.burst({
      at: t,
      duration: 0.8,
      peak: 0.16,
      attack: 0.18,
      from: 700,
      to: 3400,
      q: 0.9,
    });
    this.burst({
      at: t + 0.05,
      duration: 0.7,
      peak: 0.05,
      attack: 0.25,
      filter: "highpass",
      from: 5000,
    });
    // A few fibre crackles as the paper flexes.
    for (let n = 0; n < 5; n++) {
      this.burst({
        at: t + 0.08 + Math.random() * 0.6,
        duration: 0.03 + Math.random() * 0.04,
        peak: 0.04 + Math.random() * 0.05,
        from: 2500 + Math.random() * 2500,
        q: 1.5,
      });
    }
  }

  /** The disc settling onto the platter. */
  discPlace() {
    if (!this.ready() || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.thunk(t, 110, 48, 0.22, 0.2);
    this.burst({
      at: t,
      duration: 0.09,
      peak: 0.1,
      filter: "lowpass",
      from: 900,
    });
  }

  /** The stylus touching down: a thunk, a scratch, then surface noise. */
  needleDrop() {
    if (!this.ctx) return;
    this.startSurface();
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    const wear = this.wear;
    this.thunk(t, 150, 60, 0.2, 0.12);
    this.burst({
      at: t + 0.01,
      duration: 0.4,
      peak: 0.1 + 0.3 * wear,
      attack: 0.02,
      from: 3200,
      to: 1400,
      q: 0.7,
    });
    const hits = 3 + Math.round(wear * 9);
    for (let n = 0; n < hits; n++) {
      if (this.popBus)
        this.pop(t + 0.02 + Math.random() * 0.35, 0.3 + Math.random() * 0.6);
    }
  }

  /** The stylus leaving the groove, either lifted by hand or at the end. */
  needleLift() {
    const wasPlaying = this.surfaceOn;
    this.stopSurface();
    if (!wasPlaying || !this.ready() || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.burst({
      at: t,
      duration: 0.24,
      peak: 0.08 + 0.25 * this.wear,
      attack: 0.01,
      from: 1800,
      to: 4200,
      q: 0.7,
    });
    this.thunk(t + 0.03, 120, 70, 0.08, 0.09);
    if (this.popBus) this.pop(t + 0.01, 0.7);
  }

  /** The tonearm settling back on its rest. */
  armRest() {
    if (!this.ready() || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.thunk(t, 190, 90, 0.12, 0.07);
    this.burst({ at: t, duration: 0.025, peak: 0.1, from: 3200, q: 2 });
  }

  /** Stops everything that loops (leaving the page). */
  silence() {
    this.stopSurface();
    this.setMotor(0);
  }
}

export const sfx = new Sfx();
