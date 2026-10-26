<script setup lang="ts">
/**
 * Make a song (owner's request 2026-10-25, docs/design/party-songs.md): the song form and one's songs in the
 * making, side by side; the admin sees everybody's songs too and finds the switches in Settings. The songs are made
 * by YuE2 in the ComfyUI on this computer - HQ mastering off, cover art on - and join Live Play when ready.
 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

import { media } from '../api'
import MakeForm from '../make/MakeForm.vue'
import MakeQueue from '../make/MakeQueue.vue'
import { retryRequest } from '../make/form'
import type { MakeJob, Remake } from '../make/form'
import { everybody, loadForm, loadMake, makeApi, makeError, makeForm, makeStatus, pollMake } from '../make/state'
import { byId, go, playSong, reloadLibrary, say, settings } from '../store'
import Icon from './Icon.vue'

const props = defineProps<{ from?: string }>()

const editing = ref<MakeJob | null>(null)
const remake = shallowRef<Remake | null>(null)
const remakeError = ref('')
const reading = ref(false)
const busy = ref('')
const error = ref('')
const now = ref(Date.now() / 1000)
const tick = window.setInterval(() => (now.value = Date.now() / 1000), 1000)
const status = computed(() => makeStatus.value)
const mine = computed(() => (status.value?.jobs ?? []).filter((j) => everybody.value || j.mine))
const making = computed(() => mine.value.filter((j) => !['done', 'failed', 'cancelled'].includes(j.status)).length)
const studio = computed(() => {
  const s = status.value
  if (!s) return { text: 'Asking the studio …', tone: 'wait' }
  if (!s.studio.reachable) return { text: 'Studio not running - songs wait until ComfyUI runs', tone: 'bad' }
  if (s.line.making || s.line.waiting) return { text: `Studio busy · ${s.line.waiting} waiting`, tone: 'busy' }
  return { text: 'Studio ready', tone: 'ok' }
})

onMounted(async () => {
  pollMake(true)
  if (props.from) void readAgain(props.from)
  try {
    await loadForm()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
})
onBeforeUnmount(() => {
  window.clearInterval(tick)
  pollMake(false)
})
watch(everybody, () => void loadMake())

/** What the form starts from to make the song at ``#/make/<song id>`` again. */
async function readAgain(songId: string): Promise<void> {
  reading.value = true
  remakeError.value = ''
  try {
    remake.value = await makeApi.remake(songId)
  } catch (e) {
    remake.value = null
    remakeError.value = e instanceof Error ? e.message : String(e)
  } finally {
    reading.value = false
  }
}
/** The cover of the song made again (``null``: none to show). */
const coverOf = (songId: string): string | null => (byId.value.get(songId)?.has.cover ? media(songId, 'cover') : null)

function made(job: MakeJob, edited: boolean): void {
  editing.value = null
  remake.value = null
  say(edited ? 'Changed - it keeps its place in the line' : job.position ? `Ordered - #${job.position} in line` : 'Ordered', 4000)
  void loadMake()
  if (props.from) go('/make', true)
}
/** Change a song waiting in the line - a song made again has its remake loaded for its documents. */
function edit(job: MakeJob): void {
  editing.value = job
  if (job.again && job.from?.song) void readAgain(job.from.song)
  else remake.value = null
}
async function act(job: MakeJob, work: () => Promise<unknown>): Promise<void> {
  busy.value = job.id
  error.value = ''
  try {
    await work()
    await loadMake()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = ''
  }
}
function remove(job: MakeJob): void {
  const running = ['sending', 'queued', 'running'].includes(job.status)
  if (running && !window.confirm(`Stop making “${job.label}”? It cannot go on later.`)) return
  if (editing.value?.id === job.id) editing.value = null
  void act(job, () => makeApi.remove(job.id))
}
async function play(job: MakeJob): Promise<void> {
  const id = job.result?.song
  if (!id) return
  if (!byId.value.has(id)) await reloadLibrary()
  if (byId.value.has(id)) void playSong(id)
  else say('The song is not in the library yet - a moment', 3000)
}
function again(job: MakeJob): void {
  void act(job, () => makeApi.create(retryRequest(job)))
}
/** Leave a waiting song as it was - and the form as it was before: the song of ``#/make/<song id>``, else a new
 * song. */
function cancel(): void {
  editing.value = null
  if (props.from) void readAgain(props.from)
  else remake.value = null
}
/** A song that is ready, made again: a new take, a new song like it, or a cover. */
function remakeSong(job: MakeJob): void {
  if (job.result?.song) go(`/make/${job.result.song}`)
}
const cover = (job: MakeJob): string | null => (job.result?.song && byId.value.get(job.result.song)?.has.cover ? media(job.result.song, 'cover') : null)
</script>

<template>
  <div class="make-page">
    <header class="hero">
      <div>
        <h1><Icon name="wand" :size="30" /> Make a song</h1>
        <p class="lead">Pick a style, say what it is about - the studio writes the lyrics, composes, sings and paints the cover. A few minutes later it plays{{ settings.live.on ? ' at the party' : '' }}.</p>
      </div>
      <div class="chips">
        <span class="pill" :class="studio.tone"><i /> {{ studio.text }}</span>
        <span v-if="status?.me" class="pill who"><Icon name="user" :size="13" /> {{ status.me.name }}{{ status.me.kind === 'admin' && status.me.name.toLowerCase() !== 'admin' ? ' · admin' : '' }}</span>
      </div>
    </header>

    <p v-if="status?.admin && !status.on" class="banner">
      <Icon name="info" :size="16" /> Song making is off for guests and users - you can make songs as the admin. <a @click="go('/settings')">Switch it on in Settings</a>.
    </p>
    <p v-else-if="status && !status.may" class="banner bad"><Icon name="info" :size="16" /> {{ status.why }}</p>
    <p v-if="makeError || error" class="banner bad">{{ error || makeError }}</p>

    <div class="grid">
      <section class="card">
        <h2>{{ editing ? 'Change your song' : remake ? 'Again, from a song' : 'Your new song' }}</h2>
        <p v-if="remake && !editing" class="again-note">
          <Icon name="wand" :size="16" /> {{ remake.song.title }} - choose a new take, a new song like it or a cover, or <a @click="go('/make')">start a new song instead</a>.
        </p>
        <p v-if="remakeError" class="banner bad">
          <Icon name="info" :size="16" /> {{ remakeError }} <a @click="go('/make')">Make a new song instead</a>
        </p>
        <MakeForm
          v-if="makeForm && (!from || remake)"
          :client="makeApi"
          :form="makeForm"
          :status="status"
          :editing="editing"
          :remake="remake"
          :cover-of="coverOf"
          @made="made"
          @cancel="cancel"
        />
        <p v-else class="empty">{{ reading ? 'Reading the song …' : 'Reading the styles …' }}</p>
      </section>
      <section class="card songs">
        <h2>
          {{ everybody ? 'Everybody’s songs' : 'Your songs' }} <small v-if="making">{{ making }} in the making</small>
          <span v-if="status?.admin" class="switch">
            <button class="chip" :class="{ on: !everybody }" @click="everybody = false">Mine</button>
            <button class="chip" :class="{ on: everybody }" @click="everybody = true">Everybody’s</button>
          </span>
        </h2>
        <MakeQueue
          v-if="mine.length"
          :jobs="mine"
          :now="now"
          :cover="cover"
          :owners="everybody"
          :busy="busy"
          playable
          @edit="edit"
          @move="(job, by) => act(job, () => makeApi.move(job.id, by))"
          @remove="remove"
          @play="play"
          @again="again"
          @remake="remakeSong"
        />
        <div v-else class="empty">
          <Icon name="music" :size="34" />
          <p>No songs yet. The ones you order show here - in line, being made, ready - and you can move, change or take them out while they wait.</p>
        </div>
        <p v-if="status?.me.full" class="foot">Made by YuE2 in this computer’s ComfyUI · you have the whole studio: the writer model, HQ mastering, cover art, the folder, the formats and the tags under <i>Every setting of the studio</i> - it starts from the party’s settings (album “Party-Song {{ new Date().toISOString().slice(0, 10) }}” in plenio/Party-Songs-…) · a song ready joins Live Play like every new song.</p>
        <p v-else class="foot">Made by YuE2 in this computer’s ComfyUI · HQ mastering off, cover art on · album “Party-Song {{ new Date().toISOString().slice(0, 10) }}” · saved in plenio/Party-Songs-… · a song ready joins Live Play like every new song.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.make-page {
  padding: 26px 34px 48px;
  max-width: 1400px;
}
.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
}
h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 6px;
  font: 800 34px var(--font);
  background: linear-gradient(90deg, #fff, color-mix(in srgb, var(--accent) 60%, #fff));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
h1 :deep(svg) {
  color: var(--accent);
}
.lead {
  margin: 0;
  color: var(--muted);
  max-width: 680px;
  line-height: 1.5;
}
.again-note {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin: -6px 0 14px;
  color: var(--muted);
  font-size: 13px;
}
.again-note a {
  color: var(--accent);
  cursor: pointer;
  text-decoration: underline;
}
.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 12px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font: 600 12.5px var(--font);
}
.pill i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #8a86a0;
}
.pill.ok i {
  background: #4fbf7f;
  box-shadow: 0 0 10px #4fbf7f;
}
.pill.busy i {
  background: #e0a83c;
  box-shadow: 0 0 10px #e0a83c;
  animation: pulse 1.4s ease-in-out infinite;
}
.pill.bad i {
  background: #e4573d;
}
@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}
.banner {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 16px 0 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 12%, rgba(255, 255, 255, 0.03));
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}
.banner.bad {
  background: rgba(228, 87, 61, 0.1);
  border-color: rgba(228, 87, 61, 0.35);
}
.banner a {
  color: var(--accent);
  cursor: pointer;
  text-decoration: underline;
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 18px;
  margin-top: 18px;
  align-items: start;
}
.card {
  padding: 18px 20px 20px;
  border-radius: 22px;
  background: rgba(18, 15, 28, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.songs {
  position: sticky;
  top: 18px;
}
h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 0 0 14px;
  font-size: 18px;
}
h2 small {
  color: var(--muted);
  font-weight: 500;
  font-size: 13px;
}
.switch {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 26px 10px;
  color: var(--muted);
  text-align: center;
}
.empty p {
  margin: 0;
  max-width: 360px;
}
.foot {
  margin: 14px 0 0;
  color: rgba(235, 232, 245, 0.4);
  font-size: 11.5px;
  line-height: 1.5;
}
@media (max-width: 1100px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .songs {
    position: static;
    order: -1;
  }
}
@media (max-width: 640px) {
  .make-page {
    padding: 16px 14px 40px;
  }
  h1 {
    font-size: 26px;
  }
  .card {
    padding: 14px;
  }
}
</style>
