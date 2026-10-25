import { sceneManager, type GameScene } from '../engine/SceneManager';
import { inputManager } from '../engine/InputManager';
import { assetUrl } from '../engine/assetUrl';
import { audioSettings } from '../engine/AudioSettings';
import { i18n } from '../engine/i18n';
import { optionsMenuUI } from '../game/ui/OptionsMenu';
import { SFXPlayer } from '../game/MusicGenerator';

export class MainMenuScene implements GameScene {
  name = 'mainmenu';
  private introAudio: HTMLAudioElement | null = null;
  private greetingAudio: HTMLAudioElement | null = null;
  private introBaseVolume = 0.18;
  private introDuckedVolume = 0.05;
  private greetingBaseVolume = 1;
  private musicDucked = false;
  private unsubscribeMusic: (() => void) | null = null;
  private unsubscribeSfx: (() => void) | null = null;

  onEnter() {
    SFXPlayer.stopCatchGlitch();
    document.getElementById('catch-fade')!.style.opacity = '0';

    const el = document.getElementById('main-menu')!;
    el.classList.add('active');
    inputManager.unlockPointer();

    this.musicDucked = true;
    this.introAudio = new Audio(assetUrl('/audio/Mus_Intro.wav'));
    this.introAudio.loop = true;
    this.applyIntroVolume();
    this.introAudio.play().catch(() => {});
    this.unsubscribeMusic = audioSettings.onMusicVolumeChange(() => this.applyIntroVolume());

    this.greetingAudio = new Audio(assetUrl('/audio/baldi/start-greeting.m4a'));
    this.greetingAudio.volume = audioSettings.scaledSfx(this.greetingBaseVolume);
    this.greetingAudio.onended = () => {
      this.musicDucked = false;
      this.applyIntroVolume();
    };
    this.greetingAudio.play().catch(() => {
      this.musicDucked = false;
      this.applyIntroVolume();
    });
    this.unsubscribeSfx = audioSettings.onSfxVolumeChange(() => {
      if (this.greetingAudio) {
        this.greetingAudio.volume = audioSettings.scaledSfx(this.greetingBaseVolume);
      }
    });

    document.getElementById('btn-story')!.onclick = () => {
      sceneManager.loadScene('school_story');
    };
    document.getElementById('btn-endless')!.onclick = () => {
      sceneManager.loadScene('school_endless');
    };
    document.getElementById('btn-menu-right')!.onclick = () => {
      optionsMenuUI.show();
    };
    document.getElementById('btn-translate')!.onclick = () => {
      i18n.cycleLocale();
    };
    optionsMenuUI.onBack = () => {
      optionsMenuUI.hide();
    };
  }

  private applyIntroVolume() {
    if (!this.introAudio) return;
    const base = this.musicDucked ? this.introDuckedVolume : this.introBaseVolume;
    this.introAudio.volume = audioSettings.scaledMusic(base);
  }

  onExit() {
    document.getElementById('main-menu')!.classList.remove('active');
    optionsMenuUI.hide();
    this.unsubscribeMusic?.();
    this.unsubscribeMusic = null;
    this.unsubscribeSfx?.();
    this.unsubscribeSfx = null;
    this.musicDucked = false;
    if (this.introAudio) {
      this.introAudio.pause();
      this.introAudio = null;
    }
    if (this.greetingAudio) {
      this.greetingAudio.onended = null;
      this.greetingAudio.pause();
      this.greetingAudio = null;
    }
  }

  update(_dt: number) {
    // Menu is event-driven
  }
}
