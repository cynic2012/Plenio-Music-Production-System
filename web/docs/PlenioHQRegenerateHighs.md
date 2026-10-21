# HQ 2 · Regenerate Highs

The second Audio HQ stage, before the EQ: **erase and regenerate**. A super-resolution model from **Load Audio Model** (UniverSR in the templates, 229 MB) generates new highs, and above the crossover they replace a share of the song's own:

1. the song is converted to the model's input condition - the highest one whose edge lies at or below the crossover (UniverSR: 4, 6, 8 or 12 kHz; at the standard crossover of 8.2 kHz the 16 kHz condition, so everything above 8 kHz is gone);
2. the model generates a 48 kHz song from it, in overlapping chunks (seeded: **seed**, *fixed* after each run, so the same seed gives the same highs and ComfyUI reuses the result when nothing before it changed);
3. above **from_hz** (zero-phase, complementary crossover) the new highs follow the original's level - its 40 ms envelope times **level_match** - and make up **new_share** of the highs; the rest stays the original's. Below the crossover the song stays exactly as it was.

Same rate and length as the input (a 44.1 kHz song stays 44.1 kHz), no normalisation.

**preset** - *auto* picks the profile from the connected brief's genre (*standard* without a brief), or choose one:

| profile | for | new highs from | share | level match |
|---|---|---|---|---|
| *standard* | pop, hip-hop, soul, world | 8.2 kHz | 85 % | 0.90 |
| *gentle* | acoustic, classical, jazz, folk | 12.2 kHz | 70 % | 0.90 |
| *strong* | rock, metal, punk | 8.2 kHz | 95 % | 0.90 |
| *wide* | electronic, dance, ambient | 12.2 kHz | 85 % | 0.95 |

*custom* shows the three fields. *standard* is the proposal's setting, accepted in the owner's listening test with UniverSR (2026-10-22: better than with the FlashSR model the proposal named, which Plenio does not offer); the other profiles are **provisional** until they have been listened to.

**Time:** UniverSR runs the song channel by channel with four steps per chunk: on a 16 GB RTX GPU about 2.7 s per second of music (a four-minute song: about eleven minutes); much longer on the CPU.

**What it changes, measured (2026-10-21, YuE2 takes, standard):** the highs above 8.2 kHz are new (their similarity to the original's is about 0.3), 1-3 dB quieter between 6 and 10 kHz and 3-7 dB between 10 and 16 kHz, with more air above 16 kHz; UniverSR generates both channels alike, so the highs get narrower (side -4 to -13 dB above 10.5 kHz, more with HQ 1 before it).

**model** - Load Audio Model (super-resolution). There is no fallback: without a model the node does not run (R7). **brief** (optional) - for *auto*, as in HQ 1.

In the templates the node and its model loader are inside the **Plenio · Master** block; the user guide [Audio HQ](../../docs/user/concepts/audio-hq.md) covers the three stages.
