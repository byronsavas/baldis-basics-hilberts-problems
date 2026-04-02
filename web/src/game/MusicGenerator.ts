/**
 * Music player using the original Baldi's Basics OST audio files.
 */

export class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private playing = false;

  start() {
    if (this.playing) return;
    this.audio = new Audio('/audio/Mus_School.wav');
    this.audio.loop = true;
    this.audio.volume = 0.5;
    this.audio.play().catch(() => {});
    this.playing = true;
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.playing = false;
  }

  setVolume(v: number) {
    if (this.audio) this.audio.volume = v;
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

  start() {
    if (this.playing) return;
    this.audio = new Audio('/audio/Ev5_Loop.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.5;
    this.audio.play().catch(() => {});
    this.playing = true;
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.playing = false;
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

  static play(path: string, volume = 0.5) {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.play().catch(() => {});
  }

  static playLearnMusic() {
    this.play('/audio/LearnNew.wav', 0.4);
  }

  static playCorrectAnswer() {
    this.play('/audio/LearnNew_Q1.wav', 0.5);
  }

  static playWrongAnswer() {
    this.play('/audio/LearnNew_Q2.wav', 0.5);
  }

  static playIntro() {
    this.play('/audio/Mus_Intro.wav', 0.6);
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
}
