import type { SkinSet } from '../types';

export const geometricSkin: SkinSet = {
  id: 'geometric',
  nameKey: 'skin.geometric',
  player: { shape: 'hexagon', glowEffect: false, pulseAnimation: false },
  trail: { style: 'solid', particleEmitter: false, widthMultiplier: 1.3, fadeSpeed: 1.0 },
  powerUp: { theme: 'classic' },
};
