/**
 * Which lyrics the player follows (owner's request 2026-10-23): the lyrics **as written** - the song's lyrics,
 * timed by listening - or **as sung** - what the take really sings, as the lyrics ASR heard it when the song was
 * exported (``core.subtitles.time_sung``). A music model does not always sing what it was given: it repeats a
 * line, makes one up, leaves one out. The notation always follows the written lyrics' syllables: only they
 * carry the score's times.
 */
import type { SongDetail, SungLyrics, TimedLine } from './api'

export type LyricsVersion = 'written' | 'sung'

export const LYRICS_VERSIONS: { id: LyricsVersion; label: string; title: string }[] = [
  { id: 'written', label: 'As written', title: "The song's lyrics, at the times they are sung" },
  { id: 'sung', label: 'As sung', title: 'What the take really sings, as heard when the song was exported' }
]

export function versionOf(raw: unknown): LyricsVersion {
  return raw === 'sung' ? 'sung' : 'written'
}

/** What the take sings, when the song was exported with it (songs exported before have none). */
export function sungOf(detail: SongDetail | null | undefined): SungLyrics | null {
  const sung = detail?.sung
  return sung && Array.isArray(sung.lines) && sung.lines.length ? (sung as SungLyrics) : null
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
  return parts.length ? `This take ${parts.join(', ')}.` : ''
}

/** The lyrics sections the take did not sing as written (fewer than 40 % of their words heard). */
export function sectionsNotSung(sung: SungLyrics): string[] {
  return sung.sections.filter((s) => s.words >= 4 && s.heard < 0.4 * s.words).map((s) => s.tag)
}
