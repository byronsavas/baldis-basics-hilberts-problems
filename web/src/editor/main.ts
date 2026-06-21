import defaultLevelData from '../levels/default.json';
import {
  GRID_HALL,
  GRID_ROOM,
  GRID_WALL,
  cloneLevel,
  createEmptyLevel,
  levelFromJson,
  levelToJson,
  validateLevel,
  type LevelData,
  type LevelDoorDef,
} from '../game/LevelData';

type Tool =
  | 'wall'
  | 'hall'
  | 'room'
  | 'spawn'
  | 'notebook'
  | 'exit'
  | 'door'
  | 'swingingDoor'
  | 'eraser';

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'wall', label: 'Wall' },
  { id: 'hall', label: 'Hall' },
  { id: 'room', label: 'Room' },
  { id: 'spawn', label: 'Player Spawn' },
  { id: 'notebook', label: 'Notebook' },
  { id: 'exit', label: 'Exit' },
  { id: 'door', label: 'Door' },
  { id: 'swingingDoor', label: 'Swinging Door' },
  { id: 'eraser', label: 'Eraser' },
];

const CELL_CLASS: Record<number, string> = {
  [GRID_WALL]: 'cell-wall',
  [GRID_HALL]: 'cell-hall',
  [GRID_ROOM]: 'cell-room',
};

class LevelEditor {
  private level: LevelData = createEmptyLevel();
  private tool: Tool = 'hall';
  private painting = false;
  private eraseMode = false;

  private gridEl = document.getElementById('grid')!;
  private toolButtonsEl = document.getElementById('tool-buttons')!;
  private levelNameEl = document.getElementById('level-name') as HTMLInputElement;
  private doorHorizontalEl = document.getElementById('door-horizontal') as HTMLInputElement;
  private cursorInfoEl = document.getElementById('cursor-info')!;
  private countsInfoEl = document.getElementById('counts-info')!;
  private statusEl = document.getElementById('status')!;
  private importInputEl = document.getElementById('import-input') as HTMLInputElement;

  constructor() {
    this.buildToolButtons();
    this.buildLegend();
    this.bindActions();
    this.loadLevel(validateLevel(defaultLevelData));
  }

  private buildToolButtons() {
    for (const t of TOOLS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tool-btn';
      btn.dataset.tool = t.id;
      btn.textContent = t.label;
      btn.addEventListener('click', () => this.setTool(t.id));
      this.toolButtonsEl.appendChild(btn);
    }
    this.updateToolButtons();
  }

  private buildLegend() {
    const list = document.getElementById('legend-list')!;
    const items = [
      ['Wall', '#666'],
      ['Hall', '#c9b896'],
      ['Room', '#7ec8e3'],
      ['Spawn', 'P'],
      ['Notebook', 'N'],
      ['Exit', 'X'],
      ['Door', 'D'],
      ['Swinging', 'S'],
    ];
    for (const [label, color] of items) {
      const li = document.createElement('li');
      const swatch = document.createElement('span');
      swatch.className = 'legend-swatch';
      if (color.startsWith('#')) {
        swatch.style.background = color;
      } else {
        swatch.style.background = '#fff';
        swatch.textContent = color;
        swatch.style.fontSize = '10px';
        swatch.style.display = 'flex';
        swatch.style.alignItems = 'center';
        swatch.style.justifyContent = 'center';
      }
      li.appendChild(swatch);
      li.appendChild(document.createTextNode(label));
      list.appendChild(li);
    }
  }

  private bindActions() {
    document.getElementById('btn-new')!.addEventListener('click', () => {
      this.loadLevel(createEmptyLevel());
      this.setStatus('Created new empty level.');
    });

    document.getElementById('btn-load-default')!.addEventListener('click', () => {
      this.loadLevel(validateLevel(defaultLevelData));
      this.setStatus('Loaded default school level.');
    });

    document.getElementById('btn-export')!.addEventListener('click', () => this.exportLevel());

    this.importInputEl.addEventListener('change', () => {
      const file = this.importInputEl.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = levelFromJson(String(reader.result));
          this.loadLevel(imported);
          this.setStatus(`Imported "${imported.name}".`);
        } catch (err) {
          this.setStatus(err instanceof Error ? err.message : 'Import failed.', true);
        }
        this.importInputEl.value = '';
      };
      reader.readAsText(file);
    });

    this.levelNameEl.addEventListener('input', () => {
      this.level.name = this.levelNameEl.value;
    });

    document.addEventListener('mouseup', () => {
      this.painting = false;
      this.eraseMode = false;
    });
  }

  private setTool(tool: Tool) {
    this.tool = tool;
    this.updateToolButtons();
  }

  private updateToolButtons() {
    this.toolButtonsEl.querySelectorAll('.tool-btn').forEach((el) => {
      el.classList.toggle('active', (el as HTMLElement).dataset.tool === this.tool);
    });
  }

  private loadLevel(level: LevelData) {
    this.level = cloneLevel(level);
    this.levelNameEl.value = this.level.name;
    this.renderGrid();
    this.updateCounts();
  }

  private renderGrid() {
    this.gridEl.innerHTML = '';
    this.gridEl.style.gridTemplateColumns = `repeat(${this.level.width}, 28px)`;

    for (let row = 0; row < this.level.height; row++) {
      for (let col = 0; col < this.level.width; col++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `cell ${CELL_CLASS[this.level.grid[row][col]] ?? 'cell-wall'}`;
        btn.dataset.row = String(row);
        btn.dataset.col = String(col);
        btn.title = `Row ${row}, Col ${col}`;

        const overlay = document.createElement('span');
        overlay.className = 'cell-overlay';
        overlay.textContent = this.getOverlayText(row, col);
        btn.appendChild(overlay);

        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.painting = true;
          this.eraseMode = e.button === 2 || this.tool === 'eraser';
          this.applyTool(row, col, this.eraseMode);
        });
        btn.addEventListener('mouseenter', () => {
          this.cursorInfoEl.textContent = `Row: ${row}, Col: ${col}`;
          if (this.painting) this.applyTool(row, col, this.eraseMode);
        });
        btn.addEventListener('contextmenu', (e) => e.preventDefault());

        this.gridEl.appendChild(btn);
      }
    }
  }

  private getOverlayText(row: number, col: number): string {
    const parts: string[] = [];
    if (this.level.playerSpawn[0] === row && this.level.playerSpawn[1] === col) parts.push('P');
    if (this.hasNotebook(row, col)) parts.push('N');
    if (this.hasExit(row, col)) parts.push('X');
    const door = this.getDoor(row, col);
    if (door) parts.push(door.swinging ? 'S' : 'D');
    return parts.join('');
  }

  private hasNotebook(row: number, col: number): boolean {
    return this.level.notebooks.some(([r, c]) => r === row && c === col);
  }

  private hasExit(row: number, col: number): boolean {
    return this.level.exits.some(([r, c]) => r === row && c === col);
  }

  private getDoor(row: number, col: number): LevelDoorDef | undefined {
    return this.level.doors.find((d) => d.row === row && d.col === col);
  }

  private applyTool(row: number, col: number, erase: boolean) {
    if (erase) {
      this.level.grid[row][col] = GRID_WALL;
      this.level.notebooks = this.level.notebooks.filter(([r, c]) => !(r === row && c === col));
      this.level.exits = this.level.exits.filter(([r, c]) => !(r === row && c === col));
      this.level.doors = this.level.doors.filter((d) => !(d.row === row && d.col === col));
      if (this.level.playerSpawn[0] === row && this.level.playerSpawn[1] === col) {
        this.level.playerSpawn = [Math.floor(this.level.height / 2), Math.floor(this.level.width / 2)];
      }
      this.renderGrid();
      this.updateCounts();
      return;
    }

    switch (this.tool) {
      case 'wall':
        this.level.grid[row][col] = GRID_WALL;
        break;
      case 'hall':
        this.level.grid[row][col] = GRID_HALL;
        break;
      case 'room':
        this.level.grid[row][col] = GRID_ROOM;
        break;
      case 'spawn':
        this.level.playerSpawn = [row, col];
        if (this.level.grid[row][col] === GRID_WALL) this.level.grid[row][col] = GRID_HALL;
        break;
      case 'notebook':
        if (this.hasNotebook(row, col)) {
          this.level.notebooks = this.level.notebooks.filter(([r, c]) => !(r === row && c === col));
        } else {
          this.level.notebooks.push([row, col]);
          if (this.level.grid[row][col] === GRID_WALL) this.level.grid[row][col] = GRID_ROOM;
        }
        break;
      case 'exit':
        if (this.hasExit(row, col)) {
          this.level.exits = this.level.exits.filter(([r, c]) => !(r === row && c === col));
        } else {
          this.level.exits.push([row, col]);
          if (this.level.grid[row][col] === GRID_WALL) this.level.grid[row][col] = GRID_HALL;
        }
        break;
      case 'door':
      case 'swingingDoor': {
        const existing = this.getDoor(row, col);
        const swinging = this.tool === 'swingingDoor';
        if (existing && existing.swinging === swinging) {
          this.level.doors = this.level.doors.filter((d) => !(d.row === row && d.col === col));
        } else {
          this.level.doors = this.level.doors.filter((d) => !(d.row === row && d.col === col));
          this.level.doors.push({
            row,
            col,
            swinging,
            horizontal: this.doorHorizontalEl.checked,
          });
          if (this.level.grid[row][col] === GRID_WALL) this.level.grid[row][col] = GRID_HALL;
        }
        break;
      }
      default:
        break;
    }

    this.renderGrid();
    this.updateCounts();
  }

  private updateCounts() {
    this.countsInfoEl.innerHTML = [
      `Notebooks: ${this.level.notebooks.length}`,
      `Exits: ${this.level.exits.length}`,
      `Doors: ${this.level.doors.length}`,
    ].join('<br>');
  }

  private exportLevel() {
    this.level.name = this.levelNameEl.value.trim() || 'Untitled Level';
    const json = levelToJson(this.level);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = this.level.name.replace(/[^\w\- ]+/g, '').trim() || 'level';
    a.href = url;
    a.download = `${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.setStatus(`Exported "${this.level.name}".`);
  }

  private setStatus(message: string, isError = false) {
    this.statusEl.textContent = message;
    this.statusEl.classList.toggle('error', isError);
  }
}

new LevelEditor();
