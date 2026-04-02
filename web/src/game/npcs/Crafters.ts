import * as THREE from 'three';
import { NpcBase } from './NpcBase';
import type { Player } from '../Player';
import type { Baldi } from './Baldi';

export class Crafters extends NpcBase {
  angry = false;
  gettingAngry = false;
  anger = 0;
  notebooksRequired = 7;

  baldiTeleportPoint = new THREE.Vector3();
  playerTeleportPoint = new THREE.Vector3();

  private forceShowTime = 0;

  constructor() {
    super(0x884488, 5, 2);
    this.mesh.visible = false;
  }

  update(dt: number, playerPos: THREE.Vector3, notebookCount?: number, player?: Player, baldi?: Baldi) {
    if (!this.active) return;
    if ((notebookCount ?? 0) < this.notebooksRequired) return;

    const dist = this.position.distanceTo(playerPos);

    if (!this.angry) {
      // Check if player can see crafters (simplified: distance + visibility)
      if (dist < 40 && this.mesh.visible) {
        this.gettingAngry = true;
      } else {
        this.gettingAngry = false;
      }

      // Anger buildup
      if (this.gettingAngry) {
        this.anger += dt * 0.5;
        if (this.anger >= 1) {
          this.angry = true;
          this.mesh.visible = true;
          // Change color to red when angry
          (this.bodyMesh.material as THREE.MeshLambertMaterial).color.set(0xff0000);
        }
      }

      // Show/hide based on distance
      if (this.forceShowTime > 0) {
        this.forceShowTime -= dt;
        this.mesh.visible = true;
      } else if (this.isAtDestination() && dist > 30) {
        this.mesh.visible = true;
      } else {
        this.mesh.visible = false;
      }

      this.speed = 15;
      if (this.isAtDestination() && this.coolDown <= 0) {
        this.wander();
      }
      this.moveAlongPath(dt);
    } else {
      // Angry: chase player at increasing speed
      this.speed += dt * 5;
      this.setDestination(playerPos);
      this.moveAlongPath(dt);

      // Teleport player on contact
      if (dist < 5 && player && baldi) {
        player.position.copy(this.playerTeleportPoint);
        player.position.y = player.height;
        baldi.position.copy(this.baldiTeleportPoint);
        baldi.syncMesh();
        this.active = false;
        this.mesh.visible = false;
      }
    }

    this.syncMesh();
  }

  giveLocation(pos: THREE.Vector3, flee: boolean) {
    if (!this.angry) {
      this.setDestination(pos);
      if (flee) {
        this.forceShowTime = 3;
      }
    }
  }
}
