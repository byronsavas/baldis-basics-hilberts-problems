import { inputManager } from '../engine/InputManager';
import { sceneManager, type GameScene } from '../engine/SceneManager';
import { audioManager } from '../engine/AudioManager';
import { audioSettings } from '../engine/AudioSettings';

export class WarningScene implements GameScene {
  name = 'warning';
  private soundOffBtn: HTMLButtonElement | null = null;
  private continuing = false;
  private onSoundOff = (e: Event) => {
    e.preventDefault();
    this.continueToMenu(true);
  };

  onEnter() {
    this.continuing = false;
    this.showScreen('warning-screen');
    audioManager.init();

    this.soundOffBtn = document.getElementById('btn-sound-off') as HTMLButtonElement;
    this.soundOffBtn.addEventListener('click', this.onSoundOff);
  }

  onExit() {
    this.soundOffBtn?.removeEventListener('click', this.onSoundOff);
    this.soundOffBtn = null;
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
