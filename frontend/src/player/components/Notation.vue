<script setup lang="ts">
/**
 * The song's notation (abcjs, the score with the lyrics under the notes) following the music: the notes
 * sounding now glow, a cursor stands at them and the sheet scrolls along. The song's time becomes score time
 * through the syllables measured when it was exported (timing.audioToScore); a click on a note jumps there.
 *
 * The cursor points at the notes (owner's request 2026-10-16): while a bar's notes play it stands at the one
 * sounding, and where only rests sound, already at the bar's next note - not at the rest the chord symbol
 * hangs on. At the chord only in a bar with no note, one note or only a rest: there is nothing else to follow.
 */
import abcjs from 'abcjs'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Notation, TimedLine } from '../api'
import { engine } from '../engine'
import { anchorsOf, audioToScore, scoreToAudio } from '../timing'

const props = defineProps<{ notation: Notation; lines: TimedLine[]; time: number; following: boolean }>()

const host = ref<HTMLElement | null>(null)
const scroller = ref<HTMLElement | null>(null)
const cursor = ref({ x: 0, y: 0, h: 0, show: false })
const failed = ref('')
interface Event {
  ms: number
  elements: Element[]
  start?: number
  /** The bar (abcjs's ``abcjs-mm<n>``, counted through the whole tune) and its notes sounding (not rests). */
  bar: number
  notes: Element[]
}
let events: Event[] = []
/** Per bar: how many notes it has (every voice), and its chord symbols. */
let bars = new Map<number, { notes: number; chords: Element[] }>()
let pointed: Element[] = []
let lit: Element[] = []
let litIndex = -1
let observer: ResizeObserver | null = null
let width = 0

const anchors = computed(() => anchorsOf(props.lines))
const approximate = computed(() => !anchors.value.length)

function render(): void {
  const el = host.value
  const abc = props.notation.abc
  if (!el || !abc) return
  width = el.clientWidth
  try {
    const tunes = abcjs.renderAbc(el, abc, {
      add_classes: true,
      responsive: 'resize',
      foregroundColor: '#e8e6f0',
      staffwidth: Math.max(520, el.clientWidth - 40),
      wrap: { minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: 4 },
      clickListener: (abcElem) => {
        const start = (abcElem as unknown as { startChar?: number }).startChar
        const hit = events.find((e) => e.start === start)
        if (hit) engine.seek(Math.max(0, scoreToAudio(hit.ms / 1000, anchors.value, props.notation.warp)))
      },
    })
    const timer = new abcjs.TimingCallbacks(tunes[0], { qpm: props.notation.tempo ?? 100 })
    events = timer.noteTimings
      .filter((e) => e.type === 'event' && e.elements?.length)
      .map((e) => {
        const elements = (e.elements ?? []).flat() as Element[]
        return { ms: e.milliseconds, elements, start: e.startChar, bar: barOf(elements[0]), notes: elements.filter((el) => el.classList.contains('abcjs-note')) }
      })
    bars = new Map()
    for (const note of el.querySelectorAll('g.abcjs-note')) {
      const bar = barOf(note)
      const known = bars.get(bar) ?? { notes: 0, chords: [] }
      known.notes += 1
      bars.set(bar, known)
    }
    for (const chord of el.querySelectorAll('text.abcjs-chord')) {
      const bar = barOf(chord)
      const known = bars.get(bar) ?? { notes: 0, chords: [] }
      known.chords.push(chord)
      bars.set(bar, known)
    }
    failed.value = ''
    litIndex = -1
    lit = []
    pointed = []
  } catch (error) {
    failed.value = error instanceof Error ? error.message : String(error)
  }
}

function follow(): void {
  if (!props.following || !events.length || !host.value) return
  const ms = audioToScore(props.time, anchors.value, props.notation.warp) * 1000
  let low = 0
  let high = events.length - 1
  let found = -1
  while (low <= high) {
    const mid = (low + high) >> 1
    if (events[mid].ms <= ms + 1) {
      found = mid
      low = mid + 1
    } else high = mid - 1
  }
  if (found === litIndex) return
  litIndex = found
  for (const el of lit) el.classList.remove('sounding')
  if (found < 0) {
    cursor.value.show = false
    return
  }
  // every voice's note at that moment
  const at = events[found].ms
  const now = events.filter((e) => Math.abs(e.ms - at) < 1)
  lit = now.flatMap((e) => e.elements)
  for (const el of lit) el.classList.add('sounding')
  pointed = pointAt(found, now)
  const first = pointed.length ? rectOf(pointed) : null
  const base = host.value.getBoundingClientRect()
  if (first && first.width) {
    // the cursor spans every voice sounding now (both staves of a system), with a little room
    const rects = lit.map((el) => el.getBoundingClientRect()).filter((r) => r.height > 0)
    const top = Math.min(...rects.map((r) => r.top), first.top) - 18
    const bottom = Math.max(...rects.map((r) => r.bottom), first.bottom) + 18
    cursor.value = {
      x: first.left - base.left + first.width / 2,
      y: top - base.top,
      h: bottom - top,
      show: true,
    }
    keepInView(systemTop(lit[0]) ?? top)
  }
}

/** What the cursor points at now: the notes sounding; in a bar of notes where only rests sound, the bar's
 * next note (or, when none comes, where it stood); in a bar of no note, one note or a rest, its chord. */
function pointAt(found: number, now: Event[]): Element[] {
  const bar = events[found].bar
  const info = bars.get(bar)
  if (info && info.notes >= 2) {
    const notes = now.flatMap((e) => e.notes)
    if (notes.length) return notes
    for (let k = found + 1; k < events.length && events[k].bar === bar; k++) if (events[k].notes.length) return events[k].notes
    return pointed.length && pointed.every((el) => barOf(el) === bar) ? pointed : lit
  }
  if (info?.chords.length) {
    // the chord symbol that holds now: the last one at or before this moment in the bar
    const passed = new Set(events.slice(0, found + 1).filter((e) => e.bar === bar).flatMap((e) => e.elements))
    const chord = [...info.chords].reverse().find((c) => c.parentElement && passed.has(c.parentElement)) ?? info.chords[0]
    return [chord]
  }
  return lit
}

/** The bar an element of the score is in (``abcjs-mm<n>``; -1 when it has none). */
function barOf(el: Element | undefined): number {
  const mark = el ? [...el.classList].find((c) => /^abcjs-mm\d+$/.test(c)) : undefined
  return mark ? Number(mark.slice('abcjs-mm'.length)) : -1
}

/** Where the elements are drawn, without the words around them (the chord above a note, its lyrics under it):
 * the note heads, stems and rests themselves - or the chord symbol when it is the one pointed at. */
function rectOf(elements: Element[]): DOMRect | null {
  const parts = elements.flatMap((el) => (el.tagName.toLowerCase() === 'text' ? [el] : [...el.children].filter((c) => c.tagName.toLowerCase() !== 'text')))
  const rects = (parts.length ? parts : elements).map((el) => el.getBoundingClientRect()).filter((r) => r.width || r.height)
  if (!rects.length) return null
  const left = Math.min(...rects.map((r) => r.left))
  const right = Math.max(...rects.map((r) => r.right))
  const top = Math.min(...rects.map((r) => r.top))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  return new DOMRect(left, top, right - left, bottom - top)
}

/** The top of the system (both staves of a line of music) a note is in: abcjs marks every element of a line
 * with ``abcjs-l<n>``, its staff lines included. ``null``: no such mark. */
function systemTop(note: Element | undefined): number | null {
  const line = note ? [...note.classList].find((c) => /^abcjs-l\d+$/.test(c)) : undefined
  if (!line || !host.value) return null
  const tops = [...host.value.querySelectorAll(`.abcjs-staff.${line}`)].map((el) => el.getBoundingClientRect().top).filter((t) => t)
  return tops.length ? Math.min(...tops) - 34 : null
}

/** The system sounding now stays at one place in the box (a quarter down): the sheet moves on with every new
 * line of music, as the lyrics do, instead of turning a page only when the cursor nearly leaves the box. */
function keepInView(systemTop: number, smooth = true): void {
  const box = scroller.value
  if (!box || box.scrollHeight <= box.clientHeight) return
  const offset = systemTop - box.getBoundingClientRect().top
  const place = box.clientHeight * 0.25
  if (Math.abs(offset - place) > 24) {
    box.scrollTo({ top: Math.max(0, box.scrollTop + offset - place), behavior: smooth ? 'smooth' : 'auto' })
  }
}

watch(() => props.notation.abc, () => nextTick(render))
watch(() => props.time, follow)
watch(() => props.following, (on) => {
  if (!on) {
    for (const el of lit) el.classList.remove('sounding')
    cursor.value.show = false
  }
  // following again (a song started on the page): find the line at once
  litIndex = -1
  if (on) void nextTick(follow)
})

onMounted(() => {
  render()
  // opened while the song plays (a tab, a view): straight to where the music is
  void nextTick(follow)
  observer = new ResizeObserver(() => {
    if (host.value && Math.abs(host.value.clientWidth - width) > 60) render()
  })
  if (host.value) observer.observe(host.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="scroller" class="notation">
    <p v-if="!notation.abc" class="hint">{{ notation.error ? `The notation could not be read: ${notation.error}` : 'This song has no score (MiniMax Music 3, or a recording).' }}</p>
    <p v-else-if="approximate && following" class="hint badge">The cursor follows the score’s tempo - no measured times for this song.</p>
    <p v-if="failed" class="hint">{{ failed }}</p>
    <div class="sheet-wrap">
      <div ref="host" class="sheet" />
      <div v-show="cursor.show && following" class="cursor" :style="{ transform: `translate(${cursor.x}px, ${cursor.y}px)`, height: `${cursor.h}px` }" />
    </div>
  </div>
</template>

<style scoped>
.notation {
  height: 100%;
  overflow-y: auto;
  position: relative;
  scroll-behavior: smooth;
}
.sheet-wrap {
  position: relative;
}
.sheet {
  background: rgba(10, 10, 18, 0.82);
  border-radius: 14px;
  padding: 10px 6px;
}
.sheet :deep(svg) {
  display: block;
}
.sheet :deep(.abcjs-note),
.sheet :deep(.abcjs-rest) {
  transition: fill 0.15s;
}
.sheet :deep(.sounding) {
  fill: var(--accent) !important;
  filter: drop-shadow(0 0 6px var(--accent));
}
.sheet :deep(.abcjs-lyric.sounding) {
  fill: #fff !important;
}
.cursor {
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  margin-left: -1.5px;
  border-radius: 2px;
  background: linear-gradient(var(--accent), var(--accent2));
  box-shadow: 0 0 14px var(--accent);
  transition: transform 0.12s linear;
  pointer-events: none;
  opacity: 0.85;
}
.hint {
  color: var(--muted);
  font: 13px var(--font);
  margin: 6px 4px;
}
.badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 99px;
  padding: 3px 10px;
}
</style>
