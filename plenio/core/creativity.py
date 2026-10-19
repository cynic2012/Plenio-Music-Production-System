"""Creativity: one slider from steady (0) to experimental (100); 50 is the reference (owner's request 2026-10-19).

The slider acts on three places, each kept within what is known to work:

- **The writer's rules** (``writer_lines``): for the lyrics and the style, by level. 40-60 adds nothing - the
  prompt is exactly the one of before, so a workflow without the slider (50) writes as it always did.
- **The writer's and the arrangement's temperature** (``sampling``, stages ``writer`` and ``arrangement``): only
  the first drafts; the repairs and re-asks keep their own (they fix a form and must stay reliable). 100 reaches
  1.0, Gemma's own recommended temperature; the drafts are checked and enforced as before.
- **YuE2's sampling** (stages ``plan`` and ``take``): the plan's (ABC) and the take's (music tokens)
  temperature, top-p and top-k. 50 gives exactly the native nodes' defaults - the reference upstream documents
  and Plenio was tuned with. The ends move moderately: upstream warns that other sampling values may change
  quality, and no study measured where it drops, so 100 stays below the ranges reported as risky (ABC
  temperature above 1.0, music temperature above 1.15). The repetition penalty stays: music needs its
  repetitions, and a penalty below 1 invites endless loops.

Design notes: docs/design/creativity.md.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .engines.minimax import ENGINE_ID as MINIMAX
from .errors import PlenioUserError

CREATIVITY_DEFAULT = 50
"""The reference: the writer's prompt and YuE2's sampling exactly as before the slider."""

STEADY, RESTRAINED, BALANCED, VARIED, EXPERIMENTAL = (
    "steady",
    "restrained",
    "balanced",
    "varied",
    "experimental",
)
LEVELS: tuple[tuple[int, str], ...] = (
    (19, STEADY),
    (39, RESTRAINED),
    (60, BALANCED),
    (80, VARIED),
    (100, EXPERIMENTAL),
)
"""The writer's levels by their highest value."""

STAGES = ("writer", "arrangement", "plan", "take")


def creativity_value(value: Any, default: int = CREATIVITY_DEFAULT) -> int:
    """The slider's value: a whole number from 0 to 100 (an empty value takes ``default``)."""
    if value is None or str(value).strip() == "":
        return default
    try:
        number = round(float(value))
    except (TypeError, ValueError):
        raise PlenioUserError(f"Creativity {value!r} is not a number.", hint="Use 0 to 100.") from None
    return max(0, min(100, number))


def creativity_level(creativity: int) -> str:
    """``steady``, ``restrained``, ``balanced``, ``varied`` or ``experimental``."""
    value = creativity_value(creativity)
    return next(name for highest, name in LEVELS if value <= highest)


def describe(creativity: int) -> str:
    """For summaries: ``50 (balanced, the reference)``, ``75 (varied)``."""
    value = creativity_value(creativity)
    level = creativity_level(value)
    return f"{value} ({level}{', the reference' if value == CREATIVITY_DEFAULT else ''})"


# --- the sampling -----------------------------------------------------------------------------------------


@dataclass(frozen=True)
class Sampling:
    temperature: float
    top_p: float
    top_k: int


SAMPLING: dict[str, dict[int, Sampling]] = {
    # the writer's first draft (title, style, lyrics); top-p and top-k as the templates set them
    "writer": {
        0: Sampling(0.60, 0.95, 64),
        50: Sampling(0.80, 0.95, 64),  # the templates' value
        100: Sampling(1.00, 0.95, 64),
    },
    # a creative mode's arrangement plan
    "arrangement": {
        0: Sampling(0.55, 0.95, 64),
        50: Sampling(0.70, 0.95, 64),  # the templates' value
        100: Sampling(0.90, 0.95, 64),
    },
    # the plan (YuE2 Generate ABC): which notes, chords and rhythms the score gets
    "plan": {
        0: Sampling(0.55, 0.85, 20),
        50: Sampling(0.70, 0.90, 30),  # the native node's defaults
        100: Sampling(0.92, 0.95, 50),
    },
    # the take (YuE2 Generate Music): how the score is performed - voice, instruments, sound
    "take": {
        0: Sampling(0.90, 0.92, 60),
        50: Sampling(1.00, 0.95, 100),  # the native node's defaults
        100: Sampling(1.10, 0.97, 150),
    },
}
"""Anchors at 0, 50 and 100; between them the values move in a straight line."""


def sampling(creativity: int, stage: str) -> Sampling:
    """The sampling for ``stage`` at ``creativity``; 50 gives the templates' values (YuE2: the native defaults)."""
    if stage not in SAMPLING:
        raise PlenioUserError(f"Unknown stage {stage!r}.", hint=f"Use one of {list(STAGES)}.")
    value = creativity_value(creativity)
    anchors = SAMPLING[stage]
    low, high = (0, 50) if value <= 50 else (50, 100)
    share = (value - low) / (high - low)
    a, b = anchors[low], anchors[high]

    def between(x: float, y: float) -> float:
        return x + (y - x) * share

    return Sampling(
        round(between(a.temperature, b.temperature), 3),
        round(between(a.top_p, b.top_p), 3),
        round(between(a.top_k, b.top_k)),
    )


# --- the writer ----------------------------------------------------------------------------------------------

_HEADS = {
    STEADY: "keep the song simple, steady and predictable - the most typical choices of its genre.",
    RESTRAINED: "stay close to the conventions of the genre - familiar choices and a clear, repeated hook.",
    VARIED: "give the song more contrast and character than usual, while it stays clearly in its genre.",
    EXPERIMENTAL: "make bold, surprising choices that still hang together - the song may borrow from a "
    "neighbouring genre and use an unusual instrument, sound or rhythm feel.",
}

_DESCRIPTOR_STYLE = {
    STEADY: "Style: plain, typical descriptors - the genre's usual instruments, one steady groove, a clean and "
    "simple production.",
    RESTRAINED: "Style: the genre's usual instruments and one consistent sound.",
    VARIED: "Style: make the line more specific rather than longer (still about 40 words): name particular "
    "instruments and how they are played (for example 'fingerpicked nylon guitar', 'muted trumpet', 'pulsing "
    "analog bass'), a distinct production colour, and one or two descriptors of movement and contrast such as "
    "'dynamic build-ups', 'sparse-to-full contrast', 'instrumental fills between phrases'{sung}. Prefer exact "
    "words to stock ones like 'catchy' or 'uplifting'.",
}
_DESCRIPTOR_STYLE[EXPERIMENTAL] = (
    _DESCRIPTOR_STYLE[VARIED] + " Add one unexpected but fitting colour: an unusual instrument, a touch of a "
    "neighbouring genre or an uncommon rhythm feel."
)

_CAPTION_STYLE = {
    STEADY: "Caption: one steady groove and the same instrumentation all the way through; the Arrangement part "
    "describes little change from section to section.",
    RESTRAINED: "Caption: a conventional arrangement for the genre, with gentle changes between the sections.",
    VARIED: "Caption: let the Arrangement part tell a clear arc of contrasts - an intimate start, a build, a full "
    "and wide high point, and a quieter contrast where the sections give room for one (a bridge, or a breakdown "
    "before the last chorus) - with instruments answering the {lead} and particular instruments and playing "
    "styles named.",
}
_CAPTION_STYLE[EXPERIMENTAL] = (
    _CAPTION_STYLE[VARIED] + " Allow one surprising turn: a key lift for the last chorus, a change of rhythm "
    "feel or an unusual instrument solo."
)

_LYRICS = {
    STEADY: "Lyrics: plain everyday words, short regular lines and simple rhymes; the chorus repeats the same "
    "words each time.",
    RESTRAINED: "Lyrics: familiar images, regular lines and a chorus that repeats.",
    VARIED: "Lyrics: fresh, concrete images instead of stock phrases; vary line lengths and rhythm between the "
    "sections; keep the chorus hook memorable - its last repeat may change a few words to lift the ending.",
    EXPERIMENTAL: "Lyrics: an unexpected angle and imagery, inventive rhymes and rhythms; the hook stays "
    "recognisable.",
}
_LYRICS_ON_A_MELODY = {
    STEADY: "Lyrics: plain everyday words and simple rhymes.",
    RESTRAINED: "Lyrics: familiar images.",
    VARIED: "Lyrics: fresh, concrete images instead of stock phrases.",
    EXPERIMENTAL: "Lyrics: an unexpected angle and imagery, inventive rhymes.",
}
_EXTRA_SECTION = (
    " You may add one contrasting section - a [Bridge], or a [Break] before the last chorus - if the sections "
    "above have none."
)


def writer_lines(
    creativity: int,
    *,
    engine_id: str,
    instrumental: bool,
    lyrics: str,
    fixed_sections: bool,
) -> list[str]:
    """The writer's rules for ``creativity`` (nothing for 40-60: the reference prompt).

    ``engine_id``: MiniMax Music 3 writes a caption in three headed parts, every other engine one descriptor line
    (YuE2 sang longer style prose; yue2-design.md §3.1). ``lyrics``: ``write`` (the writer writes them),
    ``melody`` (new lyrics on a given melody - the syllable counts rule, so the lines keep their length) or
    ``none``. ``fixed_sections``: the sections come from a score and must not change."""
    level = creativity_level(creativity)
    if level == BALANCED:
        return []
    lines = [f"- Creativity ({creativity_value(creativity)} of 100, {level}): {_HEADS[level]}"]
    if engine_id == MINIMAX:
        lines.append("- " + _CAPTION_STYLE[level].format(lead="lead" if instrumental else "voice"))
    else:
        lines.append(
            "- "
            + _DESCRIPTOR_STYLE[level].format(sung="" if instrumental else " or 'layered backing vocals'")
        )
    if not instrumental and lyrics == "write":
        extra = _EXTRA_SECTION if level == EXPERIMENTAL and not fixed_sections else ""
        lines.append("- " + _LYRICS[level] + extra)
    elif not instrumental and lyrics == "melody":
        lines.append("- " + _LYRICS_ON_A_MELODY[level] + " The syllable counts above still rule.")
    return lines
