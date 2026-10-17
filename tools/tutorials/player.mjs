// Tutorial 8 · Plenio Player: the songs made with Plenio in the browser. It starts in ComfyUI - the Plenio
// Player button beside Run (and the one on Export Release) starts the player, a program of its own, and
// opens it - then the library and its search, playing a song, a song's page (lyrics, notation, every field
// of the brief, takes), back to the songs where the song plays, Now playing in its four views, the visuals
// and their modes, Plenio Drop and the
// lyrics' look, playlists, the queue with the sleep timer, Live Play with a song that arrives from ComfyUI,
// guests in the network (the QR code, the guests' page, a wish carried out), a song as a video, the songs
// shared as a player, A/B and speed, the keys, the settings (the version, the folders) and Open in ComfyUI.
//
// Recorded against a ComfyUI dev server whose output folder holds the songs, with PLENIO_PLAYER_STATE set to
// a fresh folder and PLENIO_GUESTS_HOST=127.0.0.1 (the player ComfyUI starts inherits both; on the loopback
// address Windows asks nothing): node tools/tutorials/record.mjs player --url <it>

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FOOT } from './lib/studio.mjs'
import { parseNarration } from './lib/voice.mjs'

export const meta = {
  name: 'Plenio tutorial 8 - Plenio Player',
}

const TEMPLATE = '1 · YuE2 · Song'
const EXPORT = 'PlenioExportRelease'
const NODE_BUTTON = '▶ Open in the Plenio Player'

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

// the song the video plays: the one named by its file name in PLENIO_PLAYER_SONG, else timed lyrics, a score,
// sheet music, other takes and the longest of those - one further down the songs (newest first), so that back
// from its page the songs' page goes to it
async function pickSong(s) {
  const library = await s.page.evaluate(() => fetch('/api/library').then((r) => r.json()))
  const named = process.env.PLENIO_PLAYER_SONG && library.songs.find((x) => x.file === process.env.PLENIO_PLAYER_SONG)
  if (named) return named
  const newest = [...library.songs].sort((a, b) => String(b.created).localeCompare(String(a.created)))
  const place = new Map(newest.map((x, i) => [x.id, i]))
  const takes = (x) => !!x.takes_key && library.songs.some((o) => o.id !== x.id && o.takes_key === x.takes_key)
  const songs = library.songs.filter((x) => x.has.timing && x.has.score && x.seconds > 90)
  const rank = (x) => [Number(x.has.original), Number(x.has.pdf), Number(takes(x)), Number(place.get(x.id) >= 40), x.seconds]
  songs.sort((a, b) => {
    const [ra, rb] = [rank(a), rank(b)]
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return rb[i] - ra[i]
    return 0
  })
  if (!songs.length) throw new Error('the player has no song with timed lyrics and a score')
  return songs[0]
}

// A song "exported" while Live Play runs: a copy of one of the library's songs under a new title, written
// into the player's folder as Export Release writes one (the record last)
function arrive(folder, record, title) {
  const stem = path.basename(record).replace(/\.plenio\.json$/, '')
  const data = JSON.parse(fs.readFileSync(record, 'utf8'))
  data.title = title
  const name = title.replace(/\s+/g, '_')
  for (const f of data.files ?? []) if (typeof f?.name === 'string' && f.name.startsWith(stem)) f.name = name + f.name.slice(stem.length)
  for (const kind of ['.flac', '.mp3', ' (lines).srt', ' (notes).srt', '.jpg', '.pdf']) {
    const from = path.join(path.dirname(record), `${stem}${kind}`)
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(folder, `${name}${kind}`))
  }
  fs.writeFileSync(path.join(folder, `${name}.plenio.json`), JSON.stringify(data))
}

async function setVolume(s, value) {
  await s.page.evaluate((v) => {
    const range = document.querySelector('.vol input[type=range]')
    if (!range) return
    range.value = String(v)
    range.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

export async function prepare(s, { project }) {
  // ComfyUI with the YuE2 Song template open: its Export Release node has the player's button
  const graph = JSON.parse(fs.readFileSync(path.join(project, 'example_workflows', `${TEMPLATE}.json`), 'utf8'))
  await s.page.evaluate(async ([g, name]) => window.app.loadGraphData(g, true, true, name), [graph, TEMPLATE])
  await s.wait(2500)
}

export default async function player(s) {
  s.card('title', {
    kicker: 'Plenio tutorial',
    title: '<span class="num">8 ·</span> Plenio Player',
    subtitle: 'Your songs in the browser: lyrics, sheet music and visuals in time with the music',
    foot: FOOT,
  }, 5)

  // --- in ComfyUI: one click ---
  s.chapter('Open the player')
  await s.rest(600)
  await talk(s, 'The Plenio Player plays the songs you made with Plenio - in the browser.')
  const button = s.page.locator('button', { hasText: 'Plenio Player' }).first()
  await s.hover(button)
  await s.spotlight(button, { ms: 2600 })
  await talk(s, 'In ComfyUI it is one click away: Plenio Player, beside Run.')
  await s.flyNodes([EXPORT], 1300, 0.9)
  await s.hover(await s.widgetBox(EXPORT, NODE_BUTTON), { fx: 0.5 })
  await talk(s, 'Export Release has a button too: it opens the song you just exported.')
  const [opened] = await Promise.all([s.context.waitForEvent('page'), s.click(button)])
  await s.switchTo(opened)
  await talk(s, 'If the player is not running yet, ComfyUI starts it, and opens it in a tab of its own.')
  await s.page.waitForSelector('.card', { timeout: 60000 })
  await s.wait(1200)
  let page = s.page
  const song = await pickSong(s)
  await s.rest(500)
  await talk(s, 'The player is a program of its own: it keeps running when ComfyUI closes. Without ComfyUI: double-click Plenio Player.bat.')
  await s.hover(page.locator('.hero h1'))
  await talk(s, 'It finds every song Export Release wrote into ComfyUI’s output folder.')

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
  // the song is further down the songs: the search brings it up
  await s.click(page.locator('.search input'))
  await s.type(song.title.split(/\s+/).slice(0, 2).join(' ').toLowerCase())
  await s.wait(700)
  // by its id: two songs can have the same title
  const card = page.locator(`.card[data-song="${song.id}"]`)
  await card.scrollIntoViewIfNeeded()
  await s.hover(card)
  await s.wait(400)
  await s.click(card.locator('.play'))
  await s.wait(1500)
  await talk(s, 'Press play on a cover. A click on the card opens the song’s page.')
  await s.click(page.locator('.search .icon-btn'))
  await s.wait(500)
  await s.hover(page.locator('.bar .meta .sub'))
  await talk(s, 'The bar shows the song’s section and the line sung right now.')
  const wave = page.locator('.bar .progress .wave')
  await s.hover(wave, { fx: 0.42 })
  await talk(s, 'The waveform is the seek bar: its sections, and under the mouse, the line sung there.')
  await s.hover(page.locator('.bar .mini'))
  await talk(s, 'The bright square on the right moves with the music - a click opens Now playing.')
  await s.click(wave, { fx: 0.18 })
  await s.rest()
  await s.wait(1200)

  s.chapter('The song’s page')
  await s.click(page.locator('.bar .song .icon-btn').first())
  await s.wait(1200)
  await talk(s, 'ⓘ beside the song opens its page, too.')
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
  await s.hover(page.locator('.details .block').first())
  await talk(s, 'The details: every field of the brief - one you left empty shows its default - the model, the writer, the loudness, and the seeds to make the take again.')
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
  await s.click(tab('Lyrics'))
  // back to the songs: the page goes to the song that plays, however far down it is, and it lights up
  await s.click(page.locator('.side a.link', { hasText: 'Songs' }))
  await page.waitForSelector('.card.now', { timeout: 10000 }).catch(() => {})
  await s.wait(700)
  const playingCard = page.locator('.card.now').first()
  if (await playingCard.count()) await s.hover(playingCard)
  await talk(s, 'Back to your songs, the page shows the one that plays - even among hundreds.')

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
  await s.click(page.locator('.np .top .tools .icon-btn').nth(1))
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

  s.chapter('Plenio Drop')
  await s.click(page.locator('.vpanel .mode', { hasText: 'Fixed' }))
  await s.wait(500)
  const fixed = page.locator('.vpanel select').first()
  await s.hover(fixed)
  await fixed.selectOption('drop-electric-lotus')
  await s.wait(1200)
  await talk(s, 'Plenio Drop: visuals like Winamp’s MilkDrop, made anew and drawn on the graphics card - sixteen of them, and one made up fresh each time.')
  const copy = page.locator('.vpanel .drop-tools .chip', { hasText: 'Edit a copy' })
  await copy.scrollIntoViewIfNeeded()
  await s.hover(copy)
  await talk(s, 'Write your own: Edit a copy saves the one that plays as a short file of numbers and formulas - save a change, and the visual changes.')
  await s.click(page.locator('.vpanel .mode', { hasText: 'Random' }))
  await s.click(page.locator('.vpanel header .icon-btn'))
  await s.rest(400)
  await s.click(page.locator('.np .top .tools .icon-btn[title^="How the lyrics look"]'))
  await s.wait(700)
  await s.click(page.locator('.lpanel .font', { hasText: 'Poster' }))
  await s.click(page.locator('.lpanel .effect', { hasText: 'Neon' }))
  await talk(s, 'How the lyrics look: a font, a colour and an effect - neon, glow, bounce, typewriter, on the beat - in the player and in videos.')
  await s.click(page.locator('.lpanel header .icon-btn'))
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
  // the songs' page is at the song that plays: the song after it
  const after = page.locator('.card.now + .card')
  const other = (await after.count()) ? after.first() : page.locator('.card').nth(2)
  await s.hover(other)
  await s.click(other, { button: 'right' })
  await talk(s, 'A right-click on a song: play it next, add it to a playlist, start a radio of songs alike - or remove it.')
  // a click beside the menu closes it
  await s.click({ x: 1180, y: 150, width: 0, height: 0 })
  await s.wait(500)

  s.chapter('Live Play')
  await s.click(page.locator('.side a.link', { hasText: 'Live Play' }))
  await s.wait(1000)
  await talk(s, 'Live Play: a playlist for a party, changed while it plays.')
  const newest = page.locator('.way', { hasText: 'With the newest songs' })
  if (await newest.count()) {
    await newest.locator('select').selectOption('10')
    await s.click(newest.locator('button'))
    await s.wait(1500)
  }
  await s.hover(page.locator('.rules'))
  await talk(s, 'Make songs in ComfyUI meanwhile: as soon as Export Release has written one, it joins - next, at the end, or anywhere.')
  const info = await page.evaluate(() => fetch('/api/info').then((r) => r.json()))
  const detail = await page.evaluate((id) => fetch(`/api/song/${id}`).then((r) => r.json()), song.id)
  if (info.folders?.[0] && detail.record_path) arrive(info.folders[0], detail.record_path, 'Midnight on the Dance Floor')
  await page.waitForFunction(() => document.body.innerText.includes('Midnight on the Dance Floor'), null, { timeout: 30000 }).catch(() => {})
  await s.wait(800)
  const fresh = page.locator('.list .row.fresh').first()
  if (await fresh.count()) await s.hover(fresh)
  await talk(s, 'There it is - marked new, playing next.')

  s.chapter('Guests in your network')
  const guests = page.locator('.guests')
  await guests.scrollIntoViewIfNeeded()
  await s.click(guests.locator('input[type=checkbox]').first())
  await page.waitForSelector('.guests .url code', { timeout: 15000 })
  await s.click(guests.locator('label', { hasText: 'change it' }).locator('input'))
  await s.wait(800)
  await talk(s, 'Guests in your network: switch it on, and everyone on the same Wi-Fi opens the live playlist on the phone - a QR code and an address with a random part.')
  await s.click(guests.locator('button', { hasText: 'Show it big' }))
  await s.wait(800)
  await talk(s, 'Show it big, for a screen the whole room sees. A new address at any time locks the old one out.')
  await s.keys('Escape')
  const guestUrl = (await page.textContent('.guests .url code')).trim()
  const phone = await s.context.newPage()
  await phone.goto(guestUrl)
  await s.switchTo(phone)
  await phone.waitForSelector('#next li', { timeout: 15000 })
  await s.wait(1000)
  await talk(s, 'On the phone: the song that plays, and what comes next …')
  const earlier = phone.locator('#next li').nth(2).locator('button[title="Earlier"]')
  if (await earlier.count()) await s.click(earlier)
  await talk(s, '… and if you allow it, guests move songs, take them out and add their favourites. The music plays on your computer.')
  await s.switchTo(page)
  await s.wait(1500)
  const log = page.locator('.log p').first()
  if (await log.count()) {
    await log.scrollIntoViewIfNeeded()
    await s.hover(log)
  }
  await talk(s, 'The playlist follows, and says what the guests did.')
  await phone.close()

  s.chapter('A song as a video')
  await s.click(page.locator('.bar .song .icon-btn').first())
  await s.wait(1200)
  await s.click(page.locator('.song-page .actions button', { hasText: 'Video' }))
  await page.waitForSelector('.dialog .shot canvas', { timeout: 30000 })
  await s.wait(1200)
  await page.selectOption('.dialog select >> nth=0', 'vertical')
  await page.fill('.dialog input[type=number] >> nth=0', '20')
  await page.fill('.dialog input[type=number] >> nth=1', '32')
  await page.selectOption('.dialog fieldset:has-text("Over the visual") select', 'karaoke')
  await s.click(page.locator('.dialog button', { hasText: 'Preview' }))
  await s.wait(1500)
  await talk(s, 'A song as a video: its visual, the lyrics as karaoke, the notes following the music - Full HD, 4K, or upright for Shorts.')
  await s.click(page.locator('.dialog button', { hasText: 'Make the video' }))
  await page.waitForSelector('.dialog .done, .dialog .error', { timeout: 300000 })
  await s.wait(600)
  await talk(s, 'Made on the graphics card, faster than the song plays: an MP4 in the player’s videos folder.')
  await s.click(page.locator('.dialog header button[title="Close"]'))
  await s.wait(500)

  s.chapter('Share as a player')
  await s.click(page.locator('.side button', { hasText: 'Share as a player' }))
  await page.waitForSelector('.dialog .list .row', { timeout: 15000 })
  const evening = page.locator('.dialog .quick .chip', { hasText: 'Evening' })
  if (await evening.count()) await s.click(evening)
  await page.selectOption('.dialog .right select', '128')
  await talk(s, 'Share your songs as a player: one HTML file with the songs as MP3 - send it, and anyone just double-clicks it.')
  await s.click(page.locator('.dialog button', { hasText: 'Make the player' }))
  await page.waitForSelector('.dialog .done, .dialog .error', { timeout: 300000 })
  const tryIt = page.locator('.dialog .done a', { hasText: 'Try it' })
  if (await tryIt.count()) {
    const [shared] = await Promise.all([s.context.waitForEvent('page'), s.click(tryIt)])
    await s.switchTo(shared)
    await shared.waitForSelector('.card', { timeout: 30000 })
    await s.wait(1200)
    await talk(s, 'It plays by itself in any browser: the lyrics, the notation, the visuals - nothing to install.')
    await s.switchTo(page)
    await shared.close()
  }
  await s.click(page.locator('.dialog header button[title="Close"]'))
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

  s.chapter('Settings')
  await s.click(page.locator('.side a.link', { hasText: 'Settings' }))
  await s.wait(1200)
  await s.hover(page.locator('.settings .version'))
  await talk(s, 'Settings starts with the version of the player that runs.')
  await talk(s, 'Everything you set is kept on this computer, by the player - not in the browser.')
  await s.hover(page.locator('.settings button', { hasText: 'Download a backup' }))
  await talk(s, 'A backup to download, and to restore here or on another computer.')
  const addFolder = page.locator('.settings button', { hasText: 'Add a folder' })
  if (await addFolder.count()) {
    await addFolder.scrollIntoViewIfNeeded()
    await s.hover(addFolder)
    await talk(s, 'Choose the folders it reads - and the other music in them plays too, with its tags and lyrics.')
  }
  const stop = page.locator('.settings button', { hasText: 'Stop the player' })
  await stop.scrollIntoViewIfNeeded()
  await s.hover(stop)
  await talk(s, 'Started from ComfyUI, the player has no window: Stop the player ends it.')

  s.chapter('Back to ComfyUI')
  await s.click(page.locator('.bar .song .icon-btn').first())
  await s.wait(1200)
  const back = page.locator('.song-page .actions button', { hasText: 'Open in ComfyUI' })
  await s.hover(back)
  await talk(s, 'And Open in ComfyUI takes the song back to work on it.')
  const [comfy] = await Promise.all([s.context.waitForEvent('page'), s.click(back)])
  await s.switchTo(comfy)
  page = s.page
  await page.waitForFunction(() => window.app?.graph?.nodes?.some((n) => String(n.type).startsWith('Plenio')), null, { timeout: 120000 })
  await s.wait(2500)
  await s.rest()
  await talk(s, 'Its workflow opens: the brief, the lyrics, the score and the settings - ready for another take.', 6000)
  await talk(s, 'Make songs in ComfyUI - and listen to them in the player.', 3000)

  s.card('end', {
    title: 'Plenio Player',
    lines: ['In ComfyUI: <b>Plenio Player</b> beside Run', 'Live Play, guests, videos, a player to share', 'Guide and source: <b>github.com/jplenio/Plenio-Music-Production-System</b>'],
  }, 5)
}
