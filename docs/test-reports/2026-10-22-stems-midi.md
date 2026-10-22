# Stems for a DAW: the bass and the vocals as MIDI, and a cleaner vocal (2026-10-22)

A user who works hybrid - Plenio's stems and MIDI in a DAW - asked for two things: more MIDI tracks than the
score's *Vocal*, *Instrument* and *Chords* ("bass or other lead instruments"), and a really clean vocal (the
separated one keeps artifacts). This report is what was measured before deciding.

**Material**: five YuE2 renders of the owner's library with measured lyrics times - one each of pop,
electronic, rock, hip-hop and singer-songwriter (97-323 s) - separated on GPU 1 with the shipped BS-RoFormer
4-stem checkpoint (22-65 s per song). Only aggregates are reported.

## The bass and the vocals as notes

The stem's pitch by YIN (``core.audio.pitch``, as *Sung Pitch*), 35-400 Hz for the bass, 70-1000 Hz for the
vocals; a note at every change of semitone and at every attack (a peak of the band's log-spectral flux); notes
under 70 ms left out (``core.audio.transcribe``). Measured against each render's score, warped onto the
recording by the export's measured warp:

| song | bass notes | bass time on a tone of the score's chord | vocal notes | vocal time on a chord tone |
|---|---|---|---|---|
| pop | 95 | 95 % | 529 | 67 % |
| electronic | 465 | 100 % | 715 | 52 % |
| rock | 398 | 99 % | 576 | 51 % |
| hip-hop | 154 | 93 % | 368 | 54 % |
| singer-songwriter | 159 | 99 % | 121 | 77 % |

By chance a note would lie on a chord tone about 25-35 % of its time. The bass pitches are right; a melody
has passing tones, so the vocal's share is lower by nature. The starts were also compared with the score's
eighth-note grid: in the rock song 75 % of the bass starts lie within 50 ms of it (38 % by chance), in the
others close to chance - the renders drift against their score, so the grid is no measure of the transcription;
the notes are therefore written where the stem plays them, not quantised. The first version without attacks
merged repeated notes (20 notes in the singer-songwriter song, median 2.1 s); with the attacks they are
notes of their own. About 2 s per stem for a three-minute song.

The drums and the *other* stem are no material for this: *other* plays several notes at once (guitars, keys,
pads), and a one-voice tracker would invent a line. A polyphonic transcription needs a model of its own.

**Shipped**: a saved *bass* or *vocals* strip is also written as `<strip>.mid` next to its FLAC, at the song's
tempo (experimental).

## A cleaner vocal

YuE2 renders one mixed track (ComfyUI's YuE2 is a latent diffusion model of the whole song): there is no vocal
track of its own to export, so the vocal is always separated.

- **A second pass of the separator over the vocal stem** changes it by -46 dB - nothing. Not shipped.
- **Muting the vocal stem between the sung lyrics lines** (the export knows them): there the stem is 5-10 dB
  below the singing, 3-17 % of its energy - but what it holds there is as pitched as the singing (79-94 % of the
  loud 10 ms frames voiced, inside the lines 81-89 %): ad-libs, backing vocals, held words. A gate would cut
  them. Not shipped.
- **A Wiener post-filter** against the rest of the mix (gain |V|² / (|V|² + β |R|²)) takes 13-27 dB-quiet
  material out of the stem (β 1 and 3). Whether that is cleaner or only thinner is a listening question:
  listening files of three songs (as separated, β 1, β 3) were made for the owner; not shipped before the
  verdict.
- **A separation model made for vocals alone** is what would help most; it needs a new download (and, for a
  Mel-Band RoFormer, its architecture vendored). Left for the owner's decision.
