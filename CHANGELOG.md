# Changelog

All notable changes of the current version and the one before. Versions follow semantic versioning; published Registry versions are immutable. Earlier versions (0.2.0 to 0.6.0): the [changelog of 0.6.0](https://github.com/jplenio/Plenio-Music-Production-System/blob/v0.6.0/CHANGELOG.md) (0.5.0 and 0.6.0), the [changelog of 0.4.4](https://github.com/jplenio/Plenio-Music-Production-System/blob/v0.4.4/CHANGELOG.md) (0.2.0 to 0.4.4) and the [GitHub releases](https://github.com/jplenio/Plenio-Music-Production-System/releases).

## 0.7.0 - 2026-10-12

More creative modes, no key change unless you ask for one, and instrumentals with more sections to vary.

### Added

- **Seven new creative modes** (owner's request), so the *arrangement* list runs from simple to rich: *unplugged* (intimate and acoustic - fingerpicked broken chords, soft pads, low energy), *call and response* (the instruments answer the melody in the gaps between its phrases, the same answer in every chorus), *signature motif* (one short figure opens the song, returns in every chorus and closes it - Plenio keeps the plan's first figure in every section that plays it, as a mode file's new `motif: one` says), *hypnotic* (one riff or arpeggio over few chords, changing little by little - trance, minimal, krautrock), *breakdown* (full sections, a drop to almost nothing, a build into a big final section), *jazz colours* (seventh chords throughout, ii-V turns before a section changes, a mellow countermelody and a solo) and *key change* (*standard* plus one lift of the final chorus by a half or whole step, led in by chords). The list is ordered from *standard*, *sterile* and *unplugged* to *jazz colours*, *fantasy* and *key change*.
- The *arrangement* field's tooltip (Song Brief and Cover Brief) lists every mode with what it does - your own mode files too.
- Checked with a real writer model (Qwen 3.5 9B, held to the plan's format) on two sung songs and two instrumentals of the owner's demos, every mode (52 plans, October 2026): no key change in the twelve modes that keep the key; *key change* lifted the final section (or the last two) in all four songs; and the modes keep their character - *sterile* silence and pads at energy 1-3, *unplugged* broken chords at 2-3, *breakdown* its drop to energy 1 before the finale, *dramatic* a rising arc, *hypnotic* one riff or arpeggio, *jazz colours* new seventh chords in every section, *signature motif* and *call and response* one figure for the whole song (Plenio keeps the plan's first figure in every section that plays it - the writer had varied it).

### Changed

- **No key change but in the mode *key change*** (owner's request): the writer's plans lifted the key in nearly every song - with *standard* in all 80 sung songs of the owner's demos, mostly a half step in the last chorus - and it rarely suited the song. Every other mode now keeps the key (*standard*, *varied*, *fantasy*, *many instruments* and *dramatic* allowed a lift before; *fantasy* also a key change in the bridge), their texts no longer suggest one, and the arrangement prompt says that 0 is the right key shift for almost every section. A plan that asks for a lift anyway keeps the key (the plan's format allows no other value).
- **Instrumental songs get more sections** (owner's request): YuE2 planned 1-3 sections in 44 % of the owner's 110 instrumental demos - mostly an intro and one *interlude* of 50-120 bars - although its planner read eight section tags, so the arrangement had one or two sections to vary. *prepare from brief* (Score Tools) now splits a section of more than 16 bars into parts of 8 bars (16 when it is longer than 48) at the nearest barline no melody note is held across, and names them by their music: the first part keeps the section's name (an outro its last part), a part that repeats an earlier one takes its name, a part with new music the next of *verse, chorus, bridge, break, solo, interlude*. Only section starts are added - the notes stay. On the owner's 110 instrumental scores: no score with fewer than 4 sections (before: 48), most with 6 to 11, notes, chords and length unchanged in every one.
- *standard*, *varied*, *fantasy*, *sterile*, *many instruments* and *dramatic* keep their names (saved workflows go on working); their descriptions say more clearly what they do.

## 0.6.1 - 2026-10-11

Bugfixes from GitHub issues: Stems load on ComfyUI Desktop, and GGUF language models kept in `text_encoders` can write the songs.

### Changed

- **GGUF language models in `text_encoders`** (GitHub issue): *Writer Choice* and *Local LLM* also list the GGUF language models in ComfyUI's `text_encoders` folder (and the old `clip`, with their `extra_model_paths.yaml` lines) as `models/text_encoders · …` - where ComfyUI-GGUF's *CLIPLoaderGGUF* finds them; before, they were offered only after a `[llm.folders]` line in `config.toml`. Plenio reads each file's GGUF header and lists only what llama.cpp can let write: the T5, UMT5 and CLIP encoders of image and video models and the parts ComfyUI-GGUF converts without a tokenizer (Flux 2's Mistral encoder) stay out. A folder also named in `[llm.folders]` keeps its own label, and its files are not listed twice.

### Fixed

- **Stems on ComfyUI Desktop** (GitHub issue): *Load Audio Model* refused the released BS-RoFormer checkpoint - *does not match the BS-RoFormer architecture: Unexpected key(s) in state_dict: ...rotary_embed.freqs* - wherever the Python package `rotary-embedding-torch` is not installed (ComfyUI Desktop ships without it; other custom nodes often bring it, so it did not show here). Plenio's stand-in for the package kept no frequencies, which the checkpoint carries, and turned the two halves of each head instead of neighbouring pairs, as the package does. It is now the package's rotation rebuilt: bit-identical in a test against `rotary-embedding-torch`, and the stems of a real song separated with the released checkpoint are bit-identical with either. A package version that keeps the standard frequencies out of the weights no longer stops the checkpoint either.
