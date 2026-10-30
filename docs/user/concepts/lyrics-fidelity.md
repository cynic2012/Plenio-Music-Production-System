# Lyrics fidelity: the take that sings its lyrics

A music model does not always sing what it was given. It leaves a line out, repeats one, or sings other
words - and the same lyrics, score and settings sing better in one take than in the next. In 37 sung YuE2
takes of October 2026 the median take sang 89 % of its lyrics' words as written; one in six sang
less than 75 %, and one verse was sung with 8 of its 65 words in one take and 64 of 65 in the next.

**Song Brief** and **Cover Brief** have a field for it, **lyrics fidelity** (the last one):

| Choice | What happens | Time |
|---|---|---|
| **standard** | one take, as before | the render |
| **high - best of 2 takes** | a second take with the next seed when the first sang less than **96 %** of the words; the take that sings more of the lyrics as written is kept | up to twice the render |
| **highest - best of 3 takes** | as high, and a third take when neither of the two sang **96 %** of the words | up to three times |

**Higher fidelity makes the generation take longer**: every further take is a whole render, and every take
is heard once more.

## How it works

The node **Best Take · lyrics fidelity** sits in the render section of every template with lyrics (YuE2
Song, YuE2 Cover, MiniMax Song, YuE2 DAW), after the render block - in the cover template after *Check
Vocals*. The render block holds two more takes - the take seed + 1 and + 2 - that are rendered **only when
Best Take asks for them**: never with *standard*; with *high* and *highest* a further take only while the
best take so far sang less than 96 % of its lyrics as written - a take that sings 96 % is close enough, and
the run goes on with it at once.

Each take is heard by the lyrics ASR - the same hearing Export Release uses for the subtitles, kept in its
cache - and scored like the release record's *as sung*: the share of the lyrics' words heard as written. The
take with the highest share goes on to the Master block; at a tie the earlier one. Best Take's summary and the
release record list every take's share and the one kept, for example *take 2 of 2 kept - 94 % of the lyrics
heard as written (take 1: 81 %, take 2: 94 %)*.

An instrumental, a song without sung lines, or a workflow without a brief always takes the first take. A
workflow saved before the option has no value for it and keeps *standard*.

## What it does not change

- The documents: the lyrics, the style and the score stay exactly as approved - the takes differ only by
  their seed.
- The hearing is a measurement: an unclear voice can score lower than it sings, and a word the ASR mishears
  counts as not sung. What the kept take sings is one click away in the Plenio Player (*As sung*).
- The *take seed* shown is the first take's; the kept take's seed is in the report (+1 or +2).

Related: [Seeds](seeds.md), [Tags, variables and lyrics subtitles](tags-and-subtitles.md), [Plenio
Player](player.md) (the lyrics as written and as sung).
