<script setup lang="ts">
/**
 * Share songs as a player (owner's request 2026-10-16): the songs chosen - all of a view, a playlist, the
 * favourites, any - packed with the player into one HTML file that plays by itself anywhere: send it, and
 * the other one double-clicks it. MP3 of 128-192 kbit/s, optionally the sheet music, your own visuals,
 * your look and the playlists of these songs.
 */
import { computed, onBeforeUnmount, ref } from 'vue'

import { api, type PackageStatus } from '../api'
import { parseQuery, score } from '../search'
import { byId, library, say, settings, state } from '../store'
import { formatTime } from '../timing'
import { myPresetTexts } from '../visuals/drop'
import CoverArt from './CoverArt.vue'
import Icon from './Icon.vue'

const props = defineProps<{ songs: string[]; title: string }>()
const emit = defineEmits<{ close: [] }>()

const title = ref(props.title || 'My Plenio songs')
const chosen = ref(new Set(props.songs.filter((id) => byId.value.has(id))))
const find = ref('')
const bitrate = ref(192)
const pdf = ref(true)
const look = ref(true)
const presets = ref(true)
const playlists = ref(true)
const status = ref<PackageStatus | null>(null)
const error = ref('')
let timer: number | undefined

const shown = computed(() => {
  const q = find.value.trim()
  if (!q) return library.value
  const terms = parseQuery(q)
  const context = { favorites: new Set(state.favorites) }
  return library.value.filter((s) => score(s, terms, context) > 0)
})
const picked = computed(() => library.value.filter((s) => chosen.value.has(s.id)))
const seconds = computed(() => picked.value.reduce((t, s) => t + (s.seconds || 0), 0))
// MP3 at the bit rate, as base64 in the page (4/3), and a little for the player itself
const megabytes = computed(() => (seconds.value * bitrate.value * 1000) / 8 / 2 ** 20 * 1.34 + 1.2)
const working = computed(() => status.value?.state === 'working')

function toggle(id: string): void {
  const next = new Set(chosen.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  chosen.value = next
}
function pick(ids: string[], name = ''): void {
  chosen.value = new Set(ids.filter((id) => byId.value.has(id)))
  if (name) title.value = name
}

async function make(): Promise<void> {
  error.value = ''
  status.value = { state: 'working', done: 0, total: chosen.value.size }
  const ids = library.value.filter((s) => chosen.value.has(s.id)).map((s) => s.id)
  try {
    const { job } = await api.packageStart({
      songs: ids,
      title: title.value,
      bitrate: bitrate.value,
      pdf: pdf.value,
      settings: look.value ? JSON.parse(JSON.stringify({ visuals: settings.visuals, lyrics: settings.lyrics })) : {},
      presets: presets.value ? myPresetTexts.value : [],
      playlists: playlists.value ? state.playlists.map((p) => ({ name: p.name, songs: p.songs.filter((id) => chosen.value.has(id)) })).filter((p) => p.songs.length) : [],
    })
    const ask = async (): Promise<void> => {
      try {
        status.value = await api.packageStatus(job)
      } catch (e) {
        status.value = { state: 'error', done: 0, total: 0, error: e instanceof Error ? e.message : String(e) }
      }
      if (status.value?.state === 'working') timer = window.setTimeout(ask, 600)
      else if (status.value?.state === 'done') say(`Saved: ${status.value.file}`, 5000)
    }
    void ask()
  } catch (e) {
    status.value = null
    error.value = e instanceof Error ? e.message : String(e)
  }
}
const sizeText = (bytes: number): string => (bytes > 2 ** 30 ? `${(bytes / 2 ** 30).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 2 ** 20))} MB`)
onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div class="veil" @click.self="!working && emit('close')">
    <div class="dialog" role="dialog" aria-label="Share as a player">
      <header>
        <h3><Icon name="download" /> Share your songs as a player</h3>
        <button class="icon-btn" title="Close" :disabled="working" @click="emit('close')"><Icon name="close" /></button>
      </header>
      <p class="lead">One HTML file with the player and the songs you choose: send it, and the other one opens it with a double-click - in any current browser, without installing anything, without ComfyUI. The lyrics, the notation following the music, the visuals, playlists and Live Play all play; the songs go as MP3, never as FLAC.</p>
      <div class="body">
        <div class="left">
          <div class="quick">
            <button class="chip" @click="pick(library.map((s) => s.id))">all {{ library.length }}</button>
            <button class="chip" @click="pick(state.favorites, 'My favourites')">favourites</button>
            <button v-for="p in state.playlists" :key="p.id" class="chip" @click="pick(p.songs, p.name)">{{ p.name }}</button>
            <button class="chip" @click="pick([])">none</button>
          </div>
          <input v-model="find" class="find" placeholder="Search: title, genre, mood …" />
          <div class="list">
            <label v-for="s in shown" :key="s.id" class="row" :class="{ on: chosen.has(s.id) }">
              <input type="checkbox" :checked="chosen.has(s.id)" @change="toggle(s.id)" />
              <CoverArt :song="s" rounded />
              <span class="t">{{ s.title }}<small>{{ s.other ? s.artist || 'other music' : s.genre }} · {{ formatTime(s.seconds) }}</small></span>
            </label>
          </div>
        </div>
        <form class="right" @submit.prevent>
          <label>Name <input v-model="title" class="text" maxlength="120" /></label>
          <label>Sound
            <select v-model.number="bitrate">
              <option :value="128">MP3, 128 kbit/s - smallest</option>
              <option :value="160">MP3, 160 kbit/s</option>
              <option :value="192">MP3, 192 kbit/s - best</option>
            </select>
          </label>
          <label class="check"><input v-model="pdf" type="checkbox" /> the sheet music (PDF)</label>
          <label class="check"><input v-model="look" type="checkbox" /> my look: the visuals’ and the lyrics’ settings</label>
          <label class="check"><input v-model="presets" type="checkbox" :disabled="!myPresetTexts.length" /> my own Plenio Drop visuals ({{ myPresetTexts.length }})</label>
          <label class="check"><input v-model="playlists" type="checkbox" /> my playlists of these songs</label>
          <p class="sum"><b>{{ chosen.size }}</b> songs · {{ formatTime(seconds) }} · about {{ Math.max(1, Math.round(megabytes)) }} MB</p>
          <p class="hint">What stays out: the FLAC and WAV files, the unmastered takes, the release records with their workflows, and every path of this computer.</p>
          <div v-if="status?.state === 'working'" class="progress">
            <p>Packing song {{ Math.min(status.done + 1, status.total) }} of {{ status.total }} …</p>
            <div class="bar"><i :style="{ width: `${status.total ? (status.done / status.total) * 100 : 5}%` }" /></div>
          </div>
          <div v-if="status?.state === 'done'" class="done">
            <p><Icon name="check" :size="16" /> Saved: <b>{{ status.file }}</b> ({{ sizeText(status.size ?? 0) }})</p>
            <div class="buttons">
              <a class="ghost small" :href="`/packages/${encodeURIComponent(status.file ?? '')}?download=1`" :download="status.file"><Icon name="download" :size="14" /> Download</a>
              <a class="ghost small" :href="`/packages/${encodeURIComponent(status.file ?? '')}`" target="_blank" rel="noopener"><Icon name="play" :size="14" /> Try it</a>
              <button type="button" class="ghost small" @click="api.openPackages()"><Icon name="folder" :size="14" /> Open the folder</button>
            </div>
            <p class="hint path">{{ status.folder }}</p>
          </div>
          <p v-if="status?.state === 'error' || error" class="error">{{ status?.error || error }}</p>
        </form>
      </div>
      <footer>
        <button class="primary" :disabled="!chosen.size || working" @click="make"><Icon name="download" :size="16" /> {{ working ? 'Packing …' : 'Make the player' }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.veil {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.6);
}
.dialog {
  width: min(1060px, 96vw);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: #13101c;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.7);
}
header,
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
}
footer {
  justify-content: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
h3 {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
}
.lead {
  margin: 0;
  padding: 0 20px;
  color: var(--muted);
  font-size: 13px;
}
.body {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(300px, 1fr);
  gap: 20px;
  padding: 14px 20px;
  overflow: hidden;
  min-height: 0;
}
.left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}
.quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.find,
.text,
select {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 7px 10px;
  font: 13px var(--font);
}
.list {
  overflow-y: auto;
  max-height: 46vh;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}
.row {
  display: grid;
  grid-template-columns: auto 36px 1fr;
  gap: 10px;
  align-items: center;
  padding: 5px 10px;
  cursor: pointer;
}
.row:hover {
  background: rgba(255, 255, 255, 0.04);
}
.row.on {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}
.t {
  display: grid;
  font-weight: 600;
  min-width: 0;
}
.t small {
  font-weight: 400;
  color: var(--muted);
}
.right {
  display: grid;
  gap: 10px;
  align-content: start;
  font-size: 13px;
}
.right label {
  display: grid;
  gap: 4px;
  color: var(--muted);
}
.right label.check {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ddd;
}
input[type='checkbox'] {
  accent-color: var(--accent);
}
.sum {
  margin: 4px 0 0;
}
.hint {
  color: var(--muted);
  font-size: 12px;
  margin: 0;
}
.hint.path {
  word-break: break-all;
}
.bar {
  height: 8px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 0.3s;
}
.progress p,
.done p {
  margin: 0 0 6px;
}
.done p {
  display: flex;
  gap: 6px;
  align-items: center;
}
.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.error {
  color: #ff9a9a;
}
</style>
