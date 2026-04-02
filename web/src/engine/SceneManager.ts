export interface GameScene {
  name: string;
  onEnter(): void;
  onExit(): void;
  update(dt: number): void;
}

class SceneManager {
  private scenes = new Map<string, GameScene>();
  private currentScene: GameScene | null = null;

  register(scene: GameScene) {
    this.scenes.set(scene.name, scene);
  }

  loadScene(name: string) {
    if (this.currentScene) {
      this.currentScene.onExit();
    }
    const next = this.scenes.get(name);
    if (!next) {
      console.error(`Scene "${name}" not found`);
      return;
    }
    this.currentScene = next;
    this.currentScene.onEnter();
  }

  getCurrent(): GameScene | null {
    return this.currentScene;
  }

  update(dt: number) {
    this.currentScene?.update(dt);
  }
}

export const sceneManager = new SceneManager();
