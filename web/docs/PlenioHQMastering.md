# HQ Mastering

The switch for the **highest mastering quality**, at the top of every template (**off** by default).

- **on** - *HQ 2 · Regenerate Highs* runs inside **Plenio · Master**: the UniverSR model generates new highs above 8.2 kHz. It can **clearly reduce AI shimmer and artifacts**, but the song takes **about twice as long** - about 1.5 s per second of music on an RTX 5060 Ti (a song of 1:37 took 280 s with it, about 130 s without). UniverSR (229 MB) goes into `models/audio_sr`; ComfyUI offers the download when a template opens, and the System Check lists it.
- **off** - the mastering runs without UniverSR: *HQ 1 · Stereo Cleanup*, the EQ and the loudness as always. The model is not loaded and not even needed - *HQ 2* says *off* in its badge, and the song passes it unchanged.

The switch is wired into the Master block only (in *4 · Enhance & Master* into HQ 2 directly): switching it runs the **mastering** again, not the song - ComfyUI reuses the render and everything before it.

The output **hq_mastering** goes into the Master block's *HQ mastering* input (or HQ 2's *HQ mastering*). The user guide [Audio HQ](../../docs/user/concepts/audio-hq.md) covers the stages.
