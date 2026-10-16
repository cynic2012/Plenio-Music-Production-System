/** The Plenio Player's server (plenio/player/server.py): the library, one song, the files and the state. */

export interface Loudness {
  lufs: number | null
  true_peak: number | null
  range: number | null
}

export interface Brief {
  kind?: string
  mode?: string
  template?: string
  description?: string
  genre?: string
  mood?: string
  tempo?: string
  length?: string
  vocals?: string
  language?: string
  voice?: string
  theme?: string
  lead_instrument?: string
  key?: string
  meter?: string
  arrangement?: string
  harmony?: string
  closeness?: number | null
}

export interface SongSummary {
  id: string
  title: string
  created: string
  year: string
  seconds: number
  model: string
  kind: string
  brief: Brief
  genre: string
  mood: string
  language: string
  vocals: string
  instrumental: boolean
  arrangement: string
  template: string
  style: string
  lyrics: string
  loudness: Loudness
  tags: Record<string, string>
  plenio: string
  folder: string
  file: string
  takes_key: string
  has: Record<'audio' | 'original' | 'cover' | 'pdf' | 'lines' | 'notes' | 'stems' | 'timing' | 'score', boolean>
  bpm?: number | null
  score_key?: string
  score_meter?: string
  seeds: Partial<Record<'take' | 'draft' | 'arrangement', number>>
  writer: string
}

/** A timed lyrics line: ``units`` are ``[start, cut]`` (the line shown up to ``cut`` from ``start``), with the
 * syllable's place in the score as a third number where the song has a score. */
export interface TimedLine {
  text: string
  start: number
  end: number
  units: number[][]
}

export interface Section {
  label: string
  start: number
  bar: number
}

export interface Notation {
  abc?: string
  tempo?: number
  sections?: Section[]
  seconds?: number
  warp?: [number, number] | null
  error?: string
}

export interface SongDetail extends SongSummary {
  documents: Record<string, string>
  lyrics_raw: string
  notation: Notation
  lines: TimedLine[]
  timing_source: string
  files: Record<string, string>
  record_path: string
  /** Every file the song has in its record's folder (relative to it): what removing it moves or deletes. */
  owned_files: string[]
  /** Where retiring moves the files. */
  retire_to: string
  licences: string[]
  versions: Record<string, string>
}

export interface Playlist {
  id: string
  name: string
  songs: string[]
  created: string
  hue?: number
  /** A visual for the whole playlist (``''``: the visual settings decide). */
  visual?: string
}

export interface PlayerState {
  playlists: Playlist[]
  favorites: string[]
  plays: Record<string, number>
  last_played: Record<string, string>
  settings: Record<string, unknown>
}

export interface RemoveAnswer {
  action: 'retire' | 'delete'
  files: string[]
  folder: string | null
}

/** Who answers (``/api/info``): the player, where it keeps the state, which ComfyUI started it. */
export interface PlayerInfo {
  app: string
  version: string
  folders: string[]
  state: string
  retired: string
  comfyui: string
  pid: number
}

export interface ComfyFound {
  url: string
  version: string
}

export interface LibraryAnswer {
  songs: SongSummary[]
  folders: string[]
  errors: string[]
  version: string
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return (await response.json()) as T
}

export const api = {
  library: () => json<LibraryAnswer>('/api/library'),
  song: (id: string) => json<SongDetail>(`/api/song/${id}`),
  state: () => json<PlayerState>('/api/state'),
  /** ``keepalive``: also when the page is closing (the last change is not lost). */
  saveState: (state: PlayerState, keepalive = false) =>
    json<{ ok: boolean }>('/api/state', {
      method: 'PUT',
      keepalive,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }),
  info: () => json<PlayerInfo>('/api/info'),
  find: (record: string) => json<{ id: string }>(`/api/find?record=${encodeURIComponent(record)}`),
  comfyui: (url = '') => json<{ found: ComfyFound | null }>(`/api/comfyui${url ? `?url=${encodeURIComponent(url)}` : ''}`),
  quit: () => json<{ ok: boolean }>('/api/quit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
  rescan: () => json<{ songs: number }>('/api/rescan', { method: 'POST' }),
  removeSong: (id: string, action: 'retire' | 'delete') =>
    json<RemoveAnswer>(`/api/song/${id}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, confirm: id }),
    }),
  peaks: (id: string) => json<{ peaks: number[] }>(`/api/peaks/${id}`)
}

export const media = (id: string, kind: string): string => `/media/${id}/${kind}`
