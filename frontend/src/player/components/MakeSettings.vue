<script setup lang="ts">
/**
 * Settings > Party songs (owner's request 2026-10-25): whether guests and logged-in users may make songs, how
 * many each may have in the making, the longest length, covers - and what every party song is made with. The
 * admin's only; the server keeps it (party-songs.json beside the state).
 */
import { computed, onMounted, ref } from 'vue'

import { loadMake, makeApi, makeStatus } from '../make/state'
import { go, say } from '../store'
import Icon from './Icon.vue'

const LENGTHS = ['very short (about 1:00)', 'short (about 1:30)', 'about 2:00', 'about 2:30', 'standard (about 3:00)', 'about 3:30', 'about 4:00', 'long (about 4:30)', 'about 5:00', 'very long (about 6:00)']
const saving = ref(false)
const status = computed(() => makeStatus.value)
const settings = computed(() => status.value?.settings)

onMounted(() => void loadMake())

async function change(key: string, value: unknown): Promise<void> {
  saving.value = true
  try {
    await makeApi.settings({ [key]: value })
    await loadMake()
  } catch (e) {
    say(e instanceof Error ? e.message : String(e), 5000)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section v-if="status?.admin && settings" class="block">
    <h3><Icon name="wand" /> Party songs</h3>
    <p class="lead">
      Guests and users make songs of their own from the player - a style, a few words, the Generate Song button - and the studio (YuE2 in ComfyUI on this computer) makes them one after the other.
      When a song is ready it joins Live Play as every new song does.
    </p>
    <label class="check big"><input type="checkbox" :checked="settings.on" :disabled="saving" @change="change('on', ($event.target as HTMLInputElement).checked)" /> Let people make songs</label>
    <div class="who" :class="{ off: !settings.on }">
      <label class="check"><input type="checkbox" :checked="settings.users" :disabled="saving || !settings.on" @change="change('users', ($event.target as HTMLInputElement).checked)" /> logged-in users</label>
      <label class="check"><input type="checkbox" :checked="settings.guests" :disabled="saving || !settings.on" @change="change('guests', ($event.target as HTMLInputElement).checked)" /> guests - in the network without an account, and the party's phones (Live Play's guests' page)</label>
      <label class="check"><input type="checkbox" :checked="settings.covers" :disabled="saving || !settings.on" @change="change('covers', ($event.target as HTMLInputElement).checked)" /> covers too (they upload the original song)</label>
      <label class="field">Songs one person may have in the making
        <select :value="settings.per_person" :disabled="saving || !settings.on" @change="change('per_person', Number(($event.target as HTMLSelectElement).value))">
          <option v-for="n in [1, 2, 3, 4, 5, 8, 10, 20]" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
      <label class="field">The longest song
        <select :value="settings.max_length" :disabled="saving || !settings.on" @change="change('max_length', ($event.target as HTMLSelectElement).value)">
          <option v-for="l in LENGTHS" :key="l" :value="l">{{ l }}</option>
        </select>
      </label>
    </div>
    <p class="status" :class="{ ok: status.studio.reachable }">
      {{ status.studio.reachable ? 'The studio answers: ComfyUI with Plenio’s Song API is running.' : `The studio does not answer - songs wait until ComfyUI runs.${status.studio.error ? ` (${status.studio.error})` : ''}` }}
    </p>
    <p class="hint">
      Every party song: YuE2, <b>HQ mastering off</b> (twice as fast), <b>cover art on</b>, saved in <code>plenio/Party-Songs-&lt;date&gt;</code> of ComfyUI’s output folder, album <i>Party-Song &lt;date&gt;</i>,
      artist the user’s name or <i>Guest</i>. You as the admin may make longer songs and as many as you like. The line, everybody’s songs: <a @click="go('/make')">Make a song</a>.
    </p>
  </section>
</template>

<style scoped>
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
  color: var(--muted);
  line-height: 1.5;
}
.check {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
}
.check.big {
  font-weight: 650;
}
.who {
  display: grid;
  gap: 8px;
  margin: 10px 0 0 24px;
}
.who.off {
  opacity: 0.55;
}
.field {
  display: flex;
  gap: 10px;
  align-items: center;
  color: var(--muted);
}
select {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 5px 8px;
  font: 13px var(--font);
}
.status {
  font-size: 13px;
  color: #ffb36b;
  margin: 14px 0 0;
}
.status.ok {
  color: #7fe0a6;
}
.hint {
  color: var(--muted);
  font-size: 12px;
  margin: 10px 0 0;
  line-height: 1.5;
}
.hint a {
  color: var(--accent);
  cursor: pointer;
}
code {
  font: 12px var(--mono);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 5px;
  padding: 1px 6px;
}
</style>
