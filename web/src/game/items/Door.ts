import * as THREE from 'three';
import type { AABB } from '../../engine/Physics';
import { createDoorTexture } from '../Textures';
import { SFXPlayer } from '../MusicGenerator';

export class Door {
  position: THREE.Vector3;
  mesh: THREE.Group;
  isOpen = false;
  lockTime = 0;
  silentOpens = 0;

  barrierAABB: AABB;

  private openTime = 0;
  private openMaterial = new THREE.MeshLambertMaterial({ map: createDoorTexture(true), transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  private closedMaterial = new THREE.MeshLambertMaterial({ map: createDoorTexture(false), side: THREE.DoubleSide });
  private lockedMaterial = new THREE.MeshLambertMaterial({ map: createDoorTexture(false), color: 0xff6666, side: THREE.DoubleSide });
  private doorMesh: THREE.Mesh;

  constructor(position: THREE.Vector3, horizontal = true) {
    this.position = position.clone();
    this.mesh = new THREE.Group();

    const geo = new THREE.PlaneGeometry(8, 10);
    this.doorMesh = new THREE.Mesh(geo, this.closedMaterial);
    this.doorMesh.position.y = 5;
    if (!horizontal) {
      this.doorMesh.rotation.y = Math.PI / 2;
    }
    this.mesh.add(this.doorMesh);

    this.mesh.position.copy(this.position);
    this.mesh.name = 'Door';

    if (horizontal) {
      this.barrierAABB = {
        min: new THREE.Vector3(position.x - 4, 0, position.z - 0.5),
        max: new THREE.Vector3(position.x + 4, 10, position.z + 0.5),
      };
    } else {
      this.barrierAABB = {
        min: new THREE.Vector3(position.x - 0.5, 0, position.z - 4),
        max: new THREE.Vector3(position.x + 0.5, 10, position.z + 4),
      };
    }
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
    if (!this.isOpen && this.silentOpens <= 0) SFXPlayer.playDoorOpen();
    if (this.silentOpens > 0) this.silentOpens--;
    this.isOpen = true;
    this.openTime = 3;
    this.doorMesh.material = this.openMaterial;
  }

  close() {
    if (this.isOpen) SFXPlayer.playDoorClose();
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
