import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapStorage } from '../maps';
import type { PresetMap } from '../maps';
import { MAP, ObstacleType } from '../config';
import { Slider } from '../common/components';

/** All selectable options: 'random' sentinel + preset maps. */
const allPresets = MapStorage.getAll();
const MAP_OPTIONS: (PresetMap | null)[] = [null, ...allPresets]; // null = random

interface MapPickerProps {
  mapId: string;
  onChange: (mapId: string) => void;
}

export function MapPicker({ mapId, onChange }: MapPickerProps) {
  const { t } = useTranslation();
  const selectedIndex = Math.max(
    0,
    MAP_OPTIONS.findIndex((m) => (m ? m.id : 'random') === mapId),
  );

  const handleSelect = useCallback(
    (idx: number) => {
      const option = MAP_OPTIONS[idx];
      onChange(option ? option.id : 'random');
    },
    [onChange],
  );

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <span className="text-xs text-text-muted uppercase tracking-wider">{t('menu.map')}</span>
      <Slider
        items={MAP_OPTIONS}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        getKey={(item) => (item ? item.id : 'random')}
        showDots
        renderSlide={(preset) => {
          const nameKey = preset ? preset.nameKey : 'map.random.name';
          const descKey = preset ? preset.descriptionKey : 'map.random.description';
          return (
            <>
              <MapPreviewCanvas preset={preset} />
              <span className="text-sm font-semibold text-text-primary">{t(nameKey)}</span>
              <span className="text-[11px] text-text-muted text-center leading-tight">
                {t(descKey)}
              </span>
            </>
          );
        }}
      />
    </div>
  );
}

// ─── Mini map preview canvas ───

/** Preview canvas dimensions. */
const PREVIEW_W = 200;
const PREVIEW_H = 120;
const PAD = 8;

/** Convert game coords → canvas coords. */
function toCanvas(gx: number, gy: number): [number, number] {
  const sx = PAD + ((gx - MAP.MIN_X) / MAP.WIDTH) * (PREVIEW_W - PAD * 2);
  const sy = PAD + ((MAP.MAX_Y - gy) / MAP.HEIGHT) * (PREVIEW_H - PAD * 2);
  return [sx, sy];
}

function MapPreviewCanvas({ preset }: { preset: PresetMap | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

    // Grid (subtle)
    ctx.strokeStyle = '#333355';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.4;
    // Vertical lines every 5 units
    for (let x = MAP.MIN_X; x <= MAP.MAX_X; x += 5) {
      const [sx] = toCanvas(x, 0);
      ctx.beginPath();
      ctx.moveTo(sx, PAD);
      ctx.lineTo(sx, PREVIEW_H - PAD);
      ctx.stroke();
    }
    // Horizontal lines every 5 units
    for (let y = MAP.MIN_Y; y <= MAP.MAX_Y; y += 5) {
      const [, sy] = toCanvas(0, y);
      ctx.beginPath();
      ctx.moveTo(PAD, sy);
      ctx.lineTo(PREVIEW_W - PAD, sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Axes
    ctx.strokeStyle = '#6666aa';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    const [axisX] = toCanvas(0, 0);
    const [, axisY] = toCanvas(0, 0);
    ctx.beginPath();
    ctx.moveTo(axisX, PAD);
    ctx.lineTo(axisX, PREVIEW_H - PAD);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD, axisY);
    ctx.lineTo(PREVIEW_W - PAD, axisY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (!preset) {
      // Random — draw "?" in center
      ctx.fillStyle = '#888888';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', PREVIEW_W / 2, PREVIEW_H / 2);

      // Scattered faint random shapes to hint at randomness
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 6; i++) {
        const rx = 30 + ((i * 37) % (PREVIEW_W - 60));
        const ry = 25 + ((i * 53) % (PREVIEW_H - 50));
        ctx.fillStyle = i % 2 === 0 ? '#888888' : '#ffcc00';
        if (i % 2 === 0) {
          ctx.fillRect(rx - 4, ry - 4, 8, 6);
        } else {
          ctx.beginPath();
          ctx.arc(rx, ry, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      return;
    }

    const scaleW = (PREVIEW_W - PAD * 2) / MAP.WIDTH;
    const scaleH = (PREVIEW_H - PAD * 2) / MAP.HEIGHT;

    // Obstacles
    for (const obs of preset.obstacles) {
      const [ox, oy] = toCanvas(obs.position.x, obs.position.y);
      const w = obs.width * scaleW;
      const h = obs.height * scaleH;

      if (obs.type === ObstacleType.Hard) {
        ctx.fillStyle = '#888888';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(ox - w / 2, oy - h / 2, w, h);
      } else {
        ctx.fillStyle = '#666666';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(ox - w / 2, oy - h / 2, w, h);
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(ox - w / 2, oy - h / 2, w, h);
        ctx.setLineDash([]);
      }
    }
    ctx.globalAlpha = 1;

    // Power-ups
    for (const pu of preset.powerUps) {
      const [px, py] = toCanvas(pu.position.x, pu.position.y);
      ctx.fillStyle = '#ffcc00';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Player 1 spawn
    const [p1x, p1y] = toCanvas(preset.player1Spawn.x, preset.player1Spawn.y);
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.arc(p1x, p1y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Player 2 spawn
    const [p2x, p2y] = toCanvas(preset.player2Spawn.x, preset.player2Spawn.y);
    ctx.fillStyle = '#ff4466';
    ctx.beginPath();
    ctx.arc(p2x, p2y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD, PAD, PREVIEW_W - PAD * 2, PREVIEW_H - PAD * 2);
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      width={PREVIEW_W}
      height={PREVIEW_H}
      className="rounded-lg border border-border"
    />
  );
}
