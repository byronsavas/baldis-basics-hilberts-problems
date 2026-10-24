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

  private static readonly MOVE_AXIS_DEADZONE = 0.12;

  private frozenPosition = new THREE.Vector3();
  private sweepingFailsafe = 0;
  private bootsTimer = 0;
  private walls: AABB[] = [];
  private velocity = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly movement = new THREE.Vector3();
  private readonly lateralMovement = new THREE.Vector3();
  private readonly desiredMove = new THREE.Vector3();
  private readonly forwardOut = new THREE.Vector3();
  private readonly externalForce = new THREE.Vector3();

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
    this.forward.set(-Math.sin(this.rotation), 0, -Math.cos(this.rotation));
    this.right.set(Math.cos(this.rotation), 0, -Math.sin(this.rotation));

    this.movement.set(0, 0, 0);
    this.lateralMovement.set(0, 0, 0);

    const axes = inputManager.getMoveAxes();
    const axisLen = Math.hypot(axes.x, axes.y);
    if (axisLen > Player.MOVE_AXIS_DEADZONE) {
      let x = axes.x;
      let y = axes.y;
      if (inputManager.getAction(InputAction.Run)) {
        x /= axisLen;
        y /= axisLen;
      }
      this.movement.copy(this.forward).multiplyScalar(y);
      this.lateralMovement.copy(this.right).multiplyScalar(x);
    } else {
      if (inputManager.getAction(InputAction.MoveForward)) this.movement.add(this.forward);
      if (inputManager.getAction(InputAction.MoveBackward)) this.movement.sub(this.forward);
      if (inputManager.getAction(InputAction.MoveLeft)) this.lateralMovement.sub(this.right);
      if (inputManager.getAction(InputAction.MoveRight)) this.lateralMovement.add(this.right);
    }

    let speed = this.walkSpeed;
    if (this.stamina > 0 && inputManager.getAction(InputAction.Run)) {
      speed = this.runSpeed;
      if (this.movement.lengthSq() > 0.01 || this.lateralMovement.lengthSq() > 0.01) {
        this.resetGuilt('running', 0.1);
      }
    }

    if (this.jumpRope) {
      speed = 0;
    }

    if (this.sweeping || this.hugging) {
      speed = 0;
    }

    this.desiredMove.copy(this.movement).add(this.lateralMovement);
    if (this.desiredMove.lengthSq() > 1) this.desiredMove.normalize();
    this.desiredMove.multiplyScalar(speed * dt);

    slideMove(this.position, this.desiredMove, 1.5, this.walls);
    this.position.add(this.desiredMove);
    this.velocity.copy(this.desiredMove).multiplyScalar(dt > 0 ? 1 / dt : 0);
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
    return this.forwardOut.set(-Math.sin(this.rotation), 0, -Math.cos(this.rotation));
  }

  getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  applyExternalForce(force: THREE.Vector3) {
    this.externalForce.copy(force);
    slideMove(this.position, this.externalForce, 1.5, this.walls);
    this.position.add(this.externalForce);
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
