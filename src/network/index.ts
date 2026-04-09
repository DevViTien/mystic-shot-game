export type { InputAdapter } from './InputAdapter';
export { LocalInputAdapter } from './LocalInputAdapter';
export { FirebaseInputAdapter } from './FirebaseInputAdapter';
export { RoomManager } from './RoomManager';
export type { RoomMeta, PlayerInfo, RoomState } from './RoomManager';
export { PresenceManager } from './PresenceManager';
export { isFirebaseConfigured, signInAnon, getCurrentUserId } from './firebase';
