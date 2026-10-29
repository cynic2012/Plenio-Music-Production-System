/**
 * Plenio Nova as visuals: one for every scene (space.ts, worlds.ts, matter.ts), drawn by the player's own renderer -
 * or, in a video and in the previews, by the renderer they pass. The live picture gets as many pixels as the visual's
 * timing on this graphics card allows (gpu.ts); every visual is timed once in the background, which also compiles it
 * ahead, so that it starts at once when it comes.
 */
import { gpuSupport, keepTiming, loadTimings, novaPixels, novaTimings } from '../gpu'
import type { Preset, Scene, SceneOptions } from '../presets'
import { MATTER } from './matter'
import { NovaMusic, NovaRenderer, type NovaDef } from './renderer'
import { SPACE } from './space'
import { WORLDS } from './worlds'

export const NOVA: NovaDef[] = [...SPACE, ...WORLDS, ...MATTER]

/** Changes whenever a visual does: their timings are taken again. */
export const NOVA_VERSION = String(NOVA.reduce((h, def) => (h * 31 + [...def.image, ...(def.state?.code ?? '')].reduce((a, c) => (a * 33 + c.charCodeAt(0)) | 0, 7)) | 0, 17))

/** How the live picture is drawn: ``scale`` is the share of the screen's size (the visuals' quality setting). */
export const novaOptions = { scale: 0.75 }

/** A video's picture at most (4K is drawn larger from it). */
const VIDEO_PIXELS = 2560 * 1440

let shared: NovaRenderer | null | undefined
/** The renderer every live Nova visual shares (``null``: this browser cannot draw them). */
export function novaRenderer(): NovaRenderer | null {
  if (shared?.lost) shared = undefined
  if (shared === undefined) {
    try {
      shared = gpuSupport().float ? new NovaRenderer(true) : null
    } catch (error) {
      console.warn('Plenio Nova:', error)
      shared = null
    }
  }
  return shared
}

function asVisual(def: NovaDef): Preset {
  return {
    id: def.id,
    name: `Nova · ${def.name}`,
    blurb: def.blurb,
    suits: def.suits,
    kind: 'nova',
    create(options?: SceneOptions): Scene {
      const music = new NovaMusic()
      const slot = {}
      return {
        draw(ctx, frame, width, height, colors) {
          const own = options?.nova
          const renderer = own ? own.renderer() : novaRenderer()
          music.update(frame, def.speed)
          const screen = width * height
          const pixels = own ? Math.min(VIDEO_PIXELS, screen * own.scale * own.scale) : novaPixels(def.id, screen * novaOptions.scale * novaOptions.scale)
          const picture = renderer?.render(def, music, colors.palette(), width, height, slot, pixels) ?? null
          if (!picture) {
            ctx.fillStyle = '#05040a'
            ctx.fillRect(0, 0, width, height)
            return
          }
          ctx.drawImage(picture.canvas, 0, picture.canvas.height - picture.height, picture.width, picture.height, 0, 0, width, height)
        },
      }
    },
  }
}

export const NOVA_PRESETS: Preset[] = NOVA.map(asVisual)

// --- timing them here ----------------------------------------------------------------------------------------------

let checking = false

/** Whether the Nova visuals are being timed on this graphics card now (the settings say so). */
export function novaChecking(): boolean {
  return checking
}

/**
 * Time every Nova visual not timed yet on this graphics card, one at a time between the page's own work (each a few
 * frames at 640 x 360 - which also compiles it ahead). ``palette``: the colours to draw them with. Starts once; does
 * nothing where the graphics cannot draw them.
 */
export function checkNova(palette: Uint8ClampedArray): void {
  if (checking || !gpuSupport().float) return
  loadTimings(NOVA_VERSION)
  const waiting = NOVA.filter((def) => novaTimings.value[def.id] === undefined)
  if (!waiting.length) return
  checking = true
  const renderer = novaRenderer()
  if (!renderer) {
    checking = false
    return
  }
  // compiling starts for all of them at once (in the background where the browser can), the timing one by one
  for (const def of waiting) renderer.prepare(def)
  const next = (): void => {
    const def = waiting[0]
    if (!def || renderer.lost) {
      checking = false
      return
    }
    const ns = renderer.measure(def, palette)
    if (ns !== null) {
      keepTiming(def.id, ns)
      waiting.shift()
    }
    setTimeout(next, ns === null ? 120 : 30)
  }
  setTimeout(next, 30)
}
