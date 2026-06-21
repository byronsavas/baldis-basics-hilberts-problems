import * as THREE from 'three';

export interface AABB {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export function aabbFromMesh(mesh: THREE.Mesh): AABB {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox!.clone();
  box.applyMatrix4(mesh.matrixWorld);
  return { min: box.min, max: box.max };
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.min.x <= b.max.x && a.max.x >= b.min.x &&
    a.min.y <= b.max.y && a.max.y >= b.min.y &&
    a.min.z <= b.max.z && a.max.z >= b.min.z
  );
}

export function pointInAABB(point: THREE.Vector3, box: AABB): boolean {
  return (
    point.x >= box.min.x && point.x <= box.max.x &&
    point.y >= box.min.y && point.y <= box.max.y &&
    point.z >= box.min.z && point.z <= box.max.z
  );
}

const EXPAND_Y = new THREE.Vector3(0, 10, 0);

function cylinderOverlapsWall(
  position: THREE.Vector3,
  radius: number,
  wall: AABB,
  expandedMin: THREE.Vector3,
  expandedMax: THREE.Vector3,
): boolean {
  expandedMin.copy(wall.min).sub(new THREE.Vector3(radius, 0, radius));
  expandedMax.copy(wall.max).add(EXPAND_Y).add(new THREE.Vector3(radius, 0, radius));
  return (
    position.x >= expandedMin.x && position.x <= expandedMax.x &&
    position.y >= expandedMin.y && position.y <= expandedMax.y &&
    position.z >= expandedMin.z && position.z <= expandedMax.z
  );
}

function pushOutOfWall(
  position: THREE.Vector3,
  radius: number,
  wall: AABB,
  expandedMin: THREE.Vector3,
  expandedMax: THREE.Vector3,
): void {
  expandedMin.copy(wall.min).sub(new THREE.Vector3(radius, 0, radius));
  expandedMax.copy(wall.max).add(EXPAND_Y).add(new THREE.Vector3(radius, 0, radius));

  const overlapX1 = position.x - expandedMin.x;
  const overlapX2 = expandedMax.x - position.x;
  const overlapZ1 = position.z - expandedMin.z;
  const overlapZ2 = expandedMax.z - position.z;

  const minOverlap = Math.min(overlapX1, overlapX2, overlapZ1, overlapZ2);

  if (minOverlap === overlapX1) position.x = expandedMin.x + 0.001;
  else if (minOverlap === overlapX2) position.x = expandedMax.x - 0.001;
  else if (minOverlap === overlapZ1) position.z = expandedMin.z + 0.001;
  else position.z = expandedMax.z - 0.001;
}

/**
 * Push a cylinder out of any wall AABBs it currently overlaps.
 */
export function resolveCylinderPenetration(
  position: THREE.Vector3,
  radius: number,
  walls: AABB[],
): void {
  const expandedMin = new THREE.Vector3();
  const expandedMax = new THREE.Vector3();

  for (let pass = 0; pass < 6; pass++) {
    let moved = false;
    for (const wall of walls) {
      if (cylinderOverlapsWall(position, radius, wall, expandedMin, expandedMax)) {
        pushOutOfWall(position, radius, wall, expandedMin, expandedMax);
        moved = true;
      }
    }
    if (!moved) break;
  }
}

/**
 * Slide a cylinder (player/NPC) against wall AABBs.
 * Returns the adjusted movement vector.
 */
export function slideMove(
  position: THREE.Vector3,
  movement: THREE.Vector3,
  radius: number,
  walls: AABB[],
): THREE.Vector3 {
  const result = movement.clone();
  const newPos = new THREE.Vector3();
  const expandedMin = new THREE.Vector3();
  const expandedMax = new THREE.Vector3();

  for (let pass = 0; pass < 4; pass++) {
    let adjusted = false;
    newPos.copy(position).add(result);

    for (const wall of walls) {
      if (cylinderOverlapsWall(newPos, radius, wall, expandedMin, expandedMax)) {
        pushOutOfWall(newPos, radius, wall, expandedMin, expandedMax);
        result.copy(newPos).sub(position);
        adjusted = true;
      }
    }

    if (!adjusted) break;
  }

  return result;
}

/**
 * Check distance-based trigger overlap between two positions (XZ plane only).
 */
export function checkTrigger(
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
): boolean {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz < radius * radius;
}

/** Horizontal (XZ) distance between two world positions. */
export function horizontalDistance(a: THREE.Vector3, b: THREE.Vector3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Raycast from screen center against objects (Three.js raycaster wrapper).
 */
export function raycastFromCamera(
  camera: THREE.Camera,
  objects: THREE.Object3D[],
  maxDistance = 10,
): THREE.Intersection | null {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  raycaster.far = maxDistance;
  const hits = raycaster.intersectObjects(objects, true);
  return hits.length > 0 ? hits[0] : null;
}

/**
 * Raycast between two 3D points, checking for obstacles.
 */
export function raycastBetween(
  from: THREE.Vector3,
  to: THREE.Vector3,
  obstacles: THREE.Object3D[],
): { hit: boolean; object?: THREE.Object3D; distance?: number } {
  const direction = to.clone().sub(from).normalize();
  const distance = from.distanceTo(to);
  const raycaster = new THREE.Raycaster(from, direction, 0, distance);
  const hits = raycaster.intersectObjects(obstacles, true);
  if (hits.length > 0) {
    return { hit: true, object: hits[0].object, distance: hits[0].distance };
  }
  return { hit: false };
}
