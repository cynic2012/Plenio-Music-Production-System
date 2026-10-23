/**
 * Which lyrics to follow (owner's requests 2026-10-23): as written, or as the take sings them - by default as sung
 * where the take departs far from its lyrics, switched per song like master and original.
 */
import { describe, expect, it } from 'vitest'

import type { SongDetail, SungLyrics, TimedLine } from '../src/player/api'
import { choiceOf, choicesOf, chooseFor, departs, type LyricsPrefs, linesFor, ruleFor, sectionsNotSung, sungNote, sungOf, versionFor, versionOf } from '../src/player/lyricsVersion'
import { videoWithDefaults } from '../src/player/video/make'

const written: TimedLine[] = [{ text: 'Walking down the river side', start: 1, end: 3, units: [[1, 7, 0.5]] }]
const sung: SungLyrics = {
  lines: [
    { text: 'Walking down the riverside', start: 1, end: 3, units: [[1, 7]] },
    { text: 'oh baby baby', start: 7, end: 8.3, units: [[7, 2]] },
  ],
  text: '[Verse]\nWalking down the riverside\noh baby baby',
  written_heard: 0.667,
  extra_words: 3,
  not_sung: ['to the light we made'],
  sections: [
    { tag: 'Verse', words: 9, heard: 8 },
    { tag: 'Chorus', words: 9, heard: 2 },
  ],
}
const detail = (extra: Partial<SongDetail>): SongDetail => ({ id: 'a', lines: written, ...extra }) as SongDetail

describe('lyricsVersion', () => {
  it('follows the sung lines when chosen and there, else the written ones', () => {
    expect(linesFor(detail({ sung }), 'sung')).toBe(sung.lines)
    expect(linesFor(detail({ sung }), 'written')).toBe(written)
    // a song exported before: its written lines, whatever was chosen
    expect(linesFor(detail({ sung: {} }), 'sung')).toBe(written)
    expect(linesFor(detail({}), 'sung')).toBe(written)
    expect(sungOf(detail({ sung: {} }))).toBeNull()
    expect(linesFor(null, 'sung')).toEqual([])
  })

  it('says how far the take follows its lyrics', () => {
    expect(sungNote(sung)).toBe("This take sings 67 % of its lyrics' words as written, 3 words they do not have, 1 line not heard.")
    // the words the writer model found misheard (Check Sung Words)
    expect(sungNote({ ...sung, corrected: [{ line: 1, heard: 'doun', word: 'down' }] })).toContain('1 misheard word corrected by the writer model: “doun” → “down”.')
    expect(sectionsNotSung(sung)).toEqual(['Chorus'])
    expect(sungNote({ ...sung, written_heard: 1, extra_words: 0, not_sung: [] })).toBe("This take sings 100 % of its lyrics' words as written.")
  })

  it('keeps a saved choice and the video starts with the player’s', () => {
    expect(versionOf('sung')).toBe('sung')
    expect(versionOf('other')).toBe('written')
    expect(videoWithDefaults({}, null, 'sung').lyricsVersion).toBe('sung')
    expect(videoWithDefaults({ lyricsVersion: 'written' }, null, 'sung').lyricsVersion).toBe('written')
    expect(videoWithDefaults(null).lyricsVersion).toBe('written')
  })

  it('shows a take that departs far from its lyrics as sung, the others as written', () => {
    // 'Take a Chance On Me' (owner's covers, 2026-10-23): 58 % of the words as written, 189 of 490 its own
    expect(departs(sung)).toBe(true)
    const close = { ...sung, written_heard: 0.9, extra_words: 3 }
    expect(departs(close)).toBe(false)
    expect(departs({ ...close, extra_words: 6 })).toBe(true) // 6 of 18 words its own
    const prefs: LyricsPrefs = { lyricsChoice: 'auto', lyricsFor: {} }
    expect(versionFor(detail({ sung }), prefs)).toBe('sung')
    expect(versionFor(detail({ sung: close }), prefs)).toBe('written')
    expect(versionFor(detail({}), { lyricsChoice: 'sung', lyricsFor: { a: 'sung' } })).toBe('written') // nothing sung kept
    expect(ruleFor(detail({ sung: close }), 'sung')).toBe('sung')
  })

  it('keeps the listener’s choice for a song only where it differs from the rule', () => {
    const prefs: LyricsPrefs = { lyricsChoice: 'auto', lyricsFor: {} }
    const song = detail({ sung })
    chooseFor(song, 'written', prefs)
    expect(prefs.lyricsFor).toEqual({ a: 'written' })
    expect(versionFor(song, prefs)).toBe('written')
    chooseFor(song, 'sung', prefs) // the rule's own: nothing to keep
    expect(prefs.lyricsFor).toEqual({})
    expect(choiceOf('written')).toBe('written')
    expect(choiceOf(undefined)).toBe('auto')
    expect(choicesOf({ a: 'sung', b: 'loud', c: 3 })).toEqual({ a: 'sung' })
  })
})
