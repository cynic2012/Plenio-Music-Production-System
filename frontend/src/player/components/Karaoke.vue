<script setup lang="ts">
/**
 * The lyrics as they are sung: the current line large, painted syllable by syllable as the voice reaches
 * it, the lines before it fading upwards, the next ones waiting below; a click on a line jumps there. A
 * song without measured times shows its lyrics still.
 */
import { computed, nextTick, ref, watch } from 'vue'

import type { TimedLine } from '../api'
import { engine } from '../engine'
import { chunksAt, lineAt, lineOn } from '../timing'

const props = defineProps<{ lines: TimedLine[]; time: number; plain?: string; compact?: boolean }>()

const box = ref<HTMLElement | null>(null)
const active = computed(() => lineAt(props.lines, props.time))
const on = computed(() => lineOn(props.lines, active.value, props.time))

watch(active, async (i) => {
  await nextTick()
  const el = box.value?.querySelector<HTMLElement>(`[data-line="${i}"]`)
  const host = box.value
  if (!el || !host) return
  const target = el.offsetTop - host.clientHeight * (props.compact ? 0.35 : 0.4) + el.clientHeight / 2
  host.scrollTo({ top: target, behavior: 'smooth' })
})

const stanzas = computed(() => (props.plain ?? '').split(/\n\s*\n/).map((s) => s.split('\n')))
</script>

<template>
  <div ref="box" class="karaoke" :class="{ compact }">
    <template v-if="lines.length">
      <div class="pad" />
      <p
        v-for="(line, i) in lines"
        :key="i"
        :data-line="i"
        class="line"
        :class="{ now: i === active && on, past: i < active || (i === active && !on), soon: i === active + 1 }"
        @click="engine.seek(Math.max(0, line.start - 0.15))"
      >
        <template v-if="i === active">
          <span v-for="(chunk, k) in chunksAt(line, time)" :key="k" class="chunk" :style="{ '--fill': `${chunk.fill * 100}%` }">{{ chunk.text }}</span>
        </template>
        <template v-else>{{ line.text }}</template>
      </p>
      <div class="pad" />
    </template>
    <div v-else-if="plain" class="plain">
      <p class="hint">No times for this song - its lyrics as written.</p>
      <div v-for="(stanza, s) in stanzas" :key="s" class="stanza">
        <p v-for="(line, k) in stanza" :key="k">{{ line }}</p>
      </div>
    </div>
    <p v-else class="hint">An instrumental - no lyrics.</p>
  </div>
</template>

<style scoped>
.karaoke {
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  mask-image: linear-gradient(transparent, #000 18%, #000 75%, transparent);
  padding: 0 8px;
}
.karaoke::-webkit-scrollbar {
  display: none;
}
.pad {
  height: 40%;
}
.line {
  font: 700 clamp(20px, 2.4vw, 34px) / 1.3 var(--font);
  color: rgba(255, 255, 255, 0.28);
  margin: 0 0 0.55em;
  cursor: pointer;
  transition: color 0.4s, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s, filter 0.4s;
  transform-origin: left center;
  filter: blur(0.3px);
}
.compact .line {
  font-size: clamp(16px, 1.6vw, 22px);
}
.line:hover {
  color: rgba(255, 255, 255, 0.6);
}
.line.past {
  color: rgba(255, 255, 255, 0.4);
  opacity: 0.6;
}
.line.soon {
  color: rgba(255, 255, 255, 0.55);
}
.line.now {
  transform: scale(1.06);
  filter: none;
  color: rgba(255, 255, 255, 0.35);
}
.chunk {
  background: linear-gradient(90deg, #fff var(--fill), rgba(255, 255, 255, 0.35) var(--fill));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 calc(var(--fill) * 0.18) var(--glow, rgba(255, 255, 255, 0.4));
}
.plain {
  padding: 8% 0;
  font: 500 17px/1.6 var(--font);
  color: rgba(255, 255, 255, 0.75);
}
.stanza {
  margin-bottom: 1.2em;
}
.stanza p {
  margin: 0;
}
.hint {
  color: var(--muted);
  font: 13px var(--font);
}
</style>
