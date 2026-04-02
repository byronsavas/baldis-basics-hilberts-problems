import * as THREE from 'three';
import type { AABB } from '../engine/Physics';
import { createBrickTexture, createFloorTexture, createHallFloorTexture, createCeilingTexture } from './Textures';

const WALL_HEIGHT = 10;
const CELL_SIZE = 10;
const FLOOR_Y = 0;

export enum CellType {
  Empty,
  Hall,
  Room,
  Wall,
}

/**
 * Simplified school layout: a grid-based map.
 * The original game has a roughly 18x18 tile area with hallways forming a cross/grid
 * pattern and rooms branching off. We represent this as a 2D grid.
 *
 * Legend (row, col): H = hallway, R = room, W = wall (default)
 */
const MAP_WIDTH = 19;
const MAP_HEIGHT = 19;

// prettier-ignore
const MAP_DATA: CellType[][] = (() => {
  const W = CellType.Wall;
  const H = CellType.Hall;
  const R = CellType.Room;
  return [
    //  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // 0
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 1
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 2
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 3
    [W, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, W], // 4
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 5
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 6
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 7
    [W, W, W, W, H, W, W, W, W, H, W, W, W, W, H, W, W, W, W], // 8
    [W, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, W], // 9
    [W, W, W, W, H, W, W, W, W, H, W, W, W, W, H, W, W, W, W], // 10
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 11
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 12
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 13
    [W, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, H, W], // 14
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 15
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 16
    [W, R, R, R, H, R, R, R, W, H, W, R, R, R, H, R, R, R, W], // 17
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W], // 18
  ];
})();

export interface WaypointDef {
  id: number;
  position: THREE.Vector3;
  isHallway: boolean;
  neighbors: number[];
}

export class SchoolMap {
  group = new THREE.Group();
  wallMeshes: THREE.Mesh[] = [];
  wallAABBs: AABB[] = [];
  floorMeshes: THREE.Mesh[] = [];
  waypoints: WaypointDef[] = [];
  doorPositions: { pos: THREE.Vector3; isSwinging: boolean }[] = [];
  notebookPositions: THREE.Vector3[] = [];
  exitPositions: THREE.Vector3[] = [];
  playerSpawn = new THREE.Vector3(9 * CELL_SIZE, 4, 4 * CELL_SIZE);

  private wallMaterial = new THREE.MeshLambertMaterial({ map: createBrickTexture() });
  private floorMaterial = new THREE.MeshLambertMaterial({ map: createFloorTexture() });
  private ceilingMaterial = new THREE.MeshLambertMaterial({ map: createCeilingTexture() });
  private hallFloorMaterial = new THREE.MeshLambertMaterial({ map: createHallFloorTexture() });
  private roomFloorMaterial = new THREE.MeshLambertMaterial({ map: createFloorTexture() });

  constructor() {
    this.buildGeometry();
    this.buildWaypoints();
    this.placeNotebooks();
    this.placeExits();
    this.placeDoors();
  }

  getCellType(row: number, col: number): CellType {
    if (row < 0 || row >= MAP_HEIGHT || col < 0 || col >= MAP_WIDTH) return CellType.Wall;
    return MAP_DATA[row][col];
  }

  worldToGrid(x: number, z: number): { row: number; col: number } {
    return {
      row: Math.floor(z / CELL_SIZE),
      col: Math.floor(x / CELL_SIZE),
    };
  }

  gridToWorld(row: number, col: number): THREE.Vector3 {
    return new THREE.Vector3(
      col * CELL_SIZE + CELL_SIZE / 2,
      4,
      row * CELL_SIZE + CELL_SIZE / 2,
    );
  }

  private buildGeometry() {
    for (let row = 0; row < MAP_HEIGHT; row++) {
      for (let col = 0; col < MAP_WIDTH; col++) {
        const cell = MAP_DATA[row][col];
        const x = col * CELL_SIZE;
        const z = row * CELL_SIZE;

        if (cell === CellType.Wall) {
          this.addWall(x, z);
        } else {
          const floorMat = cell === CellType.Hall ? this.hallFloorMaterial : this.roomFloorMaterial;
          this.addFloorCeiling(x, z, floorMat);
        }
      }
    }

    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.group.add(ambient);

    // A few point lights along hallways
    const lightPositions = [
      [4, 4], [9, 4], [14, 4],
      [4, 9], [9, 9], [14, 9],
      [4, 14], [9, 14], [14, 14],
    ];
    for (const [col, row] of lightPositions) {
      const light = new THREE.PointLight(0xffe8c0, 0.8, CELL_SIZE * 6);
      light.position.set(col * CELL_SIZE + CELL_SIZE / 2, WALL_HEIGHT - 1, row * CELL_SIZE + CELL_SIZE / 2);
      this.group.add(light);
    }
  }

  private addWall(x: number, z: number) {
    const geo = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    const mesh = new THREE.Mesh(geo, this.wallMaterial);
    mesh.position.set(x + CELL_SIZE / 2, WALL_HEIGHT / 2, z + CELL_SIZE / 2);
    mesh.name = 'wall';
    mesh.updateMatrixWorld(true);
    this.group.add(mesh);
    this.wallMeshes.push(mesh);

    this.wallAABBs.push({
      min: new THREE.Vector3(x, 0, z),
      max: new THREE.Vector3(x + CELL_SIZE, WALL_HEIGHT, z + CELL_SIZE),
    });
  }

  private addFloorCeiling(x: number, z: number, mat: THREE.Material) {
    const floorGeo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
    const floor = new THREE.Mesh(floorGeo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x + CELL_SIZE / 2, FLOOR_Y, z + CELL_SIZE / 2);
    this.group.add(floor);
    this.floorMeshes.push(floor);

    const ceiling = new THREE.Mesh(floorGeo.clone(), this.ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(x + CELL_SIZE / 2, WALL_HEIGHT, z + CELL_SIZE / 2);
    this.group.add(ceiling);
  }

  private buildWaypoints() {
    // Place waypoints at hallway intersections and midpoints
    let id = 0;
    const waypointGrid: (number | null)[][] = Array.from({ length: MAP_HEIGHT }, () =>
      Array(MAP_WIDTH).fill(null),
    );

    // Hallway cells at key positions become waypoints
    const wpPositions = [
      // Main horizontal hallway intersections (row 4, 9, 14)
      [4, 1], [4, 4], [4, 9], [4, 14], [4, 17],
      [9, 1], [9, 4], [9, 9], [9, 14], [9, 17],
      [14, 1], [14, 4], [14, 9], [14, 14], [14, 17],
      // Vertical hallway midpoints
      [1, 4], [1, 9], [1, 14],
      [7, 4], [7, 9], [7, 14],
      [11, 4], [11, 9], [11, 14],
      [17, 4], [17, 9], [17, 14],
      // Room centers (a few)
      [2, 2], [2, 6], [2, 12], [2, 16],
    ];

    for (const [row, col] of wpPositions) {
      if (id >= 29) break;
      const cell = this.getCellType(row, col);
      const wp: WaypointDef = {
        id,
        position: this.gridToWorld(row, col),
        isHallway: cell === CellType.Hall,
        neighbors: [],
      };
      waypointGrid[row][col] = id;
      this.waypoints.push(wp);
      id++;
    }

    // Connect neighbors by proximity (within ~6 cells distance and line-of-sight through non-wall)
    for (let i = 0; i < this.waypoints.length; i++) {
      for (let j = i + 1; j < this.waypoints.length; j++) {
        const dist = this.waypoints[i].position.distanceTo(this.waypoints[j].position);
        if (dist < CELL_SIZE * 6 && this.hasLineOfSight(this.waypoints[i].position, this.waypoints[j].position)) {
          this.waypoints[i].neighbors.push(j);
          this.waypoints[j].neighbors.push(i);
        }
      }
    }
  }

  private hasLineOfSight(a: THREE.Vector3, b: THREE.Vector3): boolean {
    const steps = Math.ceil(a.distanceTo(b) / (CELL_SIZE / 2));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = a.x + (b.x - a.x) * t;
      const pz = a.z + (b.z - a.z) * t;
      const { row, col } = this.worldToGrid(px, pz);
      if (this.getCellType(row, col) === CellType.Wall) return false;
    }
    return true;
  }

  private placeNotebooks() {
    // 7 notebooks in various rooms
    const positions = [
      [2, 2], [2, 12], [6, 6], [6, 16],
      [12, 2], [12, 12], [16, 6],
    ];
    for (const [row, col] of positions) {
      this.notebookPositions.push(this.gridToWorld(row, col));
    }
  }

  private placeExits() {
    // 3 exits on edges
    this.exitPositions.push(
      new THREE.Vector3(0 * CELL_SIZE + CELL_SIZE / 2, 4, 9 * CELL_SIZE + CELL_SIZE / 2),
      new THREE.Vector3(18 * CELL_SIZE + CELL_SIZE / 2, 4, 9 * CELL_SIZE + CELL_SIZE / 2),
      new THREE.Vector3(9 * CELL_SIZE + CELL_SIZE / 2, 4, 18 * CELL_SIZE + CELL_SIZE / 2),
    );
  }

  private placeDoors() {
    // Doors at room entrances along hallways
    const doorCells = [
      // Doors between rooms and vertical hallways
      { row: 1, col: 4, swing: false }, { row: 3, col: 4, swing: false },
      { row: 5, col: 4, swing: false }, { row: 7, col: 4, swing: false },
      { row: 1, col: 14, swing: false }, { row: 3, col: 14, swing: false },
      { row: 5, col: 14, swing: false }, { row: 7, col: 14, swing: false },
      { row: 11, col: 4, swing: false }, { row: 13, col: 4, swing: false },
      { row: 15, col: 4, swing: false }, { row: 17, col: 4, swing: false },
      { row: 11, col: 14, swing: false }, { row: 13, col: 14, swing: false },
      { row: 15, col: 14, swing: false }, { row: 17, col: 14, swing: false },
      // Swinging doors at major intersections
      { row: 4, col: 8, swing: true }, { row: 4, col: 10, swing: true },
      { row: 14, col: 8, swing: true }, { row: 14, col: 10, swing: true },
    ];
    for (const d of doorCells) {
      this.doorPositions.push({
        pos: this.gridToWorld(d.row, d.col),
        isSwinging: d.swing,
      });
    }
  }
}
