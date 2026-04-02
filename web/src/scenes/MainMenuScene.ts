import { sceneManager, type GameScene } from '../engine/SceneManager';
import { inputManager } from '../engine/InputManager';
import { SFXPlayer } from '../game/MusicGenerator';

export class MainMenuScene implements GameScene {
  name = 'mainmenu';
  private introAudio: HTMLAudioElement | null = null;

  onEnter() {
    const el = document.getElementById('main-menu')!;
    el.classList.add('active');
    inputManager.unlockPointer();

    this.introAudio = new Audio('/audio/Mus_Intro.wav');
    this.introAudio.loop = true;
    this.introAudio.volume = 0.4;
    this.introAudio.play().catch(() => {});

    document.getElementById('btn-story')!.onclick = () => {
      sceneManager.loadScene('school_story');
    };
    document.getElementById('btn-endless')!.onclick = () => {
      sceneManager.loadScene('school_endless');
    };
  }

  onExit() {
    document.getElementById('main-menu')!.classList.remove('active');
    if (this.introAudio) {
      this.introAudio.pause();
      this.introAudio = null;
    }
  }

  update(_dt: number) {
    // Menu is event-driven
  }
}
