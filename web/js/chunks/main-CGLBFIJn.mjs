import { api as Ko } from "../../../../scripts/api.js";
import { app as Un } from "../../../../scripts/app.js";
class re extends Error {
  constructor(t, n = null) {
    super(t), this.hint = n;
  }
  hint;
}
async function se(e, t, n) {
  const o = await e.fetchApi(t, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(n)
  }), r = await o.json();
  if (!o.ok) {
    const s = r?.error ?? {};
    throw new re(s.message ?? `Request failed (${o.status})`, s.hint ?? null);
  }
  return r;
}
function Zo(e, t) {
  return se(e, "/plenio/sheet/resolve", t);
}
async function Ki(e, t) {
  if (!/^[0-9a-f]{64}$/.test(t)) return null;
  const n = await e.fetchApi(`/plenio/asr/notes/${t}`);
  return n.ok ? (await n.json())?.note ?? null : null;
}
function Gt(e, t, n) {
  return t ? n?.length ? { ...e, lyrics: t, lyric_spans: n } : { ...e, lyrics: t } : e;
}
function Zi(e, t, n, o) {
  return se(e, "/plenio/score/analyze", Gt({ abc: t }, n, o));
}
function ea(e, t, n, o, r) {
  return se(e, "/plenio/score/transform", Gt({ abc: t, operation: n }, o, r));
}
function ta(e, t) {
  const { lyrics: n, spans: o, ...r } = t;
  return se(e, "/plenio/score/musicxml/export", Gt(r, n, o));
}
function na(e, t) {
  return se(e, "/plenio/score/midi/export", t);
}
function oa(e, t) {
  return se(e, "/plenio/score/midi/import", t);
}
function ra(e, t) {
  return se(e, "/plenio/lyrics/analyze", t);
}
function sa(e, t) {
  const o = `/view?${new URLSearchParams({ filename: t.filename, subfolder: t.subfolder, type: t.type }).toString()}`;
  return e.apiURL ? e.apiURL(o) : `/api${o}`;
}
function nn(e, t, n, o = 200) {
  return se(e, "/plenio/eq/response", { settings: t, sample_rate: n, points: o });
}
function er(e, t) {
  return se(e, "/plenio/brief/fields", t);
}
async function tr(e) {
  const t = await e.fetchApi("/plenio/presets/eq");
  if (!t.ok) throw new re(`Request failed (${t.status})`);
  return await t.json();
}
async function ia(e) {
  const t = await e.fetchApi("/plenio/records"), n = await t.json();
  if (!t.ok) {
    const o = n?.error ?? {};
    throw new re(o.message ?? `Request failed (${t.status})`, o.hint ?? null);
  }
  return n?.records ?? [];
}
function nr(e, t) {
  return se(e, "/plenio/records/continue", t);
}
function te(e, t) {
  return function(...n) {
    e?.apply(this, n), t.apply(this, n);
  };
}
const Fe = [
  "description",
  "genre",
  "mood",
  "tempo",
  "key",
  "meter",
  "language",
  "voice",
  "theme",
  "lead_instrument"
], or = ["length", "vocals", "melody"], Vt = {
  description: "description",
  genre: "genre",
  mood: "mood",
  tempo: "tempo",
  key: "key",
  meter: "meter",
  length: "length",
  vocals: "vocals",
  language: "vocals.language",
  voice: "vocals.voice",
  theme: "vocals.theme",
  melody: "vocals.melody",
  lead_instrument: "vocals.lead_instrument"
}, rr = "custom";
function Xn(e) {
  return typeof e == "string" && e.trim().toLowerCase() === rr;
}
function Oe(e, t) {
  const n = Vt[t];
  if (n)
    return (e.widgets ?? []).find((o) => o.name === n);
}
function sr(e) {
  const t = {};
  for (const n of [...Fe, ...or]) {
    const o = Oe(e, n);
    o && (t[n] = typeof o.value == "string" ? o.value : String(o.value ?? ""));
  }
  return t;
}
function ir(e) {
  return (e.comfyClass ?? e.type) === "PlenioCoverBrief" ? "cover" : "song";
}
function on(e, t) {
  const n = [];
  for (const o of t.fills) {
    if (!Fe.includes(o.field)) continue;
    const r = Oe(e, o.field);
    r && !String(r.value ?? "").trim() && o.value && n.push({ field: o.field, value: o.value });
  }
  return n;
}
function rn(e) {
  const t = [];
  for (const n of Fe) {
    const o = Oe(e, n);
    o && String(o.value ?? "").trim() && t.push(o);
  }
  return t;
}
function Ot(e) {
  return e.choices.filter((t) => t.suggested && t.suggested !== t.current).map((t) => ({ field: t.field, value: t.suggested }));
}
function ar(e, t) {
  return !t || !e || e.template === "none" ? null : e.fills.length ? `Template fills: ${e.fills.map((o) => `${o.field} (${dr(o.value)})`).join(", ")}` : "The template fills nothing: every text field has your value.";
}
function lr(e) {
  const t = e ? Ot(e) : [];
  return t.length ? `The template suggests: ${t.map((n) => `${n.field} = ${n.value}`).join(", ")}` : null;
}
function cr(e) {
  return e?.notes.length ? e.notes.join("; ") : null;
}
function ur(e) {
  const t = e?.mode;
  return t?.description ? `Creative mode ${t.name} (experimental): ${t.description}` : null;
}
function dr(e, t = 44) {
  const n = e.replace(/\s+/g, " ").trim();
  return n.length > t ? `${n.slice(0, t - 1)}…` : n;
}
function sn(e, t) {
  for (const n of t) {
    const o = Oe(e, n.field);
    o && (o.value = n.value, o.callback?.(n.value));
  }
  e.setDirtyCanvas?.(!0, !0);
}
function fr(e, t) {
  for (const n of t)
    n.value = "", n.callback?.("");
  e.setDirtyCanvas?.(!0, !0);
}
function Yn(e) {
  const t = [];
  for (const n of Fe) {
    const o = Oe(e, n);
    !o || !Xn(o.value) || (o.value = "", o.callback?.(""), t.push(n));
  }
  return t.length && e.setDirtyCanvas?.(!0, !0), t;
}
const an = "plenio_brief_template", pr = 400;
function hr(e, t) {
  let n = null, o = !1, r = null, s;
  const i = document.createElement("div");
  i.className = "plenio-brief-template";
  const a = document.createElement("div");
  a.className = "line";
  const l = document.createElement("div");
  l.className = "hint";
  const f = document.createElement("div");
  f.className = "mode";
  const p = document.createElement("div");
  p.className = "actions", i.append(a, l, f, p);
  const m = (g, b, y) => {
    const L = document.createElement("button");
    return L.textContent = g, L.title = b, L.addEventListener("click", (E) => {
      E.stopPropagation(), y();
    }), p.append(L), L;
  }, S = m("Copy template text", "Fill every empty text field with the template’s text", () => {
    n && (sn(e, on(e, n).map((g) => ({ field: g.field, value: g.value }))), k());
  }), _ = m("Use template choices", "Set length, vocals and melody to the template’s choices", () => {
    n && (sn(e, Ot(n)), k());
  }), R = m("Reset all to template", "Clear every text field you typed into (they fall back to the template)", () => {
    const g = rn(e);
    g.length && window.confirm(`Clear ${g.length} text field(s)? The template's values apply again.`) && (fr(e, g), k());
  }), M = m("↻", "Ask again what the template fills", () => {
    A();
  }), k = () => {
    const g = ar(n, o);
    a.textContent = r ?? g ?? "The template fills nothing: every text field has your value.", a.dataset.state = r ? "error" : o && n ? "ok" : "empty";
    const b = lr(n), y = cr(n);
    l.textContent = [b, y].filter(Boolean).join(" · "), l.style.display = l.textContent ? "" : "none", f.textContent = ur(n) ?? "", f.style.display = f.textContent ? "" : "none", p.style.display = o && n && n.template !== "none" ? "" : "none", S.disabled = !n || !on(e, n).length, _.disabled = !n || !Ot(n).length, R.disabled = !rn(e).length, M.disabled = !1, e.setDirtyCanvas?.(!0, !0);
  }, H = /* @__PURE__ */ new WeakSet(), u = () => {
    for (const g of ["template", "arrangement", ...Object.keys(Vt)]) {
      const b = g === "template" || g === "arrangement" ? e.widgets?.find((y) => y.name === g) : Oe(e, g);
      !b || H.has(b) || (H.add(b), b.callback = te(b.callback, () => {
        u(), A();
      }));
    }
  }, W = async () => {
    u();
    const g = String(e.widgets?.find((b) => b.name === "template")?.value ?? "none");
    try {
      const b = String(e.widgets?.find((y) => y.name === "arrangement")?.value ?? "");
      n = await er(t, { fields: sr(e), template: g, kind: ir(e), arrangement: b }), r = null;
    } catch (b) {
      n = null, r = `The template fields could not be read: ${b instanceof Error ? b.message : String(b)}`;
    }
    o = !0, k();
  };
  function A() {
    clearTimeout(s), s = setTimeout(() => {
      W();
    }, pr);
  }
  u();
  const w = e.addDOMWidget(an, an, i, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 64,
    getMaxHeight: () => 128
  });
  return w.serialize = !1, Yn(e), k(), A(), {
    widget: w,
    refresh: A,
    answer: () => n,
    dispose: () => clearTimeout(s)
  };
}
const mr = /* @__PURE__ */ new Set(["PlenioSongBrief", "PlenioCoverBrief"]);
function gr(e, t) {
  const n = /* @__PURE__ */ new WeakMap(), o = e.prototype, r = o.onNodeCreated;
  o.onNodeCreated = function() {
    r?.call(this), n.set(this, hr(this, t));
  };
  const s = o.onConfigure;
  o.onConfigure = function(i) {
    s?.call(this, i), Yn(this), n.get(this)?.refresh();
  };
}
const ln = "plenio.record/1", br = 2, wr = "PLNO", Je = new TextEncoder().encode(`${wr}plenio.project/1\0`), cn = 32 * 2 ** 20;
class de extends Error {
}
async function vt(e, t, n) {
  return new Uint8Array(await e.slice(t, t + n).arrayBuffer());
}
function xt(e, t) {
  return e.length >= t.length && t.every((n, o) => e[o] === n);
}
async function yr(e) {
  const t = e.stream().pipeThrough(new DecompressionStream("gzip")).getReader(), n = [];
  let o = 0;
  for (; ; ) {
    const { done: i, value: a } = await t.read();
    if (i) break;
    if (o += a.length, o > cn)
      throw await t.cancel(), new de(`its Plenio project is larger than ${cn / 2 ** 20} MB`);
    n.push(a);
  }
  const r = new Uint8Array(o);
  let s = 0;
  for (const i of n)
    r.set(i, s), s += i.length;
  return new TextDecoder().decode(r);
}
async function Jn(e) {
  if (!xt(await vt(e, 0, 4), new TextEncoder().encode("fLaC"))) throw new de("it is not a FLAC file");
  let t = 4;
  for (; ; ) {
    const n = await vt(e, t, 4);
    if (n.length < 4) throw new de("the file ends inside its metadata");
    const o = n[1] << 16 | n[2] << 8 | n[3];
    if ((n[0] & 127) === br && o >= 4) {
      const r = await vt(e, t + 4, Math.min(o, Je.length));
      if (xt(r, Je.subarray(0, 4))) {
        if (!xt(r, Je)) throw new de("it holds a Plenio project of an unknown layout (made by a newer Plenio)");
        let s;
        try {
          s = await yr(e.slice(t + 4 + Je.length, t + 4 + o));
        } catch (a) {
          throw a instanceof de ? a : new de(`its Plenio project is damaged (${a instanceof Error ? a.message : String(a)})`);
        }
        let i;
        try {
          i = JSON.parse(s);
        } catch {
          throw new de("its Plenio project is damaged (no JSON)");
        }
        if (i?.schema !== ln)
          throw new de(`its Plenio project is no release record (${ln})`);
        return i;
      }
    }
    if (n[0] & 128) return null;
    t += 4 + o;
  }
}
function Qn(e) {
  return /\.flac$/i.test(e.name ?? "") || e.type === "audio/flac" || e.type === "audio/x-flac";
}
const Ut = "plenio.sheet_state/1", We = ["title", "style", "lyrics", "score", "artwork_prompt"];
function ht() {
  return { schema: Ut, docs: {} };
}
function Se(e) {
  if (e == null || typeof e == "string" && e.trim() === "")
    return ht();
  if (typeof e != "string") return null;
  try {
    const t = JSON.parse(e);
    return t?.schema !== Ut || typeof t.docs != "object" || t.docs === null ? null : t;
  } catch {
    return null;
  }
}
function De(e) {
  const t = {};
  for (const o of We) {
    const r = e.docs[o];
    r && (t[o] = r);
  }
  const n = { schema: Ut, docs: t };
  return e.review?.approved_fingerprint && (n.review = { approved_fingerprint: e.review.approved_fingerprint }), JSON.stringify(n);
}
function _t(e, t) {
  return e.docs[t]?.state ?? "auto";
}
function vr(e) {
  if (e === null) return "Song Sheet state is unreadable - open the editor to repair it.";
  const t = We.filter((o) => _t(e, o) !== "auto").map(
    (o) => o === "lyrics" && _t(e, o) === "manual" ? "lyrics: yours (manual)" : `${o.replace("_", " ")} ${_t(e, o)}`
  ), n = e.review?.approved_fingerprint ? " · approved" : "";
  return (t.length ? t.join(" · ") : "all documents automatic") + n;
}
function aa(e) {
  const t = e.harmony?.after;
  if (!t) return "";
  const n = (r) => `${Math.round(r * 100)} %`, o = [
    `melody ${n(t.melody_on_chord)} on chord tones`,
    `${t.accented_avoid} accented clash${t.accented_avoid === 1 ? "" : "es"} with a chord`,
    `${t.clashes} between voice and line`,
    `chords ${n(t.chords_in_key)} in the key`
  ];
  return `Harmony check (${e.harmony?.genre ?? "pop"}): ${o.join(" · ")}`;
}
const la = "Creative modes are experimental: the writer’s plan can surprise - listen, change the score here, or run again with another arrangement seed; arrangement off keeps the music model’s own plan.";
function ca(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) t.set(n, (t.get(n) ?? 0) + 1);
  return [...t].map(([n, o]) => o > 1 ? `${n} (${o} times)` : n);
}
function ua(e) {
  const t = e.kind === "cover" ? "song flow closeness" : "genre closeness";
  return `${e.mode} (${t} ${e.closeness})`;
}
function un(e) {
  const t = Math.max(0, e), n = Math.floor(t / 60), o = Math.round(t - n * 60);
  return `${n}:${String(o).padStart(2, "0")}`;
}
function da(e) {
  return e?.bars?.length ? (e.sections ?? []).map(([t, n, o]) => {
    const r = e.bars[Math.max(0, n - 1)], s = e.bars[Math.min(e.bars.length - 1, n - 1 + o - 1)];
    return { label: t, bars: o, start: un(r?.[0] ?? 0), end: un(s?.[1] ?? e.duration_s) };
  }) : [];
}
function _e(e) {
  const t = e.replace(/\r\n?/g, `
`).split(`
`).map((r) => r.replace(/\s+$/, ""));
  let n = 0, o = t.length;
  for (; n < o && !t[n]; ) n++;
  for (; o > n && !t[o - 1]; ) o--;
  return t.slice(n, o).join(`
`);
}
function xr(e, t, n) {
  const o = e.docs[n];
  return o ? o.text : t?.docs[n]?.upstream ?? "";
}
function fa(e, t, n) {
  return n.map((o) => ({ kind: o, text: xr(e, t, o), intent: "keep" }));
}
function Kn(e, t, n) {
  const o = { ...e.docs };
  for (const s of n) {
    const i = e.docs[s.kind], a = t?.docs[s.kind], l = _e(s.text);
    if (s.intent === "auto")
      delete o[s.kind];
    else if (s.intent === "manual")
      o[s.kind] = { state: "manual", text: l };
    else if (s.intent === "rebase")
      a?.upstream_sha256 ? o[s.kind] = { state: "edited", text: l, base_sha256: a.upstream_sha256 } : o[s.kind] = { state: "manual", text: l };
    else if (i)
      _e(i.text) !== l && (o[s.kind] = { ...i, text: l });
    else {
      const f = _e(a?.upstream ?? "");
      if (l === f) continue;
      o[s.kind] = a?.upstream_sha256 ? { state: "edited", text: l, base_sha256: a.upstream_sha256 } : { state: "manual", text: l };
    }
  }
  const r = { ...ht(), docs: o };
  return e.review?.approved_fingerprint && (r.review = { approved_fingerprint: e.review.approved_fingerprint }), r;
}
function _r(e, t) {
  return t ? { ...e, review: { approved_fingerprint: t } } : { ...e, review: void 0 };
}
function Zn(e, t) {
  return We.filter((n) => e.includes(n) || t.docs[n]?.state === "manual");
}
function Sr(e) {
  const t = {};
  for (const n of e?.owned ?? []) t[n] = e?.docs[n]?.upstream ?? null;
  return t;
}
const kr = "PlenioSongSheet";
function eo(e) {
  return e.nodes ?? e._nodes ?? [];
}
function Er(e, t) {
  return e.getNodeById?.(t) ?? e.getNodeById?.(Number(t)) ?? eo(e).find((o) => String(o.id) === t) ?? null;
}
function St(e, t) {
  let n = e, o = null;
  for (const r of t.split(":")) {
    if (!n || (o = Er(n, r), !o)) return null;
    n = o.subgraph;
  }
  return o;
}
function Mr(e, t) {
  const n = [], o = Object.keys(t).sort((r, s) => r.split(".").length - s.split(".").length);
  for (const r of o) {
    const s = e.widgets?.find((a) => a.name === r);
    if (!s) {
      n.push(r);
      continue;
    }
    const i = t[r];
    s.value !== i && (s.value = i, s.callback?.(i));
  }
  return n;
}
function $r(e, t) {
  const n = { values: 0, missing: [], sheets: 0, activated: 0 };
  for (const o of t.activate) {
    const r = St(e, o);
    r && r.mode !== 0 && (r.mode = 0, n.activated++);
  }
  for (const [o, r] of Object.entries(t.values)) {
    const s = St(e, o);
    if (!s) {
      n.missing.push(...Object.keys(r).map((a) => `${o}: ${a}`));
      continue;
    }
    const i = Mr(s, r);
    n.values += Object.keys(r).length - i.length, n.missing.push(...i.map((a) => `${s.type}: ${a}`));
  }
  for (const [o, r] of Object.entries(t.sheets)) {
    const s = St(e, o)?.widgets?.find((i) => i.name === "sheet_state");
    s && (s.value = r, s.callback?.(r), n.sheets++);
  }
  return n;
}
function Ar(e, t) {
  let n = 0;
  for (const o of eo(e)) {
    if (o.type !== kr) continue;
    const r = o.widgets?.find((m) => m.name === "sheet_state");
    if (!r) continue;
    const s = Se(r.value) ?? { schema: "plenio.sheet_state/1", docs: {} }, i = (o.inputs ?? []).filter((m) => m.link != null).map((m) => m.name), a = Zn(i, s), l = (a.length ? a : [...We]).filter((m) => !!t[m]);
    if (!l.length) continue;
    const f = { ...s.docs };
    for (const m of l) f[m] = { state: "manual", text: t[m] };
    const p = De({ ...s, docs: f, review: void 0 });
    r.value = p, r.callback?.(p), n++;
  }
  return n;
}
function Lr(e, t) {
  return (e.split(/[\\/]/).pop() ?? "").replace(/\.plenio\.json$/i, "").replace(/\.(json|flac)$/i, "") || t || "Plenio song";
}
function kt(e, t) {
  const n = [e.plenio && `Plenio ${e.plenio}`, e.created.slice(0, 10)].filter(Boolean).join(", "), o = t?.sheets ? " Its title, style, lyrics and score are kept in the Song Sheets (manual): a new take seed gives new takes of the same song, the editor changes the score, Back to auto lets the workflow write a document again." : "";
  if (e.from === "record") return `"${e.title}" opened in the workflow it was made with (${n}).${o}`;
  if (e.from === "template") {
    const r = e.unplaced.length ? ` ${e.unplaced.length} node(s) of the song have no place in today's template: ${e.unplaced.join(", ")}.` : "";
    return `"${e.title}" (${n}) opened in today's template "${e.template}" with the song's settings.${o}${r}`;
  }
  return `The workflow "${e.title}" was made with cannot be rebuilt (a workflow of your own, from before records kept it).`;
}
const qt = "Plenio was updated while this page was open: reload the page (F5).";
function Nr(e) {
  const t = /\/chunks\/(main-[^/?#]+\.mjs)(?:[?#].*)?$/.exec(e);
  return t ? t[1] : null;
}
function Tr(e) {
  return /chunks\/(main-[^"'?#\s]+\.mjs)/.exec(e)?.[1] ?? null;
}
async function Xt(e, t) {
  const n = Nr(e);
  if (!n) return !1;
  try {
    const o = await t(new URL("../plenio.js", e).href), r = o ? Tr(o) : null;
    return r !== null && r !== n;
  } catch {
    return !1;
  }
}
async function Yt(e) {
  const t = await fetch(e, { cache: "no-store" });
  return t.ok ? await t.text() : null;
}
async function Re(e, t, n = "") {
  try {
    return await e();
  } catch (o) {
    throw await t() ? new Error(n ? `${qt} ${n}` : qt) : o;
  }
}
const dn = "Plenio.ContinueSong", Cr = "plenio.record/1";
function It(e, t, n, o, r = 2e4) {
  e.app.extensionManager?.toast?.add({ severity: t, summary: n, detail: o, life: r });
}
async function Pt(e, t) {
  const n = await nr(e.fetcher, t);
  if (n.workflow) {
    if (!e.app.loadGraphData) throw new Error("This ComfyUI frontend cannot load a workflow for Plenio.");
    await e.app.loadGraphData(n.workflow, !0, !0, Lr("path" in t ? t.path : t.name, n.title));
    const s = e.app.graph;
    if (!s) throw new Error("The workflow did not load.");
    const i = $r(s, n);
    s.setDirtyCanvas?.(!0, !0), i.missing.length && console.warn("Plenio: settings of the song without a field in this workflow", i.missing), It(e, "success", "Song opened", kt(n, i));
    return;
  }
  const o = e.app.graph, r = o ? Ar(o, n.documents) : 0;
  if (!r)
    throw new re(
      kt(n, null),
      "Open a workflow with a Song Sheet (a Plenio template) and continue again: the song's texts and score then go into its Song Sheets."
    );
  It(e, "success", "Song texts taken", `${kt(n, null)} Its texts and score went into this workflow's Song Sheets (${r}, manual).`);
}
async function Or(e) {
  if (Qn(e)) return Jn(e);
  if (!/\.json$/i.test(e.name ?? "")) return null;
  try {
    const t = JSON.parse(await e.text());
    return t?.schema === Cr ? t : null;
  } catch {
    return null;
  }
}
function fn(e) {
  const t = [...e.dataTransfer?.files ?? []];
  return t.length === 1 && /\.plenio\.json$/i.test(t[0].name) ? t[0] : null;
}
function qr(e, t) {
  const n = [...e.dataTransfer?.files ?? []];
  if (n.length !== 1 || !Qn(n[0]) || e.shiftKey) return null;
  const o = t.canvas, r = t.graph;
  if (!o?.canvas || e.target !== o.canvas || !o.convertEventToCanvasOffset || !r?.getNodeOnPos) return null;
  const [s, i] = o.convertEventToCanvasOffset(e);
  return r.getNodeOnPos(s, i) ? null : n[0];
}
function Ir(e, t = window) {
  const n = (o) => {
    const r = fn(o) ? null : qr(o, e.app), s = r ?? fn(o);
    s && (o.preventDefault(), o.stopImmediatePropagation(), (async () => {
      if (r) {
        const a = await Jn(r);
        if (a) return Pt(e, { record: a, name: r.name });
        if (!e.app.handleFile) throw new re(`${r.name} carries no Plenio project.`, "Drop it with Shift held to give it to ComfyUI.");
        return e.app.handleFile(r);
      }
      const i = await Or(s);
      if (!i) throw new re(`${s.name} is no Plenio release record.`, "Drop the <name>.plenio.json that Export Release wrote next to the song.");
      await Pt(e, { record: i, name: s.name });
    })().catch((i) => {
      const a = i instanceof de ? `${s.name}: ${i.message}.` : i instanceof re && i.hint ? `${i.message} ${i.hint}` : String(i instanceof Error ? i.message : i);
      It(e, "error", "Song not opened", a, 3e4);
    }));
  };
  return t.addEventListener("drop", n, !0), () => t.removeEventListener("drop", n, !0);
}
async function Pr(e) {
  const t = () => Xt(import.meta.url, Yt), { openContinueDialog: n } = await Re(() => import("./openContinue-DVFvZmkl.mjs"), t);
  n(e.fetcher, (o) => Pt(e, o));
}
const Rr = "COMFY_DYNAMICCOMBO_V3";
function zr(e) {
  const t = e?.widgets_values_named;
  return t && typeof t == "object" && !Array.isArray(t) ? { ...t } : Array.isArray(e?.widgets_values) ? [...e.widgets_values] : void 0;
}
function Dr(e) {
  return (e.widgets ?? []).filter((t) => t.serialize !== !1);
}
function Br(e, t) {
  const n = Dr(e);
  return Array.isArray(t) ? n.length === t.length && n.every((o, r) => o.value === t[r]) : n.every((o) => !(o.name in t) || o.value === t[o.name]);
}
function Hr(e, t) {
  return (e.options?.values ?? []).includes(t);
}
function jr(e, t, n) {
  if (!t || !e.widgets || Br(e, t)) return !1;
  let o = 0;
  for (let r = 0; r < e.widgets.length; r++) {
    const s = e.widgets[r];
    if (s.serialize === !1) continue;
    let i;
    if (Array.isArray(t)) {
      if (o >= t.length) break;
      i = t[o++];
    } else if (s.name in t)
      i = t[s.name];
    else
      continue;
    if (n.has(s.name) && !Hr(s, i)) return !0;
    s.value !== i && (s.value = i);
  }
  return !0;
}
function Fr(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of Object.values(e ?? {}))
    for (const [o, r] of Object.entries(n ?? {}))
      Array.isArray(r) && r[0] === Rr && t.add(o);
  return t;
}
const to = "plenio.eq/1", it = 8, we = 20, Wr = 2e4, Ce = 12, no = 15, Ae = ["peak", "low_shelf", "high_shelf"], oo = ["peak", "notch", "highpass", "lowpass"], pn = [0.2, 10], hn = [0.25, 1];
function Me() {
  return { schema: to, preamp_db: 0, bands: [] };
}
function Gr(e) {
  if (typeof e != "string" || !e.trim()) return Me();
  try {
    const t = JSON.parse(e);
    return typeof t != "object" || t === null || !Array.isArray(t.bands) ? null : {
      schema: to,
      preamp_db: typeof t.preamp_db == "number" ? t.preamp_db : 0,
      bands: t.bands.map((n, o) => ({
        id: typeof n.id == "string" && n.id ? n.id : `band-${o + 1}`,
        enabled: n.enabled !== !1,
        type: n.type ?? "peak",
        frequency_hz: Number(n.frequency_hz ?? 1e3),
        gain_db: Number(n.gain_db ?? 0),
        q: Number(n.q ?? Math.SQRT1_2),
        slope: Number(n.slope ?? 1)
      }))
    };
  } catch {
    return null;
  }
}
function $e(e) {
  return JSON.stringify(e);
}
const J = (e, t) => Number(e.toFixed(t));
function G(e, t, n) {
  return Math.min(n, Math.max(t, e));
}
function ro(e) {
  return e.db ?? no;
}
const mn = [6, 12, 18], Vr = { 6: 8, 12: 14, 18: 20 };
function Ur(e, t) {
  return { ...e, db: Vr[t] ?? no };
}
function xe(e, t) {
  return Math.log(G(t, we, e.maxHz) / we) / Math.log(e.maxHz / we) * e.width;
}
function gn(e, t) {
  return we * (e.maxHz / we) ** G(t / e.width, 0, 1);
}
function be(e, t) {
  const n = ro(e);
  return (1 - (G(t, -n, n) + n) / (2 * n)) * e.height;
}
function bn(e, t) {
  const n = ro(e);
  return (1 - G(t / e.height, 0, 1)) * 2 * n - n;
}
function wn(e, t, n) {
  return n ? e + (t - e) * 0.2 : t;
}
function yn(e, t, n) {
  return t.map((o, r) => `${r ? "L" : "M"}${xe(e, o).toFixed(1)},${be(e, n[r] ?? 0).toFixed(1)}`).join(" ");
}
function Jt(e) {
  return Math.min(Wr, 0.45 * e);
}
function Xr(e) {
  const t = new Set(e.bands.map((o) => o.id));
  let n = e.bands.length + 1;
  for (; t.has(`band-${n}`); ) n++;
  return `band-${n}`;
}
function Yr(e, t, n = 0, o = 48e3) {
  if (e.bands.length >= it) return null;
  const r = {
    id: Xr(e),
    enabled: !0,
    type: "peak",
    frequency_hz: J(G(t, we, Jt(o)), 1),
    gain_db: J(G(n, -Ce, Ce), 1),
    q: 1,
    slope: 1
  };
  return { ...e, bands: [...e.bands, r] };
}
function qe(e, t, n, o, r = 48e3) {
  return {
    ...e,
    bands: e.bands.map(
      (s) => s.id !== t ? s : {
        ...s,
        frequency_hz: J(G(n, we, Jt(r)), 1),
        gain_db: Ae.includes(s.type) ? J(G(o, -Ce, Ce), 1) : s.gain_db
      }
    )
  };
}
function Et(e, t, n) {
  return {
    ...e,
    bands: e.bands.map((o) => o.id === t ? { ...o, q: J(G(o.q * n, 0.2, 10), 3) } : o)
  };
}
function Mt(e, t) {
  return { ...e, bands: e.bands.filter((n) => n.id !== t) };
}
function Ie(e) {
  const t = e.frequency_hz >= 1e3 ? `${J(e.frequency_hz / 1e3, 2)} kHz` : `${Math.round(e.frequency_hz)} Hz`, n = Ae.includes(e.type) ? ` ${e.gain_db > 0 ? "+" : ""}${J(e.gain_db, 1)} dB` : "";
  return `${e.type.replace("_", " ")} ${t}${n}, Q ${J(e.q, 2)}`;
}
function Jr(e, t) {
  const n = so[e.type] ?? e.type, o = e.frequency_hz >= 1e3 ? `${(e.frequency_hz / 1e3).toFixed(2)} kHz` : `${Math.round(e.frequency_hz)} Hz`, r = Ae.includes(e.type) ? ` ${e.gain_db > 0 ? "+" : ""}${e.gain_db.toFixed(1)} dB` : "", s = oo.includes(e.type) ? ` Q ${J(e.q, 2)}` : "";
  return `● ${t + 1} ${n} ${o}${r}${s}${e.enabled ? "" : " (off)"}`;
}
const so = {
  peak: "Bell",
  low_shelf: "Low shelf",
  high_shelf: "High shelf",
  highpass: "Low cut",
  lowpass: "High cut",
  notch: "Notch"
};
function $t(e, { kilo: t = !1 } = {}) {
  let n = e.trim().replace(",", ".").replace(/\s*(hz|db)$/i, ""), o = 1;
  if (t && /k$/i.test(n) && (o = 1e3, n = n.slice(0, -1).trim()), !/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(n)) return null;
  const r = Number(n) * o;
  return Number.isFinite(r) ? r : null;
}
function Qe(e, t) {
  const n = Number(e);
  return Number.isFinite(n) ? n : t;
}
function at(e, t, n, o = 48e3) {
  return {
    ...e,
    bands: e.bands.map((r) => {
      if (r.id !== t) return r;
      const s = { ...r, ...n };
      return {
        ...s,
        frequency_hz: J(G(Qe(s.frequency_hz, r.frequency_hz), we, Jt(o)), 1),
        gain_db: J(G(Qe(s.gain_db, r.gain_db), -Ce, Ce), 1),
        q: J(G(Qe(s.q, r.q), pn[0], pn[1]), 3),
        slope: J(G(Qe(s.slope, r.slope), hn[0], hn[1]), 2),
        enabled: s.enabled !== !1
      };
    })
  };
}
function vn(e, t) {
  return at(e, t, { gain_db: 0 });
}
function xn(e, t, n, { heightFraction: o = 0.7 } = {}) {
  if (!t.length || t.length !== n.length) return "";
  const r = n.filter((m) => Number.isFinite(m));
  if (!r.length) return "";
  const s = Math.max(...r), i = Math.min(...r), a = Math.max(s - i, 1e-6), l = e.height - 4, f = l - Math.max(12, e.height * G(o, 0.1, 0.95));
  return `M${t.map((m, S) => {
    const _ = n[S], R = Number.isFinite(_) ? (_ - i) / a : 0;
    return `${xe(e, m).toFixed(1)},${(l - R * (l - f)).toFixed(1)}`;
  }).join(" L")} L${e.width.toFixed(1)},${l.toFixed(1)} L0,${l.toFixed(1)} Z`;
}
class Qr {
  constructor(t, n = 50) {
    this.limit = n, this.entries = [t];
  }
  limit;
  entries;
  index = 0;
  get current() {
    return this.entries[this.index];
  }
  get canUndo() {
    return this.index > 0;
  }
  get canRedo() {
    return this.index < this.entries.length - 1;
  }
  /** Record a new state (a duplicate of the current one is ignored). */
  push(t) {
    $e(t) !== $e(this.current) && (this.entries = this.entries.slice(0, this.index + 1), this.entries.push(t), this.entries.length > this.limit && this.entries.shift(), this.index = this.entries.length - 1);
  }
  undo() {
    return this.canUndo ? (this.index -= 1, this.current) : null;
  }
  redo() {
    return this.canRedo ? (this.index += 1, this.current) : null;
  }
  reset(t) {
    this.entries = [t], this.index = 0;
  }
}
const Kr = "http://www.w3.org/2000/svg", _n = "plenio_eq_panel", Ke = "mode.bands", he = { capture: !0 }, Z = { width: 560, height: 260 }, Ze = ["#4aa3ff", "#f0a35e", "#6fbf73", "#d873c8", "#e0c65a", "#5ac8c8", "#b28df0", "#e08a8a"];
let At = null;
function ce(e, t) {
  const n = document.createElementNS(Kr, e);
  for (const [o, r] of Object.entries(t)) n.setAttribute(o, String(r));
  return n;
}
function F(e, t, n) {
  const o = document.createElement(e);
  return t && (o.className = t), n !== void 0 && (o.textContent = n), o;
}
function ve(e, t, n) {
  const o = document.createElement("button");
  return o.className = e, o.textContent = t, o.setAttribute("aria-label", n), o.title = n, o;
}
function ue(e, t) {
  return e.widgets?.find((n) => n.name === t);
}
function Zr(e, t) {
  return e.bands.length === t.bands.length && e.bands.every((n, o) => {
    const r = t.bands[o];
    return r !== void 0 && n.type === r.type && n.enabled === r.enabled && Math.abs(n.frequency_hz - r.frequency_hz) < 0.5 && Math.abs(n.gain_db - r.gain_db) < 0.05 && Math.abs(n.q - r.q) < 0.01;
  });
}
function es(e, t) {
  const n = F("div", "plenio-eq"), o = F("div", "plenio-eq-tools"), r = F("select");
  r.setAttribute("aria-label", "EQ preset"), r.title = "EQ preset: sets every band at once (the list comes from resources/presets/eq.json)";
  const s = F("select");
  s.setAttribute("aria-label", "Gain range"), s.title = "Gain range: the dB axis of the curve and how far a drag may go";
  for (const c of mn) s.append(new Option(`±${c} dB`, String(c)));
  const i = ve("", "↶", "Undo the last band change"), a = ve("", "↷", "Redo the last band change"), l = ve("", "reset", "Remove every band"), f = ve("", "compare", "Show the curve without the EQ (bypass)"), p = ve("", "bands as text", "Show or hide the plenio.eq/1 JSON widget"), m = F("span", "plenio-eq-info");
  m.setAttribute("aria-live", "polite"), m.title = "What the panel is showing right now (the selected band, a note, or a hint)", o.append(r, s, i, a, l, f, p, m);
  const S = F("div", "plenio-eq-mode"), _ = ce("svg", {
    viewBox: `0 0 ${Z.width} ${Z.height}`,
    class: "plenio-eq-plot",
    role: "img",
    preserveAspectRatio: "none"
  });
  _.setAttribute("aria-label", "EQ response curve"), _.setAttribute("tabindex", "0"), _.setAttribute("title", "Drag a handle to move a band (Shift = fine), wheel = Q, double-click = new band, Delete = remove");
  const R = F("div", "plenio-eq-strip"), M = F("div", "plenio-eq-editor"), k = F("div", "plenio-eq-fields");
  M.append(k), n.append(o, S, _, R, M);
  const H = e.addDOMWidget(_n, _n, n, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 420,
    getMaxHeight: () => 620
  });
  H.serialize = !1;
  let u = { sampleRate: 48e3, frequencies: [], response: [], settings: Me(), readonly: !0, note: "" }, W = null, A = null, w = !1, g = 12, b = null, y = [], L = 0, E, V, z = null, P = !1;
  const D = /* @__PURE__ */ new Map();
  let j = null;
  const N = new Qr(Me()), pe = () => ue(e, Ke), Q = () => g, T = () => Ur({ ...Z, maxHz: Math.min(2e4, u.sampleRate / 2) }, Q());
  function O(c, { record: h = !0 } = {}) {
    const d = pe();
    if (!d) return;
    const v = $e(c);
    d.value = v, d.callback?.(v), h && N.push(c), u = { ...u, settings: c }, U(), ie(0);
  }
  async function ie(c = 120) {
    clearTimeout(E), E = setTimeout(async () => {
      const h = String(ue(e, "mode")?.value ?? "flat");
      if (h !== "manual") {
        h === "flat" ? u = {
          ...u,
          settings: Me(),
          response: u.frequencies.map(() => 0),
          readonly: !0,
          note: "flat: no change"
        } : W !== h ? u = {
          ...u,
          settings: Me(),
          response: u.frequencies.map(() => 0),
          readonly: !0,
          note: `${h}: the bands are fitted to your audio when the workflow runs - run once to see the proposal here`
        } : u = { ...u, readonly: !0 }, U();
        return;
      }
      const d = Gr(pe()?.value);
      if (!d) {
        u = { ...u, readonly: !0, note: "the bands are not valid JSON" }, U();
        return;
      }
      $e(d) !== $e(N.current) && N.reset(d);
      const v = ++L;
      try {
        const $ = await nn(t, d, u.sampleRate);
        if (v !== L) return;
        u = {
          ...u,
          frequencies: $.frequency_hz,
          response: $.response_db,
          settings: $.settings,
          readonly: !1,
          note: ""
        };
      } catch ($) {
        u = { ...u, readonly: !1, note: $ instanceof Error ? $.message : String($) };
      }
      U();
    }, c);
  }
  const Ve = (c) => ({
    ...c.settings,
    bands: c.settings.bands.slice(0, it)
  });
  function ae() {
    if (!b) return "";
    const c = y.find((h) => h.name === b);
    return c && Zr(Ve(c), u.settings) ? b : "";
  }
  function U() {
    _.replaceChildren(), D.clear(), j = null;
    const c = T();
    for (const d of [-c.db, -c.db / 2, 0, c.db / 2, c.db])
      _.append(
        ce("line", { x1: 0, x2: c.width, y1: be(c, d), y2: be(c, d), class: d ? "grid" : "grid zero" })
      );
    for (const d of [100, 1e3, 1e4])
      _.append(ce("line", { x1: xe(c, d), x2: xe(c, d), y1: 0, y2: c.height, class: "grid" }));
    u.beforeDb?.length === u.frequencies.length && _.append(ce("path", { d: xn(c, u.frequencies, u.beforeDb), class: "spectrum before" })), u.afterDb?.length === u.frequencies.length && _.append(ce("path", { d: xn(c, u.frequencies, u.afterDb), class: "spectrum after" })), w ? _.append(ce("line", { x1: 0, x2: c.width, y1: be(c, 0), y2: be(c, 0), class: "curve flat" })) : u.frequencies.length && (j = ce("path", { d: yn(c, u.frequencies, u.response), class: "curve" }), _.append(j)), !u.readonly && !w && u.settings.bands.forEach((d, v) => {
      const $ = Ze[v % Ze.length], q = Ae.includes(d.type) ? d.gain_db : 0, x = ce("circle", {
        cx: xe(c, d.frequency_hz),
        cy: be(c, q),
        r: d.id === A ? 9 : 7,
        class: d.id === A ? "handle selected" : "handle",
        style: `stroke: ${$}`,
        tabindex: 0,
        "data-band": d.id
      });
      x.setAttribute("aria-label", `Band ${v + 1}: ${Ie(d)}`), d.enabled || x.classList.add("disabled"), x.append(ce("title", {})), x.lastChild.textContent = `Band ${v + 1}: ${Ie(d)}`, x.addEventListener("pointerdown", (B) => Fo(B, d.id)), x.addEventListener("dblclick", (B) => {
        B.stopPropagation(), O(vn(u.settings, d.id));
      }), x.addEventListener("focus", () => Bo(d.id)), x.addEventListener("keydown", (B) => Kt(B, d.id)), x.addEventListener("wheel", (B) => {
        B.preventDefault();
        const ye = B.deltaY < 0 ? 1.15 : 1 / 1.15;
        O(Et(u.settings, d.id, ye));
      }), x.addEventListener("contextmenu", (B) => {
        B.preventDefault(), O(Mt(u.settings, d.id));
      }), _.append(x), D.set(d.id, x);
    }), Ro(), zo(), Do();
    const h = u.settings.bands.find((d) => d.id === A);
    m.textContent = u.note || (w ? "compare: the curve is off (the node still applies it)" : h ? Ie(h) : u.readonly ? `${u.settings.bands.length} band(s)` : `drag a handle, Shift = fine, wheel = Q, double-click = add · ${u.settings.bands.length}/${it}`), r.disabled = u.readonly, i.disabled = !N.canUndo, a.disabled = !N.canRedo, l.disabled = u.readonly || !u.settings.bands.length, P && (P = !1, A && D.get(A)?.focus({ preventScroll: !0 })), s.value = String(g), r.value = ae(), f.classList.toggle("active", w), p.classList.toggle("active", gt()), e.setDirtyCanvas?.(!0, !0);
  }
  function Ro() {
    if (R.replaceChildren(), u.readonly && !u.settings.bands.length) {
      R.append(F("span", "plenio-eq-hint", u.note || "no bands"));
      return;
    }
    u.settings.bands.forEach((c, h) => {
      const d = F("button", "plenio-eq-chip", Jr(c, h));
      d.style.borderLeftColor = Ze[h % Ze.length], d.classList.toggle("selected", c.id === A), d.classList.toggle("disabled", !c.enabled), d.setAttribute("aria-label", `Edit band ${h + 1}`), d.title = `Band ${h + 1}: ${Ie(c)} - click to open its fields`, d.addEventListener("click", (v) => {
        v.stopPropagation(), A = A === c.id ? null : c.id, U();
      }), R.append(d);
    });
  }
  function zo() {
    k.replaceChildren();
    const c = u.settings.bands.find((x) => x.id === A);
    if (!c || u.readonly) {
      M.style.display = "none";
      return;
    }
    M.style.display = "";
    const h = F("span", "name", `Band ${u.settings.bands.indexOf(c) + 1}`);
    h.title = "The selected band";
    const d = F("select");
    d.setAttribute("aria-label", "Band type"), d.title = "Band type: bell and shelves change the gain, the cuts and the notch do not";
    for (const [x, B] of Object.entries(so)) d.append(new Option(B, x));
    d.value = c.type, d.addEventListener("change", () => O(at(u.settings, c.id, { type: d.value })));
    const v = F("input");
    v.type = "checkbox", v.checked = c.enabled, v.setAttribute("aria-label", "Band enabled"), v.title = "Band enabled: off keeps the band in the list but out of the response", v.addEventListener("change", () => O(at(u.settings, c.id, { enabled: v.checked })));
    const $ = [
      [
        "Hz",
        `${c.frequency_hz}`,
        70,
        (x) => wt(c.id, "frequency_hz", $t(x, { kilo: !0 }))
      ],
      ["dB", `${c.gain_db}`, 60, (x) => wt(c.id, "gain_db", $t(x))],
      ["Q", `${c.q}`, 60, (x) => wt(c.id, "q", $t(x))]
    ];
    k.append(h, d, v);
    for (const [x, B, ye, Ue] of $) {
      const X = F("input", "number");
      X.value = B, X.style.width = `${ye}px`, X.setAttribute("aria-label", `Band ${x}`), X.title = x === "Hz" ? "Frequency of the band in Hz (the centre of a bell, the corner of a shelf)" : x === "dB" ? "Gain in dB (bell and shelves; the cuts and the notch have none)" : "Q: how narrow the band is - higher Q, smaller range";
      const Xe = () => {
        Ue(X.value) || (X.value = B);
      };
      X.addEventListener("keydown", (le) => {
        le.key === "Enter" && Xe();
      }), X.addEventListener("blur", Xe), (x === "dB" && !Ae.includes(c.type) || x === "Q" && !oo.includes(c.type)) && (X.disabled = !0), k.append(X);
    }
    const q = ve("", "remove", "Remove this band");
    q.addEventListener("click", (x) => {
      x.stopPropagation(), A = null, O(Mt(u.settings, c.id));
    }), k.append(q);
  }
  function Do() {
    S.replaceChildren();
    const c = String(ue(e, "mode")?.value ?? "flat");
    if (c === "manual" || c === "flat") {
      S.style.display = "none";
      return;
    }
    S.style.display = "", S.append(
      F(
        "span",
        "plenio-eq-hint",
        W === c ? `applied proposal (${u.settings.bands.length} band(s), ${c})` : `${c}: no proposal yet - it is computed on the next run`
      )
    );
    const h = ve("", "Edit these bands", "Copy the proposal into manual bands and edit it");
    h.disabled = !u.settings.bands.length, h.addEventListener("click", (d) => {
      d.stopPropagation();
      const v = ue(e, "mode");
      if (!v) return;
      v.value = "manual", v.callback?.("manual");
      const $ = pe();
      if ($) {
        const q = $e(u.settings);
        $.value = q, $.callback?.(q);
      }
      N.reset(u.settings), yt(), ie(0);
    }), S.append(h);
  }
  function Bo(c) {
    A = c, P = !0, U();
  }
  function Ho(c) {
    A = c, mt();
  }
  function mt() {
    const c = T();
    u.settings.bands.forEach((d) => {
      const v = D.get(d.id);
      if (!v) return;
      const $ = Ae.includes(d.type) ? d.gain_db : 0;
      v.setAttribute("cx", String(xe(c, d.frequency_hz))), v.setAttribute("cy", String(be(c, $))), v.classList.toggle("selected", d.id === A), v.setAttribute("r", d.id === A ? "9" : "7");
    }), j && u.frequencies.length && j.setAttribute("d", yn(c, u.frequencies, u.response));
    const h = u.settings.bands.find((d) => d.id === A);
    h && (m.textContent = Ie(h));
  }
  function jo() {
    clearTimeout(V), V = setTimeout(async () => {
      const c = u.settings, h = ++L;
      try {
        const d = await nn(t, c, u.sampleRate);
        if (h !== L) return;
        u = { ...u, frequencies: d.frequency_hz, response: d.response_db }, mt();
      } catch {
      }
    }, 60);
  }
  function gt() {
    return !ue(e, Ke)?.plenioHidden;
  }
  function bt(c) {
    const h = ue(e, Ke);
    h && (h.plenioHidden = !c, c ? delete h.computeSize : h.computeSize = () => [0, -4], e.setDirtyCanvas?.(!0, !0));
  }
  function wt(c, h, d) {
    if (d === null) return !1;
    const v = u.settings.bands.find(($) => $.id === c);
    return v && v[h] === d || O(at(u.settings, c, { [h]: d })), !0;
  }
  function Fo(c, h) {
    c.preventDefault(), c.stopPropagation(), A !== h && Ho(h);
    const d = u.settings.bands.find((K) => K.id === h);
    if (!d) return;
    z = { hz: d.frequency_hz, db: d.gain_db };
    let v = !1, $ = !1;
    const q = c.currentTarget;
    try {
      q?.setPointerCapture?.(c.pointerId);
    } catch {
    }
    const x = _.getBoundingClientRect(), B = x.width ? x.left : 0, ye = x.height ? x.top : 0, Ue = x.width || Z.width, X = x.height || Z.height, Xe = (K, Ye) => K >= B - 1 && K <= B + Ue + 1 && Ye >= ye - 1 && Ye <= ye + X + 1;
    function le() {
      if (!$) {
        $ = !0;
        try {
          q?.releasePointerCapture?.(c.pointerId);
        } catch {
        }
        window.removeEventListener("pointermove", tn, he), window.removeEventListener("pointerup", le, he), window.removeEventListener("pointercancel", le, he), window.removeEventListener("blur", le, he), z = null, v && O(u.settings);
      }
    }
    const tn = (K) => {
      if ($ || !z) return;
      if (K.buttons === 0) {
        le();
        return;
      }
      if (!Xe(K.clientX, K.clientY)) return;
      const Ye = Z.width / Ue, Go = Z.height / X, Vo = (K.clientX - B) * Ye, Uo = (K.clientY - ye) * Go, Xo = xe(T(), z.hz), Yo = be(T(), z.db), Jo = gn(T(), wn(Xo, Vo, K.shiftKey)), Qo = bn(T(), wn(Yo, Uo, K.shiftKey));
      u = { ...u, settings: qe(u.settings, h, Jo, Qo, u.sampleRate) }, v = !0, mt(), jo();
    };
    window.addEventListener("pointermove", tn, he), window.addEventListener("pointerup", le, he), window.addEventListener("pointercancel", le, he), window.addEventListener("blur", le, he);
  }
  function Kt(c, h) {
    const d = u.settings.bands.find((x) => x.id === h);
    if (!d) return;
    const v = c.shiftKey ? 0.1 : 0.5, $ = c.shiftKey ? 1.01 : 1.06;
    let q = null;
    c.key === "ArrowUp" ? q = qe(u.settings, h, d.frequency_hz, d.gain_db + v, u.sampleRate) : c.key === "ArrowDown" ? q = qe(u.settings, h, d.frequency_hz, d.gain_db - v, u.sampleRate) : c.key === "ArrowRight" ? q = qe(u.settings, h, d.frequency_hz * $, d.gain_db, u.sampleRate) : c.key === "ArrowLeft" ? q = qe(u.settings, h, d.frequency_hz / $, d.gain_db, u.sampleRate) : c.key === "+" ? q = Et(u.settings, h, 1.15) : c.key === "-" ? q = Et(u.settings, h, 1 / 1.15) : c.key === "0" ? q = vn(u.settings, h) : (c.key === "Delete" || c.key === "Backspace") && (q = Mt(u.settings, h)), q && (c.preventDefault(), O(q));
  }
  _.addEventListener("keydown", (c) => {
    A && c.target === _ && Kt(c, A);
  }), _.addEventListener("dblclick", (c) => {
    if (u.readonly || w) return;
    const h = _.getBoundingClientRect(), d = Z.width / (h.width || Z.width), v = Z.height / (h.height || Z.height), $ = (c.clientX - h.left) * d, q = (c.clientY - h.top) * v, x = Yr(u.settings, gn(T(), $), bn(T(), q), u.sampleRate);
    x ? (A = x.bands[x.bands.length - 1].id, O(x)) : (u = { ...u, note: `the EQ has at most ${it} bands` }, U());
  }), r.append(new Option("preset…", "")), At ??= tr(t).then((c) => c.manual).catch(() => []), At.then((c) => {
    y = c;
    for (const h of c) r.append(new Option(h.name, h.name));
    r.value = ae();
  }), r.addEventListener("change", async () => {
    const c = (await At)?.find((h) => h.name === r.value);
    c && (b = c.name, O(Ve(c)));
  }), s.addEventListener("change", () => {
    const c = Number(s.value);
    g = mn.find((h) => h === c) ?? 12, U();
  }), i.addEventListener("click", () => {
    const c = N.undo();
    c && O(c, { record: !1 });
  }), a.addEventListener("click", () => {
    const c = N.redo();
    c && O(c, { record: !1 });
  }), l.addEventListener("click", () => {
    A = null, O(Me());
  }), f.addEventListener("click", () => {
    w = !w, U();
  }), p.addEventListener("click", () => {
    bt(!gt()), U();
  });
  function yt() {
    for (const c of ["mode", Ke]) {
      const h = ue(e, c);
      if (!h || h.plenioWatched) continue;
      h.plenioWatched = !0;
      const d = h.callback;
      h.callback = (v) => {
        d?.(v), setTimeout(() => {
          gt() || bt(!1), ie();
        });
      };
    }
  }
  yt(), bt(!1), ie(0);
  let Zt = null, en = null;
  const Wo = setInterval(() => {
    if (!n.isConnected) {
      clearInterval(Wo);
      return;
    }
    const c = String(ue(e, "mode")?.value ?? "flat"), h = String(pe()?.value ?? "");
    c === Zt && h === en || (Zt = c, en = h, yt(), ie(0));
  }, 700);
  return {
    showExecuted(c) {
      const h = c?.plenio_eq, d = h?.[h.length - 1];
      if (!d) return;
      const v = String(ue(e, "mode")?.value ?? "flat"), $ = v === "manual";
      W = $ || v === "flat" ? null : v, u = {
        sampleRate: d.sample_rate,
        frequencies: d.frequency_hz,
        response: d.response_db,
        settings: d.settings,
        readonly: !$,
        note: $ ? "" : `applied: ${d.settings.bands.length} band(s)`,
        beforeDb: d.spectrum_before_db,
        afterDb: d.spectrum_after_db
      }, $ ? ie(0) : U();
    }
  };
}
const Qt = {
  PlenioSongBrief: "one song, stop to review",
  PlenioCoverBrief: "one cover, stop to review"
}, ts = new Set(Fe.map((e) => Vt[e]));
function ns(e, t) {
  return !(e in Qt) || !t || typeof t != "object" || Array.isArray(t) ? [] : Object.entries(t).filter(([n, o]) => ts.has(n) && Xn(o)).map(([n]) => n);
}
function os(e, t) {
  for (const n of Object.values(e.input ?? {})) {
    const o = n?.[t];
    if (!Array.isArray(o)) continue;
    if (Array.isArray(o[0])) return o[0];
    const r = o[1]?.options;
    return Array.isArray(r) ? r : [];
  }
  return [];
}
const rs = {
  PlenioSongBrief: { arrangement: { simple: "off" } },
  PlenioCoverBrief: { arrangement: { simple: "off" } }
};
function ss(e, t) {
  const n = rs[e];
  if (!n) return [];
  const o = [];
  for (const r of t ?? []) {
    const s = n[r.name]?.[String(r.value)];
    s !== void 0 && (r.value = s, o.push(r.name));
  }
  return o;
}
const Sn = 6, is = 8, as = 18;
function ls(e) {
  if (e[Sn] !== "tags" || e.length > as) return e;
  const t = Sn + 1 + is;
  return [...e.slice(0, t), "", ...e.slice(t)];
}
function cs(e, t) {
  if (e.name === "PlenioExportRelease" && t && Array.isArray(t.widgets_values)) {
    const l = ls(t.widgets_values);
    return l === t.widgets_values ? t : { ...t, widgets_values: l };
  }
  const n = Qt[e.name];
  if (!n || !t) return t;
  const o = os(e, "mode"), r = t.widgets_values, s = t.widgets_values_named;
  let i = t;
  Array.isArray(r) && r.length && !o.includes(r[0]) && (i = { ...i, widgets_values: [n, ...r] }), s && typeof s == "object" && !Array.isArray(s) && !("mode" in s) && (i = { ...i, widgets_values_named: { mode: n, ...s } });
  const a = ns(e.name, i.widgets_values_named);
  if (a.length) {
    const l = { ...i.widgets_values_named };
    for (const f of a) l[f] = "";
    i = { ...i, widgets_values_named: l };
  }
  return i;
}
const io = /* @__PURE__ */ new Map(), Rt = /* @__PURE__ */ new Set();
function kn(e, t) {
  io.set(e, t);
  for (const n of Rt) n(e);
}
function Ee(e) {
  return io.get(e) ?? null;
}
function us(e) {
  return Rt.add(e), () => Rt.delete(e);
}
const ao = /* @__PURE__ */ new Map();
function ds(e) {
  e?.draft_sha256 && ao.set(e.draft_sha256, e);
}
function fs(e) {
  return e ? ao.get(e) ?? null : null;
}
const Lt = {
  stop: { icon: "⏸", label: "review stop", color: "#2f6fb0", frame: !1 },
  waiting: { icon: "⏸", label: "waiting for your approval", color: "#c98a12", frame: !0 },
  approved: { icon: "✓", label: "approved", color: "#2f8a55", frame: !1 },
  ok: { icon: "✓", label: "", color: "#2f8a55", frame: !1 },
  warning: { icon: "⚠", label: "warning", color: "#b87a0a", frame: !1 },
  error: { icon: "✖", label: "error", color: "#c0392b", frame: !0 },
  skipped: { icon: "–", label: "not needed", color: "#5d6b80", frame: !1 }
};
function ps(e) {
  return e === "ok" || e === "warning" || e === "error" || e === "skipped" ? e : null;
}
function hs(e, t) {
  return e === "stop for review" ? !0 : e === "as the brief says" ? !!t && t.includes("stop to review") : !1;
}
function lo(e) {
  if (/^(conflict|invalid)/.test(e.status)) return "error";
  if (e.waiting) return "waiting";
  if (e.review === "stop for review" && e.approved) return "approved";
  const t = new Set(e.findings.map((n) => n.severity));
  return t.has("error") ? "error" : t.has("warning") ? "warning" : "ok";
}
function ms(e) {
  switch (e) {
    case "stop":
      return "⏸ stops here for review";
    case "waiting":
      return "⏸ waiting for your approval: Edit, Approve, run again";
    case "approved":
      return "✓ approved";
    case "error":
      return "✖ fix the sheet (Edit Song Sheet…)";
    case "warning":
      return "⚠ warnings";
    case "ok":
      return "✓ passed";
    case "skipped":
      return "– not needed";
    default:
      return "▶ runs through, no review stop";
  }
}
const dt = /* @__PURE__ */ new WeakMap(), Be = /* @__PURE__ */ new Set();
function co(e) {
  return dt.get(e) ?? null;
}
function Le(e, t) {
  t ? dt.set(e, t) : dt.delete(e), e.setDirtyCanvas?.(!0, !0);
  for (const n of Be) n(e);
}
function gs(e) {
  for (const t of e) dt.delete(t);
  for (const t of Be) t(null);
}
function bs() {
  for (const e of Be) e(null);
}
function ws(e) {
  return Be.add(e), () => Be.delete(e);
}
const En = "600 12px sans-serif", et = 20, Nt = 7;
function ys(e) {
  return e.label ? `${e.icon} ${e.label}` : e.icon;
}
function vs(e) {
  const t = e ? ys(e) : "";
  return {
    height: e ? et : 0,
    getWidth(n) {
      if (!e) return 0;
      n.save(), n.font = En;
      const o = n.measureText(t).width + 2 * Nt;
      return n.restore(), o;
    },
    draw(n, o, r) {
      if (!e) return;
      n.save(), n.font = En;
      const s = n.measureText(t).width + 2 * Nt;
      n.fillStyle = e.color, n.beginPath(), typeof n.roundRect == "function" ? n.roundRect(o, r, s, et, 5) : n.rect(o, r, s, et), n.fill(), n.fillStyle = "#ffffff", n.textBaseline = "middle", n.fillText(t, o + Nt, r + et / 2 + 0.5), n.restore();
    }
  };
}
const xs = "PlenioSongSheet", _s = 30;
function uo(e, t) {
  const n = e.widgets?.find((o) => o.name === t);
  return n ? String(n.value ?? "") : null;
}
function Ss(e) {
  const t = e.inputs?.findIndex((n) => n.name === "brief") ?? -1;
  if (t < 0) return null;
  try {
    const n = e.getInputNode?.(t);
    return n ? uo(n, "mode") : null;
  } catch {
    return null;
  }
}
function zt(e) {
  const t = co(e);
  return t || (e.type !== xs ? null : hs(uo(e, "review") ?? "continue", Ss(e)) ? "stop" : null);
}
function ks(e) {
  const t = e?.plenio_sheet, n = t?.[t.length - 1];
  if (n) return lo(n);
  const o = e?.plenio_summary;
  return ps(o?.[o.length - 1]?.status);
}
function Es(e, t) {
  const n = e.prototype, o = n.onNodeCreated;
  n.onNodeCreated = function() {
    o?.call(this);
    const r = this;
    r.badges?.push(() => {
      const s = zt(r);
      return vs(s ? Lt[s] : null);
    });
  }, n.onDrawForeground = te(n.onDrawForeground, function(r) {
    const s = zt(this);
    !s || !Lt[s].frame || this.flags?.collapsed || !this.size || Ms(r, Lt[s], this.size, _s, t.scale());
  }), n.onExecuted = te(n.onExecuted, function(r) {
    const s = ks(r);
    s && (Le(this, s), s === "waiting" && t.toast(
      `Stopped at ${this.title || "the Song Sheet"}`,
      'Waiting for your approval: open it with "Edit Song Sheet…", check the documents, press Approve, then run again.'
    ));
  });
}
function Ms(e, t, n, o, r) {
  const s = Math.max(3, 3 / Math.max(r, 0.05));
  e.save(), e.strokeStyle = t.color, e.lineWidth = s, e.beginPath();
  const i = s / 2 + 3;
  typeof e.roundRect == "function" ? e.roundRect(-i, -o - i, n[0] + 2 * i, n[1] + o + 2 * i, 10) : e.rect(-i, -o - i, n[0] + 2 * i, n[1] + o + 2 * i), e.stroke(), e.restore();
}
function pa(e, t) {
  const n = [];
  let o = 0;
  return e.bars.forEach((r, s) => {
    const i = t?.[s] ?? null, a = i && i[1] > i[0] ? [i[0], i[1]] : null, l = a ? a[1] - a[0] : r.duration_s;
    n.push({ scoreStart: r.start_s, scoreDur: r.duration_s, realStart: o, realDur: l, source: a }), o += l;
  }), n;
}
function fo(e, t, n) {
  let o = null;
  for (const r of e)
    if (r[n] <= t + Y) o = r;
    else break;
  return o ?? e[0] ?? null;
}
function ke(e, t) {
  const n = fo(e, t, "scoreStart");
  if (!n) return t;
  const o = n.scoreDur > 0 ? (t - n.scoreStart) / n.scoreDur : 0;
  return n.realStart + o * n.realDur;
}
function $s(e, t) {
  const n = fo(e, t, "realStart");
  if (!n) return t;
  const o = n.realDur > 0 ? (t - n.realStart) / n.realDur : 0;
  return n.scoreStart + o * n.scoreDur;
}
function ha(e, t, n) {
  const o = ke(e, t), r = n == null ? 1 / 0 : ke(e, n), s = [];
  for (const i of e) {
    if (!i.source) continue;
    const a = i.realStart + i.realDur, l = Math.max(i.realStart, o), f = Math.min(a, r);
    if (f <= l + Y) continue;
    let p = i.source[0] + (l - i.realStart) / i.realDur * (i.source[1] - i.source[0]), m = l - o, S = f - l;
    if (p < 0 && (m -= p, S += p, p = 0, S <= Y))
      continue;
    const _ = s.at(-1);
    _ && Math.abs(_.at + _.duration - m) < Y && Math.abs(_.offset + _.duration - p) < 0.01 ? _.duration += S : s.push({ at: m, offset: p, duration: S });
  }
  return s;
}
const po = 0.04, Y = 1e-3, As = 0.25, Ls = 2;
function ft(e) {
  return Math.min(Ls, Math.max(As, Number.isFinite(e) ? e : 1));
}
function ma(e, t) {
  const n = ft(t.speed), o = t.to ?? e.duration_s, r = [], s = t.clock?.length ? t.clock : null, i = s ? ke(s, t.from) : t.from, a = (l) => (s ? ke(s, l) : l) - i;
  for (const l of ["Vocal", "Ins"])
    if (t.voices[l])
      for (const f of e.notes?.[l] ?? []) {
        if (f.start_s < t.from - Y || f.start_s >= o - Y) continue;
        const p = Math.min(f.start_s + f.duration_s, o), m = Math.max(0, a(f.start_s));
        r.push({ at: m / n, duration: (a(p) - m) / n, midi: f.midi, part: l });
      }
  if (t.voices.chords)
    for (const l of e.chords ?? []) {
      const f = Math.min(l.start_s + l.duration_s, o), p = Math.max(l.start_s, t.from);
      if (!(f <= p + Y))
        for (const m of l.pitches)
          r.push({ at: a(p) / n, duration: (a(f) - a(p)) / n, midi: m, part: "chord" });
    }
  if (t.voices.guide)
    for (const l of t.guide ?? []) {
      if (l.start_s < t.from - Y || l.start_s >= o - Y) continue;
      const f = Math.min(l.start_s + l.duration_s, o), p = Math.max(0, a(l.start_s));
      r.push({ at: p / n, duration: (a(f) - p) / n, midi: l.midi, part: "guide" });
    }
  if (t.metronome)
    for (const l of e.bars) {
      const f = Number(l.meter.split("/")[0]) || 1;
      for (let p = 0; p < f; p++) {
        const m = l.start_s + p * l.duration_s / f;
        m < t.from - Y || m >= o - Y || r.push({
          at: Math.max(0, a(m)) / n,
          duration: po,
          midi: p === 0 ? 96 : 89,
          part: "click"
        });
      }
    }
  return r.sort((l, f) => l.at - f.at || l.midi - f.midi);
}
function ga(e, t) {
  const n = Math.max(t.from, t.to ?? e.duration_s), o = t.clock?.length ? t.clock : null, r = o ? ke(o, n) - ke(o, t.from) : n - t.from;
  return Math.max(0, r) / ft(t.speed);
}
function ba(e, t, n, o, r, s) {
  const i = e && t > 0 ? e.duration_s / t : 0, a = e && i > 0 ? Math.max(0, n - e.start_s) : 0, l = i > 0 ? Math.floor(a / i + 1e-6) : 0, f = i > 0 ? (a - l * i) / i * s : 0, p = f > 1e-3 ? 0 : 1, m = Math.max(0, o * t);
  return Array.from({ length: m }, (S, _) => {
    const R = p + m - 1 - _, M = ((l - R) % t + t) % t === 0;
    return { at: Math.max(0, r - f - R * s), duration: po, midi: M ? 96 : 89, part: "click" };
  });
}
function wa(e, t) {
  const n = e.clock?.length ? e.clock : null;
  return n ? $s(n, ke(n, e.from) + t * ft(e.speed)) : e.from + t * ft(e.speed);
}
function ya(e, t, n) {
  return (e.elements ?? []).filter(
    (o) => o.kind === "note" && n[o.voice] && o.start_s <= t + Y && t < o.start_s + o.duration_s - Y
  ).map((o) => o.id);
}
function Ns(e) {
  return 440 * 2 ** ((e - 69) / 12);
}
const Ts = [
  "plain",
  "soft",
  "piano",
  "epiano",
  "strings",
  "pad",
  "organ",
  "flute",
  "voice",
  "pluck",
  "lead",
  "bass",
  "mallets"
], va = {
  plain: { label: "Plain", hint: "a plain sine tone (the editor’s classic sound)" },
  soft: { label: "Soft lead", hint: "a soft triangle tone" },
  piano: { label: "Piano", hint: "a struck string that fades and darkens" },
  epiano: { label: "Electric piano", hint: "a bell-like electric piano (FM)" },
  strings: { label: "Strings", hint: "a string section: slow bow, vibrato" },
  pad: { label: "Pad", hint: "a slow, wide synth pad" },
  organ: { label: "Organ", hint: "drawbar organ" },
  flute: { label: "Flute", hint: "a breathy flute with vibrato" },
  voice: { label: "Voice “ah”", hint: "a sung “ah” (formants) - good for the Vocal track" },
  pluck: { label: "Pluck", hint: "a plucked string, like a guitar" },
  lead: { label: "Synth lead", hint: "a bright synth lead" },
  bass: { label: "Bass", hint: "a round bass" },
  mallets: { label: "Mallets", hint: "marimba / vibraphone (FM)" }
};
function tt(e) {
  return typeof e == "string" && Ts.includes(e);
}
function ho() {
  return { Vocal: "soft", Ins: "plain", chord: "plain", guide: "plain" };
}
function Cs(e) {
  const t = ho(), n = typeof e == "object" && e !== null ? e : {};
  return {
    Vocal: tt(n.Vocal) ? n.Vocal : t.Vocal,
    Ins: tt(n.Ins) ? n.Ins : t.Ins,
    chord: tt(n.chord) ? n.chord : t.chord,
    guide: tt(n.guide) ? n.guide : t.guide
  };
}
const Os = {
  plain: 1,
  soft: 1,
  piano: 1.35,
  epiano: 1.2,
  strings: 0.8,
  pad: 0.75,
  organ: 1.1,
  flute: 0.95,
  voice: 4.1,
  pluck: 0.8,
  lead: 0.75,
  bass: 0.8,
  mallets: 1.15
}, Mn = /* @__PURE__ */ new WeakMap();
function Tt(e, t, n) {
  let o = Mn.get(e);
  o || Mn.set(e, o = /* @__PURE__ */ new Map());
  let r = o.get(t);
  if (!r) {
    const s = new Float32Array(n.length + 1), i = new Float32Array(n.length + 1);
    n.forEach((a, l) => i[l + 1] = a), r = e.createPeriodicWave(s, i), o.set(t, r);
  }
  return r;
}
const $n = /* @__PURE__ */ new WeakMap();
function mo(e) {
  let t = $n.get(e);
  if (!t) {
    t = e.createBuffer(1, e.sampleRate, e.sampleRate);
    const n = t.getChannelData(0);
    let o = 1;
    for (let r = 0; r < n.length; r++)
      o = o * 16807 % 2147483647, n[r] = o / 2147483647 * 2 - 1;
    $n.set(e, t);
  }
  return t;
}
function C(e, t, n, o = 0) {
  const r = e.createOscillator();
  return typeof t == "string" ? r.type = t : r.setPeriodicWave(t), r.frequency.value = n, r.detune.value = o, r;
}
function me(e, t) {
  const n = e.createGain();
  return n.gain.value = t, n;
}
function ee(e, t, n, o = 0.7) {
  const r = e.createBiquadFilter();
  return r.type = t, r.frequency.value = Math.min(n, e.sampleRate / 2 - 100), r.Q.value = o, r;
}
function Pe(e, t, n, o, r, s) {
  const i = C(e, "sine", o), a = e.createGain();
  a.gain.setValueAtTime(0, n), a.gain.setValueAtTime(0, n + s), a.gain.linearRampToValueAtTime(r, n + s + 0.4), i.connect(a);
  for (const l of t) a.connect(l.detune);
  return i;
}
function Ct(e, t, n, o, r, s) {
  const i = e.createBufferSource();
  i.buffer = mo(e);
  const a = ee(e, "bandpass", o, 1.2), l = e.createGain();
  return l.gain.setValueAtTime(r, n), l.gain.setTargetAtTime(0, n, s), i.connect(a).connect(l).connect(t), i;
}
const lt = (e, t) => Math.min(t * 2.5, Math.max(t * 0.3, t * 2 ** ((60 - e) / 24))), An = {
  plain: {
    attack: 0.012,
    sustain: 0.85,
    decay: 0.4,
    release: 0.015,
    build: (e, t, n) => [Ln(C(e, "sine", n), t)]
  },
  soft: {
    attack: 0.012,
    sustain: 0.85,
    decay: 0.4,
    release: 0.015,
    build: (e, t, n) => [Ln(C(e, "triangle", n), t)]
  },
  piano: {
    attack: 3e-3,
    sustain: 0,
    decay: 1.4,
    release: 0.09,
    build(e, t, n, o, r, s) {
      const i = Tt(e, "piano", [1, 0.62, 0.36, 0.27, 0.16, 0.12, 0.07, 0.06, 0.035, 0.02, 0.012, 8e-3]), a = ee(e, "lowpass", Math.min(n * (5 + 7 * r), 14e3), 0.5);
      a.frequency.setTargetAtTime(Math.max(n * 2.2, 400), o + 0.01, lt(s, 0.35)), a.connect(t);
      const l = C(e, i, n, -1.5), f = C(e, i, n, 1.5), p = me(e, 0.5);
      l.connect(p), f.connect(p), p.connect(a);
      const m = Ct(e, t, o, Math.min(n * 6, 7e3), 0.12 * r, 8e-3);
      return [l, f, m];
    }
  },
  epiano: {
    attack: 2e-3,
    sustain: 0,
    decay: 1.6,
    release: 0.12,
    build(e, t, n, o, r, s) {
      const i = C(e, "sine", n), a = C(e, "sine", n), l = e.createGain(), f = n * (1.2 + 2.2 * r);
      l.gain.setValueAtTime(f, o), l.gain.setTargetAtTime(n * 0.25, o, lt(s, 0.25)), a.connect(l).connect(i.frequency);
      const p = ee(e, "highpass", 25, 0.7);
      p.connect(t);
      const m = C(e, "sine", n * 4), S = e.createGain();
      return S.gain.setValueAtTime(0.18 * r, o), S.gain.setTargetAtTime(0, o, 0.06), m.connect(S).connect(p), i.connect(p), [i, a, m];
    }
  },
  strings: {
    attack: 0.22,
    sustain: 0.9,
    decay: 0.6,
    release: 0.2,
    build(e, t, n, o) {
      const r = ee(e, "lowpass", Math.min(n * 5 + 800, 6e3), 0.6);
      r.connect(t);
      const s = [-9, 0, 8].map((a) => C(e, "sawtooth", n, a));
      for (const a of s) a.connect(r);
      const i = Pe(e, s, o, 5.3, 7, 0.3);
      return [...s, i];
    }
  },
  pad: {
    attack: 0.5,
    sustain: 0.95,
    decay: 1,
    release: 0.45,
    build(e, t, n, o) {
      const r = Math.min(n * 3 + 500, 4500), s = ee(e, "lowpass", r, 0.8);
      s.connect(t);
      const i = C(e, "sine", 0.25), a = me(e, r * 0.3);
      i.connect(a).connect(s.frequency);
      const l = [C(e, "sawtooth", n, -12), C(e, "sawtooth", n, 11), C(e, "triangle", n / 2)];
      for (const f of l) f.connect(s);
      return [...l, i];
    }
  },
  organ: {
    attack: 6e-3,
    sustain: 1,
    decay: 1,
    release: 0.025,
    build(e, t, n, o) {
      const r = Tt(e, "organ", [1, 0.75, 0.55, 0.5, 0.18, 0.3, 0, 0.22, 0, 0.08, 0, 0.1]), s = C(e, r, n), i = C(e, "sine", n / 2), a = me(e, 0.35);
      i.connect(a).connect(t), s.connect(t);
      const l = Pe(e, [s, i], o, 6.6, 4, 0), f = Ct(e, t, o, 3e3, 0.05, 4e-3);
      return [s, i, l, f];
    }
  },
  flute: {
    attack: 0.07,
    sustain: 0.85,
    decay: 0.5,
    release: 0.06,
    build(e, t, n, o) {
      const r = Tt(e, "flute", [1, 0.13, 0.06, 0.02]), s = C(e, r, n);
      s.connect(t);
      const i = e.createBufferSource();
      i.buffer = mo(e), i.loop = !0;
      const a = ee(e, "bandpass", Math.min(n * 2, 8e3), 1.5), l = me(e, 0.06);
      i.connect(a).connect(l).connect(t);
      const f = Pe(e, [s], o, 4.9, 9, 0.25);
      return [s, i, f];
    }
  },
  voice: {
    attack: 0.08,
    sustain: 0.9,
    decay: 0.5,
    release: 0.09,
    build(e, t, n, o) {
      const r = C(e, "sawtooth", n), s = ee(e, "lowpass", 5e3, 0.5);
      r.connect(s);
      for (const [l, f, p] of [
        [800, 6, 1],
        [1150, 8, 0.55],
        [2900, 12, 0.18]
      ]) {
        const m = ee(e, "bandpass", l, f), S = me(e, p);
        s.connect(m).connect(S).connect(t);
      }
      const i = me(e, 0.15);
      s.connect(i).connect(t);
      const a = Pe(e, [r], o, 5.4, 18, 0.22);
      return [r, a];
    }
  },
  pluck: {
    attack: 2e-3,
    sustain: 0,
    decay: 0.7,
    release: 0.07,
    build(e, t, n, o, r, s) {
      const i = ee(e, "lowpass", Math.min(n * (6 + 6 * r), 9e3), 0.9);
      i.frequency.setTargetAtTime(Math.max(n * 1.5, 250), o + 5e-3, lt(s, 0.12)), i.connect(t);
      const a = C(e, "sawtooth", n), l = C(e, "triangle", n, 4);
      a.connect(i), l.connect(i);
      const f = Ct(e, t, o, Math.min(n * 8, 8e3), 0.1 * r, 5e-3);
      return [a, l, f];
    }
  },
  lead: {
    attack: 0.01,
    sustain: 0.8,
    decay: 0.3,
    release: 0.06,
    build(e, t, n, o) {
      const r = ee(e, "lowpass", Math.min(n * 8, 7e3), 2);
      r.frequency.setTargetAtTime(Math.min(n * 4, 4e3), o + 0.02, 0.2), r.connect(t);
      const s = C(e, "square", n), i = C(e, "sawtooth", n, 6);
      s.connect(r), i.connect(r);
      const a = Pe(e, [s, i], o, 5.6, 10, 0.3);
      return [s, i, a];
    }
  },
  bass: {
    attack: 4e-3,
    sustain: 0.45,
    decay: 0.5,
    release: 0.06,
    build(e, t, n, o) {
      const r = C(e, "sine", n), s = C(e, "triangle", n), i = me(e, 0.5);
      r.connect(t), s.connect(i).connect(t);
      const a = C(e, "sawtooth", n), l = ee(e, "lowpass", Math.min(n * 6, 2500), 1);
      l.frequency.setTargetAtTime(n * 2, o + 0.01, 0.12);
      const f = me(e, 0.25);
      return a.connect(l).connect(f).connect(t), [r, s, a];
    }
  },
  mallets: {
    attack: 2e-3,
    sustain: 0,
    decay: 0.8,
    release: 0.1,
    build(e, t, n, o, r, s) {
      const i = C(e, "sine", n), a = C(e, "sine", n * 3.5), l = e.createGain();
      return l.gain.setValueAtTime(n * (1 + 1.5 * r), o), l.gain.setTargetAtTime(0, o, 0.05), a.connect(l).connect(i.frequency), i.connect(t), [i, a];
    }
  }
};
function Ln(e, t) {
  return e.connect(t), e;
}
function xa(e, t, n, o, r, { velocity: s = 0.8, level: i = 1 } = {}) {
  const a = An[n] ?? An.plain, l = Ns(o), f = a.sustain === 0 ? lt(o, a.decay) : a.decay, p = i * Os[n] * (0.55 + 0.45 * Math.max(0, Math.min(1, s))), m = e.createGain();
  m.gain.setValueAtTime(0, r), m.gain.linearRampToValueAtTime(p, r + a.attack), m.gain.setTargetAtTime(p * a.sustain, r + a.attack, f), m.connect(t);
  const S = a.build(e, m, l, r, s, o);
  for (const k of S) k.start(r);
  let _ = !1, R = !1;
  const M = (k) => {
    for (const H of S)
      try {
        H.stop(k);
      } catch {
      }
  };
  return S[0].onended = () => {
    R = !0, m.disconnect();
  }, a.sustain === 0 && M(r + a.attack + f * 7), {
    release(k) {
      if (_ || R) return;
      _ = !0;
      const H = Math.max(k, r + a.attack);
      m.gain.setTargetAtTime(0, H, a.release), M(H + a.release * 7);
    },
    stop() {
      if (R) return;
      R = !0, _ = !0;
      const k = e.currentTime;
      try {
        m.gain.cancelScheduledValues(k), m.gain.setValueAtTime(0, k);
      } catch {
      }
      M(k), m.disconnect();
    }
  };
}
const _a = 12, nt = { width: 640, height: 420 }, qs = { width: 1280, height: 900 }, go = 120, bo = 720, wo = 0.25, yo = 0.85, vo = 160, xo = 460, _o = "plenio.sheet.dialog";
function He(e, t, n) {
  return Number.isFinite(e) ? Math.min(Math.max(e, t), Math.max(t, n)) : t;
}
function Is(e, t) {
  const n = He(e.width, nt.width, Math.max(nt.width, t.width - 16)), o = He(e.height, nt.height, Math.max(nt.height, t.height - 16));
  return { width: Math.round(n), height: Math.round(o) };
}
function Sa(e, t) {
  return Math.round(He(e + t, go, bo));
}
function ka(e, t, n) {
  return !Number.isFinite(n) || n <= 0 ? Nn(e) : Nn(e + t / n);
}
function Nn(e) {
  return Math.round(He(e, wo, yo) * 1e3) / 1e3;
}
function Ea(e, t) {
  return Math.round(He(e + t, vo, xo));
}
function Ma(e, t, n) {
  const o = e.clientX, r = e.clientY, s = e.currentTarget;
  let i = !1;
  try {
    s?.setPointerCapture?.(e.pointerId);
  } catch {
  }
  const a = () => {
    if (!i) {
      i = !0;
      try {
        s?.releasePointerCapture?.(e.pointerId);
      } catch {
      }
      window.removeEventListener("pointermove", l), window.removeEventListener("pointerup", a), window.removeEventListener("pointercancel", a), window.removeEventListener("blur", a), n?.();
    }
  }, l = (f) => {
    if (f.buttons === 0) {
      a();
      return;
    }
    t({ dx: f.clientX - o, dy: f.clientY - r });
  };
  window.addEventListener("pointermove", l), window.addEventListener("pointerup", a), window.addEventListener("pointercancel", a), window.addEventListener("blur", a);
}
function Ps() {
  return { ...qs, maximized: !1 };
}
function $a(e = So()) {
  const t = Ps();
  try {
    const n = e?.getItem(_o);
    if (!n) return t;
    const o = JSON.parse(n);
    return { ...Is(
      {
        width: typeof o.width == "number" ? o.width : t.width,
        height: typeof o.height == "number" ? o.height : t.height
      },
      { width: window.innerWidth, height: window.innerHeight }
    ), maximized: o.maximized === !0 };
  } catch {
    return t;
  }
}
function Aa(e, t = So()) {
  try {
    t?.setItem(_o, JSON.stringify(e));
  } catch {
  }
}
function So() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function ko(e) {
  return e === "large" || e === "standard" || e === "smaller" || e === "compact";
}
function Eo() {
  return { countIn: 1, quantize: 16, mode: "replace", mute: !0, thru: !0, stepLength: 8 };
}
function Rs(e) {
  const t = Eo(), n = typeof e == "object" && e !== null ? e : {}, o = (r, s, i) => s.includes(r) ? r : i;
  return {
    countIn: o(n.countIn, [0, 1, 2], t.countIn),
    quantize: o(n.quantize, [0, 4, 8, 16, 32], t.quantize),
    mode: o(n.mode, ["replace", "merge"], t.mode),
    mute: typeof n.mute == "boolean" ? n.mute : t.mute,
    thru: typeof n.thru == "boolean" ? n.thru : t.thru,
    stepLength: o(n.stepLength, [1, 2, 4, 8, 16], t.stepLength)
  };
}
const Mo = "plenio.score-editor.prefs";
function zs() {
  return {
    layout: "review",
    advanced: !1,
    zoom: 1,
    voices: { Vocal: !0, Ins: !0, chords: !0, guide: !0 },
    speed: 1,
    roll: !0,
    rollZoom: 48,
    rollHeight: 280,
    notationShare: 0.6,
    sideWidth: 230,
    metronome: !1,
    hear: "both",
    sourceLevel: 0.7,
    audition: !0,
    rowHeight: 12,
    follow: !0,
    sung: !0,
    wave: !0,
    sounds: ho(),
    paper: "a4",
    notationSize: "standard",
    record: Eo(),
    midiInput: "all"
  };
}
function Ds(e) {
  const t = e.layout;
  return t === "text" ? { layout: "text", advanced: e.advanced === !0 } : t === "daw" ? { layout: "daw", advanced: e.advanced === !0 } : t === "both" ? { layout: "review", advanced: !0 } : { layout: "review", advanced: e.advanced === !0 };
}
function La(e = $o()) {
  const t = zs();
  try {
    const n = e?.getItem(Mo);
    if (!n) return t;
    const o = JSON.parse(n);
    return {
      ...Ds(o),
      zoom: typeof o.zoom == "number" && o.zoom >= 0.6 && o.zoom <= 1.8 ? o.zoom : t.zoom,
      voices: {
        Vocal: o.voices?.Vocal !== !1,
        Ins: o.voices?.Ins !== !1,
        chords: o.voices?.chords !== !1,
        guide: o.voices?.guide !== !1
      },
      speed: typeof o.speed == "number" && o.speed >= 0.25 && o.speed <= 2 ? o.speed : t.speed,
      roll: o.roll !== !1,
      rollZoom: typeof o.rollZoom == "number" && o.rollZoom >= 12 && o.rollZoom <= 240 ? o.rollZoom : t.rollZoom,
      rollHeight: typeof o.rollHeight == "number" && o.rollHeight >= go && o.rollHeight <= bo ? Math.round(o.rollHeight) : t.rollHeight,
      notationShare: typeof o.notationShare == "number" && o.notationShare >= wo && o.notationShare <= yo ? o.notationShare : t.notationShare,
      sideWidth: typeof o.sideWidth == "number" && o.sideWidth >= vo && o.sideWidth <= xo ? Math.round(o.sideWidth) : t.sideWidth,
      metronome: o.metronome === !0,
      hear: o.hear === "notes" || o.hear === "source" ? o.hear : t.hear,
      sourceLevel: typeof o.sourceLevel == "number" && o.sourceLevel >= 0 && o.sourceLevel <= 1 ? o.sourceLevel : t.sourceLevel,
      audition: o.audition !== !1,
      rowHeight: typeof o.rowHeight == "number" && o.rowHeight >= 6 && o.rowHeight <= 28 ? Math.round(o.rowHeight) : t.rowHeight,
      follow: o.follow !== !1,
      sung: o.sung !== !1,
      wave: o.wave !== !1,
      sounds: Cs(o.sounds),
      paper: o.paper === "letter" ? "letter" : "a4",
      notationSize: ko(o.notationSize) ? o.notationSize : t.notationSize,
      record: Rs(o.record),
      midiInput: typeof o.midiInput == "string" && o.midiInput ? o.midiInput : "all"
    };
  } catch {
    return t;
  }
}
function Na(e, t = $o()) {
  try {
    t?.setItem(Mo, JSON.stringify(e));
  } catch {
  }
}
function $o() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function Ao(e) {
  if (!Array.isArray(e)) return [];
  const t = (n) => typeof n == "string" ? n : "";
  return e.filter((n) => !!n && typeof n == "object").map((n) => ({
    token: t(n.token),
    file: t(n.file),
    title: t(n.title),
    paper: n.paper === "letter" ? "letter" : "a4",
    size: ko(n.size) ? n.size : "standard",
    display_abc: t(n.display_abc)
  })).filter((n) => n.token && n.file && n.display_abc);
}
function Bs(e) {
  return Ao(e?.plenio_notation);
}
async function Hs(e) {
  const t = await e.fetchApi("/plenio/export/sheet-music/pending", { cache: "no-store" });
  if (!t.ok) return [];
  const n = await t.json().catch(() => ({}));
  return Ao(n.jobs);
}
async function js(e, t) {
  const n = await t.draw(e.display_abc, e.title, e.paper, e.size), o = new ArrayBuffer(n.length);
  new Uint8Array(o).set(n);
  const r = await t.fetcher.fetchApi(`/plenio/export/sheet-music?token=${encodeURIComponent(e.token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: new Blob([o], { type: "application/pdf" })
  }), s = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new re(s.error?.message ?? `Saving the sheet music failed (${r.status})`, s.error?.hint ?? null);
  return { file: s.file ?? e.file, bytes: s.bytes ?? n.length };
}
let Tn = Promise.resolve();
function Fs(e) {
  const t = Tn.then(e, e);
  return Tn = t.catch(() => {
  }), t;
}
class Ws {
  constructor(t, n) {
    this.host = t, this.report = n;
  }
  host;
  report;
  seen = /* @__PURE__ */ new Set();
  take(t, n = !1) {
    const o = [];
    for (const r of t)
      this.seen.has(r.token) || (this.seen.add(r.token), o.push(
        Fs(() => js(r, this.host)).then(
          (s) => this.report({ job: r, saved: s }),
          (s) => {
            const i = s instanceof re && /can no longer be saved/.test(s.message);
            this.report({ job: r, error: s, quiet: n && i });
          }
        )
      ));
    return o;
  }
  /** Ask the server for the jobs still waiting and draw the new ones (a failed request draws nothing). */
  async recover() {
    let t = [];
    try {
      t = await Hs(this.host.fetcher);
    } catch {
      return;
    }
    await Promise.all(this.take(t, !0));
  }
}
const Gs = "PlenioSeed", Vs = 2 ** 32, Us = "plenio_part", ct = "plenio_seed_hint", Cn = {
  fresh: { color: "#7a5418", bgcolor: "#3b2a10" },
  keep: { color: "#1f4e6e", bgcolor: "#14304a" }
};
function Xs(e = Math.random) {
  return Math.floor(e() * Vs);
}
function Ys(e, t) {
  const n = t.trim() || "result";
  return e ? `🔒 Every run uses this seed again: the same ${n}.` : `🎲 Every run draws a new seed: a new ${n}. Liked it? Switch to 🔒.`;
}
function Ne(e, t) {
  return e.widgets?.find((n) => n.name === t);
}
function Js(e) {
  const t = e.inputs?.find((n) => n.name === "seed");
  return t?.link !== void 0 && t?.link !== null;
}
function Dt(e) {
  const t = !!Ne(e, "keep_seed")?.value, n = e, o = t ? Cn.keep : Cn.fresh;
  n.color = o.color, n.bgcolor = o.bgcolor;
  const r = Ne(e, ct)?.element;
  r && (r.textContent = Ys(t, String(e.properties?.[Us] ?? ""))), e.setDirtyCanvas?.(!0, !0);
}
function On(e, t = Math.random) {
  const n = Ne(e, "seed");
  !n || Js(e) || (n.value = Xs(t), n.callback?.(n.value), e.setDirtyCanvas?.(!0, !0));
}
function Qs(e, t = Math.random) {
  const n = Ne(e, "seed"), o = Ne(e, "keep_seed");
  if (!n || !o) return;
  n.beforeQueued = () => {
    o.value || On(e, t);
  }, o.callback = te(o.callback, () => Dt(e));
  const s = e.addWidget?.("button", "🎲 new seed now", null, () => On(e, t), { serialize: !1 });
  if (s && (s.serialize = !1), !Ne(e, ct)) {
    const i = document.createElement("div");
    i.className = "plenio-seed-hint";
    const a = e.addDOMWidget(ct, ct, i, {
      serialize: !1,
      getValue: () => "",
      setValue: () => {
      },
      getMinHeight: () => 40,
      getMaxHeight: () => 40
    });
    a.serialize = !1;
  }
  Dt(e);
}
function Ks(e) {
  const t = e.prototype, n = t.onNodeCreated;
  t.onNodeCreated = function() {
    n?.call(this), Qs(this);
  }, e.prototype.onConfigure = te(e.prototype.onConfigure, function() {
    Dt(this);
  });
}
const Zs = "PlenioSongSheet";
function Ge(e) {
  return e.widgets?.find((t) => t.name === "sheet_state") ?? null;
}
function Lo(e, t) {
  const n = e.inputs?.[t]?.link;
  if (n == null) return null;
  try {
    const o = e.graph, r = o?.links, s = o?.getLink?.(n) ?? (r instanceof Map ? r.get(n) : r?.[String(n)]);
    return s && o?.getNodeById ? o.getNodeById(s.origin_id) ?? null : e.getInputNode?.(t) ?? null;
  } catch {
    return null;
  }
}
function No(e, t) {
  const n = (e.inputs ?? []).findIndex((o) => o.name === t && o.link != null);
  return n < 0 ? null : Lo(e, n);
}
function To(e, t) {
  const n = No(e, t);
  return n && (n.comfyClass ?? n.type) === Zs && Ge(n) ? n : null;
}
function ei(e) {
  return To(e, "context_lyrics");
}
function ti(e) {
  return To(e, "context_score");
}
function ni(e, t, n) {
  const o = [], r = No(t, n);
  r && o.push(r);
  const s = /* @__PURE__ */ new Set();
  for (; o.length && s.size < 1e3; ) {
    const i = o.shift(), a = String(i.id);
    if (!s.has(a)) {
      if (s.add(a), i === e || a === String(e.id)) return !0;
      (i.inputs ?? []).forEach((l, f) => {
        const p = Lo(i, f);
        p && o.push(p);
      });
    }
  }
  return !1;
}
function oi(e, t, n) {
  const o = ei(e), r = t?.context?.lyrics;
  if (!o || !r) return null;
  const s = o.title || "Song Sheet", i = Se(Ge(o)?.value), a = i?.docs.lyrics?.text ?? n(String(o.id))?.docs.lyrics?.upstream ?? null;
  let l = null;
  return i === null ? l = `The state of ${s} is unreadable - open that sheet and apply it first.` : a !== null && _e(a) !== _e(r) && (l = `The lyrics in ${s} changed after the last run. Run the workflow again; then they can follow the sections.`), { owner: o, target: { title: s, blocked: l, replans: ni(o, e, "score") } };
}
function ri(e, t, n) {
  const o = Ge(e);
  if (!o) return;
  const r = Se(o.value) ?? ht();
  o.value = De(Kn(r, n, [{ kind: "lyrics", text: t, intent: "keep" }])), e.setDirtyCanvas?.(!0, !0);
}
function si(e, t, n) {
  const o = ti(e), r = t?.context?.score;
  if (!o || !r) return null;
  const s = o.title || "Song Sheet", i = Se(Ge(o)?.value), a = i?.docs.score?.text ?? n(String(o.id))?.docs.score?.upstream ?? null;
  let l = null;
  return i === null ? l = `The state of ${s} is unreadable - open that sheet and apply it first.` : a !== null && _e(a) !== _e(r) && (l = `The score in ${s} changed after the last run. Run the workflow again; then it can be edited here.`), { owner: o, target: { title: s, blocked: l } };
}
function ii(e, t) {
  const n = String(e.widgets?.find((o) => o.name === "review")?.value ?? "continue");
  return n === "as the brief says" ? t?.review ?? "continue" : n;
}
async function ai(e, t, n, o = null) {
  const r = Ge(e);
  if (!r) return null;
  const s = Se(r.value) ?? ht(), i = Kn(s, n, [{ kind: "score", text: t, intent: "keep" }]);
  if (r.value = De(i), e.setDirtyCanvas?.(!0, !0), !o || !n) return i;
  try {
    const a = await Zo(o.fetcher, {
      sheet_state: i,
      upstream: Sr(n),
      owned: n.owned,
      review: ii(e, n),
      engine: n.engine,
      instrumental: n.instrumental,
      context: n.context,
      target_seconds: n.target_seconds ?? null
    });
    if (!!a.findings.some((p) => p.severity === "error") || !a.fingerprint) return i;
    const f = _r(i, a.fingerprint);
    return r.value = De(f), e.setDirtyCanvas?.(!0, !0), f;
  } catch {
    return i;
  }
}
const Co = "PLENIO_SHEET_STATE", qn = 68;
let ut = null;
function li(e) {
  ut = e;
}
const ci = (e, t, n) => {
  let o = typeof n?.[1]?.default == "string" ? n[1].default : "";
  const r = document.createElement("div");
  r.className = "plenio-sheet-state";
  const s = document.createElement("span");
  s.className = "plenio-sheet-summary";
  const i = document.createElement("button");
  i.className = "plenio-sheet-open", i.textContent = "Edit Song Sheet…";
  const a = document.createElement("div");
  a.className = "plenio-sheet-status", r.append(i, s, a);
  let l = !1;
  const f = () => {
    const M = Ee(String(e.id)), k = zt(e);
    s.textContent = vr(Se(o)) + (M && k !== "approved" ? ` · ${M.status}` : ""), a.textContent = ms(k), a.dataset.state = k ?? "";
    const H = l ? null : e.widgets?.find((u) => u.name === "review");
    if (H) {
      l = !0;
      const u = H.callback;
      H.callback = (W) => {
        u?.(W), f();
      };
    }
  }, p = e.addDOMWidget(t, Co, r, {
    getValue: () => o,
    setValue: (M) => {
      o = typeof M == "string" ? M : "", f();
    },
    // two rows, always: the frontend lays a DOM widget out once, so a height that changes later is cut;
    // it also keeps a 10 px margin above and below the element (68 - 20 = the rows' 48 px)
    getMinHeight: () => qn,
    getMaxHeight: () => qn
  });
  i.addEventListener("click", (M) => {
    M.stopPropagation(), m().catch((k) => {
      console.error("Plenio: the Song Sheet editor could not open", k), s.textContent = `The editor could not open: ${k instanceof Error ? k.message : String(k)}`;
    });
  });
  async function m() {
    const M = Se(o);
    M === null && (s.textContent = "The stored state is unreadable; it will be replaced when you apply.");
    const k = Ee(String(e.id)), u = (e.inputs ?? []).filter((N) => N.link != null).map((N) => N.name), W = M ?? { schema: "plenio.sheet_state/1", docs: {} }, A = k?.owned ?? Zn(u, W), w = String(e.widgets?.find((N) => N.name === "review")?.value ?? "continue"), g = w === "as the brief says" ? k?.review ?? "continue" : w, b = () => Xt(import.meta.url, Yt), { openSheetDialog: y } = await Re(() => import("./open-D2ymo_Qm.mjs"), b), { parseGuide: L, serializeGuide: E } = await Re(() => import("./tracks-DxmZeggM.mjs"), b), { parseShift: V, parseSpans: z } = await Re(() => import("./lyricPlacement-rAf-x_fn.mjs"), b);
    if (!ut) throw new Error("Plenio: API not initialised");
    let P = null;
    try {
      P = oi(e, k, Ee);
    } catch (N) {
      console.warn("Plenio: the lyrics sheet of this score was not found", N);
    }
    let D = null;
    try {
      D = si(e, k, Ee);
    } catch (N) {
      console.warn("Plenio: the score sheet of these lyrics was not found", N);
    }
    const j = ut;
    y({
      title: e.title || "Song Sheet",
      state: W,
      payload: k,
      asrNote: fs(k?.docs.lyrics?.upstream_sha256),
      owned: A.length ? A : [...We],
      review: g,
      fetcher: ut,
      // a template's choice of the score editor's layout (review, text; daw with the DAW template)
      layout: typeof e.properties?.plenio_editor_layout == "string" ? e.properties.plenio_editor_layout : null,
      // the Guide track (playback and MIDI only), kept in the node's properties with the workflow
      guide: L(e.properties?.plenio_guide),
      // the lyrics lines placed by hand in the lyrics lane, kept like the Guide notes
      lyricSpans: z(e.properties?.plenio_lyric_spans),
      // how far a cover's source recording is moved against the bars (the beat grid corrected by hand)
      sourceShift: V(e.properties?.plenio_source_shift),
      lyricsTarget: P?.target ?? null,
      scoreTarget: D?.target ?? null,
      onApply: (N, pe, Q, T, O, ie) => {
        const Ve = String(p.value ?? "");
        if (p.value = De(N), e.properties = {
          ...e.properties ?? {},
          plenio_guide: E(pe),
          plenio_lyric_spans: (ie?.lyricSpans ?? []).map((ae) => [...ae]),
          plenio_source_shift: ie?.sourceShift ?? 0
        }, O ? Le(e, "approved") : String(p.value) !== Ve && S(e), Q !== null && P && !P.target.blocked && (ri(P.owner, Q, Ee(String(P.owner.id))), S(P.owner)), T && D && !D.target.blocked) {
          const ae = D.owner;
          ai(ae, T.text, Ee(String(ae.id)), T.approved ? { fetcher: j } : null).then(
            (U) => {
              U?.review?.approved_fingerprint ? Le(ae, "approved") : S(ae);
            }
          );
        }
        e.setDirtyCanvas?.(!0, !0);
      }
    });
  }
  function S(M) {
    co(M) === "approved" && Le(M, null);
  }
  const _ = [
    us((M) => {
      M === String(e.id) && f();
    }),
    ws((M) => {
      (M === null || M === e) && f();
    })
  ], R = e.onRemoved;
  return e.onRemoved = function() {
    for (const M of _) M();
    R?.call(this);
  }, f(), { widget: p };
}, je = "plenio.stem_mix/1", Te = "rest", ui = ["reverb", "delay"], Oo = -60, di = 12;
function fi() {
  return { gain_db: 0, mute: !1, solo: !1, compression: 0, muted: [], reverb: 0, delay: 0, save: !1 };
}
function oe(e, t) {
  const n = e?.strips?.[t] ?? {};
  return {
    gain_db: typeof n.gain_db == "number" ? n.gain_db : 0,
    mute: n.mute === !0,
    solo: n.solo === !0,
    compression: typeof n.compression == "number" ? n.compression : 0,
    muted: Array.isArray(n.muted) ? n.muted.map((o) => [o[0], o[1]]) : [],
    reverb: typeof n.reverb == "number" ? n.reverb : 0,
    delay: typeof n.delay == "number" ? n.delay : 0,
    save: n.save === !0
  };
}
function qo(e) {
  const t = fi();
  return e.gain_db === t.gain_db && e.mute === t.mute && e.solo === t.solo && e.compression === t.compression && e.muted.length === 0 && e.reverb === t.reverb && e.delay === t.delay && e.save === t.save;
}
const pi = ["vocals", "drums", "bass", "other"];
function hi() {
  return [...pi, Te];
}
function mi(e) {
  if (typeof e != "string" || !e.trim()) return { schema: je, strips: {} };
  try {
    const t = JSON.parse(e);
    return t?.schema !== je || typeof t.strips != "object" || t.strips === null ? null : t;
  } catch {
    return null;
  }
}
function gi(e) {
  const t = {};
  for (const o of Object.keys(e.strips)) {
    if (!o || qo(oe(e, o))) continue;
    const r = {}, s = oe(e, o);
    s.gain_db && (r.gain_db = s.gain_db), s.mute && (r.mute = !0), s.solo && (r.solo = !0), s.compression && (r.compression = s.compression), s.muted.length && (r.muted = s.muted), s.reverb && (r.reverb = s.reverb), s.delay && (r.delay = s.delay), s.save && (r.save = !0), t[o] = r;
  }
  const n = { schema: je, strips: t };
  return e.reverb && Object.keys(e.reverb).length && (n.reverb = e.reverb), e.delay && Object.keys(e.delay).length && (n.delay = e.delay), JSON.stringify(n);
}
function pt(e, t, n) {
  const o = { ...e.strips };
  return qo(n) ? delete o[t] : o[t] = n, { ...e, strips: o };
}
function bi(e, t, n) {
  const o = n.some((s) => oe(e, s).solo), r = oe(e, t);
  return o ? r.solo : !r.mute;
}
function In(e) {
  return e <= Oo ? "-∞" : `${e > 0 ? "+" : ""}${e.toFixed(1)}`;
}
function wi(e, t = null) {
  const n = e.filter((r) => Array.isArray(r) && r.length === 2 && Number.isFinite(r[0]) && Number.isFinite(r[1])).map((r) => [Math.max(0, Math.min(r[0], r[1])), Math.max(r[0], r[1])]).filter((r) => r[1] - r[0] > 1e-6).sort((r, s) => r[0] - s[0]), o = [];
  for (const r of n) {
    const s = o[o.length - 1];
    s && r[0] <= s[1] + 1e-6 ? s[1] = Math.max(s[1], r[1]) : o.push([...r]);
  }
  return t !== null && t > 0 ? o.map(([r, s]) => [Math.min(r, t), Math.min(s, t)]).filter(([r, s]) => s - r > 1e-6) : o;
}
function yi(e, t, n) {
  return wi([...e, [t, n]]);
}
function vi(e, t) {
  return e.findIndex(([n, o]) => n <= t && t <= o);
}
function xi(e, t) {
  return t < 0 ? e : e.filter((n, o) => o !== t);
}
function _i(e, t, n, o) {
  const r = oe(e, t);
  return pt(e, t, { ...r, muted: yi(r.muted, n, o) });
}
function Si(e, t, n) {
  const o = oe(e, t), r = vi(o.muted, n);
  return r < 0 ? e : pt(e, t, { ...o, muted: xi(o.muted, r) });
}
function ki(e) {
  const t = e?.plenio_stems, n = t?.[t.length - 1];
  if (!n?.peaks) return {};
  const o = {};
  for (const [r, s] of Object.entries(n.peaks))
    Array.isArray(s) && s.length && (o[r] = s.map((i) => Math.abs(Number(i) || 0)));
  return o;
}
function Ei(e, t, n = 200) {
  const o = e[t];
  return o?.length ? o.length === n ? o : Array.from({ length: n }, (r, s) => o[Math.floor(s * o.length / n)] ?? 0) : new Array(n).fill(0);
}
function Pn(e, t) {
  const o = (Array.isArray(t?.stems) && t.stems.length ? t.stems : hi()).filter((s) => s !== Te), r = Object.keys(e?.strips ?? {}).filter((s) => s !== Te && !o.includes(s));
  return [...o, ...r, Te];
}
const Rn = "plenio_stem_mixer", zn = "mix", ge = 200, Mi = ["room", "plate", "hall"];
function I(e, t, n) {
  const o = document.createElement(e);
  return t && (o.className = t), n !== void 0 && (o.textContent = n), o;
}
function ot(e, t, n, o, r) {
  const s = I("input");
  return s.type = "range", s.min = String(e), s.max = String(t), s.step = String(n), s.value = String(o), s.setAttribute("aria-label", r), s;
}
function $i(e) {
  const t = I("div", "plenio-mix"), n = I("div", "plenio-mix-strips"), o = I("div", "plenio-mix-buses"), r = I("div", "plenio-mix-info"), s = I("div", "plenio-mix-advanced");
  t.append(n, o, s, r);
  let i = {
    mix: { schema: je, strips: {} },
    // the documented stems are there before the first run (owner's request, 2026-09-28); a separation
    // replaces them with what the model actually produced
    names: Pn(null, null),
    peaks: {},
    seconds: 0
  }, a = !1;
  const l = () => e.widgets?.find((w) => w.name === zn);
  function f(w, { draw: g = !0 } = {}) {
    const b = l();
    if (!b) return;
    const y = gi(w);
    b.value = y, b.callback?.(y), i = { ...i, mix: w }, g && _();
  }
  function p(w, g, b = {}) {
    f(pt(i.mix, w, { ...oe(i.mix, w), ...g }), b);
  }
  function m(w, g, b, y = {}) {
    const L = oe(i.mix, w);
    let E = pt(i.mix, w, { ...L, [g]: b });
    b > 0 && !(E[g] && Object.keys(E[g]).length) && (E = g === "reverb" ? { ...E, reverb: { preset: "room" } } : { ...E, delay: { time_ms: 375, feedback: 0.35, lowpass_hz: 4e3 } }), f(E, y);
  }
  function S(w, g, b) {
    const y = { ...i.mix[w] ?? {} };
    f({ ...i.mix, [w]: { ...y, [g]: b } });
  }
  function _() {
    n.replaceChildren();
    const w = i.names;
    for (const g of i.names) {
      const b = oe(i.mix, g), y = I("div", "plenio-mix-strip");
      y.dataset.strip = g;
      const L = I("span", "name", g === Te ? `${g} (missed)` : g);
      L.title = g === Te ? "What the separator missed: keeps a neutral mix exact" : "";
      const E = ot(Oo, di, 0.5, b.gain_db, `${g} gain`), V = I("span", "gain", `${In(b.gain_db)} dB`);
      E.addEventListener("input", () => {
        V.textContent = `${In(Number(E.value))} dB`, p(g, { gain_db: Number(E.value) }, { draw: !1 });
      }), E.addEventListener("change", () => p(g, { gain_db: Number(E.value) }));
      const z = I("button", b.mute ? "toggle active" : "toggle", "M");
      z.setAttribute("aria-label", `${g} mute`), z.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { mute: !b.mute });
      });
      const P = I("button", b.solo ? "toggle active" : "toggle", "S");
      P.setAttribute("aria-label", `${g} solo`), P.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { solo: !b.solo });
      });
      const D = ot(0, 1, 0.05, b.compression, `${g} compression`);
      D.title = "Compression amount: one knob for the master compressor (threshold and ratio)", D.addEventListener("input", () => p(g, { compression: Number(D.value) }, { draw: !1 })), D.addEventListener("change", () => p(g, { compression: Number(D.value) }));
      const j = ui.map((T) => {
        const O = ot(0, 1, 0.05, b[T], `${g} ${T} send`);
        return O.title = `${T} send: how much of this stem goes to the shared ${T} bus`, O.addEventListener("input", () => m(g, T, Number(O.value), { draw: !1 })), O.addEventListener("change", () => m(g, T, Number(O.value))), O;
      }), N = I("button", b.save ? "toggle active" : "toggle", "save");
      N.setAttribute("aria-label", `${g} save as its own file`), N.setAttribute("aria-pressed", String(b.save)), N.title = 'Save this stem as its own 24-bit FLAC file on the next run - next to the song, in the folder "<name>-stems" (without an Export Release: output/plenio/stems); its gain, compression and muted ranges are applied, mute/solo and the buses are not', N.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { save: !b.save });
      });
      const pe = bi(i.mix, g, w);
      y.classList.toggle("silent", !pe);
      const Q = I("canvas", "plenio-mix-wave");
      Q.width = ge, Q.height = 26, Q.setAttribute("aria-label", `${g} waveform (drag to mute a time range)`), R(Q, b, Ei(i.peaks, g, ge)), Q.addEventListener("pointerdown", (T) => M(T, Q, g)), y.append(
        L,
        E,
        V,
        z,
        P,
        I("span", "label", "comp"),
        D,
        I("span", "label", "verb"),
        j[0],
        I("span", "label", "delay"),
        j[1],
        N,
        Q
      ), n.append(y);
    }
    k(), r.textContent = i.seconds ? `last run: ${i.seconds.toFixed(1)} s - drag on a strip to mute a time range, click a range to remove it` : "no run yet: the strips show the documented stems (vocals, drums, bass, other and the residual rest); Separate Stems fills them", e.setDirtyCanvas?.(!0, !0);
  }
  function R(w, g, b) {
    const y = w.getContext("2d");
    if (!y) return;
    y.clearRect(0, 0, ge, w.height);
    const L = w.height / 2;
    y.strokeStyle = "rgba(180, 190, 205, 0.8)", y.beginPath();
    for (let E = 0; E < b.length; E++) {
      const V = Math.max(1, b[E] * (L - 1));
      y.moveTo(E + 0.5, L - V), y.lineTo(E + 0.5, L + V);
    }
    y.stroke(), y.fillStyle = "rgba(224, 104, 94, 0.35)", y.strokeStyle = "rgba(224, 104, 94, 0.9)";
    for (const [E, V] of g.muted) {
      const z = Math.max(0, Math.min(ge, E / Math.max(i.seconds, 1e-6) * ge)), P = Math.max(0, Math.min(ge, V / Math.max(i.seconds, 1e-6) * ge));
      y.fillRect(z, 0, Math.max(1, P - z), w.height), y.strokeRect(z + 0.5, 0.5, Math.max(1, P - z) - 1, w.height - 1);
    }
  }
  function M(w, g, b) {
    if (w.preventDefault(), w.stopPropagation(), !i.seconds) return;
    const y = g.getBoundingClientRect(), L = (j) => Math.max(0, Math.min(1, (j - y.left) / (y.width || ge))) * i.seconds, E = L(w.clientX);
    if (oe(i.mix, b).muted.some(([j, N]) => j <= E && E <= N)) {
      f(Si(i.mix, b, E));
      return;
    }
    let z = E;
    const P = (j) => {
      z = L(j.clientX);
    }, D = () => {
      window.removeEventListener("pointermove", P), window.removeEventListener("pointerup", D), f(_i(i.mix, b, Math.min(E, z), Math.max(E, z)));
    };
    window.addEventListener("pointermove", P), window.addEventListener("pointerup", D);
  }
  function k() {
    o.replaceChildren();
    const w = { preset: "room", ...i.mix.reverb ?? {} }, g = { time_ms: 375, feedback: 0.35, ...i.mix.delay ?? {} }, b = I("select");
    b.setAttribute("aria-label", "Reverb preset"), b.title = "The room the reverb bus adds; the amount per stem is its verb send";
    for (const E of Mi) b.append(new Option(E, E));
    b.value = String(w.preset ?? "room"), b.addEventListener("change", () => S("reverb", "preset", b.value));
    const y = I("input");
    y.type = "number", y.value = String(g.time_ms ?? 375), y.setAttribute("aria-label", "Delay time in ms"), y.title = "Delay time in ms: where the first echo of the delay bus sits", y.addEventListener("change", () => S("delay", "time_ms", Number(y.value)));
    const L = ot(0, 0.8, 0.05, Number(g.feedback ?? 0.35), "Delay feedback");
    L.title = "Delay feedback: how much of each echo returns into the delay line", L.addEventListener("input", () => S("delay", "feedback", Number(L.value))), o.append(
      I("span", "label", "reverb bus"),
      b,
      I("span", "label", "delay bus"),
      y,
      I("span", "label", "ms, feedback"),
      L
    ), o.style.display = "flex";
  }
  const H = e.addDOMWidget(Rn, Rn, t, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 260,
    getMaxHeight: () => 620
  });
  H.serialize = !1;
  const u = e.widgets?.find((w) => w.name === zn), W = I("button", "toggle", "JSON");
  W.title = "Show or hide the raw mixer value", W.addEventListener("click", (w) => {
    w.stopPropagation(), a = !a, W.classList.toggle("active", a), u && (u.plenioHidden = !a, a ? delete u.computeSize : u.computeSize = () => [0, -4]), e.setDirtyCanvas?.(!0, !0);
  }), s.append(I("span", "label", "Advanced"), W), u && (u.plenioHidden = !0, u.computeSize = () => [0, -4]);
  function A() {
    const w = mi(l()?.value);
    i = { ...i, mix: w ?? { schema: je, strips: {} } }, w || (r.textContent = "the mixer value is not readable; it will be replaced on the next edit"), _();
  }
  return A(), {
    showExecuted(w) {
      const g = w?.plenio_stems?.at(-1), b = ki(w), y = Pn(i.mix, g ?? null);
      i = { ...i, names: y, peaks: b, seconds: Number(g?.seconds ?? i.seconds) || 0 }, A();
    }
  };
}
const Bt = "plenio-tip", Dn = 12, rt = 8;
function Ai(e, t, n, o) {
  let r = e.right + Dn;
  if (r + n.width > o.width - rt && (r = e.left - Dn - n.width), r < rt) return null;
  const s = Math.max(rt, Math.min(t - 14, o.height - rt - n.height));
  return { x: r, y: s };
}
function Li(e) {
  return !!e && (String(e.type ?? "").startsWith("Plenio") || String(e.title ?? "").startsWith("Plenio"));
}
const Ni = 30;
function Ti(e) {
  const t = e.node_over, n = e.ds, o = e.canvas;
  if (!t || !n || !o) return null;
  const r = o.getBoundingClientRect(), s = t.flags?.collapsed ? 0 : t.size[1];
  return {
    left: r.left + (t.pos[0] + n.offset[0]) * n.scale,
    top: r.top + (t.pos[1] - Ni + n.offset[1]) * n.scale,
    right: r.left + (t.pos[0] + t.size[0] + n.offset[0]) * n.scale,
    bottom: r.top + (t.pos[1] + s + n.offset[1]) * n.scale
  };
}
function Ci(e) {
  const t = document.body, n = () => t.classList.remove(Bt);
  let o = 0, r = null;
  const s = (a) => {
    const l = e();
    if (a.style.display === "none" || !a.textContent?.trim() || !l || !Li(l.node_over)) return n();
    const f = Ti(l), p = a.getBoundingClientRect(), m = f && Ai(f, o, p, { width: window.innerWidth, height: window.innerHeight });
    if (!m) return n();
    const S = a.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    t.style.setProperty("--plenio-tip-x", `${Math.round(m.x - S.left)}px`), t.style.setProperty("--plenio-tip-y", `${Math.round(m.y - S.top)}px`), t.classList.add(Bt);
  }, i = () => {
    const a = document.querySelector(".node-tooltip");
    a && (r = a, new MutationObserver(() => s(a)).observe(a, {
      attributes: !0,
      attributeFilter: ["style"],
      childList: !0,
      characterData: !0,
      subtree: !0
    }));
  };
  window.addEventListener("mousemove", (a) => {
    o = a.clientY, r?.isConnected || i();
  });
}
const Oi = `
body.${Bt} .node-tooltip { left: var(--plenio-tip-x) !important; top: var(--plenio-tip-y) !important;
  transform: none !important; }
`, qi = `
.plenio-sheet-state { display: flex; flex-wrap: wrap; align-items: center; column-gap: 8px; font: 12px/28px var(--font-family, sans-serif);
  color: var(--descrip-text, #999); padding: 0 4px; white-space: nowrap; overflow: hidden; }
.plenio-sheet-summary { flex: 1 1 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.plenio-sheet-status { flex: 1 0 100%; font-weight: 600; line-height: 18px; overflow: hidden; text-overflow: ellipsis; }
.plenio-sheet-status[data-state="stop"] { color: #8fa3bf; }
.plenio-sheet-status[data-state="waiting"] { color: #e3a82b; }
.plenio-sheet-status[data-state="approved"], .plenio-sheet-status[data-state="ok"] { color: #4fbf7f; }
.plenio-sheet-status[data-state="warning"] { color: #d8a31a; }
.plenio-sheet-status[data-state="error"] { color: #e0574a; }
.plenio-sheet-open { flex: none; padding: 2px 10px; border-radius: 6px; border: 1px solid var(--border-color, #555);
  background: var(--comfy-input-bg, #333); color: var(--input-text, #ddd); cursor: pointer; font: inherit; line-height: 20px; }
.plenio-sheet-open:hover { background: #2f6fb0; color: #fff; }
.plenio-summary { font: 12px/1.45 var(--font-family, sans-serif); color: var(--input-text, #ddd);
  background: var(--comfy-input-bg, #222); border-radius: 6px; padding: 6px 10px; overflow: auto; }
.plenio-summary[data-status="warning"] { border-left: 3px solid #d8a31a; }
.plenio-summary[data-status="error"] { border-left: 3px solid #d0453b; }
.plenio-summary h3, .plenio-summary h4, .plenio-summary h5 { margin: 6px 0 4px; font-size: 13px; }
.plenio-summary ul { margin: 2px 0 6px 16px; padding: 0; }
.plenio-summary p { margin: 4px 0; }
.plenio-summary pre { white-space: pre-wrap; font-size: 11px; }
.plenio-summary code { font-family: var(--code-font, monospace); }
.plenio-summary table { border-collapse: collapse; margin: 2px 0 8px; font-size: 11px; width: 100%; }
.plenio-summary th, .plenio-summary td { text-align: left; vertical-align: top; padding: 2px 6px 2px 0; border-bottom: 1px solid rgba(127, 127, 127, 0.25); }
.plenio-summary th { font-weight: 600; }
.plenio-eq { display: flex; flex-direction: column; gap: 4px; font: 11px/1.4 var(--font-family, sans-serif);
  color: var(--descrip-text, #999); }
.plenio-eq-tools { display: flex; gap: 6px; align-items: center; min-width: 0; }
.plenio-eq-tools select { max-width: 45%; background: var(--comfy-input-bg, #333); color: var(--input-text, #ddd);
  border: 1px solid var(--border-color, #555); border-radius: 4px; font: inherit; }
.plenio-eq-info { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.plenio-eq-plot { width: 100%; height: auto; background: var(--comfy-input-bg, #222); border-radius: 6px; touch-action: none; }
.plenio-eq-plot .grid { stroke: var(--border-color, #444); stroke-width: 0.6; }
.plenio-eq-plot .grid.zero { stroke-width: 1.2; }
.plenio-eq-plot .curve { fill: none; stroke: #4aa3ff; stroke-width: 2; }
.plenio-eq-plot .handle { fill: var(--comfy-menu-bg, #1a1a1a); stroke: #4aa3ff; stroke-width: 2; cursor: grab; }
.plenio-eq-plot .handle.selected, .plenio-eq-plot .handle:focus { fill: #4aa3ff; outline: none; }
.plenio-eq-plot .handle.disabled { opacity: 0.35; }
.plenio-eq-plot { min-height: 260px; }
.plenio-eq-plot .spectrum { stroke: none; }
.plenio-eq-plot .spectrum.before { fill: rgba(160, 170, 185, 0.25); }
.plenio-eq-plot .spectrum.after { fill: rgba(76, 163, 255, 0.28); }
.plenio-eq-plot .curve.flat { stroke: var(--descrip-text, #999); stroke-dasharray: 4 3; }
.plenio-eq-tools button { padding: 1px 6px; border-radius: 5px; border: 1px solid var(--border-color, #555);
  background: var(--comfy-input-bg, #333); color: var(--input-text, #ddd); cursor: pointer; font: inherit; }
.plenio-eq-tools button:disabled { opacity: 0.45; cursor: default; }
.plenio-eq-tools button.active { background: #2d5d9f; color: #fff; }
.plenio-eq-strip { display: flex; flex-wrap: wrap; gap: 4px; }
.plenio-eq-chip { padding: 1px 6px; border-radius: 5px; border: 1px solid var(--border-color, #555);
  border-left-width: 3px; background: var(--comfy-input-bg, #333); color: var(--input-text, #ddd);
  cursor: pointer; font: inherit; text-align: left; }
.plenio-eq-chip.selected { background: #2d5d9f; color: #fff; }
.plenio-eq-chip.disabled { opacity: 0.5; text-decoration: line-through; }
.plenio-eq-mode { display: flex; align-items: center; gap: 6px; }
.plenio-eq-mode button { padding: 1px 8px; border-radius: 5px; border: 1px solid var(--border-color, #555);
  background: var(--comfy-input-bg, #333); color: var(--input-text, #ddd); cursor: pointer; font: inherit; }
.plenio-eq-editor .plenio-eq-fields { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.plenio-eq-editor .plenio-eq-fields .name { color: var(--descrip-text, #999); }
.plenio-eq-editor input.number { background: var(--comfy-input-bg, #333); color: var(--input-text, #ddd);
  border: 1px solid var(--border-color, #555); border-radius: 4px; font: inherit; }
.plenio-eq-hint { color: var(--descrip-text, #999); }
.plenio-brief-template { display: flex; flex-direction: column; gap: 3px; font: 11px/1.35 var(--font-family, sans-serif);
  color: var(--descrip-text, #999); padding: 2px 4px; overflow: hidden; }
.plenio-brief-template .line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.plenio-brief-template .line[data-state="ok"] { color: #8fb6d9; }
.plenio-brief-template .line[data-state="error"] { color: #d0453b; }
.plenio-brief-template .hint { color: #c79a3a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.plenio-brief-template .mode { color: #b9a3d9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; }
.plenio-brief-template .actions { display: flex; flex-wrap: wrap; gap: 4px; }
.plenio-brief-template button { white-space: nowrap; padding: 1px 6px; border-radius: 5px; border: 1px solid var(--border-color, #555);
  background: var(--comfy-input-bg, #333); color: var(--input-text, #ddd); cursor: pointer; font: inherit; }
.plenio-brief-template button:disabled { opacity: 0.45; cursor: default; }
.plenio-mix { display: flex; flex-direction: column; gap: 4px; font: 11px/1.4 var(--font-family, sans-serif);
  color: var(--descrip-text, #999); overflow-y: auto; }
.plenio-mix-strips { display: flex; flex-direction: column; gap: 3px; }
.plenio-mix-strip { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 2px 4px;
  border-radius: 5px; background: rgba(127, 127, 127, 0.08); }
.plenio-mix-strip .name { flex: 0 0 62px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--input-text, #ddd); }
.plenio-mix-strip .gain { flex: 0 0 54px; text-align: right; font-variant-numeric: tabular-nums; }
.plenio-mix-strip .label, .plenio-mix-buses .label, .plenio-mix-advanced .label { opacity: 0.8; }
.plenio-mix-strip input[type="range"] { width: 84px; height: 14px; accent-color: #4aa3ff; }
.plenio-mix .toggle { padding: 1px 6px; min-width: 22px; text-align: center; border-radius: 5px;
  border: 1px solid var(--border-color, #555); background: var(--comfy-input-bg, #333);
  color: var(--input-text, #ddd); cursor: pointer; font: inherit; }
.plenio-mix .toggle.active { background: #2d5d9f; color: #fff; }
.plenio-mix-strip.silent { opacity: 0.5; }
.plenio-mix-wave { flex: 1 0 160px; max-width: 320px; height: 26px; background: var(--comfy-input-bg, #222);
  border-radius: 4px; cursor: crosshair; touch-action: none; }
.plenio-mix-buses { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.plenio-mix-buses select, .plenio-mix-buses input[type="number"] { background: var(--comfy-input-bg, #333);
  color: var(--input-text, #ddd); border: 1px solid var(--border-color, #555); border-radius: 4px;
  font: inherit; }
.plenio-mix-buses input[type="number"] { width: 64px; }
.plenio-mix-buses input[type="range"] { width: 84px; accent-color: #4aa3ff; }
.plenio-mix-advanced { display: flex; align-items: center; gap: 6px; }
.plenio-mix-info { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.plenio-seed-hint { font: 11px/1.35 var(--font-family, sans-serif); color: var(--descrip-text, #aaa); padding: 2px 6px; white-space: normal; overflow-wrap: anywhere;
  overflow: hidden; }
` + Oi;
function Ii() {
  if (document.getElementById("plenio-styles")) return;
  const e = document.createElement("style");
  e.id = "plenio-styles", e.textContent = qi, document.head.append(e);
}
function Ht(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function st(e) {
  return Ht(e).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
function Pi(e) {
  const t = e.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((n) => n.trim());
  return t.every((n) => /^:?-{3,}:?$/.test(n)) ? null : t;
}
function Ri(e) {
  const t = [];
  let n = !1, o = null, r = null;
  const s = () => {
    n && (t.push("</ul>"), n = !1);
  }, i = () => {
    if (r) {
      const [a, ...l] = r, f = (p, m) => `<tr>${p.map((S) => `<${m}>${st(S)}</${m}>`).join("")}</tr>`;
      t.push(`<table><thead>${f(a, "th")}</thead><tbody>${l.map((p) => f(p, "td")).join("")}</tbody></table>`), r = null;
    }
  };
  for (const a of e.replace(/\r\n?/g, `
`).split(`
`)) {
    if (o !== null) {
      a.startsWith("```") ? (t.push(`<pre><code>${Ht(o.join(`
`))}</code></pre>`), o = null) : o.push(a);
      continue;
    }
    if (a.trim().startsWith("|")) {
      s();
      const p = Pi(a);
      p && (r ??= []).push(p);
      continue;
    }
    if (i(), a.startsWith("```")) {
      s(), o = [];
      continue;
    }
    const l = /^(#{1,4})\s+(.*)$/.exec(a);
    if (l) {
      s();
      const p = Math.min(l[1].length + 2, 6);
      t.push(`<h${p}>${st(l[2])}</h${p}>`);
      continue;
    }
    const f = /^\s*[-*]\s+(.*)$/.exec(a);
    if (f) {
      n || (t.push("<ul>"), n = !0), t.push(`<li>${st(f[1])}</li>`);
      continue;
    }
    s(), a.trim() && t.push(`<p>${st(a)}</p>`);
  }
  return s(), i(), o !== null && t.push(`<pre><code>${Ht(o.join(`
`))}</code></pre>`), t.join("");
}
const ze = "plenio_summary", Bn = "plenio_summary", Hn = 84, zi = 18, Di = 55, Bi = 16, jn = 10;
function Hi(e) {
  const t = e.split(`
`).filter((n) => n.trim()).reduce((n, o) => n + Math.max(1, Math.ceil(o.length / Di)), 0);
  return Bi + t * zi;
}
function ji(e, t) {
  const n = e.widgets?.find((i) => i.name === Bn);
  if (n?.element) return n.element;
  const o = document.createElement("div");
  o.className = "plenio-summary";
  let r = jn;
  const s = e.addDOMWidget(Bn, "plenio_summary", o, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => Hn,
    // as tall as its text: a short summary leaves the rest of the node to the other widgets. The margins
    // count too - without them the element stayed 20 px short of its text and hid the last line
    getMaxHeight: () => Math.max(Hn, (o.scrollHeight ? o.scrollHeight + 2 : Hi(t.markdown)) + 2 * r)
  });
  return r = s.margin ?? jn, s.serialize = !1, o;
}
function Fi(e) {
  const t = e.computeSize?.();
  t && e.size && e.size[1] < t[1] && e.setSize?.([e.size[0], t[1]]);
}
const Fn = /* @__PURE__ */ new WeakMap();
function jt(e, t) {
  if (!t.markdown) return;
  const n = Fn.get(e) ?? { markdown: "" };
  n.markdown = t.markdown, Fn.set(e, n);
  const o = ji(e, n);
  o.dataset.status = t.status ?? "", o.innerHTML = Ri(t.markdown), Fi(e), e.setDirtyCanvas?.(!0, !0);
}
function Wn(e, t, n, o) {
  const r = e.properties?.[ze], s = (r?.markdown ?? "").split(`
`), i = s.findIndex((l) => l.startsWith(t));
  i >= 0 ? s[i] = n : s.push(n);
  const a = { markdown: s.join(`
`).trim(), status: o ?? r?.status ?? "" };
  e.properties = e.properties ?? {}, e.properties[ze] = a, jt(e, a);
}
function Wi(e) {
  e.prototype.onExecuted = te(e.prototype.onExecuted, function(t) {
    const n = t?.[ze], o = n?.[n.length - 1];
    o?.markdown && (this.properties = this.properties ?? {}, this.properties[ze] = { markdown: o.markdown, status: o.status ?? "" }, jt(this, o));
  }), e.prototype.onConfigure = te(e.prototype.onConfigure, function() {
    const t = this.properties?.[ze];
    t?.markdown && jt(this, t);
  });
}
const Gi = "Plenio.Core", ne = Ko;
li(ne);
const fe = Un, Gn = { app: fe, fetcher: ne }, Io = () => fe.graph;
function Ft(e) {
  if (e == null) return null;
  const t = String(e);
  return Io()?.getNodeById?.(t.includes(":") ? t : Number(t)) ?? null;
}
const Vi = {
  scale: () => fe.canvas?.ds?.scale ?? 1,
  toast: (e, t) => fe.extensionManager?.toast?.add({ severity: "info", summary: e, detail: t, life: 12e3 })
}, Po = () => Xt(import.meta.url, Yt), Ui = {
  fetcher: ne,
  async draw(e, t, n, o) {
    const { notationPdf: r, renderLines: s } = await Re(
      () => import("./notationExport-DkCMgjck.mjs").then((a) => a.c),
      Po,
      "The sheet music is drawn and saved then."
    ), i = s(e, t, n, o);
    try {
      if (!i.lines.length) throw new Error("the score has no music to draw");
      return await r(i.lines, n, t);
    } finally {
      i.dispose();
    }
  }
};
function Xi(e, t) {
  const n = Ft(e), o = n?.properties?.plenio_summary;
  return n?.type === "PlenioExportRelease" && o?.markdown?.includes(`- sheet music: ${t}`) ? n : null;
}
function Yi(e, t) {
  const n = `- sheet music: ${e.job.file}`, o = Xi(t, e.job.file);
  if ("saved" in e) {
    o && Wn(o, n, `${n} - saved (${Math.max(1, Math.round(e.saved.bytes / 1024))} KB)`), fe.extensionManager?.toast?.add({ severity: "success", summary: "Sheet music saved", detail: e.saved.file, life: 6e3 });
    return;
  }
  const { error: r } = e, s = r instanceof re && r.hint ? `${r.message} ${r.hint}` : String(r instanceof Error ? r.message : r);
  if (e.quiet) {
    console.info(`Plenio: ${e.job.file} was saved by another page`);
    return;
  }
  o && Wn(o, n, `${n} - not saved: ${s}`, "warning"), fe.extensionManager?.toast?.add({ severity: "error", summary: "Sheet music not saved", detail: `${e.job.file}: ${s}`, life: 15e3 });
}
const Wt = /* @__PURE__ */ new Map(), Vn = new Ws(Ui, (e) => {
  Yi(e, Wt.get(e.job.token)), Wt.delete(e.job.token);
});
Un.registerExtension({
  name: Gi,
  getCustomWidgets: () => ({ [Co]: ci }),
  // a song's release record opens its workflow again, its documents kept (continueSong.ts)
  commands: [
    {
      id: dn,
      label: "Continue a Plenio song…",
      icon: "pi pi-history",
      function: () => Pr(Gn).catch((e) => {
        console.error("Plenio: the Continue a song dialog could not open", e), fe.extensionManager?.toast?.add({
          severity: "error",
          summary: "Continue a song",
          detail: String(e instanceof Error ? e.message : e),
          life: 15e3
        });
      })
    }
  ],
  menuCommands: [{ path: ["File"], commands: [dn] }],
  // the sheets' review stops depend on the linked brief's mode: known once the links are in place
  afterConfigureGraph: () => bs(),
  beforeRegisterNodeDef(e, t) {
    if (!t.name.startsWith("Plenio")) return;
    Wi(e), Es(e, Vi);
    const n = Fr(t.input);
    if (n.size || t.name in Qt) {
      const o = e.prototype.configure;
      e.prototype.configure = function(r) {
        const s = cs(t, r), i = zr(s), a = o?.call(this, s);
        return jr(this, i, n), ss(t.name, this.widgets), a;
      };
    }
    if (t.name === "PlenioTranscribeLyrics" && (e.prototype.onExecuted = te(e.prototype.onExecuted, function(o) {
      for (const r of o?.plenio_asr ?? []) ds(r);
    })), t.name === "PlenioEQ") {
      const o = /* @__PURE__ */ new WeakMap(), r = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        r?.call(this), o.set(this, es(this, ne));
      }, e.prototype.onExecuted = te(e.prototype.onExecuted, function(s) {
        o.get(this)?.showExecuted(s);
      });
    }
    if (t.name === Gs && Ks(e), mr.has(t.name) && gr(e, ne), t.name === "PlenioStemMixer") {
      const o = /* @__PURE__ */ new WeakMap(), r = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        r?.call(this), o.set(this, $i(this));
      }, e.prototype.onExecuted = te(e.prototype.onExecuted, function(s) {
        o.get(this)?.showExecuted(s);
      });
    }
    t.name === "PlenioSongSheet" && (e.prototype.onExecuted = te(e.prototype.onExecuted, function(o) {
      const r = o?.plenio_sheet, s = r?.[r.length - 1];
      s && kn(String(this.id), s);
    }));
  },
  setup() {
    Ii(), Ci(() => fe.canvas), Ir(Gn), ne.addEventListener("plenio.sheet", (n) => {
      const o = n.detail;
      if (!o?.node_id) return;
      kn(String(o.node_id), o);
      const r = Ft(o.node_id);
      r && Le(r, lo(o));
    }), ne.addEventListener("execution_start", () => {
      gs(Io()?.nodes ?? []);
    }), ne.addEventListener("execution_error", (n) => {
      const o = Ft(n.detail?.node_id);
      o && String(o.type).startsWith("Plenio") && Le(o, "error");
    }), ne.addEventListener("executed", (n) => {
      const o = n.detail, r = Bs(o?.output), s = o?.display_node ?? o?.node;
      for (const i of r) Wt.set(i.token, s);
      Vn.take(r);
    });
    const e = () => {
      Vn.recover();
    };
    let t = !1;
    ne.addEventListener("reconnected", () => {
      Po().then((n) => {
        n ? t || (t = !0, fe.extensionManager?.toast?.add({ severity: "warn", summary: "Plenio was updated", detail: qt })) : e();
      });
    }), document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible" && e();
    }), window.setTimeout(e, 3e3);
  }
});
export {
  De as $,
  ko as A,
  La as B,
  go as C,
  vo as D,
  wo as E,
  _e as F,
  Ma as G,
  Sa as H,
  Ts as I,
  Nn as J,
  Ea as K,
  na as L,
  ta as M,
  yo as N,
  Na as O,
  re as P,
  ka as Q,
  bo as R,
  xo as S,
  Y as T,
  fa as U,
  $a as V,
  Ki as W,
  la as X,
  ua as Y,
  aa as Z,
  da as _,
  ra as a,
  ca as a0,
  Zo as a1,
  Sr as a2,
  _r as a3,
  _a as a4,
  Is as a5,
  Aa as a6,
  Kn as a7,
  Gi as a8,
  Zi as b,
  oa as c,
  ho as d,
  pa as e,
  Ns as f,
  ma as g,
  ha as h,
  Qn as i,
  wa as j,
  ya as k,
  ia as l,
  ga as m,
  ba as n,
  ft as o,
  Jn as p,
  $s as q,
  ke as r,
  xa as s,
  ea as t,
  va as u,
  sa as v,
  Eo as w,
  tt as x,
  Cs as y,
  Rs as z
};
