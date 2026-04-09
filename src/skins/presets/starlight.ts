import type { SkinSet } from '../types';

export const starlightSkin: SkinSet = {
  id: 'starlight',
  nameKey: 'skin.starlight',
  player: { shape: 'star', glowEffect: false, pulseAnimation: true },
  trail: { style: 'sparkle', particleEmitter: true, widthMultiplier: 1.0, fadeSpeed: 0.8 },
  powerUp: { theme: 'magical' },
};
