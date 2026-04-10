import Phaser from 'phaser';
import i18next from 'i18next';
import { MAP, PLAYER, PHASER_CONFIG } from '../config';
import {
  GameState,
  GameEvent,
  type GameStateSnapshot,
  type Position,
  type PreviewData,
} from '../core';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { PowerUp } from '../entities/PowerUp';
import { Projectile } from '../entities/Projectile';
import { SkinRegistry, registerThemedPowerUpIcons } from '../skins';
import type { SkinSet } from '../skins';

/**
 * Scale factors: game units → screen pixels.
 */
const SCALE_X = PHASER_CONFIG.CANVAS_WIDTH / MAP.WIDTH;
const SCALE_Y = PHASER_CONFIG.CANVAS_HEIGHT / MAP.HEIGHT;

/**
 * Coordinate transform helpers.
 * Game uses math coordinates (origin center, y-up).
 * Phaser uses screen coordinates (origin top-left, y-down).
 */
function worldToScreen(worldX: number, worldY: number): Position {
  return {
    x: (worldX - MAP.MIN_X) * SCALE_X,
    y: (MAP.MAX_Y - worldY) * SCALE_Y,
  };
}

/**
 * Main gameplay scene — renders the coordinate grid, players, obstacles, and power-ups.
 */
export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private player1!: Player;
  private player2!: Player;
  private obstacleEntities: Obstacle[] = [];
  private powerUpEntities: PowerUp[] = [];
  private projectile: Projectile | null = null;
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private unsubscribers: (() => void)[] = [];
  private p1Skin!: SkinSet;
  private p2Skin!: SkinSet;

  // Tooltip system
  private tooltipContainer!: Phaser.GameObjects.Container;
  private tooltipBg!: Phaser.GameObjects.Graphics;
  private tooltipText!: Phaser.GameObjects.Text;
  private playerZones: Phaser.GameObjects.Zone[] = [];
  private obstacleZones: Phaser.GameObjects.Zone[] = [];
  private powerUpZones: Phaser.GameObjects.Zone[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(): void {
    this.gameState = this.registry.get('gameState') as GameState;
  }

  create(): void {
    // Resolve skins from registry
    const p1SkinId = (this.registry.get('p1Skin') as string) ?? 'classic';
    const p2SkinId = (this.registry.get('p2Skin') as string) ?? 'classic';
    this.p1Skin = SkinRegistry.get(p1SkinId);
    this.p2Skin = SkinRegistry.get(p2SkinId);

    // Register themed power-up textures (deduplicated internally)
    registerThemedPowerUpIcons(this, this.p1Skin.powerUp.theme);
    registerThemedPowerUpIcons(this, this.p2Skin.powerUp.theme);

    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    // Preview layer — sits above grid, below entities
    this.previewGraphics = this.add.graphics();
    this.previewGraphics.setDepth(10);

    const snapshot = this.gameState.getSnapshot();

    // Create players with screen-scaled radius
    const playerScreenRadius = PLAYER.HITBOX_RADIUS * SCALE_X;
    const p1Screen = worldToScreen(snapshot.players[0].position.x, snapshot.players[0].position.y);
    const p2Screen = worldToScreen(snapshot.players[1].position.x, snapshot.players[1].position.y);

    const p1Color = this.registry.get('p1Color') ?? PHASER_CONFIG.PLAYER1_COLOR;
    const p2Color = this.registry.get('p2Color') ?? PHASER_CONFIG.PLAYER2_COLOR;

    this.player1 = new Player(1, p1Screen, p1Color, playerScreenRadius, this.p1Skin.player);
    this.player1.create(this);

    this.player2 = new Player(2, p2Screen, p2Color, playerScreenRadius, this.p2Skin.player);
    this.player2.create(this);

    // Create obstacles
    for (const obs of snapshot.obstacles) {
      if (obs.destroyed) continue;
      const screenPos = worldToScreen(obs.position.x, obs.position.y);
      const screenW = obs.width * SCALE_X;
      const screenH = obs.height * SCALE_Y;
      const entity = new Obstacle(obs.id, obs.type, screenPos, screenW, screenH);
      entity.create(this);
      this.obstacleEntities.push(entity);
    }

    // Create power-ups
    // Determine power-up theme — use current player's skin theme
    const puTheme = this.p1Skin.powerUp.theme;
    for (const pu of snapshot.powerUps) {
      if (pu.collected) continue;
      const screenPos = worldToScreen(pu.position.x, pu.position.y);
      const entity = new PowerUp(pu.id, pu.type, screenPos, puTheme);
      entity.create(this);
      this.powerUpEntities.push(entity);
    }

    // Listen for state changes
    const unsubState = this.gameState.on(GameEvent.StateChanged, (snapshot) => {
      this.onStateChanged(snapshot);
    });
    this.unsubscribers.push(unsubState);

    // Listen for fire events to render trajectory
    const unsubFire = this.gameState.on(GameEvent.FireComplete, ({ trajectory, playerId }) => {
      this.onFireComplete(trajectory, playerId);
    });
    this.unsubscribers.push(unsubFire);

    // Listen for preview updates
    const unsubPreview = this.gameState.on(GameEvent.PreviewUpdate, (data) => {
      this.onPreviewUpdate(data);
    });
    this.unsubscribers.push(unsubPreview);

    // Tooltip system
    this.createTooltip();
    this.setupInteractiveZones(snapshot);
  }

  private drawGrid(): void {
    const g = this.gridGraphics;
    g.clear();

    // Grid lines
    g.lineStyle(1, PHASER_CONFIG.GRID_COLOR, 0.3);

    // Vertical lines
    for (let x = MAP.MIN_X; x <= MAP.MAX_X; x++) {
      const screenX = (x - MAP.MIN_X) * SCALE_X;
      g.moveTo(screenX, 0);
      g.lineTo(screenX, PHASER_CONFIG.CANVAS_HEIGHT);
    }

    // Horizontal lines
    for (let y = MAP.MIN_Y; y <= MAP.MAX_Y; y++) {
      const screenY = (MAP.MAX_Y - y) * SCALE_Y;
      g.moveTo(0, screenY);
      g.lineTo(PHASER_CONFIG.CANVAS_WIDTH, screenY);
    }

    g.strokePath();

    // Axes (thicker)
    g.lineStyle(2, PHASER_CONFIG.AXIS_COLOR, 0.8);

    // X axis (y=0)
    const axisY = MAP.MAX_Y * SCALE_Y;
    g.moveTo(0, axisY);
    g.lineTo(PHASER_CONFIG.CANVAS_WIDTH, axisY);

    // Y axis (x=0)
    const axisX = -MAP.MIN_X * SCALE_X;
    g.moveTo(axisX, 0);
    g.lineTo(axisX, PHASER_CONFIG.CANVAS_HEIGHT);

    g.strokePath();
  }

  private onStateChanged(snapshot: GameStateSnapshot): void {
    // Update player positions
    const p1Screen = worldToScreen(snapshot.players[0].position.x, snapshot.players[0].position.y);
    const p2Screen = worldToScreen(snapshot.players[1].position.x, snapshot.players[1].position.y);

    this.player1.updatePosition(p1Screen);
    this.player2.updatePosition(p2Screen);

    // Update player zone positions
    this.playerZones[0]?.setPosition(p1Screen.x, p1Screen.y);
    this.playerZones[1]?.setPosition(p2Screen.x, p2Screen.y);

    // Update obstacle visibility
    for (const entity of this.obstacleEntities) {
      const state = snapshot.obstacles.find((o) => o.id === entity.id);
      if (state?.destroyed) {
        entity.setDestroyed();
      }
    }

    // Hide destroyed obstacle zones
    for (const zone of this.obstacleZones) {
      const id = zone.getData('entityId') as string;
      const state = snapshot.obstacles.find((o) => o.id === id);
      if (state?.destroyed) {
        zone.disableInteractive();
        zone.setActive(false);
      }
    }

    // Update power-up visibility
    for (const entity of this.powerUpEntities) {
      const state = snapshot.powerUps.find((p) => p.id === entity.id);
      if (state?.collected) {
        entity.setCollected();
      }
    }

    // Hide collected power-up zones
    for (const zone of this.powerUpZones) {
      const id = zone.getData('entityId') as string;
      const state = snapshot.powerUps.find((p) => p.id === id);
      if (state?.collected) {
        zone.disableInteractive();
        zone.setActive(false);
      }
    }
  }

  private onFireComplete(trajectory: Position[], playerId: 1 | 2): void {
    // Clear preview when firing
    this.previewGraphics.clear();

    // Clean up previous projectile
    this.projectile?.destroy();

    // Convert trajectory to screen coords
    const screenTrajectory = trajectory.map((p) => worldToScreen(p.x, p.y));
    const color =
      playerId === 1
        ? (this.registry.get('p1Color') ?? PHASER_CONFIG.PLAYER1_COLOR)
        : (this.registry.get('p2Color') ?? PHASER_CONFIG.PLAYER2_COLOR);
    const trailSkin = playerId === 1 ? this.p1Skin.trail : this.p2Skin.trail;

    this.projectile = new Projectile(screenTrajectory, color, trailSkin);
    this.projectile.create(this);
    this.projectile.animate(() => {
      this.gameState.emit(GameEvent.FireAnimationDone);
    });
  }

  private onPreviewUpdate(data: PreviewData | null): void {
    this.previewGraphics.clear();
    if (!data || data.points.length < 2) return;

    const snap = this.gameState.getSnapshot();
    const color =
      snap.currentPlayerId === 1
        ? (this.registry.get('p1Color') ?? PHASER_CONFIG.PLAYER1_COLOR)
        : (this.registry.get('p2Color') ?? PHASER_CONFIG.PLAYER2_COLOR);

    // Draw dashed preview line
    const screenPoints = data.points.map((p) => worldToScreen(p.x, p.y));
    const dashLen = 6;
    const gapLen = 4;

    this.previewGraphics.lineStyle(1.5, color, 0.4);

    let drawing = true;
    let segAcc = 0;

    for (let i = 0; i < screenPoints.length - 1; i++) {
      const ax = screenPoints[i]!.x;
      const ay = screenPoints[i]!.y;
      const bx = screenPoints[i + 1]!.x;
      const by = screenPoints[i + 1]!.y;
      const dx = bx - ax;
      const dy = by - ay;
      const segLen = Math.sqrt(dx * dx + dy * dy);

      if (segLen === 0) continue;

      let consumed = 0;
      while (consumed < segLen) {
        const limit = drawing ? dashLen : gapLen;
        const remaining = limit - segAcc;
        const available = segLen - consumed;
        const step = Math.min(remaining, available);

        const t0 = consumed / segLen;
        const t1 = (consumed + step) / segLen;
        const x0 = ax + dx * t0;
        const y0 = ay + dy * t0;
        const x1 = ax + dx * t1;
        const y1 = ay + dy * t1;

        if (drawing) {
          this.previewGraphics.beginPath();
          this.previewGraphics.moveTo(x0, y0);
          this.previewGraphics.lineTo(x1, y1);
          this.previewGraphics.strokePath();
        }

        consumed += step;
        segAcc += step;
        if (segAcc >= limit) {
          segAcc = 0;
          drawing = !drawing;
        }
      }
    }

    // End-point marker (small dot)
    const last = screenPoints[screenPoints.length - 1]!;
    this.previewGraphics.fillStyle(color, 0.5);
    this.previewGraphics.fillCircle(last.x, last.y, 3);
  }

  // ─── Tooltip system ────────────────────────────────────

  private createTooltip(): void {
    this.tooltipBg = this.add.graphics();
    this.tooltipText = this.add.text(8, 6, '', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      lineSpacing: 2,
    });
    this.tooltipContainer = this.add.container(0, 0, [this.tooltipBg, this.tooltipText]);
    this.tooltipContainer.setVisible(false);
    this.tooltipContainer.setDepth(1000);
  }

  private showTooltip(pointer: Phaser.Input.Pointer, text: string): void {
    this.tooltipText.setText(text);

    const pad = 8;
    const w = this.tooltipText.width + pad * 2;
    const h = this.tooltipText.height + pad * 2;

    this.tooltipBg.clear();
    this.tooltipBg.fillStyle(0x000000, 0.85);
    this.tooltipBg.fillRoundedRect(0, 0, w, h, 4);
    this.tooltipBg.lineStyle(1, 0x555555, 0.8);
    this.tooltipBg.strokeRoundedRect(0, 0, w, h, 4);

    // Position offset from pointer, clamped to canvas
    let x = pointer.x + 16;
    let y = pointer.y - h - 8;
    if (x + w > PHASER_CONFIG.CANVAS_WIDTH) x = pointer.x - w - 8;
    if (y < 0) y = pointer.y + 16;

    this.tooltipContainer.setPosition(x, y);
    this.tooltipContainer.setVisible(true);
  }

  private hideTooltip(): void {
    this.tooltipContainer.setVisible(false);
    this.sys.canvas.style.cursor = 'default';
  }

  private setupInteractiveZones(snapshot: GameStateSnapshot): void {
    const playerScreenRadius = PLAYER.HITBOX_RADIUS * SCALE_X;
    const hoverRadius = playerScreenRadius * 2.5;

    // Player zones
    for (let i = 0; i < 2; i++) {
      const p = snapshot.players[i]!;
      const screen = worldToScreen(p.position.x, p.position.y);
      const zone = this.add.zone(screen.x, screen.y, hoverRadius * 2, hoverRadius * 2);
      zone.setInteractive(
        new Phaser.Geom.Circle(hoverRadius, hoverRadius, hoverRadius),
        Phaser.Geom.Circle.Contains,
      );

      const playerIndex = i;
      zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        this.sys.canvas.style.cursor = 'pointer';
        const snap = this.gameState.getSnapshot();
        const pl = snap.players[playerIndex]!;
        this.showTooltip(pointer, i18next.t('tooltip.player', { name: pl.name, hp: pl.hp }));
      });
      zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (!this.tooltipContainer.visible) return;
        const snap = this.gameState.getSnapshot();
        const pl = snap.players[playerIndex]!;
        this.showTooltip(pointer, i18next.t('tooltip.player', { name: pl.name, hp: pl.hp }));
      });
      zone.on('pointerout', () => this.hideTooltip());

      this.playerZones.push(zone);
    }

    // Obstacle zones
    for (const obs of snapshot.obstacles) {
      if (obs.destroyed) continue;
      const screen = worldToScreen(obs.position.x, obs.position.y);
      const screenW = obs.width * SCALE_X;
      const screenH = obs.height * SCALE_Y;
      const zone = this.add.zone(screen.x, screen.y, screenW, screenH).setInteractive();
      zone.setData('entityId', obs.id);

      const type = obs.type;
      zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        this.sys.canvas.style.cursor = 'pointer';
        this.showTooltip(pointer, i18next.t(`tooltip.obstacle.${type}`));
      });
      zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (!this.tooltipContainer.visible) return;
        this.showTooltip(pointer, i18next.t(`tooltip.obstacle.${type}`));
      });
      zone.on('pointerout', () => this.hideTooltip());

      this.obstacleZones.push(zone);
    }

    // Power-up zones
    for (const pu of snapshot.powerUps) {
      if (pu.collected) continue;
      const screen = worldToScreen(pu.position.x, pu.position.y);
      const zone = this.add.zone(screen.x, screen.y, 28, 28);
      zone.setInteractive(new Phaser.Geom.Circle(14, 14, 14), Phaser.Geom.Circle.Contains);
      zone.setData('entityId', pu.id);

      const type = pu.type;
      zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        this.sys.canvas.style.cursor = 'pointer';
        this.showTooltip(pointer, i18next.t(`tooltip.powerUp.${type}`));
      });
      zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (!this.tooltipContainer.visible) return;
        this.showTooltip(pointer, i18next.t(`tooltip.powerUp.${type}`));
      });
      zone.on('pointerout', () => this.hideTooltip());

      this.powerUpZones.push(zone);
    }
  }

  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.player1?.destroy();
    this.player2?.destroy();
    for (const o of this.obstacleEntities) o.destroy();
    this.obstacleEntities = [];
    for (const p of this.powerUpEntities) p.destroy();
    this.powerUpEntities = [];
    this.projectile?.destroy();
    this.projectile = null;
    for (const z of this.playerZones) z.destroy();
    this.playerZones = [];
    for (const z of this.obstacleZones) z.destroy();
    this.obstacleZones = [];
    for (const z of this.powerUpZones) z.destroy();
    this.powerUpZones = [];
    this.tooltipContainer?.destroy();
  }
}
