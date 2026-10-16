/**
 * A song as an MP4 video (owner's request 2026-10-16): every frame drawn here - the visual from the song's
 * own sound (offline.ts), the lyrics, the notation, a title card, the song in a corner, a progress bar - then
 * encoded as H.264 by the browser (WebCodecs, on the graphics card where it can) and sent to the player's
 * server in pieces, which puts it together with the song's sound into an MP4 (plenio/player/video.py).
 */
import { api, media, type SongDetail, type SongSummary } from '../api'
import { paletteFrom, songHue } from '../colors'
import { settings } from '../store'
import { anchorsOf, sectionAt, sectionsInSong, type TimedSection } from '../timing'
import { chooseVisual } from '../visuals/chooser'
import { DropRenderer } from '../visuals/drop/renderer'
import { allPresets, makeColors, presetById, type Preset, type Scene, type Scheme } from '../visuals/presets'
import { NotationStrip } from './notationStrip'
import { OfflineAnalysis } from './offline'
import { drawCorner, drawCredit, drawKaraoke, drawProgress, drawSubtitles, drawTitleCard, type TitleInfo } from './overlay'

export interface VideoOptions {
  width: number
  height: number
  fps: number
  /** The part of the song: from ``start`` for ``length`` seconds (0: to the end). */
  start: number
  length: number
  take: 'master' | 'original'
  /** A visual (its id), or ``''``: as the visuals' settings choose for this song. */
  visual: string
  /** Another visual at every section of the song. */
  eachSection: boolean
  scheme: Scheme
  lyrics: 'off' | 'subtitles' | 'karaoke'
  notation: boolean
  title: boolean
  corner: boolean
  progress: boolean
  credit: boolean
  quality: 'standard' | 'high'
}

export const SIZES: { id: string; label: string; width: number; height: number }[] = [
  { id: '1080p', label: '1920 × 1080 - Full HD, 16:9', width: 1920, height: 1080 },
  { id: '720p', label: '1280 × 720 - HD, 16:9', width: 1280, height: 720 },
  { id: '4k', label: '3840 × 2160 - 4K, 16:9', width: 3840, height: 2160 },
  { id: 'square', label: '1080 × 1080 - square', width: 1080, height: 1080 },
  { id: 'vertical', label: '1080 × 1920 - upright (Shorts, Reels, TikTok)', width: 1080, height: 1920 },
]

export const DEFAULT_VIDEO: VideoOptions = {
  width: 1920,
  height: 1080,
  fps: 30,
  start: 0,
  length: 0,
  take: 'master',
  visual: '',
  eachSection: false,
  scheme: 'song',
  lyrics: 'subtitles',
  notation: false,
  title: true,
  corner: true,
  progress: true,
  credit: true,
  quality: 'standard',
}

/** Saved video settings, checked. */
export function videoWithDefaults(raw: unknown): VideoOptions {
  const given = (raw && typeof raw === 'object' ? raw : {}) as Partial<VideoOptions>
  const out = { ...DEFAULT_VIDEO, ...given, start: 0, length: 0 }
  if (!SIZES.some((s) => s.width === out.width && s.height === out.height)) Object.assign(out, { width: 1920, height: 1080 })
  if (![24, 25, 30, 50, 60].includes(out.fps)) out.fps = 30
  if (!['off', 'subtitles', 'karaoke'].includes(out.lyrics)) out.lyrics = 'subtitles'
  if (!['standard', 'high'].includes(out.quality)) out.quality = 'standard'
  return out
}

// --- the song's sound ------------------------------------------------------------------------------------

export interface Sound {
  left: Float32Array
  right: Float32Array
  rate: number
  duration: number
}

let decoded: { key: string; sound: Sound } | null = null

/** The song's audio, decoded (the last one is kept: the preview and the video use it again). */
export async function soundOf(song: SongSummary, take: 'master' | 'original'): Promise<Sound> {
  const kind = take === 'original' && song.has.original ? 'original' : 'audio'
  const key = `${song.id}/${kind}`
  if (decoded?.key === key) return decoded.sound
  const response = await fetch(media(song.id, kind))
  if (!response.ok) throw new Error(`the song's audio could not be read (${response.status})`)
  const data = await response.arrayBuffer()
  const context = new OfflineAudioContext(2, 1, 48000)
  const buffer = await context.decodeAudioData(data)
  const left = buffer.getChannelData(0)
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left
  const sound = { left, right, rate: buffer.sampleRate, duration: buffer.duration }
  decoded = { key, sound }
  return sound
}

// --- the frames ------------------------------------------------------------------------------------------

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** Draws the video's frames, one after the other (the visuals have memory: trails, beats). */
export class Composer {
  readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly analysis: OfflineAnalysis
  private scene: Scene | null = null
  private preset: Preset | null = null
  private drop: DropRenderer | null | undefined
  private snapshot: HTMLCanvasElement | null = null
  private blend = 0
  private turn = 0
  private section: TimedSection | null = null
  private readonly sections: TimedSection[]
  private readonly hue: number
  private readonly accent: string
  readonly length: number

  private constructor(
    private readonly song: SongSummary,
    private readonly detail: SongDetail,
    private readonly sound: Sound,
    readonly options: VideoOptions,
    private readonly strip: NotationStrip | null,
    private readonly info: TitleInfo,
    width: number,
    height: number
  ) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    this.analysis = new OfflineAnalysis(sound, options.fps, settings.visuals.sensitivity)
    this.sections = sectionsInSong(detail.notation.sections, anchorsOf(detail.lines), detail.notation.warp, sound.duration)
    this.hue = songHue(song.id, song.genre)
    this.accent = paletteFrom(this.hue).accent
    const rest = Math.max(0, sound.duration - options.start)
    this.length = options.length > 0 ? Math.min(options.length, rest) : rest
  }

  /** ``scale``: smaller than the video, for a preview. */
  static async create(song: SongSummary, detail: SongDetail, sound: Sound, options: VideoOptions, scale = 1): Promise<Composer> {
    const width = Math.round((options.width * scale) / 2) * 2
    const height = Math.round((options.height * scale) / 2) * 2
    const upright = height > width * 1.2
    const strip = options.notation && detail.notation.abc ? await NotationStrip.create(detail.notation, detail.lines, upright ? 760 : 1100) : null
    const cover = options.title && song.has.cover ? await loadImage(media(song.id, 'cover')) : null
    const subtitle = song.other
      ? [song.artist, song.album].filter(Boolean).join(' · ') || 'Other music'
      : [song.genre.split(',')[0], song.model || 'Plenio'].filter(Boolean).join(' · ')
    const info: TitleInfo = { title: song.title, subtitle, cover, accent: paletteFrom(songHue(song.id, song.genre)).accent }
    return new Composer(song, detail, sound, options, strip, info, width, height)
  }

  get total(): number {
    return Math.max(1, Math.ceil(this.length * this.options.fps))
  }

  private dropRenderer(): DropRenderer | null {
    if (this.drop === undefined) {
      try {
        this.drop = new DropRenderer()
      } catch {
        this.drop = null
      }
    }
    return this.drop
  }

  /** The visual for this moment: the one chosen, or as the visuals' settings choose; another at a new
   * section when asked. */
  private pick(t: number): void {
    const section = this.options.eachSection ? sectionAt(this.sections, t) : null
    const changed = this.scene === null || (this.options.eachSection && section !== this.section && this.scene !== null)
    if (!changed) return
    if (this.scene) this.turn += 1
    this.section = section
    let id = this.options.visual
    if (!id || (this.options.eachSection && this.turn > 0)) {
      const pool = { ...settings.visuals, songs: this.turn > 0 ? {} : settings.visuals.songs }
      if (this.options.visual && this.turn > 0) Object.assign(pool, { mode: 'cycle' as const })
      id = chooseVisual({ settings: pool, song: this.song, previous: this.preset?.id ?? (this.options.visual || null), turn: this.turn })
    }
    const preset = presetById(id) ?? allPresets()[0]
    const glide = this.preset?.kind === 'drop' && preset.kind === 'drop'
    if (this.scene && !glide) {
      this.snapshot = this.snapshot ?? document.createElement('canvas')
      this.snapshot.width = this.canvas.width
      this.snapshot.height = this.canvas.height
      this.snapshot.getContext('2d')?.drawImage(this.canvas, 0, 0)
      this.blend = 1
    }
    this.preset = preset
    this.scene = preset.create({ drop: { renderer: () => this.dropRenderer(), scale: 1 } })
  }

  /** Draw frame ``k`` (``k / fps`` seconds into the part). */
  draw(k: number): void {
    const { fps } = this.options
    const elapsed = k / fps
    const t = this.options.start + elapsed
    const w = this.canvas.width
    const h = this.canvas.height
    const ctx = this.ctx
    const frame = this.analysis.frame(t, 1 / fps, elapsed)
    this.pick(t)
    const colors = makeColors(this.hue, this.options.scheme, elapsed)
    ctx.save()
    this.scene?.draw(ctx, frame, w, h, colors)
    ctx.restore()
    if (this.blend > 0 && this.snapshot) {
      ctx.globalAlpha = this.blend
      ctx.drawImage(this.snapshot, 0, 0, w, h)
      ctx.globalAlpha = 1
      this.blend = Math.max(0, this.blend - (1 / fps) * 1.25)
    }
    // what is drawn over it
    const upright = h > w * 1.2
    const stripH = Math.round(h * (upright ? 0.16 : 0.25))
    const stripY = h - stripH - Math.round(h * 0.045)
    if (this.strip) this.strip.draw(ctx, t, Math.round(w * 0.03), stripY, Math.round(w * 0.94), stripH, this.accent)
    const lines = this.detail.lines
    // the lyrics come in as the title card goes
    const lyricsAlpha = this.options.title ? Math.min(1, Math.max(0, (elapsed - 3.4) / 0.8)) : 1
    if (this.options.lyrics === 'subtitles' && lines.length) drawSubtitles(ctx, lines, t, w, h, this.strip ? stripY - h * 0.02 : h * 0.9, lyricsAlpha)
    if (this.options.lyrics === 'karaoke' && lines.length) drawKaraoke(ctx, lines, t, w, h, this.strip ? (stripY - h * 0.02) / 2 : h / 2, lyricsAlpha)
    if (this.options.corner) drawCorner(ctx, this.info, w, h, this.options.title ? Math.min(1, Math.max(0, (elapsed - 4) / 0.8)) : 1)
    if (this.options.credit) drawCredit(ctx, w, h)
    if (this.options.progress) drawProgress(ctx, t, this.sound.duration, this.sections, this.accent, w, h)
    if (this.options.title) drawTitleCard(ctx, this.info, elapsed, w, h)
  }
}

/** One frame of the video at ``at`` seconds into the song, small - after a few seconds drawn before it, so
 * that the visual has its trails. */
export async function preview(song: SongSummary, detail: SongDetail, options: VideoOptions, at: number, width = 640): Promise<HTMLCanvasElement> {
  const sound = await soundOf(song, options.take)
  const composer = await Composer.create(song, detail, sound, options, width / options.width)
  const target = Math.max(0, Math.round((at - options.start) * options.fps))
  for (let k = Math.max(0, target - options.fps * 3); k <= target; k++) composer.draw(k)
  return composer.canvas
}

// --- the encoder -----------------------------------------------------------------------------------------

/** The H.264 level the frame size and rate need (macroblocks per frame and per second). */
export function levels(width: number, height: number, fps: number): string[] {
  const frame = Math.ceil(width / 16) * Math.ceil(height / 16)
  const rate = frame * fps
  const all: [string, number, number][] = [
    ['28', 8192, 245760],
    ['2A', 8704, 522240],
    ['32', 22080, 589824],
    ['33', 36864, 983040],
    ['34', 36864, 2073600],
  ]
  return all.filter(([, maxFrame, maxRate]) => frame <= maxFrame && rate <= maxRate).map(([level]) => level)
}

async function encoderConfig(options: VideoOptions): Promise<VideoEncoderConfig> {
  if (typeof VideoEncoder === 'undefined') throw new Error('This browser cannot encode video (WebCodecs): use a current Chrome or Edge.')
  const { width, height, fps } = options
  const bitrate = Math.round(width * height * fps * (options.quality === 'high' ? 0.15 : 0.085))
  for (const level of levels(width, height, fps)) {
    for (const profile of ['6400', '4D00', '42E0']) {
      const config: VideoEncoderConfig = {
        codec: `avc1.${profile}${level}`,
        width,
        height,
        bitrate,
        framerate: fps,
        bitrateMode: 'variable',
        latencyMode: 'quality',
        avc: { format: 'annexb' },
      }
      const answer = await VideoEncoder.isConfigSupported(config)
      if (answer.supported) return answer.config ?? config
    }
  }
  throw new Error(`This browser cannot encode H.264 at ${width} × ${height}, ${fps} frames a second.`)
}

export interface Progress {
  stage: string
  frame: number
  total: number
  /** Frames a second against the video's rate: 2 = twice as fast as it plays. */
  speed: number
  /** Seconds left. */
  left: number
}

/** Make the video: every frame drawn and encoded, sent to the player, put together there with the sound.
 * ``onFrame`` sees the canvas now and then (a live preview). */
export async function makeVideo(
  song: SongSummary,
  options: VideoOptions,
  onProgress: (progress: Progress) => void,
  signal: AbortSignal,
  onFrame?: (canvas: HTMLCanvasElement) => void
): Promise<{ file: string; size: number; folder: string }> {
  onProgress({ stage: 'Reading the song', frame: 0, total: 0, speed: 0, left: 0 })
  const detail = await api.song(song.id)
  const sound = await soundOf(song, options.take)
  const composer = await Composer.create(song, detail, sound, options)
  const config = await encoderConfig(options)
  const total = composer.total
  const { job } = await api.videoStart({
    song: song.id,
    take: options.take,
    start: options.start,
    length: composer.length,
    fps: options.fps,
    width: composer.canvas.width,
    height: composer.canvas.height,
  })
  let failure: unknown = null
  let pending: Uint8Array[] = []
  let pendingBytes = 0
  let uploading: Promise<unknown> = Promise.resolve()
  const send = (): void => {
    if (!pendingBytes) return
    const data = new Uint8Array(pendingBytes)
    let at = 0
    for (const piece of pending) {
      data.set(piece, at)
      at += piece.length
    }
    pending = []
    pendingBytes = 0
    uploading = uploading.then(() => api.videoData(job, data)).catch((error) => (failure = failure ?? error))
  }
  const encoder = new VideoEncoder({
    output: (chunk) => {
      const piece = new Uint8Array(chunk.byteLength)
      chunk.copyTo(piece)
      pending.push(piece)
      pendingBytes += piece.length
      if (pendingBytes > 2 * 2 ** 20) send()
    },
    error: (error) => (failure = failure ?? error),
  })
  encoder.configure(config)
  const began = performance.now()
  try {
    for (let k = 0; k < total; k++) {
      if (signal.aborted) throw new DOMException('stopped', 'AbortError')
      if (failure) throw failure
      composer.draw(k)
      const frame = new VideoFrame(composer.canvas, { timestamp: Math.round((k * 1e6) / options.fps), duration: Math.round(1e6 / options.fps) })
      encoder.encode(frame, { keyFrame: k % (options.fps * 2) === 0 })
      frame.close()
      while (encoder.encodeQueueSize > 6) await new Promise((resolve) => setTimeout(resolve, 2))
      if (k % 15 === 0 || k === total - 1) {
        const seconds = (performance.now() - began) / 1000
        const rate = (k + 1) / Math.max(seconds, 0.001)
        onProgress({ stage: 'Drawing and encoding', frame: k + 1, total, speed: rate / options.fps, left: (total - k - 1) / rate })
        if (k % 60 === 0) onFrame?.(composer.canvas)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }
    await encoder.flush()
    send()
    await uploading
    if (failure) throw failure
    onProgress({ stage: 'Putting it together with the sound', frame: total, total, speed: 0, left: 0 })
    return await api.videoFinish(job, total)
  } catch (error) {
    void api.videoCancel(job).catch(() => {})
    throw error
  } finally {
    if (encoder.state !== 'closed') encoder.close()
  }
}
