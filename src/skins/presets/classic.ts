import type { SkinSet } from '../types';

export const classicSkin: SkinSet = {
  id: 'classic',
  nameKey: 'skin.classic',
  player: { shape: 'circle', glowEffect: false, pulseAnimation: false },
  trail: { style: 'solid', particleEmitter: false, widthMultiplier: 1.0, fadeSpeed: 1.0 },
  powerUp: { theme: 'classic' },
};
