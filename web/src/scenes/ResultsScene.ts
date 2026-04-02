import type { GameScene } from '../engine/SceneManager';
import { sceneManager } from '../engine/SceneManager';
import { inputManager } from '../engine/InputManager';

export class ResultsScene implements GameScene {
  name = 'results';

  onEnter() {
    const el = document.getElementById('results-screen')!;
    el.classList.add('active');
    inputManager.unlockPointer();

    const mode = localStorage.getItem('CurrentMode') || 'story';
    const scoreEl = document.getElementById('results-score')!;

    if (mode === 'endless') {
      const books = localStorage.getItem('CurrentBooks') || '0';
      const highBooks = localStorage.getItem('HighBooks') || '0';
      scoreEl.textContent = `You collected ${books} notebooks! (High score: ${highBooks})`;
    } else {
      scoreEl.textContent = 'You collected all 7 notebooks and escaped!';
    }

    document.getElementById('btn-main-menu')!.onclick = () => {
      sceneManager.loadScene('mainmenu');
    };
  }

  onExit() {
    document.getElementById('results-screen')!.classList.remove('active');
  }

  update(_dt: number) {}
}
