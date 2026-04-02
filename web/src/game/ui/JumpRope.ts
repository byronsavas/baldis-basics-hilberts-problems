export interface JumpRopeCallbacks {
  getJumpHeight(): number;
  onSuccess(): void;
  onFail(): void;
  onComplete(): void;
}

export class JumpRopeUI {
  private el: HTMLElement;
  private countEl: HTMLElement;
  private ropeVisual: HTMLElement;

  private jumps = 0;
  private ropePosition = 0;
  private jumpDelay = 0;
  private active = false;
  private callbacks: JumpRopeCallbacks | null = null;

  constructor() {
    this.el = document.getElementById('jump-rope')!;
    this.countEl = document.getElementById('jump-count')!;
    this.ropeVisual = document.getElementById('rope-visual')!;
  }

  open(callbacks: JumpRopeCallbacks) {
    this.callbacks = callbacks;
    this.jumps = 0;
    this.ropePosition = 0;
    this.jumpDelay = 1;
    this.active = true;
    this.el.classList.add('active');
    this.countEl.textContent = '0/5';
    this.ropeVisual.textContent = 'Get Ready...';
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

    this.ropePosition += dt * 2;

    if (this.ropePosition >= 1) {
      this.ropePosition = 0;
      this.ropeHit();
    }

    const ropePhase = Math.sin(this.ropePosition * Math.PI);
    if (ropePhase > 0.5) {
      this.ropeVisual.textContent = 'JUMP!';
      this.ropeVisual.style.color = '#f00';
    } else {
      this.ropeVisual.textContent = '...';
      this.ropeVisual.style.color = '#0f0';
    }
  }

  private ropeHit() {
    const jumpHeight = this.callbacks?.getJumpHeight() ?? 0;

    if (jumpHeight > 0.2) {
      this.jumps++;
      this.countEl.textContent = `${this.jumps}/5`;
      this.callbacks?.onSuccess();

      if (this.jumps >= 5) {
        this.close();
        this.callbacks?.onComplete();
      }
    } else {
      this.callbacks?.onFail();
      this.close();
    }
  }
}
