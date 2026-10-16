/**
 * What a video shows over the visual: the lyrics (as subtitles at the bottom, or large in the middle like
 * karaoke, lit up as they are sung), a title card at the start, the song in a corner, a progress bar with
 * the sections, a small credit. All drawn on the video's canvas, sized to its height.
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

/** One lyrics line at (``cx``, ``y``), centred, lit up to where it is sung (``dim``: an unsung grey). */
function karaokeLine(ctx: CanvasRenderingContext2D, line: TimedLine, t: number, cx: number, y: number, size: number, maxWidth: number, lit: string, dim: string): number {
  ctx.font = `700 ${size}px ${FONT}`
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  const chunks = chunksAt(line, t)
  // break the chunks into rows the same way as the text
  const text = chunks.map((c) => c.text).join('')
  const parts = rows(ctx, text, maxWidth)
  let offset = 0
  let row = 0
  for (const part of parts) {
    const width = ctx.measureText(part).width
    let x = cx - width / 2
    const rowY = y + row * size * 1.18
    let used = 0
    for (const chunk of chunks) {
      const startInChunk = Math.max(0, offset - used)
      const endInChunk = Math.min(chunk.text.length, offset + part.length - used)
      used += chunk.text.length
      if (endInChunk <= startInChunk) continue
      const piece = chunk.text.slice(startInChunk, endInChunk)
      const pieceWidth = ctx.measureText(piece).width
      ctx.fillStyle = dim
      ctx.fillText(piece, x, rowY)
      if (chunk.fill > 0) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(x - 2, rowY - size * 1.1, pieceWidth * chunk.fill + 2, size * 1.5)
        ctx.clip()
        ctx.fillStyle = lit
        ctx.fillText(piece, x, rowY)
        ctx.restore()
      }
      x += pieceWidth
    }
    offset += part.length + 1
    row += 1
  }
  return parts.length
}

/** The line sung at ``t`` as a subtitle (a little before it starts, until shortly after it ends). */
export function drawSubtitles(ctx: CanvasRenderingContext2D, lines: TimedLine[], t: number, w: number, h: number, bottom: number, alpha = 1): void {
  if (alpha <= 0) return
  const i = lineAt(lines, t + 0.25)
  if (i < 0) return
  const line = lines[i]
  if (t > line.end + 0.6 || t < line.start - 0.6) return
  const size = Math.round(Math.min(h * 0.052, w * 0.05))
  ctx.save()
  ctx.globalAlpha = alpha
  shadow(ctx, size * 0.35)
  // a line broken in two rises, so that its last row stays above ``bottom``
  const lift = (rowCount(ctx, line.text, size, w * 0.86) - 1) * size * 1.18
  karaokeLine(ctx, line, t, w / 2, bottom - size * 0.4 - lift, size, w * 0.86, '#ffffff', 'rgba(255, 255, 255, 0.5)')
  ctx.restore()
}

/** How many rows a line takes at ``size`` in ``width``. */
function rowCount(ctx: CanvasRenderingContext2D, text: string, size: number, width: number): number {
  ctx.font = `700 ${size}px ${FONT}`
  return rows(ctx, text, width).length
}

/** Karaoke: the line sung now large in the middle, the one before above it, the next below - each placed by
 * the rows it takes, so a long line broken in two pushes the others away instead of running into them. */
export function drawKaraoke(ctx: CanvasRenderingContext2D, lines: TimedLine[], t: number, w: number, h: number, centre: number, alpha = 1): void {
  if (alpha <= 0) return
  const i = lineAt(lines, t + 0.3)
  const size = Math.round(Math.min(h * 0.075, w * 0.06))
  const small = Math.round(size * 0.62)
  const step = size * 1.18
  const smallStep = small * 1.18
  ctx.save()
  shadow(ctx, size * 0.3)
  const current = i >= 0 ? lines[i] : null
  const currentRows = current ? rowCount(ctx, current.text, size, w * 0.86) : 1
  // the current line's first baseline: its rows centred on ``centre``
  const first = centre - ((currentRows - 1) * step) / 2 + size * 0.35
  if (i - 1 >= 0) {
    const before = lines[i - 1]
    const beforeRows = rowCount(ctx, before.text, small, w * 0.8)
    ctx.globalAlpha = 0.45 * alpha
    karaokeLine(ctx, before, before.end + 9, w / 2, first - size * 1.05 - (beforeRows - 1) * smallStep, small, w * 0.8, '#ffffff', '#ffffff')
  }
  ctx.globalAlpha = alpha
  if (current) karaokeLine(ctx, current, t, w / 2, first, size, w * 0.86, '#ffffff', 'rgba(255, 255, 255, 0.42)')
  const next = lines[i + 1]
  if (next) {
    ctx.globalAlpha = 0.55 * alpha
    karaokeLine(ctx, next, -1, w / 2, first + (currentRows - 1) * step + small * 1.6, small, w * 0.8, '#ffffff', 'rgba(255, 255, 255, 0.85)')
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
