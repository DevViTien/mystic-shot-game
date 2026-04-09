import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SkinRegistry } from '../skins';
import type { SkinSet } from '../skins';
import { Slider } from '../common/components';

const allSkins = SkinRegistry.getAll();

interface SkinPickerProps {
  skinId: string;
  onChange: (skinId: string) => void;
  color: string;
}

export function SkinPicker({ skinId, onChange, color }: SkinPickerProps) {
  const { t } = useTranslation();
  const selectedIndex = Math.max(
    0,
    allSkins.findIndex((s) => s.id === skinId),
  );

  const handleSelect = useCallback(
    (idx: number) => onChange(allSkins[idx]!.id),
    [onChange],
  );

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs text-text-muted uppercase tracking-wider">
        {t('menu.skin')}
      </span>
      <Slider
        items={allSkins}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        getKey={(skin) => skin.id}
        maxWidth="240px"
        renderSlide={(skin) => (
          <div className="flex items-center gap-2 justify-center">
            <SkinPreview skin={skin} color={color} />
            <span className="text-sm font-medium text-text-primary">
              {t(skin.nameKey)}
            </span>
          </div>
        )}
      />
    </div>
  );
}

/** Mini canvas preview showing player shape + short trail segment. */
function SkinPreview({ skin, color }: { skin: SkinSet; color: string }) {
  const size = 32;

  return (
    <canvas
      width={size}
      height={size}
      className="rounded"
      ref={(canvas) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, size, size);

        const cx = size / 2;
        const cy = size / 2;
        const r = 8;

        // Glow
        if (skin.player.glowEffect) {
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Shape
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.beginPath();
        switch (skin.player.shape) {
          case 'circle':
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            break;
          case 'star':
            drawStarPath(ctx, cx, cy, 5, r, r * 0.45);
            break;
          case 'diamond':
            drawPolygonPath(ctx, cx, cy, 4, r, Math.PI / 4);
            break;
          case 'hexagon':
            drawPolygonPath(ctx, cx, cy, 6, r, 0);
            break;
        }
        ctx.fill();
      }}
    />
  );
}

function drawPolygonPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sides: number,
  radius: number,
  offset: number,
): void {
  for (let i = 0; i < sides; i++) {
    const a = offset + (2 * Math.PI * i) / sides;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStarPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  points: number,
  outerR: number,
  innerR: number,
): void {
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / points;
    const radius = i % 2 === 0 ? outerR : innerR;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
