import type { SkinSet } from '../types';

export const neonSkin: SkinSet = {
  id: 'neon',
  nameKey: 'skin.neon',
  player: { shape: 'circle', glowEffect: true, pulseAnimation: false },
  trail: { style: 'neon', particleEmitter: false, widthMultiplier: 1.5, fadeSpeed: 1.0 },
  powerUp: { theme: 'tech' },
};
