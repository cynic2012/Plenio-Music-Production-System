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
import { makeColors, presetById, type Scene } from '../visuals/presets'

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

function use(id: string): void {
  const preset = presetById(id) ?? presetById('bars')
  if (!preset || preset.id === presetId.value) return
  const el = canvas.value
  if (el && scene) {
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

function pick(newTurn = false): void {
  if (props.mini) return use('bars')
  if (props.force) return use(props.force)
  if (newTurn) turn += 1
  use(
    chooseVisual({
      settings: settings.visuals,
      song: current.value,
      playlist: props.playlistVisual,
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

onMounted(() => {
  pick()
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))

defineExpose({ presetId, next: () => pick(true) })
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
