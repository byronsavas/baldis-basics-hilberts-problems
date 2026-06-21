import * as THREE from 'three';
import type { AABB } from '../engine/Physics';
import { createBrickTexture, createFloorTexture, createHallFloorTexture, createCeilingTexture } from './Textures';
import { CellType, gridToCellType, type LevelData } from './LevelData';

export { CellType } from './LevelData';
export type { LevelData, LevelDoorDef } from './LevelData';

const WALL_HEIGHT = 10;
const FLOOR_Y = 0;

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
  doorPositions: { pos: THREE.Vector3; isSwinging: boolean; horizontal: boolean }[] = [];
  notebookPositions: THREE.Vector3[] = [];
  exitPositions: THREE.Vector3[] = [];
  playerSpawn = new THREE.Vector3();

  private level: LevelData;
  private cellSize: number;
  private mapWidth: number;
  private mapHeight: number;

  private wallMaterial = new THREE.MeshLambertMaterial({ map: createBrickTexture() });
  private floorMaterial = new THREE.MeshLambertMaterial({ map: createFloorTexture() });
  private ceilingMaterial = new THREE.MeshLambertMaterial({ map: createCeilingTexture() });
  private hallFloorMaterial = new THREE.MeshLambertMaterial({ map: createHallFloorTexture() });
  private roomFloorMaterial = new THREE.MeshLambertMaterial({ map: createFloorTexture() });

  constructor(level: LevelData) {
    this.level = level;
    this.cellSize = level.cellSize;
    this.mapWidth = level.width;
    this.mapHeight = level.height;
    this.playerSpawn = this.gridToWorld(level.playerSpawn[0], level.playerSpawn[1]);
    this.playerSpawn.y = 4;

    this.buildGeometry();
    this.buildWaypoints();
    this.placeNotebooks();
    this.placeExits();
    this.placeDoors();
  }

  getCellType(row: number, col: number) {
    if (row < 0 || row >= this.mapHeight || col < 0 || col >= this.mapWidth) {
      return CellType.Wall;
    }
    return gridToCellType(this.level.grid[row][col]);
  }

  worldToGrid(x: number, z: number): { row: number; col: number } {
    return {
      row: Math.floor(z / this.cellSize),
      col: Math.floor(x / this.cellSize),
    };
  }

  gridToWorld(row: number, col: number): THREE.Vector3 {
    return new THREE.Vector3(
      col * this.cellSize + this.cellSize / 2,
      0,
      row * this.cellSize + this.cellSize / 2,
    );
  }

  private buildGeometry() {
    for (let row = 0; row < this.mapHeight; row++) {
      for (let col = 0; col < this.mapWidth; col++) {
        const cell = this.getCellType(row, col);
        const x = col * this.cellSize;
        const z = row * this.cellSize;

        if (cell === CellType.Wall) {
          this.addWall(x, z);
        } else {
          const floorMat = cell === CellType.Hall ? this.hallFloorMaterial : this.roomFloorMaterial;
          this.addFloorCeiling(x, z, floorMat);
        }
      }
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.group.add(ambient);

    const lightPositions = [
      [4, 4], [9, 4], [14, 4],
      [4, 9], [9, 9], [14, 9],
      [4, 14], [9, 14], [14, 14],
    ];
    for (const [col, row] of lightPositions) {
      const light = new THREE.PointLight(0xffe8c0, 0.8, this.cellSize * 6);
      light.position.set(
        col * this.cellSize + this.cellSize / 2,
        WALL_HEIGHT - 1,
        row * this.cellSize + this.cellSize / 2,
      );
      this.group.add(light);
    }
  }

  private addWall(x: number, z: number) {
    const geo = new THREE.BoxGeometry(this.cellSize, WALL_HEIGHT, this.cellSize);
    const mesh = new THREE.Mesh(geo, this.wallMaterial);
    mesh.position.set(x + this.cellSize / 2, WALL_HEIGHT / 2, z + this.cellSize / 2);
    mesh.name = 'wall';
    mesh.updateMatrixWorld(true);
    this.group.add(mesh);
    this.wallMeshes.push(mesh);

    this.wallAABBs.push({
      min: new THREE.Vector3(x, 0, z),
      max: new THREE.Vector3(x + this.cellSize, WALL_HEIGHT, z + this.cellSize),
    });
  }

  private addFloorCeiling(x: number, z: number, mat: THREE.Material) {
    const floorGeo = new THREE.PlaneGeometry(this.cellSize, this.cellSize);
    const floor = new THREE.Mesh(floorGeo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x + this.cellSize / 2, FLOOR_Y, z + this.cellSize / 2);
    this.group.add(floor);
    this.floorMeshes.push(floor);

    const ceiling = new THREE.Mesh(floorGeo.clone(), this.ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(x + this.cellSize / 2, WALL_HEIGHT, z + this.cellSize / 2);
    this.group.add(ceiling);
  }

  private buildWaypoints() {
    let id = 0;
    const wpPositions = [
      [4, 1], [4, 4], [4, 9], [4, 14], [4, 17],
      [9, 1], [9, 4], [9, 9], [9, 14], [9, 17],
      [14, 1], [14, 4], [14, 9], [14, 14], [14, 17],
      [1, 4], [1, 9], [1, 14],
      [7, 4], [7, 9], [7, 14],
      [11, 4], [11, 9], [11, 14],
      [17, 4], [17, 9], [17, 14],
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
      this.waypoints.push(wp);
      id++;
    }

    for (let i = 0; i < this.waypoints.length; i++) {
      for (let j = i + 1; j < this.waypoints.length; j++) {
        const dist = this.waypoints[i].position.distanceTo(this.waypoints[j].position);
        if (dist < this.cellSize * 6 && this.hasLineOfSight(this.waypoints[i].position, this.waypoints[j].position)) {
          this.waypoints[i].neighbors.push(j);
          this.waypoints[j].neighbors.push(i);
        }
      }
    }
  }

  private hasLineOfSight(a: THREE.Vector3, b: THREE.Vector3): boolean {
    const steps = Math.ceil(a.distanceTo(b) / (this.cellSize / 2));
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
    for (const [row, col] of this.level.notebooks) {
      this.notebookPositions.push(this.gridToWorld(row, col));
    }
  }

  private placeExits() {
    for (const [row, col] of this.level.exits) {
      const pos = this.gridToWorld(row, col);
      pos.y = 4;
      this.exitPositions.push(pos);
    }
  }

  private placeDoors() {
    for (const d of this.level.doors) {
      this.doorPositions.push({
        pos: this.gridToWorld(d.row, d.col),
        isSwinging: d.swinging,
        horizontal: d.horizontal,
      });
    }
  }
}
