import { inputManager, InputAction } from '../../engine/InputManager';

/** Player multiplies look pixels by mouseSensitivity (0.002). This keeps a finger swipe close to mouse look. */
const TOUCH_LOOK_SCALE = 1.6;
const RUN_THRESHOLD = 0.7;

const SLOT_ACTIONS = [InputAction.Slot0, InputAction.Slot1, InputAction.Slot2];

/**
 * On-screen joystick, look drag, and action buttons.
 * Feeds InputManager so gameplay code stays on the keyboard path.
 */
export class TouchControls {
  private root: HTMLElement;
  private lookEl: HTMLElement;
  private stickEl: HTMLElement;
  private knobEl: HTMLElement;
  private jumpMode = false;
  private stickPointer: number | null = null;
  private lookPointers = new Map<number, { x: number; y: number }>();

  constructor() {
    this.root = document.getElementById('touch-controls')!;
    this.lookEl = document.getElementById('touch-look')!;
    this.stickEl = document.getElementById('touch-joystick')!;
    this.knobEl = document.getElementById('touch-joystick-knob')!;

    this.bindHold(document.getElementById('touch-interact')!, InputAction.Interact);
    this.bindHold(document.getElementById('touch-use')!, InputAction.UseItem);
    this.bindHold(document.getElementById('touch-lookbehind')!, InputAction.LookBehind);
    this.bindHold(document.getElementById('touch-pause')!, InputAction.Pause);
    this.bindHold(document.getElementById('touch-jump')!, InputAction.Jump);

    this.stickEl.addEventListener('pointerdown', (e) => this.onStickDown(e));
    this.stickEl.addEventListener('pointermove', (e) => this.onStickMove(e));
    this.stickEl.addEventListener('pointerup', (e) => this.onStickUp(e));
    this.stickEl.addEventListener('pointercancel', (e) => this.onStickUp(e));

    this.lookEl.addEventListener('pointerdown', (e) => this.onLookDown(e));
    this.lookEl.addEventListener('pointermove', (e) => this.onLookMove(e));
    this.lookEl.addEventListener('pointerup', (e) => this.onLookUp(e));
    this.lookEl.addEventListener('pointercancel', (e) => this.onLookUp(e));

    document.querySelectorAll<HTMLElement>('.item-slot').forEach((slot) => {
      const action = SLOT_ACTIONS[Number(slot.dataset.slot)];
      if (action === undefined) return;
      slot.addEventListener('pointerdown', (e) => {
        if (!inputManager.usesTouchControls()) return;
        e.preventDefault();
        e.stopPropagation();
        inputManager.setVirtualAction(action, true);
        inputManager.setVirtualAction(action, false);
      });
    });

    this.root.addEventListener('contextmenu', (e) => e.preventDefault());

    const onLayout = () => this.updateOrientation();
    window.addEventListener('resize', onLayout);
    window.addEventListener('orientationchange', onLayout);
    window.visualViewport?.addEventListener('resize', onLayout);
  }

  show() {
    if (!inputManager.usesTouchControls()) {
      this.hide();
      return;
    }
    this.root.classList.add('active');
    this.root.setAttribute('aria-hidden', 'false');
    this.updateOrientation();
  }

  hide() {
    this.releaseAll();
    this.root.classList.remove('active');
    this.root.setAttribute('aria-hidden', 'true');
  }

  setJumpMode(on: boolean) {
    this.jumpMode = on;
    this.root.classList.toggle('jump-mode', on);
    if (on) this.releaseStickAndLook();
  }

  private bindHold(el: HTMLElement, action: InputAction) {
    const down = (e: PointerEvent) => {
      if (!inputManager.usesTouchControls()) return;
      e.preventDefault();
      e.stopPropagation();
      inputManager.setVirtualAction(action, true);
      capturePointer(el, e.pointerId);
    };
    const up = (e: PointerEvent) => {
      releasePointer(el, e.pointerId);
      inputManager.setVirtualAction(action, false);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  private onStickDown(e: PointerEvent) {
    if (!this.root.classList.contains('active') || this.jumpMode) return;
    if (this.stickPointer !== null) return;
    e.preventDefault();
    this.stickPointer = e.pointerId;
    capturePointer(this.stickEl, e.pointerId);
    this.applyStick(e);
  }

  private onStickMove(e: PointerEvent) {
    if (e.pointerId !== this.stickPointer) return;
    this.applyStick(e);
  }

  private onStickUp(e: PointerEvent) {
    if (e.pointerId !== this.stickPointer) return;
    this.releaseStick();
  }

  private applyStick(e: PointerEvent) {
    const bounds = this.stickEl.getBoundingClientRect();
    const originX = bounds.left + bounds.width / 2;
    const originY = bounds.top + bounds.height / 2;
    const maxTravel = bounds.width * 0.38;
    let dx = e.clientX - originX;
    let dy = e.clientY - originY;
    const travel = Math.hypot(dx, dy);
    if (travel > maxTravel && travel > 0) {
      dx = (dx / travel) * maxTravel;
      dy = (dy / travel) * maxTravel;
    }
    const len = maxTravel > 0 ? Math.min(1, travel / maxTravel) : 0;
    const x = maxTravel > 0 ? dx / maxTravel : 0;
    const y = maxTravel > 0 ? -dy / maxTravel : 0;
    this.knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
    inputManager.setMoveAxes(x, y);
    inputManager.setVirtualAction(InputAction.Run, len >= RUN_THRESHOLD);
  }

  private onLookDown(e: PointerEvent) {
    if (!this.root.classList.contains('active') || this.jumpMode) return;
    e.preventDefault();
    capturePointer(this.lookEl, e.pointerId);
    this.lookPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  private onLookMove(e: PointerEvent) {
    const prev = this.lookPointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    this.lookPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    inputManager.addLookDelta(dx * TOUCH_LOOK_SCALE);
  }

  private onLookUp(e: PointerEvent) {
    this.lookPointers.delete(e.pointerId);
  }

  private releaseStick() {
    if (this.stickPointer !== null) releasePointer(this.stickEl, this.stickPointer);
    this.stickPointer = null;
    this.knobEl.style.transform = '';
    inputManager.setMoveAxes(0, 0);
    inputManager.setVirtualAction(InputAction.Run, false);
  }

  private releaseStickAndLook() {
    this.releaseStick();
    this.lookPointers.clear();
    inputManager.setVirtualAction(InputAction.LookBehind, false);
    inputManager.setVirtualAction(InputAction.Interact, false);
    inputManager.setVirtualAction(InputAction.UseItem, false);
  }

  private releaseAll() {
    this.releaseStickAndLook();
    inputManager.setVirtualAction(InputAction.Jump, false);
    inputManager.setVirtualAction(InputAction.Pause, false);
  }

  private updateOrientation() {
    const portrait = window.matchMedia('(orientation: portrait)').matches
      || window.innerHeight > window.innerWidth;
    const wasPortrait = this.root.classList.contains('portrait');
    this.root.classList.toggle('portrait', portrait);
    if (portrait && !wasPortrait) this.releaseAll();
  }
}

function capturePointer(el: HTMLElement, pointerId: number) {
  try {
    el.setPointerCapture(pointerId);
  } catch {
    // Synthetic or already-ended pointers still update the control.
  }
}

function releasePointer(el: HTMLElement, pointerId: number) {
  try {
    if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
  } catch {
    // The pointer is already gone.
  }
}

export const touchControls = new TouchControls();
