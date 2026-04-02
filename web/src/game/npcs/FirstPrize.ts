import * as THREE from 'three';
import { NpcBase } from './NpcBase';
import type { Player } from '../Player';

export class FirstPrize extends NpcBase {
  turnSpeed = 0.03;
  normSpeed = 15;
  runSpeed = 30;
  currentSpeed = 0;
  playerSeen = false;
  hugAnnounced = false;
  crazyTime = 0;

  private targetRotation = 0;

  constructor() {
    super(0xaaaaaa, 5, 3);
  }

  update(dt: number, playerPos: THREE.Vector3, player?: Player) {
    if (!this.active) return;

    this.coolDown -= dt;

    const dist = this.position.distanceTo(playerPos);

    // Crazy spin mode
    if (this.crazyTime > 0) {
      this.crazyTime -= dt;
      this.mesh.rotation.y += 5 * dt;
      this.speed = 0;
      this.syncMesh();
      return;
    }

    // Line of sight - chase player if seen
    if (dist < 80) {
      this.playerSeen = true;
      this.currentSpeed = this.runSpeed;
      this.setDestination(playerPos);
    } else {
      if (this.playerSeen) {
        this.playerSeen = false;
      }
      this.currentSpeed = this.normSpeed;
      if (this.isAtDestination() && this.coolDown <= 0) {
        this.wander();
      }
    }

    // Custom facing: rotate toward movement direction
    if (this.path.length > 0 && this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const dir = target.clone().sub(this.position);
      dir.y = 0;
      if (dir.length() > 0.1) {
        this.targetRotation = Math.atan2(dir.x, dir.z);
      }
    }

    let angleDiff = this.targetRotation - this.mesh.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) < 0.1) {
      this.speed = this.currentSpeed;
    } else {
      this.mesh.rotation.y += Math.sign(angleDiff) * this.turnSpeed * dt * 60;
      this.speed = this.currentSpeed * 0.2;
    }

    this.moveAlongPath(dt);

    // Hug check
    if (dist < 5 && player) {
      const pushDir = this.mesh.getWorldDirection(new THREE.Vector3());
      pushDir.y = 0;
      pushDir.normalize();
      player.applyExternalForce(pushDir.multiplyScalar(this.currentSpeed * dt));
      player.setHugging(0.5);
      this.hugAnnounced = true;
    }

    this.syncMesh();
  }

  goCrazy() {
    this.crazyTime = 15;
  }
}
