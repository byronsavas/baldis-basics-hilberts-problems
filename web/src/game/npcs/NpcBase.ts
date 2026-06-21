import * as THREE from 'three';
import { resolveCylinderPenetration, slideMove, type AABB } from '../../engine/Physics';
import { pathfinder } from '../Pathfinding';

const textureLoader = new THREE.TextureLoader();

export abstract class NpcBase {
  position = new THREE.Vector3();
  speed = 0;
  active = true;

  protected path: THREE.Vector3[] = [];
  protected pathIndex = 0;
  protected destination = new THREE.Vector3();
  protected coolDown = 0;
  protected walls: AABB[] = [];
  protected collisionRadius: number;

  mesh: THREE.Group;
  protected spriteMesh: THREE.Mesh;
  protected spriteMaterial: THREE.MeshBasicMaterial;

  constructor(spritePath: string, spriteHeight = 8, spriteWidth?: number) {
    this.mesh = new THREE.Group();

    const tex = textureLoader.load(spritePath);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;

    this.spriteMaterial = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });

    const w = spriteWidth ?? spriteHeight * 0.6;
    // Slightly wider than the sprite so billboards don't visually clip walls.
    this.collisionRadius = Math.max(w * 0.55, 2);
    const geo = new THREE.PlaneGeometry(w, spriteHeight);
    this.spriteMesh = new THREE.Mesh(geo, this.spriteMaterial);
    this.spriteMesh.position.y = spriteHeight / 2;
    this.mesh.add(this.spriteMesh);
  }

  setWalls(walls: AABB[]) {
    this.walls = walls;
  }

  protected applyMove(move: THREE.Vector3) {
    if (move.lengthSq() === 0 || this.walls.length === 0) return;

    const maxStep = this.collisionRadius * 0.75;
    let remaining = move.length();
    const direction = move.clone().normalize();

    while (remaining > 0) {
      const step = Math.min(remaining, maxStep);
      const stepMove = direction.clone().multiplyScalar(step);
      const adjusted = slideMove(this.position, stepMove, this.collisionRadius, this.walls);
      this.position.add(adjusted);
      resolveCylinderPenetration(this.position, this.collisionRadius, this.walls);
      remaining -= step;
    }
  }

  protected resolveWallCollision() {
    if (this.walls.length === 0) return;
    resolveCylinderPenetration(this.position, this.collisionRadius, this.walls);
  }

  /** Call each frame so the sprite always faces the camera */
  billboardToCamera(camera: THREE.Camera) {
    this.spriteMesh.quaternion.copy(camera.quaternion);
  }

  setDestination(target: THREE.Vector3) {
    this.destination.copy(target);
    const fromId = pathfinder.findNearestWaypoint(this.position);
    const toId = pathfinder.findNearestWaypoint(target);
    this.path = pathfinder.findPath(fromId, toId);
    this.path.push(target.clone());
    this.pathIndex = 0;
  }

  protected moveAlongPath(dt: number) {
    if (this.path.length === 0 || this.speed <= 0) return;

    const target = this.path[this.pathIndex];
    if (!target) return;

    const direction = target.clone().sub(this.position);
    direction.y = 0;
    const dist = direction.length();

    if (dist < 1) {
      this.pathIndex++;
      if (this.pathIndex >= this.path.length) {
        this.path = [];
        this.pathIndex = 0;
      }
      return;
    }

    direction.normalize();
    const moveAmount = Math.min(this.speed * dt, dist);
    this.applyMove(direction.multiplyScalar(moveAmount));
    this.mesh.position.copy(this.position);
  }

  protected wander() {
    const wpId = pathfinder.getRandomWaypoint();
    const target = pathfinder.getWaypointPosition(wpId);
    this.setDestination(target);
    this.coolDown = 1;
  }

  protected wanderHallway() {
    const wpId = pathfinder.getRandomHallwayWaypoint();
    const target = pathfinder.getWaypointPosition(wpId);
    this.setDestination(target);
    this.coolDown = 1;
  }

  protected isAtDestination(): boolean {
    return this.path.length === 0 || this.position.distanceTo(this.destination) < 2;
  }

  abstract update(dt: number, playerPos: THREE.Vector3): void;

  syncMesh() {
    this.resolveWallCollision();
    this.mesh.position.copy(this.position);
  }
}
