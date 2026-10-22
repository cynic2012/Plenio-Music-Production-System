"""Lyrics ASR worker (run as ``python -m plenio.workers.asr``): Qwen3-ASR with Qwen3-ForcedAligner, or
faster-whisper with word timestamps.

Request (``request.json``)::

    {"engine": "qwen3-asr-1.7b" | "faster-whisper-large-v3", "model_dir": "...", "aligner_dir": "..." (Qwen3),
     "audio": "<file>.npy" (16 kHz mono float32), "language": "" | "en" | ..., "beam_size": 5, "seed": 0,
     "regions": [[start, end], ...], "device": "auto" | "cuda" | "cpu"}

Result: a ``plenio.asr/1`` object (see ``plenio.core.asr``).

**Qwen3** (vendored inference code, ``plenio.third_party.qwen3_asr``): every vocal region (or the whole
audio) in pieces of at most four minutes - the aligner takes five - is transcribed greedily, then the
aligner times the heard words; the two models run one after the other, so the GPU holds one at a time. A
word's ``p`` is the geometric mean of its tokens' probabilities in the transcription. A language the aligner
does not know leaves the words untimed (``settings.timed`` false): the host then asks faster-whisper.

**faster-whisper** (settings measured in Phase 4A): VAD off (the Silero VAD removes singing over music),
transcribing only the vocal regions (no invented words in instrumental parts), faster-whisper's default
temperature fallback with a fixed CTranslate2 seed.
"""

from __future__ import annotations

import importlib.util
import os
import time
from pathlib import Path
from typing import Any

from ..core.asr import ALIGNER_LANGUAGES, ASR_SCHEMA, QWEN3_LANGUAGES
from ..core.errors import PlenioDependencyError, PlenioModelError
from ..core.workers.runtime import Job, serve


def _add_cuda_dll_folders() -> list[str]:
    """CTranslate2 4.x on Windows needs the CUDA 12 cuBLAS (nvidia-cublas-cu12) and cuDNN 9 (next to torch)."""
    if not hasattr(os, "add_dll_directory"):
        return []
    added = []
    candidates: list[Path] = []
    nvidia = importlib.util.find_spec("nvidia")
    if nvidia is not None and nvidia.submodule_search_locations:
        candidates += [Path(p) / "cublas" / "bin" for p in nvidia.submodule_search_locations]
    torch_spec = importlib.util.find_spec("torch")
    if torch_spec is not None and torch_spec.origin:
        candidates.append(Path(torch_spec.origin).parent / "lib")
    for folder in candidates:
        if folder.is_dir():
            os.add_dll_directory(str(folder))
            os.environ["PATH"] = str(folder) + os.pathsep + os.environ.get("PATH", "")
            added.append(str(folder))
    return added


def _model_class() -> Any:
    try:
        from faster_whisper import WhisperModel
    except ModuleNotFoundError as error:
        raise PlenioDependencyError(
            "faster-whisper",
            feature="Transcribe Lyrics (faster-whisper large-v3)",
            install="python -m pip install faster-whisper",
        ) from error
    return WhisperModel


def _transcribe(
    job: Job, model: Any, audio: Any, options: dict[str, Any], duration: float
) -> tuple[Any, list, list]:
    segments, info = model.transcribe(audio, **options)
    rows: list[dict[str, Any]] = []
    words: list[dict[str, Any]] = []
    for segment in segments:
        rows.append(
            {
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "text": segment.text.strip(),
                "avg_logprob": round(segment.avg_logprob, 3),
            }
        )
        for word in segment.words or ():
            words.append(
                {
                    "start": round(word.start, 3),
                    "end": round(word.end, 3),
                    "word": word.word.strip(),
                    "p": round(word.probability, 3),
                    "segment": len(rows) - 1,
                }
            )
        job.progress(min(0.99, 0.05 + 0.94 * segment.end / duration), f"{len(words)} words")
    return info, rows, words


def handle(job: Job) -> dict[str, Any]:
    if str(job.request.get("engine", "")) == "qwen3-asr-1.7b":
        return _qwen3(job)
    return _whisper(job)


def _whisper(job: Job) -> dict[str, Any]:
    import ctranslate2
    import numpy as np

    request = job.request
    started = time.perf_counter()
    job.progress(0.0, "loading the ASR model")
    dll_folders = _add_cuda_dll_folders()
    whisper_model = _model_class()
    audio = np.load(str(request["audio"])).astype("float32")
    duration = max(len(audio) / 16000.0, 1e-6)
    regions = [(float(a), float(b)) for a, b in request.get("regions", [])]
    options: dict[str, Any] = {
        "language": request.get("language") or None,
        "vad_filter": False,
        "word_timestamps": True,
        "beam_size": int(request.get("beam_size", 5)),
        "condition_on_previous_text": False,
    }
    if regions:
        options["clip_timestamps"] = [value for span in regions for value in span]
    requested = str(request.get("device", "auto"))
    device_note = ""
    attempts = ["cuda", "cpu"] if requested == "auto" else [requested]
    for device in attempts:
        try:
            ctranslate2.set_random_seed(int(request.get("seed", 0)))
            model = whisper_model(
                str(request["model_dir"]),
                device=device,
                compute_type="float16" if device == "cuda" else "int8",
            )
            job.progress(0.05, f"transcribing on {device}")
            info, rows, words = _transcribe(job, model, audio, options, duration)
            break
        except (RuntimeError, ValueError, OSError) as error:
            if device == attempts[-1]:
                raise PlenioModelError(
                    f"faster-whisper failed on {device}: {error}",
                    hint="Choose device 'cpu', or install the CUDA 12 cuBLAS for CTranslate2 "
                    "(python -m pip install nvidia-cublas-cu12).",
                ) from error
            device_note = f"GPU not usable ({error}); ran on the CPU (int8, about 0.6 x the audio length)"
    return {
        "schema": ASR_SCHEMA,
        "engine": str(request.get("engine", "faster-whisper-large-v3")),
        "model": Path(str(request["model_dir"])).name,
        "language": info.language,
        "language_probability": float(info.language_probability),
        "device": device,
        "seconds": round(time.perf_counter() - started, 2),
        "settings": {
            "vad_filter": False,
            "beam_size": options["beam_size"],
            "seed": int(request.get("seed", 0)),
            "regions": [[round(a, 2), round(b, 2)] for a, b in regions],
            "device_note": device_note,
            "dll_folders": len(dll_folders),
        },
        "segments": rows,
        "words": words,
    }


# --- Qwen3-ASR + Qwen3-ForcedAligner ------------------------------------------------------------------------

RATE = 16000
PIECE_S = 240.0
"""Longest piece transcribed and aligned at once (the aligner takes up to five minutes)."""
CUT_SEARCH_S = 10.0
"""A long span is cut at its quietest 100 ms within this distance before the four-minute mark."""
MIN_PIECE_S = 0.5
SENTENCE_END = (".", "!", "?", "。", "！", "？", "…")
NAMES = {code: name for name, code in QWEN3_LANGUAGES.items()}


def pieces(audio: Any, spans: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """The spans (the whole audio when empty) cut into pieces of at most ``PIECE_S`` at quiet moments."""
    import numpy as np

    total = len(audio) / RATE
    out: list[tuple[float, float]] = []
    for start, end in spans or [(0.0, total)]:
        start, end = max(0.0, start), min(total, end)
        while end - start > PIECE_S:
            lo, hi = int((start + PIECE_S - CUT_SEARCH_S) * RATE), int((start + PIECE_S) * RATE)
            frames = audio[lo:hi][: (hi - lo) // 1600 * 1600].reshape(-1, 1600)
            cut = (
                start + PIECE_S
                if not len(frames)
                else (lo + 1600 * int(np.argmin((frames**2).mean(axis=1)))) / RATE
            )
            out.append((start, cut))
            start = cut
        if end - start >= MIN_PIECE_S:
            out.append((start, end))
    return out


def _token_spans(tokenizer: Any, ids: list[int]) -> tuple[str, list[tuple[int, int, int]]]:
    """The decoded text and, per token, ``(index, first char, end char)`` in it."""
    spans = []
    text = ""
    for index in range(len(ids)):
        longer = tokenizer.decode(ids[: index + 1], skip_special_tokens=False)
        spans.append((index, len(text), len(longer)))
        text = longer
    return text, spans


def _word_probabilities(
    transcript: str, raw: str, spans: list[tuple[int, int, int]], probs: list[float], words: list[str]
) -> list[float]:
    """Each aligned word's confidence: the geometric mean of the probabilities of the tokens it is made of."""
    import math

    offset = raw.find(transcript) if transcript else -1
    out = []
    cursor = 0
    lowered = transcript.lower()
    for word in words:
        at = lowered.find(word.lower(), cursor) if word else -1
        if at < 0 or offset < 0:
            out.append(1.0)
            continue
        cursor = at + len(word)
        first, last = offset + at, offset + cursor
        inside = [probs[i] for i, a, b in spans if a < last and b > first]
        out.append(math.exp(sum(math.log(max(p, 1e-9)) for p in inside) / len(inside)) if inside else 1.0)
    return out


def _sentences(transcript: str, words: list[str]) -> list[int]:
    """The sentence (by its end punctuation) each aligned word belongs to."""
    out = []
    cursor = 0
    sentence = 0
    lowered = transcript.lower()
    for word in words:
        at = lowered.find(word.lower(), cursor) if word else -1
        if at >= 0:
            sentence += sum(transcript[cursor:at].count(mark) for mark in SENTENCE_END)
            cursor = at + len(word)
        out.append(sentence)
    return out


def _load(folder: Path, model_class: Any, device: str) -> Any:
    import torch

    dtype = torch.bfloat16 if device == "cuda" else torch.float32
    return model_class.from_pretrained(str(folder), dtype=dtype).to(device).eval()


def _qwen3(job: Job) -> dict[str, Any]:
    """Qwen3 on the GPU (else the CPU, with a note); out of GPU memory under *auto*: once more on the CPU."""
    import os

    os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
    os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
    import torch

    try:
        from ..third_party import qwen3_asr

        classes = qwen3_asr.models()
    except (ImportError, AttributeError) as error:
        raise PlenioDependencyError(
            "transformers",
            feature=f"the lyrics ASR Qwen3-ASR (transformers 5.5 or newer; found: {error})",
            install='python -m pip install "transformers>=5.5" - or choose faster-whisper large-v3',
        ) from error
    requested = str(job.request.get("device", "auto"))
    device = "cuda" if requested in ("auto", "cuda") and torch.cuda.is_available() else "cpu"
    note = (
        ""
        if device == "cuda" or requested == "cpu"
        else "no GPU: ran on the CPU (several times the audio length)"
    )
    try:
        return _qwen3_on(job, qwen3_asr, classes, device, note)
    except torch.cuda.OutOfMemoryError as error:
        torch.cuda.empty_cache()
        if requested == "cuda":
            raise PlenioModelError(
                f"Qwen3-ASR ran out of GPU memory ({error}).",
                hint="It needs about 4 GB of VRAM: close other GPU programs, or choose device 'auto' or 'cpu'.",
            ) from error
        return _qwen3_on(
            job,
            qwen3_asr,
            classes,
            "cpu",
            "the GPU had no room: ran on the CPU (several times the audio length)",
        )


def _qwen3_on(
    job: Job, qwen3_asr: Any, classes: tuple[Any, Any], device: str, device_note: str
) -> dict[str, Any]:
    import numpy as np
    import torch

    request = job.request
    started = time.perf_counter()
    audio = np.load(str(request["audio"])).astype("float32")
    regions = [(float(a), float(b)) for a, b in request.get("regions", [])]
    parts = pieces(audio, regions)
    language_code = str(request.get("language") or "")
    language_name = NAMES.get(language_code)
    asr_class, aligner_class = classes
    folder = Path(str(request["model_dir"]))
    job.progress(0.0, "loading Qwen3-ASR")
    processor = qwen3_asr.processor(folder)
    model = _load(folder, asr_class, device)
    torch.manual_seed(int(request.get("seed", 0)))
    heard: list[dict[str, Any]] = []
    for number, (start, end) in enumerate(parts):
        piece = audio[int(start * RATE) : int(end * RATE)]
        options = {"language": language_name} if language_name else {}
        inputs = processor.apply_transcription_request(audio=piece, **options).to(model.device, model.dtype)
        with torch.inference_mode():
            output = model.generate(
                **inputs,
                max_new_tokens=int(64 + 8 * (end - start)),
                do_sample=False,
                output_scores=True,
                return_dict_in_generate=True,
            )
        ids = output.sequences[0, inputs["input_ids"].shape[1] :].tolist()
        probs = [
            float(torch.softmax(score[0].float(), dim=-1)[token])
            for score, token in zip(output.scores, ids, strict=False)
        ]
        parsed = processor.decode(
            output.sequences[:, inputs["input_ids"].shape[1] :], return_format="parsed"
        )[0]
        raw, spans = _token_spans(processor.tokenizer, ids)
        name = str(parsed.get("language") or language_name or "")
        heard.append(
            {
                "start": start,
                "end": end,
                "text": str(parsed.get("transcription") or "").strip(),
                "language": name,
                "raw": raw,
                "spans": spans,
                "probs": probs,
            }
        )
        job.progress(0.05 + 0.6 * (number + 1) / len(parts), f"heard {number + 1}/{len(parts)}")
    del model
    if device == "cuda":
        torch.cuda.empty_cache()
    names = [h["language"] for h in heard if h["text"]]
    detected = language_name or (max(set(names), key=names.count) if names else "")
    code = language_code or QWEN3_LANGUAGES.get(detected, "")
    timed = code in ALIGNER_LANGUAGES
    segments: list[dict[str, Any]] = []
    words: list[dict[str, Any]] = []
    if timed and any(h["text"] for h in heard):
        job.progress(0.7, "loading Qwen3-ForcedAligner")
        aligner_folder = Path(str(request["aligner_dir"]))
        aligner_processor = qwen3_asr.processor(aligner_folder)
        aligner = _load(aligner_folder, aligner_class, device)
        for number, h in enumerate(heard):
            if not h["text"]:
                continue
            piece = audio[int(h["start"] * RATE) : int(h["end"] * RATE)]
            inputs, word_lists = aligner_processor.prepare_forced_aligner_inputs(
                audio=piece, transcript=h["text"], language=detected
            )
            inputs = inputs.to(aligner.device, aligner.dtype)
            with torch.inference_mode():
                logits = aligner(**inputs).logits
            items = aligner_processor.decode_forced_alignment(
                logits=logits,
                input_ids=inputs["input_ids"],
                word_lists=word_lists,
                timestamp_token_id=aligner.config.timestamp_token_id,
            )[0]
            texts = [str(item["text"]) for item in items]
            confidence = _word_probabilities(h["text"], h["raw"], h["spans"], h["probs"], texts)
            sentence_of = _sentences(h["text"], texts)
            first_segment = len(segments)
            for k, item in enumerate(items):
                segment = first_segment + sentence_of[k]
                while len(segments) <= segment:
                    segments.append({"start": None, "end": None, "text": "", "words": 0})
                begin = round(h["start"] + float(item["start_time"]), 3)
                finish = round(h["start"] + float(item["end_time"]), 3)
                words.append(
                    {
                        "start": begin,
                        "end": finish,
                        "word": texts[k],
                        "p": round(confidence[k], 3),
                        "segment": segment,
                    }
                )
                row = segments[segment]
                row["start"] = begin if row["start"] is None else row["start"]
                row["end"] = finish
                row["words"] += 1
            texts_of = _sentence_texts(h["text"])
            for k, row in enumerate(segments[first_segment:]):
                row["text"] = texts_of[k] if k < len(texts_of) else ""
            job.progress(0.7 + 0.29 * (number + 1) / len(heard), f"timed {number + 1}/{len(heard)}")
        del aligner
    else:
        segments = [
            {"start": round(h["start"], 2), "end": round(h["end"], 2), "text": h["text"], "words": 0}
            for h in heard
            if h["text"]
        ]
    rows = [
        {"start": round(r["start"] or 0.0, 2), "end": round(r["end"] or 0.0, 2), "text": r["text"]}
        for r in segments
        if r["text"] or r["words"]
    ]
    return {
        "schema": ASR_SCHEMA,
        "engine": "qwen3-asr-1.7b",
        "model": f"{folder.name} + {Path(str(request.get('aligner_dir', ''))).name}",
        "language": code,
        "language_probability": 0.0,
        "device": device,
        "seconds": round(time.perf_counter() - started, 2),
        "settings": {
            "pieces": [[round(a, 2), round(b, 2)] for a, b in parts],
            "regions": [[round(a, 2), round(b, 2)] for a, b in regions],
            "timed": timed,
            "device_note": device_note,
        },
        "segments": rows,
        "words": words,
    }


def _sentence_texts(transcript: str) -> list[str]:
    """The transcript split after each sentence end."""
    out = []
    current = ""
    for char in transcript:
        current += char
        if char in SENTENCE_END:
            out.append(current.strip())
            current = ""
    if current.strip():
        out.append(current.strip())
    return out


if __name__ == "__main__":
    raise SystemExit(serve(handle))
