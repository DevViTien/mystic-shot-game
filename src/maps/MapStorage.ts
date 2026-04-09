import type { PresetMap } from './types';

import arenaData from './presets/arena.json';
import fortressData from './presets/fortress.json';
import mazeData from './presets/maze.json';
import sniperData from './presets/sniper.json';
import mirrorData from './presets/mirror.json';
import chaosData from './presets/chaos.json';
import duelData from './presets/duel.json';

const presets: PresetMap[] = [
  arenaData as PresetMap,
  fortressData as PresetMap,
  mazeData as PresetMap,
  sniperData as PresetMap,
  mirrorData as PresetMap,
  chaosData as PresetMap,
  duelData as PresetMap,
];

const presetMap = new Map<string, PresetMap>(presets.map((m) => [m.id, m]));

export const MapStorage = {
  get(id: string): PresetMap | undefined {
    return presetMap.get(id);
  },
  getAll(): PresetMap[] {
    return presets;
  },
} as const;
