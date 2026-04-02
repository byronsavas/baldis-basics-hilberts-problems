export enum InputAction {
  MoveForward,
  MoveBackward,
  MoveLeft,
  MoveRight,
  Run,
  Interact,
  UseItem,
  Slot0,
  Slot1,
  Slot2,
  Pause,
  Jump,
  LookBehind,
}

const DEFAULT_BINDINGS: Record<InputAction, string[]> = {
  [InputAction.MoveForward]: ['KeyW', 'ArrowUp'],
  [InputAction.MoveBackward]: ['KeyS', 'ArrowDown'],
  [InputAction.MoveLeft]: ['KeyA', 'ArrowLeft'],
  [InputAction.MoveRight]: ['KeyD', 'ArrowRight'],
  [InputAction.Run]: ['ShiftLeft', 'ShiftRight'],
  [InputAction.Interact]: ['KeyE', 'Mouse0'],
  [InputAction.UseItem]: ['Mouse0'],
  [InputAction.Slot0]: ['Digit1'],
  [InputAction.Slot1]: ['Digit2'],
  [InputAction.Slot2]: ['Digit3'],
  [InputAction.Pause]: ['Escape'],
  [InputAction.Jump]: ['Space'],
  [InputAction.LookBehind]: ['KeyQ'],
};

class InputManager {
  private keysDown = new Set<string>();
  private keysJustDown = new Set<string>();
  private keysJustUp = new Set<string>();
  private mouseDx = 0;
  private mouseDy = 0;
  private scrollDelta = 0;
  private pointerLocked = false;
  private canvas: HTMLCanvasElement | null = null;
  onPointerLockLost: (() => void) | null = null;

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    document.addEventListener('keydown', (e) => {
      if (!this.keysDown.has(e.code)) {
        this.keysJustDown.add(e.code);
      }
      this.keysDown.add(e.code);
    });

    document.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      this.keysJustUp.add(e.code);
    });

    document.addEventListener('mousedown', (e) => {
      const code = `Mouse${e.button}`;
      if (!this.keysDown.has(code)) {
        this.keysJustDown.add(code);
      }
      this.keysDown.add(code);
    });

    document.addEventListener('mouseup', (e) => {
      const code = `Mouse${e.button}`;
      this.keysDown.delete(code);
      this.keysJustUp.add(code);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.pointerLocked) {
        this.mouseDx += e.movementX;
        this.mouseDy += e.movementY;
      }
    });

    document.addEventListener('wheel', (e) => {
      this.scrollDelta += Math.sign(e.deltaY);
    });

    document.addEventListener('pointerlockchange', () => {
      const wasLocked = this.pointerLocked;
      this.pointerLocked = document.pointerLockElement === this.canvas;
      if (wasLocked && !this.pointerLocked && this.onPointerLockLost) {
        this.onPointerLockLost();
      }
    });
  }

  lockPointer() {
    this.canvas?.requestPointerLock();
  }

  unlockPointer() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  getAction(action: InputAction): boolean {
    const codes = DEFAULT_BINDINGS[action];
    return codes.some((c) => this.keysDown.has(c));
  }

  getActionDown(action: InputAction): boolean {
    const codes = DEFAULT_BINDINGS[action];
    return codes.some((c) => this.keysJustDown.has(c));
  }

  getActionUp(action: InputAction): boolean {
    const codes = DEFAULT_BINDINGS[action];
    return codes.some((c) => this.keysJustUp.has(c));
  }

  isKeyDown(code: string): boolean {
    return this.keysJustDown.has(code);
  }

  isKey(code: string): boolean {
    return this.keysDown.has(code);
  }

  anyKeyDown(): boolean {
    return this.keysJustDown.size > 0;
  }

  getMouseDelta(): { dx: number; dy: number } {
    return { dx: this.mouseDx, dy: this.mouseDy };
  }

  getScrollDelta(): number {
    return this.scrollDelta;
  }

  endFrame() {
    this.keysJustDown.clear();
    this.keysJustUp.clear();
    this.mouseDx = 0;
    this.mouseDy = 0;
    this.scrollDelta = 0;
  }
}

export const inputManager = new InputManager();
