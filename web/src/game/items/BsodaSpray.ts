import * as THREE from 'three';

export class BsodaSpray {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed = 40;
  lifeSpan = 30;
  alive = true;

  mesh: THREE.Mesh;

  constructor(position: THREE.Vector3, direction: THREE.Vector3) {
    this.position = position.clone();
    this.direction = direction.clone().normalize();

    const geo = new THREE.SphereGeometry(0.5, 8, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x00aaff });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.position);
    this.mesh.name = 'BSODA';
  }

  update(dt: number) {
    if (!this.alive) return;

    this.position.add(this.direction.clone().multiplyScalar(this.speed * dt));
    this.mesh.position.copy(this.position);

    this.lifeSpan -= dt;
    if (this.lifeSpan <= 0) {
      this.alive = false;
      this.mesh.visible = false;
    }
  }
}
