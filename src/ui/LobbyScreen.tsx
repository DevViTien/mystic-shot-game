import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Difficulty } from '../config';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SkinPicker } from './SkinPicker';
import { MapPicker } from './MapPicker';
import { IconBack } from '../common/icons';
import { useLocalStorage } from '../common/hooks';
import type { PlayerInfo } from '../network';

const COLOR_OPTIONS = [
  { value: '#00ccff' },
  { value: '#ff4466' },
  { value: '#44ff66' },
  { value: '#ff9933' },
  { value: '#aa66ff' },
  { value: '#ffdd33' },
];

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  [Difficulty.Easy]: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30',
  [Difficulty.Medium]: 'bg-amber-500/20 text-amber-400 ring-amber-500/30',
  [Difficulty.Hard]: 'bg-red-500/20 text-red-400 ring-red-500/30',
};

const DIFFICULTY_ACTIVE: Record<Difficulty, string> = {
  [Difficulty.Easy]: 'bg-emerald-500 text-black ring-emerald-400',
  [Difficulty.Medium]: 'bg-amber-500 text-black ring-amber-400',
  [Difficulty.Hard]: 'bg-red-500 text-black ring-red-400',
};

export interface CreateRoomConfig {
  player: PlayerInfo;
  difficulty: Difficulty;
  mapId: string;
}

export interface JoinRoomConfig {
  player: PlayerInfo;
  roomCode: string;
}

interface LobbyScreenProps {
  onCreateRoom: (config: CreateRoomConfig) => void;
  onJoinRoom: (config: JoinRoomConfig) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function LobbyScreen({
  onCreateRoom,
  onJoinRoom,
  onBack,
  loading,
  error,
  theme,
  onToggleTheme,
}: LobbyScreenProps) {
  const { t } = useTranslation();
  const [name, setName] = useLocalStorage('mystic-shot-online-name', '');
  const [color, setColor] = useLocalStorage('mystic-shot-online-color', '#00ccff');
  const [skinId, setSkinId] = useLocalStorage('mystic-shot-online-skin', 'classic');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Easy);
  const [mapId, setMapId] = useState('random');
  const [roomCode, setRoomCode] = useState('');

  const player = useMemo<PlayerInfo>(
    () => ({ name: name || t('menu.player1'), color, skinId }),
    [name, color, skinId, t],
  );

  const handleCreate = useCallback(() => {
    onCreateRoom({ player, difficulty, mapId });
  }, [onCreateRoom, player, difficulty, mapId]);

  const handleJoin = useCallback(() => {
    onJoinRoom({ player, roomCode });
  }, [onJoinRoom, player, roomCode]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-overlay p-3 md:p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-[800px] max-h-[92vh] overflow-y-auto w-full flex flex-col relative shadow-2xl shadow-black/30">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-3 md:px-6 pt-3 md:pt-5 pb-2 md:pb-3 gap-2">
          <button
            className="flex items-center gap-1 shrink-0 text-text-muted text-[12px] md:text-[13px] hover:text-text-primary transition-colors duration-150 cursor-pointer bg-transparent border-none min-h-[36px]"
            onClick={onBack}
          >
            <IconBack size={14} /> <span className="hidden md:inline">{t('lobby.back')}</span>
          </button>
          <h1 className="text-sm md:text-xl font-extrabold text-accent font-mono tracking-[1px] md:tracking-[3px] truncate text-center min-w-0">
            {t('lobby.title')}
          </h1>
          <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
            <LanguageSwitcher />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>

        <div className="h-px bg-border mx-3 md:mx-4" />

        {/* ── Body: 2-column layout ── */}
        <div className="flex flex-col md:flex-row gap-0 md:gap-0 flex-1 min-h-0">
          {/* ── Left Column: Profile + Game Settings ── */}
          <div className="flex-1 flex flex-col gap-4 md:gap-5 p-4 md:p-6 overflow-y-auto">
            {/* Profile */}
            <section className="flex flex-col gap-3">
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-[2px]">
                {t('lobby.yourProfile')}
              </h2>
              <div className="flex items-center gap-3">
                {/* Avatar preview */}
                <div
                  className="w-11 h-11 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-surface transition-colors duration-200"
                  style={{ background: color, boxShadow: `0 0 12px ${color}40` }}
                />
                <input
                  className="flex-1 px-3 py-2 text-sm bg-surface-input text-text-primary border border-border-input rounded-lg outline-none focus:border-accent transition-colors duration-150 font-[inherit]"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('menu.playerNamePlaceholder')}
                  maxLength={16}
                />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="flex gap-2 md:gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      className={`w-9 h-9 md:w-7 md:h-7 rounded-full cursor-pointer transition-all duration-150 border-2 ${
                        color === c.value
                          ? 'border-white scale-115 shadow-lg'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'
                      }`}
                      style={{ background: c.value }}
                      onClick={() => setColor(c.value)}
                    />
                  ))}
                </div>
                <div className="hidden md:block w-px h-6 bg-border" />
                <SkinPicker skinId={skinId} onChange={setSkinId} color={color} />
              </div>
            </section>

            <div className="h-px bg-border" />

            {/* Game Settings */}
            <section className="flex flex-col gap-3">
              <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-[2px]">
                {t('lobby.createRoom')}
              </h2>

              {/* Difficulty */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted uppercase tracking-wider shrink-0">
                  {t('menu.difficulty')}
                </span>
                <div className="flex gap-1.5">
                  {Object.values(Difficulty).map((d) => (
                    <button
                      key={d}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-md cursor-pointer border-none ring-1 transition-all duration-150 ${
                        difficulty === d ? DIFFICULTY_ACTIVE[d] : DIFFICULTY_STYLES[d]
                      }`}
                      onClick={() => setDifficulty(d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map */}
              <MapPicker mapId={mapId} onChange={setMapId} />
            </section>

            {/* Create button */}
            <button
              className="w-full py-2.5 text-sm font-bold tracking-[2px] uppercase rounded-lg bg-accent text-black cursor-pointer border-none hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
              onClick={handleCreate}
              disabled={loading || !name.trim()}
            >
              {loading ? '...' : t('lobby.create')}
            </button>
          </div>

          {/* ── Vertical Divider ── */}
          <div className="hidden md:flex flex-col items-center py-6">
            <div className="w-px flex-1 bg-border" />
            <span className="text-[10px] text-text-muted uppercase tracking-wider py-2">
              {t('lobby.or')}
            </span>
            <div className="w-px flex-1 bg-border" />
          </div>

          {/* Horizontal divider (mobile) */}
          <div className="flex md:hidden items-center gap-3 px-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] text-text-muted uppercase tracking-wider">
              {t('lobby.or')}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* ── Right Column: Join Room ── */}
          <div className="md:w-[240px] shrink-0 flex flex-col items-center justify-center gap-3 md:gap-4 p-4 md:p-6">
            <h2 className="text-[11px] font-bold text-text-muted uppercase tracking-[2px]">
              {t('lobby.joinRoom')}
            </h2>

            <p className="text-[12px] text-text-muted text-center leading-relaxed">
              {t('lobby.enterCode')}
            </p>

            {/* Room code input */}
            <input
              className="w-full max-w-[200px] px-3 py-3 text-xl font-mono bg-surface-input text-text-primary border border-border-input rounded-lg outline-none text-center tracking-[8px] uppercase focus:border-purple-400 transition-colors duration-150"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="– – – – – –"
              maxLength={6}
            />

            {/* Character count hint */}
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-0.5 rounded-full transition-colors duration-150 ${
                    i < roomCode.length ? 'bg-purple-400' : 'bg-border'
                  }`}
                />
              ))}
            </div>

            <button
              className="w-full max-w-[200px] py-2.5 text-sm font-bold tracking-[2px] uppercase rounded-lg bg-purple-600 text-white cursor-pointer border-none hover:bg-purple-500 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20"
              onClick={handleJoin}
              disabled={loading || !name.trim() || roomCode.length < 6}
            >
              {loading ? '...' : t('lobby.join')}
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mx-4 md:mx-6 mb-4 px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
