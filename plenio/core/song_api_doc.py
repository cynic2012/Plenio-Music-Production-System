"""The Song API described for programs: an OpenAPI 3.1 document, made from the same field lists the API checks
requests against - so it is as current as the templates (``GET /plenio/api/v1/openapi.json``)."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from .song_api import API_NAME, API_VERSION, DOCUMENT_LIMIT, LINE_LIMIT, TEXT_LIMIT, Field, Template

JOB_STATUSES = ("queued", "running", "succeeded", "failed", "cancelled", "waiting_for_review")
"""``waiting_for_review`` is reserved: a run stopped at a Song Sheet (review stops are not in v1)."""


def _schema(field: Field) -> dict[str, Any]:
    out: dict[str, Any]
    if field.type in ("text", "string", "upload"):
        out = {"type": "string", "maxLength": TEXT_LIMIT if field.type == "text" else LINE_LIMIT}
    elif field.type == "integer":
        out = {"type": "integer"}
    elif field.type == "number":
        out = {"type": "number"}
    elif field.type == "boolean":
        out = {"type": "boolean"}
    else:
        out = {"type": "string"}
        if field.choices:
            out["enum"] = list(field.choices)
    if field.type in ("integer", "number"):
        if field.minimum is not None:
            out["minimum"] = field.minimum
        if field.maximum is not None:
            out["maximum"] = field.maximum
    if field.type == "choice" and field.node_type == "PlenioSongBrief" and field.input == "length":
        out = {"oneOf": [out, {"type": "number", "description": "seconds: the nearest length"}]}
    out["title"] = field.label
    description = field.description
    if field.when:
        description += " " + "; ".join(
            f"Only when {parent} is {', '.join(values)}." for parent, values in field.when
        )
    if field.fixed:
        description += " Fixed in API v1 (no review stops)."
        out["const"] = field.default
    if description.strip():
        out["description"] = description.strip()
    out["default"] = field.default
    return out


def _request(template: Template) -> dict[str, Any]:
    return {
        "type": "object",
        "required": ["template"],
        "additionalProperties": False,
        "properties": {
            "template": {"const": template.id},
            "fields": {
                "type": "object",
                "properties": {f.id: _schema(f) for f in template.fields},
                "required": [f.id for f in template.fields if f.required],
            },
            "release": {"type": "object", "properties": {f.id: _schema(f) for f in template.release}},
            "seeds": {
                "type": "object",
                "properties": {
                    s.id: {"type": "integer", "minimum": 0, "maximum": 2**32 - 1, "title": s.title}
                    for s in template.seeds
                },
            },
            "documents": {
                "type": "object",
                "description": (
                    "Documents the Song Sheets keep as manual: the run keeps them instead of writing or planning "
                    "them anew. A song's documents with a new take seed make a new take of it (POST /from-record "
                    "gives them)."
                ),
                "properties": {
                    kind: {"type": "string", "maxLength": DOCUMENT_LIMIT} for kind in template.documents
                },
                "additionalProperties": False,
            },
            "client": {
                "type": "object",
                "description": "Who asks (kept with the job, shown in its listing): a name, a user, a reference.",
                "additionalProperties": {"type": "string"},
            },
            "strict": {
                "type": "boolean",
                "default": True,
                "description": "false: unknown fields are left out (named in warnings) instead of refused.",
            },
        },
    }


def openapi(templates: Iterable[Template], *, plenio: str = "", comfyui: str = "") -> dict[str, Any]:
    templates = list(templates)
    error = {"$ref": "#/components/schemas/Error"}
    job = {"$ref": "#/components/schemas/Job"}

    def answer(schema: dict[str, Any], text: str = "OK") -> dict[str, Any]:
        return {"description": text, "content": {"application/json": {"schema": schema}}}

    errors = {
        code: answer(error, text)
        for code, text in (("400", "Refused (the error says which field and why)"), ("404", "Not found"))
    }
    requests = [{"$ref": f"#/components/schemas/JobRequest_{t.id.replace('-', '_')}"} for t in templates]
    return {
        "openapi": "3.1.0",
        "info": {
            "title": "Plenio Song API",
            "version": API_VERSION,
            "description": (
                "Make songs with the Plenio Music Production System on a running ComfyUI: choose a template, give its "
                "fields (the song part of the workflow), queue the job, follow it. "
                f"Plenio {plenio}, ComfyUI {comfyui}. The fields are read from the templates themselves."
            ),
            "x-api-name": API_NAME,
        },
        "servers": [{"url": "/plenio/api/v1"}],
        "paths": {
            "/": {
                "get": {
                    "summary": "The API: versions, templates, paths",
                    "responses": {"200": answer({"type": "object"})},
                }
            },
            "/templates": {
                "get": {
                    "summary": "The templates the API runs",
                    "responses": {"200": answer({"type": "object"})},
                }
            },
            "/templates/{id}": {
                "get": {
                    "summary": "A template's fields, release fields and seeds",
                    "parameters": [
                        {
                            "name": "id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string", "enum": [t.id for t in templates]},
                        }
                    ],
                    "responses": {"200": answer({"type": "object"}), **errors},
                }
            },
            "/briefs": {
                "get": {
                    "summary": "The style templates and every value their fields have (the lists of a simple form)",
                    "parameters": [
                        {
                            "name": "kind",
                            "in": "query",
                            "schema": {"type": "string", "enum": ["song", "cover"]},
                        }
                    ],
                    "responses": {"200": answer({"type": "object"})},
                }
            },
            "/uploads": {
                "post": {
                    "summary": "A source recording for a cover (the body); the answer's name goes into source.audio",
                    "parameters": [
                        {"name": "name", "in": "query", "required": True, "schema": {"type": "string"}}
                    ],
                    "requestBody": {
                        "content": {"audio/*": {"schema": {"type": "string", "format": "binary"}}}
                    },
                    "responses": {
                        "201": answer(
                            {
                                "type": "object",
                                "properties": {"name": {"type": "string"}, "bytes": {"type": "integer"}},
                            }
                        ),
                        **errors,
                    },
                }
            },
            "/jobs": {
                "get": {
                    "summary": "The jobs made through the API that ComfyUI still knows",
                    "responses": {"200": answer({"type": "object"})},
                },
                "post": {
                    "summary": "Make a song",
                    "parameters": [
                        {
                            "name": "Idempotency-Key",
                            "in": "header",
                            "schema": {"type": "string"},
                            "description": "The same key again returns the first job.",
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {"oneOf": requests} if requests else {"type": "object"}
                            }
                        },
                    },
                    "responses": {"201": answer(job, "Queued"), **errors},
                },
            },
            "/from-record": {
                "post": {
                    "summary": "The request that makes a record's song again (a new take of it, or a new song)",
                    "description": (
                        "The body is a release record (<name>.plenio.json). The answer is a job request - template, "
                        "fields, release, seeds, documents - as the record's prompt has them, with 'take' (whether "
                        "its documents make a new take here) and 'warnings' (values the template no longer takes). "
                        "Leave out seeds.take for a new take; the documents and the seeds for a new song."
                    ),
                    "requestBody": {
                        "required": True,
                        "content": {"application/json": {"schema": {"type": "object"}}},
                    },
                    "responses": {
                        "200": answer({"$ref": "#/components/schemas/FromRecord"}),
                        **errors,
                        "422": answer(error, "No template makes the record's song"),
                    },
                }
            },
            "/jobs/{id}": {
                "get": {
                    "summary": "A job",
                    "parameters": [
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {"200": answer(job), **errors},
                },
                "delete": {
                    "summary": "Cancel a job",
                    "parameters": [
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {"200": answer(job), **errors},
                },
            },
            "/queue": {
                "get": {
                    "summary": "How busy ComfyUI is, and how long API runs took lately",
                    "responses": {"200": answer({"type": "object"})},
                }
            },
        },
        "components": {
            "schemas": {
                "Error": {
                    "type": "object",
                    "properties": {
                        "error": {
                            "type": "object",
                            "required": ["code", "message"],
                            "properties": {
                                "code": {"type": "string"},
                                "message": {"type": "string"},
                                "hint": {"type": "string"},
                                "field": {"type": "string"},
                                "details": {},
                            },
                        }
                    },
                },
                "Job": {
                    "type": "object",
                    "required": ["id", "status"],
                    "properties": {
                        "id": {"type": "string", "description": "ComfyUI's prompt id"},
                        "template": {"type": "string"},
                        "status": {"type": "string", "enum": list(JOB_STATUSES)},
                        "queue_position": {"type": ["integer", "null"], "description": "1: next to run"},
                        "created_at": {"type": ["number", "null"]},
                        "started_at": {"type": ["number", "null"]},
                        "finished_at": {"type": ["number", "null"]},
                        "stage": {"type": ["object", "null"]},
                        "seeds": {"type": "object"},
                        "documents": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "The documents given (kept as manual)",
                        },
                        "result": {"type": ["object", "null"]},
                        "error": {"type": ["object", "null"]},
                        "warnings": {"type": "array", "items": {"type": "string"}},
                    },
                },
                "FromRecord": {
                    "type": "object",
                    "properties": {
                        "template": {"type": "string"},
                        "kind": {"type": "string", "enum": ["song", "cover"]},
                        "title": {"type": "string"},
                        "model": {"type": "string", "description": "The music model the song was made with"},
                        "fields": {"type": "object"},
                        "release": {"type": "object"},
                        "seeds": {"type": "object"},
                        "documents": {"type": "object"},
                        "take": {
                            "type": "object",
                            "properties": {"possible": {"type": "boolean"}, "why": {"type": "string"}},
                        },
                        "warnings": {"type": "array", "items": {"type": "string"}},
                    },
                },
                **{f"JobRequest_{t.id.replace('-', '_')}": _request(t) for t in templates},
            }
        },
    }
