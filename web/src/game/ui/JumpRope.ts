import { inputManager } from '../../engine/InputManager';

export interface JumpRopeCallbacks {
  getJumpHeight(): number;
  onSuccess(): void;
  onFail(): void;
  onComplete(): void;
}

/** Labels Playtime calls out across five successful jumps */
const JUMP_ROPE_COUNT_LABELS = ['0', '...', 'ℵ₀', '...', 'ℵ₁'];

const JUMP_SUCCESS_HEIGHT = 0.15;

export class JumpRopeUI {
  private el: HTMLElement;
  private countEl: HTMLElement;

  private jumps = 0;
  private ropePosition = 0;
  private jumpDelay = 0;
  private maxJumpThisSwing = 0;
  private active = false;
  private callbacks: JumpRopeCallbacks | null = null;

  constructor() {
    this.el = document.getElementById('jump-rope')!;
    this.countEl = document.getElementById('jump-count')!;
  }

  open(callbacks: JumpRopeCallbacks) {
    this.callbacks = callbacks;
    this.jumps = 0;
    this.ropePosition = 0;
    this.jumpDelay = 1;
    this.maxJumpThisSwing = 0;
    this.active = true;
    this.el.classList.add('active');
    const prompt = document.getElementById('jump-rope-prompt');
    if (prompt) {
      prompt.textContent = inputManager.usesTouchControls()
        ? 'Tap to jump!'
        : 'Press the space bar to jump!';
    }
    this.updateCountDisplay();
  }

  private updateCountDisplay() {
    const label = JUMP_ROPE_COUNT_LABELS[Math.min(this.jumps, JUMP_ROPE_COUNT_LABELS.length - 1)];
    this.countEl.textContent = label;
  }

  private resetSequence() {
    this.jumps = 0;
    this.ropePosition = 0;
    this.maxJumpThisSwing = 0;
    this.jumpDelay = 0.75;
    this.updateCountDisplay();
  }

  close() {
    this.active = false;
    this.el.classList.remove('active');
  }

  update(dt: number) {
    if (!this.active) return;

    if (this.jumpDelay > 0) {
      this.jumpDelay -= dt;
      return;
    }

    const jumpHeight = this.callbacks?.getJumpHeight() ?? 0;
    this.ropePosition += dt * 2;

    const ropePhase = Math.sin(this.ropePosition * Math.PI);
    const ropeUp = ropePhase > 0.5;

    if (ropeUp) {
      this.maxJumpThisSwing = Math.max(this.maxJumpThisSwing, jumpHeight);
    }

    if (this.ropePosition >= 1) {
      this.ropePosition = 0;
      this.ropeHit();
      this.maxJumpThisSwing = 0;
    }
  }

  private ropeHit() {
    if (this.maxJumpThisSwing > JUMP_SUCCESS_HEIGHT) {
      this.jumps++;
      this.updateCountDisplay();
      this.callbacks?.onSuccess();

      if (this.jumps >= 5) {
        this.close();
        this.callbacks?.onComplete();
      }
    } else {
      this.callbacks?.onFail();
      this.resetSequence();
    }
  }
}
