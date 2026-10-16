/**
 * The library's search: free words over title, genre, mood, style, lyrics and the brief, plus field filters -
 * ``genre:pop``, ``mood:warm``, ``bpm:>100``, ``bpm:90-120``, ``key:Am``, ``model:yue2``, ``year:2026``,
 * ``lang:german``, ``vocals:instrumental``, ``mode:jazz`` (the creative mode), ``len:<3`` (minutes),
 * ``is:fav``, ``has:pdf`` - and ``"quoted phrases"``. Every word must match; the best matches come first.
 */
import type { SongSummary } from './api'

export interface Term {
  field: string
  value: string
  negate: boolean
}

const FIELDS: Record<string, string> = {
  genre: 'genre', g: 'genre', mood: 'mood', bpm: 'bpm', tempo: 'bpm', key: 'key', model: 'model', m: 'model',
  year: 'year', lang: 'language', language: 'language', vocals: 'vocals', mode: 'mode', arrangement: 'mode',
  len: 'len', length: 'len', is: 'is', has: 'has', title: 'title', lyrics: 'lyrics', style: 'style', artist: 'artist', album: 'album',
  template: 'template', writer: 'writer', meter: 'meter',
}  // prettier-ignore

export function parseQuery(query: string): Term[] {
  const terms: Term[] = []
  const pattern = /(-)?(?:(\w+):)?(?:"([^"]*)"|(\S+))/g
  for (const match of query.matchAll(pattern)) {
    const [, minus, rawField, quoted, bare] = match
    const value = (quoted ?? bare ?? '').trim()
    if (!value) continue
    const field = rawField && FIELDS[rawField.toLowerCase()] ? FIELDS[rawField.toLowerCase()] : ''
    terms.push({ field, value: field ? value : rawField ? `${rawField}:${value}` : value, negate: !!minus })
  }
  return terms
}

const fold = (s: string): string =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()

function numberTest(value: string, actual: number | null | undefined): boolean {
  if (actual === null || actual === undefined || !Number.isFinite(actual)) return false
  const range = value.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/)
  if (range) return actual >= Number(range[1]) && actual <= Number(range[2])
  const compare = value.match(/^(<=|>=|<|>|=)?\s*(\d+(?:\.\d+)?)$/)
  if (!compare) return false
  const n = Number(compare[2])
  switch (compare[1]) {
    case '<': return actual < n
    case '<=': return actual <= n
    case '>': return actual > n
    case '>=': return actual >= n
    default: return Math.abs(actual - n) < 0.5
  }
}  // prettier-ignore

export interface Context {
  favorites: Set<string>
}

/** How well ``song`` matches ``terms`` (0: not at all). Title hits weigh most, lyrics least. */
export function score(song: SongSummary, terms: Term[], context: Context): number {
  let total = 1
  for (const term of terms) {
    const hit = matches(song, term, context)
    if (term.negate ? hit > 0 : hit === 0) return 0
    if (!term.negate) total += hit
  }
  return total
}

function matches(song: SongSummary, term: Term, context: Context): number {
  const v = fold(term.value)
  const has = (text: string | undefined): boolean => !!text && fold(text).includes(v)
  switch (term.field) {
    case 'genre': return has(song.genre) ? 3 : 0
    case 'mood': return has(song.mood) ? 3 : 0
    case 'bpm': return numberTest(term.value, song.bpm) ? 2 : 0
    case 'key': return fold(song.score_key ?? '') === v || fold(song.brief.key ?? '').startsWith(v) ? 2 : 0
    case 'model': return has(song.model) || (v === 'master' && !song.model && !song.other) ? 2 : 0
    case 'year': return song.year === term.value ? 2 : 0
    case 'language': return has(song.language) ? 2 : 0
    case 'vocals': return has(song.vocals) || (v === 'sung' && !song.instrumental && !!song.vocals) ? 2 : 0
    case 'mode': return has(song.arrangement) ? 2 : 0
    case 'len': return numberTest(term.value, song.seconds / 60) ? 2 : 0
    case 'meter': return has(song.score_meter) || has(song.brief.meter) ? 2 : 0
    case 'is': return v === 'fav' || v === 'favorite' ? (context.favorites.has(song.id) ? 2 : 0) : v === 'cover' ? (song.kind === 'cover' ? 2 : 0) : v === 'other' ? (song.other ? 2 : 0) : v === 'plenio' ? (song.other ? 0 : 2) : 0
    case 'artist': return has(song.artist) || has(song.tags.artist) ? 3 : 0
    case 'album': return has(song.album) || has(song.tags.album) ? 3 : 0
    case 'has': return (song.has as Record<string, boolean>)[v] ? 2 : 0
    case 'title': return has(song.title) ? 5 : 0
    case 'lyrics': return has(song.lyrics) ? 2 : 0
    case 'style': return has(song.style) ? 2 : 0
    case 'template': return has(song.template) ? 2 : 0
    case 'writer': return has(song.writer) ? 2 : 0
    default: {
      if (has(song.title)) return 6
      if (has(song.genre) || has(song.mood) || has(song.artist) || has(song.album) || has(song.tags.artist) || has(song.tags.album)) return 4
      if (has(song.style) || has(song.template) || has(song.brief.description) || has(song.brief.theme)) return 3
      if (has(song.language) || has(song.model) || has(song.arrangement)) return 2
      if (has(song.lyrics)) return 1
      return 0
    }
  }
}  // prettier-ignore

export type SortKey = 'newest' | 'oldest' | 'title' | 'length' | 'bpm' | 'loudness' | 'plays' | 'recent' | 'relevance'

export interface Facts {
  plays: Record<string, number>
  lastPlayed: Record<string, string>
}

export function sortSongs(songs: SongSummary[], key: SortKey, facts: Facts, relevance?: Map<string, number>): SongSummary[] {
  const list = [...songs]
  const by = (f: (s: SongSummary) => number | string, desc = false) =>
    list.sort((a, b) => {
      const x = f(a)
      const y = f(b)
      const order = x < y ? -1 : x > y ? 1 : 0
      return desc ? -order : order
    })
  switch (key) {
    case 'oldest': return by((s) => s.created)
    case 'title': return by((s) => fold(s.title))
    case 'length': return by((s) => s.seconds, true)
    case 'bpm': return by((s) => s.bpm ?? 0, true)
    case 'loudness': return by((s) => s.loudness.lufs ?? -99, true)
    case 'plays': return by((s) => facts.plays[s.id] ?? 0, true)
    case 'recent': return by((s) => facts.lastPlayed[s.id] ?? '', true)
    case 'relevance': return relevance ? by((s) => relevance.get(s.id) ?? 0, true) : by((s) => s.created, true)
    default: return by((s) => s.created, true)
  }
}  // prettier-ignore

/** Where a free word occurs in the lyrics: a short excerpt around it (for the result card). */
export function lyricsSnippet(song: SongSummary, terms: Term[]): string | null {
  const words = terms.filter((t) => !t.field && !t.negate).map((t) => fold(t.value))
  if (!words.length || !song.lyrics) return null
  const lines = song.lyrics.split('\n')
  for (const line of lines) {
    const folded = fold(line)
    if (words.some((w) => folded.includes(w)) && !words.every((w) => fold(song.title).includes(w))) return line.trim()
  }
  return null
}

/** The values that occur most often for a facet (genre words, moods, models ...), for the filter chips. */
export function topValues(songs: SongSummary[], pick: (s: SongSummary) => string[], limit = 12): [string, number][] {
  const counts = new Map<string, number>()
  for (const song of songs) for (const value of pick(song)) if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit)
}

export const words = (text: string): string[] =>
  fold(text)
    .split(/[,;/]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1)
