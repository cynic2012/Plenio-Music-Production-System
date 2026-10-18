/** Tags of your own and the filters (owner's request 2026-10-18): every genre of the templates among the filter
 * chips, a chip that leaves songs out, ranges for tempo and length, suggestions while typing - and tags per song,
 * given again from the list of the ones given before. */
import { beforeEach, describe, expect, it } from 'vitest'

import type { SongSummary } from '../src/player/api'
import { FACETS, chipParts, facetOf, facetValues, parseQuery, score, suggest, toggleFilterChip, valueLabel } from '../src/player/search'
import { addTag, allTags, cleanTag, deleteTag, removeTag, renameTag, settings, songTags, state, tagsOf } from '../src/player/store'

function song(over: Partial<SongSummary> & { id: string }): SongSummary {
  return {
    title: over.id, created: '2026-10-01T10:00:00', year: '2026', seconds: 180, model: 'YuE2', kind: 'song', brief: {}, genre: '', mood: '',
    language: 'English', vocals: 'female', instrumental: false, arrangement: 'off', template: '', style: '', lyrics: '',
    loudness: { lufs: -14, true_peak: -1, range: 6 }, tags: {}, plenio: '1.0.0', folder: '', file: over.id, takes_key: '',
    has: { audio: true, original: false, cover: false, pdf: false, lines: false, notes: false, stems: false, timing: false, score: false }, seeds: {}, writer: '',
    ...over,
  } // prettier-ignore
}

const SONGS = [
  song({ id: 'a', title: 'Midnight Train', genre: 'jazz, swing', bpm: 96, seconds: 150 }),
  song({ id: 'b', title: 'Neon Run', genre: 'synthwave, dance', bpm: 128, seconds: 250, has: { audio: true, original: false, cover: false, pdf: false, lines: true, notes: false, stems: false, timing: false, score: false } }),
  song({ id: 'c', title: 'Sufi Night', genre: 'qawwali, sufi devotional', bpm: 150, seconds: 400 }),
]
const context = { favorites: new Set<string>(), tags: { a: ['Party', 'road trip'], b: ['party'] }, plays: { a: 2 } }
const find = (query: string): string[] => SONGS.filter((s) => score(s, parseQuery(query), context) > 0).map((s) => s.id)

describe('the filters', () => {
  it('offer every genre, also the rare ones of a template, with how many songs have it', () => {
    const genre = FACETS.find((f) => f.id === 'genre')!
    const values = facetValues(SONGS, genre, context)
    expect(values.map(([v]) => v)).toEqual(expect.arrayContaining(['qawwali', 'sufi devotional', 'jazz', 'synthwave']))
    expect(values).toHaveLength(6)
    expect(find('genre:qawwali')).toEqual(['c'])
  })

  it('have ranges for the tempo and the length, and marks', () => {
    const tempo = FACETS.find((f) => f.id === 'bpm')!
    expect(facetValues(SONGS, tempo, context)).toEqual([['90-119', 1], ['120-139', 1], ['>=140', 1]])
    expect(find('bpm:"90-119"')).toEqual(['a'])
    expect(valueLabel(tempo, '>=140')).toBe('fast, 140 and up')
    const length = FACETS.find((f) => f.id === 'len')!
    expect(facetValues(SONGS, length, context)).toEqual([['<3', 1], ['3-5', 1], ['>5', 1]])
    expect(find('has:timing')).toEqual(['b']) // timed lyrics from subtitle files count
    expect(find('is:unplayed')).toEqual(['b', 'c'])
    expect(find('is:played')).toEqual(['a'])
    expect(find('is:untagged')).toEqual(['c'])
  })

  it('leave songs out with a chip of their own, which takes the place of the other kind', () => {
    let chips = toggleFilterChip([], 'genre', 'jazz')
    chips = toggleFilterChip(chips, 'genre', 'jazz', true)
    expect(chips).toEqual(['-genre:"jazz"'])
    expect(find(chips.join(' '))).toEqual(['b', 'c'])
    expect(chipParts(chips[0])).toEqual({ key: 'genre', value: 'jazz', exclude: true })
    expect(toggleFilterChip(chips, 'genre', 'jazz', true)).toEqual([])
    // a tempo is one range at a time
    expect(toggleFilterChip(['bpm:"<90"'], 'bpm', '>=140')).toEqual(['bpm:">=140"'])
    // the two rows that set is: are told apart by their values
    expect(facetOf('is', 'other')?.id).toBe('made')
    expect(facetOf('is', 'unplayed')?.id).toBe('played')
  })

  it('suggest fields, their values and your tags while you type', () => {
    expect(suggest('gen', SONGS, context).map((s) => s.label)).toContain('genre:')
    const genres = suggest('genre:qa', SONGS, context)
    expect(genres[0]).toMatchObject({ label: 'genre:qawwali', hint: '1 song', query: 'genre:qawwali ' })
    expect(suggest('night genre:sufi', SONGS, context)[0].query).toBe('night genre:"sufi devotional" ')
    expect(suggest('#pa', SONGS, context)[0]).toMatchObject({ label: '#Party', hint: '2 songs', query: 'tag:Party ' })
    expect(suggest('is:un', SONGS, context).map((s) => s.label)).toEqual(['is:unplayed', 'is:untagged'])
    expect(suggest('genre:qa ', SONGS, context)).toEqual([])
  })
})

describe('tags of your own', () => {
  beforeEach(() => {
    state.tags = {}
    settings.filters = { all: { query: '', chips: ['tag:"party"', 'genre:"jazz"'] } }
    settings.savedFilters = [{ id: 'f1', name: 'Parties', query: '', chips: ['-tag:"party"'] }]
  })

  it('are found by tag:, by #, and by a free word', () => {
    expect(find('tag:party')).toEqual(['a', 'b'])
    expect(find('#road')).toEqual([]) // a tag is matched whole
    expect(find('"#road trip"')).toEqual([])
    expect(find('tag:"road trip"')).toEqual(['a'])
    expect(find('road')).toEqual(['a'])
    expect(find('-#party')).toEqual(['c'])
  })

  it('are given once per song, spelled as the first time, and offered again from the list', () => {
    expect(addTag(['a', 'b'], '  Summer   2026 ')).toBe('Summer 2026')
    expect(addTag(['c'], 'summer 2026')).toBe('Summer 2026')
    addTag(['a'], 'SUMMER 2026')
    expect(songTags('a')).toEqual(['Summer 2026'])
    addTag(['a'], 'calm')
    expect(allTags.value).toEqual([['Summer 2026', 3], ['calm', 1]])
    removeTag(['a', 'b'], 'summer 2026')
    expect(state.tags).toEqual({ a: ['calm'], c: ['Summer 2026'] })
    expect(cleanTag('"#a, b"')).toBe('a b')
  })

  it('are renamed and deleted on every song, and the filters follow', () => {
    addTag(['a', 'b'], 'party')
    addTag(['b'], 'dance')
    renameTag('party', 'Dance')
    expect(state.tags).toEqual({ a: ['dance'], b: ['dance'] })
    expect(settings.filters.all.chips).toEqual(['tag:"dance"', 'genre:"jazz"'])
    expect(settings.savedFilters[0].chips).toEqual(['-tag:"dance"'])
    deleteTag('dance')
    expect(state.tags).toEqual({})
    expect(settings.filters.all.chips).toEqual(['genre:"jazz"'])
    expect(settings.savedFilters[0].chips).toEqual([])
  })

  it('are read back checked', () => {
    expect(tagsOf({ a: ['x', 'X', '', 3, 'y'], b: 'no', c: [] })).toEqual({ a: ['x', 'y'] })
    expect(tagsOf(null)).toEqual({})
  })
})
