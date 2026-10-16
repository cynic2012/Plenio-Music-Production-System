<script setup lang="ts">
/**
 * Settings (owner's request 2026-10-16): what the player keeps and where - everything is saved on this
 * computer by the player's server, not in the browser - when it last saved, a backup to download, a restore,
 * a fresh start; where *Open in ComfyUI* goes; the folders it reads; and stopping a player that runs without
 * a window (one started from ComfyUI).
 */
import { computed, onMounted, ref } from 'vue'

import { api, type ComfyFound } from '../api'
import { comfyuiAddress, folders, info, lastSaved, library, replaceState, rescan, saveError, say, settings, state } from '../store'
import { countOf } from '../timing'
import Icon from './Icon.vue'

const found = ref<ComfyFound | null>(null)
const looking = ref(false)
const confirmReset = ref(false)
const stopped = ref(false)
const file = ref<HTMLInputElement | null>(null)

const kept = computed(() => [
  ['Playlists', countOf(state.playlists.length, 'playlist')],
  ['Favourites', countOf(state.favorites.length, 'song')],
  ['Play counts', countOf(Object.keys(state.plays).length, 'song')],
  ['Visuals', `${settings.visuals.mode}, ${countOf(settings.visuals.pool.length, 'visual')} ticked, ${countOf(Object.keys(settings.visuals.songs).length, 'song')} with its own`],
  ['Sound', `volume ${Math.round(settings.volume * 100)} %, crossfade ${settings.crossfade} s, speed ${settings.rate}×`],
  ['Library', `sorted by ${settings.sort}, ${settings.view} view`],
  ['Views', `Now playing opens on ${settings.npView}, a song's page on ${settings.songTab}`],
  ['Where you stopped', settings.resume ? 'the queue and the moment in the song' : '-'],
])
const savedAt = computed(() => (lastSaved.value ? lastSaved.value.toLocaleTimeString() : 'nothing changed since the page opened'))

async function look(): Promise<void> {
  looking.value = true
  try {
    const target = await comfyuiAddress()
    found.value = target ? (await api.comfyui(target)).found : null
  } finally {
    looking.value = false
  }
}
onMounted(look)

function backup(): void {
  const data = JSON.stringify({ ...JSON.parse(JSON.stringify(state)), settings: JSON.parse(JSON.stringify(settings)) }, null, 1)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
  link.download = `plenio-player-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}
async function restore(event: Event): Promise<void> {
  const chosen = (event.target as HTMLInputElement).files?.[0]
  if (!chosen) return
  try {
    const data = JSON.parse(await chosen.text())
    if (!data || typeof data !== 'object' || !('playlists' in data || 'settings' in data)) throw new Error('not a Plenio Player backup')
    await replaceState(data)
    say(`Restored: ${countOf(state.playlists.length, 'playlist')}, ${countOf(state.favorites.length, 'favourite')}`, 3000)
  } catch (error) {
    say(`Could not restore ${chosen.name}: ${error instanceof Error ? error.message : String(error)}`, 6000)
  } finally {
    if (file.value) file.value.value = ''
  }
}
async function reset(): Promise<void> {
  confirmReset.value = false
  await replaceState(null)
  say('Started afresh', 2500)
}
async function stop(): Promise<void> {
  await api.quit().catch(() => {})
  stopped.value = true
}
</script>

<template>
  <div class="settings">
    <h1>Settings</h1>

    <div v-if="stopped" class="block stopped">
      <h3>The player has stopped</h3>
      <p>Start it again with the <b>Plenio Player</b> button in ComfyUI, with <code>Plenio Player.bat</code> in the Plenio folder, or with <code>python plenio_player.py</code>.</p>
    </div>

    <section class="block">
      <h3><Icon name="check" /> Kept on this computer</h3>
      <p class="lead">
        Everything you set here - and everything below - is saved by the player itself, half a second after each change and when the page closes. It stays when you
        close the browser, restart the computer, start the player from ComfyUI or by hand, or open it in another browser.
      </p>
      <dl>
        <template v-for="[k, v] in kept" :key="k"><dt>{{ k }}</dt><dd>{{ v }}</dd></template>
      </dl>
      <p class="where">
        <Icon name="folder" :size="14" /> <code>{{ info?.state ?? '~/.plenio/player/state.json' }}</code>
      </p>
      <p class="saved" :class="{ bad: saveError }">{{ saveError ? `Not saved: ${saveError}` : `Last saved: ${savedAt}` }}</p>
      <div class="row">
        <button class="ghost" @click="backup"><Icon name="download" :size="16" /> Download a backup</button>
        <label class="ghost">
          <Icon name="refresh" :size="16" /> Restore a backup…
          <input ref="file" type="file" accept="application/json,.json" hidden @change="restore" />
        </label>
        <button v-if="!confirmReset" class="ghost" @click="confirmReset = true"><Icon name="trash" :size="16" /> Start afresh…</button>
        <button v-else class="ghost danger" @click="reset">Yes - forget playlists, favourites, plays and settings</button>
      </div>
      <p class="hint">The songs themselves are not in the backup: they stay in their folders.</p>
    </section>

    <section class="block">
      <h3><Icon name="external" /> Open in ComfyUI</h3>
      <p class="lead">A song's page opens the song's workflow in ComfyUI, with its lyrics, score and settings, to work on it.</p>
      <p class="status" :class="{ ok: found }">
        {{ looking ? 'Looking for ComfyUI …' : found ? `ComfyUI ${found.version} at ${found.url}` : 'ComfyUI is not running on this computer (or not at the address below).' }}
      </p>
      <label class="field">
        Address <input v-model.lazy="settings.comfyui" :placeholder="info?.comfyui || 'found by itself (127.0.0.1:8188, 127.0.0.1:8000)'" @change="look" />
      </label>
      <button class="ghost small" :disabled="looking" @click="look"><Icon name="refresh" :size="14" /> Look again</button>
    </section>

    <section class="block">
      <h3><Icon name="folder" /> Songs</h3>
      <p class="lead">The player reads every release record (<code>.plenio.json</code>) below these folders: {{ countOf(library.length, 'song') }}.</p>
      <ul class="folders">
        <li v-for="f in folders" :key="f"><code>{{ f }}</code></li>
      </ul>
      <p class="hint">Removed songs go to <code>{{ info?.retired ?? '_retired' }}</code> in their folder, which the player does not read.</p>
      <button class="ghost small" @click="rescan().then(() => say('Library read again'))"><Icon name="refresh" :size="14" /> Look for new songs</button>
    </section>

    <section class="block">
      <h3><Icon name="info" /> The player</h3>
      <p class="lead">Plenio Player {{ info?.version }} - a program of its own, which runs without ComfyUI. Started from ComfyUI it has no window: stop it here.</p>
      <button class="ghost danger" @click="stop">Stop the player</button>
    </section>
  </div>
</template>

<style scoped>
.settings {
  padding: 26px 34px 40px;
  max-width: 980px;
}
h1 {
  font: 800 34px var(--font);
  margin: 6px 0 18px;
}
.block {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.block h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font: 700 16px var(--font);
}
.lead {
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.5;
}
dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 5px 18px;
  margin: 0 0 12px;
  font-size: 13px;
}
dt {
  color: var(--muted);
}
dd {
  margin: 0;
}
code {
  font: 12px var(--mono);
  word-break: break-all;
}
.where,
.saved {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0;
  font-size: 12px;
  color: var(--muted);
}
.saved {
  color: #7fe0a0;
}
.saved.bad {
  color: #ff8f8f;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.row label {
  cursor: pointer;
}
.small {
  height: 32px;
  font-size: 12px;
}
.danger {
  color: #ff8f8f;
  border-color: rgba(255, 120, 120, 0.5);
}
.hint {
  color: var(--muted);
  font-size: 12px;
  margin: 10px 0;
}
.status {
  font-size: 13px;
  color: #ffb36b;
}
.status.ok {
  color: #7fe0a0;
}
.field {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
  font-size: 13px;
  color: var(--muted);
}
.field input {
  flex: 1;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #fff;
  padding: 7px 10px;
  font: 13px var(--mono);
}
.folders {
  margin: 0 0 8px;
  padding-left: 18px;
}
.stopped {
  border-color: #ffb36b;
}
</style>
