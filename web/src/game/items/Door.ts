import * as THREE from 'three';
import type { AABB } from '../../engine/Physics';

export class Door {
  position: THREE.Vector3;
  mesh: THREE.Group;
  isOpen = false;
  lockTime = 0;
  silentOpens = 0;

  barrierAABB: AABB;

  private openTime = 0;
  private openMaterial = new THREE.MeshLambertMaterial({ color: 0x885522, transparent: true, opacity: 0.3 });
  private closedMaterial = new THREE.MeshLambertMaterial({ color: 0x885522 });
  private lockedMaterial = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
  private doorMesh: THREE.Mesh;

  constructor(position: THREE.Vector3) {
    this.position = position.clone();
    this.mesh = new THREE.Group();

    const geo = new THREE.BoxGeometry(1, 8, 8);
    this.doorMesh = new THREE.Mesh(geo, this.closedMaterial);
    this.doorMesh.position.y = 4;
    this.mesh.add(this.doorMesh);

    this.mesh.position.copy(this.position);
    this.mesh.name = 'Door';

    this.barrierAABB = {
      min: new THREE.Vector3(position.x - 0.5, 0, position.z - 4),
      max: new THREE.Vector3(position.x + 0.5, 8, position.z + 4),
    };
  }

  update(dt: number) {
    if (this.lockTime > 0) {
      this.lockTime -= dt;
      if (this.lockTime <= 0) {
        this.unlock();
      }
    }

    if (this.isOpen) {
      this.openTime -= dt;
      if (this.openTime <= 0) {
        this.close();
      }
    }
  }

  open() {
    if (this.lockTime > 0) return;
    this.isOpen = true;
    this.openTime = 3;
    this.doorMesh.material = this.openMaterial;
  }

  close() {
    this.isOpen = false;
    this.doorMesh.material = this.closedMaterial;
  }

  lock(time: number) {
    this.lockTime = time;
    this.isOpen = false;
    this.doorMesh.material = this.lockedMaterial;
  }

  unlock() {
    this.lockTime = 0;
    this.doorMesh.material = this.closedMaterial;
  }

  silence() {
    this.silentOpens = 4;
  }

  isLocked(): boolean {
    return this.lockTime > 0;
  }

  getActiveAABB(): AABB | null {
    if (this.isOpen) return null;
    return this.barrierAABB;
  }
}
