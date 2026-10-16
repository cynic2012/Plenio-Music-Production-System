<script setup lang="ts">
/**
 * The library: a featured song, the search (free words and field filters), filter chips for the most
 * common genres, moods, models and more, the sort, and the songs as a grid or a list.
 */
import { computed, onMounted, ref, watch } from 'vue'

import type { SongSummary } from '../api'
import { library, playSongs, settings, state } from '../store'
import { countOf, formatTime } from '../timing'
import { compareVersions, lyricsSnippet, parseQuery, score, sortSongs, topValues, versionOf, words, type SortKey } from '../search'
import CoverArt from './CoverArt.vue'
import Icon from './Icon.vue'
import SongCard from './SongCard.vue'
import SongMenu from './SongMenu.vue'

const props = defineProps<{ collection: 'all' | 'favorites' | 'top' | 'recent' }>()

// the search and the chips are kept with the settings, one set per view: they are still there after a song's
// page, another window, or a reload - until Reset filters
if (!settings.filters[props.collection]) settings.filters[props.collection] = { query: '', chips: [] }
const filter = computed(() => settings.filters[props.collection] ?? { query: '', chips: [] })
const query = computed({ get: () => filter.value.query, set: (v: string) => (filter.value.query = v) })
const chips = computed(() => filter.value.chips)
const filtered = computed(() => !!query.value.trim() || chips.value.length > 0)
function resetFilters(): void {
  filter.value.query = ''
  filter.value.chips.splice(0)
}
const input = ref<HTMLInputElement | null>(null)
const menu = ref<{ song: SongSummary; x: number; y: number } | null>(null)
const limit = ref(120)

const base = computed<SongSummary[]>(() => {
  const all = library.value
  if (props.collection === 'favorites') return state.favorites.map((id) => all.find((s) => s.id === id)).filter((s): s is SongSummary => !!s)
  if (props.collection === 'top') return all.filter((s) => (state.plays[s.id] ?? 0) > 0)
  if (props.collection === 'recent') return all.filter((s) => state.last_played[s.id])
  return all
})

const terms = computed(() => parseQuery([query.value, ...chips.value].join(' ')))
const scored = computed(() => {
  const context = { favorites: new Set(state.favorites) }
  const map = new Map<string, number>()
  const found = base.value.filter((song) => {
    const value = score(song, terms.value, context)
    if (value > 0) map.set(song.id, value)
    return value > 0
  })
  return { found, map }
})
const sortKey = computed<SortKey>(() => {
  if (props.collection === 'top') return 'plays'
  if (props.collection === 'recent') return 'recent'
  if (query.value.trim() && settings.sort === 'newest') return 'relevance'
  return settings.sort as SortKey
})
const songs = computed(() => sortSongs(scored.value.found, sortKey.value, { plays: state.plays, lastPlayed: state.last_played }, scored.value.map))
const shown = computed(() => songs.value.slice(0, limit.value))
watch(songs, () => (limit.value = 120))

const facets = computed(() => {
  const all = base.value
  return [
    { key: 'genre', label: 'Genre', values: topValues(all, (s) => words(s.genre), 10) },
    { key: 'mood', label: 'Mood', values: topValues(all, (s) => words(s.mood), 8) },
    { key: 'is', label: 'Made with', values: topValues(all, (s) => [s.other ? 'other' : 'plenio'], 2) },
    { key: 'model', label: 'Model', values: topValues(all, (s) => [s.other ? '' : s.model ? s.model.toLowerCase().split(' ')[0] : 'master'], 4) },
    { key: 'vocals', label: 'Vocals', values: topValues(all, (s) => [s.instrumental ? 'instrumental' : s.vocals ? 'sung' : ''], 3) },
    { key: 'lang', label: 'Language', values: topValues(all, (s) => [s.language.toLowerCase()], 6) },
    { key: 'mode', label: 'Creative mode', values: topValues(all, (s) => [s.arrangement && s.arrangement !== 'off' ? s.arrangement : ''], 8) },
    { key: 'year', label: 'Year', values: topValues(all, (s) => [s.year], 4) },
    { key: 'plenio', label: 'Plenio version', values: versionSteps(all) },
  ].filter((f) => f.values.length > 1 || f.key === 'model')
})
/** "from 0.8.1", "from 0.8.0" ...: the versions the songs were made with (newest first), each with how many
 * songs are that version or newer - for an archive that still holds songs of older versions. */
function versionSteps(all: typeof base.value): [string, number][] {
  const versions = new Map<string, number[]>()
  for (const song of all) {
    const v = versionOf(song.plenio)
    if (v) versions.set(v.join('.'), v)
  }
  const sorted = [...versions.values()].sort((a, b) => compareVersions(b, a))
  return sorted.slice(0, 8).map((v) => [`from ${v.join('.')}`, all.filter((s) => {
    const have = versionOf(s.plenio)
    return have !== null && compareVersions(have, v) >= 0
  }).length])
}
const chipValue = (key: string, value: string): string => `${key}:"${value}"`
/** ``genre:"dance-pop"`` -> ``Genre: dance-pop`` (the active filters' row). */
function chipLabel(chip: string): string {
  const match = /^(\w+):"(.*)"$/.exec(chip)
  if (!match) return chip
  const facet = facets.value.find((f) => f.key === match[1])
  return `${facet?.label ?? match[1]}: ${match[2]}`
}
function toggleChip(key: string, value: string): void {
  const chip = chipValue(key, value)
  const at = chips.value.indexOf(chip)
  if (at >= 0) chips.value.splice(at, 1)
  else chips.value.push(chip)
}

// the featured song: one of the newest dozen, a different one each visit
const featured = ref<SongSummary | null>(null)
function feature(): void {
  const pool = library.value.slice(0, 12)
  featured.value = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
}
watch(library, feature)
onMounted(feature)

const totals = computed(() => ({
  songs: library.value.length,
  time: library.value.reduce((sum, s) => sum + s.seconds, 0),
  favs: state.favorites.length,
}))

const titles: Record<string, string> = { all: 'Your songs', favorites: 'Favourites', top: 'Most played', recent: 'Recently played' }
function play(song: SongSummary): void {
  void playSongs(songs.value.map((s) => s.id), songs.value.indexOf(song))
}
function playAll(shuffle = false): void {
  const ids = songs.value.map((s) => s.id)
  if (shuffle) settings.shuffle = true
  void playSongs(ids, shuffle ? Math.floor(Math.random() * ids.length) : 0)
}
defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="library">
    <section v-if="collection === 'all' && featured && !query" class="hero">
      <div class="hero-art"><CoverArt :song="featured" live rounded /></div>
      <div class="hero-text">
        <small>Featured</small>
        <h1>{{ featured.title }}</h1>
        <p>{{ [featured.genre, featured.mood, featured.model].filter(Boolean).join(' · ') }}</p>
        <div class="actions">
          <button class="primary" @click="playSongs([featured.id, ...songs.filter((s) => s.id !== featured!.id).map((s) => s.id)])"><Icon name="play" /> Play</button>
          <button class="ghost" @click="playAll(true)"><Icon name="shuffle" /> Shuffle all</button>
          <button class="ghost" @click="feature"><Icon name="dice" /> Another</button>
        </div>
        <p class="stats">{{ countOf(totals.songs, 'song') }} · {{ countOf(Math.round(totals.time / 60), 'minute') }} of music · {{ countOf(totals.favs, 'favourite') }}</p>
      </div>
    </section>
    <h1 v-else class="heading">{{ titles[collection] }}</h1>

    <div class="tools">
      <label class="search">
        <Icon name="search" />
        <input ref="input" v-model="query" placeholder="Search titles, lyrics, genres … try  bpm:>100  key:Am  is:fav" />
        <button v-if="query" class="icon-btn" @click="query = ''"><Icon name="close" :size="16" /></button>
      </label>
      <select v-if="collection === 'all' || collection === 'favorites'" v-model="settings.sort" title="Sort">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="title">Title</option>
        <option value="length">Length</option>
        <option value="bpm">Tempo</option>
        <option value="loudness">Loudness</option>
        <option value="plays">Most played</option>
        <option value="recent">Recently played</option>
      </select>
      <div class="views">
        <button class="icon-btn" :class="{ on: settings.view === 'grid' }" title="Grid" @click="settings.view = 'grid'"><Icon name="grid" /></button>
        <button class="icon-btn" :class="{ on: settings.view === 'list' }" title="List" @click="settings.view = 'list'"><Icon name="list" /></button>
      </div>
      <button class="ghost" :disabled="!songs.length" @click="playAll()"><Icon name="play" :size="16" /> Play {{ songs.length }}</button>
      <button v-if="filtered" class="ghost reset" title="Clear the search and every filter" @click="resetFilters"><Icon name="close" :size="16" /> Reset filters</button>
    </div>

    <div v-if="filtered" class="active">
      <span class="label">Filtered</span>
      <button v-if="query.trim()" class="chip on" title="Clear the search" @click="query = ''">“{{ query.trim() }}” <Icon name="close" :size="12" /></button>
      <button v-for="chip in chips" :key="chip" class="chip on" title="Remove this filter" @click="chips.splice(chips.indexOf(chip), 1)">
        {{ chipLabel(chip) }} <Icon name="close" :size="12" />
      </button>
      <small>{{ songs.length }} of {{ countOf(base.length, 'song') }}</small>
    </div>

    <div class="facets">
      <div v-for="facet in facets" :key="facet.key" class="facet">
        <span class="label">{{ facet.label }}</span>
        <button v-for="[value, count] in facet.values" :key="value" class="chip" :class="{ on: chips.includes(chipValue(facet.key, value)) }" @click="toggleChip(facet.key, value)">
          {{ value }} <small>{{ count }}</small>
        </button>
      </div>
    </div>

    <p v-if="!songs.length" class="empty">
      {{ library.length ? 'No song matches - try fewer words or filters.' : 'No Plenio songs in this folder yet. Export one with Export Release, or start the player with --folder.' }}
      <button v-if="library.length && filtered" class="ghost reset-empty" @click="resetFilters">Reset filters</button>
    </p>
    <TransitionGroup tag="div" :class="settings.view === 'grid' ? 'grid' : 'rows'" name="cards">
      <SongCard
        v-for="(song, i) in shown"
        :key="song.id"
        :song="song"
        :index="i"
        :list="settings.view === 'list'"
        :snippet="lyricsSnippet(song, terms)"
        :style="{ animationDelay: `${Math.min(i, 24) * 25}ms` }"
        @play="play(song)"
        @menu="menu = { song, x: $event.clientX, y: $event.clientY }"
      />
    </TransitionGroup>
    <button v-if="songs.length > shown.length" class="ghost more" @click="limit += 240">Show {{ Math.min(240, songs.length - shown.length) }} more</button>
    <p class="foot">{{ songs.length }} of {{ countOf(base.length, 'song') }} · {{ formatTime(songs.reduce((t, s) => t + s.seconds, 0)) }}</p>
    <SongMenu v-if="menu" :song="menu.song" :x="menu.x" :y="menu.y" @close="menu = null" />
  </div>
</template>

<style scoped>
.library {
  padding: 26px 34px 40px;
}
.hero {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 30px;
  align-items: center;
  padding: 26px;
  border-radius: 26px;
  background: radial-gradient(circle at 15% 20%, color-mix(in srgb, var(--accent) 35%, transparent), transparent 60%), linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01));
  border: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 26px;
  overflow: hidden;
}
.hero-art {
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  border-radius: 16px;
}
.hero small {
  font: 700 11px var(--font);
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--accent);
}
.hero h1 {
  font: 800 clamp(28px, 3.6vw, 52px) / 1.05 var(--font);
  margin: 8px 0;
  letter-spacing: -0.6px;
}
.hero p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 18px;
}
.stats {
  font-size: 12px;
  color: var(--muted) !important;
  margin: 16px 0 0 !important;
}
.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.heading {
  font: 800 34px var(--font);
  margin: 6px 0 20px;
}
.tools {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.search {
  flex: 1;
  min-width: 260px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 42px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--muted);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}
.search input {
  flex: 1;
  background: none;
  border: 0;
  outline: none;
  color: #fff;
  font: 14px var(--font);
}
select {
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0 10px;
  font: 13px var(--font);
}
.views {
  display: flex;
  gap: 2px;
}
.facets {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}
.facet {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.facet .label {
  width: 96px;
  font: 600 11px var(--font);
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.chip small {
  opacity: 0.55;
  margin-left: 2px;
}
.active {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin: -4px 0 12px;
}
.active .label {
  width: 96px;
  font: 600 11px var(--font);
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.active small {
  color: var(--muted);
  font-size: 12px;
  margin-left: 4px;
}
.reset {
  border-color: color-mix(in srgb, var(--accent) 60%, transparent);
}
.reset-empty {
  margin: 14px auto 0;
  display: flex;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 16px;
}
.rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.empty {
  color: var(--muted);
  padding: 40px 0;
  text-align: center;
}
.more {
  margin: 24px auto 0;
  display: flex;
}
.foot {
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  margin-top: 24px;
}
.cards-move {
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
@media (max-width: 760px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
