import * as THREE from 'three';
import type { AABB } from '../../engine/Physics';

export class SwingingDoor {
  position: THREE.Vector3;
  mesh: THREE.Group;
  isOpen = false;
  isLocked = true;
  requirementMet = false;

  barrierAABB: AABB;

  private openTime = 0;
  private doorMesh: THREE.Mesh;
  private openMaterial = new THREE.MeshLambertMaterial({ color: 0x228844, transparent: true, opacity: 0.3 });
  private closedMaterial = new THREE.MeshLambertMaterial({ color: 0x228844 });
  private lockedMaterial = new THREE.MeshLambertMaterial({ color: 0x882222 });

  constructor(position: THREE.Vector3) {
    this.position = position.clone();
    this.mesh = new THREE.Group();

    const geo = new THREE.BoxGeometry(2, 8, 10);
    this.doorMesh = new THREE.Mesh(geo, this.lockedMaterial);
    this.doorMesh.position.y = 4;
    this.mesh.add(this.doorMesh);

    this.mesh.position.copy(this.position);
    this.mesh.name = 'SwingingDoor';

    this.barrierAABB = {
      min: new THREE.Vector3(position.x - 1, 0, position.z - 5),
      max: new THREE.Vector3(position.x + 1, 8, position.z + 5),
    };
  }

  update(dt: number, notebookCount: number) {
    if (!this.requirementMet && notebookCount >= 2) {
      this.requirementMet = true;
      this.unlock();
    }

    if (this.isOpen) {
      this.openTime -= dt;
      if (this.openTime <= 0) {
        this.close();
      }
    }
  }

  open() {
    if (this.isLocked) return;
    this.isOpen = true;
    this.openTime = 2;
    this.doorMesh.material = this.openMaterial;
  }

  close() {
    this.isOpen = false;
    if (this.isLocked) {
      this.doorMesh.material = this.lockedMaterial;
    } else {
      this.doorMesh.material = this.closedMaterial;
    }
  }

  lock() {
    this.isLocked = true;
    this.doorMesh.material = this.lockedMaterial;
  }

  unlock() {
    this.isLocked = false;
    this.doorMesh.material = this.closedMaterial;
  }

  getActiveAABB(): AABB | null {
    if (this.isOpen) return null;
    return this.barrierAABB;
  }
}
