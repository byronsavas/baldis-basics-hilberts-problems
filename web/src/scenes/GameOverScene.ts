import type { GameScene } from '../engine/SceneManager';
import { sceneManager } from '../engine/SceneManager';
import { SFXPlayer } from '../game/MusicGenerator';

const GAME_OVER_MESSAGES = [
  '😵 You were caught!',
  '📓 Study harder next time!',
  '🏫 Detention forever!',
  '📐 Math is important!',
  '❌ Game Over!',
];

export class GameOverScene implements GameScene {
  name = 'gameover';
  private delay = 5;
  private rare = false;

  onEnter() {
    const el = document.getElementById('game-over-screen')!;
    el.classList.add('active');
    SFXPlayer.playHang();

    this.delay = 5;
    this.rare = Math.random() * 100 > 98;

    const imgEl = document.getElementById('game-over-image')!;
    if (this.rare) {
      imgEl.textContent = '👹';
      imgEl.style.color = '#f00';
      imgEl.style.fontSize = '120px';
    } else {
      const msg = GAME_OVER_MESSAGES[Math.floor(Math.random() * GAME_OVER_MESSAGES.length)];
      imgEl.textContent = msg;
      imgEl.style.color = '#fff';
      imgEl.style.fontSize = '36px';
    }
  }

  onExit() {
    document.getElementById('game-over-screen')!.classList.remove('active');
  }

  update(dt: number) {
    this.delay -= dt;
    if (this.delay <= 0) {
      if (this.rare) {
        // Rare: just show for longer then go to menu
        if (this.delay <= -5) {
          sceneManager.loadScene('mainmenu');
        }
      } else {
        sceneManager.loadScene('mainmenu');
      }
    }
  }
}
