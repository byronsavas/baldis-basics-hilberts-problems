import * as THREE from 'three';

export class Notebook {
  position: THREE.Vector3;
  mesh: THREE.Group;
  collected = false;
  respawnTime = 0;
  up = true;

  private bobPhase = Math.random() * Math.PI * 2;

  constructor(position: THREE.Vector3) {
    this.position = position.clone();
    this.mesh = new THREE.Group();

    const geo = new THREE.BoxGeometry(1.5, 2, 0.2);
    const mat = new THREE.MeshLambertMaterial({ color: 0x3366cc });
    const book = new THREE.Mesh(geo, mat);
    book.position.y = 1;
    this.mesh.add(book);

    // Spiral binding
    const spiralGeo = new THREE.BoxGeometry(0.1, 1.8, 0.4);
    const spiralMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const spiral = new THREE.Mesh(spiralGeo, spiralMat);
    spiral.position.set(-0.7, 1, 0);
    this.mesh.add(spiral);

    this.mesh.position.copy(this.position);
    this.mesh.name = 'Notebook';
  }

  update(dt: number, playerPos: THREE.Vector3, endlessMode: boolean) {
    if (!this.collected) {
      // Bob animation
      this.bobPhase += dt * 2;
      this.mesh.position.y = this.position.y + Math.sin(this.bobPhase) * 0.3;
      this.mesh.rotation.y += dt;
      return;
    }

    if (endlessMode && this.respawnTime > 0) {
      this.respawnTime -= dt;
      const dist = playerPos.distanceTo(this.position);
      if (this.respawnTime <= 0 && dist > 60) {
        this.respawn();
      }
    }
  }

  collect() {
    this.collected = true;
    this.up = false;
    this.mesh.visible = false;
    this.respawnTime = 120;
  }

  private respawn() {
    this.collected = false;
    this.up = true;
    this.mesh.visible = true;
  }

  isInteractable(playerPos: THREE.Vector3, maxDist = 10): boolean {
    return !this.collected && playerPos.distanceTo(this.position) < maxDist;
  }
}
