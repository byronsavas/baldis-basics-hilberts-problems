type VolumeListener = (volume: number) => void;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function readVolume(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? clamp(parsed, 0, 1) : fallback;
}

class AudioSettings {
  private musicListeners = new Set<VolumeListener>();
  private sfxListeners = new Set<VolumeListener>();

  musicVolume = readVolume('MusicVolume', 0.5);
  sfxVolume = readVolume('SfxVolume', 0.5);
  sessionMuted = false;

  scaledMusic(base: number): number {
    if (this.sessionMuted) return 0;
    // HTMLAudioElement.volume must be in [0, 1] or it throws IndexSizeError
    return clamp(base * this.musicVolume, 0, 1);
  }

  scaledSfx(base: number): number {
    if (this.sessionMuted) return 0;
    return clamp(base * this.sfxVolume, 0, 1);
  }

  startMuted() {
    if (this.sessionMuted) return;
    this.sessionMuted = true;
    this.notifyMusicListeners();
    this.notifySfxListeners();
  }

  setMusicVolume(v: number) {
    const wasMuted = this.sessionMuted;
    this.sessionMuted = false;
    this.musicVolume = clamp(v, 0, 1);
    localStorage.setItem('MusicVolume', String(this.musicVolume));
    this.notifyMusicListeners();
    if (wasMuted) this.notifySfxListeners();
  }

  setSfxVolume(v: number) {
    const wasMuted = this.sessionMuted;
    this.sessionMuted = false;
    this.sfxVolume = clamp(v, 0, 1);
    localStorage.setItem('SfxVolume', String(this.sfxVolume));
    this.notifySfxListeners();
    if (wasMuted) this.notifyMusicListeners();
  }

  onMusicVolumeChange(listener: VolumeListener): () => void {
    this.musicListeners.add(listener);
    return () => this.musicListeners.delete(listener);
  }

  onSfxVolumeChange(listener: VolumeListener): () => void {
    this.sfxListeners.add(listener);
    return () => this.sfxListeners.delete(listener);
  }

  private notifyMusicListeners() {
    for (const listener of this.musicListeners) listener(this.musicVolume);
  }

  private notifySfxListeners() {
    for (const listener of this.sfxListeners) listener(this.sfxVolume);
  }
}

export const audioSettings = new AudioSettings();
