<script setup lang="ts">
/** The player's icons: inline SVG paths (24 x 24, stroke icons), no font or download. */
const props = defineProps<{ name: string; size?: number; filled?: boolean }>()

const PATHS: Record<string, string> = {
  play: 'M7 4.5v15l12.5-7.5z',
  pause: 'M7 4h3.5v16H7zM13.5 4H17v16h-3.5z',
  next: 'M5 5l10 7-10 7zM17 5h2.5v14H17z',
  prev: 'M19 5L9 12l10 7zM4.5 5H7v14H4.5z',
  shuffle: 'M3 7h3.5c4.5 0 6.5 10 11 10H21M3 17h3.5c1.8 0 3-1.6 4.1-3.6M14 9c1-1.3 2.1-2 3.5-2H21M18 4l3 3-3 3M18 14l3 3-3 3',
  repeat: 'M4 11V9a3 3 0 013-3h12M17 3l3 3-3 3M20 13v2a3 3 0 01-3 3H5M7 21l-3-3 3-3',
  heart: 'M12 20.5s-8-4.9-8-11A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5c0 6.1-8 11-8 11z',
  plus: 'M12 5v14M5 12h14',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  search: 'M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15zM16 16l5 5',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z',
  sheet: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7M9 9h3',
  close: 'M6 6l12 12M18 6L6 18',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  collapse: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  volume: 'M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12',
  mute: 'M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6',
  queue: 'M4 6h11M4 11h11M4 16h7M17 14v7l5-3.5z',
  sparkles: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 15l.7 1.6 1.6.7-1.6.7L5 19.6l-.7-1.6-1.6-.7 1.6-.7z',
  ab: 'M3 18l3.5-12h1L11 18M4.5 14h5M14 6h4a3 3 0 010 6h-4zM14 12h4.5a3 3 0 010 6H14z',
  speed: 'M12 14l4-5M4.5 18a9 9 0 1115 0',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  back: 'M15 5l-7 7 7 7',
  playlist: 'M4 6h12M4 11h12M4 16h8M18 13v8M14 17h8',
  mic: 'M12 3a3 3 0 013 3v6a3 3 0 01-6 0V6a3 3 0 013-3zM5 11a7 7 0 0014 0M12 18v3',
  wave: 'M2 12h2M6 8v8M10 4v16M14 7v10M18 10v4M22 12h0',
  folder: 'M3 6h6l2 2h10v11H3z',
  refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
  timer: 'M12 8v5l3 2M9 2h6M12 21a8 8 0 110-16 8 8 0 010 16z',
  dice: 'M5 3h14v18H5zM9 7h.01M15 7h.01M12 12h.01M9 17h.01M15 17h.01',
  star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z',
  clock: 'M12 21a9 9 0 110-18 9 9 0 010 18zM12 7v5l3 2',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  info: 'M12 21a9 9 0 110-18 9 9 0 010 18zM12 11v6M12 7h.01',
}
const SOLID = new Set(['play', 'pause', 'next', 'prev'])
</script>

<template>
  <svg
    class="icon"
    :width="props.size ?? 20"
    :height="props.size ?? 20"
    viewBox="0 0 24 24"
    :fill="SOLID.has(props.name) || props.filled ? 'currentColor' : 'none'"
    stroke="currentColor"
    :stroke-width="SOLID.has(props.name) ? 0 : 1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="PATHS[props.name] ?? PATHS.music" />
  </svg>
</template>
