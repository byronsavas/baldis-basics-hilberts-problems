import * as THREE from 'three';
import { resolveCylinderPenetration, slideMove, type AABB } from '../../engine/Physics';
import { assetUrl } from '../../engine/assetUrl';
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
  private readonly moveDir = new THREE.Vector3();
  private readonly stepMove = new THREE.Vector3();
  private readonly pathDir = new THREE.Vector3();
  private readonly lastPathTarget = new THREE.Vector3();
  private repathTimer = 0;
  private static readonly REPATH_INTERVAL = 0.4;
  private static readonly REPATH_MOVE_SQ = 16; // 4 units

  mesh: THREE.Group;
  protected spriteMesh: THREE.Mesh;
  protected spriteMaterial: THREE.MeshBasicMaterial;

  constructor(spritePath: string, spriteHeight = 8, spriteWidth?: number) {
    this.mesh = new THREE.Group();

    const tex = textureLoader.load(assetUrl(spritePath));
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
    this.moveDir.copy(move).multiplyScalar(1 / remaining);

    while (remaining > 0) {
      const step = Math.min(remaining, maxStep);
      this.stepMove.copy(this.moveDir).multiplyScalar(step);
      slideMove(this.position, this.stepMove, this.collisionRadius, this.walls);
      this.position.add(this.stepMove);
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

    // Throttle A*: chasing NPCs used to repath every frame and freeze the tab
    const movedFar = this.lastPathTarget.distanceToSquared(target) > NpcBase.REPATH_MOVE_SQ;
    if (this.path.length > 0 && this.repathTimer > 0 && !movedFar) {
      this.path[this.path.length - 1].copy(target);
      return;
    }

    this.repathTimer = NpcBase.REPATH_INTERVAL;
    this.lastPathTarget.copy(target);
    const fromId = pathfinder.findNearestWaypoint(this.position);
    const toId = pathfinder.findNearestWaypoint(target);
    this.path = pathfinder.findPath(fromId, toId);
    this.path.push(target.clone());
    this.pathIndex = 0;
  }

  protected moveAlongPath(dt: number) {
    if (this.repathTimer > 0) this.repathTimer -= dt;
    if (this.path.length === 0 || this.speed <= 0) return;

    const target = this.path[this.pathIndex];
    if (!target) return;

    this.pathDir.copy(target).sub(this.position);
    this.pathDir.y = 0;
    const dist = this.pathDir.length();

    if (dist < 1) {
      this.pathIndex++;
      if (this.pathIndex >= this.path.length) {
        this.path = [];
        this.pathIndex = 0;
      }
      return;
    }

    this.pathDir.multiplyScalar(1 / dist);
    const moveAmount = Math.min(this.speed * dt, dist);
    this.applyMove(this.pathDir.multiplyScalar(moveAmount));
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
