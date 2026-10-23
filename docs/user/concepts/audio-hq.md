# Audio HQ

**Audio HQ** is three refinement stages that run on every take **before the EQ**, inside the **Plenio · Master** block:

```
render ─► Plenio · Master [ Stems (switch: off) ─► HQ 1 ─► HQ 2 ─► HQ 3 (bypassed) ─► EQ ─► Loudness ] ─► Export
```

| Stage | What it does | In the templates |
|---|---|---|
| [HQ 1 · Stereo Cleanup](../../../web/docs/PlenioHQStereoCleanup.md) | cleans the *side* signal (the stereo difference) above 2 kHz - the unsteady shimmer AI renders leave at the edge of the stereo image - and adds a little harmonic warmth; the middle (voice, kick, snare, bass) is not filtered | **on** |
| [HQ 2 · Regenerate Highs](../../../web/docs/PlenioHQRegenerateHighs.md) | *erase and regenerate*: the UniverSR model (229 MB) generates new highs from the song without its top octaves; above 8.2 kHz - in every preset - they replace most of the original's, at the original's level | with **HQ mastering** on (on by default) |
| [HQ 3 · De-Reverb](../../../web/docs/PlenioHQDeReverb.md) | takes out the short metallic room after syllables and hits and smooths the phase above 2 kHz - but it also lowers the highs by 3-4 dB | bypassed (experimental) |

All three keep the song's sample rate and length and normalise nothing; Loudness & Dynamics after the EQ sets the level and the peaks. Every stage writes a report into the release record (profile, why it was chosen, settings, what changed) and a one-line summary on the node.

## HQ mastering: the switch at the top

UniverSR is what makes HQ 2 sound best - and what takes the time: it **about doubles** a song's time (measured on *1 · YuE2 · Song*, 97 s of music, RTX 5060 Ti: 280 s with it, about 130 s without). So every template has the **[HQ Mastering](../../../web/docs/PlenioHQMastering.md)** card at the top of its first group (beside it the *Cover Art* card), **on** by default (since 2026-10-24; it had been off) - click it to switch:

- **on** (*on: less AI shimmer, 2× time*) - the mastering at its highest quality: HQ 2 regenerates the highs. It can clearly reduce AI shimmer and artifacts. The UniverSR file (229 MB, `models/audio_sr`) is needed.
- **off** (*off: faster, no UniverSR*) - HQ 1, the EQ and the loudness run as always; HQ 2 passes the song unchanged and says *off* in its badge. UniverSR is **not loaded** and the file is not needed.

The switch is wired into the Master block only (in *4 · Enhance & Master* into HQ 2), so switching it after a run runs **only the mastering** again - the song stays. In App mode it is one of the first choices.

**To change a stage**, open the Master block (the icon at the top right of the node), then choose a preset, or select a stage and press **Ctrl+B** to bypass it or switch it on. In **4 · Enhance & Master** the three stages are plain nodes on the canvas (there is no Master block), and their presets are also in App mode.

## Presets and auto

Every stage has the same five choices, plus *custom* for its own fields:

| Preset | For | In short |
|---|---|---|
| **auto - from the song's genre** | every template with a brief (the default) | picks one of the four below from the brief's genre |
| standard - pop, hip-hop, soul, world | the default sound | the proposal's values, which the owner listened to |
| gentle - classical, jazz, folk | natural rooms and delicate highs | a little less side cleanup and warmth, 80 % new highs, a lighter de-reverb |
| strong - rock, metal, punk | dense, distorted highs | more side cleanup and warmth, 95 % new highs, a stronger de-reverb |
| wide - electronic, dance, ambient | intended stereo width | keeps more of the side, the new highs follow the original's level more closely |

**HQ 2 always regenerates from 8.2 kHz with UniverSR**, the setting the owner listened to: the presets change only how much of the new highs is used and how closely they follow the original's level. (Until 2026-10-22 *gentle* and *wide* started at 12.2 kHz; on the templates' default singer-songwriter song that changed too little to hear.)

**How auto chooses:** it reads the brief's *genre* for known words - rock, metal and punk words make it *strong*; electronic, techno, house, trance, drum & bass, synth, ambient and the like *wide*; classical, orchestral, piano, jazz, folk, blues, country and the like *gentle* - checking in that order, so *folk metal* is strong and *synth-pop* wide. Without such a word it takes the family of the brief's template (*metal/...* strong, *edm/...* wide, *classical/...* gentle, ...), and otherwise *standard* - so the templates' default song (*pop/singer-songwriter*) runs *standard*. Without a brief (Enhance & Master, or the node on its own) *auto* is *standard*. The summary always says which profile ran and why, for example `strong (auto: genre 'thrash metal' (metal))`.

The numbers of each profile are in the stages' help pages. **Only *standard* has been listened to**; the other profiles are reasoned starting points and are marked *provisional* in the summary until they have been listened to.

## Time and memory

HQ 1 and HQ 3 take a few seconds per minute of music on the CPU. **HQ 2 takes the time**: UniverSR runs each channel through four flow steps (two network passes each, both twice for its guidance) per 5-second chunk - on an RTX 5060 Ti about **1.5 seconds per second of music**, so a four-minute song takes about six minutes more (much longer without a GPU). It runs in bfloat16 (a quarter faster than float32, the same result within -25 dB) and needs about 3 GB of VRAM. Faster on purpose: HQ 2's *model steps* (an advanced field) - 3 steps about 1.1 s per second of music, 2 about 0.75 s - give other, somewhat quieter highs (measured: -15 dB and -6 dB from the four-step highs); fewer steps were not listened to. For quick drafts leave **HQ mastering** off; its seed is *fixed*, so with it on ComfyUI reuses HQ 2's result as long as nothing before it changed.

## Where it comes from, and what was measured

The stages follow a proposal the owner brought in (*Plenio-AudioHQ v3.0*, 2026-10-21); Plenio's code reproduces its DSP (checked to -140 dB). Three things differ on purpose:

- **HQ 2 uses UniverSR.** The proposal named a FlashSR model; in the owner's listening test UniverSR sounded better than FlashSR (2026-10-22), so Plenio uses UniverSR only (MIT code, CC BY 4.0 weights, part of Plenio since Refine) and offers no FlashSR.
- **No soft clipper.** The proposal ran `tanh` over the whole song when a peak reached 0.999 - seven of nine YuE2 takes peak at 0 dBFS, so it would have saturated almost every song. Loudness & Dynamics handles the peaks after the EQ.
- **No silent fallback.** Without its model the proposal quietly replaced HQ 2 by a DSP trick that cut the highs above 10 kHz by about 15 dB. In Plenio, HQ 2 with HQ mastering on needs the model; a missing file is an error with a download hint (off, the file is not needed).

Measured on 45-second excerpts of nine YuE2 takes (standard):

| | HQ 1 | HQ 2 (UniverSR) | HQ 3 |
|---|---|---|---|
| below 6 kHz | ±0.4 dB | unchanged | -1 to -3 dB above 1 kHz |
| 6-10 kHz | -0.4 dB | -1 to -3 dB | -3 to -4 dB |
| 10-16 kHz | -0.4 dB | -3 to -8 dB | -3 to -4 dB |
| side above 10.5 kHz | -10 to -13 dB (narrower) | -4 to -13 dB (UniverSR makes both channels alike) | ±1 dB |
| attacks | unchanged | 0 to -1.5 dB | -1.5 to -4 dB, like the tails |

Together, HQ 1 and HQ 2 make the top octave clearly narrower (side -8 to -19 dB above 10.5 kHz). The owner's verdict: HQ 1 *very good, artefacts well removed without hurting the highs*; HQ 2 *very good*, with UniverSR better still; HQ 3 *rather dull*. The listening material and the numbers are in the [test report](../../test-reports/2026-10-21-audio-hq.md).

## Refine and Audio HQ

**Refine (48 kHz)**, which until 2026-10-21 ran in *3 · MiniMax · Song* and sat bypassed in the other templates, is in no template any more - all audio work after the render lives in the Master block now, and HQ 2 regenerates the highs. Refine stays in the node library for a plain 48 kHz conversion; see [Refine (48 kHz)](refine.md).
