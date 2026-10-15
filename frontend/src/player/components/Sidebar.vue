<script setup lang="ts">
/** The sidebar: the library and its smart lists, the playlists (a new one in place), the folder, a rescan. */
import { computed, ref } from 'vue'

import { folders, go, library, newPlaylist, rescan, route, state } from '../store'
import Icon from './Icon.vue'

const naming = ref(false)
const name = ref('')
const scanning = ref(false)

const LINKS = [
  ['/', 'Songs', 'music'],
  ['/favorites', 'Favourites', 'heart'],
  ['/top', 'Most played', 'star'],
  ['/recent', 'Recently played', 'clock'],
  ['/playlists', 'Playlists', 'playlist'],
] as const
const counts = computed<Record<string, number>>(() => ({
  '/': library.value.length,
  '/favorites': state.favorites.length,
  '/top': Object.keys(state.plays).length,
  '/recent': Object.keys(state.last_played).length,
  '/playlists': state.playlists.length,
}))

function create(): void {
  const playlist = newPlaylist(name.value)
  naming.value = false
  name.value = ''
  go(`/playlist/${playlist.id}`)
}
async function scan(): Promise<void> {
  scanning.value = true
  try {
    await rescan()
  } finally {
    scanning.value = false
  }
}
</script>

<template>
  <nav class="side">
    <a class="brand" @click="go('/')">
      <span class="logo"><i /><i /><i /><i /></span>
      <span>Plenio <b>Player</b></span>
    </a>
    <a v-for="[path, label, icon] in LINKS" :key="path" class="link" :class="{ on: route === path }" @click="go(path)">
      <Icon :name="icon" :size="18" /> {{ label }} <small>{{ counts[path] || '' }}</small>
    </a>

    <h4>Playlists <button class="icon-btn" title="New playlist" @click="naming = !naming"><Icon name="plus" :size="16" /></button></h4>
    <form v-if="naming" class="new" @submit.prevent="create">
      <input v-model="name" placeholder="Name" autofocus @keydown.esc="naming = false" />
    </form>
    <div class="lists">
      <a v-for="p in state.playlists" :key="p.id" class="link pl" :class="{ on: route === `/playlist/${p.id}` }" @click="go(`/playlist/${p.id}`)">
        <i class="dot" :style="{ background: `hsl(${p.hue ?? 260} 80% 60%)` }" /> <span>{{ p.name }}</span> <small>{{ p.songs.length }}</small>
      </a>
      <p v-if="!state.playlists.length && !naming" class="hint">No playlists yet - make one with +, or from a song’s ⋯ menu.</p>
    </div>

    <div class="foot">
      <p v-for="f in folders" :key="f" class="folder" :title="f"><Icon name="folder" :size="14" /> {{ f }}</p>
      <button class="ghost small" :disabled="scanning" @click="scan"><Icon name="refresh" :size="14" :class="{ spin: scanning }" /> {{ scanning ? 'Looking …' : 'Look for new songs' }}</button>
      <p class="keys">Space play · ←→ seek · F now playing · ? keys</p>
    </div>
  </nav>
</template>

<style scoped>
.side {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 18px 12px;
  height: 100%;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.28);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font: 600 18px var(--font);
  padding: 2px 10px 18px;
  cursor: pointer;
  color: #fff;
}
.brand b {
  color: var(--accent);
  font-weight: 800;
}
.logo {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  height: 22px;
}
.logo i {
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(var(--accent), var(--accent2));
  animation: logo 1.6s ease-in-out infinite;
}
.logo i:nth-child(1) {
  height: 40%;
}
.logo i:nth-child(2) {
  height: 90%;
  animation-delay: -0.4s;
}
.logo i:nth-child(3) {
  height: 65%;
  animation-delay: -0.8s;
}
.logo i:nth-child(4) {
  height: 30%;
  animation-delay: -1.2s;
}
.link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  font: 500 14px var(--font);
  transition: background 0.15s, color 0.15s;
}
.link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}
.link.on {
  background: color-mix(in srgb, var(--accent) 22%, transparent);
  color: #fff;
}
.link small {
  margin-left: auto;
  color: var(--muted);
  font: 11px var(--mono);
}
h4 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 10px 4px;
  font: 600 11px var(--font);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--muted);
}
.new input {
  width: 100%;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--accent);
  border-radius: 8px;
  color: #fff;
  padding: 6px 10px;
  font: 13px var(--font);
  margin-bottom: 4px;
}
.lists {
  flex: 1;
  overflow-y: auto;
  min-height: 60px;
}
.pl span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
}
.hint {
  color: var(--muted);
  font-size: 12px;
  padding: 0 10px;
}
.foot {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 6px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.folder {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font: 11px var(--mono);
  color: var(--muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  direction: rtl;
  text-align: left;
}
.small {
  font-size: 12px;
  padding: 6px 10px;
}
.keys {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--muted);
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes logo {
  0%,
  100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.45);
  }
}
.logo i {
  transform-origin: bottom;
}
</style>
