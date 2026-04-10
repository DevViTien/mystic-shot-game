import Phaser from 'phaser';
import { MAP, PLAYER, PHASER_CONFIG } from '../config';
import type { GameStateSnapshot, Position } from '../core';
import type { ReplayData, ReplayEntry } from '../core/ReplayRecorder';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { PowerUp } from '../entities/PowerUp';
import { Projectile } from '../entities/Projectile';
import { SkinRegistry, registerThemedPowerUpIcons } from '../skins';
import type { SkinSet } from '../skins';

const SCALE_X = PHASER_CONFIG.CANVAS_WIDTH / MAP.WIDTH;
const SCALE_Y = PHASER_CONFIG.CANVAS_HEIGHT / MAP.HEIGHT;

function worldToScreen(worldX: number, worldY: number): Position {
  return {
    x: (worldX - MAP.MIN_X) * SCALE_X,
    y: (MAP.MAX_Y - worldY) * SCALE_Y,
  };
}

/** Delay between entries in milliseconds (base, scaled by speed). */
const ENTRY_DELAY_MS = 800;
/** Initial delay before first entry plays. */
const INITIAL_DELAY_MS = 600;
/** Duration for move tweens in ms (base). */
const MOVE_TWEEN_MS = 400;

/**
 * ReplayScene — Phaser scene that plays back recorded game actions.
 *
 * Communication with React:
 * - Reads `replayData`, `replaySpeed`, `replayPaused` from registry
 * - Sets `replayProgress` and `replayFinished` on registry for React to watch
 */
export class ReplayScene extends Phaser.Scene {
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private player1!: Player;
  private player2!: Player;
  private obstacleEntities: Obstacle[] = [];
  private powerUpEntities: PowerUp[] = [];
  private projectile: Projectile | null = null;
  private p1Skin!: SkinSet;
  private p2Skin!: SkinSet;

  // Playback state
  private replayData!: ReplayData;
  private currentSnapshot!: GameStateSnapshot;
  private currentEntryIndex = 0;
  private waiting = false;
  private waitTimer = 0;

  // Turn indicator text
  private turnText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ReplayScene' });
  }

  create(): void {
    this.replayData = this.registry.get('replayData') as ReplayData;
    this.currentSnapshot = this.replayData.initialSnapshot;
    this.currentEntryIndex = 0;

    // Reset registry state
    this.registry.set('replayProgress', { current: 0, total: this.replayData.entries.length });
    this.registry.set('replayFinished', false);

    // Resolve skins
    const p1SkinId = (this.registry.get('p1Skin') as string) ?? 'classic';
    const p2SkinId = (this.registry.get('p2Skin') as string) ?? 'classic';
    this.p1Skin = SkinRegistry.get(p1SkinId);
    this.p2Skin = SkinRegistry.get(p2SkinId);

    registerThemedPowerUpIcons(this, this.p1Skin.powerUp.theme);
    registerThemedPowerUpIcons(this, this.p2Skin.powerUp.theme);

    // Draw grid
    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    // Render initial state
    this.renderEntities(this.currentSnapshot);

    // Turn indicator (top-center)
    this.turnText = this.add.text(PHASER_CONFIG.CANVAS_WIDTH / 2, 16, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    });
    this.turnText.setOrigin(0.5, 0);
    this.turnText.setDepth(900);
    this.updateTurnText();

    // Start with initial delay
    this.waiting = true;
    this.waitTimer = INITIAL_DELAY_MS;
  }

  update(_time: number, delta: number): void {
    const paused = this.registry.get('replayPaused') as boolean | undefined;
    if (paused) return;

    const speed = (this.registry.get('replaySpeed') as number) ?? 1;

    if (this.waiting) {
      this.waitTimer -= delta * speed;
      if (this.waitTimer <= 0) {
        this.waiting = false;
        this.playNextEntry();
      }
    }
  }

  private playNextEntry(): void {
    if (this.currentEntryIndex >= this.replayData.entries.length) {
      this.registry.set('replayFinished', true);
      return;
    }

    const entry = this.replayData.entries[this.currentEntryIndex]!;

    if (entry.type === 'move') {
      this.animateMove(entry);
    } else {
      this.animateFire(entry);
    }
  }

  private animateMove(entry: ReplayEntry): void {
    const playerId = entry.playerId;
    const playerEntity = playerId === 1 ? this.player1 : this.player2;
    const newPos = entry.snapshotAfter.players[playerId - 1]!.position;
    const screenPos = worldToScreen(newPos.x, newPos.y);
    const speed = (this.registry.get('replaySpeed') as number) ?? 1;

    // Tween player to new position
    this.tweens.add({
      targets: { x: playerEntity.position.x, y: playerEntity.position.y },
      x: screenPos.x,
      y: screenPos.y,
      duration: MOVE_TWEEN_MS / speed,
      ease: 'Sine.easeInOut',
      onUpdate: (_tween, target) => {
        playerEntity.updatePosition({ x: target.x, y: target.y });
      },
      onComplete: () => {
        this.onEntryComplete(entry);
      },
    });
  }

  private animateFire(entry: ReplayEntry): void {
    const playerId = entry.playerId;
    const trajectory = entry.trajectory ?? [];

    if (trajectory.length < 2) {
      this.onEntryComplete(entry);
      return;
    }

    // Clean up previous projectile
    this.projectile?.destroy();

    const screenTrajectory = trajectory.map((p) => worldToScreen(p.x, p.y));
    const color =
      playerId === 1
        ? (this.registry.get('p1Color') ?? PHASER_CONFIG.PLAYER1_COLOR)
        : (this.registry.get('p2Color') ?? PHASER_CONFIG.PLAYER2_COLOR);
    const trailSkin = playerId === 1 ? this.p1Skin.trail : this.p2Skin.trail;

    this.projectile = new Projectile(screenTrajectory, color, trailSkin);
    this.projectile.create(this);
    this.projectile.animate(() => {
      this.onEntryComplete(entry);
    });
  }

  private onEntryComplete(entry: ReplayEntry): void {
    this.currentSnapshot = entry.snapshotAfter;
    this.applySnapshot(this.currentSnapshot);
    this.currentEntryIndex++;

    this.registry.set('replayProgress', {
      current: this.currentEntryIndex,
      total: this.replayData.entries.length,
    });

    this.updateTurnText();

    if (this.currentEntryIndex >= this.replayData.entries.length) {
      this.registry.set('replayFinished', true);
    } else {
      this.waiting = true;
      this.waitTimer = ENTRY_DELAY_MS;
    }
  }

  private applySnapshot(snapshot: GameStateSnapshot): void {
    // Update player positions
    const p1Screen = worldToScreen(snapshot.players[0].position.x, snapshot.players[0].position.y);
    const p2Screen = worldToScreen(snapshot.players[1].position.x, snapshot.players[1].position.y);
    this.player1.updatePosition(p1Screen);
    this.player2.updatePosition(p2Screen);

    // Update obstacle visibility
    for (const entity of this.obstacleEntities) {
      const state = snapshot.obstacles.find((o) => o.id === entity.id);
      if (state?.destroyed) {
        entity.setDestroyed();
      }
    }

    // Update power-up visibility
    for (const entity of this.powerUpEntities) {
      const state = snapshot.powerUps.find((p) => p.id === entity.id);
      if (state?.collected) {
        entity.setCollected();
      }
    }
  }

  private renderEntities(snapshot: GameStateSnapshot): void {
    const playerScreenRadius = PLAYER.HITBOX_RADIUS * SCALE_X;
    const p1Screen = worldToScreen(snapshot.players[0].position.x, snapshot.players[0].position.y);
    const p2Screen = worldToScreen(snapshot.players[1].position.x, snapshot.players[1].position.y);

    const p1Color = this.registry.get('p1Color') ?? PHASER_CONFIG.PLAYER1_COLOR;
    const p2Color = this.registry.get('p2Color') ?? PHASER_CONFIG.PLAYER2_COLOR;

    this.player1 = new Player(1, p1Screen, p1Color, playerScreenRadius, this.p1Skin.player);
    this.player1.create(this);

    this.player2 = new Player(2, p2Screen, p2Color, playerScreenRadius, this.p2Skin.player);
    this.player2.create(this);

    // Obstacles
    for (const obs of snapshot.obstacles) {
      if (obs.destroyed) continue;
      const screenPos = worldToScreen(obs.position.x, obs.position.y);
      const screenW = obs.width * SCALE_X;
      const screenH = obs.height * SCALE_Y;
      const entity = new Obstacle(obs.id, obs.type, screenPos, screenW, screenH);
      entity.create(this);
      this.obstacleEntities.push(entity);
    }

    // Power-ups
    const puTheme = this.p1Skin.powerUp.theme;
    for (const pu of snapshot.powerUps) {
      if (pu.collected) continue;
      const screenPos = worldToScreen(pu.position.x, pu.position.y);
      const entity = new PowerUp(pu.id, pu.type, screenPos, puTheme);
      entity.create(this);
      this.powerUpEntities.push(entity);
    }
  }

  private updateTurnText(): void {
    const snap = this.currentSnapshot;
    const playerName = snap.players[snap.currentPlayerId - 1]?.name ?? '';
    this.turnText.setText(`Turn ${snap.turnNumber} — ${playerName}`);
  }

  private drawGrid(): void {
    const g = this.gridGraphics;
    g.clear();

    g.lineStyle(1, PHASER_CONFIG.GRID_COLOR, 0.3);

    for (let x = MAP.MIN_X; x <= MAP.MAX_X; x++) {
      const screenX = (x - MAP.MIN_X) * SCALE_X;
      g.moveTo(screenX, 0);
      g.lineTo(screenX, PHASER_CONFIG.CANVAS_HEIGHT);
    }

    for (let y = MAP.MIN_Y; y <= MAP.MAX_Y; y++) {
      const screenY = (MAP.MAX_Y - y) * SCALE_Y;
      g.moveTo(0, screenY);
      g.lineTo(PHASER_CONFIG.CANVAS_WIDTH, screenY);
    }

    g.strokePath();

    g.lineStyle(2, PHASER_CONFIG.AXIS_COLOR, 0.8);

    const axisY = MAP.MAX_Y * SCALE_Y;
    g.moveTo(0, axisY);
    g.lineTo(PHASER_CONFIG.CANVAS_WIDTH, axisY);

    const axisX = -MAP.MIN_X * SCALE_X;
    g.moveTo(axisX, 0);
    g.lineTo(axisX, PHASER_CONFIG.CANVAS_HEIGHT);

    g.strokePath();
  }

  destroy(): void {
    this.player1?.destroy();
    this.player2?.destroy();
    for (const o of this.obstacleEntities) o.destroy();
    this.obstacleEntities = [];
    for (const p of this.powerUpEntities) p.destroy();
    this.powerUpEntities = [];
    this.projectile?.destroy();
    this.projectile = null;
    this.turnText?.destroy();
  }
}
