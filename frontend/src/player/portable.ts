/**
 * The shared player (owner's request 2026-10-16): the player with songs in one HTML file that plays by itself
 * (plenio/player/package.py). When the page finds the songs inside itself, it is that player: it reads them
 * there instead of asking the player's server, and keeps the listener's playlists and settings in their
 * browser. The songs' sound, covers and sheet music are base64 blocks in the file, turned into files
 * (blob URLs) the first time they are needed.
 */
import { reactive } from 'vue'

import type { PlayerState, SongDetail, SongSummary } from './api'

export interface PortableData {
  format: string
  id: string
  title: string
  created: string
  plenio: string
  bitrate: number
  songs: SongSummary[]
  details: Record<string, SongDetail>
  peaks: Record<string, number[]>
  settings: Record<string, unknown>
  presets: { name: string; text: string; mtime: number }[]
  playlists: { name: string; songs: string[] }[]
  /** The tags of the songs, as the one who shared them gave them. */
  tags?: Record<string, string[]>
}

function read(): PortableData | null {
  if (typeof document === 'undefined') return null
  const el = document.getElementById('plenio-portable')
  if (!el?.textContent) return null
  try {
    const data = JSON.parse(el.textContent) as PortableData
    return data?.format === 'plenio.portable/1' ? data : null
  } catch {
    return null
  }
}

export const portable: PortableData | null = read()
/** This page is a shared player (no server, no ComfyUI). */
export const isPortable = portable !== null

// --- the songs' files ---------------------------------------------------------------------------------------

const urls = reactive(new Map<string, string>())
const pending = new Map<string, Promise<string>>()
const KINDS: Record<string, string> = { audio: 'audio', audio_mp3: 'audio', cover: 'cover', pdf: 'pdf' }

/** A song's file as a URL in the shared player - ``''`` until it is made (then the page shows it). */
export function portableMedia(id: string, kind: string): string {
  const block = KINDS[kind]
  if (!block) return ''
  const known = urls.get(`${block}/${id}`)
  if (known) return known
  void ensureMedia(id, kind)
  return ''
}

/** The song's file as a URL, made from its block in the page the first time. */
export function ensureMedia(id: string, kind: string): Promise<string> {
  const block = KINDS[kind]
  if (!block) return Promise.resolve('')
  const key = `${block}/${id}`
  const known = urls.get(key)
  if (known) return Promise.resolve(known)
  const waiting = pending.get(key)
  if (waiting) return waiting
  const el = document.querySelector<HTMLElement>(`script[data-plenio="${block}"][data-id="${CSS.escape(id)}"]`)
  if (!el?.textContent) return Promise.resolve('')
  const made = fetch(`data:${el.dataset.mime ?? 'application/octet-stream'};base64,${el.textContent.trim()}`)
    .then((response) => response.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob)
      urls.set(key, url)
      return url
    })
  pending.set(key, made)
  return made
}

// --- what the listener keeps (in this browser) -----------------------------------------------------------

const storageKey = (): string => `plenio-portable:${portable?.id ?? 'none'}`

/** The listener's playlists and settings for this shared player - at first its songs' playlists and the
 * look it was shared with. */
export function portableState(): PlayerState {
  try {
    const saved = localStorage.getItem(storageKey())
    if (saved) return JSON.parse(saved) as PlayerState
  } catch {
    // a private window, or storage switched off: start afresh every time
  }
  const now = new Date().toISOString()
  return {
    playlists: (portable?.playlists ?? []).map((p, k) => ({ id: `shared${k}`, name: p.name, songs: p.songs, created: now })),
    favorites: [],
    plays: {},
    last_played: {},
    tags: { ...(portable?.tags ?? {}) },
    settings: { ...(portable?.settings ?? {}) },
  }
}

export function savePortableState(state: PlayerState): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(state))
  } catch {
    // full or switched off: the settings last until the page closes
  }
}

export function notInShared(): never {
  throw new Error('Not in a shared player - only in the Plenio Player')
}
