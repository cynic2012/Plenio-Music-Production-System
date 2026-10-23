# Apply Sung Check

Corrects **misheard words** in the lyrics as sung. The lyrics ASR writes what it heard; a word it misheard stood in the lyrics *as sung* as heard. The writer model names the bracketed words it is sure were misheard, each with the word that was most likely sung. A correction is taken only when

- it replaces a whole **bracket** of that line - one word the lyrics do not have there, or several in a row (a phrase can be heard as other words: *a detour* as *ready to*),
- the writer is **sure enough** (80 % or more),
- the words have **as many syllables** as what was heard (a Chinese or Japanese character counts as one), and
- it puts no word twice in a row where the line had none.

How good the corrections are depends on the writer model: on a test song with two planted mishearings, Gemma 4 12B and Qwen3.5 9B both found *rowed* -> *road* and *ready to* -> *A detour*; Qwen3.5 9B also turned a sung *I* into *If*. Every correction stays in the record with what was heard. Bypass the block (**Ctrl+B**) to keep the lyrics as sung exactly as heard.

Words that make sense as sung - an ad-lib, a word the music model chose, a repetition - stay as heard.

The release record keeps every correction with the word heard (`timing[].sung.corrected`: line, heard, word, how sure); the lines and the text of the lyrics as sung carry the corrections, `(sung).srt` is written again, and how far the take follows its lyrics is counted again. A record is checked once: a second run asks no writer. The Plenio Player shows the corrected lines under *As sung* and lists the corrections on the song's page.

- **record** - the release record (*Export Release*'s *record* output).
- **answer** - the writer's answer (asked only when there are words to check).
- **language** (optional) - for the syllables; empty: the brief's, else guessed from the lyrics.

Outputs: **record** (the same path, corrected in place) and a **report** of what was corrected and why not the rest. In the templates the block *Check Sung Words* sits in the FINISH group, after *Export Release*, and uses the template's writer model.
