/** What plays now, in song time: its lines, sections, the current line and section, its colours. */
import { computed, ref, watch } from 'vue'

import { media } from './api'
import { coverHue, paletteFrom, songHue } from './colors'
import { current, detail, duration, queueSource, state, time } from './store'
import { anchorsOf, lineAt, sectionAt, sectionsInSong } from './timing'

export const lines = computed(() => detail.value?.lines ?? [])
export const anchors = computed(() => anchorsOf(lines.value))
export const sections = computed(() =>
  sectionsInSong(detail.value?.notation.sections, anchors.value, detail.value?.notation.warp, duration.value || Infinity)
)
export const section = computed(() => sectionAt(sections.value, time.value))
export const lineIndex = computed(() => lineAt(lines.value, time.value))

/** The playlist the queue came from, for its visual. */
export const playlistVisual = computed(() => state.playlists.find((p) => p.id === queueSource.value)?.visual ?? '')

const coverHues = new Map<string, number | null>()
export const hue = ref(220)
watch(
  current,
  async (song) => {
    if (!song) return
    hue.value = songHue(song.id, song.genre)
    if (song.has.cover) {
      if (!coverHues.has(song.id)) coverHues.set(song.id, await coverHue(media(song.id, 'cover')))
      const found = coverHues.get(song.id)
      if (found !== null && found !== undefined && current.value?.id === song.id) hue.value = found
    }
  },
  { immediate: true }
)
export const palette = computed(() => paletteFrom(hue.value))

/** The CSS custom properties of the song's colours. */
export const paletteStyle = computed(() => ({
  '--accent': palette.value.accent,
  '--accent2': palette.value.accent2,
  '--deep': palette.value.deep,
  '--glow': palette.value.glow,
}))

export const playCount = computed(() => (current.value ? state.plays[current.value.id] ?? 0 : 0))
