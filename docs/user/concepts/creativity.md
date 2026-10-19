# Creativity

One slider on **Song Brief** and **Cover Brief**: **0 steady ... 50 the reference ... 100 experimental**.
It makes a song simpler and more predictable, or bolder and more surprising - in the writing and, with YuE2,
in how freely the score is planned and performed.

**50 is exactly how Plenio worked before the slider existed.** A workflow saved earlier has no value for it
and keeps 50; so does a song continued from an older release record. Nothing changes until you move it.

## What it changes

| | 0-19 steady | 20-39 restrained | 40-60 balanced | 61-80 varied | 81-100 experimental |
|---|---|---|---|---|---|
| **Lyrics** | plain everyday words, short regular lines, simple rhymes; the chorus repeats word for word | familiar images, regular lines, a repeated chorus | as before | fresh, concrete images; line lengths and rhythm differ between sections; the hook stays, its last repeat may change a few words | an unexpected angle and imagery, inventive rhymes; may add one contrasting section (a bridge, or a break before the last chorus) |
| **Style** (YuE2) | the genre's usual instruments, one steady groove, a simple production | the genre's usual sound | as before | the same short line, more specific: named instruments and how they are played, a production colour, a word or two for contrast and movement | as varied, plus one unexpected but fitting colour - an unusual instrument, a touch of a neighbouring genre, an uncommon rhythm feel |
| **Caption** (MiniMax) | one steady groove, the same instruments throughout | a conventional arrangement | as before | the *Arrangement* part tells an arc of contrasts: an intimate start, a build, a full high point, a contrasting bridge or a breakdown, instruments answering the voice | as varied, plus one surprising turn: a key lift, a change of rhythm feel or an unusual solo |
| **Writer's temperature** (first draft) | 0.6 ... | | **0.8** | | ... 1.0 |
| **Creative mode's plan** (temperature) | 0.55 ... | | **0.7** | | ... 0.9 |

And YuE2's sampling - the plan (the score: notes, chords, rhythms) and the take (the performance: voice,
instruments, sound) - moves smoothly with the slider:

| YuE2 | 0 | 25 | **50** | 75 | 100 |
|---|---|---|---|---|---|
| plan: temperature / top-p / top-k | 0.55 / 0.85 / 20 | 0.625 / 0.875 / 25 | **0.7 / 0.9 / 30** | 0.81 / 0.925 / 40 | 0.92 / 0.95 / 50 |
| take: temperature / top-p / top-k | 0.9 / 0.92 / 60 | 0.95 / 0.935 / 80 | **1.0 / 0.95 / 100** | 1.05 / 0.96 / 125 | 1.1 / 0.97 / 150 |

The values at 50 are YuE2's own defaults. The ends stay moderate on purpose: no study shows where quality drops,
and the developers of YuE2 warn that other sampling values may change it. The repetition penalties are never
changed - music lives from repetition - nor is MiniMax Music 3's own sampling.

## Why the YuE2 style gets more specific, not longer

YuE2 reads its style as a short list of descriptors, and longer style prose was **sung** by it in tests. So a
more varied style stays one line of about 40 words and swaps generic words for exact ones:

- reference: *English, warm piano pop, expressive female voice, acoustic piano, rounded bass and light drums,
  lyrical memorable melody, unhurried phrasing, 88 BPM*
- varied: *English, indie folk-pop, breathy female alto, fingerpicked nylon guitar, muted trumpet, pulsing
  upright bass, brushed drums, sparse-to-full contrast, dynamic build-ups, instrumental fills between phrases,
  layered backing vocals, 92 BPM*

## Good to know

- **More surprises, more misses.** Above 60, listen to a few takes: the take seed 🎲 renders a new one every run,
  and in a cover *YuE2 Takes* renders several at once.
- **Song sections with a plan** - quiet verses and a big final chorus, instruments answering the voice, a
  breakdown, a key change - are the [creative modes](creative-modes.md) (*arrangement* on the brief). The slider
  does not switch them on; with one on, it sets how freely the writer plans.
- **When a finished score reaches YuE2** - a creative mode's arrangement, a score you edited, the DAW template -
  YuE2 does not plan any more, so only the take's sampling follows the slider.
- **A workflow saved before the slider:** the slider appears on its brief and changes the writing. Its YuE2
  blocks keep their fixed values; for the full effect, start from the current template and copy your brief's
  fields.
- **Other ways to more variety:** another draft seed, *thinking* on Write Song with a model that reasons, a larger
  writer model, a key or meter in the brief (*D dorian*, *6/8*).
- **Tags:** `{creativity}` puts the value into a tag or a file name (Export Release).

The research and the decisions behind the values: [docs/design/creativity.md](../../design/creativity.md).
