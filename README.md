# Mystic Shot

> Turn-based artillery game on a 2D coordinate system. Players input **math functions f(x)** to move and fire — projectiles fly along the function's graph.

## Screenshots

_Coming soon_

## Features

- **Math-based combat** — enter functions like `x^2`, `sin(x) + 2*x`, projectiles follow the curve
- **Movement system** — move along function graphs with arc length limit (5 units)
- **5 power-ups** — Double Damage, Knockback, Extra Move, Shield, Piercing
- **2 obstacle types** — Hard (permanent block) and Soft (destructible)
- **Difficulty levels** — Easy (polynomials), Medium (+trig/log), Hard (must use special functions)
- **Real-time formula preview** — KaTeX renders your expression as you type
- **Dark/Light theme** — persisted via localStorage
- **Bilingual** — English & Vietnamese (i18next)
- **Tooltip system** — hover over entities on canvas for info

## Tech Stack

| Layer        | Technology              |
| ------------ | ----------------------- |
| UI           | React 19                |
| Game Engine  | Phaser 3.80             |
| Math Parser  | math.js 13 (sandboxed)  |
| Math Display | KaTeX                   |
| Styling      | Tailwind CSS 4          |
| Icons        | lucide-react            |
| i18n         | i18next + react-i18next |
| Build        | Vite 6 + TypeScript 5.7 |

## Architecture

Two-layer hybrid — React handles DOM UI (HUD, menus, input), Phaser renders the game canvas (grid, players, projectiles). Communication via a shared `GameState` (typed EventEmitter).

```
React (DOM)                    Phaser (Canvas)
┌──────────────┐               ┌──────────────┐
│ MenuScreen   │               │ GameScene    │
│ HudHeader    │  GameState    │  Players     │
│ ControlFooter│◄────────────►│  Obstacles   │
│ FormulaInput │  (EventEmitter)│  PowerUps    │
│ GameOver     │               │  Projectile  │
└──────────────┘               └──────────────┘
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server (HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How to Play

1. **Menu** — Enter player names, pick colors, choose difficulty, click START
2. **Move** _(optional)_ — Enter a function, pick direction (◀/▶), click Move. Your player walks along the curve (max 5 units arc length)
3. **Fire** — Enter a function, click Fire. The projectile flies along the graph toward your opponent
4. **Turns** — 60 seconds per turn, timer pauses during animations
5. **Win** — Reduce opponent's HP to 0

### Collision Priority

1. Power-up → collected, projectile continues
2. Soft obstacle → destroyed, projectile stops (unless Piercing)
3. Hard obstacle → projectile stops
4. Opponent → damage dealt, projectile stops

## Project Structure

```
src/
├── config.ts          # Constants & enums
├── common/            # Shared icons & hooks
├── core/              # GameState, TurnManager, CollisionSystem, Commands
├── entities/          # Phaser game objects (Player, Obstacle, PowerUp, Projectile)
├── scenes/            # Phaser scenes (Menu, Game, GameOver)
├── math/              # FunctionParser, FunctionValidator, GraphRenderer
├── ui/                # React components (App, HUD, Controls, Menu, etc.)
├── utils/             # MapGenerator, MathUtils
└── i18n/              # i18next config + EN/VI translations
```

## License

All rights reserved.
