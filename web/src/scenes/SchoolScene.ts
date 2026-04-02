import * as THREE from 'three';
import type { GameScene } from '../engine/SceneManager';
import { GameController } from '../game/GameController';

export class SchoolScene implements GameScene {
  name: string;
  private mode: string;
  private gc: GameController | null = null;
  private renderer: THREE.WebGLRenderer;

  constructor(mode: string, renderer: THREE.WebGLRenderer) {
    this.mode = mode;
    this.name = `school_${mode}`;
    this.renderer = renderer;
  }

  onEnter() {
    this.gc = new GameController();
    this.gc.init(this.mode);
  }

  onExit() {
    this.gc?.dispose();
    this.gc = null;
  }

  update(dt: number) {
    if (!this.gc) return;
    this.gc.update(dt);
    this.renderer.render(this.gc.scene, this.gc.camera.camera);
  }
}
