# Compose Sung Check

The question about the **lyrics as sung** (*Export Release* keeps them: what the take really sings, as the lyrics ASR heard it). It gives the writer the song's lyrics as written and every line as heard, with the words the lyrics do not have at that place in **[brackets]** - one word, or several heard in a row - and, where the ASR heard a similar word instead of the lyrics' one, that word (`[doun | written: down]`).

- **record** - the release record *Export Release* wrote (its *record* output).
- **language** (optional) - the language the song is sung in; empty: the brief's, else guessed from the lyrics.

Outputs: **prompt** for a writer (*Generate Text* or *Local LLM*) and **schema**, the JSON schema of the answer (Local LLM keeps to it exactly).

A record without sung lyrics (instrumental, exported before Plenio kept them, subtitles off) or without a bracketed word gives an empty prompt - and since *Apply Sung Check* then asks for no answer, no writer runs. The block *Plenio · Check Sung Words* contains this node, the writer branches and *Apply Sung Check*.
