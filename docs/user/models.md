# Models and downloads

Plenio ships no model weights. Each template's loader nodes name the files they need, and **ComfyUI** offers to download missing ones when you open the template (the *missing models* dialog). You can also download them yourself and put them into the folders below. The **0 · System Check** template lists which files of each template are installed on your machine.

The list below is the model catalogue Plenio's templates are built from (`resources/models.toml`). Sizes are those of the public files (decimal GB, as download dialogs show them).

## Files per template

### 1 · YuE2 · Song

| File | Folder (`ComfyUI/models/...`) | Size | Licence | |
|---|---|---|---|---|
| `yue2_3b_int8_convrot.safetensors` | `checkpoints` | 4.0 GB | CC BY-NC 4.0 | needed |
| `gemma4_e4b_it_fp8_scaled.safetensors` | `text_encoders` | (see the model card) | Apache-2.0 | needed (writer) |
| `ar_lora_inst_v3abc_comfyui.safetensors` | `loras` | (see the model card) | CC BY-NC 4.0 | optional: instrumental adapter inside the model block, bypassed |
| FLUX.2 Klein files (below) | | 16.1 GB | Apache-2.0 | optional: Cover Art, bypassed |

### 2 · YuE2 · Cover

| File | Folder | Size | Licence | |
|---|---|---|---|---|
| `yue2_3b_int8_convrot.safetensors` | `checkpoints` | 4.0 GB | CC BY-NC 4.0 | needed |
| `sheetsage2_bf16.safetensors` | `audio_encoders` | 1.4 GB | CC BY-NC 4.0 | needed (score transcription, Check Vocals) |
| `ar_lora_inst_v3abc_comfyui.safetensors` | `loras` | (see the model card) | CC BY-NC 4.0 | needed (instrumental adapter) |
| `gemma4_e4b_it_fp8_scaled.safetensors` | `text_encoders` | (see the model card) | Apache-2.0 | needed (writer) |
| Qwen3-ASR 1.7B and Qwen3-ForcedAligner 0.6B (Plenio assets, below) | `plenio/asr/qwen3-asr-1.7b-hf`, `plenio/asr/qwen3-forcedaligner-0.6b-hf` | 4.1 + 1.8 GB | Apache-2.0 | fetched by Plenio when *original lyrics*, *Check sung lyrics* or the subtitles first need them |
| FLUX.2 Klein files (below) | | 16.1 GB | Apache-2.0 | optional: Cover Art, bypassed |

### 3 · MiniMax · Song

| File | Folder | Size | Licence | |
|---|---|---|---|---|
| `minimax_music3_dit_fp16.safetensors` | `diffusion_models` | 4.9 GB | MiniMax-Music3 Community License | needed |
| `minimax_music3_text_encoder_pruned_int8_convrot.safetensors` | `text_encoders` | 9.2 GB | MiniMax-Music3 Community License | needed |
| `minimax_music3_dav.safetensors` | `vae` | 217 MB | MiniMax-Music3 Community License | needed |
| `gemma4_e4b_it_fp8_scaled.safetensors` | `text_encoders` | (see the model card) | Apache-2.0 | needed (writer) |
| `pytorch_model.bin` (UniverSR) | `audio_sr` | 229 MB | CC BY 4.0 (weights); MIT (code) | **optional**: HQ 2 · Regenerate Highs, with the HQ Mastering switch on |
| FLUX.2 Klein files (below) | | 16.1 GB | Apache-2.0 | optional: Cover Art, bypassed |

### Audio HQ 2 (UniverSR), in the Master block of templates 1-5

| File | Folder | Size | Licence |
|---|---|---|---|
| `pytorch_model.bin` (UniverSR audio) | `audio_sr` | 229 MB | CC BY 4.0 (weights), MIT (inference code; vendored in `plenio/third_party/universr`) |

**Needed only for HQ mastering** (the switch at the top of every template, off by default): with it on, [HQ 2 · Regenerate Highs](concepts/audio-hq.md) runs in the Master block (in 4 · Enhance & Master as a plain node); off, the model is not loaded and the file is not needed. ComfyUI offers the download when a template opens. The one file serves every template, and the *Refine (48 kHz)* node of the library uses it too (its *resample only* engine needs no model at all).

### Stems (BS-RoFormer), the optional block of templates 1-5

| File | Folder | Size | Licence |
|---|---|---|---|
| `model_bs_roformer_ep_17_sdr_9.6568.ckpt` | `audio_separation` | 527 MB | MIT (training code; vendored inference code in `plenio/third_party/msst`); the checkpoint was trained on MUSDB18-HQ, whose dataset terms are research-oriented |

*Separate Stems* and *Stem Mixer* stay bypassed in every template until you turn them on. *2 · YuE2 · Cover* also uses the file for **Sung Pitch** (the source's vocal line in the score editor); without it the cover runs as before and the editor says that there is no sung pitch. Place the file in `ComfyUI/models/audio_separation` (create the folder if needed) - or in an `audio_separation` folder beside the model folders of your `extra_model_paths.yaml` (see [Existing model folders](#existing-model-folders)); the checkpoint is a plain `.ckpt` with its config inside, so no second file is required. Without it the template runs exactly as before.

The block is **experimental** until its listening check (L2) is accepted: the separation itself is measured (MUSDB18-HQ SDR 9.66 reported by the authors), but how the stems are used here is not.

### Cover Art (optional block of templates 1-3)

| File | Folder | Size | Licence |
|---|---|---|---|
| `flux-2-klein-4b.safetensors` | `diffusion_models` | 7.8 GB | Apache-2.0 |
| `qwen_3_4b.safetensors` | `text_encoders` | 8.0 GB | Apache-2.0 |
| `flux2-vae.safetensors` | `vae` | 336 MB | Apache-2.0 |

The block stays bypassed until you turn it on, so a template runs without these files.

### 0 · System Check and 4 · Enhance & Master (the other files)

0 · System Check needs no model file. 4 · Enhance & Master needs none either: the UniverSR file of HQ 2 (above) only for HQ mastering, and the optional Stems block (bypassed) for material you upload.

## Download sources

| File | Source |
|---|---|
| YuE2, SheetSage2 | [Comfy-Org/YuE2](https://huggingface.co/Comfy-Org/YuE2) |
| instrumental adapter | [Mothersuperior/YuE2-instrumental-cot-full-loras](https://huggingface.co/Mothersuperior/YuE2-instrumental-cot-full-loras) (pinned revision in the template) |
| writer | [Comfy-Org/gemma-4](https://huggingface.co/Comfy-Org/gemma-4) |
| MiniMax Music 3 | [Comfy-Org/MiniMax-Music-3](https://huggingface.co/Comfy-Org/MiniMax-Music-3) |
| UniverSR audio (HQ 2, Refine) | [woongzip1/universr-audio](https://huggingface.co/woongzip1/universr-audio) - released as `pytorch_model.bin` (CC BY 4.0; the inference code is MIT and vendored) |
| BS-RoFormer 4-stem (Stems) | [ZFTurbo/Music-Source-Separation-Training](https://github.com/ZFTurbo/Music-Source-Separation-Training) release v1.0.12 - `model_bs_roformer_ep_17_sdr_9.6568.ckpt` (MIT training code; the inference code is MIT and vendored) |
| FLUX.2 Klein 4B, its text encoder | [Comfy-Org/flux2-klein](https://huggingface.co/Comfy-Org/flux2-klein) |
| FLUX.2 VAE | [Comfy-Org/flux2-dev](https://huggingface.co/Comfy-Org/flux2-dev) |
| Qwen3-ASR 1.7B, Qwen3-ForcedAligner 0.6B | [Qwen/Qwen3-ASR-1.7B-hf](https://huggingface.co/Qwen/Qwen3-ASR-1.7B-hf), [Qwen/Qwen3-ForcedAligner-0.6B-hf](https://huggingface.co/Qwen/Qwen3-ForcedAligner-0.6B-hf) (pinned revisions; the inference code is Apache-2.0 and vendored from transformers 5.17) |
| faster-whisper large-v3 | [Systran/faster-whisper-large-v3](https://huggingface.co/Systran/faster-whisper-large-v3) (pinned revision) |

The exact URLs are in `resources/models.toml` (the templates' loaders carry the same entries for ComfyUI's download dialog).

## Smaller GPUs: alternative files

The templates default to the files above. The System Check marks the row of its hardware rule table that matches your GPU; for smaller cards it suggests these alternatives (choose them in the loader nodes - nothing is switched automatically):

| Instead of | Choose | Size | For | Basis |
|---|---|---|---|---|
| `minimax_music3_dit_fp16` | `minimax_music3_dit_int8_convrot.safetensors` | 2.5 GB | 8-16 GB | legacy toolkit rating |
| `flux-2-klein-4b` | `flux-2-klein-4b-fp8.safetensors` ([black-forest-labs/FLUX.2-klein-4b-fp8](https://huggingface.co/black-forest-labs/FLUX.2-klein-4b-fp8)) | 4.1 GB | 8-16 GB | legacy toolkit rating |
| `qwen_3_4b` | `qwen_3_4b_fp4_flux2.safetensors` | 3.8 GB | 8-16 GB | legacy toolkit rating |
| `yue2_3b_int8_convrot` | `yue2_3b_bf16.safetensors` | 7.8 GB | 24 GB and more | Plenio design (int8 stays the faster default) |

"Legacy toolkit rating" means the rating Plenio's predecessor gave these files; Plenio has not measured them itself. The YuE2 int8 checkpoint with the Gemma 4 E4B writer is measured on a 16 GB card (RTX 5060 Ti).

## Your own language models

The writer can also be a GGUF file from `models/LLM` (or LM Studio's folder, the Hugging Face cache) or a model of a running LM Studio, Ollama, llama.cpp ... - see [Local LLMs](concepts/local-llm.md). Those files are not in the catalogue; the System Check counts what it finds.

## Plenio assets

Some models are not ComfyUI model files but run in a separate Plenio worker. Plenio fetches them itself, pinned to an exact revision, when a node first needs them - **0 · System Check** lists them with their folder and whether they are there:

| Asset | Used by | Size | Where |
|---|---|---|---|
| Qwen3-ASR 1.7B | the lyrics ASR: *Transcribe Lyrics* (covers with the original lyrics, *Check sung lyrics*) and the lyrics subtitles of *Export Release* (every song template) | 4.1 GB | `ComfyUI/models/plenio/asr/qwen3-asr-1.7b-hf` |
| Qwen3-ForcedAligner 0.6B | the word times of the lyrics ASR (with Qwen3-ASR) | 1.8 GB | `ComfyUI/models/plenio/asr/qwen3-forcedaligner-0.6b-hf` |
| faster-whisper large-v3 | the lyrics ASR for a language the aligner cannot time (Dutch, Swedish, Polish, Turkish ...), and *Transcribe Lyrics* set to it; needs the optional `faster-whisper` package | 3.1 GB | `ComfyUI/models/plenio/asr/faster-whisper-large-v3` |

Qwen3-ASR runs on ComfyUI's own `transformers` (5.5 or newer): Plenio ships the model's inference code (from transformers 5.17, Apache-2.0) and installs nothing.

- `PLENIO_OFFLINE=1` or `PLENIO_AUTO_DOWNLOAD=0` turn this off; the node then names the files to place.
- An existing copy elsewhere: point `[asset_paths]` in the Plenio `config.toml` at it (see [Configuration](configuration.md)).

## Existing model folders

If your models live outside `ComfyUI/models`, add the folders to ComfyUI's `extra_model_paths.yaml` (the standard ComfyUI way). Plenio's templates and the System Check find files there too.

ComfyUI searches a folder of such a location only when the file names it - one line per folder, such as `checkpoints: checkpoints`. Plenio's own folders need no line: **`audio_separation`**, **`audio_sr`** and **`LLM`** are also searched beside every model folder ComfyUI knows. With

```yaml
shared:
  base_path: D:/AI/models
  checkpoints: checkpoints
  text_encoders: text_encoders
```

the stem model can lie in `D:/AI/models/audio_separation` (a folder made while ComfyUI runs counts after pressing R). ComfyUI's own folders keep ComfyUI's rule: `audio_encoders` (SheetSage2), `diffusion_models`, `vae` ... need their line. When a model file the templates load lies in such a folder without its line, the **System Check** names the file and the folder, and says which line to add.

## Licences

The licences above apply to the weights and, for the non-commercial ones, to what you make with them. See [Licensing](licensing.md).
