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

  findNearestWaypoint(pos: THREE.Vector3): number {
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
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < this.waypoints.length; i++) {
      if (!this.waypoints[i].isHallway) continue;
      const d = pos.distanceTo(this.waypoints[i].position);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  getRandomWaypoint(): number {
    return Math.floor(Math.random() * this.waypoints.length);
  }

  getRandomHallwayWaypoint(): number {
    const hallways = this.waypoints.filter((w) => w.isHallway);
    if (hallways.length === 0) return this.getRandomWaypoint();
    const wp = hallways[Math.floor(Math.random() * hallways.length)];
    return wp.id;
  }

  getWaypointPosition(id: number): THREE.Vector3 {
    return this.waypoints[id].position.clone();
  }

  /**
   * A* pathfinding between two waypoint IDs.
   * Returns array of waypoint positions forming the path.
   */
  findPath(fromId: number, toId: number): THREE.Vector3[] {
    if (fromId === toId) return [this.waypoints[toId].position.clone()];

    const open = new Map<number, AStarNode>();
    const closed = new Set<number>();

    const startNode: AStarNode = {
      id: fromId,
      g: 0,
      h: this.heuristic(fromId, toId),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    open.set(fromId, startNode);

    while (open.size > 0) {
      let current: AStarNode | null = null;
      for (const node of open.values()) {
        if (!current || node.f < current.f) current = node;
      }
      if (!current) break;

      if (current.id === toId) {
        return this.reconstructPath(current, open, closed, fromId);
      }

      open.delete(current.id);
      closed.add(current.id);

      for (const neighborId of this.waypoints[current.id].neighbors) {
        if (closed.has(neighborId)) continue;

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
    open: Map<number, AStarNode>,
    _closed: Set<number>,
    _startId: number,
  ): THREE.Vector3[] {
    const allNodes = new Map<number, AStarNode>(open);

    const path: THREE.Vector3[] = [];
    let current: AStarNode | null | undefined = endNode;
    while (current) {
      path.unshift(this.waypoints[current.id].position.clone());
      if (current.parent === null) break;
      current = allNodes.get(current.parent);
      if (!current) {
        // Might be in closed set nodes we didn't store - just break
        break;
      }
    }
    return path;
  }
}

export const pathfinder = new Pathfinder();
