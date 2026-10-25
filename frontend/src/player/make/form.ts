/**
 * Party songs (owner's request 2026-10-25, docs/design/party-songs.md): the simple form's logic - a style template
 * fills every field, each field offers every value the templates have (or one of one's own), the fields a song's
 * vocals or a cover do not ask are left out - and how a song in the making is told: in line, being made, ready.
 * Pure: the player's page and the party guests' page use it alike.
 */

export type Kind = 'song' | 'cover'

export interface StyleTemplate {
  id: string
  name: string
  group: string
  fields: Record<string, string>
}

export interface FormData {
  source: 'studio' | 'package'
  templates: StyleTemplate[]
  values: Record<string, string[]>
  song: { fields: string[]; choices: { length: string[]; vocals: string[] }; defaults: { length?: string; vocals?: string } }
  cover: { fields: string[]; choices: { vocals: string[] }; defaults: { vocals?: string } }
  limits: { description: number; text: number; source_mb: number; max_length: string }
  covers: boolean
}

export interface Source {
  id: string
  name: string
  title: string
  seconds: number
}

export interface Draft {
  kind: Kind
  fields: Record<string, string>
  source: Source | null
}

export interface Stage {
  group: string
  text: string
  index?: number | null
  of?: number | null
}

export interface MakeJob {
  id: string
  kind: Kind
  status: 'waiting' | 'sending' | 'queued' | 'running' | 'done' | 'failed' | 'cancelled'
  owner: { kind: string; name: string }
  mine: boolean
  label: string
  description: string
  created: number
  started: number | null
  finished: number | null
  position: number | null
  eta: number | null
  starts: number | null
  estimate: number
  stage: Stage | null
  progress: { nodes_done?: number; nodes?: number; step?: number; steps?: number } | null
  result: { title?: string; record?: string; song?: string } | null
  error: string
  note: string
  can: { edit: boolean; up: boolean; down: boolean; delete: boolean }
  fields?: Record<string, string>
  source?: Source | null
}

/** Who made a party song, while it plays: not shown, large at its moments with a badge between, or floating
 * across the picture all the way (``plenio.player.maker.CREDITS``). */
export type Credit = 'off' | 'spotlight' | 'drift'
export const CREDITS: { value: Credit; label: string }[] = [
  { value: 'off', label: 'Not shown' },
  { value: 'spotlight', label: 'Spotlight - large as it begins, at every new section and as it ends; a badge between' },
  { value: 'drift', label: 'Drift - the name floats across the picture all the way, glowing with the beat' },
]

/** Who made a party song, from its tags: the album *Party-Song <date>* (made by the player's party songs), the
 * artist the user's name or *Guest*; ``null`` for every other song. */
export function partyMaker(tags: Record<string, string> | undefined): string | null {
  if (!/^Party-Song \d{4}-\d{2}-\d{2}$/.test((tags?.album ?? '').trim())) return null
  return (tags?.artist ?? '').trim() || 'Guest'
}

export type CreditMoment = { kind: 'intro' | 'section' | 'outro'; label: string } | null

/** What the credit shows at ``time`` of a song of ``duration`` seconds: the opening (its first 7 s), a new
 * section (4 s from each section after the first), the ending (its last 8 s) - else ``null``, the badge. */
export function creditMoment(time: number, duration: number, sections: { at: number; label: string }[]): CreditMoment {
  if (time < 7) return { kind: 'intro', label: '' }
  if (duration > 20 && time > duration - 8) return { kind: 'outro', label: '' }
  for (const s of sections) if (s.at > 1 && time >= s.at && time < s.at + 4) return { kind: 'section', label: s.label }
  return null
}

/** Where the drifting name is at ``time``: a slow figure over the picture (per cent of its width and height),
 * the same at the same moment of the song. */
export function driftAt(time: number): { x: number; y: number; tilt: number } {
  return {
    x: 50 + 33 * Math.sin(time * 0.071),
    y: 46 + 27 * Math.sin(time * 0.053 + 1.1),
    tilt: 4 * Math.sin(time * 0.11),
  }
}

export interface MakeStatus {
  on: boolean
  may: boolean
  why: string
  me: { kind: 'admin' | 'user' | 'guest'; name: string }
  admin: boolean
  settings: { on?: boolean; users?: boolean; guests?: boolean; per_person: number; max_length: string; covers: boolean; credit?: Credit }
  studio: { reachable: boolean; error: string }
  line: { waiting: number; making: boolean; free: number }
  jobs: MakeJob[]
}

export const SONG_FIELDS = ['template', 'description', 'genre', 'mood', 'tempo', 'length', 'vocals', 'language', 'voice', 'theme', 'key', 'meter'] as const
export const COVER_FIELDS = ['template', 'description', 'genre', 'mood', 'vocals', 'language', 'voice', 'theme'] as const
/** The fields shown as lists (all but the template, picked on its own, and the description, a text). */
export const LIST_FIELDS = ['genre', 'mood', 'tempo', 'length', 'vocals', 'language', 'voice', 'theme', 'key', 'meter'] as const

export const LABELS: Record<string, { label: string; hint: string; placeholder: string }> = {
  genre: { label: 'Genre', hint: 'The kind of music - indie pop, synthwave, salsa …', placeholder: 'e.g. synthwave' },
  mood: { label: 'Mood', hint: 'How it should feel', placeholder: 'e.g. warm, hopeful' },
  tempo: { label: 'Tempo', hint: 'How fast: a feel or beats per minute', placeholder: 'e.g. 110 BPM, upbeat' },
  length: { label: 'Length', hint: 'About how long the song is', placeholder: 'e.g. 2:30' },
  vocals: { label: 'Vocals', hint: 'Sung, only a few phrases, or no singing at all', placeholder: '' },
  language: { label: 'Language', hint: 'The language of the lyrics', placeholder: 'e.g. English' },
  voice: { label: 'Voice', hint: 'Who sings, and how', placeholder: 'e.g. warm female vocal' },
  theme: { label: 'Theme', hint: 'What the lyrics are about', placeholder: 'e.g. a summer night' },
  key: { label: 'Key', hint: 'Optional: the key it is in', placeholder: 'e.g. A minor' },
  meter: { label: 'Meter', hint: 'Optional: the beats in a bar', placeholder: 'e.g. 4/4, 6/8' },
}

/** What a vocals choice means, in a listener's words. */
export const VOCALS_TEXT: Record<string, string> = {
  sung: 'Sung - a song with lyrics',
  'sparse vocals': 'Mostly music - a few sung phrases',
  instrumental: 'Instrumental - no singing',
  'original lyrics': 'The original lyrics, sung anew',
  'new lyrics': 'New lyrics on the original melody',
}

const SUNG = new Set(['sung', 'sparse vocals', 'original lyrics', 'new lyrics'])

/** Whether a field is asked: a cover keeps the original's tempo, length, key and meter; an instrumental has no
 * language, voice or theme; a cover's theme belongs to new lyrics, and its language is the original's unless the
 * lyrics are new. */
export function applies(name: string, draft: Draft): boolean {
  const list = draft.kind === 'cover' ? (COVER_FIELDS as readonly string[]) : (SONG_FIELDS as readonly string[])
  if (!list.includes(name)) return false
  const vocals = draft.fields.vocals || (draft.kind === 'cover' ? 'original lyrics' : 'sung')
  if (['language', 'voice', 'theme'].includes(name) && !SUNG.has(vocals)) return false
  if (draft.kind === 'cover' && name === 'theme' && vocals !== 'new lyrics') return false
  if (draft.kind === 'cover' && name === 'language' && vocals !== 'new lyrics') return false
  return true
}

/** The fields a style template fills (all of them: a field the template leaves open is emptied). A song's length
 * and vocals keep their default when the template has none or one this form does not offer; a cover takes the
 * template's sound, and a sung template means the original's lyrics. */
export function fromTemplate(template: StyleTemplate | null, kind: Kind, form: FormData, keep: Record<string, string> = {}): Record<string, string> {
  const given = template?.fields ?? {}
  const out: Record<string, string> = { template: template?.id ?? 'none' }
  const names = kind === 'cover' ? COVER_FIELDS : SONG_FIELDS
  // one line each, as the lists have them (the description keeps its lines)
  for (const name of names) if (name !== 'template') out[name] = name === 'description' ? (given[name] ?? '').trim() : (given[name] ?? '').split(/\s+/).join(' ').trim()
  if (kind === 'song') {
    const lengths = form.song.choices.length
    if (!lengths.includes(out.length)) out.length = keep.length && lengths.includes(keep.length) ? keep.length : nearestLength(out.length || form.song.defaults.length || '', lengths)
    if (!form.song.choices.vocals.includes(out.vocals)) out.vocals = form.song.defaults.vocals || 'sung'
  } else {
    out.vocals = given.vocals === 'instrumental' ? 'instrumental' : keep.vocals && form.cover.choices.vocals.includes(keep.vocals) ? keep.vocals : 'original lyrics'
  }
  return out
}

/** ``standard (about 3:00)`` -> 180 seconds (``0`` when it names no time). */
export function lengthSeconds(option: string): number {
  const match = /(\d+):(\d{2})/.exec(option)
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0
}

/** The offered length nearest to ``wanted`` (a choice the form no longer offers - longer than the host allows -
 * becomes the longest offered). */
export function nearestLength(wanted: string, lengths: string[]): string {
  if (lengths.includes(wanted)) return wanted
  const seconds = lengthSeconds(wanted)
  if (!lengths.length) return wanted
  if (!seconds) return lengths.find((l) => l.startsWith('standard')) ?? lengths[Math.min(4, lengths.length - 1)]
  return lengths.reduce((best, l) => (Math.abs(lengthSeconds(l) - seconds) < Math.abs(lengthSeconds(best) - seconds) ? l : best), lengths[0])
}

/** A field's list: the choices of length and vocals; for the other fields every value the templates have - the
 * value given now first when the list does not have it. */
export function optionsFor(name: string, draft: Draft, form: FormData): string[] {
  let list: string[]
  if (name === 'length') list = form.song.choices.length
  else if (name === 'vocals') list = draft.kind === 'cover' ? form.cover.choices.vocals : form.song.choices.vocals
  else list = form.values[name] ?? []
  return list
}

/** Whether a field may take a value of one's own (the vocals are one of their choices). */
export const ownAllowed = (name: string): boolean => name !== 'vocals'

/** The templates by group, in the order the server gives them. */
export function grouped(templates: StyleTemplate[], query = ''): [string, StyleTemplate[]][] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const groups = new Map<string, StyleTemplate[]>()
  for (const t of templates) {
    const text = `${t.name} ${t.group} ${t.fields.genre ?? ''} ${t.fields.mood ?? ''}`.toLowerCase()
    if (words.length && !words.every((w) => text.includes(w))) continue
    groups.set(t.group, [...(groups.get(t.group) ?? []), t])
  }
  return [...groups]
}

/** A template at random (for *Surprise me*): one of those that fit a cover when it is a cover - any for a song. */
export function surprise(templates: StyleTemplate[], kind: Kind, random: () => number = Math.random): StyleTemplate | null {
  const pool = kind === 'cover' ? templates.filter((t) => t.fields.vocals !== 'instrumental' || random() < 0.3) : templates
  if (!pool.length) return null
  return pool[Math.floor(random() * pool.length)]
}

/** What is still missing before the song can be made (an empty list: nothing). */
export function missing(draft: Draft): string[] {
  const out: string[] = []
  if (draft.kind === 'cover' && !draft.source) out.push('the original recording')
  const template = draft.fields.template
  if ((!template || template === 'none') && !draft.fields.genre?.trim() && !draft.fields.description?.trim()) out.push('a style, a genre or a description')
  return out
}

/** The request for the server: the fields that apply, the recording for a cover. */
export function requestOf(draft: Draft): { fields: Record<string, string>; source?: string } {
  const fields: Record<string, string> = {}
  for (const [name, value] of Object.entries(draft.fields)) if (name === 'template' || name === 'description' || applies(name, draft)) fields[name] = value
  return draft.kind === 'cover' && draft.source ? { fields, source: draft.source.id } : { fields }
}

/** One line that says what the song will be: style, length, voice. */
export function summary(draft: Draft): string {
  const f = draft.fields
  const parts = [f.genre, draft.kind === 'song' ? f.length?.replace(/^.*\(about ([^)]*)\).*$/, 'about $1') : `cover of ${draft.source?.title || 'your song'}`]
  if (applies('voice', draft) && f.voice) parts.push(f.voice)
  else if (f.vocals === 'instrumental') parts.push('instrumental')
  if (applies('language', draft) && f.language) parts.push(f.language)
  return parts.filter(Boolean).join(' · ')
}

// --- telling the songs in the making ---------------------------------------------------------------------

/** ``m:ss`` (``h:mm:ss`` from an hour). */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const rest = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${rest}` : `${m}:${rest}`
}

/** A time of day, ``21:40`` (rounded to five minutes when ``rough``, never into the past). */
export function timeOfDay(epoch: number, rough = false, now = Date.now() / 1000): string {
  let t = epoch
  if (rough) t = Math.max(Math.ceil(now / 300) * 300, Math.round(epoch / 300) * 300)
  const date = new Date(t * 1000)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** About how long until ``epoch``: ``about 25 min``, ``about 1 h 10 min``, ``in a moment``. */
export function untilText(epoch: number, now: number): string {
  const minutes = Math.round((epoch - now) / 60)
  if (minutes <= 1) return 'in a moment'
  if (minutes < 60) return `about ${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round((minutes % 60) / 5) * 5
  return `about ${h} h${m ? ` ${m} min` : ''}`
}

export type Tone = 'wait' | 'busy' | 'done' | 'bad' | 'off'

/** How a song in the making is told: the state, the time, and its tone. */
export function stateOf(job: MakeJob, now: number): { title: string; detail: string; tone: Tone } {
  switch (job.status) {
    case 'waiting':
      return {
        title: job.position ? `#${job.position} in line` : 'In line',
        detail: job.eta ? `ready about ${timeOfDay(job.eta, true, now)}${job.note ? ` · ${job.note}` : ''}` : job.note,
        tone: 'wait',
      }
    case 'sending':
    case 'queued':
      return { title: 'Starting …', detail: job.eta ? `ready about ${timeOfDay(job.eta, true, now)}` : job.note || 'in the studio’s queue', tone: 'busy' }
    case 'running': {
      const elapsed = job.started ? now - job.started : 0
      const stage = job.stage?.text ? `${job.stage.text[0].toUpperCase()}${job.stage.text.slice(1)}` : 'Being made'
      return { title: `${stage} …`, detail: `${clock(elapsed)}${job.eta ? ` · ready about ${timeOfDay(job.eta, true, now)}` : ''}`, tone: 'busy' }
    }
    case 'done':
      return { title: `Ready${job.finished ? ` ${timeOfDay(job.finished)}` : ''}`, detail: job.result?.song ? 'in the library - and at the party' : 'finding it in the library …', tone: 'done' }
    case 'failed':
      return { title: 'That did not work', detail: job.error || 'the studio stopped', tone: 'bad' }
    default:
      return { title: 'Stopped', detail: '', tone: 'off' }
  }
}

/** How far a song being made is, 0..1 - by the time it took against the estimate (never quite done before it is). */
export function progressOf(job: MakeJob, now: number): number {
  if (job.status === 'done') return 1
  if (job.status !== 'running' || !job.started) return 0
  return Math.min(0.96, Math.max(0.02, (now - job.started) / Math.max(30, job.estimate)))
}

/** The song's title once made, else what identifies it. */
export const titleOf = (job: MakeJob): string => job.result?.title || job.label
