<script setup lang="ts">
/** The menu of a song (right click or ⋯): play next, add to the queue or a playlist, a radio of songs alike,
 * favourite, open. */
import { computed, ref } from 'vue'

import type { SongSummary } from '../api'
import { vFocus } from '../focus'
import { similarSongs } from '../similar'
import { addToPlaylist, enqueue, go, isFavorite, library, newPlaylist, openInComfyUI, playSongs, removing, say, state, toggleFavorite, videoFor } from '../store'

const props = defineProps<{ song: SongSummary; x: number; y: number }>()
const emit = defineEmits<{ close: [] }>()
const naming = ref(false)
const place = computed(() => ({ left: `${Math.min(props.x, window.innerWidth - 260)}px`, top: `${Math.min(props.y, window.innerHeight - 380)}px` }))
const name = ref('')

function done(): void {
  emit('close')
}
function comfy(): void {
  done()
  openInComfyUI(props.song).then(
    () => say('The song opened in ComfyUI', 2600),
    (error: unknown) => say(error instanceof Error ? error.message : String(error), 6000)
  )
}
function radio(): void {
  void playSongs([props.song.id, ...similarSongs(props.song, library.value, 40).map((s) => s.id)])
  done()
}
function create(): void {
  addToPlaylist(newPlaylist(name.value || props.song.title), [props.song.id])
  done()
}
</script>

<template>
  <div class="veil" @click="done" @contextmenu.prevent="done">
    <div class="menu" :style="place" @click.stop>
      <p class="head">{{ song.title }}</p>
      <button @click="enqueue([song.id], true); done()">Play next</button>
      <button @click="enqueue([song.id]); done()">Add to the queue</button>
      <button @click="radio">Start a radio of songs alike</button>
      <button @click="toggleFavorite(song.id); done()">{{ isFavorite(song.id) ? 'Remove from favourites' : 'Add to favourites' }}</button>
      <button @click="go(`/song/${song.id}`); done()">Open the song’s page</button>
      <button v-if="!song.other" @click="comfy">Open in ComfyUI</button>
      <button @click="videoFor = song; done()">Save as a video…</button>
      <button class="remove" @click="removing = song; done()">Remove from the library…</button>
      <p class="head small">Add to a playlist</p>
      <button v-for="p in state.playlists" :key="p.id" @click="addToPlaylist(p, [song.id]); done()">
        <i class="dot" :style="{ background: `hsl(${p.hue ?? 260} 80% 60%)` }" />{{ p.name }}
      </button>
      <form v-if="naming" class="new" @submit.prevent="create">
        <input v-model="name" v-focus placeholder="Name of the playlist" />
        <button type="submit">Create</button>
      </form>
      <button v-else class="plus" @click="naming = true">+ New playlist…</button>
    </div>
  </div>
</template>

<style scoped>
.veil {
  position: fixed;
  inset: 0;
  z-index: 80;
}
.menu {
  position: fixed;
  width: 250px;
  max-height: 380px;
  overflow-y: auto;
  background: rgba(20, 18, 30, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 6px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  animation: pop 0.16s ease-out;
}
.head {
  margin: 4px 8px 6px;
  font: 600 12px var(--font);
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.head.small {
  color: var(--muted);
  font-weight: 500;
  font-size: 11px;
  margin-top: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  border: 0;
  background: none;
  color: #ddd;
  font: 13px var(--font);
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
}
button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.new {
  display: flex;
  gap: 4px;
  padding: 4px;
}
.new input {
  flex: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 8px;
  padding: 5px 8px;
}
.new button {
  width: auto;
}
.plus {
  color: var(--accent);
}
.remove {
  color: #ff8f8f;
}
@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
}
</style>
