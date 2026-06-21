import { audioSettings } from '../../engine/AudioSettings';

export class OptionsMenuUI {
  private el: HTMLElement;
  private musicSlider: HTMLInputElement;
  private sfxSlider: HTMLInputElement;
  private musicValue: HTMLElement;
  private sfxValue: HTMLElement;
  private backBtn: HTMLElement;

  onBack: (() => void) | null = null;

  constructor() {
    this.el = document.getElementById('options-menu')!;
    this.musicSlider = document.getElementById('music-volume') as HTMLInputElement;
    this.sfxSlider = document.getElementById('sfx-volume') as HTMLInputElement;
    this.musicValue = document.getElementById('music-volume-value')!;
    this.sfxValue = document.getElementById('sfx-volume-value')!;
    this.backBtn = document.getElementById('btn-options-back')!;

    this.musicSlider.addEventListener('input', () => {
      const volume = parseInt(this.musicSlider.value, 10) / 100;
      audioSettings.setMusicVolume(volume);
      this.musicValue.textContent = `${this.musicSlider.value}%`;
    });

    this.sfxSlider.addEventListener('input', () => {
      const volume = parseInt(this.sfxSlider.value, 10) / 100;
      audioSettings.setSfxVolume(volume);
      this.sfxValue.textContent = `${this.sfxSlider.value}%`;
    });

    this.backBtn.addEventListener('click', () => this.onBack?.());
  }

  show() {
    this.syncSliders();
    this.el.classList.add('active');
  }

  hide() {
    this.el.classList.remove('active');
  }

  isVisible(): boolean {
    return this.el.classList.contains('active');
  }

  private syncSliders() {
    const musicPct = Math.round(audioSettings.musicVolume * 100);
    const sfxPct = Math.round(audioSettings.sfxVolume * 100);
    this.musicSlider.value = String(musicPct);
    this.sfxSlider.value = String(sfxPct);
    this.musicValue.textContent = `${musicPct}%`;
    this.sfxValue.textContent = `${sfxPct}%`;
  }
}

export const optionsMenuUI = new OptionsMenuUI();
