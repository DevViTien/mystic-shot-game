import type { SkinSet } from '../types';

export const pixelSkin: SkinSet = {
  id: 'pixel',
  nameKey: 'skin.pixel',
  player: { shape: 'diamond', glowEffect: false, pulseAnimation: false },
  trail: { style: 'solid', particleEmitter: false, widthMultiplier: 1.0, fadeSpeed: 1.2 },
  powerUp: { theme: 'pixel' },
};
