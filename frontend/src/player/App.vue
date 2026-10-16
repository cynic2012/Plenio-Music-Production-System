<script setup lang="ts">
/**
 * The Plenio Player: the sidebar, the page of the route (the library and its smart lists, a song, the
 * playlists, a playlist), the bar at the bottom, the queue from the right and Now playing over everything.
 * Keyboard: Space, arrows, F, V, N, L, S, R, B, M, Q, /, 1-4, Esc, ? - shown with ?.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import LibraryView from './components/LibraryView.vue'
import NowPlaying from './components/NowPlaying.vue'
import PlayerBar from './components/PlayerBar.vue'
import PlaylistView from './components/PlaylistView.vue'
import PlaylistsView from './components/PlaylistsView.vue'
import SettingsView from './components/SettingsView.vue'
import LiveView from './components/LiveView.vue'
import QueuePanel from './components/QueuePanel.vue'
import RemoveDialog from './components/RemoveDialog.vue'
import Sidebar from './components/Sidebar.vue'
import SongView from './components/SongView.vue'
import { api } from './api'
import { engine } from './engine'
import { paletteStyle } from './now'
import {
  current,
  go,
  library,
  loadError,
  loading,
  next,
  openCurrentPage,
  nowPlayingOpen,
  previous,
  removing,
  route,
  say,
  setVolume,
  toast,
  settings,
  toggleAB,
  toggleFavorite,
  toggleMute,
} from './store'
import { loadMyPresets } from './visuals/drop'
import './live'

const queueOpen = ref(false)
const help = ref(false)
const main = ref<HTMLElement | null>(null)
const libraryView = ref<InstanceType<typeof LibraryView> | null>(null)
const nowPlaying = ref<InstanceType<typeof NowPlaying> | null>(null)

const page = computed(() => {
  const [, first = '', second = ''] = route.value.split('/')
  if (first === 'song' && second) return { kind: 'song' as const, id: decodeURIComponent(second) }
  if (first === 'playlist' && second) return { kind: 'playlist' as const, id: decodeURIComponent(second) }
  if (first === 'playlists') return { kind: 'playlists' as const }
  if (first === 'settings') return { kind: 'settings' as const }
  if (first === 'live') return { kind: 'live' as const }
  if (first === 'favorites' || first === 'top' || first === 'recent') return { kind: 'library' as const, collection: first as 'favorites' | 'top' | 'recent' }
  return { kind: 'library' as const, collection: 'all' as const }
})
// a page opens at its top - except a library page you come back to, which is where you left it
const scrolls = new Map<string, number>()
watch(route, (now, before) => {
  if (before !== undefined && main.value) scrolls.set(before, main.value.scrollTop)
  const keep = !now.startsWith('/song/') && !now.startsWith('/record/')
  void nextTick(() => main.value?.scrollTo({ top: keep ? (scrolls.get(now) ?? 0) : 0, behavior: 'instant' as ScrollBehavior }))
})

// ComfyUI's Export Release opens the player at a song by its record file: #/record/<path> -> its page
watch(
  [route, library],
  async ([path]) => {
    if (!path.startsWith('/record/') || !library.value.length) return
    const record = decodeURIComponent(path.slice('/record/'.length))
    try {
      const { id } = await api.find(record)
      go(`/song/${id}`, true)
    } catch {
      go('/', true)
      say('That song is not in the library (yet) - Look for new songs, or check the folders in Settings.', 5000)
    }
  },
  { immediate: true }
)

const KEYS: [string, string][] = [
  ['Space', 'Play / pause'],
  ['← →', 'Back / ahead 5 seconds'],
  ['Shift ← →', 'Previous / next song'],
  ['↑ ↓', 'Louder / quieter'],
  ['F', 'Now playing'],
  ['Shift F', 'Only the visual, full screen'],
  ['I', 'The page of the song that plays'],
  ['1 – 4', 'Stage, lyrics, notation, visual'],
  ['V', 'The visuals’ settings'],
  ['N', 'Another visual'],
  ['L', 'Favourite'],
  ['S', 'Shuffle'],
  ['R', 'Repeat: all, one, off'],
  ['B', 'A/B: master or unmastered take'],
  ['M', 'Mute'],
  ['Q', 'The queue'],
  ['/', 'Search'],
  ['Esc', 'Close'],
]

function onKey(event: KeyboardEvent): void {
  const target = event.target as HTMLElement
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
  if (event.key === 'Escape') {
    // Esc leaves a text field first; a list (select) that was chosen from does not hold it back
    if (typing && target.tagName !== 'SELECT') (target as HTMLInputElement).blur()
    else if (removing.value) removing.value = null
    else if (help.value) help.value = false
    else if (queueOpen.value) queueOpen.value = false
    else if (nowPlayingOpen.value) nowPlayingOpen.value = false
    return
  }
  if (typing || event.ctrlKey || event.metaKey || event.altKey) return
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  switch (key) {
    case ' ':
      event.preventDefault()
      void engine.toggle()
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (event.shiftKey) void previous()
      else engine.seek(engine.time - 5)
      break
    case 'ArrowRight':
      event.preventDefault()
      if (event.shiftKey) void next()
      else engine.seek(engine.time + 5)
      break
    case 'ArrowUp':
    case 'ArrowDown':
      event.preventDefault()
      setVolume(settings.volume + (key === 'ArrowUp' ? 0.05 : -0.05))
      say(`Volume ${Math.round(settings.volume * 100)} %`)
      break
    case 'f':
      if (event.shiftKey) visualFullscreen()
      else nowPlayingOpen.value = !nowPlayingOpen.value
      break
    case 'v':
      nowPlayingOpen.value = true
      void nextTick(() => nowPlaying.value?.togglePanel())
      break
    case 'n':
      nowPlaying.value?.nextVisual()
      break
    case '1':
    case '2':
    case '3':
    case '4':
      nowPlayingOpen.value = true
      void nextTick(() => nowPlaying.value?.setView((['stage', 'lyrics', 'notation', 'visual'] as const)[Number(key) - 1]))
      break
    case 'i':
      openCurrentPage()
      break
    case 'l':
      if (current.value) {
        toggleFavorite(current.value.id)
        say('♥')
      }
      break
    case 's':
      settings.shuffle = !settings.shuffle
      say(settings.shuffle ? 'Shuffle on' : 'Shuffle off')
      break
    case 'r':
      settings.repeat = settings.repeat === 'all' ? 'one' : settings.repeat === 'one' ? 'off' : 'all'
      say(`Repeat ${settings.repeat}`)
      break
    case 'b':
      toggleAB()
      break
    case 'm':
      toggleMute()
      break
    case 'q':
      queueOpen.value = !queueOpen.value
      break
    case '/':
      event.preventDefault()
      nowPlayingOpen.value = false
      if (page.value.kind !== 'library') go('/')
      void nextTick(() => libraryView.value?.focus())
      break
    case '?':
      help.value = !help.value
      break
  }
}
function visualFullscreen(): void {
  nowPlayingOpen.value = true
  void nextTick(() => nowPlaying.value?.visualFullscreen())
}

// the listener's own Plenio Drop presets: read now, and again every few seconds (a file saved shows at once)
let presetTimer: number | undefined
onMounted(() => {
  window.addEventListener('keydown', onKey)
  void loadMyPresets()
  presetTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') void loadMyPresets()
  }, 3000)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearInterval(presetTimer)
})
</script>

<template>
  <div class="app" :class="{ 'no-side': !settings.sidebar }" :style="paletteStyle">
    <div class="ambient" />
    <Sidebar v-if="settings.sidebar" class="sidebar" />
    <main ref="main" class="main">
      <div v-if="loading && !library.length" class="splash">
        <span class="logo"><i /><i /><i /><i /><i /></span>
        <p>Looking for your songs …</p>
      </div>
      <div v-else-if="loadError" class="splash error">
        <p>The player’s server does not answer: {{ loadError }}</p>
        <p class="hint">Start it with <code>python -m plenio.player</code>.</p>
      </div>
      <template v-else>
        <SongView v-if="page.kind === 'song'" :id="page.id" />
        <PlaylistView v-else-if="page.kind === 'playlist'" :id="page.id" />
        <PlaylistsView v-else-if="page.kind === 'playlists'" />
        <SettingsView v-else-if="page.kind === 'settings'" />
        <LiveView v-else-if="page.kind === 'live'" />
        <LibraryView v-else ref="libraryView" :key="page.collection" :collection="page.collection" />
      </template>
    </main>
    <PlayerBar class="playerbar" @queue="queueOpen = !queueOpen" @visual="visualFullscreen" />
    <Transition name="slide"><QueuePanel v-if="queueOpen" class="queue" @close="queueOpen = false" /></Transition>
    <Transition name="np"><NowPlaying v-if="nowPlayingOpen" ref="nowPlaying" /></Transition>
    <Transition name="fade">
      <div v-if="help" class="help" @click="help = false">
        <div class="keys" @click.stop>
          <h3>Keys</h3>
          <dl><template v-for="[k, what] in KEYS" :key="k"><dt><kbd>{{ k }}</kbd></dt><dd>{{ what }}</dd></template></dl>
          <p class="hint">Search: words find titles, lyrics, genres, moods; fields narrow it - <code>genre:jazz</code> <code>bpm:&gt;110</code> <code>key:Am</code> <code>model:yue</code> <code>lang:german</code> <code>is:fav</code> <code>has:pdf</code> <code>-word</code> <code>"a phrase"</code>.</p>
        </div>
      </div>
    </Transition>
    <Transition name="fade"><div v-if="toast" class="toast">{{ toast }}</div></Transition>
    <Transition name="fade"><RemoveDialog v-if="removing" :song="removing" @close="removing = null" @done="say" /></Transition>
  </div>
</template>

<style scoped>
.app {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 1fr auto;
  grid-template-areas: 'side main' 'bar bar';
  background: #0a0910;
}
.app.no-side {
  grid-template-columns: 1fr;
  grid-template-areas: 'main' 'bar';
}
.ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(1200px 600px at 75% -10%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%),
    radial-gradient(900px 500px at 0% 110%, color-mix(in srgb, var(--accent2) 14%, transparent), transparent 70%), var(--deep);
  transition: background 1.2s;
}
.sidebar {
  grid-area: side;
  position: relative;
  min-height: 0;
}
.main {
  grid-area: main;
  position: relative;
  overflow-y: auto;
  min-height: 0;
  scroll-behavior: smooth;
}
.playerbar {
  grid-area: bar;
  position: relative;
  z-index: 10;
}
.queue {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 96px;
  z-index: 40;
}
.splash {
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  color: var(--muted);
  gap: 14px;
}
.splash.error {
  color: #ff9a9a;
}
.splash .logo {
  display: flex;
  gap: 5px;
  align-items: flex-end;
  height: 40px;
}
.splash .logo i {
  width: 7px;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(var(--accent), var(--accent2));
  transform-origin: bottom;
  animation: bounce 1s ease-in-out infinite;
}
.splash .logo i:nth-child(2) {
  animation-delay: -0.2s;
}
.splash .logo i:nth-child(3) {
  animation-delay: -0.4s;
}
.splash .logo i:nth-child(4) {
  animation-delay: -0.6s;
}
.splash .logo i:nth-child(5) {
  animation-delay: -0.8s;
}
.hint {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}
.help {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
}
.keys {
  width: min(560px, 92vw);
  background: rgba(18, 16, 28, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 20px 24px;
}
.keys h3 {
  margin: 0 0 12px;
}
.keys dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 0 0 12px;
  font-size: 13px;
}
.keys dd {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}
kbd,
code {
  font: 12px var(--mono);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 5px;
  padding: 1px 6px;
}
.toast {
  position: fixed;
  left: 50%;
  top: 40px;
  transform: translateX(-50%);
  z-index: 95;
  padding: 8px 16px;
  border-radius: 99px;
  background: rgba(20, 18, 30, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font: 600 13px var(--font);
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(40px);
  opacity: 0;
}
.np-enter-active,
.np-leave-active {
  transition: opacity 0.45s, transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.np-enter-from,
.np-leave-to {
  opacity: 0;
  transform: translateY(40px) scale(0.98);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@keyframes bounce {
  0%,
  100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}
@media (max-width: 860px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-areas: 'main' 'bar';
  }
  .sidebar {
    display: none;
  }
}
</style>
