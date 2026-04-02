import { inputManager } from '../engine/InputManager';
import { sceneManager, type GameScene } from '../engine/SceneManager';
import { audioManager } from '../engine/AudioManager';

export class WarningScene implements GameScene {
  name = 'warning';

  onEnter() {
    this.showScreen('warning-screen');
    audioManager.init();
  }

  onExit() {
    this.hideScreen('warning-screen');
  }

  update(_dt: number) {
    if (inputManager.anyKeyDown()) {
      audioManager.resume();
      sceneManager.loadScene('mainmenu');
    }
  }

  private showScreen(id: string) {
    document.getElementById(id)?.classList.add('active');
  }

  private hideScreen(id: string) {
    document.getElementById(id)?.classList.remove('active');
  }
}
