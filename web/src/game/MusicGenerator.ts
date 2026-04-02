/**
 * Procedural music generator inspired by the Baldi's Basics school theme.
 * The original is a cheerful, repetitive chiptune-style loop.
 * This recreates a similar vibe using Web Audio oscillators.
 */

type NoteSchedule = { freq: number; start: number; duration: number };

// C major / cheerful melody (frequencies in Hz)
const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00;
const A4 = 440.00, B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25;
const G3 = 196.00, C3 = 130.81, F3 = 174.61, A3 = 220.00;

const BPM = 140;
const BEAT = 60 / BPM;

function b(beat: number): number { return beat * BEAT; }

// Cheerful school melody pattern (2 bars repeated)
const MELODY: NoteSchedule[] = [
  { freq: C5,  start: b(0),    duration: b(0.5) },
  { freq: E5,  start: b(0.5),  duration: b(0.5) },
  { freq: D5,  start: b(1),    duration: b(0.5) },
  { freq: C5,  start: b(1.5),  duration: b(0.5) },
  { freq: G4,  start: b(2),    duration: b(1)   },
  { freq: A4,  start: b(3),    duration: b(0.5) },
  { freq: G4,  start: b(3.5),  duration: b(0.5) },

  { freq: E4,  start: b(4),    duration: b(0.5) },
  { freq: G4,  start: b(4.5),  duration: b(0.5) },
  { freq: A4,  start: b(5),    duration: b(0.5) },
  { freq: G4,  start: b(5.5),  duration: b(0.5) },
  { freq: E4,  start: b(6),    duration: b(1)   },
  { freq: D4,  start: b(7),    duration: b(0.5) },
  { freq: C4,  start: b(7.5),  duration: b(0.5) },
];

// Simple bass line
const BASS: NoteSchedule[] = [
  { freq: C3,  start: b(0),  duration: b(2) },
  { freq: G3,  start: b(2),  duration: b(2) },
  { freq: F3,  start: b(4),  duration: b(2) },
  { freq: C3,  start: b(6),  duration: b(1) },
  { freq: G3,  start: b(7),  duration: b(1) },
];

const LOOP_DURATION = b(8);

export class MusicPlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private playing = false;
  private nextLoopTime = 0;
  private intervalId: number | null = null;

  start() {
    if (this.playing) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.15;
    this.masterGain.connect(this.ctx.destination);
    this.playing = true;

    this.nextLoopTime = this.ctx.currentTime + 0.1;
    this.scheduleLoop();

    this.intervalId = window.setInterval(() => {
      if (this.playing) this.scheduleLoop();
    }, (LOOP_DURATION * 1000) / 2);
  }

  stop() {
    this.playing = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }

  setVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  suspend() {
    this.ctx?.suspend();
  }

  resume() {
    this.ctx?.resume();
  }

  private scheduleLoop() {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Schedule ahead if next loop is within 2 seconds
    while (this.nextLoopTime < now + 2) {
      this.scheduleMelody(this.nextLoopTime);
      this.scheduleBass(this.nextLoopTime);
      this.schedulePercussion(this.nextLoopTime);
      this.nextLoopTime += LOOP_DURATION;
    }
  }

  private scheduleMelody(offset: number) {
    if (!this.ctx || !this.masterGain) return;
    for (const note of MELODY) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = note.freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, offset + note.start);
      gain.gain.exponentialRampToValueAtTime(0.01, offset + note.start + note.duration * 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(offset + note.start);
      osc.stop(offset + note.start + note.duration);
    }
  }

  private scheduleBass(offset: number) {
    if (!this.ctx || !this.masterGain) return;
    for (const note of BASS) {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = note.freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, offset + note.start);
      gain.gain.exponentialRampToValueAtTime(0.01, offset + note.start + note.duration * 0.95);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(offset + note.start);
      osc.stop(offset + note.start + note.duration);
    }
  }

  private schedulePercussion(offset: number) {
    if (!this.ctx || !this.masterGain) return;
    // Simple hi-hat style noise on every beat
    for (let i = 0; i < 8; i++) {
      const time = offset + b(i);

      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * 0.3;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      // Highpass to make it tinny
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      source.start(time);
      source.stop(time + 0.05);
    }
  }
}

/** Spooky ambient drone for after spoop mode activates */
export class SpookyMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscs: OscillatorNode[] = [];
  private playing = false;

  start() {
    if (this.playing) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.1;
    this.masterGain.connect(this.ctx.destination);
    this.playing = true;

    // Low drone
    const drone = this.ctx.createOscillator();
    drone.type = 'sawtooth';
    drone.frequency.value = 55;
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.2;
    drone.connect(droneGain);
    droneGain.connect(this.masterGain);
    drone.start();
    this.oscs.push(drone);

    // Dissonant high tone
    const high = this.ctx.createOscillator();
    high.type = 'sine';
    high.frequency.value = 466.16; // Bb4 - unsettling
    const highGain = this.ctx.createGain();
    highGain.gain.value = 0.05;
    high.connect(highGain);
    highGain.connect(this.masterGain);
    high.start();
    this.oscs.push(high);

    // Slow LFO wobble on the drone
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 10;
    lfo.connect(lfoGain);
    lfoGain.connect(drone.frequency);
    lfo.start();
    this.oscs.push(lfo);
  }

  stop() {
    this.playing = false;
    for (const osc of this.oscs) {
      osc.stop();
    }
    this.oscs = [];
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }

  suspend() {
    this.ctx?.suspend();
  }

  resume() {
    this.ctx?.resume();
  }
}
