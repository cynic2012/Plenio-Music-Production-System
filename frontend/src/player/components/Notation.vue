<script setup lang="ts">
/**
 * The song's notation (abcjs, the score with the lyrics under the notes) following the music: the notes
 * sounding now glow, a cursor stands at them and the sheet scrolls along. The song's time becomes score time
 * through the syllables measured when it was exported (timing.audioToScore); a click on a note jumps there.
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
}
let events: Event[] = []
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
      .map((e) => ({ ms: e.milliseconds, elements: (e.elements ?? []).flat() as Element[], start: e.startChar }))
    failed.value = ''
    litIndex = -1
    lit = []
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
  lit = events.filter((e) => Math.abs(e.ms - at) < 1).flatMap((e) => e.elements)
  for (const el of lit) el.classList.add('sounding')
  const first = lit[0]?.getBoundingClientRect()
  const base = host.value.getBoundingClientRect()
  if (first && first.width) {
    // the cursor spans every voice sounding now (both staves of a system), with a little room
    const rects = lit.map((el) => el.getBoundingClientRect()).filter((r) => r.height > 0)
    const top = Math.min(...rects.map((r) => r.top)) - 18
    const bottom = Math.max(...rects.map((r) => r.bottom)) + 18
    cursor.value = {
      x: first.left - base.left + first.width / 2,
      y: top - base.top,
      h: bottom - top,
      show: true,
    }
    const box = scroller.value
    if (box) {
      const top = first.top - box.getBoundingClientRect().top
      if (top < box.clientHeight * 0.15 || top > box.clientHeight * 0.7) {
        box.scrollTo({ top: box.scrollTop + top - box.clientHeight * 0.3, behavior: 'smooth' })
      }
    }
  }
}

watch(() => props.notation.abc, () => nextTick(render))
watch(() => props.time, follow)
watch(() => props.following, (on) => {
  if (!on) {
    for (const el of lit) el.classList.remove('sounding')
    cursor.value.show = false
    litIndex = -1
  }
})

onMounted(() => {
  render()
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
