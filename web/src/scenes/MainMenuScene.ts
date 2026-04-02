import { sceneManager, type GameScene } from '../engine/SceneManager';
import { inputManager } from '../engine/InputManager';

export class MainMenuScene implements GameScene {
  name = 'mainmenu';

  onEnter() {
    const el = document.getElementById('main-menu')!;
    el.classList.add('active');
    inputManager.unlockPointer();

    document.getElementById('btn-story')!.onclick = () => {
      sceneManager.loadScene('school_story');
    };
    document.getElementById('btn-endless')!.onclick = () => {
      sceneManager.loadScene('school_endless');
    };
  }

  onExit() {
    document.getElementById('main-menu')!.classList.remove('active');
  }

  update(_dt: number) {
    // Menu is event-driven
  }
}
