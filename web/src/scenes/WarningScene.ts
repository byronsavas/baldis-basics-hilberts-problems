import { inputManager } from '../engine/InputManager';
import { sceneManager, type GameScene } from '../engine/SceneManager';
import { audioManager } from '../engine/AudioManager';
import { audioSettings } from '../engine/AudioSettings';

export class WarningScene implements GameScene {
  name = 'warning';
  private soundOffBtn: HTMLButtonElement | null = null;
  private warningScreen: HTMLElement | null = null;
  private continuing = false;
  private onSoundOff = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    this.continueToMenu(true);
  };
  private onScreenClick = () => {
    this.continueToMenu(false);
  };

  onEnter() {
    this.continuing = false;
    this.showScreen('warning-screen');
    audioManager.init();

    this.soundOffBtn = document.getElementById('btn-sound-off') as HTMLButtonElement;
    this.soundOffBtn.addEventListener('click', this.onSoundOff);

    this.warningScreen = document.getElementById('warning-screen');
    this.warningScreen?.addEventListener('click', this.onScreenClick);
    this.syncContinueLabel();
  }

  onExit() {
    this.soundOffBtn?.removeEventListener('click', this.onSoundOff);
    this.warningScreen?.removeEventListener('click', this.onScreenClick);
    this.soundOffBtn = null;
    this.warningScreen = null;
    this.hideScreen('warning-screen');
  }

  update(_dt: number) {
    this.syncContinueLabel();
    if (inputManager.anyKeyboardKeyDown()) {
      this.continueToMenu(false);
    }
  }

  private syncContinueLabel() {
    const el = document.getElementById('warning-continue');
    if (!el || this.continuing) return;
    el.textContent = inputManager.usesTouchControls()
      ? 'Tap to continue'
      : 'Press any key to continue';
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
