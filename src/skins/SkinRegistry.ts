import type { SkinSet } from './types';
import { classicSkin } from './presets/classic';
import { neonSkin } from './presets/neon';
import { geometricSkin } from './presets/geometric';
import { starlightSkin } from './presets/starlight';
import { pixelSkin } from './presets/pixel';

const registry = new Map<string, SkinSet>();

function register(skin: SkinSet): void {
  registry.set(skin.id, skin);
}

// Register built-in skins
register(classicSkin);
register(neonSkin);
register(geometricSkin);
register(starlightSkin);
register(pixelSkin);

export const SkinRegistry = {
  get(id: string): SkinSet {
    return registry.get(id) ?? classicSkin;
  },
  getAll(): SkinSet[] {
    return Array.from(registry.values());
  },
  getDefault(): SkinSet {
    return classicSkin;
  },
} as const;
