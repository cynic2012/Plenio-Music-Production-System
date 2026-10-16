<script setup lang="ts">
/**
 * The visual in motion: picks the scene (visuals/chooser.ts), draws it every frame from the music
 * (engine.frame), blends a change over 0.8 s, and changes it with the song, the section, the interval or a
 * drop - as the settings say. ``mini`` draws Winamp's little bars for the player bar.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { songHue } from '../colors'
import { engine } from '../engine'
import { current, settings } from '../store'
import { chooseVisual } from '../visuals/chooser'
import { dropOptions } from '../visuals/drop/renderer'
import { myPresets } from '../visuals/drop'
import { makeColors, presetById, type Preset, type Scene } from '../visuals/presets'

const props = defineProps<{ section?: string; playlistVisual?: string; mini?: boolean; force?: string }>()
const emit = defineEmits<{ change: [id: string] }>()

const canvas = ref<HTMLCanvasElement | null>(null)
const presetId = ref('')
let scene: Scene | null = null
let snapshot: HTMLCanvasElement | null = null
let blend = 0
let raf = 0
let turn = 0
let lastSwitch = performance.now()
let quiet = 0

const hue = computed(() => (current.value ? songHue(current.value.id, current.value.genre) : 200))

let playing: Preset | null = null
/** Play a visual (``again``: the same one anew - a preset file saved while it plays). */
function use(id: string, again = false): void {
  const preset = presetById(id) ?? presetById('bars')
  if (!preset || (preset.id === presetId.value && !again)) return
  const el = canvas.value
  // between two Drop presets the renderer glides by itself (the feedback stays); else the old image fades
  const glide = playing?.kind === 'drop' && preset.kind === 'drop'
  playing = preset
  if (el && scene && !glide) {
    snapshot = snapshot ?? document.createElement('canvas')
    snapshot.width = el.width
    snapshot.height = el.height
    snapshot.getContext('2d')?.drawImage(el, 0, 0)
    blend = 1
  }
  scene = preset.create()
  presetId.value = preset.id
  lastSwitch = performance.now()
  if (!props.mini) emit('change', preset.id)
}

/** The visual by the rules (``newTurn``: the song's next change); ``asked``: N or *next* - another one now,
 * even where the song, the playlist or *fixed* keep one (the rules take over again at the next change). */
function pick(newTurn = false, asked = false): void {
  if (props.mini) return use('bars')
  if (props.force) return use(props.force)
  if (newTurn) turn += 1
  const v = settings.visuals
  use(
    chooseVisual({
      settings: asked ? { ...v, songs: {}, mode: v.mode === 'fixed' ? 'cycle' : v.mode } : v,
      song: current.value,
      playlist: asked ? '' : props.playlistVisual,
      previous: presetId.value || null,
      turn,
    })
  )
}

function resize(): void {
  const el = canvas.value
  if (!el) return
  const ratio = props.mini ? 1 : Math.min(1.5, window.devicePixelRatio || 1)
  const w = Math.max(1, Math.floor(el.clientWidth * ratio))
  const h = Math.max(1, Math.floor(el.clientHeight * ratio))
  if (el.width !== w || el.height !== h) {
    el.width = w
    el.height = h
  }
}

function loop(): void {
  raf = requestAnimationFrame(loop)
  const el = canvas.value
  if (!el || !scene) return
  resize()
  const ctx = el.getContext('2d')
  if (!ctx) return
  engine.sensitivity = settings.visuals.sensitivity
  dropOptions.scale = settings.visuals.dropScale
  const frame = engine.frame()
  const colors = makeColors(hue.value, props.mini ? 'song' : settings.visuals.scheme, frame.time)
  ctx.save()
  scene.draw(ctx, frame, el.width, el.height, colors)
  ctx.restore()
  if (blend > 0 && snapshot) {
    ctx.globalAlpha = blend
    ctx.drawImage(snapshot, 0, 0, el.width, el.height)
    ctx.globalAlpha = 1
    blend = Math.max(0, blend - frame.dt * 1.25)
  }
  if (props.mini || props.force) return
  // the switches during a song: every N seconds, or when the music drops in after a quiet passage
  const v = settings.visuals
  const since = (performance.now() - lastSwitch) / 1000
  if (v.switchOn === 'interval' && frame.playing && since > Math.max(5, v.interval)) pick(true)
  if (v.switchOn === 'drop' && frame.playing) {
    quiet = frame.level < 0.12 ? quiet + frame.dt : Math.max(0, quiet - frame.dt * 0.5)
    if (quiet > 1.5 && frame.bass > 0.45 && frame.beat && since > 6) {
      quiet = 0
      pick(true)
    }
  }
}

watch(() => current.value?.id, () => {
  turn = 0
  pick()
})
watch(() => props.section, (now, before) => {
  if (now && before && now !== before && settings.visuals.switchOn === 'section') pick(true)
})
watch(() => [settings.visuals.mode, settings.visuals.fixed, props.playlistVisual, props.force, current.value ? settings.visuals.songs[current.value.id] : ''], () => pick())

// one of the listener's presets edited and saved while it plays: it changes on screen
watch(myPresets, () => {
  if (presetId.value.startsWith('my-')) use(presetId.value, true)
})

onMounted(() => {
  pick()
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))

defineExpose({ presetId, next: () => pick(true, true) })
</script>

<template>
  <canvas ref="canvas" class="visual-canvas" />
</template>

<style scoped>
.visual-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
