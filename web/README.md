# Baldi's Basics: Hilbert's Problems - Web Port

A browser-based TypeScript port of Baldi's Basics, re-themed around David Hilbert and his famous unsolved mathematical problems. Built with Three.js and Vite.

## Theme

David Hilbert takes the role of Baldi. Each of the 7 notebooks in the game is themed around one of Hilbert's unsolved problems from his famous 1900 list:

1. **Problem #8** — The Riemann Hypothesis
2. **Problem #1** — The Continuum Hypothesis
3. **Problem #2** — Consistency of Arithmetic
4. **Problem #6** — Axiomatization of Physics
5. **Problem #16** — Topology of Algebraic Curves
6. **Problem #15** — Schubert's Enumerative Calculus
7. **Problem #23** — Calculus of Variations

The first two questions in each notebook are solvable arithmetic. The third question presents the actual unsolved Hilbert problem — which genuinely has no known answer.

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
    npcs/       # Hilbert (Baldi), Principal, Playtime, First Prize, Bully, Crafters, Gotta Sweep
    items/      # Item system, notebooks, doors, BSODA, alarm clock, etc.
    ui/         # HUD, math game (Hilbert problems), pause menu, jump rope
  scenes/       # Warning, Main Menu, School (story/endless), Game Over, Results
```

## Game Mechanics

- **7 notebooks** to collect, each featuring one of Hilbert's unsolved problems
- **Hilbert** chases with increasing speed based on wrong answers
- **Principal** detains you for rule-breaking
- **Playtime** forces you into a jump rope minigame
- **First Prize** pushes you down hallways
- **It's a Bully** steals your items
- **Arts & Crafters** teleports you to Hilbert after 7 notebooks
- **Gotta Sweep** sweeps everyone away periodically
- **11 usable items**: Zesty Bar, Door Lock, Keys, BSODA, Quarter, Hilbert's Least Favorite Tape, Alarm Clock, WD-NoSquee, Safety Scissors, Boots, Teleporter
