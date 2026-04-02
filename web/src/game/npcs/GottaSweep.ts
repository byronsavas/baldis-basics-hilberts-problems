import * as THREE from 'three';
import { NpcBase } from './NpcBase';
import type { Player } from '../Player';

export class GottaSweep extends NpcBase {
  sweepActive = false;
  private waitTime = 0;
  private wanders = 0;
  private origin = new THREE.Vector3();

  constructor() {
    super(0x228822, 7, 2);
    this.mesh.visible = false;
    this.resetSweep();
  }

  setOrigin(pos: THREE.Vector3) {
    this.origin.copy(pos);
    this.position.copy(pos);
  }

  update(dt: number, playerPos: THREE.Vector3, player?: Player) {
    if (!this.active) return;

    if (!this.sweepActive) {
      this.waitTime -= dt;
      if (this.waitTime <= 0) {
        this.sweepActive = true;
        this.wanders = 0;
        this.mesh.visible = true;
        this.speed = 40;
        this.wander();
      }
      return;
    }

    this.coolDown -= dt;

    if (this.isAtDestination() && this.coolDown <= 0) {
      if (this.wanders < 5) {
        this.wander();
        this.wanders++;
      } else {
        this.goHome();
      }
    }

    this.moveAlongPath(dt);

    // Push player on contact
    if (player) {
      const dist = this.position.distanceTo(playerPos);
      if (dist < 5) {
        const pushDir = this.destination.clone().sub(this.position);
        pushDir.y = 0;
        pushDir.normalize();
        player.applyExternalForce(pushDir.multiplyScalar(this.speed * dt));
        player.setSweeping(0.5);
      }
    }

    this.syncMesh();
  }

  private goHome() {
    this.setDestination(this.origin);
    this.sweepActive = false;
    this.mesh.visible = false;
    this.resetSweep();
  }

  private resetSweep() {
    this.waitTime = 120 + Math.random() * 60;
  }
}
