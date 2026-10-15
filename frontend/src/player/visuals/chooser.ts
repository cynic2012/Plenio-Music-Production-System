/**
 * Which visual plays: a song of its own (fixed for that song) wins, then the playlist's visual, then the
 * mode - *auto* (one that suits the song's genre and mood), *random* (from the visuals you ticked), *cycle*
 * (through them in turn) or *fixed* (always the same). When it changes: with every song, at every new
 * section of the song, every so many seconds, or when the music drops in after a quiet passage.
 */
import type { SongSummary } from '../api'
import { hashOf } from '../colors'
import { PRESETS, type Scheme } from './presets'

export type VisualMode = 'auto' | 'random' | 'cycle' | 'fixed'
export type SwitchOn = 'song' | 'section' | 'interval' | 'drop'

export interface VisualSettings {
  enabled: boolean
  mode: VisualMode
  pool: string[]
  fixed: string
  switchOn: SwitchOn
  interval: number
  scheme: Scheme
  sensitivity: number
  /** A visual of its own per song (song id -> visual id). */
  songs: Record<string, string>
  /** The lyrics over the visual in the full-screen view. */
  lyrics: boolean
  /** Short title card when a song starts. */
  titles: boolean
}

export const DEFAULT_VISUALS: VisualSettings = {
  enabled: true,
  mode: 'auto',
  pool: PRESETS.map((p) => p.id),
  fixed: 'bars',
  switchOn: 'song',
  interval: 30,
  scheme: 'song',
  sensitivity: 1,
  songs: {},
  lyrics: true,
  titles: true,
}

export function withDefaults(raw: unknown): VisualSettings {
  const given = (raw && typeof raw === 'object' ? raw : {}) as Partial<VisualSettings>
  const merged = { ...DEFAULT_VISUALS, ...given }
  merged.pool = (merged.pool ?? []).filter((id) => PRESETS.some((p) => p.id === id))
  if (!merged.pool.length) merged.pool = DEFAULT_VISUALS.pool
  return merged
}

const MOODS: [RegExp, string][] = [
  [/edm|techno|trance|house|electro|synth|dubstep|drum|bass|club|dance|future|rave|hardstyle|phonk/i, 'electronic'],
  [/metal|punk|rock|rap|trap|drill|energetic|power|aggressive|fierce|anthem|epic|driving|upbeat|party/i, 'energetic'],
  [/acoustic|folk|jazz|blues|country|singer|unplugged|bossa|classical|piano|guitar|string/i, 'acoustic'],
  [/ambient|chill|calm|soft|dream|lofi|lo-fi|sleep|meditat|gentle|warm|tender|melanchol|ballad|slow/i, 'calm'],
  [/dark|doom|gothic|horror|industrial|sinister|brooding|haunting|noir/i, 'dark'],
]

/** What the song is like, for *auto*: energetic, calm, acoustic, electronic, dark - from its genre and mood;
 * the style only when they say nothing (a style's "warm female voice" made a dance song calm). */
export function songMoods(song: Pick<SongSummary, 'genre' | 'mood' | 'style' | 'bpm'>): string[] {
  const read = (text: string): Set<string> => new Set(MOODS.filter(([pattern]) => pattern.test(text)).map(([, mood]) => mood))
  let found = read(`${song.genre} ${song.mood}`)
  if (!found.size) found = read(song.style)
  if (song.bpm && song.bpm >= 125) found.add('energetic')
  if (song.bpm && song.bpm <= 80) found.add('calm')
  return [...found]
}

export interface Choice {
  settings: VisualSettings
  song: Pick<SongSummary, 'id' | 'genre' | 'mood' | 'style' | 'bpm'> | null
  /** The visual of the playlist the queue was started from (``''``: none). */
  playlist?: string
  previous?: string | null
  /** How many times the visual changed during this song (a new pick each time). */
  turn?: number
  random?: () => number
}

export function chooseVisual({ settings, song, playlist = '', previous = null, turn = 0, random = Math.random }: Choice): string {
  const own = song ? settings.songs[song.id] : undefined
  if (own && PRESETS.some((p) => p.id === own)) return own
  if (playlist && PRESETS.some((p) => p.id === playlist)) return playlist
  const pool = settings.pool.length ? settings.pool : PRESETS.map((p) => p.id)
  switch (settings.mode) {
    case 'fixed':
      return PRESETS.some((p) => p.id === settings.fixed) ? settings.fixed : 'bars'
    case 'cycle': {
      const at = previous ? pool.indexOf(previous) : -1
      return pool[(at + 1) % pool.length]
    }
    case 'random': {
      const choices = pool.length > 1 ? pool.filter((id) => id !== previous) : pool
      return choices[Math.floor(random() * choices.length) % choices.length]
    }
    default: {
      const moods = song ? songMoods(song) : []
      const fitting = PRESETS.filter((p) => pool.includes(p.id) && (moods.length ? p.suits.some((s) => moods.includes(s)) : true))
      const choices = (fitting.length ? fitting : PRESETS.filter((p) => pool.includes(p.id))).map((p) => p.id)
      const usable = choices.length > 1 ? choices.filter((id) => id !== previous) : choices
      const list = usable.length ? usable : ['bars']
      // the same song starts with the same visual; every change during it picks the next one
      return list[(hashOf(song?.id ?? '') + turn) % list.length]
    }
  }
}
