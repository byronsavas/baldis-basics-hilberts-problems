/**
 * Music player using the original Baldi's Basics OST audio files.
 */

import { audioSettings } from '../engine/AudioSettings';

export class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private playing = false;
  private baseVolume = 0.5;
  private unsubscribe: (() => void) | null = null;

  start() {
    if (this.playing) return;
    this.audio = new Audio('/audio/Mus_School.wav');
    this.audio.loop = true;
    this.applyVolume();
    this.audio.play().catch(() => {});
    this.playing = true;
    this.unsubscribe = audioSettings.onMusicVolumeChange(() => this.applyVolume());
  }

  stop() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.playing = false;
  }

  setVolume(v: number) {
    this.baseVolume = v;
    this.applyVolume();
  }

  private applyVolume() {
    if (this.audio) this.audio.volume = audioSettings.scaledMusic(this.baseVolume);
  }

  suspend() {
    this.audio?.pause();
  }

  resume() {
    if (this.playing) {
      this.audio?.play().catch(() => {});
    }
  }
}

/** Spooky ambient music for after spoop mode activates (uses Ev5_Loop) */
export class SpookyMusic {
  private audio: HTMLAudioElement | null = null;
  private playing = false;
  private baseVolume = 0.5;
  private unsubscribe: (() => void) | null = null;

  start() {
    if (this.playing) return;
    this.audio = new Audio('/audio/Ev5_Loop.mp3');
    this.audio.loop = true;
    this.applyVolume();
    this.audio.play().catch(() => {});
    this.playing = true;
    this.unsubscribe = audioSettings.onMusicVolumeChange(() => this.applyVolume());
  }

  stop() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.playing = false;
  }

  setVolume(v: number) {
    this.baseVolume = v;
    this.applyVolume();
  }

  private applyVolume() {
    if (this.audio) this.audio.volume = audioSettings.scaledMusic(this.baseVolume);
  }

  suspend() {
    this.audio?.pause();
  }

  resume() {
    if (this.playing) {
      this.audio?.play().catch(() => {});
    }
  }
}

/** One-shot audio helper for sound effects */
export class SFXPlayer {
  private static cache = new Map<string, HTMLAudioElement>();
  private static hilbertQuotes = [
    '/audio/baldi/hilbert-quotes/we-must-know.wav',
    '/audio/baldi/hilbert-quotes/enough-imagination.wav',
    '/audio/baldi/hilbert-quotes/the-infinite.wav',
  ];
  private static quoteAudio: HTMLAudioElement | null = null;
  private static playtimeAudio: HTMLAudioElement | null = null;
  private static learnMusicAudio: HTMLAudioElement | null = null;
  private static correctAnswerAudio: HTMLAudioElement | null = null;
  private static wrongAnswerAudio: HTMLAudioElement | null = null;

  static playPlaytimeMusic(volume = 0.5) {
    this.stopPlaytimeMusic();
    this.playtimeAudio = new Audio('/audio/Mus_Playtime.wav');
    this.playtimeAudio.loop = true;
    this.playtimeAudio.volume = audioSettings.scaledSfx(volume);
    this.playtimeAudio.play().catch(() => {});
  }

  static stopPlaytimeMusic() {
    if (!this.playtimeAudio) return;
    this.playtimeAudio.pause();
    this.playtimeAudio.currentTime = 0;
    this.playtimeAudio = null;
  }

  static play(path: string, volume = 0.5) {
    const audio = new Audio(path);
    audio.volume = audioSettings.scaledSfx(volume);
    audio.play().catch(() => {});
  }

  static playRandomHilbertQuote(volume = 0.7): boolean {
    if (this.quoteAudio && !this.quoteAudio.paused && !this.quoteAudio.ended) {
      return false;
    }

    const path = this.hilbertQuotes[Math.floor(Math.random() * this.hilbertQuotes.length)];
    this.quoteAudio = new Audio(path);
    this.quoteAudio.volume = audioSettings.scaledSfx(volume);
    this.quoteAudio.onended = () => {
      this.quoteAudio = null;
    };
    this.quoteAudio.play().catch(() => {});
    return true;
  }

  static playLearnMusic() {
    this.stopLearnMusic();
    this.learnMusicAudio = new Audio('/audio/LearnNew.wav');
    this.learnMusicAudio.loop = true;
    this.learnMusicAudio.volume = audioSettings.scaledSfx(0.4);
    this.learnMusicAudio.play().catch(() => {});
  }

  static stopLearnMusic() {
    if (!this.learnMusicAudio) return;
    const audio = this.learnMusicAudio;
    this.learnMusicAudio = null;
    audio.loop = false;
    audio.pause();
    audio.currentTime = 0;
  }

  private static playMathStinger(
    slot: 'correctAnswerAudio' | 'wrongAnswerAudio',
    path: string,
    volume: number,
  ) {
    const current = this[slot];
    if (current) {
      current.pause();
      current.currentTime = 0;
    }

    const audio = new Audio(path);
    audio.volume = audioSettings.scaledSfx(volume);
    audio.onended = () => {
      if (this[slot] === audio) this[slot] = null;
    };
    this[slot] = audio;
    audio.play().catch(() => {});
  }

  static playCorrectAnswer() {
    this.playMathStinger('correctAnswerAudio', '/audio/LearnNew_Q1.wav', 0.5);
  }

  static playWrongAnswer() {
    this.playMathStinger('wrongAnswerAudio', '/audio/LearnNew_Q2.wav', 0.5);
  }

  static playIntro() {
    this.play('/audio/Mus_Intro.wav', 0.6);
  }

  static playBaldiIntro() {
    this.play('/audio/baldi/hi-im-david-hilbert.wav', 0.7);
  }

  static playWin() {
    this.play('/audio/MUS_Win.wav', 0.6);
  }

  static playHang() {
    this.play('/audio/Mus_hang.wav', 0.5);
  }

  static playEvent() {
    this.play('/audio/Mus_EventNotification_Low.wav', 0.5);
  }

  static playParty() {
    this.play('/audio/Mus_party.wav', 0.4);
  }

  static playDoorOpen() {
    const ctx = new AudioContext();
    const duration = 0.15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.15 * audioSettings.sfxVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
  }

  static playDoorClose() {
    const ctx = new AudioContext();
    const duration = 0.1;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.12 * audioSettings.sfxVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
  }
}
