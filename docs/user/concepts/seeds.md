# Seeds: keep a part, renew a part

A seed is the number behind one part's random choices. With the same inputs, the same seed gives the same
result; another seed gives something new. The templates have a seed per part:

| Seed | Part | Default |
|---|---|---|
| **Take seed** | the render: how YuE2 or MiniMax sings and plays the documents | 🎲 new seed - every run a new take |
| **Draft seed** | the writer's draft: title, style, lyrics, artwork prompt | 🔒 same seed - the draft stays |
| **Arrangement seed** (YuE2 Song, YuE2 Cover) | the creative mode's arrangement | 🔒 same seed - the arrangement stays |

Each seed node has **one switch**, *each run*:

- **🎲 new seed** - every run draws a new number **before** it starts: something new each time. The node is
  **amber**.
- **🔒 same seed** - every run uses the number again: that part stays the same while you change other
  things. The node is **blue**.

The number shown is always **the one the last run used**. Liked the take you just heard? Switch the take
seed to 🔒 - the number that made it stays, and the next runs repeat it (for example while you try another
mastering or another cover). The **🎲 new seed now** button draws one new number at once, also while 🔒 is
on: try one more variant, then keep it.

Typical uses:

- **More takes of a song you like** - draft 🔒, take 🎲: every run sings the same lyrics anew.
- **A take you like, a new mix** - take 🔒: the render comes from ComfyUI's cache, only what follows it runs.
- **New lyrics for the same brief** - draft 🎲 (in *one song, stop to review* every new draft then needs a
  new approval).
- **Back to an earlier result** - type its seeds (the release record of every song lists them; *Continue a
  Plenio song* restores them).

In the mode *new song every run* the brief gives every song of a series its own draft and plan seeds (the
brief's *song seed* is added to them), so the draft seed can stay 🔒.

ComfyUI's own seed control (*control after generate*: fixed, increment, decrement, randomize) changes the
number **after** a run, so the number it shows belongs to the next run. The Plenio seed does not, so what you
see is what made the result. Older workflows keep their ComfyUI seed nodes and work as before.
