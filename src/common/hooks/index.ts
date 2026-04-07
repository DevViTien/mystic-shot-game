/**
 * Common hooks barrel export.
 *
 * Re-exports from usehooks-ts for project-wide use.
 * To swap any hook with a custom implementation later,
 * change the import source here — all consumers stay unchanged.
 */

// ── Storage ──
export { useLocalStorage } from 'usehooks-ts';
export { useSessionStorage } from 'usehooks-ts';

// ── Timing ──
export { useDebounceValue } from 'usehooks-ts';
export { useInterval } from 'usehooks-ts';

// ── DOM / Window ──
export { useMediaQuery } from 'usehooks-ts';
export { useEventListener } from 'usehooks-ts';
export { useOnClickOutside } from 'usehooks-ts';

// ── Lifecycle ──
export { useUnmount } from 'usehooks-ts';
