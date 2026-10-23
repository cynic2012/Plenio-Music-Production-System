/**
 * Which lyrics the player follows (owner's requests 2026-10-23): the lyrics **as written** - the song's lyrics,
 * timed by listening - or **as sung** - what the take really sings, as the lyrics ASR heard it when the song was
 * exported (``core.subtitles.time_sung``). A music model does not always sing what it was given: it repeats a
 * line, makes one up, leaves one out. By default (*auto*) a song whose take departs far from its lyrics shows
 * them as sung, the others as written; the listener switches a song either way, like master and original
 * (the choice is kept for that song). The notation always follows the score: only the written syllables have
 * a note.
 */
import type { SongDetail, SungLyrics, TimedLine } from './api'

export type LyricsVersion = 'written' | 'sung'
/** The listener's rule for every song: ``auto`` decides by how far the take departs from its lyrics. */
export type LyricsChoice = 'auto' | LyricsVersion

export const LYRICS_VERSIONS: { id: LyricsVersion; label: string; title: string }[] = [
  { id: 'written', label: 'As written', title: "The song's lyrics, at the times they are sung" },
  { id: 'sung', label: 'As sung', title: 'What the take really sings, as heard when the song was exported' }
]

export const LYRICS_CHOICES: { id: LyricsChoice; label: string; title: string }[] = [
  { id: 'auto', label: 'Auto', title: 'As sung where the take departs far from its lyrics, else as written' },
  ...LYRICS_VERSIONS
]

/** Below this share of its lyrics' words sung as written, a take departs from its lyrics. */
export const DEPARTS_HEARD = 0.75
/** Above this many words of its own (a share of its lyrics' words), a take departs from its lyrics. */
export const DEPARTS_EXTRA = 0.25

export function versionOf(raw: unknown): LyricsVersion {
  return raw === 'sung' ? 'sung' : 'written'
}

export function choiceOf(raw: unknown): LyricsChoice {
  return raw === 'sung' || raw === 'written' ? raw : 'auto'
}

/** The listener's choices for single songs, as kept (anything else is dropped). */
export function choicesOf(raw: unknown): Record<string, LyricsVersion> {
  const out: Record<string, LyricsVersion> = {}
  if (raw && typeof raw === 'object') {
    for (const [id, v] of Object.entries(raw as Record<string, unknown>)) if (v === 'sung' || v === 'written') out[id] = v
  }
  return out
}

/** What the take sings, when the song was exported with it (songs exported before have none). */
export function sungOf(detail: SongDetail | null | undefined): SungLyrics | null {
  const sung = detail?.sung
  return sung && Array.isArray(sung.lines) && sung.lines.length ? (sung as SungLyrics) : null
}

/** Whether a take departs far from its lyrics: much of them not sung as written, or many words of its own. */
export function departs(sung: SungLyrics): boolean {
  const words = sung.sections.reduce((n, s) => n + s.words, 0)
  const heard = typeof sung.written_heard === 'number' ? sung.written_heard : 1
  const extra = typeof sung.extra_words === 'number' && words ? sung.extra_words / words : 0
  return heard < DEPARTS_HEARD || extra > DEPARTS_EXTRA
}

export interface LyricsPrefs {
  lyricsChoice: LyricsChoice
  lyricsFor: Record<string, LyricsVersion>
}

/** The version a song follows by the rule alone (``choice``): written for a song without what its take sings. */
export function ruleFor(detail: SongDetail | null | undefined, choice: LyricsChoice): LyricsVersion {
  const sung = sungOf(detail)
  if (!sung) return 'written'
  if (choice === 'auto') return departs(sung) ? 'sung' : 'written'
  return choice
}

/** The version a song follows: the listener's choice for it, else the rule. */
export function versionFor(detail: SongDetail | null | undefined, prefs: LyricsPrefs): LyricsVersion {
  if (!sungOf(detail)) return 'written'
  return (detail && prefs.lyricsFor[detail.id]) || ruleFor(detail, prefs.lyricsChoice)
}

/** Keeps the listener's choice for a song - only where it differs from the rule. */
export function chooseFor(detail: SongDetail, version: LyricsVersion, prefs: LyricsPrefs): void {
  if (version === ruleFor(detail, prefs.lyricsChoice)) delete prefs.lyricsFor[detail.id]
  else prefs.lyricsFor[detail.id] = version
}

/** The lines to follow: the sung ones when chosen and there, else the written ones. */
export function linesFor(detail: SongDetail | null | undefined, version: LyricsVersion): TimedLine[] {
  const sung = version === 'sung' ? sungOf(detail) : null
  return sung ? sung.lines : detail?.lines ?? []
}

/** How far the take follows its lyrics, in a sentence. */
export function sungNote(sung: SungLyrics): string {
  const parts: string[] = []
  if (typeof sung.written_heard === 'number') parts.push(`sings ${Math.round(sung.written_heard * 100)} % of its lyrics' words as written`)
  if (typeof sung.extra_words === 'number' && sung.extra_words > 0) parts.push(`${sung.extra_words} word${sung.extra_words === 1 ? '' : 's'} they do not have`)
  const missing = sung.not_sung.length
  if (missing) parts.push(`${missing} line${missing === 1 ? '' : 's'} not heard`)
  const fixed = sung.corrected ?? []
  const said = parts.length ? `This take ${parts.join(', ')}.` : ''
  if (!fixed.length) return said
  const words = fixed.slice(0, 4).map((c) => `“${c.heard}” → “${c.word}”`).join(', ')
  return `${said} ${fixed.length} misheard word${fixed.length === 1 ? '' : 's'} corrected by the writer model: ${words}${fixed.length > 4 ? ' …' : ''}.`.trim()
}

/** The lyrics sections the take did not sing as written (fewer than 40 % of their words heard). */
export function sectionsNotSung(sung: SungLyrics): string[] {
  return sung.sections.filter((s) => s.words >= 4 && s.heard < 0.4 * s.words).map((s) => s.tag)
}
