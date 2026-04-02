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

/**
 * Slide a cylinder (player) against wall AABBs.
 * Returns the adjusted movement vector.
 */
export function slideMove(
  position: THREE.Vector3,
  movement: THREE.Vector3,
  radius: number,
  walls: AABB[],
): THREE.Vector3 {
  const result = movement.clone();
  const newPos = position.clone().add(result);

  for (const wall of walls) {
    const expandedMin = wall.min.clone().sub(new THREE.Vector3(radius, 0, radius));
    const expandedMax = wall.max.clone().add(new THREE.Vector3(radius, 10, radius));

    if (
      newPos.x >= expandedMin.x && newPos.x <= expandedMax.x &&
      newPos.y >= expandedMin.y && newPos.y <= expandedMax.y &&
      newPos.z >= expandedMin.z && newPos.z <= expandedMax.z
    ) {
      const overlapX1 = newPos.x - expandedMin.x;
      const overlapX2 = expandedMax.x - newPos.x;
      const overlapZ1 = newPos.z - expandedMin.z;
      const overlapZ2 = expandedMax.z - newPos.z;

      const minOverlap = Math.min(overlapX1, overlapX2, overlapZ1, overlapZ2);

      if (minOverlap === overlapX1) result.x += expandedMin.x - newPos.x + 0.001;
      else if (minOverlap === overlapX2) result.x += expandedMax.x - newPos.x - 0.001;
      else if (minOverlap === overlapZ1) result.z += expandedMin.z - newPos.z + 0.001;
      else result.z += expandedMax.z - newPos.z - 0.001;

      newPos.copy(position).add(result);
    }
  }

  return result;
}

/**
 * Check distance-based trigger overlap between two positions.
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
