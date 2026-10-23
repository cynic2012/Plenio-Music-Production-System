import { api as ls } from "../../../../scripts/api.js";
import { app as so } from "../../../../scripts/app.js";
class V extends Error {
  constructor(t, n = null) {
    super(t), this.hint = n;
  }
  hint;
}
async function oe(e, t, n) {
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
function us(e, t) {
  return oe(e, "/plenio/sheet/resolve", t);
}
async function $a(e, t) {
  if (!/^[0-9a-f]{64}$/.test(t)) return null;
  const n = await e.fetchApi(`/plenio/asr/notes/${t}`);
  return n.ok ? (await n.json())?.note ?? null : null;
}
function Kt(e, t, n) {
  return t ? n?.length ? { ...e, lyrics: t, lyric_spans: n } : { ...e, lyrics: t } : e;
}
function Aa(e, t, n, o) {
  return oe(e, "/plenio/score/analyze", Kt({ abc: t }, n, o));
}
function Na(e, t, n, o, s) {
  return oe(e, "/plenio/score/transform", Kt({ abc: t, operation: n }, o, s));
}
function La(e, t) {
  const { lyrics: n, spans: o, ...s } = t;
  return oe(e, "/plenio/score/musicxml/export", Kt(s, n, o));
}
function Ta(e, t) {
  const { lyrics: n, ...o } = t;
  return oe(e, "/plenio/score/musicxml/import", n ? { ...o, lyrics: n } : o);
}
function Ca(e, t) {
  return oe(e, "/plenio/score/midi/export", t);
}
function Pa(e, t) {
  return oe(e, "/plenio/score/midi/import", t);
}
function Oa(e, t) {
  return oe(e, "/plenio/lyrics/analyze", t);
}
function Ia(e, t) {
  const o = `/view?${new URLSearchParams({ filename: t.filename, subfolder: t.subfolder, type: t.type }).toString()}`;
  return e.apiURL ? e.apiURL(o) : `/api${o}`;
}
function un(e, t, n, o = 200) {
  return oe(e, "/plenio/eq/response", { settings: t, sample_rate: n, points: o });
}
function ds(e, t) {
  return oe(e, "/plenio/brief/fields", t);
}
async function fs(e) {
  const t = await e.fetchApi("/plenio/presets/eq");
  if (!t.ok) throw new V(`Request failed (${t.status})`);
  return await t.json();
}
async function qa(e) {
  const t = await e.fetchApi("/plenio/records"), n = await t.json();
  if (!t.ok) {
    const o = n?.error ?? {};
    throw new V(o.message ?? `Request failed (${t.status})`, o.hint ?? null);
  }
  return n?.records ?? [];
}
function ps(e, t) {
  return oe(e, "/plenio/records/continue", t);
}
function hs(e, t) {
  return oe(e, "/plenio/workflow/blocks", { workflow: t });
}
function ne(e, t) {
  return function(...n) {
    e?.apply(this, n), t.apply(this, n);
  };
}
const Rt = "Plenio · ", ms = /* @__PURE__ */ new Set(["YuE2GenerateABC", "YuE2GenerateMusic", "PlenioComposePrompt", "PlenioComposeArrangement"]), gs = "PlenioCreativity";
function ys(e) {
  const t = e?.definitions?.subgraphs;
  return Array.isArray(t) ? t : [];
}
function ws(e) {
  return ys(e).some((t) => {
    if (typeof t?.name != "string" || !t.name.startsWith(Rt)) return !1;
    const n = new Set((t.nodes ?? []).map((o) => o?.type));
    return !n.has(gs) && [...n].some((o) => ms.has(String(o)));
  });
}
async function bs(e, t) {
  if (!e || typeof e != "object" || !ws(e)) return null;
  const n = await hs(t, e);
  if (n.workflow) {
    const o = e;
    for (const s of Object.keys(o)) delete o[s];
    Object.assign(o, n.workflow);
  }
  return n;
}
const zt = (e) => e.startsWith(Rt) ? e.slice(Rt.length) : e, dn = (e) => e.map(zt).join(", ");
function vs(e) {
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
], xs = ["length", "vocals", "melody"], Zt = {
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
}, _s = "custom";
function ro(e) {
  return typeof e == "string" && e.trim().toLowerCase() === _s;
}
function Pe(e, t) {
  const n = Zt[t];
  if (n)
    return (e.widgets ?? []).find((o) => o.name === n);
}
function Ss(e) {
  const t = {};
  for (const n of [...Fe, ...xs]) {
    const o = Pe(e, n);
    o && (t[n] = typeof o.value == "string" ? o.value : String(o.value ?? ""));
  }
  return t;
}
function ks(e) {
  return (e.comfyClass ?? e.type) === "PlenioCoverBrief" ? "cover" : "song";
}
function fn(e, t) {
  const n = [];
  for (const o of t.fills) {
    if (!Fe.includes(o.field)) continue;
    const s = Pe(e, o.field);
    s && !String(s.value ?? "").trim() && o.value && n.push({ field: o.field, value: o.value });
  }
  return n;
}
function pn(e) {
  const t = [];
  for (const n of Fe) {
    const o = Pe(e, n);
    o && String(o.value ?? "").trim() && t.push(o);
  }
  return t;
}
function Dt(e) {
  return e.choices.filter((t) => t.suggested && t.suggested !== t.current).map((t) => ({ field: t.field, value: t.suggested }));
}
function Es(e, t) {
  return !t || !e || e.template === "none" ? null : e.fills.length ? `Template fills: ${e.fills.map((o) => `${o.field} (${Ns(o.value)})`).join(", ")}` : "The template fills nothing: every text field has your value.";
}
function Ms(e) {
  const t = e ? Dt(e) : [];
  return t.length ? `The template suggests: ${t.map((n) => `${n.field} = ${n.value}`).join(", ")}` : null;
}
function $s(e) {
  return e?.notes.length ? e.notes.join("; ") : null;
}
function As(e) {
  const t = e?.mode;
  return t?.description ? `Creative mode ${t.name} (experimental): ${t.description}` : null;
}
function Ns(e, t = 44) {
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
function io(e) {
  const t = [];
  for (const n of Fe) {
    const o = Pe(e, n);
    !o || !ro(o.value) || (o.value = "", o.callback?.(""), t.push(n));
  }
  return t.length && e.setDirtyCanvas?.(!0, !0), t;
}
const mn = "plenio_brief_template", Ts = 400;
function Cs(e, t) {
  let n = null, o = !1, s = null, r;
  const i = document.createElement("div");
  i.className = "plenio-brief-template";
  const a = document.createElement("div");
  a.className = "line";
  const c = document.createElement("div");
  c.className = "hint";
  const d = document.createElement("div");
  d.className = "mode";
  const p = document.createElement("div");
  p.className = "actions", i.append(a, c, d, p);
  const m = (g, y, b) => {
    const N = document.createElement("button");
    return N.textContent = g, N.title = y, N.addEventListener("click", (E) => {
      E.stopPropagation(), b();
    }), p.append(N), N;
  }, S = m("Copy template text", "Fill every empty text field with the template’s text", () => {
    n && (hn(e, fn(e, n).map((g) => ({ field: g.field, value: g.value }))), k());
  }), _ = m("Use template choices", "Set length, vocals and melody to the template’s choices", () => {
    n && (hn(e, Dt(n)), k());
  }), R = m("Reset all to template", "Clear every text field you typed into (they fall back to the template)", () => {
    const g = pn(e);
    g.length && window.confirm(`Clear ${g.length} text field(s)? The template's values apply again.`) && (Ls(e, g), k());
  }), M = m("↻", "Ask again what the template fills", () => {
    A();
  }), k = () => {
    const g = Es(n, o);
    a.textContent = s ?? g ?? "The template fills nothing: every text field has your value.", a.dataset.state = s ? "error" : o && n ? "ok" : "empty";
    const y = Ms(n), b = $s(n);
    c.textContent = [y, b].filter(Boolean).join(" · "), c.style.display = c.textContent ? "" : "none", d.textContent = As(n) ?? "", d.style.display = d.textContent ? "" : "none", p.style.display = o && n && n.template !== "none" ? "" : "none", S.disabled = !n || !fn(e, n).length, _.disabled = !n || !Dt(n).length, R.disabled = !pn(e).length, M.disabled = !1, e.setDirtyCanvas?.(!0, !0);
  }, H = /* @__PURE__ */ new WeakSet(), u = () => {
    for (const g of ["template", "arrangement", ...Object.keys(Zt)]) {
      const y = g === "template" || g === "arrangement" ? e.widgets?.find((b) => b.name === g) : Pe(e, g);
      !y || H.has(y) || (H.add(y), y.callback = ne(y.callback, () => {
        u(), A();
      }));
    }
  }, W = async () => {
    u();
    const g = String(e.widgets?.find((y) => y.name === "template")?.value ?? "none");
    try {
      const y = String(e.widgets?.find((b) => b.name === "arrangement")?.value ?? "");
      n = await ds(t, { fields: Ss(e), template: g, kind: ks(e), arrangement: y }), s = null;
    } catch (y) {
      n = null, s = `The template fields could not be read: ${y instanceof Error ? y.message : String(y)}`;
    }
    o = !0, k();
  };
  function A() {
    clearTimeout(r), r = setTimeout(() => {
      W();
    }, Ts);
  }
  u();
  const w = e.addDOMWidget(mn, mn, i, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 64,
    getMaxHeight: () => 128
  });
  return w.serialize = !1, io(e), k(), A(), {
    widget: w,
    refresh: A,
    answer: () => n,
    dispose: () => clearTimeout(r)
  };
}
const Ps = /* @__PURE__ */ new Set(["PlenioSongBrief", "PlenioCoverBrief"]);
function Os(e, t) {
  const n = /* @__PURE__ */ new WeakMap(), o = e.prototype, s = o.onNodeCreated;
  o.onNodeCreated = function() {
    s?.call(this), n.set(this, Cs(this, t));
  };
  const r = o.onConfigure;
  o.onConfigure = function(i) {
    r?.call(this, i), io(this), n.get(this)?.refresh();
  };
}
const gn = "plenio.record/1", Is = 2, qs = "PLNO", Qe = new TextEncoder().encode(`${qs}plenio.project/1\0`), yn = 32 * 2 ** 20;
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
async function ao(e) {
  if (!_t(await xt(e, 0, 4), new TextEncoder().encode("fLaC"))) throw new fe("it is not a FLAC file");
  let t = 4;
  for (; ; ) {
    const n = await xt(e, t, 4);
    if (n.length < 4) throw new fe("the file ends inside its metadata");
    const o = n[1] << 16 | n[2] << 8 | n[3];
    if ((n[0] & 127) === Is && o >= 4) {
      const s = await xt(e, t + 4, Math.min(o, Qe.length));
      if (_t(s, Qe.subarray(0, 4))) {
        if (!_t(s, Qe)) throw new fe("it holds a Plenio project of an unknown layout (made by a newer Plenio)");
        let r;
        try {
          r = await Rs(e.slice(t + 4 + Qe.length, t + 4 + o));
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
function co(e) {
  return /\.flac$/i.test(e.name ?? "") || e.type === "audio/flac" || e.type === "audio/x-flac";
}
const en = "plenio.sheet_state/1", We = ["title", "style", "lyrics", "score", "artwork_prompt"];
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
  for (const o of We) {
    const s = e.docs[o];
    s && (t[o] = s);
  }
  const n = { schema: en, docs: t };
  return e.review?.approved_fingerprint && (n.review = { approved_fingerprint: e.review.approved_fingerprint }), JSON.stringify(n);
}
function St(e, t) {
  return e.docs[t]?.state ?? "auto";
}
function zs(e) {
  if (e === null) return "Song Sheet state is unreadable - open the editor to repair it.";
  const t = We.filter((o) => St(e, o) !== "auto").map(
    (o) => o === "lyrics" && St(e, o) === "manual" ? "lyrics: yours (manual)" : `${o.replace("_", " ")} ${St(e, o)}`
  ), n = e.review?.approved_fingerprint ? " · approved" : "";
  return (t.length ? t.join(" · ") : "all documents automatic") + n;
}
function Ra(e) {
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
const za = "Creative modes are experimental: the writer’s plan can surprise - listen, change the score here, or run again with another arrangement seed; arrangement off keeps the music model’s own plan.";
function Da(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) t.set(n, (t.get(n) ?? 0) + 1);
  return [...t].map(([n, o]) => o > 1 ? `${n} (${o} times)` : n);
}
function Ba(e) {
  const t = e.kind === "cover" ? "song flow closeness" : "genre closeness";
  return `${e.mode} (${t} ${e.closeness})`;
}
function wn(e) {
  const t = Math.max(0, e), n = Math.floor(t / 60), o = Math.round(t - n * 60);
  return `${n}:${String(o).padStart(2, "0")}`;
}
function Ha(e) {
  return e?.bars?.length ? (e.sections ?? []).map(([t, n, o]) => {
    const s = e.bars[Math.max(0, n - 1)], r = e.bars[Math.min(e.bars.length - 1, n - 1 + o - 1)];
    return { label: t, bars: o, start: wn(s?.[0] ?? 0), end: wn(r?.[1] ?? e.duration_s) };
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
function Ds(e, t, n) {
  const o = e.docs[n];
  return o ? o.text : t?.docs[n]?.upstream ?? "";
}
function ja(e, t, n) {
  return n.map((o) => ({ kind: o, text: Ds(e, t, o), intent: "keep" }));
}
function lo(e, t, n) {
  const o = { ...e.docs };
  for (const r of n) {
    const i = e.docs[r.kind], a = t?.docs[r.kind], c = _e(r.text);
    if (r.intent === "auto")
      delete o[r.kind];
    else if (r.intent === "manual")
      o[r.kind] = { state: "manual", text: c };
    else if (r.intent === "rebase")
      a?.upstream_sha256 ? o[r.kind] = { state: "edited", text: c, base_sha256: a.upstream_sha256 } : o[r.kind] = { state: "manual", text: c };
    else if (i)
      _e(i.text) !== c && (o[r.kind] = { ...i, text: c });
    else {
      const d = _e(a?.upstream ?? "");
      if (c === d) continue;
      o[r.kind] = a?.upstream_sha256 ? { state: "edited", text: c, base_sha256: a.upstream_sha256 } : { state: "manual", text: c };
    }
  }
  const s = { ...mt(), docs: o };
  return e.review?.approved_fingerprint && (s.review = { approved_fingerprint: e.review.approved_fingerprint }), s;
}
function Bs(e, t) {
  return t ? { ...e, review: { approved_fingerprint: t } } : { ...e, review: void 0 };
}
function uo(e, t) {
  return We.filter((n) => e.includes(n) || t.docs[n]?.state === "manual");
}
function Hs(e) {
  const t = {};
  for (const n of e?.owned ?? []) t[n] = e?.docs[n]?.upstream ?? null;
  return t;
}
const js = "PlenioSongSheet";
function fo(e) {
  return e.nodes ?? e._nodes ?? [];
}
function Fs(e, t) {
  return e.getNodeById?.(t) ?? e.getNodeById?.(Number(t)) ?? fo(e).find((o) => String(o.id) === t) ?? null;
}
function kt(e, t) {
  let n = e, o = null;
  for (const s of t.split(":")) {
    if (!n || (o = Fs(n, s), !o)) return null;
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
function Gs(e, t) {
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
function Vs(e, t) {
  let n = 0;
  for (const o of fo(e)) {
    if (o.type !== js) continue;
    const s = o.widgets?.find((m) => m.name === "sheet_state");
    if (!s) continue;
    const r = Se(s.value) ?? { schema: "plenio.sheet_state/1", docs: {} }, i = (o.inputs ?? []).filter((m) => m.link != null).map((m) => m.name), a = uo(i, r), c = (a.length ? a : [...We]).filter((m) => !!t[m]);
    if (!c.length) continue;
    const d = { ...r.docs };
    for (const m of c) d[m] = { state: "manual", text: t[m] };
    const p = De({ ...r, docs: d, review: void 0 });
    s.value = p, s.callback?.(p), n++;
  }
  return n;
}
function Us(e, t) {
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
function Ys(e) {
  const t = /\/chunks\/(main-[^/?#]+\.mjs)(?:[?#].*)?$/.exec(e);
  return t ? t[1] : null;
}
function Xs(e) {
  return /chunks\/(main-[^"'?#\s]+\.mjs)/.exec(e)?.[1] ?? null;
}
async function tn(e, t) {
  const n = Ys(e);
  if (!n) return !1;
  try {
    const o = await t(new URL("../plenio.js", e).href), s = o ? Xs(o) : null;
    return s !== null && s !== n;
  } catch {
    return !1;
  }
}
async function nn(e) {
  const t = await fetch(e, { cache: "no-store" });
  return t.ok ? await t.text() : null;
}
async function Re(e, t, n = "") {
  try {
    return await e();
  } catch (o) {
    throw await t() ? new Error(n ? `${Bt} ${n}` : Bt) : o;
  }
}
const Mt = "Plenio.ContinueSong", Qs = "plenio.record/1";
function Ht(e, t, n, o, s = 2e4) {
  e.app.extensionManager?.toast?.add({ severity: t, summary: n, detail: o, life: s });
}
async function dt(e, t) {
  const n = await ps(e.fetcher, t);
  if (n.workflow) {
    if (!e.app.loadGraphData) throw new Error("This ComfyUI frontend cannot load a workflow for Plenio.");
    await e.app.loadGraphData(n.workflow, !0, !0, Us("path" in t ? t.path : t.name, n.title));
    const r = e.app.graph;
    if (!r) throw new Error("The workflow did not load.");
    const i = Gs(r, n);
    r.setDirtyCanvas?.(!0, !0), i.missing.length && console.warn("Plenio: settings of the song without a field in this workflow", i.missing), Ht(e, "success", "Song opened", Et(n, i));
    return;
  }
  const o = e.app.graph, s = o ? Vs(o, n.documents) : 0;
  if (!s)
    throw new V(
      Et(n, null),
      "Open a workflow with a Song Sheet (a Plenio template) and continue again: the song's texts and score then go into its Song Sheets."
    );
  Ht(e, "success", "Song texts taken", `${Et(n, null)} Its texts and score went into this workflow's Song Sheets (${s}, manual).`);
}
async function Js(e) {
  if (co(e)) return ao(e);
  if (!/\.json$/i.test(e.name ?? "")) return null;
  try {
    const t = JSON.parse(await e.text());
    return t?.schema === Qs ? t : null;
  } catch {
    return null;
  }
}
function bn(e) {
  const t = [...e.dataTransfer?.files ?? []];
  return t.length === 1 && /\.plenio\.json$/i.test(t[0].name) ? t[0] : null;
}
function Ks(e, t) {
  const n = [...e.dataTransfer?.files ?? []];
  if (n.length !== 1 || !co(n[0]) || e.shiftKey) return null;
  const o = t.canvas, s = t.graph;
  if (!o?.canvas || e.target !== o.canvas || !o.convertEventToCanvasOffset || !s?.getNodeOnPos) return null;
  const [r, i] = o.convertEventToCanvasOffset(e);
  return s.getNodeOnPos(r, i) ? null : n[0];
}
function Zs(e, t = window) {
  const n = (o) => {
    const s = bn(o) ? null : Ks(o, e.app), r = s ?? bn(o);
    r && (o.preventDefault(), o.stopImmediatePropagation(), (async () => {
      if (s) {
        const a = await ao(s);
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
async function er(e) {
  const t = () => tn(import.meta.url, nn), { openContinueDialog: n } = await Re(() => import("./openContinue-C2c8H-XI.mjs"), t);
  n(e.fetcher, (o) => dt(e, o));
}
const tr = "COMFY_DYNAMICCOMBO_V3";
function nr(e) {
  const t = e?.widgets_values_named;
  return t && typeof t == "object" && !Array.isArray(t) ? { ...t } : Array.isArray(e?.widgets_values) ? [...e.widgets_values] : void 0;
}
function or(e) {
  return (e.widgets ?? []).filter((t) => t.serialize !== !1);
}
function sr(e, t) {
  const n = or(e);
  return Array.isArray(t) ? n.length === t.length && n.every((o, s) => o.value === t[s]) : n.every((o) => !(o.name in t) || o.value === t[o.name]);
}
function rr(e, t) {
  return (e.options?.values ?? []).includes(t);
}
function ir(e, t, n) {
  if (!t || !e.widgets || sr(e, t)) return !1;
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
    if (n.has(r.name) && !rr(r, i)) return !0;
    r.value !== i && (r.value = i);
  }
  return !0;
}
function ar(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of Object.values(e ?? {}))
    for (const [o, s] of Object.entries(n ?? {}))
      Array.isArray(s) && s[0] === tr && t.add(o);
  return t;
}
const po = "plenio.eq/1", it = 8, we = 20, cr = 2e4, Ce = 12, ho = 15, Ae = ["peak", "low_shelf", "high_shelf"], mo = ["peak", "notch", "highpass", "lowpass"], vn = [0.2, 10], xn = [0.25, 1];
function Me() {
  return { schema: po, preamp_db: 0, bands: [] };
}
function lr(e) {
  if (typeof e != "string" || !e.trim()) return Me();
  try {
    const t = JSON.parse(e);
    return typeof t != "object" || t === null || !Array.isArray(t.bands) ? null : {
      schema: po,
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
const Z = (e, t) => Number(e.toFixed(t));
function G(e, t, n) {
  return Math.min(n, Math.max(t, e));
}
function go(e) {
  return e.db ?? ho;
}
const _n = [6, 12, 18], ur = { 6: 8, 12: 14, 18: 20 };
function dr(e, t) {
  return { ...e, db: ur[t] ?? ho };
}
function xe(e, t) {
  return Math.log(G(t, we, e.maxHz) / we) / Math.log(e.maxHz / we) * e.width;
}
function Sn(e, t) {
  return we * (e.maxHz / we) ** G(t / e.width, 0, 1);
}
function ye(e, t) {
  const n = go(e);
  return (1 - (G(t, -n, n) + n) / (2 * n)) * e.height;
}
function kn(e, t) {
  const n = go(e);
  return (1 - G(t / e.height, 0, 1)) * 2 * n - n;
}
function En(e, t, n) {
  return n ? e + (t - e) * 0.2 : t;
}
function Mn(e, t, n) {
  return t.map((o, s) => `${s ? "L" : "M"}${xe(e, o).toFixed(1)},${ye(e, n[s] ?? 0).toFixed(1)}`).join(" ");
}
function on(e) {
  return Math.min(cr, 0.45 * e);
}
function fr(e) {
  const t = new Set(e.bands.map((o) => o.id));
  let n = e.bands.length + 1;
  for (; t.has(`band-${n}`); ) n++;
  return `band-${n}`;
}
function pr(e, t, n = 0, o = 48e3) {
  if (e.bands.length >= it) return null;
  const s = {
    id: fr(e),
    enabled: !0,
    type: "peak",
    frequency_hz: Z(G(t, we, on(o)), 1),
    gain_db: Z(G(n, -Ce, Ce), 1),
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
        frequency_hz: Z(G(n, we, on(s)), 1),
        gain_db: Ae.includes(r.type) ? Z(G(o, -Ce, Ce), 1) : r.gain_db
      }
    )
  };
}
function $t(e, t, n) {
  return {
    ...e,
    bands: e.bands.map((o) => o.id === t ? { ...o, q: Z(G(o.q * n, 0.2, 10), 3) } : o)
  };
}
function At(e, t) {
  return { ...e, bands: e.bands.filter((n) => n.id !== t) };
}
function Ie(e) {
  const t = e.frequency_hz >= 1e3 ? `${Z(e.frequency_hz / 1e3, 2)} kHz` : `${Math.round(e.frequency_hz)} Hz`, n = Ae.includes(e.type) ? ` ${e.gain_db > 0 ? "+" : ""}${Z(e.gain_db, 1)} dB` : "";
  return `${e.type.replace("_", " ")} ${t}${n}, Q ${Z(e.q, 2)}`;
}
function hr(e, t) {
  const n = yo[e.type] ?? e.type, o = e.frequency_hz >= 1e3 ? `${(e.frequency_hz / 1e3).toFixed(2)} kHz` : `${Math.round(e.frequency_hz)} Hz`, s = Ae.includes(e.type) ? ` ${e.gain_db > 0 ? "+" : ""}${e.gain_db.toFixed(1)} dB` : "", r = mo.includes(e.type) ? ` Q ${Z(e.q, 2)}` : "";
  return `● ${t + 1} ${n} ${o}${s}${r}${e.enabled ? "" : " (off)"}`;
}
const yo = {
  peak: "Bell",
  low_shelf: "Low shelf",
  high_shelf: "High shelf",
  highpass: "Low cut",
  lowpass: "High cut",
  notch: "Notch"
};
function Nt(e, { kilo: t = !1 } = {}) {
  let n = e.trim().replace(",", ".").replace(/\s*(hz|db)$/i, ""), o = 1;
  if (t && /k$/i.test(n) && (o = 1e3, n = n.slice(0, -1).trim()), !/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(n)) return null;
  const s = Number(n) * o;
  return Number.isFinite(s) ? s : null;
}
function Je(e, t) {
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
        frequency_hz: Z(G(Je(r.frequency_hz, s.frequency_hz), we, on(o)), 1),
        gain_db: Z(G(Je(r.gain_db, s.gain_db), -Ce, Ce), 1),
        q: Z(G(Je(r.q, s.q), vn[0], vn[1]), 3),
        slope: Z(G(Je(r.slope, s.slope), xn[0], xn[1]), 2),
        enabled: r.enabled !== !1
      };
    })
  };
}
function $n(e, t) {
  return at(e, t, { gain_db: 0 });
}
function An(e, t, n, { heightFraction: o = 0.7 } = {}) {
  if (!t.length || t.length !== n.length) return "";
  const s = n.filter((m) => Number.isFinite(m));
  if (!s.length) return "";
  const r = Math.max(...s), i = Math.min(...s), a = Math.max(r - i, 1e-6), c = e.height - 4, d = c - Math.max(12, e.height * G(o, 0.1, 0.95));
  return `M${t.map((m, S) => {
    const _ = n[S], R = Number.isFinite(_) ? (_ - i) / a : 0;
    return `${xe(e, m).toFixed(1)},${(c - R * (c - d)).toFixed(1)}`;
  }).join(" L")} L${e.width.toFixed(1)},${c.toFixed(1)} L0,${c.toFixed(1)} Z`;
}
class mr {
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
const gr = "http://www.w3.org/2000/svg", Nn = "plenio_eq_panel", Ke = "mode.bands", he = { capture: !0 }, se = { width: 560, height: 260 }, Ze = ["#4aa3ff", "#f0a35e", "#6fbf73", "#d873c8", "#e0c65a", "#5ac8c8", "#b28df0", "#e08a8a"];
let Lt = null;
function ue(e, t) {
  const n = document.createElementNS(gr, e);
  for (const [o, s] of Object.entries(t)) n.setAttribute(o, String(s));
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
function de(e, t) {
  return e.widgets?.find((n) => n.name === t);
}
function yr(e, t) {
  return e.bands.length === t.bands.length && e.bands.every((n, o) => {
    const s = t.bands[o];
    return s !== void 0 && n.type === s.type && n.enabled === s.enabled && Math.abs(n.frequency_hz - s.frequency_hz) < 0.5 && Math.abs(n.gain_db - s.gain_db) < 0.05 && Math.abs(n.q - s.q) < 0.01;
  });
}
function wr(e, t) {
  const n = F("div", "plenio-eq"), o = F("div", "plenio-eq-tools"), s = F("select");
  s.setAttribute("aria-label", "EQ preset"), s.title = "EQ preset: sets every band at once (the list comes from resources/presets/eq.json)";
  const r = F("select");
  r.setAttribute("aria-label", "Gain range"), r.title = "Gain range: the dB axis of the curve and how far a drag may go";
  for (const l of _n) r.append(new Option(`±${l} dB`, String(l)));
  const i = ve("", "↶", "Undo the last band change"), a = ve("", "↷", "Redo the last band change"), c = ve("", "reset", "Remove every band"), d = ve("", "compare", "Show the curve without the EQ (bypass)"), p = ve("", "bands as text", "Show or hide the plenio.eq/1 JSON widget"), m = F("span", "plenio-eq-info");
  m.setAttribute("aria-live", "polite"), m.title = "What the panel is showing right now (the selected band, a note, or a hint)", o.append(s, r, i, a, c, d, p, m);
  const S = F("div", "plenio-eq-mode"), _ = ue("svg", {
    viewBox: `0 0 ${se.width} ${se.height}`,
    class: "plenio-eq-plot",
    role: "img",
    preserveAspectRatio: "none"
  });
  _.setAttribute("aria-label", "EQ response curve"), _.setAttribute("tabindex", "0"), _.setAttribute("title", "Drag a handle to move a band (Shift = fine), wheel = Q, double-click = new band, Delete = remove");
  const R = F("div", "plenio-eq-strip"), M = F("div", "plenio-eq-editor"), k = F("div", "plenio-eq-fields");
  M.append(k), n.append(o, S, _, R, M);
  const H = e.addDOMWidget(Nn, Nn, n, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 420,
    getMaxHeight: () => 620
  });
  H.serialize = !1;
  let u = { sampleRate: 48e3, frequencies: [], response: [], settings: Me(), readonly: !0, note: "" }, W = null, A = null, w = !1, g = 12, y = null, b = [], N = 0, E, U, z = null, q = !1;
  const D = /* @__PURE__ */ new Map();
  let j = null;
  const L = new mr(Me()), pe = () => de(e, Ke), ee = () => g, T = () => dr({ ...se, maxHz: Math.min(2e4, u.sampleRate / 2) }, ee());
  function P(l, { record: h = !0 } = {}) {
    const f = pe();
    if (!f) return;
    const v = $e(l);
    f.value = v, f.callback?.(v), h && L.push(l), u = { ...u, settings: l }, Y(), ae(0);
  }
  async function ae(l = 120) {
    clearTimeout(E), E = setTimeout(async () => {
      const h = String(de(e, "mode")?.value ?? "flat");
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
        } : u = { ...u, readonly: !0 }, Y();
        return;
      }
      const f = lr(pe()?.value);
      if (!f) {
        u = { ...u, readonly: !0, note: "the bands are not valid JSON" }, Y();
        return;
      }
      $e(f) !== $e(L.current) && L.reset(f);
      const v = ++N;
      try {
        const $ = await un(t, f, u.sampleRate);
        if (v !== N) return;
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
      Y();
    }, l);
  }
  const Ve = (l) => ({
    ...l.settings,
    bands: l.settings.bands.slice(0, it)
  });
  function ce() {
    if (!y) return "";
    const l = b.find((h) => h.name === y);
    return l && yr(Ve(l), u.settings) ? y : "";
  }
  function Y() {
    _.replaceChildren(), D.clear(), j = null;
    const l = T();
    for (const f of [-l.db, -l.db / 2, 0, l.db / 2, l.db])
      _.append(
        ue("line", { x1: 0, x2: l.width, y1: ye(l, f), y2: ye(l, f), class: f ? "grid" : "grid zero" })
      );
    for (const f of [100, 1e3, 1e4])
      _.append(ue("line", { x1: xe(l, f), x2: xe(l, f), y1: 0, y2: l.height, class: "grid" }));
    u.beforeDb?.length === u.frequencies.length && _.append(ue("path", { d: An(l, u.frequencies, u.beforeDb), class: "spectrum before" })), u.afterDb?.length === u.frequencies.length && _.append(ue("path", { d: An(l, u.frequencies, u.afterDb), class: "spectrum after" })), w ? _.append(ue("line", { x1: 0, x2: l.width, y1: ye(l, 0), y2: ye(l, 0), class: "curve flat" })) : u.frequencies.length && (j = ue("path", { d: Mn(l, u.frequencies, u.response), class: "curve" }), _.append(j)), !u.readonly && !w && u.settings.bands.forEach((f, v) => {
      const $ = Ze[v % Ze.length], O = Ae.includes(f.type) ? f.gain_db : 0, x = ue("circle", {
        cx: xe(l, f.frequency_hz),
        cy: ye(l, O),
        r: f.id === A ? 9 : 7,
        class: f.id === A ? "handle selected" : "handle",
        style: `stroke: ${$}`,
        tabindex: 0,
        "data-band": f.id
      });
      x.setAttribute("aria-label", `Band ${v + 1}: ${Ie(f)}`), f.enabled || x.classList.add("disabled"), x.append(ue("title", {})), x.lastChild.textContent = `Band ${v + 1}: ${Ie(f)}`, x.addEventListener("pointerdown", (B) => es(B, f.id)), x.addEventListener("dblclick", (B) => {
        B.stopPropagation(), P($n(u.settings, f.id));
      }), x.addEventListener("focus", () => Jo(f.id)), x.addEventListener("keydown", (B) => rn(B, f.id)), x.addEventListener("wheel", (B) => {
        B.preventDefault();
        const be = B.deltaY < 0 ? 1.15 : 1 / 1.15;
        P($t(u.settings, f.id, be));
      }), x.addEventListener("contextmenu", (B) => {
        B.preventDefault(), P(At(u.settings, f.id));
      }), _.append(x), D.set(f.id, x);
    }), Yo(), Xo(), Qo();
    const h = u.settings.bands.find((f) => f.id === A);
    m.textContent = u.note || (w ? "compare: the curve is off (the node still applies it)" : h ? Ie(h) : u.readonly ? `${u.settings.bands.length} band(s)` : `drag a handle, Shift = fine, wheel = Q, double-click = add · ${u.settings.bands.length}/${it}`), s.disabled = u.readonly, i.disabled = !L.canUndo, a.disabled = !L.canRedo, c.disabled = u.readonly || !u.settings.bands.length, q && (q = !1, A && D.get(A)?.focus({ preventScroll: !0 })), r.value = String(g), s.value = ce(), d.classList.toggle("active", w), p.classList.toggle("active", yt()), e.setDirtyCanvas?.(!0, !0);
  }
  function Yo() {
    if (R.replaceChildren(), u.readonly && !u.settings.bands.length) {
      R.append(F("span", "plenio-eq-hint", u.note || "no bands"));
      return;
    }
    u.settings.bands.forEach((l, h) => {
      const f = F("button", "plenio-eq-chip", hr(l, h));
      f.style.borderLeftColor = Ze[h % Ze.length], f.classList.toggle("selected", l.id === A), f.classList.toggle("disabled", !l.enabled), f.setAttribute("aria-label", `Edit band ${h + 1}`), f.title = `Band ${h + 1}: ${Ie(l)} - click to open its fields`, f.addEventListener("click", (v) => {
        v.stopPropagation(), A = A === l.id ? null : l.id, Y();
      }), R.append(f);
    });
  }
  function Xo() {
    k.replaceChildren();
    const l = u.settings.bands.find((x) => x.id === A);
    if (!l || u.readonly) {
      M.style.display = "none";
      return;
    }
    M.style.display = "";
    const h = F("span", "name", `Band ${u.settings.bands.indexOf(l) + 1}`);
    h.title = "The selected band";
    const f = F("select");
    f.setAttribute("aria-label", "Band type"), f.title = "Band type: bell and shelves change the gain, the cuts and the notch do not";
    for (const [x, B] of Object.entries(yo)) f.append(new Option(B, x));
    f.value = l.type, f.addEventListener("change", () => P(at(u.settings, l.id, { type: f.value })));
    const v = F("input");
    v.type = "checkbox", v.checked = l.enabled, v.setAttribute("aria-label", "Band enabled"), v.title = "Band enabled: off keeps the band in the list but out of the response", v.addEventListener("change", () => P(at(u.settings, l.id, { enabled: v.checked })));
    const $ = [
      [
        "Hz",
        `${l.frequency_hz}`,
        70,
        (x) => bt(l.id, "frequency_hz", Nt(x, { kilo: !0 }))
      ],
      ["dB", `${l.gain_db}`, 60, (x) => bt(l.id, "gain_db", Nt(x))],
      ["Q", `${l.q}`, 60, (x) => bt(l.id, "q", Nt(x))]
    ];
    k.append(h, f, v);
    for (const [x, B, be, Ue] of $) {
      const X = F("input", "number");
      X.value = B, X.style.width = `${be}px`, X.setAttribute("aria-label", `Band ${x}`), X.title = x === "Hz" ? "Frequency of the band in Hz (the centre of a bell, the corner of a shelf)" : x === "dB" ? "Gain in dB (bell and shelves; the cuts and the notch have none)" : "Q: how narrow the band is - higher Q, smaller range";
      const Ye = () => {
        Ue(X.value) || (X.value = B);
      };
      X.addEventListener("keydown", (le) => {
        le.key === "Enter" && Ye();
      }), X.addEventListener("blur", Ye), (x === "dB" && !Ae.includes(l.type) || x === "Q" && !mo.includes(l.type)) && (X.disabled = !0), k.append(X);
    }
    const O = ve("", "remove", "Remove this band");
    O.addEventListener("click", (x) => {
      x.stopPropagation(), A = null, P(At(u.settings, l.id));
    }), k.append(O);
  }
  function Qo() {
    S.replaceChildren();
    const l = String(de(e, "mode")?.value ?? "flat");
    if (l === "manual" || l === "flat") {
      S.style.display = "none";
      return;
    }
    S.style.display = "", S.append(
      F(
        "span",
        "plenio-eq-hint",
        W === l ? `applied proposal (${u.settings.bands.length} band(s), ${l})` : `${l}: no proposal yet - it is computed on the next run`
      )
    );
    const h = ve("", "Edit these bands", "Copy the proposal into manual bands and edit it");
    h.disabled = !u.settings.bands.length, h.addEventListener("click", (f) => {
      f.stopPropagation();
      const v = de(e, "mode");
      if (!v) return;
      v.value = "manual", v.callback?.("manual");
      const $ = pe();
      if ($) {
        const O = $e(u.settings);
        $.value = O, $.callback?.(O);
      }
      L.reset(u.settings), vt(), ae(0);
    }), S.append(h);
  }
  function Jo(l) {
    A = l, q = !0, Y();
  }
  function Ko(l) {
    A = l, gt();
  }
  function gt() {
    const l = T();
    u.settings.bands.forEach((f) => {
      const v = D.get(f.id);
      if (!v) return;
      const $ = Ae.includes(f.type) ? f.gain_db : 0;
      v.setAttribute("cx", String(xe(l, f.frequency_hz))), v.setAttribute("cy", String(ye(l, $))), v.classList.toggle("selected", f.id === A), v.setAttribute("r", f.id === A ? "9" : "7");
    }), j && u.frequencies.length && j.setAttribute("d", Mn(l, u.frequencies, u.response));
    const h = u.settings.bands.find((f) => f.id === A);
    h && (m.textContent = Ie(h));
  }
  function Zo() {
    clearTimeout(U), U = setTimeout(async () => {
      const l = u.settings, h = ++N;
      try {
        const f = await un(t, l, u.sampleRate);
        if (h !== N) return;
        u = { ...u, frequencies: f.frequency_hz, response: f.response_db }, gt();
      } catch {
      }
    }, 60);
  }
  function yt() {
    return !de(e, Ke)?.plenioHidden;
  }
  function wt(l) {
    const h = de(e, Ke);
    h && (h.plenioHidden = !l, l ? delete h.computeSize : h.computeSize = () => [0, -4], e.setDirtyCanvas?.(!0, !0));
  }
  function bt(l, h, f) {
    if (f === null) return !1;
    const v = u.settings.bands.find(($) => $.id === l);
    return v && v[h] === f || P(at(u.settings, l, { [h]: f })), !0;
  }
  function es(l, h) {
    l.preventDefault(), l.stopPropagation(), A !== h && Ko(h);
    const f = u.settings.bands.find((te) => te.id === h);
    if (!f) return;
    z = { hz: f.frequency_hz, db: f.gain_db };
    let v = !1, $ = !1;
    const O = l.currentTarget;
    try {
      O?.setPointerCapture?.(l.pointerId);
    } catch {
    }
    const x = _.getBoundingClientRect(), B = x.width ? x.left : 0, be = x.height ? x.top : 0, Ue = x.width || se.width, X = x.height || se.height, Ye = (te, Xe) => te >= B - 1 && te <= B + Ue + 1 && Xe >= be - 1 && Xe <= be + X + 1;
    function le() {
      if (!$) {
        $ = !0;
        try {
          O?.releasePointerCapture?.(l.pointerId);
        } catch {
        }
        window.removeEventListener("pointermove", ln, he), window.removeEventListener("pointerup", le, he), window.removeEventListener("pointercancel", le, he), window.removeEventListener("blur", le, he), z = null, v && P(u.settings);
      }
    }
    const ln = (te) => {
      if ($ || !z) return;
      if (te.buttons === 0) {
        le();
        return;
      }
      if (!Ye(te.clientX, te.clientY)) return;
      const Xe = se.width / Ue, ns = se.height / X, os = (te.clientX - B) * Xe, ss = (te.clientY - be) * ns, rs = xe(T(), z.hz), is = ye(T(), z.db), as = Sn(T(), En(rs, os, te.shiftKey)), cs = kn(T(), En(is, ss, te.shiftKey));
      u = { ...u, settings: Oe(u.settings, h, as, cs, u.sampleRate) }, v = !0, gt(), Zo();
    };
    window.addEventListener("pointermove", ln, he), window.addEventListener("pointerup", le, he), window.addEventListener("pointercancel", le, he), window.addEventListener("blur", le, he);
  }
  function rn(l, h) {
    const f = u.settings.bands.find((x) => x.id === h);
    if (!f) return;
    const v = l.shiftKey ? 0.1 : 0.5, $ = l.shiftKey ? 1.01 : 1.06;
    let O = null;
    l.key === "ArrowUp" ? O = Oe(u.settings, h, f.frequency_hz, f.gain_db + v, u.sampleRate) : l.key === "ArrowDown" ? O = Oe(u.settings, h, f.frequency_hz, f.gain_db - v, u.sampleRate) : l.key === "ArrowRight" ? O = Oe(u.settings, h, f.frequency_hz * $, f.gain_db, u.sampleRate) : l.key === "ArrowLeft" ? O = Oe(u.settings, h, f.frequency_hz / $, f.gain_db, u.sampleRate) : l.key === "+" ? O = $t(u.settings, h, 1.15) : l.key === "-" ? O = $t(u.settings, h, 1 / 1.15) : l.key === "0" ? O = $n(u.settings, h) : (l.key === "Delete" || l.key === "Backspace") && (O = At(u.settings, h)), O && (l.preventDefault(), P(O));
  }
  _.addEventListener("keydown", (l) => {
    A && l.target === _ && rn(l, A);
  }), _.addEventListener("dblclick", (l) => {
    if (u.readonly || w) return;
    const h = _.getBoundingClientRect(), f = se.width / (h.width || se.width), v = se.height / (h.height || se.height), $ = (l.clientX - h.left) * f, O = (l.clientY - h.top) * v, x = pr(u.settings, Sn(T(), $), kn(T(), O), u.sampleRate);
    x ? (A = x.bands[x.bands.length - 1].id, P(x)) : (u = { ...u, note: `the EQ has at most ${it} bands` }, Y());
  }), s.append(new Option("preset…", "")), Lt ??= fs(t).then((l) => l.manual).catch(() => []), Lt.then((l) => {
    b = l;
    for (const h of l) s.append(new Option(h.name, h.name));
    s.value = ce();
  }), s.addEventListener("change", async () => {
    const l = (await Lt)?.find((h) => h.name === s.value);
    l && (y = l.name, P(Ve(l)));
  }), r.addEventListener("change", () => {
    const l = Number(r.value);
    g = _n.find((h) => h === l) ?? 12, Y();
  }), i.addEventListener("click", () => {
    const l = L.undo();
    l && P(l, { record: !1 });
  }), a.addEventListener("click", () => {
    const l = L.redo();
    l && P(l, { record: !1 });
  }), c.addEventListener("click", () => {
    A = null, P(Me());
  }), d.addEventListener("click", () => {
    w = !w, Y();
  }), p.addEventListener("click", () => {
    wt(!yt()), Y();
  });
  function vt() {
    for (const l of ["mode", Ke]) {
      const h = de(e, l);
      if (!h || h.plenioWatched) continue;
      h.plenioWatched = !0;
      const f = h.callback;
      h.callback = (v) => {
        f?.(v), setTimeout(() => {
          yt() || wt(!1), ae();
        });
      };
    }
  }
  vt(), wt(!1), ae(0);
  let an = null, cn = null;
  const ts = setInterval(() => {
    if (!n.isConnected) {
      clearInterval(ts);
      return;
    }
    const l = String(de(e, "mode")?.value ?? "flat"), h = String(pe()?.value ?? "");
    l === an && h === cn || (an = l, cn = h, vt(), ae(0));
  }, 700);
  return {
    showExecuted(l) {
      const h = l?.plenio_eq, f = h?.[h.length - 1];
      if (!f) return;
      const v = String(de(e, "mode")?.value ?? "flat"), $ = v === "manual";
      W = $ || v === "flat" ? null : v, u = {
        sampleRate: f.sample_rate,
        frequencies: f.frequency_hz,
        response: f.response_db,
        settings: f.settings,
        readonly: !$,
        note: $ ? "" : `applied: ${f.settings.bands.length} band(s)`,
        beforeDb: f.spectrum_before_db,
        afterDb: f.spectrum_after_db
      }, $ ? ae(0) : Y();
    }
  };
}
const sn = {
  PlenioSongBrief: "one song, stop to review",
  PlenioCoverBrief: "one cover, stop to review"
}, br = new Set(Fe.map((e) => Zt[e]));
function vr(e, t) {
  return !(e in sn) || !t || typeof t != "object" || Array.isArray(t) ? [] : Object.entries(t).filter(([n, o]) => br.has(n) && ro(o)).map(([n]) => n);
}
function xr(e, t) {
  for (const n of Object.values(e.input ?? {})) {
    const o = n?.[t];
    if (!Array.isArray(o)) continue;
    if (Array.isArray(o[0])) return o[0];
    const s = o[1]?.options;
    return Array.isArray(s) ? s : [];
  }
  return [];
}
const _r = {
  PlenioSongBrief: { arrangement: { simple: "off" } },
  PlenioCoverBrief: { arrangement: { simple: "off" } }
};
function Sr(e, t) {
  const n = _r[e];
  if (!n) return [];
  const o = [];
  for (const s of t ?? []) {
    const r = n[s.name]?.[String(s.value)];
    r !== void 0 && (s.value = r, o.push(s.name));
  }
  return o;
}
const Ln = 6, kr = 8, Er = 18;
function Mr(e) {
  if (e[Ln] !== "tags" || e.length > Er) return e;
  const t = Ln + 1 + kr;
  return [...e.slice(0, t), "", ...e.slice(t)];
}
function $r(e, t) {
  if (e.name === "PlenioExportRelease" && t && Array.isArray(t.widgets_values)) {
    const c = Mr(t.widgets_values);
    return c === t.widgets_values ? t : { ...t, widgets_values: c };
  }
  const n = sn[e.name];
  if (!n || !t) return t;
  const o = xr(e, "mode"), s = t.widgets_values, r = t.widgets_values_named;
  let i = t;
  Array.isArray(s) && s.length && !o.includes(s[0]) && (i = { ...i, widgets_values: [n, ...s] }), r && typeof r == "object" && !Array.isArray(r) && !("mode" in r) && (i = { ...i, widgets_values_named: { mode: n, ...r } });
  const a = vr(e.name, i.widgets_values_named);
  if (a.length) {
    const c = { ...i.widgets_values_named };
    for (const d of a) c[d] = "";
    i = { ...i, widgets_values_named: c };
  }
  return i;
}
const wo = /* @__PURE__ */ new Map(), jt = /* @__PURE__ */ new Set();
function Tn(e, t) {
  wo.set(e, t);
  for (const n of jt) n(e);
}
function Ee(e) {
  return wo.get(e) ?? null;
}
function Ar(e) {
  return jt.add(e), () => jt.delete(e);
}
const bo = /* @__PURE__ */ new Map();
function Nr(e) {
  e?.draft_sha256 && bo.set(e.draft_sha256, e);
}
function Lr(e) {
  return e ? bo.get(e) ?? null : null;
}
const Cn = "Plenio.OpenPlayer", Pn = "plenio-player", Tr = "▶ Open in the Plenio Player";
function Ft(e, t, n, o, s = 12e3) {
  e.extensionManager?.toast?.add({ severity: t, summary: n, detail: o, life: s });
}
async function Cr(e) {
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
async function Wt(e, t = null, n = window) {
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
    const r = await Cr(e.fetcher);
    o ? ((s || t) && (o.location.href = On(r.url, t)), o.focus()) : n.open(On(r.url, t), Pn), r.started && Ft(e.app, "success", "Plenio Player started", `${r.url} - it keeps running when ComfyUI stops; stop it on its Settings page.`);
  } catch (r) {
    o && s && o.close();
    const i = r instanceof V && r.hint ? ` ${r.hint}` : "";
    Ft(e.app, "error", "Plenio Player", `${r instanceof Error ? r.message : String(r)}${i}`, 2e4);
  }
}
function Pr(e, t) {
  const n = /* @__PURE__ */ new WeakMap(), o = e.prototype, s = o.onNodeCreated;
  o.onNodeCreated = function() {
    s?.call(this);
    const i = this.addWidget?.("button", Tr, null, () => {
      Wt(t, n.get(this) ?? null);
    }, { serialize: !1 });
    i && (i.serialize = !1);
  }, e.prototype.onExecuted = ne(e.prototype.onExecuted, function(r) {
    const i = r?.plenio_player, a = i?.[i.length - 1]?.record;
    a && n.set(this, a);
  });
}
const Or = /* @__PURE__ */ new Set(["127.0.0.1", "localhost", "[::1]"]);
function Ir(e, t) {
  if (e === t) return !0;
  try {
    const n = new URL(e);
    return n.protocol !== "http:" && n.protocol !== "https:" ? !1 : Or.has(n.hostname) || n.hostname === new URL(t).hostname;
  } catch {
    return !1;
  }
}
function qr(e, t = window, n = 1500) {
  const o = new URLSearchParams(t.location.search);
  if (o.get("plenio") !== "continue") return !1;
  o.delete("plenio");
  const s = o.toString();
  t.history.replaceState(t.history.state, "", `${t.location.pathname}${s ? `?${s}` : ""}${t.location.hash}`);
  const r = t.opener;
  if (!r) return !0;
  const i = (a) => {
    const c = a.data;
    c?.type !== "plenio-continue" || a.source !== r || !Ir(a.origin, t.location.origin) || (t.removeEventListener("message", i), dt(e, { record: c.record, name: String(c.name || "the Plenio Player") }).catch((d) => {
      const p = d instanceof V && d.hint ? ` ${d.hint}` : "";
      Ft(e.app, "error", "Continue a song", `${d instanceof Error ? d.message : String(d)}${p}`, 2e4);
    }));
  };
  return t.addEventListener("message", i), t.setTimeout(() => r.postMessage({ type: "plenio-ready" }, "*"), n), !0;
}
const Rr = {
  "one song, stop to review": "new song every run",
  "one cover, stop to review": "new cover every run"
}, zr = 2e3, Dr = 3e4;
function Br(e, t, n, o) {
  const s = Rr[t];
  return !s || n <= 0 && o <= 1 ? null : {
    summary: "These runs stop for your review",
    detail: `${e}: "${t}" - each run waits at the Song Sheets until you press Approve, so queued runs render nothing by themselves. For runs that go through, choose "${s}" in the brief's mode.`
  };
}
class Hr {
  constructor(t, n = Date.now) {
    this.notify = t, this.now = n;
  }
  notify;
  now;
  /** Runs the server has (running and waiting), from its ``status`` events. */
  queued = 0;
  recent = [];
  lastNotice = -1 / 0;
  status(t) {
    typeof t == "number" && Number.isFinite(t) && (this.queued = Math.max(0, t));
  }
  /** A run of a brief in ``mode`` is being queued. */
  queuing(t, n) {
    const o = this.now();
    this.recent = [...this.recent.filter((r) => o - r < zr), o];
    const s = Br(t, n, this.queued, this.recent.length);
    !s || o - this.lastNotice < Dr || (this.lastNotice = o, this.notify(s));
  }
  /** Hear of every run queued with this brief node (its *mode* widget's ``beforeQueued``). */
  watch(t) {
    const n = t.widgets?.find((s) => s.name === "mode");
    if (!n) return;
    const o = n.beforeQueued;
    n.beforeQueued = (s) => {
      o?.(s), s?.isPartialExecution || this.queuing(String(t.title || t.type), String(n.value ?? ""));
    };
  }
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
function jr(e) {
  return e === "ok" || e === "warning" || e === "error" || e === "skipped" ? e : null;
}
function Fr(e, t) {
  return e === "stop for review" ? !0 : e === "as the brief says" ? !!t && t.includes("stop to review") : !1;
}
function vo(e) {
  if (/^(conflict|invalid)/.test(e.status)) return "error";
  if (e.waiting) return "waiting";
  if (e.review === "stop for review" && e.approved) return "approved";
  const t = new Set(e.findings.map((n) => n.severity));
  return t.has("error") ? "error" : t.has("warning") ? "warning" : "ok";
}
function Wr(e) {
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
function xo(e) {
  return ft.get(e) ?? null;
}
function Ne(e, t) {
  t ? ft.set(e, t) : ft.delete(e), e.setDirtyCanvas?.(!0, !0);
  for (const n of Be) n(e);
}
function Gr(e) {
  for (const t of e) ft.delete(t);
  for (const t of Be) t(null);
}
function Vr() {
  for (const e of Be) e(null);
}
function Ur(e) {
  return Be.add(e), () => Be.delete(e);
}
const In = "600 12px sans-serif", et = 20, Ct = 7;
function Yr(e) {
  return e.label ? `${e.icon} ${e.label}` : e.icon;
}
function Xr(e) {
  const t = e ? Yr(e) : "";
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
const Qr = "PlenioSongSheet", Jr = 30;
function _o(e, t) {
  const n = e.widgets?.find((o) => o.name === t);
  return n ? String(n.value ?? "") : null;
}
function Kr(e) {
  const t = e.inputs?.findIndex((n) => n.name === "brief") ?? -1;
  if (t < 0) return null;
  try {
    const n = e.getInputNode?.(t);
    return n ? _o(n, "mode") : null;
  } catch {
    return null;
  }
}
function Gt(e) {
  const t = xo(e);
  return t || (e.type !== Qr ? null : Fr(_o(e, "review") ?? "continue", Kr(e)) ? "stop" : null);
}
function Zr(e) {
  const t = e?.plenio_sheet, n = t?.[t.length - 1];
  if (n) return vo(n);
  const o = e?.plenio_summary;
  return jr(o?.[o.length - 1]?.status);
}
function ei(e, t) {
  const n = e.prototype, o = n.onNodeCreated;
  n.onNodeCreated = function() {
    o?.call(this);
    const s = this;
    s.badges?.push(() => {
      const r = Gt(s);
      return Xr(r ? Tt[r] : null);
    });
  }, n.onDrawForeground = ne(n.onDrawForeground, function(s) {
    const r = Gt(this);
    !r || !Tt[r].frame || this.flags?.collapsed || !this.size || ti(s, Tt[r], this.size, Jr, t.scale());
  }), n.onExecuted = ne(n.onExecuted, function(s) {
    const r = Zr(s);
    r && (Ne(this, r), r === "waiting" && t.toast(
      `Stopped at ${this.title || "the Song Sheet"}`,
      'Waiting for your approval: open it with "Edit Song Sheet…", check the documents, press Approve, then run again.'
    ));
  });
}
function ti(e, t, n, o, s) {
  const r = Math.max(3, 3 / Math.max(s, 0.05));
  e.save(), e.strokeStyle = t.color, e.lineWidth = r, e.beginPath();
  const i = r / 2 + 3;
  typeof e.roundRect == "function" ? e.roundRect(-i, -o - i, n[0] + 2 * i, n[1] + o + 2 * i, 10) : e.rect(-i, -o - i, n[0] + 2 * i, n[1] + o + 2 * i), e.stroke(), e.restore();
}
function Fa(e, t) {
  const n = [];
  let o = 0;
  return e.bars.forEach((s, r) => {
    const i = t?.[r] ?? null, a = i && i[1] > i[0] ? [i[0], i[1]] : null, c = a ? a[1] - a[0] : s.duration_s;
    n.push({ scoreStart: s.start_s, scoreDur: s.duration_s, realStart: o, realDur: c, source: a }), o += c;
  }), n;
}
function So(e, t, n) {
  let o = null;
  for (const s of e)
    if (s[n] <= t + J) o = s;
    else break;
  return o ?? e[0] ?? null;
}
function ke(e, t) {
  const n = So(e, t, "scoreStart");
  if (!n) return t;
  const o = n.scoreDur > 0 ? (t - n.scoreStart) / n.scoreDur : 0;
  return n.realStart + o * n.realDur;
}
function ni(e, t) {
  const n = So(e, t, "realStart");
  if (!n) return t;
  const o = n.realDur > 0 ? (t - n.realStart) / n.realDur : 0;
  return n.scoreStart + o * n.scoreDur;
}
function Wa(e, t, n) {
  const o = ke(e, t), s = n == null ? 1 / 0 : ke(e, n), r = [];
  for (const i of e) {
    if (!i.source) continue;
    const a = i.realStart + i.realDur, c = Math.max(i.realStart, o), d = Math.min(a, s);
    if (d <= c + J) continue;
    let p = i.source[0] + (c - i.realStart) / i.realDur * (i.source[1] - i.source[0]), m = c - o, S = d - c;
    if (p < 0 && (m -= p, S += p, p = 0, S <= J))
      continue;
    const _ = r.at(-1);
    _ && Math.abs(_.at + _.duration - m) < J && Math.abs(_.offset + _.duration - p) < 0.01 ? _.duration += S : r.push({ at: m, offset: p, duration: S });
  }
  return r;
}
const ko = 0.04, J = 1e-3, oi = 0.25, si = 2;
function pt(e) {
  return Math.min(si, Math.max(oi, Number.isFinite(e) ? e : 1));
}
function Ga(e, t) {
  const n = pt(t.speed), o = t.to ?? e.duration_s, s = [], r = t.clock?.length ? t.clock : null, i = r ? ke(r, t.from) : t.from, a = (c) => (r ? ke(r, c) : c) - i;
  for (const c of ["Vocal", "Ins"])
    if (t.voices[c])
      for (const d of e.notes?.[c] ?? []) {
        if (d.start_s < t.from - J || d.start_s >= o - J) continue;
        const p = Math.min(d.start_s + d.duration_s, o), m = Math.max(0, a(d.start_s));
        s.push({ at: m / n, duration: (a(p) - m) / n, midi: d.midi, part: c });
      }
  if (t.voices.chords)
    for (const c of e.chords ?? []) {
      const d = Math.min(c.start_s + c.duration_s, o), p = Math.max(c.start_s, t.from);
      if (!(d <= p + J))
        for (const m of c.pitches)
          s.push({ at: a(p) / n, duration: (a(d) - a(p)) / n, midi: m, part: "chord" });
    }
  if (t.voices.guide)
    for (const c of t.guide ?? []) {
      if (c.start_s < t.from - J || c.start_s >= o - J) continue;
      const d = Math.min(c.start_s + c.duration_s, o), p = Math.max(0, a(c.start_s));
      s.push({ at: p / n, duration: (a(d) - p) / n, midi: c.midi, part: "guide" });
    }
  if (t.metronome)
    for (const c of e.bars) {
      const d = Number(c.meter.split("/")[0]) || 1;
      for (let p = 0; p < d; p++) {
        const m = c.start_s + p * c.duration_s / d;
        m < t.from - J || m >= o - J || s.push({
          at: Math.max(0, a(m)) / n,
          duration: ko,
          midi: p === 0 ? 96 : 89,
          part: "click"
        });
      }
    }
  return s.sort((c, d) => c.at - d.at || c.midi - d.midi);
}
function Va(e, t) {
  const n = Math.max(t.from, t.to ?? e.duration_s), o = t.clock?.length ? t.clock : null, s = o ? ke(o, n) - ke(o, t.from) : n - t.from;
  return Math.max(0, s) / pt(t.speed);
}
function Ua(e, t, n, o, s, r) {
  const i = e && t > 0 ? e.duration_s / t : 0, a = e && i > 0 ? Math.max(0, n - e.start_s) : 0, c = i > 0 ? Math.floor(a / i + 1e-6) : 0, d = i > 0 ? (a - c * i) / i * r : 0, p = d > 1e-3 ? 0 : 1, m = Math.max(0, o * t);
  return Array.from({ length: m }, (S, _) => {
    const R = p + m - 1 - _, M = ((c - R) % t + t) % t === 0;
    return { at: Math.max(0, s - d - R * r), duration: ko, midi: M ? 96 : 89, part: "click" };
  });
}
function Ya(e, t) {
  const n = e.clock?.length ? e.clock : null;
  return n ? ni(n, ke(n, e.from) + t * pt(e.speed)) : e.from + t * pt(e.speed);
}
function Xa(e, t, n) {
  return (e.elements ?? []).filter(
    (o) => o.kind === "note" && n[o.voice] && o.start_s <= t + J && t < o.start_s + o.duration_s - J
  ).map((o) => o.id);
}
function ri(e) {
  return 440 * 2 ** ((e - 69) / 12);
}
const ii = [
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
], Qa = {
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
  return typeof e == "string" && ii.includes(e);
}
function Eo() {
  return { Vocal: "soft", Ins: "plain", chord: "plain", guide: "plain" };
}
function ai(e) {
  const t = Eo(), n = typeof e == "object" && e !== null ? e : {};
  return {
    Vocal: tt(n.Vocal) ? n.Vocal : t.Vocal,
    Ins: tt(n.Ins) ? n.Ins : t.Ins,
    chord: tt(n.chord) ? n.chord : t.chord,
    guide: tt(n.guide) ? n.guide : t.guide
  };
}
const ci = {
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
}, qn = /* @__PURE__ */ new WeakMap();
function Pt(e, t, n) {
  let o = qn.get(e);
  o || qn.set(e, o = /* @__PURE__ */ new Map());
  let s = o.get(t);
  if (!s) {
    const r = new Float32Array(n.length + 1), i = new Float32Array(n.length + 1);
    n.forEach((a, c) => i[c + 1] = a), s = e.createPeriodicWave(r, i), o.set(t, s);
  }
  return s;
}
const Rn = /* @__PURE__ */ new WeakMap();
function Mo(e) {
  let t = Rn.get(e);
  if (!t) {
    t = e.createBuffer(1, e.sampleRate, e.sampleRate);
    const n = t.getChannelData(0);
    let o = 1;
    for (let s = 0; s < n.length; s++)
      o = o * 16807 % 2147483647, n[s] = o / 2147483647 * 2 - 1;
    Rn.set(e, t);
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
function re(e, t, n, o = 0.7) {
  const s = e.createBiquadFilter();
  return s.type = t, s.frequency.value = Math.min(n, e.sampleRate / 2 - 100), s.Q.value = o, s;
}
function qe(e, t, n, o, s, r) {
  const i = C(e, "sine", o), a = e.createGain();
  a.gain.setValueAtTime(0, n), a.gain.setValueAtTime(0, n + r), a.gain.linearRampToValueAtTime(s, n + r + 0.4), i.connect(a);
  for (const c of t) a.connect(c.detune);
  return i;
}
function Ot(e, t, n, o, s, r) {
  const i = e.createBufferSource();
  i.buffer = Mo(e);
  const a = re(e, "bandpass", o, 1.2), c = e.createGain();
  return c.gain.setValueAtTime(s, n), c.gain.setTargetAtTime(0, n, r), i.connect(a).connect(c).connect(t), i;
}
const ct = (e, t) => Math.min(t * 2.5, Math.max(t * 0.3, t * 2 ** ((60 - e) / 24))), zn = {
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
      const i = Pt(e, "piano", [1, 0.62, 0.36, 0.27, 0.16, 0.12, 0.07, 0.06, 0.035, 0.02, 0.012, 8e-3]), a = re(e, "lowpass", Math.min(n * (5 + 7 * s), 14e3), 0.5);
      a.frequency.setTargetAtTime(Math.max(n * 2.2, 400), o + 0.01, ct(r, 0.35)), a.connect(t);
      const c = C(e, i, n, -1.5), d = C(e, i, n, 1.5), p = me(e, 0.5);
      c.connect(p), d.connect(p), p.connect(a);
      const m = Ot(e, t, o, Math.min(n * 6, 7e3), 0.12 * s, 8e-3);
      return [c, d, m];
    }
  },
  epiano: {
    attack: 2e-3,
    sustain: 0,
    decay: 1.6,
    release: 0.12,
    build(e, t, n, o, s, r) {
      const i = C(e, "sine", n), a = C(e, "sine", n), c = e.createGain(), d = n * (1.2 + 2.2 * s);
      c.gain.setValueAtTime(d, o), c.gain.setTargetAtTime(n * 0.25, o, ct(r, 0.25)), a.connect(c).connect(i.frequency);
      const p = re(e, "highpass", 25, 0.7);
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
      const s = re(e, "lowpass", Math.min(n * 5 + 800, 6e3), 0.6);
      s.connect(t);
      const r = [-9, 0, 8].map((a) => C(e, "sawtooth", n, a));
      for (const a of r) a.connect(s);
      const i = qe(e, r, o, 5.3, 7, 0.3);
      return [...r, i];
    }
  },
  pad: {
    attack: 0.5,
    sustain: 0.95,
    decay: 1,
    release: 0.45,
    build(e, t, n, o) {
      const s = Math.min(n * 3 + 500, 4500), r = re(e, "lowpass", s, 0.8);
      r.connect(t);
      const i = C(e, "sine", 0.25), a = me(e, s * 0.3);
      i.connect(a).connect(r.frequency);
      const c = [C(e, "sawtooth", n, -12), C(e, "sawtooth", n, 11), C(e, "triangle", n / 2)];
      for (const d of c) d.connect(r);
      return [...c, i];
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
      const c = qe(e, [r, i], o, 6.6, 4, 0), d = Ot(e, t, o, 3e3, 0.05, 4e-3);
      return [r, i, c, d];
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
      i.buffer = Mo(e), i.loop = !0;
      const a = re(e, "bandpass", Math.min(n * 2, 8e3), 1.5), c = me(e, 0.06);
      i.connect(a).connect(c).connect(t);
      const d = qe(e, [r], o, 4.9, 9, 0.25);
      return [r, i, d];
    }
  },
  voice: {
    attack: 0.08,
    sustain: 0.9,
    decay: 0.5,
    release: 0.09,
    build(e, t, n, o) {
      const s = C(e, "sawtooth", n), r = re(e, "lowpass", 5e3, 0.5);
      s.connect(r);
      for (const [c, d, p] of [
        [800, 6, 1],
        [1150, 8, 0.55],
        [2900, 12, 0.18]
      ]) {
        const m = re(e, "bandpass", c, d), S = me(e, p);
        r.connect(m).connect(S).connect(t);
      }
      const i = me(e, 0.15);
      r.connect(i).connect(t);
      const a = qe(e, [s], o, 5.4, 18, 0.22);
      return [s, a];
    }
  },
  pluck: {
    attack: 2e-3,
    sustain: 0,
    decay: 0.7,
    release: 0.07,
    build(e, t, n, o, s, r) {
      const i = re(e, "lowpass", Math.min(n * (6 + 6 * s), 9e3), 0.9);
      i.frequency.setTargetAtTime(Math.max(n * 1.5, 250), o + 5e-3, ct(r, 0.12)), i.connect(t);
      const a = C(e, "sawtooth", n), c = C(e, "triangle", n, 4);
      a.connect(i), c.connect(i);
      const d = Ot(e, t, o, Math.min(n * 8, 8e3), 0.1 * s, 5e-3);
      return [a, c, d];
    }
  },
  lead: {
    attack: 0.01,
    sustain: 0.8,
    decay: 0.3,
    release: 0.06,
    build(e, t, n, o) {
      const s = re(e, "lowpass", Math.min(n * 8, 7e3), 2);
      s.frequency.setTargetAtTime(Math.min(n * 4, 4e3), o + 0.02, 0.2), s.connect(t);
      const r = C(e, "square", n), i = C(e, "sawtooth", n, 6);
      r.connect(s), i.connect(s);
      const a = qe(e, [r, i], o, 5.6, 10, 0.3);
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
      const a = C(e, "sawtooth", n), c = re(e, "lowpass", Math.min(n * 6, 2500), 1);
      c.frequency.setTargetAtTime(n * 2, o + 0.01, 0.12);
      const d = me(e, 0.25);
      return a.connect(c).connect(d).connect(t), [s, r, a];
    }
  },
  mallets: {
    attack: 2e-3,
    sustain: 0,
    decay: 0.8,
    release: 0.1,
    build(e, t, n, o, s, r) {
      const i = C(e, "sine", n), a = C(e, "sine", n * 3.5), c = e.createGain();
      return c.gain.setValueAtTime(n * (1 + 1.5 * s), o), c.gain.setTargetAtTime(0, o, 0.05), a.connect(c).connect(i.frequency), i.connect(t), [i, a];
    }
  }
};
function Dn(e, t) {
  return e.connect(t), e;
}
function Ja(e, t, n, o, s, { velocity: r = 0.8, level: i = 1 } = {}) {
  const a = zn[n] ?? zn.plain, c = ri(o), d = a.sustain === 0 ? ct(o, a.decay) : a.decay, p = i * ci[n] * (0.55 + 0.45 * Math.max(0, Math.min(1, r))), m = e.createGain();
  m.gain.setValueAtTime(0, s), m.gain.linearRampToValueAtTime(p, s + a.attack), m.gain.setTargetAtTime(p * a.sustain, s + a.attack, d), m.connect(t);
  const S = a.build(e, m, c, s, r, o);
  for (const k of S) k.start(s);
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
  }, a.sustain === 0 && M(s + a.attack + d * 7), {
    release(k) {
      if (_ || R) return;
      _ = !0;
      const H = Math.max(k, s + a.attack);
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
const Ka = 12, nt = { width: 640, height: 420 }, li = { width: 1280, height: 900 }, $o = 120, Ao = 720, No = 0.25, Lo = 0.85, To = 160, Co = 460, Po = "plenio.sheet.dialog";
function He(e, t, n) {
  return Number.isFinite(e) ? Math.min(Math.max(e, t), Math.max(t, n)) : t;
}
function ui(e, t) {
  const n = He(e.width, nt.width, Math.max(nt.width, t.width - 16)), o = He(e.height, nt.height, Math.max(nt.height, t.height - 16));
  return { width: Math.round(n), height: Math.round(o) };
}
function Za(e, t) {
  return Math.round(He(e + t, $o, Ao));
}
function ec(e, t, n) {
  return !Number.isFinite(n) || n <= 0 ? Bn(e) : Bn(e + t / n);
}
function Bn(e) {
  return Math.round(He(e, No, Lo) * 1e3) / 1e3;
}
function tc(e, t) {
  return Math.round(He(e + t, To, Co));
}
function nc(e, t, n) {
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
      window.removeEventListener("pointermove", c), window.removeEventListener("pointerup", a), window.removeEventListener("pointercancel", a), window.removeEventListener("blur", a), n?.();
    }
  }, c = (d) => {
    if (d.buttons === 0) {
      a();
      return;
    }
    t({ dx: d.clientX - o, dy: d.clientY - s });
  };
  window.addEventListener("pointermove", c), window.addEventListener("pointerup", a), window.addEventListener("pointercancel", a), window.addEventListener("blur", a);
}
function di() {
  return { ...li, maximized: !1 };
}
function oc(e = Oo()) {
  const t = di();
  try {
    const n = e?.getItem(Po);
    if (!n) return t;
    const o = JSON.parse(n);
    return { ...ui(
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
function sc(e, t = Oo()) {
  try {
    t?.setItem(Po, JSON.stringify(e));
  } catch {
  }
}
function Oo() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function Io(e) {
  return e === "large" || e === "standard" || e === "smaller" || e === "compact";
}
function qo() {
  return { countIn: 1, quantize: 16, mode: "replace", mute: !0, thru: !0, stepLength: 8 };
}
function fi(e) {
  const t = qo(), n = typeof e == "object" && e !== null ? e : {}, o = (s, r, i) => r.includes(s) ? s : i;
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
function pi() {
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
    sounds: Eo(),
    paper: "a4",
    notationSize: "standard",
    record: qo(),
    midiInput: "all"
  };
}
function hi(e) {
  const t = e.layout;
  return t === "text" ? { layout: "text", advanced: e.advanced === !0 } : t === "daw" ? { layout: "daw", advanced: e.advanced === !0 } : t === "both" ? { layout: "review", advanced: !0 } : { layout: "review", advanced: e.advanced === !0 };
}
function rc(e = zo()) {
  const t = pi();
  try {
    const n = e?.getItem(Ro);
    if (!n) return t;
    const o = JSON.parse(n);
    return {
      ...hi(o),
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
      rollHeight: typeof o.rollHeight == "number" && o.rollHeight >= $o && o.rollHeight <= Ao ? Math.round(o.rollHeight) : t.rollHeight,
      notationShare: typeof o.notationShare == "number" && o.notationShare >= No && o.notationShare <= Lo ? o.notationShare : t.notationShare,
      sideWidth: typeof o.sideWidth == "number" && o.sideWidth >= To && o.sideWidth <= Co ? Math.round(o.sideWidth) : t.sideWidth,
      metronome: o.metronome === !0,
      hear: o.hear === "notes" || o.hear === "source" ? o.hear : t.hear,
      sourceLevel: typeof o.sourceLevel == "number" && o.sourceLevel >= 0 && o.sourceLevel <= 1 ? o.sourceLevel : t.sourceLevel,
      audition: o.audition !== !1,
      rowHeight: typeof o.rowHeight == "number" && o.rowHeight >= 6 && o.rowHeight <= 28 ? Math.round(o.rowHeight) : t.rowHeight,
      follow: o.follow !== !1,
      sung: o.sung !== !1,
      wave: o.wave !== !1,
      sounds: ai(o.sounds),
      paper: o.paper === "letter" ? "letter" : "a4",
      notationSize: Io(o.notationSize) ? o.notationSize : t.notationSize,
      record: fi(o.record),
      midiInput: typeof o.midiInput == "string" && o.midiInput ? o.midiInput : "all"
    };
  } catch {
    return t;
  }
}
function ic(e, t = zo()) {
  try {
    t?.setItem(Ro, JSON.stringify(e));
  } catch {
  }
}
function zo() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function Do(e) {
  if (!Array.isArray(e)) return [];
  const t = (n) => typeof n == "string" ? n : "";
  return e.filter((n) => !!n && typeof n == "object").map((n) => ({
    token: t(n.token),
    file: t(n.file),
    title: t(n.title),
    paper: n.paper === "letter" ? "letter" : "a4",
    size: Io(n.size) ? n.size : "standard",
    display_abc: t(n.display_abc)
  })).filter((n) => n.token && n.file && n.display_abc);
}
function mi(e) {
  return Do(e?.plenio_notation);
}
async function gi(e) {
  const t = await e.fetchApi("/plenio/export/sheet-music/pending", { cache: "no-store" });
  if (!t.ok) return [];
  const n = await t.json().catch(() => ({}));
  return Do(n.jobs);
}
async function yi(e, t) {
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
function wi(e) {
  const t = Hn.then(e, e);
  return Hn = t.catch(() => {
  }), t;
}
class bi {
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
        wi(() => yi(s, this.host)).then(
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
      t = await gi(this.host.fetcher);
    } catch {
      return;
    }
    await Promise.all(this.take(t, !0));
  }
}
const vi = "PlenioSeed", xi = 2 ** 32, _i = "plenio_part", lt = "plenio_seed_hint", jn = 56, Fn = {
  fresh: { color: "#7a5418", bgcolor: "#3b2a10" },
  keep: { color: "#1f4e6e", bgcolor: "#14304a" }
};
function Si(e = Math.random) {
  return Math.floor(e() * xi);
}
function ki(e, t) {
  const n = t.trim() || "result";
  return e ? `🔒 Every run uses this seed again: the same ${n}.` : `🎲 Every run draws a new seed: a new ${n}. Liked it? Switch to 🔒.`;
}
function Le(e, t) {
  return e.widgets?.find((n) => n.name === t);
}
function Ei(e) {
  const t = e.inputs?.find((n) => n.name === "seed");
  return t?.link !== void 0 && t?.link !== null;
}
function Vt(e) {
  const t = !!Le(e, "keep_seed")?.value, n = e, o = t ? Fn.keep : Fn.fresh;
  n.color = o.color, n.bgcolor = o.bgcolor;
  const s = Le(e, lt)?.element;
  s && (s.textContent = ki(t, String(e.properties?.[_i] ?? ""))), e.setDirtyCanvas?.(!0, !0);
}
function Wn(e, t = Math.random) {
  const n = Le(e, "seed");
  !n || Ei(e) || (n.value = Si(t), n.callback?.(n.value), e.setDirtyCanvas?.(!0, !0));
}
function Mi(e, t = Math.random) {
  const n = Le(e, "seed"), o = Le(e, "keep_seed");
  if (!n || !o) return;
  n.beforeQueued = () => {
    o.value || Wn(e, t);
  }, o.callback = ne(o.callback, () => Vt(e));
  const r = e.addWidget?.("button", "🎲 new seed now", null, () => Wn(e, t), { serialize: !1 });
  if (r && (r.serialize = !1), !Le(e, lt)) {
    const i = document.createElement("div");
    i.className = "plenio-seed-hint";
    const a = e.addDOMWidget(lt, lt, i, {
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
function $i(e) {
  const t = e.prototype, n = t.onNodeCreated;
  t.onNodeCreated = function() {
    n?.call(this), Mi(this);
  }, e.prototype.onConfigure = ne(e.prototype.onConfigure, function() {
    Vt(this);
  });
}
const Ai = "PlenioSongSheet";
function Ge(e) {
  return e.widgets?.find((t) => t.name === "sheet_state") ?? null;
}
function Bo(e, t) {
  const n = e.inputs?.[t]?.link;
  if (n == null) return null;
  try {
    const o = e.graph, s = o?.links, r = o?.getLink?.(n) ?? (s instanceof Map ? s.get(n) : s?.[String(n)]);
    return r && o?.getNodeById ? o.getNodeById(r.origin_id) ?? null : e.getInputNode?.(t) ?? null;
  } catch {
    return null;
  }
}
function Ho(e, t) {
  const n = (e.inputs ?? []).findIndex((o) => o.name === t && o.link != null);
  return n < 0 ? null : Bo(e, n);
}
function jo(e, t) {
  const n = Ho(e, t);
  return n && (n.comfyClass ?? n.type) === Ai && Ge(n) ? n : null;
}
function Ni(e) {
  return jo(e, "context_lyrics");
}
function Li(e) {
  return jo(e, "context_score");
}
function Ti(e, t, n) {
  const o = [], s = Ho(t, n);
  s && o.push(s);
  const r = /* @__PURE__ */ new Set();
  for (; o.length && r.size < 1e3; ) {
    const i = o.shift(), a = String(i.id);
    if (!r.has(a)) {
      if (r.add(a), i === e || a === String(e.id)) return !0;
      (i.inputs ?? []).forEach((c, d) => {
        const p = Bo(i, d);
        p && o.push(p);
      });
    }
  }
  return !1;
}
function Ci(e, t, n) {
  const o = Ni(e), s = t?.context?.lyrics;
  if (!o || !s) return null;
  const r = o.title || "Song Sheet", i = Se(Ge(o)?.value), a = i?.docs.lyrics?.text ?? n(String(o.id))?.docs.lyrics?.upstream ?? null;
  let c = null;
  return i === null ? c = `The state of ${r} is unreadable - open that sheet and apply it first.` : a !== null && _e(a) !== _e(s) && (c = `The lyrics in ${r} changed after the last run. Run the workflow again; then they can follow the sections.`), { owner: o, target: { title: r, blocked: c, replans: Ti(o, e, "score") } };
}
function Pi(e, t, n) {
  const o = Ge(e);
  if (!o) return;
  const s = Se(o.value) ?? mt();
  o.value = De(lo(s, n, [{ kind: "lyrics", text: t, intent: "keep" }])), e.setDirtyCanvas?.(!0, !0);
}
function Oi(e, t, n) {
  const o = Li(e), s = t?.context?.score;
  if (!o || !s) return null;
  const r = o.title || "Song Sheet", i = Se(Ge(o)?.value), a = i?.docs.score?.text ?? n(String(o.id))?.docs.score?.upstream ?? null;
  let c = null;
  return i === null ? c = `The state of ${r} is unreadable - open that sheet and apply it first.` : a !== null && _e(a) !== _e(s) && (c = `The score in ${r} changed after the last run. Run the workflow again; then it can be edited here.`), { owner: o, target: { title: r, blocked: c } };
}
function Ii(e, t) {
  const n = String(e.widgets?.find((o) => o.name === "review")?.value ?? "continue");
  return n === "as the brief says" ? t?.review ?? "continue" : n;
}
async function qi(e, t, n, o = null) {
  const s = Ge(e);
  if (!s) return null;
  const r = Se(s.value) ?? mt(), i = lo(r, n, [{ kind: "score", text: t, intent: "keep" }]);
  if (s.value = De(i), e.setDirtyCanvas?.(!0, !0), !o || !n) return i;
  try {
    const a = await us(o.fetcher, {
      sheet_state: i,
      upstream: Hs(n),
      owned: n.owned,
      review: Ii(e, n),
      engine: n.engine,
      instrumental: n.instrumental,
      context: n.context,
      target_seconds: n.target_seconds ?? null
    });
    if (!!a.findings.some((p) => p.severity === "error") || !a.fingerprint) return i;
    const d = Bs(i, a.fingerprint);
    return s.value = De(d), e.setDirtyCanvas?.(!0, !0), d;
  } catch {
    return i;
  }
}
const Fo = "PLENIO_SHEET_STATE", Gn = 68;
let ut = null;
function Ri(e) {
  ut = e;
}
const zi = (e, t, n) => {
  let o = typeof n?.[1]?.default == "string" ? n[1].default : "";
  const s = document.createElement("div");
  s.className = "plenio-sheet-state";
  const r = document.createElement("span");
  r.className = "plenio-sheet-summary";
  const i = document.createElement("button");
  i.className = "plenio-sheet-open", i.textContent = "Edit Song Sheet…";
  const a = document.createElement("div");
  a.className = "plenio-sheet-status", s.append(i, r, a);
  let c = !1;
  const d = () => {
    const M = Ee(String(e.id)), k = Gt(e);
    r.textContent = zs(Se(o)) + (M && k !== "approved" ? ` · ${M.status}` : ""), a.textContent = Wr(k), a.dataset.state = k ?? "";
    const H = c ? null : e.widgets?.find((u) => u.name === "review");
    if (H) {
      c = !0;
      const u = H.callback;
      H.callback = (W) => {
        u?.(W), d();
      };
    }
  }, p = e.addDOMWidget(t, Fo, s, {
    getValue: () => o,
    setValue: (M) => {
      o = typeof M == "string" ? M : "", d();
    },
    // two rows, always: the frontend lays a DOM widget out once, so a height that changes later is cut;
    // it also keeps a 10 px margin above and below the element (68 - 20 = the rows' 48 px)
    getMinHeight: () => Gn,
    getMaxHeight: () => Gn
  });
  i.addEventListener("click", (M) => {
    M.stopPropagation(), m().catch((k) => {
      console.error("Plenio: the Song Sheet editor could not open", k), r.textContent = `The editor could not open: ${k instanceof Error ? k.message : String(k)}`;
    });
  });
  async function m() {
    const M = Se(o);
    M === null && (r.textContent = "The stored state is unreadable; it will be replaced when you apply.");
    const k = Ee(String(e.id)), u = (e.inputs ?? []).filter((L) => L.link != null).map((L) => L.name), W = M ?? { schema: "plenio.sheet_state/1", docs: {} }, A = k?.owned ?? uo(u, W), w = String(e.widgets?.find((L) => L.name === "review")?.value ?? "continue"), g = w === "as the brief says" ? k?.review ?? "continue" : w, y = () => tn(import.meta.url, nn), { openSheetDialog: b } = await Re(() => import("./open-D68SodRm.mjs"), y), { parseGuide: N, serializeGuide: E } = await Re(() => import("./tracks-ClAVjvds.mjs"), y), { parseShift: U, parseSpans: z } = await Re(() => import("./lyricPlacement-DGoRXeqW.mjs"), y);
    if (!ut) throw new Error("Plenio: API not initialised");
    let q = null;
    try {
      q = Ci(e, k, Ee);
    } catch (L) {
      console.warn("Plenio: the lyrics sheet of this score was not found", L);
    }
    let D = null;
    try {
      D = Oi(e, k, Ee);
    } catch (L) {
      console.warn("Plenio: the score sheet of these lyrics was not found", L);
    }
    const j = ut;
    b({
      title: e.title || "Song Sheet",
      state: W,
      payload: k,
      asrNote: Lr(k?.docs.lyrics?.upstream_sha256),
      owned: A.length ? A : [...We],
      review: g,
      fetcher: ut,
      // a template's choice of the score editor's layout (review, text; daw with the DAW template)
      layout: typeof e.properties?.plenio_editor_layout == "string" ? e.properties.plenio_editor_layout : null,
      // the Guide track (playback and MIDI only), kept in the node's properties with the workflow
      guide: N(e.properties?.plenio_guide),
      // the lyrics lines placed by hand in the lyrics lane, kept like the Guide notes
      lyricSpans: z(e.properties?.plenio_lyric_spans),
      // how far a cover's source recording is moved against the bars (the beat grid corrected by hand)
      sourceShift: U(e.properties?.plenio_source_shift),
      lyricsTarget: q?.target ?? null,
      scoreTarget: D?.target ?? null,
      onApply: (L, pe, ee, T, P, ae) => {
        const Ve = String(p.value ?? "");
        if (p.value = De(L), e.properties = {
          ...e.properties ?? {},
          plenio_guide: E(pe),
          plenio_lyric_spans: (ae?.lyricSpans ?? []).map((ce) => [...ce]),
          plenio_source_shift: ae?.sourceShift ?? 0
        }, P ? Ne(e, "approved") : String(p.value) !== Ve && S(e), ee !== null && q && !q.target.blocked && (Pi(q.owner, ee, Ee(String(q.owner.id))), S(q.owner)), T && D && !D.target.blocked) {
          const ce = D.owner;
          qi(ce, T.text, Ee(String(ce.id)), T.approved ? { fetcher: j } : null).then(
            (Y) => {
              Y?.review?.approved_fingerprint ? Ne(ce, "approved") : S(ce);
            }
          );
        }
        e.setDirtyCanvas?.(!0, !0);
      }
    });
  }
  function S(M) {
    xo(M) === "approved" && Ne(M, null);
  }
  const _ = [
    Ar((M) => {
      M === String(e.id) && d();
    }),
    Ur((M) => {
      (M === null || M === e) && d();
    })
  ], R = e.onRemoved;
  return e.onRemoved = function() {
    for (const M of _) M();
    R?.call(this);
  }, d(), { widget: p };
}, je = "plenio.stem_mix/1", Te = "rest", Di = ["reverb", "delay"], Wo = -60, Bi = 12;
function Hi() {
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
function Go(e) {
  const t = Hi();
  return e.gain_db === t.gain_db && e.mute === t.mute && e.solo === t.solo && e.compression === t.compression && e.muted.length === 0 && e.reverb === t.reverb && e.delay === t.delay && e.save === t.save;
}
const ji = ["vocals", "drums", "bass", "other"];
function Fi() {
  return [...ji, Te];
}
function Wi(e) {
  if (typeof e != "string" || !e.trim()) return { schema: je, strips: {} };
  try {
    const t = JSON.parse(e);
    return t?.schema !== je || typeof t.strips != "object" || t.strips === null ? null : t;
  } catch {
    return null;
  }
}
function Gi(e) {
  const t = {};
  for (const o of Object.keys(e.strips)) {
    if (!o || Go(ie(e, o))) continue;
    const s = {}, r = ie(e, o);
    r.gain_db && (s.gain_db = r.gain_db), r.mute && (s.mute = !0), r.solo && (s.solo = !0), r.compression && (s.compression = r.compression), r.muted.length && (s.muted = r.muted), r.reverb && (s.reverb = r.reverb), r.delay && (s.delay = r.delay), r.save && (s.save = !0), t[o] = s;
  }
  const n = { schema: je, strips: t };
  return e.reverb && Object.keys(e.reverb).length && (n.reverb = e.reverb), e.delay && Object.keys(e.delay).length && (n.delay = e.delay), JSON.stringify(n);
}
function ht(e, t, n) {
  const o = { ...e.strips };
  return Go(n) ? delete o[t] : o[t] = n, { ...e, strips: o };
}
function Vi(e, t, n) {
  const o = n.some((r) => ie(e, r).solo), s = ie(e, t);
  return o ? s.solo : !s.mute;
}
function Vn(e) {
  return e <= Wo ? "-∞" : `${e > 0 ? "+" : ""}${e.toFixed(1)}`;
}
function Ui(e, t = null) {
  const n = e.filter((s) => Array.isArray(s) && s.length === 2 && Number.isFinite(s[0]) && Number.isFinite(s[1])).map((s) => [Math.max(0, Math.min(s[0], s[1])), Math.max(s[0], s[1])]).filter((s) => s[1] - s[0] > 1e-6).sort((s, r) => s[0] - r[0]), o = [];
  for (const s of n) {
    const r = o[o.length - 1];
    r && s[0] <= r[1] + 1e-6 ? r[1] = Math.max(r[1], s[1]) : o.push([...s]);
  }
  return t !== null && t > 0 ? o.map(([s, r]) => [Math.min(s, t), Math.min(r, t)]).filter(([s, r]) => r - s > 1e-6) : o;
}
function Yi(e, t, n) {
  return Ui([...e, [t, n]]);
}
function Xi(e, t) {
  return e.findIndex(([n, o]) => n <= t && t <= o);
}
function Qi(e, t) {
  return t < 0 ? e : e.filter((n, o) => o !== t);
}
function Ji(e, t, n, o) {
  const s = ie(e, t);
  return ht(e, t, { ...s, muted: Yi(s.muted, n, o) });
}
function Ki(e, t, n) {
  const o = ie(e, t), s = Xi(o.muted, n);
  return s < 0 ? e : ht(e, t, { ...o, muted: Qi(o.muted, s) });
}
function Zi(e) {
  const t = e?.plenio_stems, n = t?.[t.length - 1];
  if (!n?.peaks) return {};
  const o = {};
  for (const [s, r] of Object.entries(n.peaks))
    Array.isArray(r) && r.length && (o[s] = r.map((i) => Math.abs(Number(i) || 0)));
  return o;
}
function ea(e, t, n = 200) {
  const o = e[t];
  return o?.length ? o.length === n ? o : Array.from({ length: n }, (s, r) => o[Math.floor(r * o.length / n)] ?? 0) : new Array(n).fill(0);
}
function Un(e, t) {
  const o = (Array.isArray(t?.stems) && t.stems.length ? t.stems : Fi()).filter((r) => r !== Te), s = Object.keys(e?.strips ?? {}).filter((r) => r !== Te && !o.includes(r));
  return [...o, ...s, Te];
}
const Yn = "plenio_stem_mixer", Xn = "mix", ge = 200, ta = ["room", "plate", "hall"];
function I(e, t, n) {
  const o = document.createElement(e);
  return t && (o.className = t), n !== void 0 && (o.textContent = n), o;
}
function ot(e, t, n, o, s) {
  const r = I("input");
  return r.type = "range", r.min = String(e), r.max = String(t), r.step = String(n), r.value = String(o), r.setAttribute("aria-label", s), r;
}
function na(e) {
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
  const c = () => e.widgets?.find((w) => w.name === Xn);
  function d(w, { draw: g = !0 } = {}) {
    const y = c();
    if (!y) return;
    const b = Gi(w);
    y.value = b, y.callback?.(b), i = { ...i, mix: w }, g && _();
  }
  function p(w, g, y = {}) {
    d(ht(i.mix, w, { ...ie(i.mix, w), ...g }), y);
  }
  function m(w, g, y, b = {}) {
    const N = ie(i.mix, w);
    let E = ht(i.mix, w, { ...N, [g]: y });
    y > 0 && !(E[g] && Object.keys(E[g]).length) && (E = g === "reverb" ? { ...E, reverb: { preset: "room" } } : { ...E, delay: { time_ms: 375, feedback: 0.35, lowpass_hz: 4e3 } }), d(E, b);
  }
  function S(w, g, y) {
    const b = { ...i.mix[w] ?? {} };
    d({ ...i.mix, [w]: { ...b, [g]: y } });
  }
  function _() {
    n.replaceChildren();
    const w = i.names;
    for (const g of i.names) {
      const y = ie(i.mix, g), b = I("div", "plenio-mix-strip");
      b.dataset.strip = g;
      const N = I("span", "name", g === Te ? `${g} (missed)` : g);
      N.title = g === Te ? "What the separator missed: keeps a neutral mix exact" : "";
      const E = ot(Wo, Bi, 0.5, y.gain_db, `${g} gain`), U = I("span", "gain", `${Vn(y.gain_db)} dB`);
      E.addEventListener("input", () => {
        U.textContent = `${Vn(Number(E.value))} dB`, p(g, { gain_db: Number(E.value) }, { draw: !1 });
      }), E.addEventListener("change", () => p(g, { gain_db: Number(E.value) }));
      const z = I("button", y.mute ? "toggle active" : "toggle", "M");
      z.setAttribute("aria-label", `${g} mute`), z.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { mute: !y.mute });
      });
      const q = I("button", y.solo ? "toggle active" : "toggle", "S");
      q.setAttribute("aria-label", `${g} solo`), q.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { solo: !y.solo });
      });
      const D = ot(0, 1, 0.05, y.compression, `${g} compression`);
      D.title = "Compression amount: one knob for the master compressor (threshold and ratio)", D.addEventListener("input", () => p(g, { compression: Number(D.value) }, { draw: !1 })), D.addEventListener("change", () => p(g, { compression: Number(D.value) }));
      const j = Di.map((T) => {
        const P = ot(0, 1, 0.05, y[T], `${g} ${T} send`);
        return P.title = `${T} send: how much of this stem goes to the shared ${T} bus`, P.addEventListener("input", () => m(g, T, Number(P.value), { draw: !1 })), P.addEventListener("change", () => m(g, T, Number(P.value))), P;
      }), L = I("button", y.save ? "toggle active" : "toggle", "save");
      L.setAttribute("aria-label", `${g} save as its own file`), L.setAttribute("aria-pressed", String(y.save)), L.title = 'Save this stem as its own 24-bit FLAC file on the next run - next to the song, in the folder "<name>-stems" (without an Export Release: output/plenio/stems); its gain, compression and muted ranges are applied, mute/solo and the buses are not', L.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { save: !y.save });
      });
      const pe = Vi(i.mix, g, w);
      b.classList.toggle("silent", !pe);
      const ee = I("canvas", "plenio-mix-wave");
      ee.width = ge, ee.height = 26, ee.setAttribute("aria-label", `${g} waveform (drag to mute a time range)`), R(ee, y, ea(i.peaks, g, ge)), ee.addEventListener("pointerdown", (T) => M(T, ee, g)), b.append(
        N,
        E,
        U,
        z,
        q,
        I("span", "label", "comp"),
        D,
        I("span", "label", "verb"),
        j[0],
        I("span", "label", "delay"),
        j[1],
        L,
        ee
      ), n.append(b);
    }
    k(), s.textContent = i.seconds ? `last run: ${i.seconds.toFixed(1)} s - drag on a strip to mute a time range, click a range to remove it` : "no run yet: the strips show the documented stems (vocals, drums, bass, other and the residual rest); Separate Stems fills them", e.setDirtyCanvas?.(!0, !0);
  }
  function R(w, g, y) {
    const b = w.getContext("2d");
    if (!b) return;
    b.clearRect(0, 0, ge, w.height);
    const N = w.height / 2;
    b.strokeStyle = "rgba(180, 190, 205, 0.8)", b.beginPath();
    for (let E = 0; E < y.length; E++) {
      const U = Math.max(1, y[E] * (N - 1));
      b.moveTo(E + 0.5, N - U), b.lineTo(E + 0.5, N + U);
    }
    b.stroke(), b.fillStyle = "rgba(224, 104, 94, 0.35)", b.strokeStyle = "rgba(224, 104, 94, 0.9)";
    for (const [E, U] of g.muted) {
      const z = Math.max(0, Math.min(ge, E / Math.max(i.seconds, 1e-6) * ge)), q = Math.max(0, Math.min(ge, U / Math.max(i.seconds, 1e-6) * ge));
      b.fillRect(z, 0, Math.max(1, q - z), w.height), b.strokeRect(z + 0.5, 0.5, Math.max(1, q - z) - 1, w.height - 1);
    }
  }
  function M(w, g, y) {
    if (w.preventDefault(), w.stopPropagation(), !i.seconds) return;
    const b = g.getBoundingClientRect(), N = (j) => Math.max(0, Math.min(1, (j - b.left) / (b.width || ge))) * i.seconds, E = N(w.clientX);
    if (ie(i.mix, y).muted.some(([j, L]) => j <= E && E <= L)) {
      d(Ki(i.mix, y, E));
      return;
    }
    let z = E;
    const q = (j) => {
      z = N(j.clientX);
    }, D = () => {
      window.removeEventListener("pointermove", q), window.removeEventListener("pointerup", D), d(Ji(i.mix, y, Math.min(E, z), Math.max(E, z)));
    };
    window.addEventListener("pointermove", q), window.addEventListener("pointerup", D);
  }
  function k() {
    o.replaceChildren();
    const w = { preset: "room", ...i.mix.reverb ?? {} }, g = { time_ms: 375, feedback: 0.35, ...i.mix.delay ?? {} }, y = I("select");
    y.setAttribute("aria-label", "Reverb preset"), y.title = "The room the reverb bus adds; the amount per stem is its verb send";
    for (const E of ta) y.append(new Option(E, E));
    y.value = String(w.preset ?? "room"), y.addEventListener("change", () => S("reverb", "preset", y.value));
    const b = I("input");
    b.type = "number", b.value = String(g.time_ms ?? 375), b.setAttribute("aria-label", "Delay time in ms"), b.title = "Delay time in ms: where the first echo of the delay bus sits", b.addEventListener("change", () => S("delay", "time_ms", Number(b.value)));
    const N = ot(0, 0.8, 0.05, Number(g.feedback ?? 0.35), "Delay feedback");
    N.title = "Delay feedback: how much of each echo returns into the delay line", N.addEventListener("input", () => S("delay", "feedback", Number(N.value))), o.append(
      I("span", "label", "reverb bus"),
      y,
      I("span", "label", "delay bus"),
      b,
      I("span", "label", "ms, feedback"),
      N
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
  const u = e.widgets?.find((w) => w.name === Xn), W = I("button", "toggle", "JSON");
  W.title = "Show or hide the raw mixer value", W.addEventListener("click", (w) => {
    w.stopPropagation(), a = !a, W.classList.toggle("active", a), u && (u.plenioHidden = !a, a ? delete u.computeSize : u.computeSize = () => [0, -4]), e.setDirtyCanvas?.(!0, !0);
  }), r.append(I("span", "label", "Advanced"), W), u && (u.plenioHidden = !0, u.computeSize = () => [0, -4]);
  function A() {
    const w = Wi(c()?.value);
    i = { ...i, mix: w ?? { schema: je, strips: {} } }, w || (s.textContent = "the mixer value is not readable; it will be replaced on the next edit"), _();
  }
  return A(), {
    showExecuted(w) {
      const g = w?.plenio_stems?.at(-1), y = Zi(w), b = Un(i.mix, g ?? null);
      i = { ...i, names: b, peaks: y, seconds: Number(g?.seconds ?? i.seconds) || 0 }, A();
    }
  };
}
const Ut = "plenio-tip", Qn = 12, st = 8;
function oa(e, t, n, o) {
  let s = e.right + Qn;
  if (s + n.width > o.width - st && (s = e.left - Qn - n.width), s < st) return null;
  const r = Math.max(st, Math.min(t - 14, o.height - st - n.height));
  return { x: s, y: r };
}
function sa(e) {
  return !!e && (String(e.type ?? "").startsWith("Plenio") || String(e.title ?? "").startsWith("Plenio"));
}
const ra = 30;
function ia(e) {
  const t = e.node_over, n = e.ds, o = e.canvas;
  if (!t || !n || !o) return null;
  const s = o.getBoundingClientRect(), r = t.flags?.collapsed ? 0 : t.size[1];
  return {
    left: s.left + (t.pos[0] + n.offset[0]) * n.scale,
    top: s.top + (t.pos[1] - ra + n.offset[1]) * n.scale,
    right: s.left + (t.pos[0] + t.size[0] + n.offset[0]) * n.scale,
    bottom: s.top + (t.pos[1] + r + n.offset[1]) * n.scale
  };
}
function aa(e) {
  const t = document.body, n = () => t.classList.remove(Ut);
  let o = 0, s = null;
  const r = (a) => {
    const c = e();
    if (a.style.display === "none" || !a.textContent?.trim() || !c || !sa(c.node_over)) return n();
    const d = ia(c), p = a.getBoundingClientRect(), m = d && oa(d, o, p, { width: window.innerWidth, height: window.innerHeight });
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
const ca = `
body.${Ut} .node-tooltip { left: var(--plenio-tip-x) !important; top: var(--plenio-tip-y) !important;
  transform: none !important; }
`, la = `
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
` + ca;
function ua() {
  if (document.getElementById("plenio-styles")) return;
  const e = document.createElement("style");
  e.id = "plenio-styles", e.textContent = la, document.head.append(e);
}
function Yt(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function rt(e) {
  return Yt(e).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
function da(e) {
  const t = e.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((n) => n.trim());
  return t.every((n) => /^:?-{3,}:?$/.test(n)) ? null : t;
}
function fa(e) {
  const t = [];
  let n = !1, o = null, s = null;
  const r = () => {
    n && (t.push("</ul>"), n = !1);
  }, i = () => {
    if (s) {
      const [a, ...c] = s, d = (p, m) => `<tr>${p.map((S) => `<${m}>${rt(S)}</${m}>`).join("")}</tr>`;
      t.push(`<table><thead>${d(a, "th")}</thead><tbody>${c.map((p) => d(p, "td")).join("")}</tbody></table>`), s = null;
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
      const p = da(a);
      p && (s ??= []).push(p);
      continue;
    }
    if (i(), a.startsWith("```")) {
      r(), o = [];
      continue;
    }
    const c = /^(#{1,4})\s+(.*)$/.exec(a);
    if (c) {
      r();
      const p = Math.min(c[1].length + 2, 6);
      t.push(`<h${p}>${rt(c[2])}</h${p}>`);
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
const ze = "plenio_summary", Jn = "plenio_summary", Kn = 84, pa = 18, ha = 55, ma = 16, Zn = 10;
function ga(e) {
  const t = e.split(`
`).filter((n) => n.trim()).reduce((n, o) => n + Math.max(1, Math.ceil(o.length / ha)), 0);
  return ma + t * pa;
}
function ya(e, t) {
  const n = e.widgets?.find((i) => i.name === Jn);
  if (n?.element) return n.element;
  const o = document.createElement("div");
  o.className = "plenio-summary";
  let s = Zn;
  const r = e.addDOMWidget(Jn, "plenio_summary", o, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => Kn,
    // as tall as its text: a short summary leaves the rest of the node to the other widgets. The margins
    // count too - without them the element stayed 20 px short of its text and hid the last line
    getMaxHeight: () => Math.max(Kn, (o.scrollHeight ? o.scrollHeight + 2 : ga(t.markdown)) + 2 * s)
  });
  return s = r.margin ?? Zn, r.serialize = !1, o;
}
function wa(e) {
  const t = e.computeSize?.();
  t && e.size && e.size[1] < t[1] && e.setSize?.([e.size[0], t[1]]);
}
const eo = /* @__PURE__ */ new WeakMap();
function Xt(e, t) {
  if (!t.markdown) return;
  const n = eo.get(e) ?? { markdown: "" };
  n.markdown = t.markdown, eo.set(e, n);
  const o = ya(e, n);
  o.dataset.status = t.status ?? "", o.innerHTML = fa(t.markdown), wa(e), e.setDirtyCanvas?.(!0, !0);
}
function to(e, t, n, o) {
  const s = e.properties?.[ze], r = (s?.markdown ?? "").split(`
`), i = r.findIndex((c) => c.startsWith(t));
  i >= 0 ? r[i] = n : r.push(n);
  const a = { markdown: r.join(`
`).trim(), status: o ?? s?.status ?? "" };
  e.properties = e.properties ?? {}, e.properties[ze] = a, Xt(e, a);
}
function ba(e) {
  e.prototype.onExecuted = ne(e.prototype.onExecuted, function(t) {
    const n = t?.[ze], o = n?.[n.length - 1];
    o?.markdown && (this.properties = this.properties ?? {}, this.properties[ze] = { markdown: o.markdown, status: o.status ?? "" }, Xt(this, o));
  }), e.prototype.onConfigure = ne(e.prototype.onConfigure, function() {
    const t = this.properties?.[ze];
    t?.markdown && Xt(this, t);
  });
}
const va = "Plenio.Core", Q = ls;
Ri(Q);
const K = so, It = { app: K, fetcher: Q }, qt = { app: K, fetcher: Q }, Vo = () => K.graph;
function Qt(e) {
  if (e == null) return null;
  const t = String(e);
  return Vo()?.getNodeById?.(t.includes(":") ? t : Number(t)) ?? null;
}
const no = new Hr(
  (e) => K.extensionManager?.toast?.add({ severity: "warn", summary: e.summary, detail: e.detail, life: 2e4 })
), xa = {
  scale: () => K.canvas?.ds?.scale ?? 1,
  toast: (e, t) => K.extensionManager?.toast?.add({ severity: "info", summary: e, detail: t, life: 12e3 })
}, Uo = () => tn(import.meta.url, nn), _a = {
  fetcher: Q,
  async draw(e, t, n, o) {
    const { notationPdf: s, renderLines: r } = await Re(
      () => import("./notationExport-DkCMgjck.mjs").then((a) => a.c),
      Uo,
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
function Sa(e, t) {
  const n = Qt(e), o = n?.properties?.plenio_summary;
  return n?.type === "PlenioExportRelease" && o?.markdown?.includes(`- sheet music: ${t}`) ? n : null;
}
function ka(e, t) {
  const n = `- sheet music: ${e.job.file}`, o = Sa(t, e.job.file);
  if ("saved" in e) {
    o && to(o, n, `${n} - saved (${Math.max(1, Math.round(e.saved.bytes / 1024))} KB)`), K.extensionManager?.toast?.add({ severity: "success", summary: "Sheet music saved", detail: e.saved.file, life: 6e3 });
    return;
  }
  const { error: s } = e, r = s instanceof V && s.hint ? `${s.message} ${s.hint}` : String(s instanceof Error ? s.message : s);
  if (e.quiet) {
    console.info(`Plenio: ${e.job.file} was saved by another page`);
    return;
  }
  o && to(o, n, `${n} - not saved: ${r}`, "warning"), K.extensionManager?.toast?.add({ severity: "error", summary: "Sheet music not saved", detail: `${e.job.file}: ${r}`, life: 15e3 });
}
const Jt = /* @__PURE__ */ new Map(), oo = new bi(_a, (e) => {
  ka(e, Jt.get(e.job.token)), Jt.delete(e.job.token);
});
so.registerExtension({
  name: va,
  getCustomWidgets: () => ({ [Fo]: zi }),
  // a song's release record opens its workflow again, its documents kept (continueSong.ts)
  commands: [
    {
      id: Mt,
      label: "Continue a Plenio song…",
      icon: "pi pi-history",
      function: () => er(It).catch((e) => {
        console.error("Plenio: the Continue a song dialog could not open", e), K.extensionManager?.toast?.add({
          severity: "error",
          summary: "Continue a song",
          detail: String(e instanceof Error ? e.message : e),
          life: 15e3
        });
      })
    },
    { id: Cn, label: "Plenio Player", icon: "pi pi-play-circle", function: () => Wt(qt) }
  ],
  menuCommands: [
    { path: ["File"], commands: [Mt] },
    { path: ["Plenio"], commands: [Cn, Mt] }
  ],
  // the Plenio Player, one click away beside Run (player.ts): started as a program of its own when none runs
  actionBarButtons: [
    {
      icon: "pi pi-play-circle",
      label: "Plenio Player",
      tooltip: "Open the Plenio Player: your songs with live lyrics, sheet music and visuals (starts it if needed)",
      onClick: () => {
        Wt(qt);
      }
    }
  ],
  // a workflow saved before its blocks followed the brief's creativity: they are brought up to date before
  // the frontend configures it (blocks.ts); loading goes on as it was when that fails
  async beforeConfigureGraph(e) {
    try {
      const t = await bs(e, Q);
      for (const n of vs(t)) K.extensionManager?.toast?.add({ ...n, life: 2e4 });
    } catch (t) {
      console.error("Plenio: the blocks of this workflow could not be brought up to date", t);
      const n = t instanceof V && t.hint ? `${t.message} ${t.hint}` : String(t instanceof Error ? t.message : t);
      K.extensionManager?.toast?.add({
        severity: "warn",
        summary: "Plenio blocks not brought up to date - the brief's creativity may not reach their sampling",
        detail: n,
        life: 2e4
      });
    }
  },
  // the sheets' review stops depend on the linked brief's mode: known once the links are in place
  afterConfigureGraph: () => Vr(),
  beforeRegisterNodeDef(e, t) {
    if (!t.name.startsWith("Plenio")) return;
    ba(e), ei(e, xa);
    const n = ar(t.input);
    if (n.size || t.name in sn) {
      const o = e.prototype.configure;
      e.prototype.configure = function(s) {
        const r = $r(t, s), i = nr(r), a = o?.call(this, r);
        return ir(this, i, n), Sr(t.name, this.widgets), a;
      };
    }
    if (t.name === "PlenioTranscribeLyrics" && (e.prototype.onExecuted = ne(e.prototype.onExecuted, function(o) {
      for (const s of o?.plenio_asr ?? []) Nr(s);
    })), t.name === "PlenioEQ") {
      const o = /* @__PURE__ */ new WeakMap(), s = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        s?.call(this), o.set(this, wr(this, Q));
      }, e.prototype.onExecuted = ne(e.prototype.onExecuted, function(r) {
        o.get(this)?.showExecuted(r);
      });
    }
    if (t.name === "PlenioExportRelease" && Pr(e, qt), t.name === vi && $i(e), Ps.has(t.name)) {
      Os(e, Q);
      const o = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        o?.call(this), no.watch(this);
      };
    }
    if (t.name === "PlenioStemMixer") {
      const o = /* @__PURE__ */ new WeakMap(), s = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        s?.call(this), o.set(this, na(this));
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
    ua(), aa(() => K.canvas), Zs(It), qr(It), Q.addEventListener("plenio.sheet", (n) => {
      const o = n.detail;
      if (!o?.node_id) return;
      Tn(String(o.node_id), o);
      const s = Qt(o.node_id);
      s && Ne(s, vo(o));
    }), Q.addEventListener("status", (n) => {
      no.status(n.detail?.exec_info?.queue_remaining);
    }), Q.addEventListener("execution_start", () => {
      Gr(Vo()?.nodes ?? []);
    }), Q.addEventListener("execution_error", (n) => {
      const o = Qt(n.detail?.node_id);
      o && String(o.type).startsWith("Plenio") && Ne(o, "error");
    }), Q.addEventListener("executed", (n) => {
      const o = n.detail, s = mi(o?.output), r = o?.display_node ?? o?.node;
      for (const i of s) Jt.set(i.token, r);
      oo.take(s);
    });
    const e = () => {
      oo.recover();
    };
    let t = !1;
    Q.addEventListener("reconnected", () => {
      Uo().then((n) => {
        n ? t || (t = !0, K.extensionManager?.toast?.add({ severity: "warn", summary: "Plenio was updated", detail: Bt })) : e();
      });
    }), document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible" && e();
    }), window.setTimeout(e, 3e3);
  }
});
export {
  Ha as $,
  Io as A,
  rc as B,
  $o as C,
  To as D,
  No as E,
  _e as F,
  nc as G,
  Za as H,
  ii as I,
  Bn as J,
  tc as K,
  Ca as L,
  La as M,
  Lo as N,
  Ta as O,
  V as P,
  ic as Q,
  Ao as R,
  Co as S,
  J as T,
  ec as U,
  ja as V,
  oc as W,
  $a as X,
  za as Y,
  Ba as Z,
  Ra as _,
  Oa as a,
  De as a0,
  Da as a1,
  us as a2,
  Hs as a3,
  Bs as a4,
  Ka as a5,
  ui as a6,
  sc as a7,
  lo as a8,
  va as a9,
  Aa as b,
  Pa as c,
  Eo as d,
  Fa as e,
  ri as f,
  Ga as g,
  Wa as h,
  co as i,
  Ya as j,
  Xa as k,
  qa as l,
  Va as m,
  Ua as n,
  pt as o,
  ao as p,
  ni as q,
  ke as r,
  Ja as s,
  Na as t,
  Qa as u,
  Ia as v,
  qo as w,
  tt as x,
  ai as y,
  fi as z
};
