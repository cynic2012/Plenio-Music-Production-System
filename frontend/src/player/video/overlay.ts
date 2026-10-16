/**
 * What a video shows over the visual: the lyrics (as subtitles at the bottom, or large in the middle like
 * karaoke, lit up as they are sung, in the font, colour and effect chosen - lyricsStyle.ts), a title card at
 * the start, the song in a corner, a progress bar with the sections, a small credit. All drawn on the video's
 * canvas, sized to its height.
 */
import type { TimedLine } from '../api'
import { chunksAt, lineAt, type TimedSection } from '../timing'

const FONT = '"Segoe UI", "Inter", system-ui, -apple-system, sans-serif'

export interface TitleInfo {
  title: string
  subtitle: string
  cover: HTMLImageElement | null
  accent: string
}

/** How the lyrics are drawn: the font, the colour of what is sung, the effect; the clock and the beat for the
 * effects that move. */
export interface LyricsLook {
  stack: string
  weight: number
  lit: string
  effect: string
  clock: number
  pulse: number
}

export const PLAIN_LOOK: LyricsLook = { stack: FONT, weight: 700, lit: '#ffffff', effect: 'sweep', clock: 0, pulse: 0 }

function shadow(ctx: CanvasRenderingContext2D, blur: number): void {
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
  ctx.shadowBlur = blur
  ctx.shadowOffsetY = blur / 4
}

/** Words that fit ``width``: the line broken where it is too long (at most two rows). */
function rows(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  if (ctx.measureText(text).width <= width) return [text]
  const words = text.split(' ')
  let first = ''
  for (const word of words) {
    const tryLine = first ? `${first} ${word}` : word
    if (ctx.measureText(tryLine).width > width && first) break
    first = tryLine
  }
  return [first, text.slice(first.length).trim()].filter(Boolean)
}

function rainbow(ctx: CanvasRenderingContext2D, x: number, width: number, clock: number): CanvasGradient {
  const gradient = ctx.createLinearGradient(x, 0, x + Math.max(1, width), 0)
  for (let k = 0; k <= 6; k++) gradient.addColorStop(k / 6, `hsl(${(k * 60 + clock * 140) % 360} 95% 65%)`)
  return gradient
}

/** One piece of a syllable (a syllable broken across rows comes in pieces), drawn with the effect. */
function drawPiece(ctx: CanvasRenderingContext2D, piece: string, x: number, y: number, fill: number, size: number, look: LyricsLook, dim: string, letterIndex: number, isLast: boolean, rowX: number, rowWidth: number): void {
  const singing = fill > 0 && fill < 1
  const reached = fill > 0
  const width = ctx.measureText(piece).width
  switch (look.effect) {
    case 'glow': {
      ctx.save()
      if (reached) {
        ctx.shadowColor = look.lit
        ctx.shadowBlur = size * (singing ? 0.7 : 0.35)
        ctx.shadowOffsetY = 0
      }
      ctx.fillStyle = singing ? '#ffffff' : reached ? look.lit : dim
      ctx.fillText(piece, x, y)
      ctx.restore()
      return
    }
    case 'bounce': {
      const hop = singing ? Math.sin(Math.PI * Math.min(1, fill * 1.4)) * size * 0.24 : 0
      ctx.fillStyle = reached ? look.lit : dim
      ctx.fillText(piece, x, y - hop)
      return
    }
    case 'pop': {
      const scale = singing ? 1 + 0.32 * Math.sin(Math.PI * Math.min(1, fill * 1.2)) : 1
      ctx.save()
      ctx.translate(x + width / 2, y)
      ctx.scale(scale, scale)
      ctx.fillStyle = reached ? look.lit : dim
      ctx.fillText(piece, -width / 2, 0)
      ctx.restore()
      return
    }
    case 'wave':
    case 'typewriter': {
      const reachedLetters = Math.round(fill * piece.length)
      let caretX = -1
      for (let i = 0; i < piece.length; i++) {
        const before = ctx.measureText(piece.slice(0, i)).width
        const lit = i < reachedLetters
        if (look.effect === 'typewriter') {
          if (!lit) continue
          ctx.fillStyle = look.lit
          ctx.fillText(piece[i], x + before, y)
          caretX = x + ctx.measureText(piece.slice(0, i + 1)).width
        } else {
          const lift = Math.sin(look.clock * 3.5 - (letterIndex + i) * 0.45) * size * 0.1
          ctx.fillStyle = lit ? look.lit : dim
          ctx.fillText(piece[i], x + before, y - lift)
        }
      }
      if (look.effect === 'typewriter' && isLast && caretX >= 0 && Math.floor(look.clock * 2.2) % 2 === 0) {
        ctx.fillStyle = look.lit
        ctx.fillRect(caretX + size * 0.03, y - size * 0.78, size * 0.07, size * 0.92)
      }
      return
    }
    case 'rise': {
      const amount = fill >= 1 ? 1 : Math.min(1, fill * 2)
      ctx.save()
      ctx.globalAlpha *= 0.12 + 0.88 * amount
      ctx.fillStyle = look.lit
      ctx.fillText(piece, x, y + (1 - amount) * size * 0.4)
      ctx.restore()
      return
    }
    case 'focus': {
      ctx.save()
      const blur = (1 - fill) * size * 0.1
      if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`
      ctx.fillStyle = reached ? look.lit : dim
      ctx.fillText(piece, x, y)
      ctx.restore()
      return
    }
    case 'neon': {
      ctx.save()
      ctx.lineWidth = Math.max(1, size * 0.03)
      if (reached) {
        const flicker = singing && Math.floor(look.clock * 18) % 3 === 0 ? 0.5 : 1
        ctx.globalAlpha *= flicker
        ctx.shadowColor = look.lit
        ctx.shadowBlur = size * 0.45
        ctx.shadowOffsetY = 0
        ctx.fillStyle = '#ffffff'
        ctx.fillText(piece, x, y)
        ctx.strokeStyle = look.lit
        ctx.strokeText(piece, x, y)
      } else {
        ctx.shadowBlur = 0
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)'
        ctx.strokeText(piece, x, y)
      }
      ctx.restore()
      return
    }
    case 'rainbow': {
      ctx.fillStyle = reached ? rainbow(ctx, rowX, rowWidth, look.clock) : dim
      ctx.fillText(piece, x, y)
      return
    }
    default: {
      // sweep (and On the beat): the colour runs through the syllable
      ctx.fillStyle = dim
      ctx.fillText(piece, x, y)
      if (fill > 0) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(x - 2, y - size * 1.1, width * fill + 2, size * 1.6)
        ctx.clip()
        ctx.fillStyle = look.lit
        ctx.fillText(piece, x, y)
        ctx.restore()
      }
    }
  }
}

/** One lyrics line at (``cx``, ``y``), centred, lit up to where it is sung with the look's effect. */
function karaokeLine(ctx: CanvasRenderingContext2D, line: TimedLine, t: number, cx: number, y: number, size: number, maxWidth: number, look: LyricsLook, dim: string): number {
  ctx.font = `${look.weight} ${size}px ${look.stack}`
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  const chunks = chunksAt(line, t)
  // break the chunks into rows the same way as the text
  const text = chunks.map((c) => c.text).join('')
  const parts = rows(ctx, text, maxWidth)
  const lastReached = chunks.reduce((at, chunk, k) => (chunk.fill > 0 ? k : at), -1)
  ctx.save()
  if (look.effect === 'beat') {
    const scale = 1 + 0.07 * look.pulse
    const middle = y - size * 0.35 + ((parts.length - 1) * size * 1.18) / 2
    ctx.translate(cx, middle)
    ctx.scale(scale, scale)
    ctx.translate(-cx, -middle)
  }
  let offset = 0
  let row = 0
  let letters = 0
  for (const part of parts) {
    const width = ctx.measureText(part).width
    const rowX = cx - width / 2
    let x = rowX
    const rowY = y + row * size * 1.18
    let used = 0
    chunks.forEach((chunk, k) => {
      const startInChunk = Math.max(0, offset - used)
      const endInChunk = Math.min(chunk.text.length, offset + part.length - used)
      used += chunk.text.length
      if (endInChunk <= startInChunk) return
      const piece = chunk.text.slice(startInChunk, endInChunk)
      drawPiece(ctx, piece, x, rowY, chunk.fill, size, look, dim, letters, k === lastReached, rowX, width)
      letters += piece.length
      x += ctx.measureText(piece).width
    })
    offset += part.length + 1
    row += 1
  }
  ctx.restore()
  return parts.length
}

/** How many rows a line takes at ``size`` in ``width``. */
function rowCount(ctx: CanvasRenderingContext2D, text: string, size: number, width: number, look: LyricsLook): number {
  ctx.font = `${look.weight} ${size}px ${look.stack}`
  return rows(ctx, text, width).length
}

/** The line sung at ``t`` as a subtitle (a little before it starts, until shortly after it ends). */
export function drawSubtitles(ctx: CanvasRenderingContext2D, lines: TimedLine[], t: number, w: number, h: number, bottom: number, alpha = 1, look: LyricsLook = PLAIN_LOOK, scale = 1): void {
  if (alpha <= 0) return
  const i = lineAt(lines, t + 0.25)
  if (i < 0) return
  const line = lines[i]
  if (t > line.end + 0.6 || t < line.start - 0.6) return
  const size = Math.round(Math.min(h * 0.052, w * 0.05) * scale)
  ctx.save()
  ctx.globalAlpha = alpha
  shadow(ctx, size * 0.35)
  // a line broken in two rises, so that its last row stays above ``bottom``
  const lift = (rowCount(ctx, line.text, size, w * 0.86, look) - 1) * size * 1.18
  const dim = look.effect === 'typewriter' || look.effect === 'rise' ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 0.5)'
  karaokeLine(ctx, line, t, w / 2, bottom - size * 0.4 - lift, size, w * 0.86, look, dim)
  ctx.restore()
}

/** Karaoke: the line sung now large in the middle, the one before above it, the next below - each placed by
 * the rows it takes, so a long line broken in two pushes the others away instead of running into them. The
 * effect is the current line's; the others are shown plainly. */
export function drawKaraoke(ctx: CanvasRenderingContext2D, lines: TimedLine[], t: number, w: number, h: number, centre: number, alpha = 1, look: LyricsLook = PLAIN_LOOK, scale = 1): void {
  if (alpha <= 0) return
  const i = lineAt(lines, t + 0.3)
  const size = Math.round(Math.min(h * 0.075, w * 0.06) * scale)
  const small = Math.round(size * 0.62)
  const step = size * 1.18
  const smallStep = small * 1.18
  const plain: LyricsLook = { ...look, effect: 'sweep' }
  ctx.save()
  shadow(ctx, size * 0.3)
  const current = i >= 0 ? lines[i] : null
  const currentRows = current ? rowCount(ctx, current.text, size, w * 0.86, look) : 1
  // the current line's first baseline: its rows centred on ``centre``
  const first = centre - ((currentRows - 1) * step) / 2 + size * 0.35
  if (i - 1 >= 0) {
    const before = lines[i - 1]
    const beforeRows = rowCount(ctx, before.text, small, w * 0.8, look)
    ctx.globalAlpha = 0.45 * alpha
    karaokeLine(ctx, before, before.end + 9, w / 2, first - size * 1.05 - (beforeRows - 1) * smallStep, small, w * 0.8, plain, '#ffffff')
  }
  ctx.globalAlpha = alpha
  const dim = look.effect === 'typewriter' ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 0.42)'
  if (current) karaokeLine(ctx, current, t, w / 2, first, size, w * 0.86, look, dim)
  const next = lines[i + 1]
  if (next) {
    ctx.globalAlpha = 0.55 * alpha
    karaokeLine(ctx, next, -1, w / 2, first + (currentRows - 1) * step + small * 1.6, small, w * 0.8, plain, 'rgba(255, 255, 255, 0.85)')
  }
  ctx.restore()
}

/** The title card: the cover, the title and a line under it - in for the first seconds, then away. */
export function drawTitleCard(ctx: CanvasRenderingContext2D, info: TitleInfo, elapsed: number, w: number, h: number): void {
  const shown = 4.2
  if (elapsed > shown) return
  const alpha = Math.min(1, elapsed / 0.6, (shown - elapsed) / 0.8)
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha = alpha * 0.55
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = alpha
  const unit = Math.min(w, h)
  const cover = info.cover ? Math.round(unit * 0.34) : 0
  const titleSize = Math.round(unit * 0.075)
  const subSize = Math.round(unit * 0.032)
  const tall = h > w * 1.2
  ctx.font = `800 ${titleSize}px ${FONT}`
  const titleRows = rows(ctx, info.title, tall ? w * 0.86 : w * 0.5)
  const blockH = titleRows.length * titleSize * 1.12 + subSize * 1.8
  shadow(ctx, titleSize * 0.25)
  if (tall || !cover) {
    // the cover above the title
    let y = h / 2 - (cover + blockH + (cover ? unit * 0.05 : 0)) / 2
    if (cover && info.cover) {
      ctx.drawImage(info.cover, w / 2 - cover / 2, y, cover, cover)
      y += cover + unit * 0.05
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#fff'
    ctx.font = `800 ${titleSize}px ${FONT}`
    titleRows.forEach((row, k) => ctx.fillText(row, w / 2, y + k * titleSize * 1.12))
    ctx.font = `600 ${subSize}px ${FONT}`
    ctx.fillStyle = info.accent
    ctx.fillText(info.subtitle.toUpperCase(), w / 2, y + titleRows.length * titleSize * 1.12 + subSize * 0.6)
  } else {
    // the cover left of the title
    const total = cover + unit * 0.05 + Math.max(...titleRows.map((r) => ctx.measureText(r).width))
    const x0 = Math.max(w * 0.06, w / 2 - total / 2)
    if (info.cover) ctx.drawImage(info.cover, x0, h / 2 - cover / 2, cover, cover)
    const tx = x0 + cover + unit * 0.05
    const y = h / 2 - blockH / 2
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#fff'
    titleRows.forEach((row, k) => ctx.fillText(row, tx, y + k * titleSize * 1.12))
    ctx.font = `600 ${subSize}px ${FONT}`
    ctx.fillStyle = info.accent
    ctx.fillText(info.subtitle.toUpperCase(), tx, y + titleRows.length * titleSize * 1.12 + subSize * 0.6)
  }
  ctx.restore()
}

/** The song in the top left corner, small. */
export function drawCorner(ctx: CanvasRenderingContext2D, info: TitleInfo, w: number, h: number, alpha = 1): void {
  const unit = Math.min(w, h)
  const pad = Math.round(unit * 0.035)
  const size = Math.round(unit * 0.03)
  ctx.save()
  ctx.globalAlpha = alpha
  shadow(ctx, size * 0.4)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = `700 ${size}px ${FONT}`
  ctx.fillStyle = '#fff'
  ctx.fillText(info.title, pad, pad)
  ctx.font = `500 ${Math.round(size * 0.72)}px ${FONT}`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.fillText(info.subtitle, pad, pad + size * 1.25)
  ctx.restore()
}

/** A thin bar along the bottom: how far the song is, the sections as small marks. */
export function drawProgress(ctx: CanvasRenderingContext2D, t: number, duration: number, sections: TimedSection[], accent: string, w: number, h: number): void {
  const barH = Math.max(3, Math.round(h * 0.006))
  const y = h - barH
  ctx.save()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.fillRect(0, y, w, barH)
  ctx.fillStyle = accent
  ctx.fillRect(0, y, (w * Math.max(0, Math.min(t, duration))) / Math.max(duration, 0.001), barH)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  for (const section of sections) {
    if (section.at <= 0) continue
    ctx.fillRect(Math.round((w * section.at) / duration) - 1, y, 2, barH)
  }
  ctx.restore()
}

/** "made with Plenio", small, bottom right. */
export function drawCredit(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const unit = Math.min(w, h)
  const size = Math.round(unit * 0.02)
  ctx.save()
  ctx.globalAlpha = 0.6
  shadow(ctx, size * 0.4)
  ctx.font = `600 ${size}px ${FONT}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = '#fff'
  ctx.fillText('made with Plenio', w - unit * 0.03, h - unit * 0.03)
  ctx.restore()
}
