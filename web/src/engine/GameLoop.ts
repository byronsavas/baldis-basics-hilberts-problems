export type UpdateCallback = (dt: number) => void;
export type FixedUpdateCallback = (fixedDt: number) => void;

const FIXED_TIMESTEP = 1 / 60;
const MAX_FRAME_TIME = 0.1;

class GameLoop {
  private running = false;
  private timeScale = 1;
  private accumulator = 0;
  private lastTime = 0;
  private updateCallbacks: UpdateCallback[] = [];
  private fixedUpdateCallbacks: FixedUpdateCallback[] = [];
  private rafId = 0;

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    this.tick();
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  setTimeScale(scale: number) {
    this.timeScale = scale;
  }

  getTimeScale(): number {
    return this.timeScale;
  }

  onUpdate(cb: UpdateCallback) {
    this.updateCallbacks.push(cb);
  }

  onFixedUpdate(cb: FixedUpdateCallback) {
    this.fixedUpdateCallbacks.push(cb);
  }

  removeUpdate(cb: UpdateCallback) {
    const idx = this.updateCallbacks.indexOf(cb);
    if (idx >= 0) this.updateCallbacks.splice(idx, 1);
  }

  removeFixedUpdate(cb: FixedUpdateCallback) {
    const idx = this.fixedUpdateCallbacks.indexOf(cb);
    if (idx >= 0) this.fixedUpdateCallbacks.splice(idx, 1);
  }

  private tick = () => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);

    const now = performance.now() / 1000;
    let frameTime = now - this.lastTime;
    this.lastTime = now;

    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

    const scaledDt = frameTime * this.timeScale;

    this.accumulator += scaledDt;
    while (this.accumulator >= FIXED_TIMESTEP) {
      for (const cb of this.fixedUpdateCallbacks) {
        cb(FIXED_TIMESTEP);
      }
      this.accumulator -= FIXED_TIMESTEP;
    }

    for (const cb of this.updateCallbacks) {
      cb(scaledDt);
    }
  };
}

export const gameLoop = new GameLoop();
