<script setup lang="ts">
/**
 * Make your own song - the party guests' page (owner's request 2026-10-25): the song form and the guest's songs in
 * the making, on a phone, below the guests' address (the guests' server, plenio/player/guest.py). A guest is known
 * by a cookie of their own; the host's settings decide whether guests may, how many songs each, how long, covers.
 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

import Icon from '../player/components/Icon.vue'
import MakeForm from '../player/make/MakeForm.vue'
import MakeQueue from '../player/make/MakeQueue.vue'
import { makeClient } from '../player/make/client'
import type { FormData, MakeJob, MakeStatus } from '../player/make/form'

const client = makeClient('../api/make', { 'X-Plenio-Live': '1' })
const status = shallowRef<MakeStatus | null>(null)
const form = shallowRef<FormData | null>(null)
const editing = ref<MakeJob | null>(null)
const error = ref('')
const note = ref('')
const busy = ref('')
const now = ref(Date.now() / 1000)
const tab = ref<'make' | 'mine'>('make')
let timer = 0
let ticker = 0
let noteTimer = 0
const told = new Set<string>()
let first = true

const mine = computed(() => status.value?.jobs ?? [])
const making = computed(() => mine.value.filter((j) => !['done', 'failed', 'cancelled'].includes(j.status)).length)

function say(text: string): void {
  note.value = text
  window.clearTimeout(noteTimer)
  noteTimer = window.setTimeout(() => (note.value = ''), 3500)
}

async function load(): Promise<void> {
  try {
    const answer = await client.status()
    status.value = answer
    error.value = ''
    for (const job of answer.jobs) {
      if (job.status !== 'done' || told.has(job.id)) continue
      told.add(job.id)
      if (!first) say(`“${job.result?.title || job.label}” is ready - it plays at the party`)
    }
    first = false
    if (!form.value && answer.may) form.value = await client.form()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'The player cannot be reached - same Wi-Fi?'
  }
}

function made(job: MakeJob, edited: boolean): void {
  editing.value = null
  say(edited ? 'Changed' : job.position ? `Ordered - #${job.position} in line` : 'Ordered')
  tab.value = 'mine'
  void load()
}
async function act(job: MakeJob, work: () => Promise<unknown>): Promise<void> {
  busy.value = job.id
  try {
    await work()
    await load()
  } catch (e) {
    say(e instanceof Error ? e.message : String(e))
  } finally {
    busy.value = ''
  }
}
function remove(job: MakeJob): void {
  if (['sending', 'queued', 'running'].includes(job.status) && !window.confirm('Stop making this song?')) return
  void act(job, () => client.remove(job.id))
}
function edit(job: MakeJob): void {
  editing.value = job
  tab.value = 'make'
}
const cover = (job: MakeJob): string | null => (job.result?.song ? `../cover/${job.result.song}` : null)

onMounted(() => {
  void load()
  timer = window.setInterval(() => void load(), 3000)
  ticker = window.setInterval(() => (now.value = Date.now() / 1000), 1000)
})
onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.clearInterval(ticker)
})
</script>

<template>
  <main class="guest">
    <header>
      <a class="back" href="../" title="Back to the live playlist"><Icon name="back" :size="18" /> Live</a>
      <div class="brand"><i><b /><b /><b /></i> Plenio</div>
      <span v-if="status" class="pill" :class="{ ok: status.studio.reachable }">{{ status.studio.reachable ? (status.line.making ? 'studio busy' : 'studio ready') : 'studio resting' }}</span>
    </header>
    <section class="hero">
      <h1><Icon name="wand" :size="26" /> Make your own song</h1>
      <p>Pick a style, say what it is about - the studio writes the lyrics, composes and sings it. When it is ready, it plays here at the party.</p>
    </section>

    <p v-if="error" class="banner bad">{{ error }}</p>
    <p v-else-if="status && !status.may" class="banner bad">{{ status.why }}</p>

    <template v-if="status?.may">
      <nav class="tabs">
        <button :class="{ on: tab === 'make' }" @click="tab = 'make'"><Icon name="sparkles" :size="16" /> {{ editing ? 'Change it' : 'New song' }}</button>
        <button :class="{ on: tab === 'mine' }" @click="tab = 'mine'"><Icon name="music" :size="16" /> My songs <b v-if="making">{{ making }}</b></button>
      </nav>
      <section v-show="tab === 'make'" class="card">
        <MakeForm v-if="form" :client="client" :form="form" :status="status" :editing="editing" @made="made" @cancel="editing = null" />
        <p v-else class="empty">Reading the styles …</p>
      </section>
      <section v-show="tab === 'mine'" class="card">
        <MakeQueue v-if="mine.length" :jobs="mine" :now="now" :cover="cover" :busy="busy" @edit="edit" @move="(job, by) => act(job, () => client.move(job.id, by))" @remove="remove" @again="(job) => act(job, () => client.create({ fields: job.fields ?? {}, ...(job.source ? { source: job.source.id } : {}) }))" />
        <p v-else class="empty">Your songs show here - in line, being made, ready. Order one under <b>New song</b>.</p>
      </section>
    </template>
    <div v-if="note" class="toast">{{ note }}</div>
  </main>
</template>

<style scoped>
.guest {
  max-width: 760px;
  margin: 0 auto;
  padding: max(12px, env(safe-area-inset-top)) 14px 60px;
  display: grid;
  gap: 14px;
}
:global(html),
:global(body) {
  overflow: auto;
  height: auto;
  min-height: 100%;
  background: radial-gradient(900px 500px at 80% -10%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%), #0d0b17;
}
header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 14px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  margin-right: auto;
}
.brand i {
  display: inline-flex;
  gap: 2px;
  align-items: flex-end;
  height: 16px;
}
.brand i b {
  width: 3px;
  background: var(--accent);
  border-radius: 2px;
  animation: eq 1s ease-in-out infinite;
}
.brand i b:nth-child(2) {
  animation-delay: -0.3s;
}
.brand i b:nth-child(3) {
  animation-delay: -0.6s;
}
@keyframes eq {
  0%,
  100% {
    height: 30%;
  }
  50% {
    height: 100%;
  }
}
.pill {
  font: 700 11px var(--font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 9px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--muted);
}
.pill.ok {
  background: rgba(79, 191, 127, 0.2);
  color: #9be8b9;
}
.hero h1 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 6px;
  font: 800 26px var(--font);
}
.hero p {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}
.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 6px;
  z-index: 5;
  backdrop-filter: blur(10px);
}
.tabs button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  border: 0;
  border-radius: 11px;
  background: none;
  color: rgba(255, 255, 255, 0.75);
  font: 600 14px var(--font);
  cursor: pointer;
}
.tabs button.on {
  background: color-mix(in srgb, var(--accent) 30%, transparent);
  color: #fff;
}
.tabs b {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  border-radius: 99px;
  background: var(--accent2);
  color: #120c1c;
  font-size: 11px;
}
.card {
  padding: 14px;
  border-radius: 20px;
  background: rgba(18, 15, 28, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.empty {
  margin: 0;
  padding: 24px 6px;
  color: var(--muted);
  text-align: center;
}
.banner {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
}
.banner.bad {
  background: rgba(228, 87, 61, 0.12);
  border: 1px solid rgba(228, 87, 61, 0.35);
}
.toast {
  position: fixed;
  left: 50%;
  bottom: max(18px, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  max-width: calc(100vw - 28px);
  background: #2a2440;
  color: #fff;
  padding: 10px 16px;
  border-radius: 99px;
  font-size: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 20;
}
</style>
