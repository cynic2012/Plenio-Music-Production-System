/** Live Play's settings and where a new song goes (live.ts plays it; this part imports nothing). */

export type Insert = 'next' | 'end' | 'random'

export interface LiveSettings {
  /** Live Play is on (kept, so a page opened again goes on). */
  on: boolean
  /** Where a new song goes. */
  insert: Insert
  /** New songs from ComfyUI join by themselves. */
  auto: boolean
  /** At the end: from the top again, or wait for the next new song. */
  atEnd: 'again' | 'wait'
}

export const DEFAULT_LIVE: LiveSettings = { on: false, insert: 'next', auto: true, atEnd: 'again' }

/** Saved live settings, checked (a file edited by hand or an older version may hold anything). */
export function liveWithDefaults(raw: unknown): LiveSettings {
  const given = (raw && typeof raw === 'object' ? raw : {}) as Partial<LiveSettings>
  const out = { ...DEFAULT_LIVE, ...given }
  if (!['next', 'end', 'random'].includes(out.insert)) out.insert = 'next'
  if (!['again', 'wait'].includes(out.atEnd)) out.atEnd = 'again'
  out.on = !!out.on
  out.auto = out.auto !== false
  return out
}

/** Where the ``k``-th of the new songs that arrived together goes in a queue of ``length`` where the song at
 * ``now`` plays: next (in the order they came), at the end, or anywhere after the song that plays. */
export function insertAt(insert: Insert, now: number, length: number, k: number, random: () => number = Math.random): number {
  if (now < 0) return length
  if (insert === 'next') return Math.min(length, now + 1 + k)
  if (insert === 'end') return length
  const first = now + 1
  return first + Math.floor(random() * (length - first + 1))
}
