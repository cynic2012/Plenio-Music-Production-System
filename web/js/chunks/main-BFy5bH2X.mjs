import { api as ls } from "../../../../scripts/api.js";
import { app as oo } from "../../../../scripts/app.js";
class V extends Error {
  constructor(t, n = null) {
    super(t), this.hint = n;
  }
  hint;
}
async function re(e, t, n) {
  const o = await e.fetchApi(t, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(n)
  }), s = await o.json();
  if (!o.ok) {
    const r = s?.error ?? {};
    throw new V(r.message ?? `Request failed (${o.status})`, r.hint ?? null);
  }
  return s;
}
function cs(e, t) {
  return re(e, "/plenio/sheet/resolve", t);
}
async function xa(e, t) {
  if (!/^[0-9a-f]{64}$/.test(t)) return null;
  const n = await e.fetchApi(`/plenio/asr/notes/${t}`);
  return n.ok ? (await n.json())?.note ?? null : null;
}
function Kt(e, t, n) {
  return t ? n?.length ? { ...e, lyrics: t, lyric_spans: n } : { ...e, lyrics: t } : e;
}
function _a(e, t, n, o) {
  return re(e, "/plenio/score/analyze", Kt({ abc: t }, n, o));
}
function Sa(e, t, n, o, s) {
  return re(e, "/plenio/score/transform", Kt({ abc: t, operation: n }, o, s));
}
function ka(e, t) {
  const { lyrics: n, spans: o, ...s } = t;
  return re(e, "/plenio/score/musicxml/export", Kt(s, n, o));
}
function Ea(e, t) {
  return re(e, "/plenio/score/midi/export", t);
}
function $a(e, t) {
  return re(e, "/plenio/score/midi/import", t);
}
function Ma(e, t) {
  return re(e, "/plenio/lyrics/analyze", t);
}
function Aa(e, t) {
  const o = `/view?${new URLSearchParams({ filename: t.filename, subfolder: t.subfolder, type: t.type }).toString()}`;
  return e.apiURL ? e.apiURL(o) : `/api${o}`;
}
function un(e, t, n, o = 200) {
  return re(e, "/plenio/eq/response", { settings: t, sample_rate: n, points: o });
}
function us(e, t) {
  return re(e, "/plenio/brief/fields", t);
}
async function ds(e) {
  const t = await e.fetchApi("/plenio/presets/eq");
  if (!t.ok) throw new V(`Request failed (${t.status})`);
  return await t.json();
}
async function La(e) {
  const t = await e.fetchApi("/plenio/records"), n = await t.json();
  if (!t.ok) {
    const o = n?.error ?? {};
    throw new V(o.message ?? `Request failed (${t.status})`, o.hint ?? null);
  }
  return n?.records ?? [];
}
function fs(e, t) {
  return re(e, "/plenio/records/continue", t);
}
function ps(e, t) {
  return re(e, "/plenio/workflow/blocks", { workflow: t });
}
function ne(e, t) {
  return function(...n) {
    e?.apply(this, n), t.apply(this, n);
  };
}
const qt = "Plenio · ", hs = /* @__PURE__ */ new Set(["YuE2GenerateABC", "YuE2GenerateMusic", "PlenioComposePrompt", "PlenioComposeArrangement"]), ms = "PlenioCreativity";
function gs(e) {
  const t = e?.definitions?.subgraphs;
  return Array.isArray(t) ? t : [];
}
function ys(e) {
  return gs(e).some((t) => {
    if (typeof t?.name != "string" || !t.name.startsWith(qt)) return !1;
    const n = new Set((t.nodes ?? []).map((o) => o?.type));
    return !n.has(ms) && [...n].some((o) => hs.has(String(o)));
  });
}
async function bs(e, t) {
  if (!e || typeof e != "object" || !ys(e)) return null;
  const n = await ps(t, e);
  if (n.workflow) {
    const o = e;
    for (const s of Object.keys(o)) delete o[s];
    Object.assign(o, n.workflow);
  }
  return n;
}
const zt = (e) => e.startsWith(qt) ? e.slice(qt.length) : e, dn = (e) => e.map(zt).join(", ");
function ws(e) {
  if (!e) return [];
  const t = [];
  if (e.updated.length) {
    const o = e.linked.length ? ` The creativity of ${dn(e.linked)} now comes from the brief.` : "";
    t.push({
      severity: "info",
      summary: "Plenio blocks brought up to date",
      detail: `This workflow was saved before its blocks followed the brief's creativity: ${dn(e.updated)} are the current blocks now.${o} At creativity 50 they work exactly as before. Save the workflow to keep it.`
    });
  }
  const n = [
    ...e.kept.map(([o, s]) => `${zt(o)} was kept as it was (${s}) - its sampling stays fixed`),
    ...e.unlinked.map(([o, s]) => `${zt(o)} has its own creativity slider (${s})`)
  ];
  return n.length && t.push({
    severity: "warn",
    summary: "The brief's creativity does not reach every block",
    detail: `${n.join("; ")}. The template, opened again from the template browser, has the current blocks.`
  }), t;
}
const We = [
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
], vs = ["length", "vocals", "melody"], Zt = {
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
}, xs = "custom";
function so(e) {
  return typeof e == "string" && e.trim().toLowerCase() === xs;
}
function Pe(e, t) {
  const n = Zt[t];
  if (n)
    return (e.widgets ?? []).find((o) => o.name === n);
}
function _s(e) {
  const t = {};
  for (const n of [...We, ...vs]) {
    const o = Pe(e, n);
    o && (t[n] = typeof o.value == "string" ? o.value : String(o.value ?? ""));
  }
  return t;
}
function Ss(e) {
  return (e.comfyClass ?? e.type) === "PlenioCoverBrief" ? "cover" : "song";
}
function fn(e, t) {
  const n = [];
  for (const o of t.fills) {
    if (!We.includes(o.field)) continue;
    const s = Pe(e, o.field);
    s && !String(s.value ?? "").trim() && o.value && n.push({ field: o.field, value: o.value });
  }
  return n;
}
function pn(e) {
  const t = [];
  for (const n of We) {
    const o = Pe(e, n);
    o && String(o.value ?? "").trim() && t.push(o);
  }
  return t;
}
function Dt(e) {
  return e.choices.filter((t) => t.suggested && t.suggested !== t.current).map((t) => ({ field: t.field, value: t.suggested }));
}
function ks(e, t) {
  return !t || !e || e.template === "none" ? null : e.fills.length ? `Template fills: ${e.fills.map((o) => `${o.field} (${As(o.value)})`).join(", ")}` : "The template fills nothing: every text field has your value.";
}
function Es(e) {
  const t = e ? Dt(e) : [];
  return t.length ? `The template suggests: ${t.map((n) => `${n.field} = ${n.value}`).join(", ")}` : null;
}
function $s(e) {
  return e?.notes.length ? e.notes.join("; ") : null;
}
function Ms(e) {
  const t = e?.mode;
  return t?.description ? `Creative mode ${t.name} (experimental): ${t.description}` : null;
}
function As(e, t = 44) {
  const n = e.replace(/\s+/g, " ").trim();
  return n.length > t ? `${n.slice(0, t - 1)}…` : n;
}
function hn(e, t) {
  for (const n of t) {
    const o = Pe(e, n.field);
    o && (o.value = n.value, o.callback?.(n.value));
  }
  e.setDirtyCanvas?.(!0, !0);
}
function Ls(e, t) {
  for (const n of t)
    n.value = "", n.callback?.("");
  e.setDirtyCanvas?.(!0, !0);
}
function ro(e) {
  const t = [];
  for (const n of We) {
    const o = Pe(e, n);
    !o || !so(o.value) || (o.value = "", o.callback?.(""), t.push(n));
  }
  return t.length && e.setDirtyCanvas?.(!0, !0), t;
}
const mn = "plenio_brief_template", Ns = 400;
function Ts(e, t) {
  let n = null, o = !1, s = null, r;
  const i = document.createElement("div");
  i.className = "plenio-brief-template";
  const a = document.createElement("div");
  a.className = "line";
  const l = document.createElement("div");
  l.className = "hint";
  const d = document.createElement("div");
  d.className = "mode";
  const p = document.createElement("div");
  p.className = "actions", i.append(a, l, d, p);
  const m = (g, y, w) => {
    const L = document.createElement("button");
    return L.textContent = g, L.title = y, L.addEventListener("click", (E) => {
      E.stopPropagation(), w();
    }), p.append(L), L;
  }, S = m("Copy template text", "Fill every empty text field with the template’s text", () => {
    n && (hn(e, fn(e, n).map((g) => ({ field: g.field, value: g.value }))), k());
  }), _ = m("Use template choices", "Set length, vocals and melody to the template’s choices", () => {
    n && (hn(e, Dt(n)), k());
  }), q = m("Reset all to template", "Clear every text field you typed into (they fall back to the template)", () => {
    const g = pn(e);
    g.length && window.confirm(`Clear ${g.length} text field(s)? The template's values apply again.`) && (Ls(e, g), k());
  }), $ = m("↻", "Ask again what the template fills", () => {
    A();
  }), k = () => {
    const g = ks(n, o);
    a.textContent = s ?? g ?? "The template fills nothing: every text field has your value.", a.dataset.state = s ? "error" : o && n ? "ok" : "empty";
    const y = Es(n), w = $s(n);
    l.textContent = [y, w].filter(Boolean).join(" · "), l.style.display = l.textContent ? "" : "none", d.textContent = Ms(n) ?? "", d.style.display = d.textContent ? "" : "none", p.style.display = o && n && n.template !== "none" ? "" : "none", S.disabled = !n || !fn(e, n).length, _.disabled = !n || !Dt(n).length, q.disabled = !pn(e).length, $.disabled = !1, e.setDirtyCanvas?.(!0, !0);
  }, H = /* @__PURE__ */ new WeakSet(), u = () => {
    for (const g of ["template", "arrangement", ...Object.keys(Zt)]) {
      const y = g === "template" || g === "arrangement" ? e.widgets?.find((w) => w.name === g) : Pe(e, g);
      !y || H.has(y) || (H.add(y), y.callback = ne(y.callback, () => {
        u(), A();
      }));
    }
  }, F = async () => {
    u();
    const g = String(e.widgets?.find((y) => y.name === "template")?.value ?? "none");
    try {
      const y = String(e.widgets?.find((w) => w.name === "arrangement")?.value ?? "");
      n = await us(t, { fields: _s(e), template: g, kind: Ss(e), arrangement: y }), s = null;
    } catch (y) {
      n = null, s = `The template fields could not be read: ${y instanceof Error ? y.message : String(y)}`;
    }
    o = !0, k();
  };
  function A() {
    clearTimeout(r), r = setTimeout(() => {
      F();
    }, Ns);
  }
  u();
  const b = e.addDOMWidget(mn, mn, i, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 64,
    getMaxHeight: () => 128
  });
  return b.serialize = !1, ro(e), k(), A(), {
    widget: b,
    refresh: A,
    answer: () => n,
    dispose: () => clearTimeout(r)
  };
}
const Cs = /* @__PURE__ */ new Set(["PlenioSongBrief", "PlenioCoverBrief"]);
function Ps(e, t) {
  const n = /* @__PURE__ */ new WeakMap(), o = e.prototype, s = o.onNodeCreated;
  o.onNodeCreated = function() {
    s?.call(this), n.set(this, Ts(this, t));
  };
  const r = o.onConfigure;
  o.onConfigure = function(i) {
    r?.call(this, i), ro(this), n.get(this)?.refresh();
  };
}
const gn = "plenio.record/1", Os = 2, Is = "PLNO", Je = new TextEncoder().encode(`${Is}plenio.project/1\0`), yn = 32 * 2 ** 20;
class fe extends Error {
}
async function xt(e, t, n) {
  return new Uint8Array(await e.slice(t, t + n).arrayBuffer());
}
function _t(e, t) {
  return e.length >= t.length && t.every((n, o) => e[o] === n);
}
async function Rs(e) {
  const t = e.stream().pipeThrough(new DecompressionStream("gzip")).getReader(), n = [];
  let o = 0;
  for (; ; ) {
    const { done: i, value: a } = await t.read();
    if (i) break;
    if (o += a.length, o > yn)
      throw await t.cancel(), new fe(`its Plenio project is larger than ${yn / 2 ** 20} MB`);
    n.push(a);
  }
  const s = new Uint8Array(o);
  let r = 0;
  for (const i of n)
    s.set(i, r), r += i.length;
  return new TextDecoder().decode(s);
}
async function io(e) {
  if (!_t(await xt(e, 0, 4), new TextEncoder().encode("fLaC"))) throw new fe("it is not a FLAC file");
  let t = 4;
  for (; ; ) {
    const n = await xt(e, t, 4);
    if (n.length < 4) throw new fe("the file ends inside its metadata");
    const o = n[1] << 16 | n[2] << 8 | n[3];
    if ((n[0] & 127) === Os && o >= 4) {
      const s = await xt(e, t + 4, Math.min(o, Je.length));
      if (_t(s, Je.subarray(0, 4))) {
        if (!_t(s, Je)) throw new fe("it holds a Plenio project of an unknown layout (made by a newer Plenio)");
        let r;
        try {
          r = await Rs(e.slice(t + 4 + Je.length, t + 4 + o));
        } catch (a) {
          throw a instanceof fe ? a : new fe(`its Plenio project is damaged (${a instanceof Error ? a.message : String(a)})`);
        }
        let i;
        try {
          i = JSON.parse(r);
        } catch {
          throw new fe("its Plenio project is damaged (no JSON)");
        }
        if (i?.schema !== gn)
          throw new fe(`its Plenio project is no release record (${gn})`);
        return i;
      }
    }
    if (n[0] & 128) return null;
    t += 4 + o;
  }
}
function ao(e) {
  return /\.flac$/i.test(e.name ?? "") || e.type === "audio/flac" || e.type === "audio/x-flac";
}
const en = "plenio.sheet_state/1", Fe = ["title", "style", "lyrics", "score", "artwork_prompt"];
function mt() {
  return { schema: en, docs: {} };
}
function Se(e) {
  if (e == null || typeof e == "string" && e.trim() === "")
    return mt();
  if (typeof e != "string") return null;
  try {
    const t = JSON.parse(e);
    return t?.schema !== en || typeof t.docs != "object" || t.docs === null ? null : t;
  } catch {
    return null;
  }
}
function De(e) {
  const t = {};
  for (const o of Fe) {
    const s = e.docs[o];
    s && (t[o] = s);
  }
  const n = { schema: en, docs: t };
  return e.review?.approved_fingerprint && (n.review = { approved_fingerprint: e.review.approved_fingerprint }), JSON.stringify(n);
}
function St(e, t) {
  return e.docs[t]?.state ?? "auto";
}
function qs(e) {
  if (e === null) return "Song Sheet state is unreadable - open the editor to repair it.";
  const t = Fe.filter((o) => St(e, o) !== "auto").map(
    (o) => o === "lyrics" && St(e, o) === "manual" ? "lyrics: yours (manual)" : `${o.replace("_", " ")} ${St(e, o)}`
  ), n = e.review?.approved_fingerprint ? " · approved" : "";
  return (t.length ? t.join(" · ") : "all documents automatic") + n;
}
function Na(e) {
  const t = e.harmony?.after;
  if (!t) return "";
  const n = (s) => `${Math.round(s * 100)} %`, o = [
    `melody ${n(t.melody_on_chord)} on chord tones`,
    `${t.accented_avoid} accented clash${t.accented_avoid === 1 ? "" : "es"} with a chord`,
    `${t.clashes} between voice and line`,
    `chords ${n(t.chords_in_key)} in the key`
  ];
  return `Harmony check (${e.harmony?.genre ?? "pop"}): ${o.join(" · ")}`;
}
const Ta = "Creative modes are experimental: the writer’s plan can surprise - listen, change the score here, or run again with another arrangement seed; arrangement off keeps the music model’s own plan.";
function Ca(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) t.set(n, (t.get(n) ?? 0) + 1);
  return [...t].map(([n, o]) => o > 1 ? `${n} (${o} times)` : n);
}
function Pa(e) {
  const t = e.kind === "cover" ? "song flow closeness" : "genre closeness";
  return `${e.mode} (${t} ${e.closeness})`;
}
function bn(e) {
  const t = Math.max(0, e), n = Math.floor(t / 60), o = Math.round(t - n * 60);
  return `${n}:${String(o).padStart(2, "0")}`;
}
function Oa(e) {
  return e?.bars?.length ? (e.sections ?? []).map(([t, n, o]) => {
    const s = e.bars[Math.max(0, n - 1)], r = e.bars[Math.min(e.bars.length - 1, n - 1 + o - 1)];
    return { label: t, bars: o, start: bn(s?.[0] ?? 0), end: bn(r?.[1] ?? e.duration_s) };
  }) : [];
}
function _e(e) {
  const t = e.replace(/\r\n?/g, `
`).split(`
`).map((s) => s.replace(/\s+$/, ""));
  let n = 0, o = t.length;
  for (; n < o && !t[n]; ) n++;
  for (; o > n && !t[o - 1]; ) o--;
  return t.slice(n, o).join(`
`);
}
function zs(e, t, n) {
  const o = e.docs[n];
  return o ? o.text : t?.docs[n]?.upstream ?? "";
}
function Ia(e, t, n) {
  return n.map((o) => ({ kind: o, text: zs(e, t, o), intent: "keep" }));
}
function lo(e, t, n) {
  const o = { ...e.docs };
  for (const r of n) {
    const i = e.docs[r.kind], a = t?.docs[r.kind], l = _e(r.text);
    if (r.intent === "auto")
      delete o[r.kind];
    else if (r.intent === "manual")
      o[r.kind] = { state: "manual", text: l };
    else if (r.intent === "rebase")
      a?.upstream_sha256 ? o[r.kind] = { state: "edited", text: l, base_sha256: a.upstream_sha256 } : o[r.kind] = { state: "manual", text: l };
    else if (i)
      _e(i.text) !== l && (o[r.kind] = { ...i, text: l });
    else {
      const d = _e(a?.upstream ?? "");
      if (l === d) continue;
      o[r.kind] = a?.upstream_sha256 ? { state: "edited", text: l, base_sha256: a.upstream_sha256 } : { state: "manual", text: l };
    }
  }
  const s = { ...mt(), docs: o };
  return e.review?.approved_fingerprint && (s.review = { approved_fingerprint: e.review.approved_fingerprint }), s;
}
function Ds(e, t) {
  return t ? { ...e, review: { approved_fingerprint: t } } : { ...e, review: void 0 };
}
function co(e, t) {
  return Fe.filter((n) => e.includes(n) || t.docs[n]?.state === "manual");
}
function Bs(e) {
  const t = {};
  for (const n of e?.owned ?? []) t[n] = e?.docs[n]?.upstream ?? null;
  return t;
}
const Hs = "PlenioSongSheet";
function uo(e) {
  return e.nodes ?? e._nodes ?? [];
}
function js(e, t) {
  return e.getNodeById?.(t) ?? e.getNodeById?.(Number(t)) ?? uo(e).find((o) => String(o.id) === t) ?? null;
}
function kt(e, t) {
  let n = e, o = null;
  for (const s of t.split(":")) {
    if (!n || (o = js(n, s), !o)) return null;
    n = o.subgraph;
  }
  return o;
}
function Ws(e, t) {
  const n = [], o = Object.keys(t).sort((s, r) => s.split(".").length - r.split(".").length);
  for (const s of o) {
    const r = e.widgets?.find((a) => a.name === s);
    if (!r) {
      n.push(s);
      continue;
    }
    const i = t[s];
    r.value !== i && (r.value = i, r.callback?.(i));
  }
  return n;
}
function Fs(e, t) {
  const n = { values: 0, missing: [], sheets: 0, activated: 0 };
  for (const o of t.activate) {
    const s = kt(e, o);
    s && s.mode !== 0 && (s.mode = 0, n.activated++);
  }
  for (const [o, s] of Object.entries(t.values)) {
    const r = kt(e, o);
    if (!r) {
      n.missing.push(...Object.keys(s).map((a) => `${o}: ${a}`));
      continue;
    }
    const i = Ws(r, s);
    n.values += Object.keys(s).length - i.length, n.missing.push(...i.map((a) => `${r.type}: ${a}`));
  }
  for (const [o, s] of Object.entries(t.sheets)) {
    const r = kt(e, o)?.widgets?.find((i) => i.name === "sheet_state");
    r && (r.value = s, r.callback?.(s), n.sheets++);
  }
  return n;
}
function Gs(e, t) {
  let n = 0;
  for (const o of uo(e)) {
    if (o.type !== Hs) continue;
    const s = o.widgets?.find((m) => m.name === "sheet_state");
    if (!s) continue;
    const r = Se(s.value) ?? { schema: "plenio.sheet_state/1", docs: {} }, i = (o.inputs ?? []).filter((m) => m.link != null).map((m) => m.name), a = co(i, r), l = (a.length ? a : [...Fe]).filter((m) => !!t[m]);
    if (!l.length) continue;
    const d = { ...r.docs };
    for (const m of l) d[m] = { state: "manual", text: t[m] };
    const p = De({ ...r, docs: d, review: void 0 });
    s.value = p, s.callback?.(p), n++;
  }
  return n;
}
function Vs(e, t) {
  return (e.split(/[\\/]/).pop() ?? "").replace(/\.plenio\.json$/i, "").replace(/\.(json|flac)$/i, "") || t || "Plenio song";
}
function Et(e, t) {
  const n = [e.plenio && `Plenio ${e.plenio}`, e.created.slice(0, 10)].filter(Boolean).join(", "), o = t?.sheets ? " Its title, style, lyrics and score are kept in the Song Sheets (manual): a new take seed gives new takes of the same song, the editor changes the score, Back to auto lets the workflow write a document again." : "";
  if (e.from === "record") return `"${e.title}" opened in the workflow it was made with (${n}).${o}`;
  if (e.from === "template") {
    const s = e.unplaced.length ? ` ${e.unplaced.length} node(s) of the song have no place in today's template: ${e.unplaced.join(", ")}.` : "";
    return `"${e.title}" (${n}) opened in today's template "${e.template}" with the song's settings.${o}${s}`;
  }
  return `The workflow "${e.title}" was made with cannot be rebuilt (a workflow of your own, from before records kept it).`;
}
const Bt = "Plenio was updated while this page was open: reload the page (F5).";
function Us(e) {
  const t = /\/chunks\/(main-[^/?#]+\.mjs)(?:[?#].*)?$/.exec(e);
  return t ? t[1] : null;
}
function Ys(e) {
  return /chunks\/(main-[^"'?#\s]+\.mjs)/.exec(e)?.[1] ?? null;
}
async function tn(e, t) {
  const n = Us(e);
  if (!n) return !1;
  try {
    const o = await t(new URL("../plenio.js", e).href), s = o ? Ys(o) : null;
    return s !== null && s !== n;
  } catch {
    return !1;
  }
}
async function nn(e) {
  const t = await fetch(e, { cache: "no-store" });
  return t.ok ? await t.text() : null;
}
async function qe(e, t, n = "") {
  try {
    return await e();
  } catch (o) {
    throw await t() ? new Error(n ? `${Bt} ${n}` : Bt) : o;
  }
}
const $t = "Plenio.ContinueSong", Xs = "plenio.record/1";
function Ht(e, t, n, o, s = 2e4) {
  e.app.extensionManager?.toast?.add({ severity: t, summary: n, detail: o, life: s });
}
async function dt(e, t) {
  const n = await fs(e.fetcher, t);
  if (n.workflow) {
    if (!e.app.loadGraphData) throw new Error("This ComfyUI frontend cannot load a workflow for Plenio.");
    await e.app.loadGraphData(n.workflow, !0, !0, Vs("path" in t ? t.path : t.name, n.title));
    const r = e.app.graph;
    if (!r) throw new Error("The workflow did not load.");
    const i = Fs(r, n);
    r.setDirtyCanvas?.(!0, !0), i.missing.length && console.warn("Plenio: settings of the song without a field in this workflow", i.missing), Ht(e, "success", "Song opened", Et(n, i));
    return;
  }
  const o = e.app.graph, s = o ? Gs(o, n.documents) : 0;
  if (!s)
    throw new V(
      Et(n, null),
      "Open a workflow with a Song Sheet (a Plenio template) and continue again: the song's texts and score then go into its Song Sheets."
    );
  Ht(e, "success", "Song texts taken", `${Et(n, null)} Its texts and score went into this workflow's Song Sheets (${s}, manual).`);
}
async function Js(e) {
  if (ao(e)) return io(e);
  if (!/\.json$/i.test(e.name ?? "")) return null;
  try {
    const t = JSON.parse(await e.text());
    return t?.schema === Xs ? t : null;
  } catch {
    return null;
  }
}
function wn(e) {
  const t = [...e.dataTransfer?.files ?? []];
  return t.length === 1 && /\.plenio\.json$/i.test(t[0].name) ? t[0] : null;
}
function Qs(e, t) {
  const n = [...e.dataTransfer?.files ?? []];
  if (n.length !== 1 || !ao(n[0]) || e.shiftKey) return null;
  const o = t.canvas, s = t.graph;
  if (!o?.canvas || e.target !== o.canvas || !o.convertEventToCanvasOffset || !s?.getNodeOnPos) return null;
  const [r, i] = o.convertEventToCanvasOffset(e);
  return s.getNodeOnPos(r, i) ? null : n[0];
}
function Ks(e, t = window) {
  const n = (o) => {
    const s = wn(o) ? null : Qs(o, e.app), r = s ?? wn(o);
    r && (o.preventDefault(), o.stopImmediatePropagation(), (async () => {
      if (s) {
        const a = await io(s);
        if (a) return dt(e, { record: a, name: s.name });
        if (!e.app.handleFile) throw new V(`${s.name} carries no Plenio project.`, "Drop it with Shift held to give it to ComfyUI.");
        return e.app.handleFile(s);
      }
      const i = await Js(r);
      if (!i) throw new V(`${r.name} is no Plenio release record.`, "Drop the <name>.plenio.json that Export Release wrote next to the song.");
      await dt(e, { record: i, name: r.name });
    })().catch((i) => {
      const a = i instanceof fe ? `${r.name}: ${i.message}.` : i instanceof V && i.hint ? `${i.message} ${i.hint}` : String(i instanceof Error ? i.message : i);
      Ht(e, "error", "Song not opened", a, 3e4);
    }));
  };
  return t.addEventListener("drop", n, !0), () => t.removeEventListener("drop", n, !0);
}
async function Zs(e) {
  const t = () => tn(import.meta.url, nn), { openContinueDialog: n } = await qe(() => import("./openContinue-D5BGD3ht.mjs"), t);
  n(e.fetcher, (o) => dt(e, o));
}
const er = "COMFY_DYNAMICCOMBO_V3";
function tr(e) {
  const t = e?.widgets_values_named;
  return t && typeof t == "object" && !Array.isArray(t) ? { ...t } : Array.isArray(e?.widgets_values) ? [...e.widgets_values] : void 0;
}
function nr(e) {
  return (e.widgets ?? []).filter((t) => t.serialize !== !1);
}
function or(e, t) {
  const n = nr(e);
  return Array.isArray(t) ? n.length === t.length && n.every((o, s) => o.value === t[s]) : n.every((o) => !(o.name in t) || o.value === t[o.name]);
}
function sr(e, t) {
  return (e.options?.values ?? []).includes(t);
}
function rr(e, t, n) {
  if (!t || !e.widgets || or(e, t)) return !1;
  let o = 0;
  for (let s = 0; s < e.widgets.length; s++) {
    const r = e.widgets[s];
    if (r.serialize === !1) continue;
    let i;
    if (Array.isArray(t)) {
      if (o >= t.length) break;
      i = t[o++];
    } else if (r.name in t)
      i = t[r.name];
    else
      continue;
    if (n.has(r.name) && !sr(r, i)) return !0;
    r.value !== i && (r.value = i);
  }
  return !0;
}
function ir(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of Object.values(e ?? {}))
    for (const [o, s] of Object.entries(n ?? {}))
      Array.isArray(s) && s[0] === er && t.add(o);
  return t;
}
const fo = "plenio.eq/1", it = 8, be = 20, ar = 2e4, Ce = 12, po = 15, Ae = ["peak", "low_shelf", "high_shelf"], ho = ["peak", "notch", "highpass", "lowpass"], vn = [0.2, 10], xn = [0.25, 1];
function $e() {
  return { schema: fo, preamp_db: 0, bands: [] };
}
function lr(e) {
  if (typeof e != "string" || !e.trim()) return $e();
  try {
    const t = JSON.parse(e);
    return typeof t != "object" || t === null || !Array.isArray(t.bands) ? null : {
      schema: fo,
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
function Me(e) {
  return JSON.stringify(e);
}
const Q = (e, t) => Number(e.toFixed(t));
function G(e, t, n) {
  return Math.min(n, Math.max(t, e));
}
function mo(e) {
  return e.db ?? po;
}
const _n = [6, 12, 18], cr = { 6: 8, 12: 14, 18: 20 };
function ur(e, t) {
  return { ...e, db: cr[t] ?? po };
}
function xe(e, t) {
  return Math.log(G(t, be, e.maxHz) / be) / Math.log(e.maxHz / be) * e.width;
}
function Sn(e, t) {
  return be * (e.maxHz / be) ** G(t / e.width, 0, 1);
}
function ye(e, t) {
  const n = mo(e);
  return (1 - (G(t, -n, n) + n) / (2 * n)) * e.height;
}
function kn(e, t) {
  const n = mo(e);
  return (1 - G(t / e.height, 0, 1)) * 2 * n - n;
}
function En(e, t, n) {
  return n ? e + (t - e) * 0.2 : t;
}
function $n(e, t, n) {
  return t.map((o, s) => `${s ? "L" : "M"}${xe(e, o).toFixed(1)},${ye(e, n[s] ?? 0).toFixed(1)}`).join(" ");
}
function on(e) {
  return Math.min(ar, 0.45 * e);
}
function dr(e) {
  const t = new Set(e.bands.map((o) => o.id));
  let n = e.bands.length + 1;
  for (; t.has(`band-${n}`); ) n++;
  return `band-${n}`;
}
function fr(e, t, n = 0, o = 48e3) {
  if (e.bands.length >= it) return null;
  const s = {
    id: dr(e),
    enabled: !0,
    type: "peak",
    frequency_hz: Q(G(t, be, on(o)), 1),
    gain_db: Q(G(n, -Ce, Ce), 1),
    q: 1,
    slope: 1
  };
  return { ...e, bands: [...e.bands, s] };
}
function Oe(e, t, n, o, s = 48e3) {
  return {
    ...e,
    bands: e.bands.map(
      (r) => r.id !== t ? r : {
        ...r,
        frequency_hz: Q(G(n, be, on(s)), 1),
        gain_db: Ae.includes(r.type) ? Q(G(o, -Ce, Ce), 1) : r.gain_db
      }
    )
  };
}
function Mt(e, t, n) {
  return {
    ...e,
    bands: e.bands.map((o) => o.id === t ? { ...o, q: Q(G(o.q * n, 0.2, 10), 3) } : o)
  };
}
function At(e, t) {
  return { ...e, bands: e.bands.filter((n) => n.id !== t) };
}
function Ie(e) {
  const t = e.frequency_hz >= 1e3 ? `${Q(e.frequency_hz / 1e3, 2)} kHz` : `${Math.round(e.frequency_hz)} Hz`, n = Ae.includes(e.type) ? ` ${e.gain_db > 0 ? "+" : ""}${Q(e.gain_db, 1)} dB` : "";
  return `${e.type.replace("_", " ")} ${t}${n}, Q ${Q(e.q, 2)}`;
}
function pr(e, t) {
  const n = go[e.type] ?? e.type, o = e.frequency_hz >= 1e3 ? `${(e.frequency_hz / 1e3).toFixed(2)} kHz` : `${Math.round(e.frequency_hz)} Hz`, s = Ae.includes(e.type) ? ` ${e.gain_db > 0 ? "+" : ""}${e.gain_db.toFixed(1)} dB` : "", r = ho.includes(e.type) ? ` Q ${Q(e.q, 2)}` : "";
  return `● ${t + 1} ${n} ${o}${s}${r}${e.enabled ? "" : " (off)"}`;
}
const go = {
  peak: "Bell",
  low_shelf: "Low shelf",
  high_shelf: "High shelf",
  highpass: "Low cut",
  lowpass: "High cut",
  notch: "Notch"
};
function Lt(e, { kilo: t = !1 } = {}) {
  let n = e.trim().replace(",", ".").replace(/\s*(hz|db)$/i, ""), o = 1;
  if (t && /k$/i.test(n) && (o = 1e3, n = n.slice(0, -1).trim()), !/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(n)) return null;
  const s = Number(n) * o;
  return Number.isFinite(s) ? s : null;
}
function Qe(e, t) {
  const n = Number(e);
  return Number.isFinite(n) ? n : t;
}
function at(e, t, n, o = 48e3) {
  return {
    ...e,
    bands: e.bands.map((s) => {
      if (s.id !== t) return s;
      const r = { ...s, ...n };
      return {
        ...r,
        frequency_hz: Q(G(Qe(r.frequency_hz, s.frequency_hz), be, on(o)), 1),
        gain_db: Q(G(Qe(r.gain_db, s.gain_db), -Ce, Ce), 1),
        q: Q(G(Qe(r.q, s.q), vn[0], vn[1]), 3),
        slope: Q(G(Qe(r.slope, s.slope), xn[0], xn[1]), 2),
        enabled: r.enabled !== !1
      };
    })
  };
}
function Mn(e, t) {
  return at(e, t, { gain_db: 0 });
}
function An(e, t, n, { heightFraction: o = 0.7 } = {}) {
  if (!t.length || t.length !== n.length) return "";
  const s = n.filter((m) => Number.isFinite(m));
  if (!s.length) return "";
  const r = Math.max(...s), i = Math.min(...s), a = Math.max(r - i, 1e-6), l = e.height - 4, d = l - Math.max(12, e.height * G(o, 0.1, 0.95));
  return `M${t.map((m, S) => {
    const _ = n[S], q = Number.isFinite(_) ? (_ - i) / a : 0;
    return `${xe(e, m).toFixed(1)},${(l - q * (l - d)).toFixed(1)}`;
  }).join(" L")} L${e.width.toFixed(1)},${l.toFixed(1)} L0,${l.toFixed(1)} Z`;
}
class hr {
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
    Me(t) !== Me(this.current) && (this.entries = this.entries.slice(0, this.index + 1), this.entries.push(t), this.entries.length > this.limit && this.entries.shift(), this.index = this.entries.length - 1);
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
const mr = "http://www.w3.org/2000/svg", Ln = "plenio_eq_panel", Ke = "mode.bands", he = { capture: !0 }, oe = { width: 560, height: 260 }, Ze = ["#4aa3ff", "#f0a35e", "#6fbf73", "#d873c8", "#e0c65a", "#5ac8c8", "#b28df0", "#e08a8a"];
let Nt = null;
function ue(e, t) {
  const n = document.createElementNS(mr, e);
  for (const [o, s] of Object.entries(t)) n.setAttribute(o, String(s));
  return n;
}
function W(e, t, n) {
  const o = document.createElement(e);
  return t && (o.className = t), n !== void 0 && (o.textContent = n), o;
}
function ve(e, t, n) {
  const o = document.createElement("button");
  return o.className = e, o.textContent = t, o.setAttribute("aria-label", n), o.title = n, o;
}
function de(e, t) {
  return e.widgets?.find((n) => n.name === t);
}
function gr(e, t) {
  return e.bands.length === t.bands.length && e.bands.every((n, o) => {
    const s = t.bands[o];
    return s !== void 0 && n.type === s.type && n.enabled === s.enabled && Math.abs(n.frequency_hz - s.frequency_hz) < 0.5 && Math.abs(n.gain_db - s.gain_db) < 0.05 && Math.abs(n.q - s.q) < 0.01;
  });
}
function yr(e, t) {
  const n = W("div", "plenio-eq"), o = W("div", "plenio-eq-tools"), s = W("select");
  s.setAttribute("aria-label", "EQ preset"), s.title = "EQ preset: sets every band at once (the list comes from resources/presets/eq.json)";
  const r = W("select");
  r.setAttribute("aria-label", "Gain range"), r.title = "Gain range: the dB axis of the curve and how far a drag may go";
  for (const c of _n) r.append(new Option(`±${c} dB`, String(c)));
  const i = ve("", "↶", "Undo the last band change"), a = ve("", "↷", "Redo the last band change"), l = ve("", "reset", "Remove every band"), d = ve("", "compare", "Show the curve without the EQ (bypass)"), p = ve("", "bands as text", "Show or hide the plenio.eq/1 JSON widget"), m = W("span", "plenio-eq-info");
  m.setAttribute("aria-live", "polite"), m.title = "What the panel is showing right now (the selected band, a note, or a hint)", o.append(s, r, i, a, l, d, p, m);
  const S = W("div", "plenio-eq-mode"), _ = ue("svg", {
    viewBox: `0 0 ${oe.width} ${oe.height}`,
    class: "plenio-eq-plot",
    role: "img",
    preserveAspectRatio: "none"
  });
  _.setAttribute("aria-label", "EQ response curve"), _.setAttribute("tabindex", "0"), _.setAttribute("title", "Drag a handle to move a band (Shift = fine), wheel = Q, double-click = new band, Delete = remove");
  const q = W("div", "plenio-eq-strip"), $ = W("div", "plenio-eq-editor"), k = W("div", "plenio-eq-fields");
  $.append(k), n.append(o, S, _, q, $);
  const H = e.addDOMWidget(Ln, Ln, n, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 420,
    getMaxHeight: () => 620
  });
  H.serialize = !1;
  let u = { sampleRate: 48e3, frequencies: [], response: [], settings: $e(), readonly: !0, note: "" }, F = null, A = null, b = !1, g = 12, y = null, w = [], L = 0, E, U, z = null, R = !1;
  const D = /* @__PURE__ */ new Map();
  let j = null;
  const N = new hr($e()), pe = () => de(e, Ke), K = () => g, T = () => ur({ ...oe, maxHz: Math.min(2e4, u.sampleRate / 2) }, K());
  function P(c, { record: h = !0 } = {}) {
    const f = pe();
    if (!f) return;
    const v = Me(c);
    f.value = v, f.callback?.(v), h && N.push(c), u = { ...u, settings: c }, Y(), ae(0);
  }
  async function ae(c = 120) {
    clearTimeout(E), E = setTimeout(async () => {
      const h = String(de(e, "mode")?.value ?? "flat");
      if (h !== "manual") {
        h === "flat" ? u = {
          ...u,
          settings: $e(),
          response: u.frequencies.map(() => 0),
          readonly: !0,
          note: "flat: no change"
        } : F !== h ? u = {
          ...u,
          settings: $e(),
          response: u.frequencies.map(() => 0),
          readonly: !0,
          note: `${h}: the bands are fitted to your audio when the workflow runs - run once to see the proposal here`
        } : u = { ...u, readonly: !0 }, Y();
        return;
      }
      const f = lr(pe()?.value);
      if (!f) {
        u = { ...u, readonly: !0, note: "the bands are not valid JSON" }, Y();
        return;
      }
      Me(f) !== Me(N.current) && N.reset(f);
      const v = ++L;
      try {
        const M = await un(t, f, u.sampleRate);
        if (v !== L) return;
        u = {
          ...u,
          frequencies: M.frequency_hz,
          response: M.response_db,
          settings: M.settings,
          readonly: !1,
          note: ""
        };
      } catch (M) {
        u = { ...u, readonly: !1, note: M instanceof Error ? M.message : String(M) };
      }
      Y();
    }, c);
  }
  const Ve = (c) => ({
    ...c.settings,
    bands: c.settings.bands.slice(0, it)
  });
  function le() {
    if (!y) return "";
    const c = w.find((h) => h.name === y);
    return c && gr(Ve(c), u.settings) ? y : "";
  }
  function Y() {
    _.replaceChildren(), D.clear(), j = null;
    const c = T();
    for (const f of [-c.db, -c.db / 2, 0, c.db / 2, c.db])
      _.append(
        ue("line", { x1: 0, x2: c.width, y1: ye(c, f), y2: ye(c, f), class: f ? "grid" : "grid zero" })
      );
    for (const f of [100, 1e3, 1e4])
      _.append(ue("line", { x1: xe(c, f), x2: xe(c, f), y1: 0, y2: c.height, class: "grid" }));
    u.beforeDb?.length === u.frequencies.length && _.append(ue("path", { d: An(c, u.frequencies, u.beforeDb), class: "spectrum before" })), u.afterDb?.length === u.frequencies.length && _.append(ue("path", { d: An(c, u.frequencies, u.afterDb), class: "spectrum after" })), b ? _.append(ue("line", { x1: 0, x2: c.width, y1: ye(c, 0), y2: ye(c, 0), class: "curve flat" })) : u.frequencies.length && (j = ue("path", { d: $n(c, u.frequencies, u.response), class: "curve" }), _.append(j)), !u.readonly && !b && u.settings.bands.forEach((f, v) => {
      const M = Ze[v % Ze.length], O = Ae.includes(f.type) ? f.gain_db : 0, x = ue("circle", {
        cx: xe(c, f.frequency_hz),
        cy: ye(c, O),
        r: f.id === A ? 9 : 7,
        class: f.id === A ? "handle selected" : "handle",
        style: `stroke: ${M}`,
        tabindex: 0,
        "data-band": f.id
      });
      x.setAttribute("aria-label", `Band ${v + 1}: ${Ie(f)}`), f.enabled || x.classList.add("disabled"), x.append(ue("title", {})), x.lastChild.textContent = `Band ${v + 1}: ${Ie(f)}`, x.addEventListener("pointerdown", (B) => Zo(B, f.id)), x.addEventListener("dblclick", (B) => {
        B.stopPropagation(), P(Mn(u.settings, f.id));
      }), x.addEventListener("focus", () => Jo(f.id)), x.addEventListener("keydown", (B) => rn(B, f.id)), x.addEventListener("wheel", (B) => {
        B.preventDefault();
        const we = B.deltaY < 0 ? 1.15 : 1 / 1.15;
        P(Mt(u.settings, f.id, we));
      }), x.addEventListener("contextmenu", (B) => {
        B.preventDefault(), P(At(u.settings, f.id));
      }), _.append(x), D.set(f.id, x);
    }), Uo(), Yo(), Xo();
    const h = u.settings.bands.find((f) => f.id === A);
    m.textContent = u.note || (b ? "compare: the curve is off (the node still applies it)" : h ? Ie(h) : u.readonly ? `${u.settings.bands.length} band(s)` : `drag a handle, Shift = fine, wheel = Q, double-click = add · ${u.settings.bands.length}/${it}`), s.disabled = u.readonly, i.disabled = !N.canUndo, a.disabled = !N.canRedo, l.disabled = u.readonly || !u.settings.bands.length, R && (R = !1, A && D.get(A)?.focus({ preventScroll: !0 })), r.value = String(g), s.value = le(), d.classList.toggle("active", b), p.classList.toggle("active", yt()), e.setDirtyCanvas?.(!0, !0);
  }
  function Uo() {
    if (q.replaceChildren(), u.readonly && !u.settings.bands.length) {
      q.append(W("span", "plenio-eq-hint", u.note || "no bands"));
      return;
    }
    u.settings.bands.forEach((c, h) => {
      const f = W("button", "plenio-eq-chip", pr(c, h));
      f.style.borderLeftColor = Ze[h % Ze.length], f.classList.toggle("selected", c.id === A), f.classList.toggle("disabled", !c.enabled), f.setAttribute("aria-label", `Edit band ${h + 1}`), f.title = `Band ${h + 1}: ${Ie(c)} - click to open its fields`, f.addEventListener("click", (v) => {
        v.stopPropagation(), A = A === c.id ? null : c.id, Y();
      }), q.append(f);
    });
  }
  function Yo() {
    k.replaceChildren();
    const c = u.settings.bands.find((x) => x.id === A);
    if (!c || u.readonly) {
      $.style.display = "none";
      return;
    }
    $.style.display = "";
    const h = W("span", "name", `Band ${u.settings.bands.indexOf(c) + 1}`);
    h.title = "The selected band";
    const f = W("select");
    f.setAttribute("aria-label", "Band type"), f.title = "Band type: bell and shelves change the gain, the cuts and the notch do not";
    for (const [x, B] of Object.entries(go)) f.append(new Option(B, x));
    f.value = c.type, f.addEventListener("change", () => P(at(u.settings, c.id, { type: f.value })));
    const v = W("input");
    v.type = "checkbox", v.checked = c.enabled, v.setAttribute("aria-label", "Band enabled"), v.title = "Band enabled: off keeps the band in the list but out of the response", v.addEventListener("change", () => P(at(u.settings, c.id, { enabled: v.checked })));
    const M = [
      [
        "Hz",
        `${c.frequency_hz}`,
        70,
        (x) => wt(c.id, "frequency_hz", Lt(x, { kilo: !0 }))
      ],
      ["dB", `${c.gain_db}`, 60, (x) => wt(c.id, "gain_db", Lt(x))],
      ["Q", `${c.q}`, 60, (x) => wt(c.id, "q", Lt(x))]
    ];
    k.append(h, f, v);
    for (const [x, B, we, Ue] of M) {
      const X = W("input", "number");
      X.value = B, X.style.width = `${we}px`, X.setAttribute("aria-label", `Band ${x}`), X.title = x === "Hz" ? "Frequency of the band in Hz (the centre of a bell, the corner of a shelf)" : x === "dB" ? "Gain in dB (bell and shelves; the cuts and the notch have none)" : "Q: how narrow the band is - higher Q, smaller range";
      const Ye = () => {
        Ue(X.value) || (X.value = B);
      };
      X.addEventListener("keydown", (ce) => {
        ce.key === "Enter" && Ye();
      }), X.addEventListener("blur", Ye), (x === "dB" && !Ae.includes(c.type) || x === "Q" && !ho.includes(c.type)) && (X.disabled = !0), k.append(X);
    }
    const O = ve("", "remove", "Remove this band");
    O.addEventListener("click", (x) => {
      x.stopPropagation(), A = null, P(At(u.settings, c.id));
    }), k.append(O);
  }
  function Xo() {
    S.replaceChildren();
    const c = String(de(e, "mode")?.value ?? "flat");
    if (c === "manual" || c === "flat") {
      S.style.display = "none";
      return;
    }
    S.style.display = "", S.append(
      W(
        "span",
        "plenio-eq-hint",
        F === c ? `applied proposal (${u.settings.bands.length} band(s), ${c})` : `${c}: no proposal yet - it is computed on the next run`
      )
    );
    const h = ve("", "Edit these bands", "Copy the proposal into manual bands and edit it");
    h.disabled = !u.settings.bands.length, h.addEventListener("click", (f) => {
      f.stopPropagation();
      const v = de(e, "mode");
      if (!v) return;
      v.value = "manual", v.callback?.("manual");
      const M = pe();
      if (M) {
        const O = Me(u.settings);
        M.value = O, M.callback?.(O);
      }
      N.reset(u.settings), vt(), ae(0);
    }), S.append(h);
  }
  function Jo(c) {
    A = c, R = !0, Y();
  }
  function Qo(c) {
    A = c, gt();
  }
  function gt() {
    const c = T();
    u.settings.bands.forEach((f) => {
      const v = D.get(f.id);
      if (!v) return;
      const M = Ae.includes(f.type) ? f.gain_db : 0;
      v.setAttribute("cx", String(xe(c, f.frequency_hz))), v.setAttribute("cy", String(ye(c, M))), v.classList.toggle("selected", f.id === A), v.setAttribute("r", f.id === A ? "9" : "7");
    }), j && u.frequencies.length && j.setAttribute("d", $n(c, u.frequencies, u.response));
    const h = u.settings.bands.find((f) => f.id === A);
    h && (m.textContent = Ie(h));
  }
  function Ko() {
    clearTimeout(U), U = setTimeout(async () => {
      const c = u.settings, h = ++L;
      try {
        const f = await un(t, c, u.sampleRate);
        if (h !== L) return;
        u = { ...u, frequencies: f.frequency_hz, response: f.response_db }, gt();
      } catch {
      }
    }, 60);
  }
  function yt() {
    return !de(e, Ke)?.plenioHidden;
  }
  function bt(c) {
    const h = de(e, Ke);
    h && (h.plenioHidden = !c, c ? delete h.computeSize : h.computeSize = () => [0, -4], e.setDirtyCanvas?.(!0, !0));
  }
  function wt(c, h, f) {
    if (f === null) return !1;
    const v = u.settings.bands.find((M) => M.id === c);
    return v && v[h] === f || P(at(u.settings, c, { [h]: f })), !0;
  }
  function Zo(c, h) {
    c.preventDefault(), c.stopPropagation(), A !== h && Qo(h);
    const f = u.settings.bands.find((Z) => Z.id === h);
    if (!f) return;
    z = { hz: f.frequency_hz, db: f.gain_db };
    let v = !1, M = !1;
    const O = c.currentTarget;
    try {
      O?.setPointerCapture?.(c.pointerId);
    } catch {
    }
    const x = _.getBoundingClientRect(), B = x.width ? x.left : 0, we = x.height ? x.top : 0, Ue = x.width || oe.width, X = x.height || oe.height, Ye = (Z, Xe) => Z >= B - 1 && Z <= B + Ue + 1 && Xe >= we - 1 && Xe <= we + X + 1;
    function ce() {
      if (!M) {
        M = !0;
        try {
          O?.releasePointerCapture?.(c.pointerId);
        } catch {
        }
        window.removeEventListener("pointermove", cn, he), window.removeEventListener("pointerup", ce, he), window.removeEventListener("pointercancel", ce, he), window.removeEventListener("blur", ce, he), z = null, v && P(u.settings);
      }
    }
    const cn = (Z) => {
      if (M || !z) return;
      if (Z.buttons === 0) {
        ce();
        return;
      }
      if (!Ye(Z.clientX, Z.clientY)) return;
      const Xe = oe.width / Ue, ts = oe.height / X, ns = (Z.clientX - B) * Xe, os = (Z.clientY - we) * ts, ss = xe(T(), z.hz), rs = ye(T(), z.db), is = Sn(T(), En(ss, ns, Z.shiftKey)), as = kn(T(), En(rs, os, Z.shiftKey));
      u = { ...u, settings: Oe(u.settings, h, is, as, u.sampleRate) }, v = !0, gt(), Ko();
    };
    window.addEventListener("pointermove", cn, he), window.addEventListener("pointerup", ce, he), window.addEventListener("pointercancel", ce, he), window.addEventListener("blur", ce, he);
  }
  function rn(c, h) {
    const f = u.settings.bands.find((x) => x.id === h);
    if (!f) return;
    const v = c.shiftKey ? 0.1 : 0.5, M = c.shiftKey ? 1.01 : 1.06;
    let O = null;
    c.key === "ArrowUp" ? O = Oe(u.settings, h, f.frequency_hz, f.gain_db + v, u.sampleRate) : c.key === "ArrowDown" ? O = Oe(u.settings, h, f.frequency_hz, f.gain_db - v, u.sampleRate) : c.key === "ArrowRight" ? O = Oe(u.settings, h, f.frequency_hz * M, f.gain_db, u.sampleRate) : c.key === "ArrowLeft" ? O = Oe(u.settings, h, f.frequency_hz / M, f.gain_db, u.sampleRate) : c.key === "+" ? O = Mt(u.settings, h, 1.15) : c.key === "-" ? O = Mt(u.settings, h, 1 / 1.15) : c.key === "0" ? O = Mn(u.settings, h) : (c.key === "Delete" || c.key === "Backspace") && (O = At(u.settings, h)), O && (c.preventDefault(), P(O));
  }
  _.addEventListener("keydown", (c) => {
    A && c.target === _ && rn(c, A);
  }), _.addEventListener("dblclick", (c) => {
    if (u.readonly || b) return;
    const h = _.getBoundingClientRect(), f = oe.width / (h.width || oe.width), v = oe.height / (h.height || oe.height), M = (c.clientX - h.left) * f, O = (c.clientY - h.top) * v, x = fr(u.settings, Sn(T(), M), kn(T(), O), u.sampleRate);
    x ? (A = x.bands[x.bands.length - 1].id, P(x)) : (u = { ...u, note: `the EQ has at most ${it} bands` }, Y());
  }), s.append(new Option("preset…", "")), Nt ??= ds(t).then((c) => c.manual).catch(() => []), Nt.then((c) => {
    w = c;
    for (const h of c) s.append(new Option(h.name, h.name));
    s.value = le();
  }), s.addEventListener("change", async () => {
    const c = (await Nt)?.find((h) => h.name === s.value);
    c && (y = c.name, P(Ve(c)));
  }), r.addEventListener("change", () => {
    const c = Number(r.value);
    g = _n.find((h) => h === c) ?? 12, Y();
  }), i.addEventListener("click", () => {
    const c = N.undo();
    c && P(c, { record: !1 });
  }), a.addEventListener("click", () => {
    const c = N.redo();
    c && P(c, { record: !1 });
  }), l.addEventListener("click", () => {
    A = null, P($e());
  }), d.addEventListener("click", () => {
    b = !b, Y();
  }), p.addEventListener("click", () => {
    bt(!yt()), Y();
  });
  function vt() {
    for (const c of ["mode", Ke]) {
      const h = de(e, c);
      if (!h || h.plenioWatched) continue;
      h.plenioWatched = !0;
      const f = h.callback;
      h.callback = (v) => {
        f?.(v), setTimeout(() => {
          yt() || bt(!1), ae();
        });
      };
    }
  }
  vt(), bt(!1), ae(0);
  let an = null, ln = null;
  const es = setInterval(() => {
    if (!n.isConnected) {
      clearInterval(es);
      return;
    }
    const c = String(de(e, "mode")?.value ?? "flat"), h = String(pe()?.value ?? "");
    c === an && h === ln || (an = c, ln = h, vt(), ae(0));
  }, 700);
  return {
    showExecuted(c) {
      const h = c?.plenio_eq, f = h?.[h.length - 1];
      if (!f) return;
      const v = String(de(e, "mode")?.value ?? "flat"), M = v === "manual";
      F = M || v === "flat" ? null : v, u = {
        sampleRate: f.sample_rate,
        frequencies: f.frequency_hz,
        response: f.response_db,
        settings: f.settings,
        readonly: !M,
        note: M ? "" : `applied: ${f.settings.bands.length} band(s)`,
        beforeDb: f.spectrum_before_db,
        afterDb: f.spectrum_after_db
      }, M ? ae(0) : Y();
    }
  };
}
const sn = {
  PlenioSongBrief: "one song, stop to review",
  PlenioCoverBrief: "one cover, stop to review"
}, br = new Set(We.map((e) => Zt[e]));
function wr(e, t) {
  return !(e in sn) || !t || typeof t != "object" || Array.isArray(t) ? [] : Object.entries(t).filter(([n, o]) => br.has(n) && so(o)).map(([n]) => n);
}
function vr(e, t) {
  for (const n of Object.values(e.input ?? {})) {
    const o = n?.[t];
    if (!Array.isArray(o)) continue;
    if (Array.isArray(o[0])) return o[0];
    const s = o[1]?.options;
    return Array.isArray(s) ? s : [];
  }
  return [];
}
const xr = {
  PlenioSongBrief: { arrangement: { simple: "off" } },
  PlenioCoverBrief: { arrangement: { simple: "off" } }
};
function _r(e, t) {
  const n = xr[e];
  if (!n) return [];
  const o = [];
  for (const s of t ?? []) {
    const r = n[s.name]?.[String(s.value)];
    r !== void 0 && (s.value = r, o.push(s.name));
  }
  return o;
}
const Nn = 6, Sr = 8, kr = 18;
function Er(e) {
  if (e[Nn] !== "tags" || e.length > kr) return e;
  const t = Nn + 1 + Sr;
  return [...e.slice(0, t), "", ...e.slice(t)];
}
function $r(e, t) {
  if (e.name === "PlenioExportRelease" && t && Array.isArray(t.widgets_values)) {
    const l = Er(t.widgets_values);
    return l === t.widgets_values ? t : { ...t, widgets_values: l };
  }
  const n = sn[e.name];
  if (!n || !t) return t;
  const o = vr(e, "mode"), s = t.widgets_values, r = t.widgets_values_named;
  let i = t;
  Array.isArray(s) && s.length && !o.includes(s[0]) && (i = { ...i, widgets_values: [n, ...s] }), r && typeof r == "object" && !Array.isArray(r) && !("mode" in r) && (i = { ...i, widgets_values_named: { mode: n, ...r } });
  const a = wr(e.name, i.widgets_values_named);
  if (a.length) {
    const l = { ...i.widgets_values_named };
    for (const d of a) l[d] = "";
    i = { ...i, widgets_values_named: l };
  }
  return i;
}
const yo = /* @__PURE__ */ new Map(), jt = /* @__PURE__ */ new Set();
function Tn(e, t) {
  yo.set(e, t);
  for (const n of jt) n(e);
}
function Ee(e) {
  return yo.get(e) ?? null;
}
function Mr(e) {
  return jt.add(e), () => jt.delete(e);
}
const bo = /* @__PURE__ */ new Map();
function Ar(e) {
  e?.draft_sha256 && bo.set(e.draft_sha256, e);
}
function Lr(e) {
  return e ? bo.get(e) ?? null : null;
}
const Cn = "Plenio.OpenPlayer", Pn = "plenio-player", Nr = "▶ Open in the Plenio Player";
function Wt(e, t, n, o, s = 12e3) {
  e.extensionManager?.toast?.add({ severity: t, summary: n, detail: o, life: s });
}
async function Tr(e) {
  const t = await e.fetchApi("/plenio/player/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  }), n = await t.json().catch(() => ({}));
  if (!t.ok) {
    const o = n?.error ?? {};
    throw new V(o.message ?? `The Plenio Player did not start (${t.status})`, o.hint ?? null);
  }
  return n;
}
function On(e, t) {
  const n = e.endsWith("/") ? e : `${e}/`;
  return t ? `${n}#/record/${encodeURIComponent(t)}` : `${n}#/`;
}
async function Ft(e, t = null, n = window) {
  const o = n.open("", Pn);
  let s = !0;
  try {
    s = !o || o.location.href === "about:blank";
  } catch {
    s = !1;
  }
  if (o && s)
    try {
      o.document.title = "Plenio Player", o.document.body.style.cssText = "margin:0;height:100vh;display:grid;place-items:center;background:#0a0910;color:#a99fc0;font:600 18px system-ui,sans-serif", o.document.body.textContent = "Starting the Plenio Player …";
    } catch {
    }
  try {
    const r = await Tr(e.fetcher);
    o ? ((s || t) && (o.location.href = On(r.url, t)), o.focus()) : n.open(On(r.url, t), Pn), r.started && Wt(e.app, "success", "Plenio Player started", `${r.url} - it keeps running when ComfyUI stops; stop it on its Settings page.`);
  } catch (r) {
    o && s && o.close();
    const i = r instanceof V && r.hint ? ` ${r.hint}` : "";
    Wt(e.app, "error", "Plenio Player", `${r instanceof Error ? r.message : String(r)}${i}`, 2e4);
  }
}
function Cr(e, t) {
  const n = /* @__PURE__ */ new WeakMap(), o = e.prototype, s = o.onNodeCreated;
  o.onNodeCreated = function() {
    s?.call(this);
    const i = this.addWidget?.("button", Nr, null, () => {
      Ft(t, n.get(this) ?? null);
    }, { serialize: !1 });
    i && (i.serialize = !1);
  }, e.prototype.onExecuted = ne(e.prototype.onExecuted, function(r) {
    const i = r?.plenio_player, a = i?.[i.length - 1]?.record;
    a && n.set(this, a);
  });
}
const Pr = /* @__PURE__ */ new Set(["127.0.0.1", "localhost", "[::1]"]);
function Or(e, t) {
  if (e === t) return !0;
  try {
    const n = new URL(e);
    return n.protocol !== "http:" && n.protocol !== "https:" ? !1 : Pr.has(n.hostname) || n.hostname === new URL(t).hostname;
  } catch {
    return !1;
  }
}
function Ir(e, t = window, n = 1500) {
  const o = new URLSearchParams(t.location.search);
  if (o.get("plenio") !== "continue") return !1;
  o.delete("plenio");
  const s = o.toString();
  t.history.replaceState(t.history.state, "", `${t.location.pathname}${s ? `?${s}` : ""}${t.location.hash}`);
  const r = t.opener;
  if (!r) return !0;
  const i = (a) => {
    const l = a.data;
    l?.type !== "plenio-continue" || a.source !== r || !Or(a.origin, t.location.origin) || (t.removeEventListener("message", i), dt(e, { record: l.record, name: String(l.name || "the Plenio Player") }).catch((d) => {
      const p = d instanceof V && d.hint ? ` ${d.hint}` : "";
      Wt(e.app, "error", "Continue a song", `${d instanceof Error ? d.message : String(d)}${p}`, 2e4);
    }));
  };
  return t.addEventListener("message", i), t.setTimeout(() => r.postMessage({ type: "plenio-ready" }, "*"), n), !0;
}
const Tt = {
  stop: { icon: "⏸", label: "review stop", color: "#2f6fb0", frame: !1 },
  waiting: { icon: "⏸", label: "waiting for your approval", color: "#c98a12", frame: !0 },
  approved: { icon: "✓", label: "approved", color: "#2f8a55", frame: !1 },
  ok: { icon: "✓", label: "", color: "#2f8a55", frame: !1 },
  warning: { icon: "⚠", label: "warning", color: "#b87a0a", frame: !1 },
  error: { icon: "✖", label: "error", color: "#c0392b", frame: !0 },
  skipped: { icon: "–", label: "not needed", color: "#5d6b80", frame: !1 }
};
function Rr(e) {
  return e === "ok" || e === "warning" || e === "error" || e === "skipped" ? e : null;
}
function qr(e, t) {
  return e === "stop for review" ? !0 : e === "as the brief says" ? !!t && t.includes("stop to review") : !1;
}
function wo(e) {
  if (/^(conflict|invalid)/.test(e.status)) return "error";
  if (e.waiting) return "waiting";
  if (e.review === "stop for review" && e.approved) return "approved";
  const t = new Set(e.findings.map((n) => n.severity));
  return t.has("error") ? "error" : t.has("warning") ? "warning" : "ok";
}
function zr(e) {
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
const ft = /* @__PURE__ */ new WeakMap(), Be = /* @__PURE__ */ new Set();
function vo(e) {
  return ft.get(e) ?? null;
}
function Le(e, t) {
  t ? ft.set(e, t) : ft.delete(e), e.setDirtyCanvas?.(!0, !0);
  for (const n of Be) n(e);
}
function Dr(e) {
  for (const t of e) ft.delete(t);
  for (const t of Be) t(null);
}
function Br() {
  for (const e of Be) e(null);
}
function Hr(e) {
  return Be.add(e), () => Be.delete(e);
}
const In = "600 12px sans-serif", et = 20, Ct = 7;
function jr(e) {
  return e.label ? `${e.icon} ${e.label}` : e.icon;
}
function Wr(e) {
  const t = e ? jr(e) : "";
  return {
    height: e ? et : 0,
    getWidth(n) {
      if (!e) return 0;
      n.save(), n.font = In;
      const o = n.measureText(t).width + 2 * Ct;
      return n.restore(), o;
    },
    draw(n, o, s) {
      if (!e) return;
      n.save(), n.font = In;
      const r = n.measureText(t).width + 2 * Ct;
      n.fillStyle = e.color, n.beginPath(), typeof n.roundRect == "function" ? n.roundRect(o, s, r, et, 5) : n.rect(o, s, r, et), n.fill(), n.fillStyle = "#ffffff", n.textBaseline = "middle", n.fillText(t, o + Ct, s + et / 2 + 0.5), n.restore();
    }
  };
}
const Fr = "PlenioSongSheet", Gr = 30;
function xo(e, t) {
  const n = e.widgets?.find((o) => o.name === t);
  return n ? String(n.value ?? "") : null;
}
function Vr(e) {
  const t = e.inputs?.findIndex((n) => n.name === "brief") ?? -1;
  if (t < 0) return null;
  try {
    const n = e.getInputNode?.(t);
    return n ? xo(n, "mode") : null;
  } catch {
    return null;
  }
}
function Gt(e) {
  const t = vo(e);
  return t || (e.type !== Fr ? null : qr(xo(e, "review") ?? "continue", Vr(e)) ? "stop" : null);
}
function Ur(e) {
  const t = e?.plenio_sheet, n = t?.[t.length - 1];
  if (n) return wo(n);
  const o = e?.plenio_summary;
  return Rr(o?.[o.length - 1]?.status);
}
function Yr(e, t) {
  const n = e.prototype, o = n.onNodeCreated;
  n.onNodeCreated = function() {
    o?.call(this);
    const s = this;
    s.badges?.push(() => {
      const r = Gt(s);
      return Wr(r ? Tt[r] : null);
    });
  }, n.onDrawForeground = ne(n.onDrawForeground, function(s) {
    const r = Gt(this);
    !r || !Tt[r].frame || this.flags?.collapsed || !this.size || Xr(s, Tt[r], this.size, Gr, t.scale());
  }), n.onExecuted = ne(n.onExecuted, function(s) {
    const r = Ur(s);
    r && (Le(this, r), r === "waiting" && t.toast(
      `Stopped at ${this.title || "the Song Sheet"}`,
      'Waiting for your approval: open it with "Edit Song Sheet…", check the documents, press Approve, then run again.'
    ));
  });
}
function Xr(e, t, n, o, s) {
  const r = Math.max(3, 3 / Math.max(s, 0.05));
  e.save(), e.strokeStyle = t.color, e.lineWidth = r, e.beginPath();
  const i = r / 2 + 3;
  typeof e.roundRect == "function" ? e.roundRect(-i, -o - i, n[0] + 2 * i, n[1] + o + 2 * i, 10) : e.rect(-i, -o - i, n[0] + 2 * i, n[1] + o + 2 * i), e.stroke(), e.restore();
}
function Ra(e, t) {
  const n = [];
  let o = 0;
  return e.bars.forEach((s, r) => {
    const i = t?.[r] ?? null, a = i && i[1] > i[0] ? [i[0], i[1]] : null, l = a ? a[1] - a[0] : s.duration_s;
    n.push({ scoreStart: s.start_s, scoreDur: s.duration_s, realStart: o, realDur: l, source: a }), o += l;
  }), n;
}
function _o(e, t, n) {
  let o = null;
  for (const s of e)
    if (s[n] <= t + J) o = s;
    else break;
  return o ?? e[0] ?? null;
}
function ke(e, t) {
  const n = _o(e, t, "scoreStart");
  if (!n) return t;
  const o = n.scoreDur > 0 ? (t - n.scoreStart) / n.scoreDur : 0;
  return n.realStart + o * n.realDur;
}
function Jr(e, t) {
  const n = _o(e, t, "realStart");
  if (!n) return t;
  const o = n.realDur > 0 ? (t - n.realStart) / n.realDur : 0;
  return n.scoreStart + o * n.scoreDur;
}
function qa(e, t, n) {
  const o = ke(e, t), s = n == null ? 1 / 0 : ke(e, n), r = [];
  for (const i of e) {
    if (!i.source) continue;
    const a = i.realStart + i.realDur, l = Math.max(i.realStart, o), d = Math.min(a, s);
    if (d <= l + J) continue;
    let p = i.source[0] + (l - i.realStart) / i.realDur * (i.source[1] - i.source[0]), m = l - o, S = d - l;
    if (p < 0 && (m -= p, S += p, p = 0, S <= J))
      continue;
    const _ = r.at(-1);
    _ && Math.abs(_.at + _.duration - m) < J && Math.abs(_.offset + _.duration - p) < 0.01 ? _.duration += S : r.push({ at: m, offset: p, duration: S });
  }
  return r;
}
const So = 0.04, J = 1e-3, Qr = 0.25, Kr = 2;
function pt(e) {
  return Math.min(Kr, Math.max(Qr, Number.isFinite(e) ? e : 1));
}
function za(e, t) {
  const n = pt(t.speed), o = t.to ?? e.duration_s, s = [], r = t.clock?.length ? t.clock : null, i = r ? ke(r, t.from) : t.from, a = (l) => (r ? ke(r, l) : l) - i;
  for (const l of ["Vocal", "Ins"])
    if (t.voices[l])
      for (const d of e.notes?.[l] ?? []) {
        if (d.start_s < t.from - J || d.start_s >= o - J) continue;
        const p = Math.min(d.start_s + d.duration_s, o), m = Math.max(0, a(d.start_s));
        s.push({ at: m / n, duration: (a(p) - m) / n, midi: d.midi, part: l });
      }
  if (t.voices.chords)
    for (const l of e.chords ?? []) {
      const d = Math.min(l.start_s + l.duration_s, o), p = Math.max(l.start_s, t.from);
      if (!(d <= p + J))
        for (const m of l.pitches)
          s.push({ at: a(p) / n, duration: (a(d) - a(p)) / n, midi: m, part: "chord" });
    }
  if (t.voices.guide)
    for (const l of t.guide ?? []) {
      if (l.start_s < t.from - J || l.start_s >= o - J) continue;
      const d = Math.min(l.start_s + l.duration_s, o), p = Math.max(0, a(l.start_s));
      s.push({ at: p / n, duration: (a(d) - p) / n, midi: l.midi, part: "guide" });
    }
  if (t.metronome)
    for (const l of e.bars) {
      const d = Number(l.meter.split("/")[0]) || 1;
      for (let p = 0; p < d; p++) {
        const m = l.start_s + p * l.duration_s / d;
        m < t.from - J || m >= o - J || s.push({
          at: Math.max(0, a(m)) / n,
          duration: So,
          midi: p === 0 ? 96 : 89,
          part: "click"
        });
      }
    }
  return s.sort((l, d) => l.at - d.at || l.midi - d.midi);
}
function Da(e, t) {
  const n = Math.max(t.from, t.to ?? e.duration_s), o = t.clock?.length ? t.clock : null, s = o ? ke(o, n) - ke(o, t.from) : n - t.from;
  return Math.max(0, s) / pt(t.speed);
}
function Ba(e, t, n, o, s, r) {
  const i = e && t > 0 ? e.duration_s / t : 0, a = e && i > 0 ? Math.max(0, n - e.start_s) : 0, l = i > 0 ? Math.floor(a / i + 1e-6) : 0, d = i > 0 ? (a - l * i) / i * r : 0, p = d > 1e-3 ? 0 : 1, m = Math.max(0, o * t);
  return Array.from({ length: m }, (S, _) => {
    const q = p + m - 1 - _, $ = ((l - q) % t + t) % t === 0;
    return { at: Math.max(0, s - d - q * r), duration: So, midi: $ ? 96 : 89, part: "click" };
  });
}
function Ha(e, t) {
  const n = e.clock?.length ? e.clock : null;
  return n ? Jr(n, ke(n, e.from) + t * pt(e.speed)) : e.from + t * pt(e.speed);
}
function ja(e, t, n) {
  return (e.elements ?? []).filter(
    (o) => o.kind === "note" && n[o.voice] && o.start_s <= t + J && t < o.start_s + o.duration_s - J
  ).map((o) => o.id);
}
function Zr(e) {
  return 440 * 2 ** ((e - 69) / 12);
}
const ei = [
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
], Wa = {
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
  return typeof e == "string" && ei.includes(e);
}
function ko() {
  return { Vocal: "soft", Ins: "plain", chord: "plain", guide: "plain" };
}
function ti(e) {
  const t = ko(), n = typeof e == "object" && e !== null ? e : {};
  return {
    Vocal: tt(n.Vocal) ? n.Vocal : t.Vocal,
    Ins: tt(n.Ins) ? n.Ins : t.Ins,
    chord: tt(n.chord) ? n.chord : t.chord,
    guide: tt(n.guide) ? n.guide : t.guide
  };
}
const ni = {
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
}, Rn = /* @__PURE__ */ new WeakMap();
function Pt(e, t, n) {
  let o = Rn.get(e);
  o || Rn.set(e, o = /* @__PURE__ */ new Map());
  let s = o.get(t);
  if (!s) {
    const r = new Float32Array(n.length + 1), i = new Float32Array(n.length + 1);
    n.forEach((a, l) => i[l + 1] = a), s = e.createPeriodicWave(r, i), o.set(t, s);
  }
  return s;
}
const qn = /* @__PURE__ */ new WeakMap();
function Eo(e) {
  let t = qn.get(e);
  if (!t) {
    t = e.createBuffer(1, e.sampleRate, e.sampleRate);
    const n = t.getChannelData(0);
    let o = 1;
    for (let s = 0; s < n.length; s++)
      o = o * 16807 % 2147483647, n[s] = o / 2147483647 * 2 - 1;
    qn.set(e, t);
  }
  return t;
}
function C(e, t, n, o = 0) {
  const s = e.createOscillator();
  return typeof t == "string" ? s.type = t : s.setPeriodicWave(t), s.frequency.value = n, s.detune.value = o, s;
}
function me(e, t) {
  const n = e.createGain();
  return n.gain.value = t, n;
}
function se(e, t, n, o = 0.7) {
  const s = e.createBiquadFilter();
  return s.type = t, s.frequency.value = Math.min(n, e.sampleRate / 2 - 100), s.Q.value = o, s;
}
function Re(e, t, n, o, s, r) {
  const i = C(e, "sine", o), a = e.createGain();
  a.gain.setValueAtTime(0, n), a.gain.setValueAtTime(0, n + r), a.gain.linearRampToValueAtTime(s, n + r + 0.4), i.connect(a);
  for (const l of t) a.connect(l.detune);
  return i;
}
function Ot(e, t, n, o, s, r) {
  const i = e.createBufferSource();
  i.buffer = Eo(e);
  const a = se(e, "bandpass", o, 1.2), l = e.createGain();
  return l.gain.setValueAtTime(s, n), l.gain.setTargetAtTime(0, n, r), i.connect(a).connect(l).connect(t), i;
}
const lt = (e, t) => Math.min(t * 2.5, Math.max(t * 0.3, t * 2 ** ((60 - e) / 24))), zn = {
  plain: {
    attack: 0.012,
    sustain: 0.85,
    decay: 0.4,
    release: 0.015,
    build: (e, t, n) => [Dn(C(e, "sine", n), t)]
  },
  soft: {
    attack: 0.012,
    sustain: 0.85,
    decay: 0.4,
    release: 0.015,
    build: (e, t, n) => [Dn(C(e, "triangle", n), t)]
  },
  piano: {
    attack: 3e-3,
    sustain: 0,
    decay: 1.4,
    release: 0.09,
    build(e, t, n, o, s, r) {
      const i = Pt(e, "piano", [1, 0.62, 0.36, 0.27, 0.16, 0.12, 0.07, 0.06, 0.035, 0.02, 0.012, 8e-3]), a = se(e, "lowpass", Math.min(n * (5 + 7 * s), 14e3), 0.5);
      a.frequency.setTargetAtTime(Math.max(n * 2.2, 400), o + 0.01, lt(r, 0.35)), a.connect(t);
      const l = C(e, i, n, -1.5), d = C(e, i, n, 1.5), p = me(e, 0.5);
      l.connect(p), d.connect(p), p.connect(a);
      const m = Ot(e, t, o, Math.min(n * 6, 7e3), 0.12 * s, 8e-3);
      return [l, d, m];
    }
  },
  epiano: {
    attack: 2e-3,
    sustain: 0,
    decay: 1.6,
    release: 0.12,
    build(e, t, n, o, s, r) {
      const i = C(e, "sine", n), a = C(e, "sine", n), l = e.createGain(), d = n * (1.2 + 2.2 * s);
      l.gain.setValueAtTime(d, o), l.gain.setTargetAtTime(n * 0.25, o, lt(r, 0.25)), a.connect(l).connect(i.frequency);
      const p = se(e, "highpass", 25, 0.7);
      p.connect(t);
      const m = C(e, "sine", n * 4), S = e.createGain();
      return S.gain.setValueAtTime(0.18 * s, o), S.gain.setTargetAtTime(0, o, 0.06), m.connect(S).connect(p), i.connect(p), [i, a, m];
    }
  },
  strings: {
    attack: 0.22,
    sustain: 0.9,
    decay: 0.6,
    release: 0.2,
    build(e, t, n, o) {
      const s = se(e, "lowpass", Math.min(n * 5 + 800, 6e3), 0.6);
      s.connect(t);
      const r = [-9, 0, 8].map((a) => C(e, "sawtooth", n, a));
      for (const a of r) a.connect(s);
      const i = Re(e, r, o, 5.3, 7, 0.3);
      return [...r, i];
    }
  },
  pad: {
    attack: 0.5,
    sustain: 0.95,
    decay: 1,
    release: 0.45,
    build(e, t, n, o) {
      const s = Math.min(n * 3 + 500, 4500), r = se(e, "lowpass", s, 0.8);
      r.connect(t);
      const i = C(e, "sine", 0.25), a = me(e, s * 0.3);
      i.connect(a).connect(r.frequency);
      const l = [C(e, "sawtooth", n, -12), C(e, "sawtooth", n, 11), C(e, "triangle", n / 2)];
      for (const d of l) d.connect(r);
      return [...l, i];
    }
  },
  organ: {
    attack: 6e-3,
    sustain: 1,
    decay: 1,
    release: 0.025,
    build(e, t, n, o) {
      const s = Pt(e, "organ", [1, 0.75, 0.55, 0.5, 0.18, 0.3, 0, 0.22, 0, 0.08, 0, 0.1]), r = C(e, s, n), i = C(e, "sine", n / 2), a = me(e, 0.35);
      i.connect(a).connect(t), r.connect(t);
      const l = Re(e, [r, i], o, 6.6, 4, 0), d = Ot(e, t, o, 3e3, 0.05, 4e-3);
      return [r, i, l, d];
    }
  },
  flute: {
    attack: 0.07,
    sustain: 0.85,
    decay: 0.5,
    release: 0.06,
    build(e, t, n, o) {
      const s = Pt(e, "flute", [1, 0.13, 0.06, 0.02]), r = C(e, s, n);
      r.connect(t);
      const i = e.createBufferSource();
      i.buffer = Eo(e), i.loop = !0;
      const a = se(e, "bandpass", Math.min(n * 2, 8e3), 1.5), l = me(e, 0.06);
      i.connect(a).connect(l).connect(t);
      const d = Re(e, [r], o, 4.9, 9, 0.25);
      return [r, i, d];
    }
  },
  voice: {
    attack: 0.08,
    sustain: 0.9,
    decay: 0.5,
    release: 0.09,
    build(e, t, n, o) {
      const s = C(e, "sawtooth", n), r = se(e, "lowpass", 5e3, 0.5);
      s.connect(r);
      for (const [l, d, p] of [
        [800, 6, 1],
        [1150, 8, 0.55],
        [2900, 12, 0.18]
      ]) {
        const m = se(e, "bandpass", l, d), S = me(e, p);
        r.connect(m).connect(S).connect(t);
      }
      const i = me(e, 0.15);
      r.connect(i).connect(t);
      const a = Re(e, [s], o, 5.4, 18, 0.22);
      return [s, a];
    }
  },
  pluck: {
    attack: 2e-3,
    sustain: 0,
    decay: 0.7,
    release: 0.07,
    build(e, t, n, o, s, r) {
      const i = se(e, "lowpass", Math.min(n * (6 + 6 * s), 9e3), 0.9);
      i.frequency.setTargetAtTime(Math.max(n * 1.5, 250), o + 5e-3, lt(r, 0.12)), i.connect(t);
      const a = C(e, "sawtooth", n), l = C(e, "triangle", n, 4);
      a.connect(i), l.connect(i);
      const d = Ot(e, t, o, Math.min(n * 8, 8e3), 0.1 * s, 5e-3);
      return [a, l, d];
    }
  },
  lead: {
    attack: 0.01,
    sustain: 0.8,
    decay: 0.3,
    release: 0.06,
    build(e, t, n, o) {
      const s = se(e, "lowpass", Math.min(n * 8, 7e3), 2);
      s.frequency.setTargetAtTime(Math.min(n * 4, 4e3), o + 0.02, 0.2), s.connect(t);
      const r = C(e, "square", n), i = C(e, "sawtooth", n, 6);
      r.connect(s), i.connect(s);
      const a = Re(e, [r, i], o, 5.6, 10, 0.3);
      return [r, i, a];
    }
  },
  bass: {
    attack: 4e-3,
    sustain: 0.45,
    decay: 0.5,
    release: 0.06,
    build(e, t, n, o) {
      const s = C(e, "sine", n), r = C(e, "triangle", n), i = me(e, 0.5);
      s.connect(t), r.connect(i).connect(t);
      const a = C(e, "sawtooth", n), l = se(e, "lowpass", Math.min(n * 6, 2500), 1);
      l.frequency.setTargetAtTime(n * 2, o + 0.01, 0.12);
      const d = me(e, 0.25);
      return a.connect(l).connect(d).connect(t), [s, r, a];
    }
  },
  mallets: {
    attack: 2e-3,
    sustain: 0,
    decay: 0.8,
    release: 0.1,
    build(e, t, n, o, s, r) {
      const i = C(e, "sine", n), a = C(e, "sine", n * 3.5), l = e.createGain();
      return l.gain.setValueAtTime(n * (1 + 1.5 * s), o), l.gain.setTargetAtTime(0, o, 0.05), a.connect(l).connect(i.frequency), i.connect(t), [i, a];
    }
  }
};
function Dn(e, t) {
  return e.connect(t), e;
}
function Fa(e, t, n, o, s, { velocity: r = 0.8, level: i = 1 } = {}) {
  const a = zn[n] ?? zn.plain, l = Zr(o), d = a.sustain === 0 ? lt(o, a.decay) : a.decay, p = i * ni[n] * (0.55 + 0.45 * Math.max(0, Math.min(1, r))), m = e.createGain();
  m.gain.setValueAtTime(0, s), m.gain.linearRampToValueAtTime(p, s + a.attack), m.gain.setTargetAtTime(p * a.sustain, s + a.attack, d), m.connect(t);
  const S = a.build(e, m, l, s, r, o);
  for (const k of S) k.start(s);
  let _ = !1, q = !1;
  const $ = (k) => {
    for (const H of S)
      try {
        H.stop(k);
      } catch {
      }
  };
  return S[0].onended = () => {
    q = !0, m.disconnect();
  }, a.sustain === 0 && $(s + a.attack + d * 7), {
    release(k) {
      if (_ || q) return;
      _ = !0;
      const H = Math.max(k, s + a.attack);
      m.gain.setTargetAtTime(0, H, a.release), $(H + a.release * 7);
    },
    stop() {
      if (q) return;
      q = !0, _ = !0;
      const k = e.currentTime;
      try {
        m.gain.cancelScheduledValues(k), m.gain.setValueAtTime(0, k);
      } catch {
      }
      $(k), m.disconnect();
    }
  };
}
const Ga = 12, nt = { width: 640, height: 420 }, oi = { width: 1280, height: 900 }, $o = 120, Mo = 720, Ao = 0.25, Lo = 0.85, No = 160, To = 460, Co = "plenio.sheet.dialog";
function He(e, t, n) {
  return Number.isFinite(e) ? Math.min(Math.max(e, t), Math.max(t, n)) : t;
}
function si(e, t) {
  const n = He(e.width, nt.width, Math.max(nt.width, t.width - 16)), o = He(e.height, nt.height, Math.max(nt.height, t.height - 16));
  return { width: Math.round(n), height: Math.round(o) };
}
function Va(e, t) {
  return Math.round(He(e + t, $o, Mo));
}
function Ua(e, t, n) {
  return !Number.isFinite(n) || n <= 0 ? Bn(e) : Bn(e + t / n);
}
function Bn(e) {
  return Math.round(He(e, Ao, Lo) * 1e3) / 1e3;
}
function Ya(e, t) {
  return Math.round(He(e + t, No, To));
}
function Xa(e, t, n) {
  const o = e.clientX, s = e.clientY, r = e.currentTarget;
  let i = !1;
  try {
    r?.setPointerCapture?.(e.pointerId);
  } catch {
  }
  const a = () => {
    if (!i) {
      i = !0;
      try {
        r?.releasePointerCapture?.(e.pointerId);
      } catch {
      }
      window.removeEventListener("pointermove", l), window.removeEventListener("pointerup", a), window.removeEventListener("pointercancel", a), window.removeEventListener("blur", a), n?.();
    }
  }, l = (d) => {
    if (d.buttons === 0) {
      a();
      return;
    }
    t({ dx: d.clientX - o, dy: d.clientY - s });
  };
  window.addEventListener("pointermove", l), window.addEventListener("pointerup", a), window.addEventListener("pointercancel", a), window.addEventListener("blur", a);
}
function ri() {
  return { ...oi, maximized: !1 };
}
function Ja(e = Po()) {
  const t = ri();
  try {
    const n = e?.getItem(Co);
    if (!n) return t;
    const o = JSON.parse(n);
    return { ...si(
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
function Qa(e, t = Po()) {
  try {
    t?.setItem(Co, JSON.stringify(e));
  } catch {
  }
}
function Po() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function Oo(e) {
  return e === "large" || e === "standard" || e === "smaller" || e === "compact";
}
function Io() {
  return { countIn: 1, quantize: 16, mode: "replace", mute: !0, thru: !0, stepLength: 8 };
}
function ii(e) {
  const t = Io(), n = typeof e == "object" && e !== null ? e : {}, o = (s, r, i) => r.includes(s) ? s : i;
  return {
    countIn: o(n.countIn, [0, 1, 2], t.countIn),
    quantize: o(n.quantize, [0, 4, 8, 16, 32], t.quantize),
    mode: o(n.mode, ["replace", "merge"], t.mode),
    mute: typeof n.mute == "boolean" ? n.mute : t.mute,
    thru: typeof n.thru == "boolean" ? n.thru : t.thru,
    stepLength: o(n.stepLength, [1, 2, 4, 8, 16], t.stepLength)
  };
}
const Ro = "plenio.score-editor.prefs";
function ai() {
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
    sounds: ko(),
    paper: "a4",
    notationSize: "standard",
    record: Io(),
    midiInput: "all"
  };
}
function li(e) {
  const t = e.layout;
  return t === "text" ? { layout: "text", advanced: e.advanced === !0 } : t === "daw" ? { layout: "daw", advanced: e.advanced === !0 } : t === "both" ? { layout: "review", advanced: !0 } : { layout: "review", advanced: e.advanced === !0 };
}
function Ka(e = qo()) {
  const t = ai();
  try {
    const n = e?.getItem(Ro);
    if (!n) return t;
    const o = JSON.parse(n);
    return {
      ...li(o),
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
      rollHeight: typeof o.rollHeight == "number" && o.rollHeight >= $o && o.rollHeight <= Mo ? Math.round(o.rollHeight) : t.rollHeight,
      notationShare: typeof o.notationShare == "number" && o.notationShare >= Ao && o.notationShare <= Lo ? o.notationShare : t.notationShare,
      sideWidth: typeof o.sideWidth == "number" && o.sideWidth >= No && o.sideWidth <= To ? Math.round(o.sideWidth) : t.sideWidth,
      metronome: o.metronome === !0,
      hear: o.hear === "notes" || o.hear === "source" ? o.hear : t.hear,
      sourceLevel: typeof o.sourceLevel == "number" && o.sourceLevel >= 0 && o.sourceLevel <= 1 ? o.sourceLevel : t.sourceLevel,
      audition: o.audition !== !1,
      rowHeight: typeof o.rowHeight == "number" && o.rowHeight >= 6 && o.rowHeight <= 28 ? Math.round(o.rowHeight) : t.rowHeight,
      follow: o.follow !== !1,
      sung: o.sung !== !1,
      wave: o.wave !== !1,
      sounds: ti(o.sounds),
      paper: o.paper === "letter" ? "letter" : "a4",
      notationSize: Oo(o.notationSize) ? o.notationSize : t.notationSize,
      record: ii(o.record),
      midiInput: typeof o.midiInput == "string" && o.midiInput ? o.midiInput : "all"
    };
  } catch {
    return t;
  }
}
function Za(e, t = qo()) {
  try {
    t?.setItem(Ro, JSON.stringify(e));
  } catch {
  }
}
function qo() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function zo(e) {
  if (!Array.isArray(e)) return [];
  const t = (n) => typeof n == "string" ? n : "";
  return e.filter((n) => !!n && typeof n == "object").map((n) => ({
    token: t(n.token),
    file: t(n.file),
    title: t(n.title),
    paper: n.paper === "letter" ? "letter" : "a4",
    size: Oo(n.size) ? n.size : "standard",
    display_abc: t(n.display_abc)
  })).filter((n) => n.token && n.file && n.display_abc);
}
function ci(e) {
  return zo(e?.plenio_notation);
}
async function ui(e) {
  const t = await e.fetchApi("/plenio/export/sheet-music/pending", { cache: "no-store" });
  if (!t.ok) return [];
  const n = await t.json().catch(() => ({}));
  return zo(n.jobs);
}
async function di(e, t) {
  const n = await t.draw(e.display_abc, e.title, e.paper, e.size), o = new ArrayBuffer(n.length);
  new Uint8Array(o).set(n);
  const s = await t.fetcher.fetchApi(`/plenio/export/sheet-music?token=${encodeURIComponent(e.token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: new Blob([o], { type: "application/pdf" })
  }), r = await s.json().catch(() => ({}));
  if (!s.ok)
    throw new V(r.error?.message ?? `Saving the sheet music failed (${s.status})`, r.error?.hint ?? null);
  return { file: r.file ?? e.file, bytes: r.bytes ?? n.length };
}
let Hn = Promise.resolve();
function fi(e) {
  const t = Hn.then(e, e);
  return Hn = t.catch(() => {
  }), t;
}
class pi {
  constructor(t, n) {
    this.host = t, this.report = n;
  }
  host;
  report;
  seen = /* @__PURE__ */ new Set();
  take(t, n = !1) {
    const o = [];
    for (const s of t)
      this.seen.has(s.token) || (this.seen.add(s.token), o.push(
        fi(() => di(s, this.host)).then(
          (r) => this.report({ job: s, saved: r }),
          (r) => {
            const i = r instanceof V && /can no longer be saved/.test(r.message);
            this.report({ job: s, error: r, quiet: n && i });
          }
        )
      ));
    return o;
  }
  /** Ask the server for the jobs still waiting and draw the new ones (a failed request draws nothing). */
  async recover() {
    let t = [];
    try {
      t = await ui(this.host.fetcher);
    } catch {
      return;
    }
    await Promise.all(this.take(t, !0));
  }
}
const hi = "PlenioSeed", mi = 2 ** 32, gi = "plenio_part", ct = "plenio_seed_hint", jn = 56, Wn = {
  fresh: { color: "#7a5418", bgcolor: "#3b2a10" },
  keep: { color: "#1f4e6e", bgcolor: "#14304a" }
};
function yi(e = Math.random) {
  return Math.floor(e() * mi);
}
function bi(e, t) {
  const n = t.trim() || "result";
  return e ? `🔒 Every run uses this seed again: the same ${n}.` : `🎲 Every run draws a new seed: a new ${n}. Liked it? Switch to 🔒.`;
}
function Ne(e, t) {
  return e.widgets?.find((n) => n.name === t);
}
function wi(e) {
  const t = e.inputs?.find((n) => n.name === "seed");
  return t?.link !== void 0 && t?.link !== null;
}
function Vt(e) {
  const t = !!Ne(e, "keep_seed")?.value, n = e, o = t ? Wn.keep : Wn.fresh;
  n.color = o.color, n.bgcolor = o.bgcolor;
  const s = Ne(e, ct)?.element;
  s && (s.textContent = bi(t, String(e.properties?.[gi] ?? ""))), e.setDirtyCanvas?.(!0, !0);
}
function Fn(e, t = Math.random) {
  const n = Ne(e, "seed");
  !n || wi(e) || (n.value = yi(t), n.callback?.(n.value), e.setDirtyCanvas?.(!0, !0));
}
function vi(e, t = Math.random) {
  const n = Ne(e, "seed"), o = Ne(e, "keep_seed");
  if (!n || !o) return;
  n.beforeQueued = () => {
    o.value || Fn(e, t);
  }, o.callback = ne(o.callback, () => Vt(e));
  const r = e.addWidget?.("button", "🎲 new seed now", null, () => Fn(e, t), { serialize: !1 });
  if (r && (r.serialize = !1), !Ne(e, ct)) {
    const i = document.createElement("div");
    i.className = "plenio-seed-hint";
    const a = e.addDOMWidget(ct, ct, i, {
      serialize: !1,
      getValue: () => "",
      setValue: () => {
      },
      // two lines of text and the frontend's margin of 10 px above and below a DOM widget
      getMinHeight: () => jn,
      getMaxHeight: () => jn
    });
    a.serialize = !1;
  }
  Vt(e);
}
function xi(e) {
  const t = e.prototype, n = t.onNodeCreated;
  t.onNodeCreated = function() {
    n?.call(this), vi(this);
  }, e.prototype.onConfigure = ne(e.prototype.onConfigure, function() {
    Vt(this);
  });
}
const _i = "PlenioSongSheet";
function Ge(e) {
  return e.widgets?.find((t) => t.name === "sheet_state") ?? null;
}
function Do(e, t) {
  const n = e.inputs?.[t]?.link;
  if (n == null) return null;
  try {
    const o = e.graph, s = o?.links, r = o?.getLink?.(n) ?? (s instanceof Map ? s.get(n) : s?.[String(n)]);
    return r && o?.getNodeById ? o.getNodeById(r.origin_id) ?? null : e.getInputNode?.(t) ?? null;
  } catch {
    return null;
  }
}
function Bo(e, t) {
  const n = (e.inputs ?? []).findIndex((o) => o.name === t && o.link != null);
  return n < 0 ? null : Do(e, n);
}
function Ho(e, t) {
  const n = Bo(e, t);
  return n && (n.comfyClass ?? n.type) === _i && Ge(n) ? n : null;
}
function Si(e) {
  return Ho(e, "context_lyrics");
}
function ki(e) {
  return Ho(e, "context_score");
}
function Ei(e, t, n) {
  const o = [], s = Bo(t, n);
  s && o.push(s);
  const r = /* @__PURE__ */ new Set();
  for (; o.length && r.size < 1e3; ) {
    const i = o.shift(), a = String(i.id);
    if (!r.has(a)) {
      if (r.add(a), i === e || a === String(e.id)) return !0;
      (i.inputs ?? []).forEach((l, d) => {
        const p = Do(i, d);
        p && o.push(p);
      });
    }
  }
  return !1;
}
function $i(e, t, n) {
  const o = Si(e), s = t?.context?.lyrics;
  if (!o || !s) return null;
  const r = o.title || "Song Sheet", i = Se(Ge(o)?.value), a = i?.docs.lyrics?.text ?? n(String(o.id))?.docs.lyrics?.upstream ?? null;
  let l = null;
  return i === null ? l = `The state of ${r} is unreadable - open that sheet and apply it first.` : a !== null && _e(a) !== _e(s) && (l = `The lyrics in ${r} changed after the last run. Run the workflow again; then they can follow the sections.`), { owner: o, target: { title: r, blocked: l, replans: Ei(o, e, "score") } };
}
function Mi(e, t, n) {
  const o = Ge(e);
  if (!o) return;
  const s = Se(o.value) ?? mt();
  o.value = De(lo(s, n, [{ kind: "lyrics", text: t, intent: "keep" }])), e.setDirtyCanvas?.(!0, !0);
}
function Ai(e, t, n) {
  const o = ki(e), s = t?.context?.score;
  if (!o || !s) return null;
  const r = o.title || "Song Sheet", i = Se(Ge(o)?.value), a = i?.docs.score?.text ?? n(String(o.id))?.docs.score?.upstream ?? null;
  let l = null;
  return i === null ? l = `The state of ${r} is unreadable - open that sheet and apply it first.` : a !== null && _e(a) !== _e(s) && (l = `The score in ${r} changed after the last run. Run the workflow again; then it can be edited here.`), { owner: o, target: { title: r, blocked: l } };
}
function Li(e, t) {
  const n = String(e.widgets?.find((o) => o.name === "review")?.value ?? "continue");
  return n === "as the brief says" ? t?.review ?? "continue" : n;
}
async function Ni(e, t, n, o = null) {
  const s = Ge(e);
  if (!s) return null;
  const r = Se(s.value) ?? mt(), i = lo(r, n, [{ kind: "score", text: t, intent: "keep" }]);
  if (s.value = De(i), e.setDirtyCanvas?.(!0, !0), !o || !n) return i;
  try {
    const a = await cs(o.fetcher, {
      sheet_state: i,
      upstream: Bs(n),
      owned: n.owned,
      review: Li(e, n),
      engine: n.engine,
      instrumental: n.instrumental,
      context: n.context,
      target_seconds: n.target_seconds ?? null
    });
    if (!!a.findings.some((p) => p.severity === "error") || !a.fingerprint) return i;
    const d = Ds(i, a.fingerprint);
    return s.value = De(d), e.setDirtyCanvas?.(!0, !0), d;
  } catch {
    return i;
  }
}
const jo = "PLENIO_SHEET_STATE", Gn = 68;
let ut = null;
function Ti(e) {
  ut = e;
}
const Ci = (e, t, n) => {
  let o = typeof n?.[1]?.default == "string" ? n[1].default : "";
  const s = document.createElement("div");
  s.className = "plenio-sheet-state";
  const r = document.createElement("span");
  r.className = "plenio-sheet-summary";
  const i = document.createElement("button");
  i.className = "plenio-sheet-open", i.textContent = "Edit Song Sheet…";
  const a = document.createElement("div");
  a.className = "plenio-sheet-status", s.append(i, r, a);
  let l = !1;
  const d = () => {
    const $ = Ee(String(e.id)), k = Gt(e);
    r.textContent = qs(Se(o)) + ($ && k !== "approved" ? ` · ${$.status}` : ""), a.textContent = zr(k), a.dataset.state = k ?? "";
    const H = l ? null : e.widgets?.find((u) => u.name === "review");
    if (H) {
      l = !0;
      const u = H.callback;
      H.callback = (F) => {
        u?.(F), d();
      };
    }
  }, p = e.addDOMWidget(t, jo, s, {
    getValue: () => o,
    setValue: ($) => {
      o = typeof $ == "string" ? $ : "", d();
    },
    // two rows, always: the frontend lays a DOM widget out once, so a height that changes later is cut;
    // it also keeps a 10 px margin above and below the element (68 - 20 = the rows' 48 px)
    getMinHeight: () => Gn,
    getMaxHeight: () => Gn
  });
  i.addEventListener("click", ($) => {
    $.stopPropagation(), m().catch((k) => {
      console.error("Plenio: the Song Sheet editor could not open", k), r.textContent = `The editor could not open: ${k instanceof Error ? k.message : String(k)}`;
    });
  });
  async function m() {
    const $ = Se(o);
    $ === null && (r.textContent = "The stored state is unreadable; it will be replaced when you apply.");
    const k = Ee(String(e.id)), u = (e.inputs ?? []).filter((N) => N.link != null).map((N) => N.name), F = $ ?? { schema: "plenio.sheet_state/1", docs: {} }, A = k?.owned ?? co(u, F), b = String(e.widgets?.find((N) => N.name === "review")?.value ?? "continue"), g = b === "as the brief says" ? k?.review ?? "continue" : b, y = () => tn(import.meta.url, nn), { openSheetDialog: w } = await qe(() => import("./open-D6rLe8y8.mjs"), y), { parseGuide: L, serializeGuide: E } = await qe(() => import("./tracks-DxmZeggM.mjs"), y), { parseShift: U, parseSpans: z } = await qe(() => import("./lyricPlacement-rAf-x_fn.mjs"), y);
    if (!ut) throw new Error("Plenio: API not initialised");
    let R = null;
    try {
      R = $i(e, k, Ee);
    } catch (N) {
      console.warn("Plenio: the lyrics sheet of this score was not found", N);
    }
    let D = null;
    try {
      D = Ai(e, k, Ee);
    } catch (N) {
      console.warn("Plenio: the score sheet of these lyrics was not found", N);
    }
    const j = ut;
    w({
      title: e.title || "Song Sheet",
      state: F,
      payload: k,
      asrNote: Lr(k?.docs.lyrics?.upstream_sha256),
      owned: A.length ? A : [...Fe],
      review: g,
      fetcher: ut,
      // a template's choice of the score editor's layout (review, text; daw with the DAW template)
      layout: typeof e.properties?.plenio_editor_layout == "string" ? e.properties.plenio_editor_layout : null,
      // the Guide track (playback and MIDI only), kept in the node's properties with the workflow
      guide: L(e.properties?.plenio_guide),
      // the lyrics lines placed by hand in the lyrics lane, kept like the Guide notes
      lyricSpans: z(e.properties?.plenio_lyric_spans),
      // how far a cover's source recording is moved against the bars (the beat grid corrected by hand)
      sourceShift: U(e.properties?.plenio_source_shift),
      lyricsTarget: R?.target ?? null,
      scoreTarget: D?.target ?? null,
      onApply: (N, pe, K, T, P, ae) => {
        const Ve = String(p.value ?? "");
        if (p.value = De(N), e.properties = {
          ...e.properties ?? {},
          plenio_guide: E(pe),
          plenio_lyric_spans: (ae?.lyricSpans ?? []).map((le) => [...le]),
          plenio_source_shift: ae?.sourceShift ?? 0
        }, P ? Le(e, "approved") : String(p.value) !== Ve && S(e), K !== null && R && !R.target.blocked && (Mi(R.owner, K, Ee(String(R.owner.id))), S(R.owner)), T && D && !D.target.blocked) {
          const le = D.owner;
          Ni(le, T.text, Ee(String(le.id)), T.approved ? { fetcher: j } : null).then(
            (Y) => {
              Y?.review?.approved_fingerprint ? Le(le, "approved") : S(le);
            }
          );
        }
        e.setDirtyCanvas?.(!0, !0);
      }
    });
  }
  function S($) {
    vo($) === "approved" && Le($, null);
  }
  const _ = [
    Mr(($) => {
      $ === String(e.id) && d();
    }),
    Hr(($) => {
      ($ === null || $ === e) && d();
    })
  ], q = e.onRemoved;
  return e.onRemoved = function() {
    for (const $ of _) $();
    q?.call(this);
  }, d(), { widget: p };
}, je = "plenio.stem_mix/1", Te = "rest", Pi = ["reverb", "delay"], Wo = -60, Oi = 12;
function Ii() {
  return { gain_db: 0, mute: !1, solo: !1, compression: 0, muted: [], reverb: 0, delay: 0, save: !1 };
}
function ie(e, t) {
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
function Fo(e) {
  const t = Ii();
  return e.gain_db === t.gain_db && e.mute === t.mute && e.solo === t.solo && e.compression === t.compression && e.muted.length === 0 && e.reverb === t.reverb && e.delay === t.delay && e.save === t.save;
}
const Ri = ["vocals", "drums", "bass", "other"];
function qi() {
  return [...Ri, Te];
}
function zi(e) {
  if (typeof e != "string" || !e.trim()) return { schema: je, strips: {} };
  try {
    const t = JSON.parse(e);
    return t?.schema !== je || typeof t.strips != "object" || t.strips === null ? null : t;
  } catch {
    return null;
  }
}
function Di(e) {
  const t = {};
  for (const o of Object.keys(e.strips)) {
    if (!o || Fo(ie(e, o))) continue;
    const s = {}, r = ie(e, o);
    r.gain_db && (s.gain_db = r.gain_db), r.mute && (s.mute = !0), r.solo && (s.solo = !0), r.compression && (s.compression = r.compression), r.muted.length && (s.muted = r.muted), r.reverb && (s.reverb = r.reverb), r.delay && (s.delay = r.delay), r.save && (s.save = !0), t[o] = s;
  }
  const n = { schema: je, strips: t };
  return e.reverb && Object.keys(e.reverb).length && (n.reverb = e.reverb), e.delay && Object.keys(e.delay).length && (n.delay = e.delay), JSON.stringify(n);
}
function ht(e, t, n) {
  const o = { ...e.strips };
  return Fo(n) ? delete o[t] : o[t] = n, { ...e, strips: o };
}
function Bi(e, t, n) {
  const o = n.some((r) => ie(e, r).solo), s = ie(e, t);
  return o ? s.solo : !s.mute;
}
function Vn(e) {
  return e <= Wo ? "-∞" : `${e > 0 ? "+" : ""}${e.toFixed(1)}`;
}
function Hi(e, t = null) {
  const n = e.filter((s) => Array.isArray(s) && s.length === 2 && Number.isFinite(s[0]) && Number.isFinite(s[1])).map((s) => [Math.max(0, Math.min(s[0], s[1])), Math.max(s[0], s[1])]).filter((s) => s[1] - s[0] > 1e-6).sort((s, r) => s[0] - r[0]), o = [];
  for (const s of n) {
    const r = o[o.length - 1];
    r && s[0] <= r[1] + 1e-6 ? r[1] = Math.max(r[1], s[1]) : o.push([...s]);
  }
  return t !== null && t > 0 ? o.map(([s, r]) => [Math.min(s, t), Math.min(r, t)]).filter(([s, r]) => r - s > 1e-6) : o;
}
function ji(e, t, n) {
  return Hi([...e, [t, n]]);
}
function Wi(e, t) {
  return e.findIndex(([n, o]) => n <= t && t <= o);
}
function Fi(e, t) {
  return t < 0 ? e : e.filter((n, o) => o !== t);
}
function Gi(e, t, n, o) {
  const s = ie(e, t);
  return ht(e, t, { ...s, muted: ji(s.muted, n, o) });
}
function Vi(e, t, n) {
  const o = ie(e, t), s = Wi(o.muted, n);
  return s < 0 ? e : ht(e, t, { ...o, muted: Fi(o.muted, s) });
}
function Ui(e) {
  const t = e?.plenio_stems, n = t?.[t.length - 1];
  if (!n?.peaks) return {};
  const o = {};
  for (const [s, r] of Object.entries(n.peaks))
    Array.isArray(r) && r.length && (o[s] = r.map((i) => Math.abs(Number(i) || 0)));
  return o;
}
function Yi(e, t, n = 200) {
  const o = e[t];
  return o?.length ? o.length === n ? o : Array.from({ length: n }, (s, r) => o[Math.floor(r * o.length / n)] ?? 0) : new Array(n).fill(0);
}
function Un(e, t) {
  const o = (Array.isArray(t?.stems) && t.stems.length ? t.stems : qi()).filter((r) => r !== Te), s = Object.keys(e?.strips ?? {}).filter((r) => r !== Te && !o.includes(r));
  return [...o, ...s, Te];
}
const Yn = "plenio_stem_mixer", Xn = "mix", ge = 200, Xi = ["room", "plate", "hall"];
function I(e, t, n) {
  const o = document.createElement(e);
  return t && (o.className = t), n !== void 0 && (o.textContent = n), o;
}
function ot(e, t, n, o, s) {
  const r = I("input");
  return r.type = "range", r.min = String(e), r.max = String(t), r.step = String(n), r.value = String(o), r.setAttribute("aria-label", s), r;
}
function Ji(e) {
  const t = I("div", "plenio-mix"), n = I("div", "plenio-mix-strips"), o = I("div", "plenio-mix-buses"), s = I("div", "plenio-mix-info"), r = I("div", "plenio-mix-advanced");
  t.append(n, o, r, s);
  let i = {
    mix: { schema: je, strips: {} },
    // the documented stems are there before the first run (owner's request, 2026-09-28); a separation
    // replaces them with what the model actually produced
    names: Un(null, null),
    peaks: {},
    seconds: 0
  }, a = !1;
  const l = () => e.widgets?.find((b) => b.name === Xn);
  function d(b, { draw: g = !0 } = {}) {
    const y = l();
    if (!y) return;
    const w = Di(b);
    y.value = w, y.callback?.(w), i = { ...i, mix: b }, g && _();
  }
  function p(b, g, y = {}) {
    d(ht(i.mix, b, { ...ie(i.mix, b), ...g }), y);
  }
  function m(b, g, y, w = {}) {
    const L = ie(i.mix, b);
    let E = ht(i.mix, b, { ...L, [g]: y });
    y > 0 && !(E[g] && Object.keys(E[g]).length) && (E = g === "reverb" ? { ...E, reverb: { preset: "room" } } : { ...E, delay: { time_ms: 375, feedback: 0.35, lowpass_hz: 4e3 } }), d(E, w);
  }
  function S(b, g, y) {
    const w = { ...i.mix[b] ?? {} };
    d({ ...i.mix, [b]: { ...w, [g]: y } });
  }
  function _() {
    n.replaceChildren();
    const b = i.names;
    for (const g of i.names) {
      const y = ie(i.mix, g), w = I("div", "plenio-mix-strip");
      w.dataset.strip = g;
      const L = I("span", "name", g === Te ? `${g} (missed)` : g);
      L.title = g === Te ? "What the separator missed: keeps a neutral mix exact" : "";
      const E = ot(Wo, Oi, 0.5, y.gain_db, `${g} gain`), U = I("span", "gain", `${Vn(y.gain_db)} dB`);
      E.addEventListener("input", () => {
        U.textContent = `${Vn(Number(E.value))} dB`, p(g, { gain_db: Number(E.value) }, { draw: !1 });
      }), E.addEventListener("change", () => p(g, { gain_db: Number(E.value) }));
      const z = I("button", y.mute ? "toggle active" : "toggle", "M");
      z.setAttribute("aria-label", `${g} mute`), z.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { mute: !y.mute });
      });
      const R = I("button", y.solo ? "toggle active" : "toggle", "S");
      R.setAttribute("aria-label", `${g} solo`), R.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { solo: !y.solo });
      });
      const D = ot(0, 1, 0.05, y.compression, `${g} compression`);
      D.title = "Compression amount: one knob for the master compressor (threshold and ratio)", D.addEventListener("input", () => p(g, { compression: Number(D.value) }, { draw: !1 })), D.addEventListener("change", () => p(g, { compression: Number(D.value) }));
      const j = Pi.map((T) => {
        const P = ot(0, 1, 0.05, y[T], `${g} ${T} send`);
        return P.title = `${T} send: how much of this stem goes to the shared ${T} bus`, P.addEventListener("input", () => m(g, T, Number(P.value), { draw: !1 })), P.addEventListener("change", () => m(g, T, Number(P.value))), P;
      }), N = I("button", y.save ? "toggle active" : "toggle", "save");
      N.setAttribute("aria-label", `${g} save as its own file`), N.setAttribute("aria-pressed", String(y.save)), N.title = 'Save this stem as its own 24-bit FLAC file on the next run - next to the song, in the folder "<name>-stems" (without an Export Release: output/plenio/stems); its gain, compression and muted ranges are applied, mute/solo and the buses are not', N.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { save: !y.save });
      });
      const pe = Bi(i.mix, g, b);
      w.classList.toggle("silent", !pe);
      const K = I("canvas", "plenio-mix-wave");
      K.width = ge, K.height = 26, K.setAttribute("aria-label", `${g} waveform (drag to mute a time range)`), q(K, y, Yi(i.peaks, g, ge)), K.addEventListener("pointerdown", (T) => $(T, K, g)), w.append(
        L,
        E,
        U,
        z,
        R,
        I("span", "label", "comp"),
        D,
        I("span", "label", "verb"),
        j[0],
        I("span", "label", "delay"),
        j[1],
        N,
        K
      ), n.append(w);
    }
    k(), s.textContent = i.seconds ? `last run: ${i.seconds.toFixed(1)} s - drag on a strip to mute a time range, click a range to remove it` : "no run yet: the strips show the documented stems (vocals, drums, bass, other and the residual rest); Separate Stems fills them", e.setDirtyCanvas?.(!0, !0);
  }
  function q(b, g, y) {
    const w = b.getContext("2d");
    if (!w) return;
    w.clearRect(0, 0, ge, b.height);
    const L = b.height / 2;
    w.strokeStyle = "rgba(180, 190, 205, 0.8)", w.beginPath();
    for (let E = 0; E < y.length; E++) {
      const U = Math.max(1, y[E] * (L - 1));
      w.moveTo(E + 0.5, L - U), w.lineTo(E + 0.5, L + U);
    }
    w.stroke(), w.fillStyle = "rgba(224, 104, 94, 0.35)", w.strokeStyle = "rgba(224, 104, 94, 0.9)";
    for (const [E, U] of g.muted) {
      const z = Math.max(0, Math.min(ge, E / Math.max(i.seconds, 1e-6) * ge)), R = Math.max(0, Math.min(ge, U / Math.max(i.seconds, 1e-6) * ge));
      w.fillRect(z, 0, Math.max(1, R - z), b.height), w.strokeRect(z + 0.5, 0.5, Math.max(1, R - z) - 1, b.height - 1);
    }
  }
  function $(b, g, y) {
    if (b.preventDefault(), b.stopPropagation(), !i.seconds) return;
    const w = g.getBoundingClientRect(), L = (j) => Math.max(0, Math.min(1, (j - w.left) / (w.width || ge))) * i.seconds, E = L(b.clientX);
    if (ie(i.mix, y).muted.some(([j, N]) => j <= E && E <= N)) {
      d(Vi(i.mix, y, E));
      return;
    }
    let z = E;
    const R = (j) => {
      z = L(j.clientX);
    }, D = () => {
      window.removeEventListener("pointermove", R), window.removeEventListener("pointerup", D), d(Gi(i.mix, y, Math.min(E, z), Math.max(E, z)));
    };
    window.addEventListener("pointermove", R), window.addEventListener("pointerup", D);
  }
  function k() {
    o.replaceChildren();
    const b = { preset: "room", ...i.mix.reverb ?? {} }, g = { time_ms: 375, feedback: 0.35, ...i.mix.delay ?? {} }, y = I("select");
    y.setAttribute("aria-label", "Reverb preset"), y.title = "The room the reverb bus adds; the amount per stem is its verb send";
    for (const E of Xi) y.append(new Option(E, E));
    y.value = String(b.preset ?? "room"), y.addEventListener("change", () => S("reverb", "preset", y.value));
    const w = I("input");
    w.type = "number", w.value = String(g.time_ms ?? 375), w.setAttribute("aria-label", "Delay time in ms"), w.title = "Delay time in ms: where the first echo of the delay bus sits", w.addEventListener("change", () => S("delay", "time_ms", Number(w.value)));
    const L = ot(0, 0.8, 0.05, Number(g.feedback ?? 0.35), "Delay feedback");
    L.title = "Delay feedback: how much of each echo returns into the delay line", L.addEventListener("input", () => S("delay", "feedback", Number(L.value))), o.append(
      I("span", "label", "reverb bus"),
      y,
      I("span", "label", "delay bus"),
      w,
      I("span", "label", "ms, feedback"),
      L
    ), o.style.display = "flex";
  }
  const H = e.addDOMWidget(Yn, Yn, t, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 260,
    getMaxHeight: () => 620
  });
  H.serialize = !1;
  const u = e.widgets?.find((b) => b.name === Xn), F = I("button", "toggle", "JSON");
  F.title = "Show or hide the raw mixer value", F.addEventListener("click", (b) => {
    b.stopPropagation(), a = !a, F.classList.toggle("active", a), u && (u.plenioHidden = !a, a ? delete u.computeSize : u.computeSize = () => [0, -4]), e.setDirtyCanvas?.(!0, !0);
  }), r.append(I("span", "label", "Advanced"), F), u && (u.plenioHidden = !0, u.computeSize = () => [0, -4]);
  function A() {
    const b = zi(l()?.value);
    i = { ...i, mix: b ?? { schema: je, strips: {} } }, b || (s.textContent = "the mixer value is not readable; it will be replaced on the next edit"), _();
  }
  return A(), {
    showExecuted(b) {
      const g = b?.plenio_stems?.at(-1), y = Ui(b), w = Un(i.mix, g ?? null);
      i = { ...i, names: w, peaks: y, seconds: Number(g?.seconds ?? i.seconds) || 0 }, A();
    }
  };
}
const Ut = "plenio-tip", Jn = 12, st = 8;
function Qi(e, t, n, o) {
  let s = e.right + Jn;
  if (s + n.width > o.width - st && (s = e.left - Jn - n.width), s < st) return null;
  const r = Math.max(st, Math.min(t - 14, o.height - st - n.height));
  return { x: s, y: r };
}
function Ki(e) {
  return !!e && (String(e.type ?? "").startsWith("Plenio") || String(e.title ?? "").startsWith("Plenio"));
}
const Zi = 30;
function ea(e) {
  const t = e.node_over, n = e.ds, o = e.canvas;
  if (!t || !n || !o) return null;
  const s = o.getBoundingClientRect(), r = t.flags?.collapsed ? 0 : t.size[1];
  return {
    left: s.left + (t.pos[0] + n.offset[0]) * n.scale,
    top: s.top + (t.pos[1] - Zi + n.offset[1]) * n.scale,
    right: s.left + (t.pos[0] + t.size[0] + n.offset[0]) * n.scale,
    bottom: s.top + (t.pos[1] + r + n.offset[1]) * n.scale
  };
}
function ta(e) {
  const t = document.body, n = () => t.classList.remove(Ut);
  let o = 0, s = null;
  const r = (a) => {
    const l = e();
    if (a.style.display === "none" || !a.textContent?.trim() || !l || !Ki(l.node_over)) return n();
    const d = ea(l), p = a.getBoundingClientRect(), m = d && Qi(d, o, p, { width: window.innerWidth, height: window.innerHeight });
    if (!m) return n();
    const S = a.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    t.style.setProperty("--plenio-tip-x", `${Math.round(m.x - S.left)}px`), t.style.setProperty("--plenio-tip-y", `${Math.round(m.y - S.top)}px`), t.classList.add(Ut);
  }, i = () => {
    const a = document.querySelector(".node-tooltip");
    a && (s = a, new MutationObserver(() => r(a)).observe(a, {
      attributes: !0,
      attributeFilter: ["style"],
      childList: !0,
      characterData: !0,
      subtree: !0
    }));
  };
  window.addEventListener("mousemove", (a) => {
    o = a.clientY, s?.isConnected || i();
  });
}
const na = `
body.${Ut} .node-tooltip { left: var(--plenio-tip-x) !important; top: var(--plenio-tip-y) !important;
  transform: none !important; }
`, oa = `
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
` + na;
function sa() {
  if (document.getElementById("plenio-styles")) return;
  const e = document.createElement("style");
  e.id = "plenio-styles", e.textContent = oa, document.head.append(e);
}
function Yt(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function rt(e) {
  return Yt(e).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
function ra(e) {
  const t = e.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((n) => n.trim());
  return t.every((n) => /^:?-{3,}:?$/.test(n)) ? null : t;
}
function ia(e) {
  const t = [];
  let n = !1, o = null, s = null;
  const r = () => {
    n && (t.push("</ul>"), n = !1);
  }, i = () => {
    if (s) {
      const [a, ...l] = s, d = (p, m) => `<tr>${p.map((S) => `<${m}>${rt(S)}</${m}>`).join("")}</tr>`;
      t.push(`<table><thead>${d(a, "th")}</thead><tbody>${l.map((p) => d(p, "td")).join("")}</tbody></table>`), s = null;
    }
  };
  for (const a of e.replace(/\r\n?/g, `
`).split(`
`)) {
    if (o !== null) {
      a.startsWith("```") ? (t.push(`<pre><code>${Yt(o.join(`
`))}</code></pre>`), o = null) : o.push(a);
      continue;
    }
    if (a.trim().startsWith("|")) {
      r();
      const p = ra(a);
      p && (s ??= []).push(p);
      continue;
    }
    if (i(), a.startsWith("```")) {
      r(), o = [];
      continue;
    }
    const l = /^(#{1,4})\s+(.*)$/.exec(a);
    if (l) {
      r();
      const p = Math.min(l[1].length + 2, 6);
      t.push(`<h${p}>${rt(l[2])}</h${p}>`);
      continue;
    }
    const d = /^\s*[-*]\s+(.*)$/.exec(a);
    if (d) {
      n || (t.push("<ul>"), n = !0), t.push(`<li>${rt(d[1])}</li>`);
      continue;
    }
    r(), a.trim() && t.push(`<p>${rt(a)}</p>`);
  }
  return r(), i(), o !== null && t.push(`<pre><code>${Yt(o.join(`
`))}</code></pre>`), t.join("");
}
const ze = "plenio_summary", Qn = "plenio_summary", Kn = 84, aa = 18, la = 55, ca = 16, Zn = 10;
function ua(e) {
  const t = e.split(`
`).filter((n) => n.trim()).reduce((n, o) => n + Math.max(1, Math.ceil(o.length / la)), 0);
  return ca + t * aa;
}
function da(e, t) {
  const n = e.widgets?.find((i) => i.name === Qn);
  if (n?.element) return n.element;
  const o = document.createElement("div");
  o.className = "plenio-summary";
  let s = Zn;
  const r = e.addDOMWidget(Qn, "plenio_summary", o, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => Kn,
    // as tall as its text: a short summary leaves the rest of the node to the other widgets. The margins
    // count too - without them the element stayed 20 px short of its text and hid the last line
    getMaxHeight: () => Math.max(Kn, (o.scrollHeight ? o.scrollHeight + 2 : ua(t.markdown)) + 2 * s)
  });
  return s = r.margin ?? Zn, r.serialize = !1, o;
}
function fa(e) {
  const t = e.computeSize?.();
  t && e.size && e.size[1] < t[1] && e.setSize?.([e.size[0], t[1]]);
}
const eo = /* @__PURE__ */ new WeakMap();
function Xt(e, t) {
  if (!t.markdown) return;
  const n = eo.get(e) ?? { markdown: "" };
  n.markdown = t.markdown, eo.set(e, n);
  const o = da(e, n);
  o.dataset.status = t.status ?? "", o.innerHTML = ia(t.markdown), fa(e), e.setDirtyCanvas?.(!0, !0);
}
function to(e, t, n, o) {
  const s = e.properties?.[ze], r = (s?.markdown ?? "").split(`
`), i = r.findIndex((l) => l.startsWith(t));
  i >= 0 ? r[i] = n : r.push(n);
  const a = { markdown: r.join(`
`).trim(), status: o ?? s?.status ?? "" };
  e.properties = e.properties ?? {}, e.properties[ze] = a, Xt(e, a);
}
function pa(e) {
  e.prototype.onExecuted = ne(e.prototype.onExecuted, function(t) {
    const n = t?.[ze], o = n?.[n.length - 1];
    o?.markdown && (this.properties = this.properties ?? {}, this.properties[ze] = { markdown: o.markdown, status: o.status ?? "" }, Xt(this, o));
  }), e.prototype.onConfigure = ne(e.prototype.onConfigure, function() {
    const t = this.properties?.[ze];
    t?.markdown && Xt(this, t);
  });
}
const ha = "Plenio.Core", ee = ls;
Ti(ee);
const te = oo, It = { app: te, fetcher: ee }, Rt = { app: te, fetcher: ee }, Go = () => te.graph;
function Jt(e) {
  if (e == null) return null;
  const t = String(e);
  return Go()?.getNodeById?.(t.includes(":") ? t : Number(t)) ?? null;
}
const ma = {
  scale: () => te.canvas?.ds?.scale ?? 1,
  toast: (e, t) => te.extensionManager?.toast?.add({ severity: "info", summary: e, detail: t, life: 12e3 })
}, Vo = () => tn(import.meta.url, nn), ga = {
  fetcher: ee,
  async draw(e, t, n, o) {
    const { notationPdf: s, renderLines: r } = await qe(
      () => import("./notationExport-DkCMgjck.mjs").then((a) => a.c),
      Vo,
      "The sheet music is drawn and saved then."
    ), i = r(e, t, n, o);
    try {
      if (!i.lines.length) throw new Error("the score has no music to draw");
      return await s(i.lines, n, t);
    } finally {
      i.dispose();
    }
  }
};
function ya(e, t) {
  const n = Jt(e), o = n?.properties?.plenio_summary;
  return n?.type === "PlenioExportRelease" && o?.markdown?.includes(`- sheet music: ${t}`) ? n : null;
}
function ba(e, t) {
  const n = `- sheet music: ${e.job.file}`, o = ya(t, e.job.file);
  if ("saved" in e) {
    o && to(o, n, `${n} - saved (${Math.max(1, Math.round(e.saved.bytes / 1024))} KB)`), te.extensionManager?.toast?.add({ severity: "success", summary: "Sheet music saved", detail: e.saved.file, life: 6e3 });
    return;
  }
  const { error: s } = e, r = s instanceof V && s.hint ? `${s.message} ${s.hint}` : String(s instanceof Error ? s.message : s);
  if (e.quiet) {
    console.info(`Plenio: ${e.job.file} was saved by another page`);
    return;
  }
  o && to(o, n, `${n} - not saved: ${r}`, "warning"), te.extensionManager?.toast?.add({ severity: "error", summary: "Sheet music not saved", detail: `${e.job.file}: ${r}`, life: 15e3 });
}
const Qt = /* @__PURE__ */ new Map(), no = new pi(ga, (e) => {
  ba(e, Qt.get(e.job.token)), Qt.delete(e.job.token);
});
oo.registerExtension({
  name: ha,
  getCustomWidgets: () => ({ [jo]: Ci }),
  // a song's release record opens its workflow again, its documents kept (continueSong.ts)
  commands: [
    {
      id: $t,
      label: "Continue a Plenio song…",
      icon: "pi pi-history",
      function: () => Zs(It).catch((e) => {
        console.error("Plenio: the Continue a song dialog could not open", e), te.extensionManager?.toast?.add({
          severity: "error",
          summary: "Continue a song",
          detail: String(e instanceof Error ? e.message : e),
          life: 15e3
        });
      })
    },
    { id: Cn, label: "Plenio Player", icon: "pi pi-play-circle", function: () => Ft(Rt) }
  ],
  menuCommands: [
    { path: ["File"], commands: [$t] },
    { path: ["Plenio"], commands: [Cn, $t] }
  ],
  // the Plenio Player, one click away beside Run (player.ts): started as a program of its own when none runs
  actionBarButtons: [
    {
      icon: "pi pi-play-circle",
      label: "Plenio Player",
      tooltip: "Open the Plenio Player: your songs with live lyrics, sheet music and visuals (starts it if needed)",
      onClick: () => {
        Ft(Rt);
      }
    }
  ],
  // a workflow saved before its blocks followed the brief's creativity: they are brought up to date before
  // the frontend configures it (blocks.ts); loading goes on as it was when that fails
  async beforeConfigureGraph(e) {
    try {
      const t = await bs(e, ee);
      for (const n of ws(t)) te.extensionManager?.toast?.add({ ...n, life: 2e4 });
    } catch (t) {
      console.error("Plenio: the blocks of this workflow could not be brought up to date", t);
      const n = t instanceof V && t.hint ? `${t.message} ${t.hint}` : String(t instanceof Error ? t.message : t);
      te.extensionManager?.toast?.add({
        severity: "warn",
        summary: "Plenio blocks not brought up to date - the brief's creativity may not reach their sampling",
        detail: n,
        life: 2e4
      });
    }
  },
  // the sheets' review stops depend on the linked brief's mode: known once the links are in place
  afterConfigureGraph: () => Br(),
  beforeRegisterNodeDef(e, t) {
    if (!t.name.startsWith("Plenio")) return;
    pa(e), Yr(e, ma);
    const n = ir(t.input);
    if (n.size || t.name in sn) {
      const o = e.prototype.configure;
      e.prototype.configure = function(s) {
        const r = $r(t, s), i = tr(r), a = o?.call(this, r);
        return rr(this, i, n), _r(t.name, this.widgets), a;
      };
    }
    if (t.name === "PlenioTranscribeLyrics" && (e.prototype.onExecuted = ne(e.prototype.onExecuted, function(o) {
      for (const s of o?.plenio_asr ?? []) Ar(s);
    })), t.name === "PlenioEQ") {
      const o = /* @__PURE__ */ new WeakMap(), s = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        s?.call(this), o.set(this, yr(this, ee));
      }, e.prototype.onExecuted = ne(e.prototype.onExecuted, function(r) {
        o.get(this)?.showExecuted(r);
      });
    }
    if (t.name === "PlenioExportRelease" && Cr(e, Rt), t.name === hi && xi(e), Cs.has(t.name) && Ps(e, ee), t.name === "PlenioStemMixer") {
      const o = /* @__PURE__ */ new WeakMap(), s = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        s?.call(this), o.set(this, Ji(this));
      }, e.prototype.onExecuted = ne(e.prototype.onExecuted, function(r) {
        o.get(this)?.showExecuted(r);
      });
    }
    t.name === "PlenioSongSheet" && (e.prototype.onExecuted = ne(e.prototype.onExecuted, function(o) {
      const s = o?.plenio_sheet, r = s?.[s.length - 1];
      r && Tn(String(this.id), r);
    }));
  },
  setup() {
    sa(), ta(() => te.canvas), Ks(It), Ir(It), ee.addEventListener("plenio.sheet", (n) => {
      const o = n.detail;
      if (!o?.node_id) return;
      Tn(String(o.node_id), o);
      const s = Jt(o.node_id);
      s && Le(s, wo(o));
    }), ee.addEventListener("execution_start", () => {
      Dr(Go()?.nodes ?? []);
    }), ee.addEventListener("execution_error", (n) => {
      const o = Jt(n.detail?.node_id);
      o && String(o.type).startsWith("Plenio") && Le(o, "error");
    }), ee.addEventListener("executed", (n) => {
      const o = n.detail, s = ci(o?.output), r = o?.display_node ?? o?.node;
      for (const i of s) Qt.set(i.token, r);
      no.take(s);
    });
    const e = () => {
      no.recover();
    };
    let t = !1;
    ee.addEventListener("reconnected", () => {
      Vo().then((n) => {
        n ? t || (t = !0, te.extensionManager?.toast?.add({ severity: "warn", summary: "Plenio was updated", detail: Bt })) : e();
      });
    }), document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible" && e();
    }), window.setTimeout(e, 3e3);
  }
});
export {
  De as $,
  Oo as A,
  Ka as B,
  $o as C,
  No as D,
  Ao as E,
  _e as F,
  Xa as G,
  Va as H,
  ei as I,
  Bn as J,
  Ya as K,
  Ea as L,
  ka as M,
  Lo as N,
  Za as O,
  V as P,
  Ua as Q,
  Mo as R,
  To as S,
  J as T,
  Ia as U,
  Ja as V,
  xa as W,
  Ta as X,
  Pa as Y,
  Na as Z,
  Oa as _,
  Ma as a,
  Ca as a0,
  cs as a1,
  Bs as a2,
  Ds as a3,
  Ga as a4,
  si as a5,
  Qa as a6,
  lo as a7,
  ha as a8,
  _a as b,
  $a as c,
  ko as d,
  Ra as e,
  Zr as f,
  za as g,
  qa as h,
  ao as i,
  Ha as j,
  ja as k,
  La as l,
  Da as m,
  Ba as n,
  pt as o,
  io as p,
  Jr as q,
  ke as r,
  Fa as s,
  Sa as t,
  Wa as u,
  Aa as v,
  Io as w,
  tt as x,
  ti as y,
  ii as z
};
