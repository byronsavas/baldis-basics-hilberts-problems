import type { GameScene } from '../engine/SceneManager';
import { sceneManager } from '../engine/SceneManager';
import { inputManager } from '../engine/InputManager';
import { SFXPlayer } from '../game/MusicGenerator';

export class ResultsScene implements GameScene {
  name = 'results';

  onEnter() {
    const el = document.getElementById('results-screen')!;
    el.classList.add('active');
    inputManager.unlockPointer();
    SFXPlayer.playWin();

    const mode = localStorage.getItem('CurrentMode') || 'story';
    const scoreEl = document.getElementById('results-score')!;

    if (mode === 'endless') {
      const books = localStorage.getItem('CurrentBooks') || '0';
      const highBooks = localStorage.getItem('HighBooks') || '0';
      scoreEl.textContent = `You studied ${books} of Hilbert's problems! (High score: ${highBooks})`;
    } else {
      scoreEl.textContent = 'You studied all 23 of Hilbert\'s problems and escaped!';
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
