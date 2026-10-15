import { describe, expect, it } from 'vitest'

import type { SongSummary, TimedLine } from '../src/player/api'
import { lyricsSnippet, parseQuery, score, sortSongs, topValues } from '../src/player/search'
import { similarSongs, takesOf } from '../src/player/similar'
import { anchorsOf, audioToScore, chunksAt, countOf, formatTime, lineAt, scoreToAudio, sectionAt, sectionsInSong } from '../src/player/timing'
import { chooseVisual, songMoods, withDefaults } from '../src/player/visuals/chooser'
import { PRESETS } from '../src/player/visuals/presets'

function song(over: Partial<SongSummary> & { id: string }): SongSummary {
  return {
    title: over.id,
    created: '2026-10-01T10:00:00',
    year: '2026',
    seconds: 180,
    model: 'YuE2',
    kind: 'song',
    brief: {},
    genre: '',
    mood: '',
    language: 'English',
    vocals: 'female',
    instrumental: false,
    arrangement: 'off',
    template: '',
    style: '',
    lyrics: '',
    loudness: { lufs: -14, true_peak: -1, range: 6 },
    tags: {},
    plenio: '0.8.1',
    folder: '',
    file: over.id,
    takes_key: '',
    has: { audio: true, original: false, cover: false, pdf: false, lines: false, notes: false, stems: false, timing: false, score: false },
    seeds: {},
    writer: '',
    ...over,
  }
}

const LINES: TimedLine[] = [
  { text: 'Blue light pooling', start: 10, end: 12.5, units: [[10, 5, 8], [10.6, 11, 8.5], [11.4, 18, 9]] },
  { text: 'on the sidewalk', start: 13, end: 15, units: [[13, 3, 10], [13.5, 7, 10.5], [14, 15, 11]] },
]

describe('timing', () => {
  it('formats times and counts', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65.9)).toBe('1:05')
    expect(formatTime(Number.NaN)).toBe('0:00')
    expect(countOf(1, 'song')).toBe('1 song')
    expect(countOf(3, 'song')).toBe('3 songs')
  })

  it('finds the line sung at a time', () => {
    expect(lineAt(LINES, 5)).toBe(-1)
    expect(lineAt(LINES, 10)).toBe(0)
    expect(lineAt(LINES, 12.8)).toBe(0)
    expect(lineAt(LINES, 20)).toBe(1)
  })

  it('paints a line syllable by syllable', () => {
    expect(chunksAt(LINES[0], 9).map((c) => c.fill)).toEqual([0, 0, 0])
    const half = chunksAt(LINES[0], 10.3)
    expect(half.map((c) => c.text)).toEqual(['Blue ', 'light ', 'pooling'])
    expect(half[0].fill).toBeCloseTo(0.5)
    expect(half[1].fill).toBe(0)
    expect(chunksAt(LINES[0], 13).every((c) => c.fill === 1)).toBe(true)
  })

  it('maps song time to score time and back through the sung syllables', () => {
    const anchors = anchorsOf(LINES)
    expect(anchors).toHaveLength(6)
    expect(audioToScore(10.6, anchors)).toBeCloseTo(8.5)
    expect(audioToScore(12.2, anchors)).toBeCloseTo(9.5)
    for (const t of [9, 10.3, 12, 14.2, 30]) expect(scoreToAudio(audioToScore(t, anchors), anchors)).toBeCloseTo(t)
    // without syllables the warp decides: t_audio = 1.1 * t_score + 2
    expect(audioToScore(13, [], [1.1, 2])).toBeCloseTo(10)
    expect(scoreToAudio(10, [], [1.1, 2])).toBeCloseTo(13)
  })

  it('places the score sections on the song', () => {
    const sections = sectionsInSong([{ label: 'verse', start: 8, bar: 5 }, { label: 'chorus', start: 10.5, bar: 9 }], anchorsOf(LINES), null, 100)
    expect(sections.map((s) => s.at)).toEqual([10, 13.5])
    expect(sectionAt(sections, 12)?.label).toBe('verse')
    expect(sectionAt(sections, 5)).toBeNull()
  })
})

describe('search', () => {
  const songs = [
    song({ id: 'a', title: 'Midnight Train', genre: 'jazz, swing', mood: 'warm', bpm: 96, score_key: 'Am', lyrics: 'the station lights\nwe ride till dawn' }),
    song({ id: 'b', title: 'Neon Run', genre: 'synthwave', mood: 'driving', bpm: 128, score_key: 'C', model: 'MiniMax Music 3', created: '2026-10-05T10:00:00' }),
    song({ id: 'c', title: 'Quiet Fields', genre: 'folk', mood: 'calm', bpm: 72, instrumental: true, vocals: 'instrumental', model: '', has: { audio: true, original: false, cover: false, pdf: true, lines: false, notes: false, stems: false, timing: false, score: true }, seeds: {} }),
  ]
  const context = { favorites: new Set(['c']) }
  const find = (query: string): string[] => songs.filter((s) => score(s, parseQuery(query), context) > 0).map((s) => s.id)

  it('parses fields, phrases and negation', () => {
    expect(parseQuery('genre:jazz "station lights" -neon bpm:>100 foo:bar')).toEqual([
      { field: 'genre', value: 'jazz', negate: false },
      { field: '', value: 'station lights', negate: false },
      { field: '', value: 'neon', negate: true },
      { field: 'bpm', value: '>100', negate: false },
      { field: '', value: 'foo:bar', negate: false },
    ])
  })

  it('filters by words and fields', () => {
    expect(find('midnight')).toEqual(['a'])
    expect(find('genre:jazz')).toEqual(['a'])
    expect(find('bpm:>100')).toEqual(['b'])
    expect(find('bpm:70-100')).toEqual(['a', 'c'])
    expect(find('key:am')).toEqual(['a'])
    expect(find('model:minimax')).toEqual(['b'])
    expect(find('model:master')).toEqual(['c'])
    expect(find('vocals:instrumental')).toEqual(['c'])
    expect(find('is:fav')).toEqual(['c'])
    expect(find('has:pdf')).toEqual(['c'])
    expect(find('"till dawn"')).toEqual(['a'])
    expect(find('-jazz')).toEqual(['b', 'c'])
  })

  it('ranks title hits above lyrics hits and sorts', () => {
    const terms = parseQuery('station')
    expect(score(songs[0], terms, context)).toBeGreaterThan(1)
    const titleHit = score(song({ id: 'x', title: 'Station' }), terms, context)
    expect(titleHit).toBeGreaterThan(score(songs[0], terms, context))
    expect(sortSongs(songs, 'newest', { plays: {}, lastPlayed: {} }).map((s) => s.id)[0]).toBe('b')
    expect(sortSongs(songs, 'bpm', { plays: {}, lastPlayed: {} }).map((s) => s.id)).toEqual(['b', 'a', 'c'])
    expect(sortSongs(songs, 'plays', { plays: { c: 3, a: 1 }, lastPlayed: {} }).map((s) => s.id)).toEqual(['c', 'a', 'b'])
    expect(lyricsSnippet(songs[0], terms)).toBe('the station lights')
    expect(topValues(songs, (s) => [s.mood])).toEqual([['calm', 1], ['driving', 1], ['warm', 1]])
  })
})

describe('songs alike', () => {
  it('finds songs of the same genre and tempo, and the other takes', () => {
    const base = song({ id: 'a', genre: 'jazz, swing', mood: 'warm', bpm: 96, takes_key: 'k1' })
    const take = song({ id: 'a2', genre: 'jazz, swing', mood: 'warm', bpm: 96, takes_key: 'k1' })
    const near = song({ id: 'b', genre: 'jazz', mood: 'warm', bpm: 100 })
    const far = song({ id: 'c', genre: 'metal', mood: 'aggressive', bpm: 180, language: 'German', instrumental: true })
    const all = [base, take, near, far]
    expect(similarSongs(base, all).map((s) => s.id)).toEqual(['b'])
    expect(takesOf(base, all).map((s) => s.id)).toEqual(['a2'])
  })
})

describe('the visual chooser', () => {
  const settings = withDefaults(null)
  const calm = song({ id: 's1', genre: 'ambient', mood: 'calm', bpm: 70 })

  it('reads what a song is like', () => {
    expect(songMoods(calm)).toContain('calm')
    expect(songMoods(song({ id: 's', genre: 'techno', bpm: 132 }))).toEqual(expect.arrayContaining(['electronic', 'energetic']))
  })

  it('lets the song win over the playlist and the playlist over the mode', () => {
    const own = { ...settings, songs: { s1: 'fire' } }
    expect(chooseVisual({ settings: own, song: calm, playlist: 'plasma' })).toBe('fire')
    expect(chooseVisual({ settings, song: calm, playlist: 'plasma' })).toBe('plasma')
    expect(chooseVisual({ settings: { ...settings, mode: 'fixed', fixed: 'scope' }, song: calm })).toBe('scope')
  })

  it('picks at random from the ticked visuals, never the same twice in a row', () => {
    const pool = ['bars', 'scope', 'radial']
    const random = { ...settings, mode: 'random' as const, pool }
    for (let i = 0; i < 30; i++) {
      const picked = chooseVisual({ settings: random, song: calm, previous: 'bars', random: () => i / 30 })
      expect(pool).toContain(picked)
      expect(picked).not.toBe('bars')
    }
  })

  it('cycles through the ticked visuals in turn', () => {
    const cycle = { ...settings, mode: 'cycle' as const, pool: ['bars', 'scope', 'radial'] }
    expect(chooseVisual({ settings: cycle, song: calm, previous: 'bars' })).toBe('scope')
    expect(chooseVisual({ settings: cycle, song: calm, previous: 'radial' })).toBe('bars')
  })

  it('matches the music: the same song starts with the same suitable visual', () => {
    const first = chooseVisual({ settings, song: calm })
    expect(chooseVisual({ settings, song: calm })).toBe(first)
    expect(PRESETS.find((p) => p.id === first)?.suits).toContain('calm')
    expect(chooseVisual({ settings, song: calm, previous: first, turn: 1 })).not.toBe(first)
  })

  it('keeps unknown visuals out of saved settings', () => {
    expect(withDefaults({ pool: ['gone', 'bars'] }).pool).toEqual(['bars'])
    expect(withDefaults({ pool: ['gone'] }).pool).toHaveLength(PRESETS.length)
  })
})
