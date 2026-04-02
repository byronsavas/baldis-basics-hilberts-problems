import * as THREE from 'three';
import { pathfinder } from '../Pathfinding';

export class Bully {
  position = new THREE.Vector3();
  active = false;
  spoken = false;
  guilt = 0;

  mesh: THREE.Group;
  private waitTime = 0;
  private activeTime = 0;
  private bodyMesh: THREE.Mesh;

  constructor() {
    this.mesh = new THREE.Group();
    const geo = new THREE.BoxGeometry(2.5, 5, 2.5);
    const mat = new THREE.MeshLambertMaterial({ color: 0xdd8844 });
    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.position.y = 2.5;
    this.mesh.add(this.bodyMesh);
    this.mesh.visible = false;
    this.reset();
  }

  update(dt: number, playerPos: THREE.Vector3) {
    if (this.active) {
      this.activeTime += dt;

      // Despawn if active too long and player is far
      if (this.activeTime > 180 && this.position.distanceTo(playerPos) > 120) {
        this.reset();
        return;
      }

      // Show taunt if player is close
      const dist = this.position.distanceTo(playerPos);
      if (dist < 30 && !this.spoken) {
        this.spoken = true;
        this.guilt = 10;
      }
    } else {
      this.waitTime -= dt;
      if (this.waitTime <= 0) {
        this.activate(playerPos);
      }
    }
  }

  private activate(playerPos: THREE.Vector3) {
    // Spawn at a random hallway location far from player
    let attempts = 0;
    while (attempts < 20) {
      const wpId = pathfinder.getRandomHallwayWaypoint();
      const pos = pathfinder.getWaypointPosition(wpId);
      if (pos.distanceTo(playerPos) > 20) {
        this.position.copy(pos);
        break;
      }
      attempts++;
    }

    this.active = true;
    this.spoken = false;
    this.activeTime = 0;
    this.guilt = 0;
    this.mesh.visible = true;
    this.mesh.position.copy(this.position);
  }

  reset() {
    this.active = false;
    this.mesh.visible = false;
    this.waitTime = 60 + Math.random() * 60;
    this.guilt = 0;
    this.spoken = false;
  }

  /**
   * Returns true if bully wants to steal an item from player.
   * Called when player collides with bully.
   */
  tryStealItem(playerItems: number[]): number | null {
    if (!this.active) return null;

    const filledSlots = playerItems
      .map((item, idx) => ({ item, idx }))
      .filter((s) => s.item !== 0);

    if (filledSlots.length === 0) {
      return null; // "You don't have anything for me!" - denied
    }

    const victim = filledSlots[Math.floor(Math.random() * filledSlots.length)];
    this.reset();
    return victim.idx;
  }
}
