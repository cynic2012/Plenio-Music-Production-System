<script setup lang="ts">
/**
 * The visuals' settings: the mode (auto, random from a choice, cycle, fixed), when it changes, the colours,
 * the sensitivity - and a visual of its own for this song or for the playlist that plays.
 */
import { computed } from 'vue'

import { current, queueSource, settings, state } from '../store'
import { PRESETS, presetById, type Scheme } from '../visuals/presets'
import type { SwitchOn, VisualMode } from '../visuals/chooser'
import Icon from './Icon.vue'

defineProps<{ active: string }>()
const emit = defineEmits<{ close: []; next: [] }>()

const v = settings.visuals
const MODES: [VisualMode, string, string][] = [
  ['auto', 'Match the music', 'A visual that suits the song’s genre, mood and tempo'],
  ['random', 'Random', 'From the visuals ticked below'],
  ['cycle', 'Cycle', 'Through the ticked visuals in turn'],
  ['fixed', 'Fixed', 'Always the same visual'],
]
const SWITCHES: [SwitchOn, string][] = [
  ['song', 'With every song'],
  ['section', 'At every section (verse, chorus …)'],
  ['interval', 'Every few seconds'],
  ['drop', 'When the music drops in'],
]
const SCHEMES: [Scheme, string][] = [
  ['song', 'The song’s colours'],
  ['winamp', 'Winamp classic'],
  ['neon', 'Neon'],
  ['sunset', 'Sunset'],
  ['mono', 'Monochrome'],
]

const playlist = computed(() => state.playlists.find((p) => p.id === queueSource.value) ?? null)
const songOwn = computed(() => (current.value ? v.songs[current.value.id] ?? '' : ''))

function togglePool(id: string): void {
  const at = v.pool.indexOf(id)
  if (at >= 0 && v.pool.length > 1) v.pool.splice(at, 1)
  else if (at < 0) v.pool.push(id)
}
function setSong(id: string): void {
  if (!current.value) return
  if (id) v.songs[current.value.id] = id
  else delete v.songs[current.value.id]
}
function setPlaylist(id: string): void {
  if (playlist.value) playlist.value.visual = id
}
</script>

<template>
  <aside class="panel">
    <header>
      <h3><Icon name="sparkles" /> Visuals</h3>
      <button class="icon-btn" title="Close" @click="emit('close')"><Icon name="close" /></button>
    </header>
    <div class="now">
      Now: <b>{{ presetById(active)?.name ?? '-' }}</b>
      <button class="chip" title="Another visual (N)" @click="emit('next')"><Icon name="dice" :size="14" /> next</button>
    </div>

    <label class="row switch"><input v-model="v.enabled" type="checkbox" /> Visuals on</label>

    <h4>Mode</h4>
    <div class="modes">
      <button v-for="[id, label, hint] in MODES" :key="id" class="mode" :class="{ on: v.mode === id }" :title="hint" @click="v.mode = id">
        {{ label }}<small>{{ hint }}</small>
      </button>
    </div>

    <template v-if="v.mode === 'fixed'">
      <h4>The visual</h4>
      <select v-model="v.fixed">
        <option v-for="p in PRESETS" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </template>

    <template v-if="v.mode !== 'fixed'">
      <h4>Change</h4>
      <select v-model="v.switchOn">
        <option v-for="[id, label] in SWITCHES" :key="id" :value="id">{{ label }}</option>
      </select>
      <label v-if="v.switchOn === 'interval'" class="row">every <input v-model.number="v.interval" type="number" min="5" max="600" /> seconds</label>
    </template>

    <h4>{{ v.mode === 'auto' ? 'Choose from' : v.mode === 'fixed' ? 'All visuals' : 'Ticked visuals' }}</h4>
    <div class="pool">
      <label v-for="p in PRESETS" :key="p.id" class="preset" :class="{ on: v.pool.includes(p.id), now: p.id === active }" :title="p.blurb">
        <input type="checkbox" :checked="v.pool.includes(p.id)" @change="togglePool(p.id)" />
        <span class="name">{{ p.name }}</span>
        <span class="blurb">{{ p.blurb }}</span>
      </label>
    </div>

    <h4>This song</h4>
    <select :value="songOwn" @change="setSong(($event.target as HTMLSelectElement).value)">
      <option value="">As the mode says</option>
      <option v-for="p in PRESETS" :key="p.id" :value="p.id">Always {{ p.name }}</option>
    </select>
    <template v-if="playlist">
      <h4>The playlist “{{ playlist.name }}”</h4>
      <select :value="playlist.visual ?? ''" @change="setPlaylist(($event.target as HTMLSelectElement).value)">
        <option value="">As the mode says</option>
        <option v-for="p in PRESETS" :key="p.id" :value="p.id">Always {{ p.name }}</option>
      </select>
    </template>

    <h4>Look</h4>
    <select v-model="v.scheme">
      <option v-for="[id, label] in SCHEMES" :key="id" :value="id">{{ label }}</option>
    </select>
    <label class="row">Sensitivity <input v-model.number="v.sensitivity" type="range" min="0.5" max="2" step="0.05" /></label>
    <label class="row switch"><input v-model="v.lyrics" type="checkbox" /> Lyrics over the visual</label>
    <label class="row switch"><input v-model="v.titles" type="checkbox" /> Title card when a song starts</label>
    <p class="note">A song’s own visual wins, then the playlist’s, then the mode.</p>
  </aside>
</template>

<style scoped>
.panel {
  width: 340px;
  max-height: 100%;
  overflow-y: auto;
  background: rgba(14, 12, 22, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 16px 18px 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  font: 13px var(--font);
  color: #ddd;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h3 {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  font: 600 16px var(--font);
  color: #fff;
}
h4 {
  margin: 14px 0 6px;
  font: 600 11px var(--font);
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--muted);
}
.now {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.now b {
  color: var(--accent);
}
.modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.mode {
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #eee;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  font: 600 12px var(--font);
}
.mode small {
  display: block;
  font-weight: 400;
  color: var(--muted);
  font-size: 11px;
  margin-top: 2px;
}
.mode.on {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 18%, transparent);
}
select,
input[type='number'] {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 8px;
  font: 13px var(--font);
}
input[type='number'] {
  width: 70px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}
.row input[type='range'] {
  flex: 1;
  accent-color: var(--accent);
}
.pool {
  display: grid;
  gap: 4px;
}
.preset {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
}
.preset:hover {
  background: rgba(255, 255, 255, 0.04);
}
.preset.now {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
}
.preset input {
  grid-row: span 2;
  accent-color: var(--accent);
}
.name {
  font-weight: 600;
  color: #fff;
}
.blurb {
  color: var(--muted);
  font-size: 11px;
}
.note {
  color: var(--muted);
  font-size: 11px;
  margin-top: 14px;
}
</style>
