/**
 * Which lyrics to follow (owner's request 2026-10-23): as written, or as the take sings them - and the
 * notation always on the written ones.
 */
import { describe, expect, it } from 'vitest'

import type { SongDetail, SungLyrics, TimedLine } from '../src/player/api'
import { linesFor, sectionsNotSung, sungNote, sungOf, versionOf } from '../src/player/lyricsVersion'
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
const detail = (extra: Partial<SongDetail>): SongDetail => ({ lines: written, ...extra }) as SongDetail

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
})
