// Tutorial 4 · Enhance & Master: finish a recording you already have - no music model. The sections in one
// row (the HQ Mastering card on here, the Stems block under Load Audio), part 1 masters an unmastered take
// with the template's defaults (Audio HQ with UniverSR, a warm tone match, -14 LUFS) and reads HQ 2's report,
// the curve, the measured loudness and the files; part 2 edits the match's bands by hand, picks another
// loudness target and runs again. The source is $PLENIO_TUTORIAL_AUDIO (an unmastered take shows the most),
// else the repository's sample song.

import path from 'node:path'
import { afterRun, openTemplate, sectionTour, switchCards } from './lib/scenes.mjs'
import { FOOT } from './lib/studio.mjs'

export const meta = {
  name: 'Plenio tutorial 4 - Enhance & Master',
  template: '4 · Enhance & Master',
}

const SAMPLE = ['assets', 'sound-samples', 'Example Album - A Feeling With No Address.mp3']
const SOURCE = 'Source', STEMS = 'Stems (optional)', HQ1 = 'PlenioHQStereoCleanup', HQ2 = 'PlenioHQRegenerateHighs'
const HQ3 = 'HQ 3 · De-Reverb (optional)', EQ = 'PlenioEQ', LOUD = 'PlenioLoudness', PREVIEW = 'Preview (mastered)', EXPORT = 'PlenioExportRelease'
const HQ = '2 · AUDIO HQ (before the EQ)'
const GROUPS = { [HQ1]: HQ, [HQ2]: HQ, [EQ]: '3 · MASTER', [LOUD]: '3 · MASTER', [PREVIEW]: '4 · FINISH', [EXPORT]: '4 · FINISH' }
const STAGES = {
  [HQ1]: 'HQ 1 calms the stereo shimmer in the highs.',
  [HQ2]: 'HQ 2: UniverSR generates new highs above 8.2 kHz.',
  [EQ]: 'EQ measures the song and applies the tone match.',
  [LOUD]: 'Loudness & Dynamics brings it to the target and measures the result.',
  [EXPORT]: 'Export writes the files.',
}

// the screen box of a node's summary (the report under it after a run)
const summaryBox = (s, node) => s.widgetBox(node, 'plenio_summary')

export default async function enhance(s, { project }) {
  const page = s.page
  const source = process.env.PLENIO_TUTORIAL_AUDIO || path.join(project, ...SAMPLE)
  s.card('title', {
    kicker: 'Plenio tutorial',
    title: '<span class="num">4 ·</span> Enhance &amp; Master',
    subtitle: 'Finish any recording - Audio HQ, tone, loudness and a release export, without a music model',
    foot: FOOT,
  }, 5)

  // --- open the template -------------------------------------------------------------------------
  s.chapter('Getting started')
  await s.wait(600)
  await openTemplate(s, { name: '4 · Enhance & Master', alt: 'Enhance', type: 'PlenioLoudness', what: '4 · Enhance & Master finishes a recording you already have.' })

  // --- the tour -----------------------------------------------------------------------------------
  await sectionTour(s, [
    ['1 · SOURCE', 'SOURCE - the HQ Mastering card at the top, the recording, and Stems under it: off until you rebalance a mix.'],
    [HQ, 'AUDIO HQ - before the EQ: HQ 1 calms the stereo shimmer, HQ 2 regenerates the highs, HQ 3 dries a short room - optional.'],
    ['3 · MASTER', 'MASTER - an EQ for the tone, then Loudness & Dynamics for the level.'],
    ['4 · FINISH', 'FINISH - the preview, and Export Release with tags and the original kept.'],
  ], { intro: 'Four numbered sections, from left to right - every stage of the song templates’ Master block, as nodes you reach directly.' })
  await switchCards(s, { cover: false, hqOn: true })

  // --- part 1: master a take ----------------------------------------------------------------------
  s.card('chapter', {
    kicker: 'Part', part: '1', title: 'Master a take',
    subtitle: 'The defaults: Audio HQ, a warm tone match and streaming loudness',
    steps: ['Load', 'Audio HQ', 'EQ', 'Loudness', 'Run', 'Listen', 'Files'],
  }, 4)
  s.chapter('Part 1 · Master a take')
  await s.flyNodes([SOURCE, STEMS], 1200, 0.85)
  s.caption('Load the recording: “choose file to upload” in Source.')
  const upload = await s.widgetBox(SOURCE, 'upload')
  await s.spotlight(upload, { ms: 1800 })
  await s.wait(900)
  const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 15000 }), s.click(upload, { pause: 400 })])
  await chooser.setFiles(source)
  const stem = path.basename(source, path.extname(source)).slice(0, 18)
  await page.waitForFunction(([key, name]) => {
    const w = window.__tut.node(key).widgets.find((x) => x.name === 'audio')
    return w && String(w.value).includes(name)
  }, [SOURCE, stem], { timeout: 60000 })
  await s.wait(1500)
  s.caption('Our example: a YuE2 take, straight from the model - not mastered yet.')
  await s.wait(3600)
  const stems = 'Under it, Stems: select it and press Ctrl+B to rebalance a finished mix - vocals, drums, bass and other; the mixer is inside the block.'
  s.caption(stems)
  await s.spotlight(s.nodeBox(STEMS), { ms: 3000, pad: 4 })
  await s.callout(s.nodeBox(STEMS), 'off · Ctrl+B', { ms: 3000 })
  await s.read(stems, 7000)

  await s.flyGroups([HQ], 1200, 0.9)
  s.caption('Audio HQ: there is no brief here, so the presets say what they are - standard, or gentle, strong or wide for your music.')
  await s.showCombo(HQ1, 'preset', { read: 2600, browse: 5 })
  await s.read('Audio HQ: there is no brief here, so the presets say what they are - standard, or gentle, strong or wide for your music.', 2800)
  const hq2 = 'HQ 2 runs because HQ Mastering is on: the cure for a dull, band-limited file - an old MP3, a take with a soft top end.'
  s.caption(hq2)
  await s.flyNodes([HQ2], 1000, 0.9)
  await s.spotlight(s.nodeBox(HQ2), { ms: 2800, pad: 4 })
  await s.read(hq2, 6000)
  const hq3 = 'HQ 3 is bypassed: it dries a short metallic room, but also dulls the highs - select it and press Ctrl+B to try it.'
  s.caption(hq3)
  await s.flyNodes([HQ3], 1000, 0.9)
  await s.read(hq3, 5600)

  await s.flyNodes([EQ], 1200, 0.94)
  s.caption('EQ: “match preset”, Warm - Plenio measures the song and proposes a few gentle bands.')
  await s.showCombo(EQ, 'mode', { read: 2400, browse: 4 })
  await s.wait(600)
  s.caption('The curve under the node shows them after the run - over the song’s own spectrum.')
  await s.spotlight(page.locator('.plenio-eq-plot').first(), { ms: 2400, pad: 4 })
  await s.wait(3800)

  await s.flyNodes([LOUD], 1100, 0.9)
  s.caption('Loudness & Dynamics: streaming, -14 LUFS with a true peak of at most -1 dBTP.')
  await s.showCombo(LOUD, 'target', { read: 2600, browse: 5 })
  await s.wait(400)
  s.caption('compression: Balanced - gentle glue. Or off, for the limiter alone.')
  await s.showCombo(LOUD, 'compression', { read: 2200, browse: 4 })
  await s.wait(400)

  s.caption('Press Run.')
  await s.resetRunState()
  await s.run()
  await s.follow({ stages: STAGES, groups: GROUPS })

  await s.flyNodes([HQ2], 1100, 0.9)
  s.caption('HQ 2’s report: the profile, UniverSR from 8 kHz, and how the highs changed.')
  const hqReport = await summaryBox(s, HQ2).catch(() => null)
  if (hqReport) await s.spotlight(hqReport, { ms: 3200, pad: 4 })
  await s.wait(5200)
  await s.flyNodes([EQ], 1200, 0.94)
  s.caption('The match: gentle bands towards a warm tilt - the curve over the spectrum of the take.')
  await s.spotlight(page.locator('.plenio-eq-plot').first(), { ms: 3000, pad: 4 })
  await s.wait(5200)
  await s.flyNodes([LOUD], 1100, 0.9)
  s.caption('Measured, not estimated: the loudness and the true peak the song has now.')
  const report = await summaryBox(s, LOUD).catch(() => null)
  if (report) await s.spotlight(report, { ms: 3000, pad: 4 })
  await s.wait(5600)

  await afterRun(s, 'Listen in the preview.', { group: '4 · FINISH', preview: PREVIEW })
  s.caption('Export: FLAC and MP3 with the source’s tags, the unmastered source as (original), a release record - the FLAC carries it too - and subtitles of the words it heard. A recording has no score, so no sheet music.')
  await s.flyNodes([EXPORT], 1000, 0.9)
  const files = await summaryBox(s, EXPORT).catch(() => null)
  if (files) await s.spotlight(files, { ms: 3000, pad: 4 })
  await s.read('Export: FLAC and MP3 with the source’s tags, the unmastered source as (original), a release record - the FLAC carries it too - and subtitles of the words it heard. A recording has no score, so no sheet music.', 6000)

  // --- part 2: your own sound ---------------------------------------------------------------------
  s.card('chapter', {
    kicker: 'Part', part: '2', title: 'Your own sound',
    subtitle: 'Edit the match by hand, pick another loudness target, run again',
    steps: ['Edit the bands', 'Target', 'Run', 'Compare'],
  }, 4)
  s.chapter('Part 2 · Your own sound')
  await s.flyNodes([EQ], 1200, 0.94)
  const edit = page.locator('.plenio-eq-mode button', { hasText: 'Edit these bands' }).first()
  if (await edit.count()) {
    s.caption('“Edit these bands” copies the proposal into manual bands - now they are yours.')
    await s.click(edit, { pause: 500 })
    await s.wait(2600)
  }
  const handles = page.locator('.plenio-eq-plot .handle')
  if (await handles.count()) {
    // the highest band: a little more air
    const boxes = await handles.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))
    const top = boxes.reduce((a, b) => (b.x > a.x ? b : a))
    s.caption('Drag a handle: frequency and gain. The wheel changes its width; a double-click adds a band.')
    const from = { x: top.x + top.width / 2, y: top.y + top.height / 2 }
    await s.pulse({ x: from.x - 10, y: from.y - 10, width: 20, height: 20 }, { times: 1 })
    await s.drag(from, { x: from.x - 30, y: from.y - 28 }, { ms: 1400 })
    await s.wait(3000)
  }
  s.caption('The presets menu holds ready-made curves - for example for YuE2’s high end.')
  await s.openSelect(page.locator('.plenio-eq-tools select').first(), { browse: 5, read: 2000 })
  await s.wait(1200)

  await s.flyNodes([LOUD], 1100, 0.9)
  s.caption('target: Apple Music and podcasts - a little quieter, -16 LUFS.')
  await s.chooseCombo(LOUD, 'target', 'Apple Music', { read: 2400, browse: 4 })
  await s.wait(1600)

  s.caption('Run again.')
  await s.resetRunState()
  await s.run()
  await s.follow({ stages: STAGES, groups: GROUPS })
  await s.flyNodes([LOUD], 1100, 0.9)
  s.caption('-16 LUFS, measured. When a target would need more limiting than the style allows, the node stops short and says so.')
  const report2 = await summaryBox(s, LOUD).catch(() => null)
  if (report2) await s.spotlight(report2, { ms: 3000, pad: 4 })
  await s.wait(6400)
  await afterRun(s, 'The new master - and the original stays next to it for comparison.', { group: '4 · FINISH', preview: PREVIEW })

  s.card('end', {
    title: 'Next: 5 · YuE2 · DAW',
    lines: ['Install: ComfyUI Manager → <b>Plenio Music Production System</b>', 'Guides and source: <b>github.com/jplenio/Plenio-Music-Production-System</b>'],
  }, 5)
}
