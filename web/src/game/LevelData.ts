export enum CellType {
  Empty,
  Hall,
  Room,
  Wall,
}

export interface LevelDoorDef {
  row: number;
  col: number;
  swinging: boolean;
  horizontal: boolean;
}

export interface LevelData {
  version: 1;
  name: string;
  width: number;
  height: number;
  cellSize: number;
  grid: number[][];
  playerSpawn: [number, number];
  notebooks: [number, number][];
  exits: [number, number][];
  doors: LevelDoorDef[];
}

export const GRID_WALL = 0;
export const GRID_HALL = 1;
export const GRID_ROOM = 2;

export function cellTypeToGrid(cell: CellType): number {
  switch (cell) {
    case CellType.Hall:
      return GRID_HALL;
    case CellType.Room:
      return GRID_ROOM;
    default:
      return GRID_WALL;
  }
}

export function gridToCellType(value: number): CellType {
  switch (value) {
    case GRID_HALL:
      return CellType.Hall;
    case GRID_ROOM:
      return CellType.Room;
    default:
      return CellType.Wall;
  }
}

export function createEmptyLevel(width = 19, height = 19, cellSize = 10): LevelData {
  const grid = Array.from({ length: height }, () => Array(width).fill(GRID_WALL));
  return {
    version: 1,
    name: 'Untitled Level',
    width,
    height,
    cellSize,
    grid,
    playerSpawn: [Math.floor(height / 2), Math.floor(width / 2)],
    notebooks: [],
    exits: [],
    doors: [],
  };
}

function isGridCoord(level: Pick<LevelData, 'width' | 'height'>, row: number, col: number): boolean {
  return row >= 0 && row < level.height && col >= 0 && col < level.width;
}

export function validateLevel(raw: unknown): LevelData {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Level data must be an object');
  }

  const data = raw as Partial<LevelData>;
  if (data.version !== 1) throw new Error('Unsupported level version');
  if (!data.name || typeof data.name !== 'string') throw new Error('Level name is required');
  if (!Number.isFinite(data.width) || !Number.isFinite(data.height)) {
    throw new Error('Level width and height are required');
  }
  if (!Number.isFinite(data.cellSize) || (data.cellSize ?? 0) <= 0) {
    throw new Error('Level cellSize must be a positive number');
  }

  const width = data.width!;
  const height = data.height!;
  const cellSize = data.cellSize!;

  if (!Array.isArray(data.grid) || data.grid.length !== height) {
    throw new Error(`Grid must have ${height} rows`);
  }

  const grid = data.grid.map((row, rowIdx) => {
    if (!Array.isArray(row) || row.length !== width) {
      throw new Error(`Grid row ${rowIdx} must have ${width} columns`);
    }
    return row.map((cell) => {
      if (cell !== GRID_WALL && cell !== GRID_HALL && cell !== GRID_ROOM) {
        throw new Error(`Invalid cell value ${cell} at row ${rowIdx}`);
      }
      return cell;
    });
  });

  if (!Array.isArray(data.playerSpawn) || data.playerSpawn.length !== 2) {
    throw new Error('playerSpawn must be [row, col]');
  }
  const playerSpawn = data.playerSpawn as [number, number];
  if (!isGridCoord({ width, height }, playerSpawn[0], playerSpawn[1])) {
    throw new Error('playerSpawn is out of bounds');
  }

  const notebooks = (data.notebooks ?? []).map((pos, i) => {
    if (!Array.isArray(pos) || pos.length !== 2) {
      throw new Error(`Notebook ${i} must be [row, col]`);
    }
    if (!isGridCoord({ width, height }, pos[0], pos[1])) {
      throw new Error(`Notebook ${i} is out of bounds`);
    }
    return [pos[0], pos[1]] as [number, number];
  });

  const exits = (data.exits ?? []).map((pos, i) => {
    if (!Array.isArray(pos) || pos.length !== 2) {
      throw new Error(`Exit ${i} must be [row, col]`);
    }
    if (!isGridCoord({ width, height }, pos[0], pos[1])) {
      throw new Error(`Exit ${i} is out of bounds`);
    }
    return [pos[0], pos[1]] as [number, number];
  });

  const doors = (data.doors ?? []).map((door, i) => {
    if (!door || typeof door !== 'object') throw new Error(`Door ${i} is invalid`);
    if (!Number.isFinite(door.row) || !Number.isFinite(door.col)) {
      throw new Error(`Door ${i} must have row and col`);
    }
    if (!isGridCoord({ width, height }, door.row, door.col)) {
      throw new Error(`Door ${i} is out of bounds`);
    }
    return {
      row: door.row,
      col: door.col,
      swinging: Boolean(door.swinging),
      horizontal: Boolean(door.horizontal),
    };
  });

  return {
    version: 1,
    name: data.name,
    width,
    height,
    cellSize,
    grid,
    playerSpawn,
    notebooks,
    exits,
    doors,
  };
}

export function levelToJson(level: LevelData): string {
  return JSON.stringify(level, null, 2);
}

export function levelFromJson(json: string): LevelData {
  return validateLevel(JSON.parse(json));
}

export function cloneLevel(level: LevelData): LevelData {
  return validateLevel(JSON.parse(JSON.stringify(level)));
}
