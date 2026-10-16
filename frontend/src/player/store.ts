/**
 * The player's state: the library, the listener's state (playlists, favourites, plays, settings - saved on
 * the server), the route (``#/``, ``#/song/<id>``, ``#/playlist/<id>`` ...), the queue and what plays.
 */
import { computed, reactive, ref, shallowRef, watch } from 'vue'

import { api, media, type Playlist, type PlayerState, type RemoveAnswer, type SongDetail, type SongSummary } from './api'
import { engine } from './engine'
import { type VisualSettings, withDefaults } from './visuals/chooser'

export interface Settings {
  volume: number
  crossfade: number
  rate: number
  sort: string
  view: 'grid' | 'list'
  repeat: 'off' | 'all' | 'one'
  shuffle: boolean
  visuals: VisualSettings
  resume: { queue: string[]; index: number; time: number } | null
  sidebar: boolean
}

const DEFAULT_SETTINGS: Settings = {
  volume: 0.85,
  crossfade: 3,
  rate: 1,
  sort: 'newest',
  view: 'grid',
  repeat: 'all',
  shuffle: false,
  visuals: withDefaults(null),
  resume: null,
  sidebar: true,
}

export const library = shallowRef<SongSummary[]>([])
const details = new Map<string, SongDetail>()
export const folders = ref<string[]>([])
export const loading = ref(true)
export const loadError = ref('')

export const state = reactive<PlayerState>({ playlists: [], favorites: [], plays: {}, last_played: {}, settings: {} })
export const settings = reactive<Settings>({ ...DEFAULT_SETTINGS })

export const byId = computed(() => new Map(library.value.map((s) => [s.id, s])))

// --- the route ----------------------------------------------------------------------------------------

export const route = ref(location.hash.slice(1) || '/')
window.addEventListener('hashchange', () => {
  route.value = location.hash.slice(1) || '/'
})
/** Open a page; ``replace``: in place of the one shown (the browser's Back skips it). */
export function go(path: string, replace = false): void {
  if (location.hash.slice(1) === path) return
  if (replace) {
    history.replaceState(null, '', `#${path}`)
    route.value = path
  } else location.hash = path
}

// --- loading and saving -------------------------------------------------------------------------------

let saving: number | undefined
function save(): void {
  clearTimeout(saving)
  saving = window.setTimeout(() => {
    state.settings = JSON.parse(JSON.stringify(settings))
    void api.saveState(JSON.parse(JSON.stringify(state)) as PlayerState).catch(() => {})
  }, 600)
}

export async function load(): Promise<void> {
  loading.value = true
  try {
    const [answer, saved] = await Promise.all([api.library(), api.state()])
    library.value = answer.songs
    folders.value = answer.folders
    Object.assign(state, saved)
    const stored = (saved.settings ?? {}) as Partial<Settings>
    Object.assign(settings, { ...DEFAULT_SETTINGS, ...stored, visuals: withDefaults(stored.visuals) })
    engine.setVolume(settings.volume)
    engine.setRate(settings.rate)
    loadError.value = ''
    restore()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error)
  } finally {
    loading.value = false
  }
  watch([settings, () => state.playlists, () => state.favorites], save, { deep: true })
}

export async function rescan(): Promise<void> {
  await api.rescan()
  const answer = await api.library()
  library.value = answer.songs
}

// --- removing a song (owner's request 2026-10-16: a song you do not want any more) -----------------------

/** The song whose removal is being asked (the dialog in App.vue). */
export const removing = shallowRef<SongSummary | null>(null)

/** Retire the song (its files to the retired songs' folder) or delete it for good; it leaves the queue, the
 * playlists and the favourites. A song that plays makes way for the next one first. */
export async function removeSong(id: string, action: 'retire' | 'delete'): Promise<RemoveAnswer> {
  if (current.value?.id === id) {
    if (queue.value.length > 1) await next()
    else engine.pause()
  }
  engine.release(id)
  const answer = await api.removeSong(id, action)
  const nowId = queue.value[index.value]
  queue.value = queue.value.filter((x) => x !== id)
  index.value = nowId && nowId !== id ? queue.value.indexOf(nowId) : -1
  state.favorites = state.favorites.filter((x) => x !== id)
  for (const playlist of state.playlists) playlist.songs = playlist.songs.filter((x) => x !== id)
  delete state.plays[id]
  delete state.last_played[id]
  delete settings.visuals.songs[id]
  details.delete(id)
  const fresh = await api.library()
  library.value = fresh.songs
  return answer
}

// --- favourites and playlists -------------------------------------------------------------------------

export const isFavorite = (id: string): boolean => state.favorites.includes(id)
export function toggleFavorite(id: string): void {
  const at = state.favorites.indexOf(id)
  if (at >= 0) state.favorites.splice(at, 1)
  else state.favorites.unshift(id)
}

export function newPlaylist(name: string, songs: string[] = []): Playlist {
  const playlist: Playlist = {
    id: `pl-${Date.now().toString(36)}`,
    name: name.trim() || 'New playlist',
    songs: [...songs],
    created: new Date().toISOString(),
    hue: Math.floor(Math.random() * 360),
  }
  state.playlists.push(playlist)
  return playlist
}

export function addToPlaylist(playlist: Playlist, ids: string[]): void {
  for (const id of ids) if (!playlist.songs.includes(id)) playlist.songs.push(id)
}

export function deletePlaylist(id: string): void {
  const at = state.playlists.findIndex((p) => p.id === id)
  if (at >= 0) state.playlists.splice(at, 1)
}

// --- the queue and playback -------------------------------------------------------------------------

export const queue = ref<string[]>([])
export const index = ref(-1)
/** The playlist the queue came from (its visual applies), ``''`` for the library. */
export const queueSource = ref('')
export const current = computed<SongSummary | null>(() => byId.value.get(queue.value[index.value] ?? '') ?? null)
export const detail = shallowRef<SongDetail | null>(null)
export const playing = ref(false)
export const time = ref(0)
export const duration = ref(0)
export const nowPlayingOpen = ref(false)

export async function songDetail(id: string): Promise<SongDetail> {
  const cached = details.get(id)
  if (cached) return cached
  const found = await api.song(id)
  details.set(id, found)
  return found
}

function audioUrl(song: SongSummary): string {
  return media(song.id, 'audio')
}

let counted = ''
export async function playAt(i: number, { crossfade = 0, at = 0, autoplay = true } = {}): Promise<void> {
  const id = queue.value[i]
  const song = id ? byId.value.get(id) : undefined
  if (!song) return
  index.value = i
  counted = ''
  if (ab.value && !song.has.original) {
    ab.value = false
    engine.setAB(false)
  }
  await engine.load(
    { id: song.id, url: audioUrl(song), original: song.has.original ? media(song.id, 'original') : null },
    { crossfade, at, autoplay }
  )
  detail.value = null
  songDetail(song.id).then((d) => {
    if (current.value?.id === d.id) detail.value = d
  }).catch(() => {})
  mediaSession(song)
}

export async function playSongs(ids: string[], start = 0, source = ''): Promise<void> {
  if (!ids.length) return
  let order = [...ids]
  let first = start
  if (settings.shuffle) {
    const head = order[start]
    order = shuffle(order.filter((_, k) => k !== start))
    order.unshift(head)
    first = 0
  }
  queue.value = order
  queueSource.value = source
  await playAt(first)
}

export async function playSong(id: string, context: string[] = [], source = ''): Promise<void> {
  const list = context.length ? context : [id]
  await playSongs(list, Math.max(0, list.indexOf(id)), source)
}

/** Plays a song from ``at`` seconds: the song that plays jumps there, another one starts there. */
export async function playSongAt(id: string, at: number, context: string[] = []): Promise<void> {
  if (current.value?.id === id) {
    engine.seek(at)
    if (engine.paused) await engine.play()
    return
  }
  const list = context.includes(id) ? context : [id]
  queue.value = [...list]
  queueSource.value = ''
  await playAt(list.indexOf(id), { at })
}

export function enqueue(ids: string[], next = false): void {
  if (index.value < 0) {
    void playSongs(ids)
    return
  }
  const fresh = ids.filter((id) => !queue.value.includes(id) || next)
  if (next) queue.value.splice(index.value + 1, 0, ...fresh)
  else queue.value.push(...fresh)
}

export function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[k]] = [out[k], out[i]]
  }
  return out
}

// --- A/B, mute, the sleep timer ----------------------------------------------------------------------

/** A/B: the song's unmastered take instead of the master, in step. */
export const ab = ref(false)
export function toggleAB(): void {
  if (!current.value?.has.original && !ab.value) return
  ab.value = !ab.value
  engine.setAB(ab.value)
}

export const muted = ref(false)
export function toggleMute(): void {
  muted.value = !muted.value
  engine.setVolume(muted.value ? 0 : settings.volume)
}
export function setVolume(value: number): void {
  settings.volume = Math.max(0, Math.min(1, value))
  muted.value = false
  engine.setVolume(settings.volume)
}

/** The sleep timer: the music fades out over its last seconds and stops (``'song'``: after this song). */
export const sleep = ref<{ at: number; minutes: number } | 'song' | null>(null)
export const sleepLeft = ref(0)
const SLEEP_FADE_S = 12
export function setSleep(minutes: number | 'song' | null): void {
  if (sleep.value && sleep.value !== 'song') engine.setVolume(muted.value ? 0 : settings.volume)
  sleep.value = minutes === null || minutes === 'song' ? minutes : { at: Date.now() + minutes * 60_000, minutes }
}
function sleepTick(): void {
  const timer = sleep.value
  if (!timer || timer === 'song') {
    sleepLeft.value = 0
    return
  }
  const left = (timer.at - Date.now()) / 1000
  sleepLeft.value = Math.max(0, left)
  if (left <= 0) {
    engine.pause()
    sleep.value = null
    engine.setVolume(muted.value ? 0 : settings.volume)
  } else if (left < SLEEP_FADE_S && !muted.value) {
    engine.setVolume(settings.volume * (left / SLEEP_FADE_S))
  }
}

export async function next(auto = false): Promise<void> {
  if (!queue.value.length) return
  if (auto && sleep.value === 'song') {
    sleep.value = null
    engine.pause()
    return
  }
  if (auto && settings.repeat === 'one') {
    engine.seek(0)
    await engine.play()
    return
  }
  let i = index.value + 1
  if (i >= queue.value.length) {
    if (settings.repeat === 'off' && auto) {
      engine.pause()
      return
    }
    i = 0
  }
  await playAt(i, { crossfade: auto ? settings.crossfade : 0 })
}

export async function previous(): Promise<void> {
  if (engine.time > 3 || index.value <= 0) {
    engine.seek(0)
    return
  }
  await playAt(index.value - 1)
}

function mediaSession(song: SongSummary): void {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.tags.artist || song.model || 'Plenio',
    album: song.tags.album || song.genre,
    artwork: song.has.cover ? [{ src: media(song.id, 'cover'), sizes: '512x512', type: 'image/jpeg' }] : [],
  })
  navigator.mediaSession.setActionHandler('play', () => void engine.play())
  navigator.mediaSession.setActionHandler('pause', () => engine.pause())
  navigator.mediaSession.setActionHandler('nexttrack', () => void next())
  navigator.mediaSession.setActionHandler('previoustrack', () => void previous())
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime !== undefined) engine.seek(details.seekTime)
  })
}

// the engine's ticks: time, end of song (crossfade early), plays counted after 30 s, the resume point
let lastResume = 0
engine.on(() => {
  playing.value = !engine.paused
  time.value = engine.time
  duration.value = engine.duration
})
function tick(): void {
  time.value = engine.time
  sleepTick()
  engine.keepInStep()
  const song = current.value
  if (song && playing.value) {
    const left = engine.duration - engine.time
    if (engine.duration > 0 && left <= Math.max(0.05, settings.crossfade) && settings.repeat !== 'one' && !fadingOut) {
      fadingOut = true
      void next(true).finally(() => window.setTimeout(() => (fadingOut = false), 400))
    }
    if (counted !== song.id && engine.time > 30) {
      counted = song.id
      state.plays[song.id] = (state.plays[song.id] ?? 0) + 1
      state.last_played[song.id] = new Date().toISOString()
      save()
    }
    const now = performance.now()
    if (now - lastResume > 5000) {
      lastResume = now
      settings.resume = { queue: queue.value.slice(0, 500), index: index.value, time: engine.time }
    }
  }
  requestAnimationFrame(tick)
}
let fadingOut = false
requestAnimationFrame(tick)

function restore(): void {
  const resume = settings.resume
  if (!resume?.queue?.length) return
  const ids = resume.queue.filter((id) => byId.value.has(id))
  if (!ids.length) return
  queue.value = ids
  const i = Math.max(0, Math.min(ids.length - 1, resume.index))
  void playAt(i, { at: resume.time, autoplay: false })
}
