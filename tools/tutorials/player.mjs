// Tutorial 8 · Plenio Player: the songs made with Plenio in the browser, without ComfyUI - the library and
// its search, playing a song, a song's page (lyrics, notation, details, takes), Now playing in its four
// views, the visuals and their modes, playlists, the queue with the sleep timer, A/B and speed, the keys.
//
// Recorded against a running player (`python plenio_player.py --folder <songs> --no-browser`, its state in
// a fresh PLENIO_PLAYER_STATE folder): node tools/tutorials/record.mjs player --url http://127.0.0.1:8765

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FOOT } from './lib/studio.mjs'
import { parseNarration } from './lib/voice.mjs'

export const meta = {
  name: 'Plenio tutorial 8 - Plenio Player',
  // not ComfyUI: record.mjs opens --url as it is
  page: true,
}

// the music under the voice: the player's own volume (the edit ducks it a little more under the voice)
const BED = 0.3, LOUD = 0.7

// The music plays all through the video, and a hold in the edit would cut it: every caption waits as long
// as its narration line will take to speak (about 68 ms a character, as the voice reads).
const NARRATION = parseNarration(path.join(path.dirname(fileURLToPath(import.meta.url)), 'narration', 'player.txt')).filter((l) => !l.card)
const norm = (t) => t.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim()
function spoken(caption) {
  const line = NARRATION.find((l) => norm(caption).startsWith(norm(l.cue)))
  return line ? line.text.replace(/\[pause:[\d.]+s\]/g, '') : caption
}
async function talk(s, text, min = 0) {
  s.caption(text)
  await s.wait(Math.max(min, 900 + spoken(text).length * 68))
}

// the song the video plays: timed lyrics, a score, sheet music and the longest of those
async function pickSong(s) {
  const library = await s.page.evaluate(() => fetch('/api/library').then((r) => r.json()))
  const songs = library.songs.filter((x) => x.has.timing && x.has.score && x.seconds > 90)
  songs.sort((a, b) => Number(b.has.original) - Number(a.has.original) || Number(b.has.pdf) - Number(a.has.pdf) || b.seconds - a.seconds)
  if (!songs.length) throw new Error('the player has no song with timed lyrics and a score')
  return songs[0]
}

async function setVolume(s, value) {
  await s.page.evaluate((v) => {
    const range = document.querySelector('.vol input[type=range]')
    if (!range) return
    range.value = String(v)
    range.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

export async function prepare(s) {
  // a fresh listener: no playlists, favourites or plays yet; the visuals match the music
  await s.page.evaluate(() =>
    fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlists: [], favorites: [], plays: {}, last_played: {}, settings: { volume: 0.3, crossfade: 3 } }),
    })
  )
  await s.page.evaluate(() => localStorage.setItem('plenio.view', 'stage'))
  await s.page.reload({ waitUntil: 'load' })
  await s.page.waitForSelector('.card', { timeout: 20000 })
  await s.wait(1200)
}

export default async function player(s) {
  const page = s.page
  const song = await pickSong(s)
  s.card('title', {
    kicker: 'Plenio tutorial',
    title: '<span class="num">8 ·</span> Plenio Player',
    subtitle: 'Your songs in the browser: lyrics, sheet music and visuals in time with the music',
    foot: FOOT,
  }, 5)

  s.chapter('The player')
  await s.rest(600)
  await talk(s, 'The Plenio Player plays the songs you made with Plenio - in the browser, without ComfyUI.')
  await talk(s, 'Start it with ComfyUI’s Python:  python plenio_player.py')
  await s.hover(page.locator('.hero h1'))
  await talk(s, 'It finds every song Export Release wrote, and never writes into their folder.')

  s.chapter('Find a song')
  await s.click(page.locator('.search input'))
  await s.type(song.title.split(/\s+/).slice(0, 2).join(' ').toLowerCase())
  await s.wait(900)
  await talk(s, 'Search looks through titles, lyrics, genres, moods and briefs.')
  await page.fill('.search input', '')
  await s.type('bpm:>100')
  await s.wait(900)
  await talk(s, 'Fields narrow it down: genre, tempo, key, model, language, favourites …')
  await page.fill('.search input', '')
  await s.wait(500)
  const chip = page.locator('.facet .chip').first()
  await s.click(chip)
  await talk(s, 'The chips filter by your most common genres, moods, models and creative modes.')
  await s.click(chip)
  await s.click(page.locator('.views .icon-btn').nth(1))
  await talk(s, 'A grid or a list, sorted by date, title, length, tempo or loudness.', 3000)
  await s.click(page.locator('.views .icon-btn').nth(0))
  await s.wait(600)

  s.chapter('Play')
  const card = page.locator('.card', { hasText: song.title }).first()
  await card.scrollIntoViewIfNeeded()
  await s.hover(card)
  await s.wait(400)
  await s.click(card.locator('.play'))
  await s.wait(1500)
  await talk(s, 'Press play on a cover, or double-click a song.')
  await s.hover(page.locator('.bar .meta .sub'))
  await talk(s, 'The bar shows the song’s section and the line sung right now.')
  const wave = page.locator('.bar .progress .wave')
  await s.hover(wave, { fx: 0.42 })
  await talk(s, 'The waveform is the seek bar: its sections, and under the mouse, the line sung there.')
  await s.click(wave, { fx: 0.18 })
  await s.rest()
  await s.wait(1200)

  s.chapter('The song’s page')
  await s.click(page.locator('.bar .meta .title'))
  await s.wait(1200)
  await talk(s, 'A click on the title opens the song’s page.')
  await talk(s, 'Its lyrics light up as they are sung - the times were measured when the song was exported.')
  const later = page.locator('.karaoke .line').nth(6)
  if (await later.count()) {
    await s.click(later)
    await talk(s, 'A click on a line plays the song from there.')
  }
  const tab = (name) => page.locator('.tabs button', { hasText: name }).first()
  if (await tab('Notation').count()) {
    await s.click(tab('Notation'))
    await s.wait(1500)
    await talk(s, 'The notation follows the music: the notes that sound light up, and a click on a note jumps there.', 6500)
  }
  await s.click(tab('Details'))
  await s.wait(800)
  await talk(s, 'The details: the brief, the model and the writer, the loudness, and the seeds - to make the take again.')
  await page.locator('.downloads').scrollIntoViewIfNeeded()
  await s.hover(page.locator('.downloads .file').first())
  await talk(s, 'Every file to download: the audio, the sheet music, the subtitles, the cover and the record.')
  for (const name of ['Takes', 'Alike']) {
    if (await tab(name).count()) {
      await s.click(tab(name))
      await s.wait(900)
      await talk(s, name === 'Takes' ? 'The song’s other takes, to compare them …' : '… and songs alike.', 2600)
    }
  }

  s.chapter('Now playing')
  await s.keys('f')
  await s.wait(1500)
  await talk(s, 'F opens Now playing. The stage: the cover, and the lyrics as they are sung.')
  const chorus = page.locator('.dock .chips .chip', { hasText: /^\s*Chorus/ }).first()
  if (await chorus.count()) {
    await s.click(chorus)
    await talk(s, 'The sections are chips: one click, and the chorus plays.')
  }
  await s.keys('2')
  await s.wait(800)
  await talk(s, 'Lyrics: large, painted syllable by syllable.')
  await s.keys('3')
  await s.wait(1200)
  await talk(s, 'Notation: the sheet scrolls along, with the lyrics at the side.', 5200)
  await s.keys('4')
  await s.rest(500)
  await talk(s, 'And the visual, full screen, with the lyrics as subtitles. The controls fade out while the mouse rests.', 8000)

  s.chapter('Visuals')
  await s.click(page.locator('.np .top .tools .icon-btn').first())
  await s.wait(700)
  await talk(s, 'The visuals’ settings.', 2400)
  await s.hover(page.locator('.vpanel .mode').nth(0))
  await talk(s, 'Match the music picks a visual for the song’s genre, mood and tempo.')
  await s.click(page.locator('.vpanel .mode').nth(1))
  await talk(s, 'Random picks from the visuals you tick. Cycle goes through them in turn, Fixed keeps one.')
  const ticked = page.locator('.vpanel .preset input').nth(6)
  await s.click(ticked)
  await talk(s, 'Tick the ones you like.', 2600)
  await s.click(ticked)
  const change = page.locator('.vpanel select').first()
  await s.hover(change)
  await change.selectOption('section')
  await talk(s, 'They change with every song, at every section, every few seconds - or when the music drops in.')
  await s.hover(page.locator('.vpanel h4', { hasText: 'This song' }))
  await talk(s, 'A song can have a visual of its own, and so can a playlist: the song’s wins, then the playlist’s, then the mode.')
  await s.click(page.locator('.vpanel header .icon-btn'))
  await s.rest(400)
  await talk(s, 'N shows the next one.', 2400)
  // no voice for a while: the music comes up
  await setVolume(s, LOUD)
  for (let i = 0; i < 7; i++) {
    await s.keys('n')
    await s.wait(2600)
  }
  await setVolume(s, BED)

  s.chapter('Playlists')
  await s.keys('Escape')
  await s.wait(800)
  await s.click(page.locator('.side h4 .icon-btn'))
  await s.type('Evening')
  await page.keyboard.press('Enter')
  await s.wait(900)
  await talk(s, 'A new playlist: plus, a name.', 2600)
  await s.click(page.locator('.pl .actions button', { hasText: 'Add songs' }))
  await s.wait(500)
  for (let i = 0; i < 4; i++) {
    await s.click(page.locator('.cand').first(), { pause: 120 })
  }
  await talk(s, 'Add songs with the search, and drag them into order.')
  const rows = page.locator('.rows li')
  if ((await rows.count()) >= 3) {
    const from = await s.boxOf(rows.nth(2))
    const to = await s.boxOf(rows.nth(0))
    await s.drag({ x: from.x + 300, y: from.y + from.height / 2 }, { x: to.x + 300, y: to.y + 6 })
  }
  const visual = page.locator('.pl .visual select')
  await s.hover(visual)
  await visual.selectOption('fire')
  await talk(s, 'A playlist can have its own colour and its own visual.')
  await s.click(page.locator('.side a.link', { hasText: 'Playlists' }))
  await s.wait(900)
  await talk(s, 'Next to yours: favourites, most played, recently played and never played.')

  s.chapter('The queue')
  await s.keys('q')
  await s.wait(800)
  await talk(s, 'The queue: what comes next. Reorder it, or save it as a playlist.')
  await s.click(page.locator('.queue .sleep .chip', { hasText: '30' }))
  await talk(s, 'Crossfades between songs, and a sleep timer that fades the music out.')
  await s.click(page.locator('.queue .sleep .chip', { hasText: 'off' }))
  await s.keys('q')
  await s.click(page.locator('.side a.link', { hasText: 'Songs' }))
  await s.wait(900)
  const other = page.locator('.card').nth(2)
  await s.hover(other)
  await s.click(other, { button: 'right' })
  await talk(s, 'A right-click on a song: play it next, add it to a playlist - or start a radio of songs alike.')
  // a click beside the menu closes it
  await s.click({ x: 1180, y: 150, width: 0, height: 0 })
  await s.wait(500)

  s.chapter('Compare and keys')
  const ab = page.locator('.bar .right .chip', { hasText: 'master' })
  if (await ab.count()) {
    await s.click(ab)
    await talk(s, 'A/B: the unmastered take, at the same moment, without a gap.')
    await s.click(page.locator('.bar .right .chip', { hasText: 'original' }))
  }
  const speed = page.locator('.bar .right .chip', { hasText: '×' })
  await s.click(speed)
  await talk(s, 'Speed, from three quarters to one and a quarter - the pitch stays.')
  for (let i = 0; i < 4; i++) await s.click(speed, { pause: 80 })
  await s.keys('?', { labels: ['?'] })
  await s.wait(700)
  await talk(s, 'Every key is listed under the question mark.', 3600)
  await s.keys('Escape')
  await s.rest()
  await talk(s, 'Make songs in ComfyUI - and listen to them here.', 3000)

  s.card('end', {
    title: 'Plenio Player',
    lines: ['Start: <b>python plenio_player.py</b> with ComfyUI’s Python', 'Guide and source: <b>github.com/jplenio/Plenio-Music-Production-System</b>'],
  }, 5)
}
