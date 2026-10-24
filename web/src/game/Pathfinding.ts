import * as THREE from 'three';
import type { WaypointDef } from './Map';

interface AStarNode {
  id: number;
  g: number;
  h: number;
  f: number;
  parent: number | null;
}

export class Pathfinder {
  private waypoints: WaypointDef[] = [];

  setWaypoints(wps: WaypointDef[]) {
    this.waypoints = wps;
  }

  private isValidId(id: number): boolean {
    return id >= 0 && id < this.waypoints.length;
  }

  findNearestWaypoint(pos: THREE.Vector3): number {
    if (this.waypoints.length === 0) return 0;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < this.waypoints.length; i++) {
      const d = pos.distanceTo(this.waypoints[i].position);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  findNearestHallwayWaypoint(pos: THREE.Vector3): number {
    if (this.waypoints.length === 0) return 0;
    let best = 0;
    let bestDist = Infinity;
    let found = false;
    for (let i = 0; i < this.waypoints.length; i++) {
      if (!this.waypoints[i].isHallway) continue;
      found = true;
      const d = pos.distanceTo(this.waypoints[i].position);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return found ? best : this.findNearestWaypoint(pos);
  }

  getRandomWaypoint(): number {
    if (this.waypoints.length === 0) return 0;
    return Math.floor(Math.random() * this.waypoints.length);
  }

  getRandomHallwayWaypoint(): number {
    const hallways = this.waypoints.filter((w) => w.isHallway);
    if (hallways.length === 0) return this.getRandomWaypoint();
    const wp = hallways[Math.floor(Math.random() * hallways.length)];
    return wp.id;
  }

  getWaypointPosition(id: number): THREE.Vector3 {
    if (!this.isValidId(id)) {
      return this.waypoints[0]?.position.clone() ?? new THREE.Vector3();
    }
    return this.waypoints[id].position.clone();
  }

  /**
   * A* pathfinding between two waypoint IDs.
   * Returns array of waypoint positions forming the path.
   */
  findPath(fromId: number, toId: number): THREE.Vector3[] {
    if (this.waypoints.length === 0) return [];
    if (!this.isValidId(fromId)) fromId = 0;
    if (!this.isValidId(toId)) toId = 0;
    if (fromId === toId) return [this.waypoints[toId].position.clone()];

    const open = new Map<number, AStarNode>();
    const closed = new Set<number>();
    // Keep every visited node so parent chains can be reconstructed
    const nodes = new Map<number, AStarNode>();

    const startNode: AStarNode = {
      id: fromId,
      g: 0,
      h: this.heuristic(fromId, toId),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    open.set(fromId, startNode);
    nodes.set(fromId, startNode);

    while (open.size > 0) {
      let current: AStarNode | null = null;
      for (const node of open.values()) {
        if (!current || node.f < current.f) current = node;
      }
      if (!current) break;

      if (current.id === toId) {
        return this.reconstructPath(current, nodes);
      }

      open.delete(current.id);
      closed.add(current.id);

      for (const neighborId of this.waypoints[current.id].neighbors) {
        if (closed.has(neighborId) || !this.isValidId(neighborId)) continue;

        const tentativeG =
          current.g +
          this.waypoints[current.id].position.distanceTo(this.waypoints[neighborId].position);

        const existing = open.get(neighborId);
        if (existing && tentativeG >= existing.g) continue;

        const node: AStarNode = {
          id: neighborId,
          g: tentativeG,
          h: this.heuristic(neighborId, toId),
          f: tentativeG + this.heuristic(neighborId, toId),
          parent: current.id,
        };
        open.set(neighborId, node);
        nodes.set(neighborId, node);
      }
    }

    // No path found, just go to target directly
    return [this.waypoints[toId].position.clone()];
  }

  private heuristic(a: number, b: number): number {
    return this.waypoints[a].position.distanceTo(this.waypoints[b].position);
  }

  private reconstructPath(
    endNode: AStarNode,
    nodes: Map<number, AStarNode>,
  ): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    let current: AStarNode | null | undefined = endNode;
    let guard = 0;
    while (current && guard++ < this.waypoints.length + 2) {
      path.unshift(this.waypoints[current.id].position.clone());
      if (current.parent === null) break;
      current = nodes.get(current.parent);
    }
    return path;
  }
}

export const pathfinder = new Pathfinder();
