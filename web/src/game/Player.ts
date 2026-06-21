import * as THREE from 'three';
import { inputManager, InputAction } from '../engine/InputManager';
import { gameLoop } from '../engine/GameLoop';
import { slideMove, checkTrigger, type AABB } from '../engine/Physics';

export class Player {
  position = new THREE.Vector3();
  rotation = 0; // yaw in radians
  height = 4;

  walkSpeed = 20;
  runSpeed = 36;
  playerSpeed = 20;
  stamina = 100;
  maxStamina = 100;
  staminaDrop = 0.75;
  staminaRise = 0.5;
  staminaMax = 100;

  gameOver = false;
  jumpRope = false;
  sweeping = false;
  hugging = false;
  bootsActive = false;

  guilt = 0;
  guiltType = '';
  principalBugFixer = 1;

  mouseSensitivity = 0.002;
  flipaturn = 1;

  private frozenPosition = new THREE.Vector3();
  private sweepingFailsafe = 0;
  private bootsTimer = 0;
  private walls: AABB[] = [];
  private velocity = new THREE.Vector3();

  setWalls(walls: AABB[]) {
    this.walls = walls;
  }

  spawn(pos: THREE.Vector3) {
    this.position.copy(pos);
    this.stamina = this.maxStamina;
    this.gameOver = false;
    this.guilt = 0;
  }

  update(dt: number) {
    if (this.gameOver) return;

    const timeScale = gameLoop.getTimeScale();
    if (timeScale === 0) return;

    this.position.y = this.height;
    this.mouseMove(dt);
    this.playerMove(dt);
    this.staminaCheck(dt);
    this.guiltCheck(dt);

    if (this.jumpRope && !checkTrigger(this.position, this.frozenPosition, 1)) {
      this.deactivateJumpRope();
    }

    if (this.sweepingFailsafe > 0) {
      this.sweepingFailsafe -= dt;
    } else {
      this.sweeping = false;
      this.hugging = false;
    }

    if (this.bootsActive) {
      this.bootsTimer -= dt;
      if (this.bootsTimer <= 0) {
        this.bootsActive = false;
        this.walkSpeed = 20;
        this.runSpeed = 36;
      }
    }
  }

  private mouseMove(_dt: number) {
    if (this.jumpRope) return;

    const { dx } = inputManager.getMouseDelta();
    this.rotation -= dx * this.mouseSensitivity * this.flipaturn;
  }

  private playerMove(dt: number) {
    const forward = new THREE.Vector3(-Math.sin(this.rotation), 0, -Math.cos(this.rotation));
    const right = new THREE.Vector3(Math.cos(this.rotation), 0, -Math.sin(this.rotation));

    let movement = new THREE.Vector3();
    let lateralMovement = new THREE.Vector3();

    if (inputManager.getAction(InputAction.MoveForward)) movement.add(forward);
    if (inputManager.getAction(InputAction.MoveBackward)) movement.sub(forward);
    if (inputManager.getAction(InputAction.MoveLeft)) lateralMovement.sub(right);
    if (inputManager.getAction(InputAction.MoveRight)) lateralMovement.add(right);

    let speed = this.walkSpeed;
    if (this.stamina > 0 && inputManager.getAction(InputAction.Run)) {
      speed = this.runSpeed;
      if (movement.length() > 0.1 || lateralMovement.length() > 0.1) {
        this.resetGuilt('running', 0.1);
      }
    }

    if (this.jumpRope) {
      speed = 0;
    }

    if (this.sweeping || this.hugging) {
      speed = 0;
    }

    const combined = movement.add(lateralMovement);
    if (combined.length() > 1) combined.normalize();

    const desiredMove = combined.multiplyScalar(speed * dt);
    const adjustedMove = slideMove(this.position, desiredMove, 1.5, this.walls);
    this.position.add(adjustedMove);
    this.velocity.copy(adjustedMove).divideScalar(dt);
  }

  private staminaCheck(dt: number) {
    if (inputManager.getAction(InputAction.Run) && this.velocity.length() > 0.1) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrop * dt * 60);
    } else {
      this.stamina = Math.min(this.staminaMax, this.stamina + this.staminaRise * dt * 60);
    }
  }

  resetGuilt(type: string, amount: number) {
    this.guilt = amount;
    this.guiltType = type;
  }

  private guiltCheck(dt: number) {
    if (this.guilt > 0) {
      this.guilt -= dt;
      if (this.guilt <= 0) {
        this.guilt = 0;
        this.guiltType = '';
      }
    }
  }

  activateJumpRope() {
    this.jumpRope = true;
    this.frozenPosition.copy(this.position);
  }

  deactivateJumpRope() {
    this.jumpRope = false;
  }

  /** Turn to face a point on the XZ plane (used when Playtime starts jump rope). */
  faceToward(x: number, z: number) {
    const dx = x - this.position.x;
    const dz = z - this.position.z;
    this.rotation = Math.atan2(-dx, -dz);
  }

  activateBoots(duration = 15) {
    this.bootsActive = true;
    this.bootsTimer = duration;
    this.walkSpeed = 28;
    this.runSpeed = 50;
  }

  getForward(): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(this.rotation), 0, -Math.cos(this.rotation));
  }

  getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  applyExternalForce(force: THREE.Vector3) {
    const adjusted = slideMove(this.position, force, 1.5, this.walls);
    this.position.add(adjusted);
  }

  setSweeping(failsafe: number) {
    this.sweeping = true;
    this.sweepingFailsafe = failsafe;
  }

  setHugging(failsafe: number) {
    this.hugging = true;
    this.sweepingFailsafe = failsafe;
  }
}
