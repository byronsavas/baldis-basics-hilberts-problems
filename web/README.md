# Baldi's Basics: Hilbert's Problems - Web Port

A browser-based TypeScript port of Baldi's Basics, re-themed around David Hilbert and his famous unsolved mathematical problems. Built with Three.js and Vite.

## Theme

David Hilbert takes the role of Baldi. There are **23 notebooks**, one for each of Hilbert's problems from his famous 1900 list.

The first two questions in each notebook are solvable arithmetic. The third question presents the actual Hilbert problem — which genuinely has no known closed-form classroom answer.

## Tech Stack

- **Three.js** - 3D rendering
- **TypeScript** - all game logic
- **Vite** - dev server and bundler
- **HTML/CSS** - UI overlays (menus, HUD, math game)
- **Web Audio API** - spatial audio
- **Pointer Lock API** - FPS mouse capture

## Getting Started

```bash
nvm use 22    # requires Node 22+
npm install
npm run dev   # http://localhost:5173
```

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| Mouse | Look around |
| E / Left Click | Interact (notebooks, doors, pickups) |
| Left Click | Use item |
| Shift | Run |
| 1, 2, 3 | Select item slot |
| Scroll wheel | Cycle items |
| Space | Jump (during jump rope) |
| Q | Look behind |
| Escape | Pause |

## Mobile

Play in landscape. Phones and tablets get on-screen controls; a mouse and keyboard keep pointer lock.

| Control | Action |
|---------|--------|
| Left stick | Move. Push it to the edge to run |
| Drag the right side | Look |
| Interact / Use | Open notebooks and doors, or use the selected item |
| Behind | Look behind while held |
| Item slots | Select that slot |
| Pause | Pause |
| JUMP | Jump during jump rope |

Portrait shows a rotate prompt during a round. Menus and the math pad still work in either orientation.

## Level Editor

Open the editor at [http://localhost:5173/editor.html](http://localhost:5173/editor.html) while the dev server is running.

### Tools

| Tool | Action |
|------|--------|
| Wall / Hall / Room | Paint grid cells |
| Player Spawn | Set spawn point (only one) |
| Notebook / Exit / Door / Swinging Door | Toggle placement on a cell (click again to remove) |
| Eraser | Right-click or select Eraser to clear a cell back to wall and remove markers |
| Door horizontal orientation | Checkbox controls door plane orientation for door tools |

### Export / import

- **Export JSON** downloads the current level as a `.json` file
- **Import JSON** loads a level file into the editor
- **Load Default** restores the built-in school layout

### Using a custom level in the game

Replace [`src/levels/default.json`](src/levels/default.json) with your exported file (or copy it there under a new name and update the import in `GameController.ts`). The game loads `default.json` at startup.

### Level file format

```json
{
  "version": 1,
  "name": "My Level",
  "width": 19,
  "height": 19,
  "cellSize": 10,
  "grid": [[0, 1, 2, ...]],
  "playerSpawn": [row, col],
  "notebooks": [[row, col]],
  "exits": [[row, col]],
  "doors": [{ "row": 1, "col": 4, "swinging": false, "horizontal": true }]
}
```

Grid values: `0` = wall, `1` = hall, `2` = room.

## Architecture

```
src/
  engine/       # Game loop, input, audio, physics, scene manager
  game/         # GameController, Player, Camera, Map, Pathfinding
    npcs/       # Hilbert (Baldi), Principal, Playtime, First Prize, Bully, Crafters, Gotta Sweep
    items/      # Item system, notebooks, doors, BSODA, alarm clock, etc.
    ui/         # HUD, math game (Hilbert problems), pause menu, jump rope
  scenes/       # Warning, Main Menu, School (story/endless), Game Over, Results
  levels/       # JSON level data (default.json)
  editor/       # Standalone level editor page
```

## Game Mechanics

- **23 notebooks** to collect, each featuring one of Hilbert's problems
- **Hilbert** chases with increasing speed based on wrong answers
- **Principal** detains you for rule-breaking
- **Playtime** forces you into a jump rope minigame
- **First Prize** pushes you down hallways
- **It's a Bully** steals your items
- **Arts & Crafters** teleports you to Hilbert after all 23 notebooks
- **Gotta Sweep** sweeps everyone away periodically
- **11 usable items**: Zesty Bar, Door Lock, Keys, BSODA, Quarter, Hilbert's Least Favorite Tape, Alarm Clock, WD-NoSquee, Safety Scissors, Boots, Teleporter
