import * as THREE from 'three';
import { pathfinder } from '../Pathfinding';

export abstract class NpcBase {
  position = new THREE.Vector3();
  speed = 0;
  active = true;

  protected path: THREE.Vector3[] = [];
  protected pathIndex = 0;
  protected destination = new THREE.Vector3();
  protected coolDown = 0;

  mesh: THREE.Group;
  protected bodyMesh: THREE.Mesh;

  constructor(color: number, height = 6, width = 2) {
    this.mesh = new THREE.Group();
    const geo = new THREE.BoxGeometry(width, height, width);
    const mat = new THREE.MeshLambertMaterial({ color });
    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.position.y = height / 2;
    this.mesh.add(this.bodyMesh);
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
    this.position.add(direction.multiplyScalar(moveAmount));
    this.mesh.position.copy(this.position);

    // Face movement direction
    this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
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
    this.mesh.position.copy(this.position);
  }
}
