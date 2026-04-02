# Baldi's Basics Classic - Web Port

A browser-based TypeScript port of Baldi's Basics Classic, built with Three.js and Vite.

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

## Architecture

```
src/
  engine/       # Game loop, input, audio, physics, scene manager
  game/         # GameController, Player, Camera, Map, Pathfinding
    npcs/       # Baldi, Principal, Playtime, First Prize, Bully, Crafters, Gotta Sweep
    items/      # Item system, notebooks, doors, BSODA, alarm clock, etc.
    ui/         # HUD, math game, pause menu, jump rope
  scenes/       # Warning, Main Menu, School (story/endless), Game Over, Results
```

## Game Mechanics (ported from C# decompile)

- **7 notebooks** to collect, each with a 3-problem math quiz
- **Baldi** chases with increasing speed based on wrong answers
- **Principal** detains you for rule-breaking (running in halls, entering faculty rooms)
- **Playtime** forces you into a jump rope minigame
- **First Prize** pushes you down hallways
- **It's a Bully** steals your items
- **Arts & Crafters** teleports you to Baldi after 7 notebooks
- **Gotta Sweep** sweeps everyone away periodically
- **11 usable items**: Zesty Bar, Door Lock, Keys, BSODA, Quarter, Tape, Alarm Clock, WD-NoSquee, Safety Scissors, Boots, Teleporter
