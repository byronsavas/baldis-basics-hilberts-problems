import * as THREE from 'three';
import { inputManager, InputAction } from '../engine/InputManager';
import type { Player } from './Player';

function viewportSize() {
  const vv = window.visualViewport;
  return {
    width: Math.max(1, vv?.width ?? window.innerWidth),
    height: Math.max(1, vv?.height ?? window.innerHeight),
  };
}

export class GameCamera {
  camera: THREE.PerspectiveCamera;
  private offset = new THREE.Vector3(0, 0, 0);
  private lookBehind = false;

  // Jump rope physics
  jumpHeight = 0;
  private jumpVelocity = 0;
  private gravity = -60;
  private initVelocity = 18;

  constructor() {
    const size = viewportSize();
    this.camera = new THREE.PerspectiveCamera(60, size.width / size.height, 0.1, 400);
    const onResize = () => {
      const next = viewportSize();
      this.camera.aspect = next.width / next.height;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
  }

  resetJump() {
    this.jumpHeight = 0;
    this.jumpVelocity = 0;
  }

  update(dt: number, player: Player, catchLookTarget?: THREE.Vector3) {
    if (player.jumpRope) {
      const jumping = inputManager.getAction(InputAction.Jump) || inputManager.getActionDown(InputAction.Jump);
      if (jumping && this.jumpHeight <= 0) {
        this.jumpVelocity = this.initVelocity;
      }
      this.jumpVelocity += this.gravity * dt;
      this.jumpHeight += this.jumpVelocity * dt;
      if (this.jumpHeight < 0) {
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
      }
    } else {
      this.jumpHeight = 0;
      this.jumpVelocity = 0;
    }

    this.lookBehind = !player.jumpRope && inputManager.getAction(InputAction.LookBehind);

    if (player.gameOver && catchLookTarget) {
      // Drop the view and tilt up toward Baldi's face, like the original catch sequence
      this.camera.position.set(
        player.position.x,
        player.position.y - 2.5,
        player.position.z,
      );
      this.camera.lookAt(catchLookTarget);
    } else {
      this.camera.position.set(
        player.position.x + this.offset.x,
        player.position.y + this.offset.y + this.jumpHeight,
        player.position.z + this.offset.z,
      );

      if (this.lookBehind) {
        this.camera.rotation.set(0, player.rotation + Math.PI, 0, 'YXZ');
      } else {
        this.camera.rotation.set(0, player.rotation, 0, 'YXZ');
      }
    }
  }

  setFarClipPlane(distance: number) {
    this.camera.far = Math.max(0.2, distance);
    this.camera.updateProjectionMatrix();
  }
}
