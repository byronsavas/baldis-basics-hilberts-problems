import { inputManager } from '../engine/InputManager';
import { sceneManager, type GameScene } from '../engine/SceneManager';
import { audioManager } from '../engine/AudioManager';
import { audioSettings } from '../engine/AudioSettings';

export class WarningScene implements GameScene {
  name = 'warning';
  private soundOffBtn: HTMLButtonElement | null = null;
  private continueBtn: HTMLElement | null = null;
  private continuing = false;
  private onSoundOff = (e: Event) => {
    e.preventDefault();
    this.continueToMenu(true);
  };
  private onContinueClick = (e: Event) => {
    e.preventDefault();
    this.continueToMenu(false);
  };
  private onContinueKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.continueToMenu(false);
    }
  };

  onEnter() {
    this.continuing = false;
    this.showScreen('warning-screen');
    audioManager.init();

    this.soundOffBtn = document.getElementById('btn-sound-off') as HTMLButtonElement;
    this.soundOffBtn.addEventListener('click', this.onSoundOff);

    this.continueBtn = document.getElementById('warning-continue');
    this.continueBtn?.addEventListener('click', this.onContinueClick);
    this.continueBtn?.addEventListener('keydown', this.onContinueKeydown);
  }

  onExit() {
    this.soundOffBtn?.removeEventListener('click', this.onSoundOff);
    this.continueBtn?.removeEventListener('click', this.onContinueClick);
    this.continueBtn?.removeEventListener('keydown', this.onContinueKeydown);
    this.soundOffBtn = null;
    this.continueBtn = null;
    this.hideScreen('warning-screen');
  }

  update(_dt: number) {
    if (inputManager.anyKeyboardKeyDown()) {
      this.continueToMenu(false);
    }
  }

  private continueToMenu(mute: boolean) {
    if (this.continuing) return;
    this.continuing = true;
    if (mute) {
      audioSettings.startMuted();
    }
    audioManager.resume();
    sceneManager.loadScene('mainmenu');
  }

  private showScreen(id: string) {
    document.getElementById(id)?.classList.add('active');
  }

  private hideScreen(id: string) {
    document.getElementById(id)?.classList.remove('active');
  }
}
