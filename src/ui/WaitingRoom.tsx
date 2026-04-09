import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RoomMeta } from '../network';
import { IconBack } from '../common/icons';

interface WaitingRoomProps {
  meta: RoomMeta;
  isHost: boolean;
  onStart: () => void;
  onCancel: () => void;
}

export function WaitingRoom({ meta, isHost, onStart, onCancel }: WaitingRoomProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const guestJoined = !!meta.guestId;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(meta.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-overlay">
      <div className="bg-surface border border-border rounded-xl px-10 py-8 max-w-[520px] w-full flex flex-col items-center gap-5">
        <h2 className="text-xl font-extrabold text-accent font-mono tracking-[3px]">
          {t('waiting.title')}
        </h2>

        {/* Room code */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-text-muted uppercase tracking-wider">
            {t('waiting.roomCode')}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-mono font-bold text-text-primary tracking-[8px]">
              {meta.roomCode}
            </span>
            <button
              className="px-3 py-1 text-xs font-semibold rounded bg-surface-alt text-text-muted hover:text-text-primary cursor-pointer border-none transition-colors"
              onClick={copyCode}
            >
              {copied ? t('waiting.copied') : t('waiting.copy')}
            </button>
          </div>
        </div>

        {/* Players */}
        <div className="flex items-center gap-6 w-full justify-center py-3">
          {/* Host */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs text-text-muted">{t('waiting.host')}</span>
            <div
              className="w-8 h-8 rounded-full border-2 border-white"
              style={{ background: meta.host.color }}
            />
            <span className="text-sm font-semibold text-text-primary">{meta.host.name}</span>
            <span className="text-[10px] text-text-muted">{meta.host.skinId}</span>
          </div>

          <span className="text-2xl font-extrabold text-text-muted">VS</span>

          {/* Guest */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-xs text-text-muted">{t('waiting.guest')}</span>
            {guestJoined && meta.guest ? (
              <>
                <div
                  className="w-8 h-8 rounded-full border-2 border-white"
                  style={{ background: meta.guest.color }}
                />
                <span className="text-sm font-semibold text-text-primary">
                  {meta.guest.name}
                </span>
                <span className="text-[10px] text-text-muted">{meta.guest.skinId}</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-text-muted animate-pulse" />
                <span className="text-sm text-text-muted italic">
                  {t('waiting.waitingForGuest')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Game settings */}
        <div className="flex gap-4 text-xs text-text-muted">
          <span>
            {t('menu.difficulty')}: <strong className="text-text-primary">{meta.difficulty}</strong>
          </span>
          <span>
            {t('menu.map')}: <strong className="text-text-primary">{meta.mapId}</strong>
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button
            className="px-4 py-2 text-sm rounded bg-surface-alt text-text-muted hover:text-text-primary cursor-pointer border-none transition-colors flex items-center gap-1"
            onClick={onCancel}
          >
            <IconBack size={14} /> {t('waiting.cancel')}
          </button>

          {isHost && (
            <button
              className="px-8 py-2 text-sm font-bold tracking-[1px] rounded-md bg-accent text-black cursor-pointer border-none hover:opacity-85 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onStart}
              disabled={!guestJoined}
            >
              {t('waiting.startGame')}
            </button>
          )}

          {!isHost && (
            <span className="px-4 py-2 text-sm text-text-muted italic">
              {guestJoined ? t('waiting.waitingForHost') : t('waiting.connecting')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
