import * as THREE from 'three';
import type { Baldi } from '../npcs/Baldi';

export class AlarmClock {
  position: THREE.Vector3;
  timeLeft = 30;
  totalLife = 35;
  rang = false;
  alive = true;

  mesh: THREE.Mesh;

  constructor(position: THREE.Vector3) {
    this.position = position.clone();
    const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.position);
    this.mesh.position.y = 1;
    this.mesh.name = 'AlarmClock';
  }

  update(dt: number, baldi?: Baldi) {
    if (!this.alive) return;

    this.timeLeft -= dt;
    this.totalLife -= dt;

    if (this.timeLeft <= 0 && !this.rang) {
      this.rang = true;
      if (baldi?.active) {
        baldi.hear(this.position, 8);
      }
    }

    if (this.totalLife <= 0) {
      this.alive = false;
      this.mesh.visible = false;
    }
  }
}
