<script setup lang="ts">
/**
 * Which lyrics to follow: as written, or as the take sings them (lyricsVersion.ts). *As sung* needs a song
 * exported with what its take sings; the choice is kept with the other settings and holds for every song.
 */
import { computed } from 'vue'

import type { SongDetail } from '../api'
import { LYRICS_VERSIONS, sectionsNotSung, sungNote, sungOf } from '../lyricsVersion'
import { settings } from '../store'

/** ``detail``: the song the switch is for (*As sung* only where it has it); none - in Settings, or nothing
 * plays - for every song. */
const props = defineProps<{ detail?: SongDetail | null; details?: boolean }>()

const forAll = computed(() => !props.detail)
const sung = computed(() => sungOf(props.detail))
const note = computed(() => (sung.value ? sungNote(sung.value) : ''))
const notSung = computed(() => (sung.value ? sectionsNotSung(sung.value) : []))
/** The version shown: a song without what its take sings shows its written lyrics, whatever was chosen. */
const shown = computed(() => (settings.lyricsVersion === 'sung' && (sung.value || forAll.value) ? 'sung' : 'written'))
</script>

<template>
  <div class="version">
    <div class="switch" role="radiogroup" aria-label="Which lyrics">
      <button
        v-for="v in LYRICS_VERSIONS"
        :key="v.id"
        type="button"
        role="radio"
        :aria-checked="shown === v.id"
        :class="{ on: shown === v.id }"
        :disabled="v.id === 'sung' && !sung && !forAll"
        :title="v.id === 'sung' && !sung && !forAll ? 'This song was exported before Plenio kept what its take sings' : v.title"
        @click="settings.lyricsVersion = v.id"
      >
        {{ v.label }}
      </button>
    </div>
    <p v-if="details && note" class="note">
      {{ note }}<template v-if="notSung.length"> Not sung as written: {{ notSung.map((t) => `[${t}]`).join(', ') }}.</template>
    </p>
    <details v-if="details && sung && sung.not_sung.length" class="missing">
      <summary>Lines of the lyrics not heard</summary>
      <p v-for="(line, i) in sung.not_sung" :key="i">{{ line }}</p>
    </details>
  </div>
</template>

<style scoped>
.version {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
}
.switch {
  display: inline-flex;
  width: max-content;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  overflow: hidden;
}
.switch button {
  padding: 5px 14px;
  font-size: 13px;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  border: 0;
  cursor: pointer;
}
.switch button.on {
  background: var(--accent);
  color: #fff;
}
.switch button:disabled {
  opacity: 0.45;
  cursor: default;
}
.note {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
}
.missing {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
}
.missing p {
  margin: 2px 0 0 12px;
}
</style>
