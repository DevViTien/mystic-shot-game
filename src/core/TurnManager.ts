import { EventEmitter } from './EventEmitter';
import { TURN, TurnPhase } from '../config';
import { GameState } from './GameState';

export enum TurnEvent {
  TimerTick = 'turn:timer:tick',
  TimerExpired = 'turn:timer:expired',
  PhaseChanged = 'turn:phase:changed',
}

export interface TurnEventMap {
  [TurnEvent.TimerTick]: [number];
  [TurnEvent.TimerExpired]: [];
  [TurnEvent.PhaseChanged]: [];
}

/**
 * Manages turn lifecycle:
 *  - 60s countdown timer
 *  - Phase transitions (Idle → Move → Fire → Resolve)
 *  - Auto-skip on timeout
 */
export class TurnManager extends EventEmitter<TurnEventMap> {
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private remainingSeconds = TURN.DURATION_SECONDS;

  constructor(private gameState: GameState) {
    super();
  }

  startTurn(): void {
    this.remainingSeconds = TURN.DURATION_SECONDS;
    this.gameState.setPhase(TurnPhase.Idle);
    this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerHandle = setInterval(() => {
      this.remainingSeconds -= 1;
      this.emit(TurnEvent.TimerTick, this.remainingSeconds);

      if (this.remainingSeconds <= 0) {
        this.onTimerExpired();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private onTimerExpired(): void {
    this.stopTimer();
    this.emit(TurnEvent.TimerExpired);
    this.gameState.endGameByTimeout();
  }

  endTurn(): void {
    this.stopTimer();
    this.gameState.nextTurn();
    this.startTurn();
  }

  resetTimer(): void {
    this.remainingSeconds = TURN.DURATION_SECONDS;
    this.emit(TurnEvent.TimerTick, this.remainingSeconds);
    this.stopTimer();
    this.startTimer();
  }

  getRemainingSeconds(): number {
    return this.remainingSeconds;
  }

  isWarning(): boolean {
    return this.remainingSeconds <= TURN.WARNING_THRESHOLD;
  }

  stopTurn(): void {
    this.stopTimer();
  }

  pauseTimer(): void {
    this.stopTimer();
  }

  resumeTimer(): void {
    this.startTimer();
  }

  destroy(): void {
    this.stopTimer();
    this.removeAllListeners();
  }
}
