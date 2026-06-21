import { sceneManager, type GameScene } from '../engine/SceneManager';
import { inputManager } from '../engine/InputManager';
import { audioSettings } from '../engine/AudioSettings';
import { optionsMenuUI } from '../game/ui/OptionsMenu';

export class MainMenuScene implements GameScene {
  name = 'mainmenu';
  private introAudio: HTMLAudioElement | null = null;
  private introBaseVolume = 0.4;
  private unsubscribeMusic: (() => void) | null = null;

  onEnter() {
    const el = document.getElementById('main-menu')!;
    el.classList.add('active');
    inputManager.unlockPointer();

    this.introAudio = new Audio('/audio/Mus_Intro.wav');
    this.introAudio.loop = true;
    this.introAudio.volume = audioSettings.scaledMusic(this.introBaseVolume);
    this.introAudio.play().catch(() => {});
    this.unsubscribeMusic = audioSettings.onMusicVolumeChange(() => {
      if (this.introAudio) {
        this.introAudio.volume = audioSettings.scaledMusic(this.introBaseVolume);
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
    optionsMenuUI.onBack = () => {
      optionsMenuUI.hide();
    };
  }

  onExit() {
    document.getElementById('main-menu')!.classList.remove('active');
    optionsMenuUI.hide();
    this.unsubscribeMusic?.();
    this.unsubscribeMusic = null;
    if (this.introAudio) {
      this.introAudio.pause();
      this.introAudio = null;
    }
  }

  update(_dt: number) {
    // Menu is event-driven
  }
}
