import { api as xs } from "../../../../scripts/api.js";
import { app as uo } from "../../../../scripts/app.js";
class U extends Error {
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
    throw new U(r.message ?? `Request failed (${o.status})`, r.hint ?? null);
  }
  return s;
}
function Ss(e, t) {
  return oe(e, "/plenio/sheet/resolve", t);
}
async function Ua(e, t) {
  if (!/^[0-9a-f]{64}$/.test(t)) return null;
  const n = await e.fetchApi(`/plenio/asr/notes/${t}`);
  return n.ok ? (await n.json())?.note ?? null : null;
}
function nn(e, t, n) {
  return t ? n?.length ? { ...e, lyrics: t, lyric_spans: n } : { ...e, lyrics: t } : e;
}
function Ya(e, t, n, o) {
  return oe(e, "/plenio/score/analyze", nn({ abc: t }, n, o));
}
function Xa(e, t, n, o, s) {
  return oe(e, "/plenio/score/transform", nn({ abc: t, operation: n }, o, s));
}
function Qa(e, t) {
  const { lyrics: n, spans: o, ...s } = t;
  return oe(e, "/plenio/score/musicxml/export", nn(s, n, o));
}
function Ja(e, t) {
  const { lyrics: n, ...o } = t;
  return oe(e, "/plenio/score/musicxml/import", n ? { ...o, lyrics: n } : o);
}
function Ka(e, t) {
  return oe(e, "/plenio/score/midi/export", t);
}
function Za(e, t) {
  return oe(e, "/plenio/score/midi/import", t);
}
function ec(e, t) {
  return oe(e, "/plenio/lyrics/analyze", t);
}
function tc(e, t) {
  const o = `/view?${new URLSearchParams({ filename: t.filename, subfolder: t.subfolder, type: t.type }).toString()}`;
  return e.apiURL ? e.apiURL(o) : `/api${o}`;
}
function hn(e, t, n, o = 200) {
  return oe(e, "/plenio/eq/response", { settings: t, sample_rate: n, points: o });
}
function ks(e, t) {
  return oe(e, "/plenio/brief/fields", t);
}
async function _s(e) {
  const t = await e.fetchApi("/plenio/presets/eq");
  if (!t.ok) throw new U(`Request failed (${t.status})`);
  return await t.json();
}
async function nc(e) {
  const t = await e.fetchApi("/plenio/records"), n = await t.json();
  if (!t.ok) {
    const o = n?.error ?? {};
    throw new U(o.message ?? `Request failed (${t.status})`, o.hint ?? null);
  }
  return n?.records ?? [];
}
function Es(e, t) {
  return oe(e, "/plenio/records/continue", t);
}
function Ms(e, t) {
  return oe(e, "/plenio/workflow/blocks", { workflow: t });
}
function Z(e, t) {
  return function(...n) {
    e?.apply(this, n), t.apply(this, n);
  };
}
const Bt = "Plenio · ", $s = /* @__PURE__ */ new Set(["YuE2GenerateABC", "YuE2GenerateMusic", "PlenioComposePrompt", "PlenioComposeArrangement"]), As = "PlenioCreativity";
function Ns(e) {
  const t = e?.definitions?.subgraphs;
  return Array.isArray(t) ? t : [];
}
function Ls(e) {
  return Ns(e).some((t) => {
    if (typeof t?.name != "string" || !t.name.startsWith(Bt)) return !1;
    const n = new Set((t.nodes ?? []).map((o) => o?.type));
    return !n.has(As) && [...n].some((o) => $s.has(String(o)));
  });
}
async function Cs(e, t) {
  if (!e || typeof e != "object" || !Ls(e)) return null;
  const n = await Ms(t, e);
  if (n.workflow) {
    const o = e;
    for (const s of Object.keys(o)) delete o[s];
    Object.assign(o, n.workflow);
  }
  return n;
}
const Ht = (e) => e.startsWith(Bt) ? e.slice(Bt.length) : e, mn = (e) => e.map(Ht).join(", ");
function Ts(e) {
  if (!e) return [];
  const t = [];
  if (e.updated.length) {
    const o = e.linked.length ? ` The creativity of ${mn(e.linked)} now comes from the brief.` : "";
    t.push({
      severity: "info",
      summary: "Plenio blocks brought up to date",
      detail: `This workflow was saved before its blocks followed the brief's creativity: ${mn(e.updated)} are the current blocks now.${o} At creativity 50 they work exactly as before. Save the workflow to keep it.`
    });
  }
  const n = [
    ...e.kept.map(([o, s]) => `${Ht(o)} was kept as it was (${s}) - its sampling stays fixed`),
    ...e.unlinked.map(([o, s]) => `${Ht(o)} has its own creativity slider (${s})`)
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
], Ps = ["length", "vocals", "melody"], on = {
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
}, Os = "custom";
function fo(e) {
  return typeof e == "string" && e.trim().toLowerCase() === Os;
}
function Pe(e, t) {
  const n = on[t];
  if (n)
    return (e.widgets ?? []).find((o) => o.name === n);
}
function Is(e) {
  const t = {};
  for (const n of [...Fe, ...Ps]) {
    const o = Pe(e, n);
    o && (t[n] = typeof o.value == "string" ? o.value : String(o.value ?? ""));
  }
  return t;
}
function Rs(e) {
  return (e.comfyClass ?? e.type) === "PlenioCoverBrief" ? "cover" : "song";
}
function gn(e, t) {
  const n = [];
  for (const o of t.fills) {
    if (!Fe.includes(o.field)) continue;
    const s = Pe(e, o.field);
    s && !String(s.value ?? "").trim() && o.value && n.push({ field: o.field, value: o.value });
  }
  return n;
}
function wn(e) {
  const t = [];
  for (const n of Fe) {
    const o = Pe(e, n);
    o && String(o.value ?? "").trim() && t.push(o);
  }
  return t;
}
function jt(e) {
  return e.choices.filter((t) => t.suggested && t.suggested !== t.current).map((t) => ({ field: t.field, value: t.suggested }));
}
function qs(e, t) {
  return !t || !e || e.template === "none" ? null : e.fills.length ? `Template fills: ${e.fills.map((o) => `${o.field} (${Hs(o.value)})`).join(", ")}` : "The template fills nothing: every text field has your value.";
}
function zs(e) {
  const t = e ? jt(e) : [];
  return t.length ? `The template suggests: ${t.map((n) => `${n.field} = ${n.value}`).join(", ")}` : null;
}
function Ds(e) {
  return e?.notes.length ? e.notes.join("; ") : null;
}
function Bs(e) {
  const t = e?.mode;
  return t?.description ? `Creative mode ${t.name} (experimental): ${t.description}` : null;
}
function Hs(e, t = 44) {
  const n = e.replace(/\s+/g, " ").trim();
  return n.length > t ? `${n.slice(0, t - 1)}…` : n;
}
function bn(e, t) {
  for (const n of t) {
    const o = Pe(e, n.field);
    o && (o.value = n.value, o.callback?.(n.value));
  }
  e.setDirtyCanvas?.(!0, !0);
}
function js(e, t) {
  for (const n of t)
    n.value = "", n.callback?.("");
  e.setDirtyCanvas?.(!0, !0);
}
function po(e) {
  const t = [];
  for (const n of Fe) {
    const o = Pe(e, n);
    !o || !fo(o.value) || (o.value = "", o.callback?.(""), t.push(n));
  }
  return t.length && e.setDirtyCanvas?.(!0, !0), t;
}
const yn = "plenio_brief_template", Fs = 400;
function Ws(e, t) {
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
  const m = (g, w, v) => {
    const L = document.createElement("button");
    return L.textContent = g, L.title = w, L.addEventListener("click", ($) => {
      $.stopPropagation(), v();
    }), p.append(L), L;
  }, _ = m("Copy template text", "Fill every empty text field with the template’s text", () => {
    n && (bn(e, gn(e, n).map((g) => ({ field: g.field, value: g.value }))), M());
  }), b = m("Use template choices", "Set length, vocals and melody to the template’s choices", () => {
    n && (bn(e, jt(n)), M());
  }), E = m("Reset all to template", "Clear every text field you typed into (they fall back to the template)", () => {
    const g = wn(e);
    g.length && window.confirm(`Clear ${g.length} text field(s)? The template's values apply again.`) && (js(e, g), M());
  }), x = m("↻", "Ask again what the template fills", () => {
    N();
  }), M = () => {
    const g = qs(n, o);
    a.textContent = s ?? g ?? "The template fills nothing: every text field has your value.", a.dataset.state = s ? "error" : o && n ? "ok" : "empty";
    const w = zs(n), v = Ds(n);
    c.textContent = [w, v].filter(Boolean).join(" · "), c.style.display = c.textContent ? "" : "none", d.textContent = Bs(n) ?? "", d.style.display = d.textContent ? "" : "none", p.style.display = o && n && n.template !== "none" ? "" : "none", _.disabled = !n || !gn(e, n).length, b.disabled = !n || !jt(n).length, E.disabled = !wn(e).length, x.disabled = !1, e.setDirtyCanvas?.(!0, !0);
  }, H = /* @__PURE__ */ new WeakSet(), u = () => {
    for (const g of ["template", "arrangement", ...Object.keys(on)]) {
      const w = g === "template" || g === "arrangement" ? e.widgets?.find((v) => v.name === g) : Pe(e, g);
      !w || H.has(w) || (H.add(w), w.callback = Z(w.callback, () => {
        u(), N();
      }));
    }
  }, W = async () => {
    u();
    const g = String(e.widgets?.find((w) => w.name === "template")?.value ?? "none");
    try {
      const w = String(e.widgets?.find((v) => v.name === "arrangement")?.value ?? "");
      n = await ks(t, { fields: Is(e), template: g, kind: Rs(e), arrangement: w }), s = null;
    } catch (w) {
      n = null, s = `The template fields could not be read: ${w instanceof Error ? w.message : String(w)}`;
    }
    o = !0, M();
  };
  function N() {
    clearTimeout(r), r = setTimeout(() => {
      W();
    }, Fs);
  }
  u();
  const y = e.addDOMWidget(yn, yn, i, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 64,
    getMaxHeight: () => 128
  });
  return y.serialize = !1, po(e), M(), N(), {
    widget: y,
    refresh: N,
    answer: () => n,
    dispose: () => clearTimeout(r)
  };
}
const Gs = /* @__PURE__ */ new Set(["PlenioSongBrief", "PlenioCoverBrief"]);
function Vs(e, t) {
  const n = /* @__PURE__ */ new WeakMap(), o = e.prototype, s = o.onNodeCreated;
  o.onNodeCreated = function() {
    s?.call(this), n.set(this, Ws(this, t));
  };
  const r = o.onConfigure;
  o.onConfigure = function(i) {
    r?.call(this, i), po(this), n.get(this)?.refresh();
  };
}
const vn = "plenio.record/1", Us = 2, Ys = "PLNO", Qe = new TextEncoder().encode(`${Ys}plenio.project/1\0`), xn = 32 * 2 ** 20;
class fe extends Error {
}
async function kt(e, t, n) {
  return new Uint8Array(await e.slice(t, t + n).arrayBuffer());
}
function _t(e, t) {
  return e.length >= t.length && t.every((n, o) => e[o] === n);
}
async function Xs(e) {
  const t = e.stream().pipeThrough(new DecompressionStream("gzip")).getReader(), n = [];
  let o = 0;
  for (; ; ) {
    const { done: i, value: a } = await t.read();
    if (i) break;
    if (o += a.length, o > xn)
      throw await t.cancel(), new fe(`its Plenio project is larger than ${xn / 2 ** 20} MB`);
    n.push(a);
  }
  const s = new Uint8Array(o);
  let r = 0;
  for (const i of n)
    s.set(i, r), r += i.length;
  return new TextDecoder().decode(s);
}
async function ho(e) {
  if (!_t(await kt(e, 0, 4), new TextEncoder().encode("fLaC"))) throw new fe("it is not a FLAC file");
  let t = 4;
  for (; ; ) {
    const n = await kt(e, t, 4);
    if (n.length < 4) throw new fe("the file ends inside its metadata");
    const o = n[1] << 16 | n[2] << 8 | n[3];
    if ((n[0] & 127) === Us && o >= 4) {
      const s = await kt(e, t + 4, Math.min(o, Qe.length));
      if (_t(s, Qe.subarray(0, 4))) {
        if (!_t(s, Qe)) throw new fe("it holds a Plenio project of an unknown layout (made by a newer Plenio)");
        let r;
        try {
          r = await Xs(e.slice(t + 4 + Qe.length, t + 4 + o));
        } catch (a) {
          throw a instanceof fe ? a : new fe(`its Plenio project is damaged (${a instanceof Error ? a.message : String(a)})`);
        }
        let i;
        try {
          i = JSON.parse(r);
        } catch {
          throw new fe("its Plenio project is damaged (no JSON)");
        }
        if (i?.schema !== vn)
          throw new fe(`its Plenio project is no release record (${vn})`);
        return i;
      }
    }
    if (n[0] & 128) return null;
    t += 4 + o;
  }
}
function mo(e) {
  return /\.flac$/i.test(e.name ?? "") || e.type === "audio/flac" || e.type === "audio/x-flac";
}
const sn = "plenio.sheet_state/1", We = ["title", "style", "lyrics", "score", "artwork_prompt"];
function wt() {
  return { schema: sn, docs: {} };
}
function ke(e) {
  if (e == null || typeof e == "string" && e.trim() === "")
    return wt();
  if (typeof e != "string") return null;
  try {
    const t = JSON.parse(e);
    return t?.schema !== sn || typeof t.docs != "object" || t.docs === null ? null : t;
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
  const n = { schema: sn, docs: t };
  return e.review?.approved_fingerprint && (n.review = { approved_fingerprint: e.review.approved_fingerprint }), JSON.stringify(n);
}
function Et(e, t) {
  return e.docs[t]?.state ?? "auto";
}
function Qs(e) {
  if (e === null) return "Song Sheet state is unreadable - open the editor to repair it.";
  const t = We.filter((o) => Et(e, o) !== "auto").map(
    (o) => o === "lyrics" && Et(e, o) === "manual" ? "lyrics: yours (manual)" : `${o.replace("_", " ")} ${Et(e, o)}`
  ), n = e.review?.approved_fingerprint ? " · approved" : "";
  return (t.length ? t.join(" · ") : "all documents automatic") + n;
}
function oc(e) {
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
const sc = "Creative modes are experimental: the writer’s plan can surprise - listen, change the score here, or run again with another arrangement seed; arrangement off keeps the music model’s own plan.";
function rc(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) t.set(n, (t.get(n) ?? 0) + 1);
  return [...t].map(([n, o]) => o > 1 ? `${n} (${o} times)` : n);
}
function ic(e) {
  const t = e.kind === "cover" ? "song flow closeness" : "genre closeness";
  return `${e.mode} (${t} ${e.closeness})`;
}
function Sn(e) {
  const t = Math.max(0, e), n = Math.floor(t / 60), o = Math.round(t - n * 60);
  return `${n}:${String(o).padStart(2, "0")}`;
}
function ac(e) {
  return e?.bars?.length ? (e.sections ?? []).map(([t, n, o]) => {
    const s = e.bars[Math.max(0, n - 1)], r = e.bars[Math.min(e.bars.length - 1, n - 1 + o - 1)];
    return { label: t, bars: o, start: Sn(s?.[0] ?? 0), end: Sn(r?.[1] ?? e.duration_s) };
  }) : [];
}
function Se(e) {
  const t = e.replace(/\r\n?/g, `
`).split(`
`).map((s) => s.replace(/\s+$/, ""));
  let n = 0, o = t.length;
  for (; n < o && !t[n]; ) n++;
  for (; o > n && !t[o - 1]; ) o--;
  return t.slice(n, o).join(`
`);
}
function Js(e, t, n) {
  const o = e.docs[n];
  return o ? o.text : t?.docs[n]?.upstream ?? "";
}
function cc(e, t, n) {
  return n.map((o) => ({ kind: o, text: Js(e, t, o), intent: "keep" }));
}
function go(e, t, n) {
  const o = { ...e.docs };
  for (const r of n) {
    const i = e.docs[r.kind], a = t?.docs[r.kind], c = Se(r.text);
    if (r.intent === "auto")
      delete o[r.kind];
    else if (r.intent === "manual")
      o[r.kind] = { state: "manual", text: c };
    else if (r.intent === "rebase")
      a?.upstream_sha256 ? o[r.kind] = { state: "edited", text: c, base_sha256: a.upstream_sha256 } : o[r.kind] = { state: "manual", text: c };
    else if (i)
      Se(i.text) !== c && (o[r.kind] = { ...i, text: c });
    else {
      const d = Se(a?.upstream ?? "");
      if (c === d) continue;
      o[r.kind] = a?.upstream_sha256 ? { state: "edited", text: c, base_sha256: a.upstream_sha256 } : { state: "manual", text: c };
    }
  }
  const s = { ...wt(), docs: o };
  return e.review?.approved_fingerprint && (s.review = { approved_fingerprint: e.review.approved_fingerprint }), s;
}
function Ks(e, t) {
  return t ? { ...e, review: { approved_fingerprint: t } } : { ...e, review: void 0 };
}
function wo(e, t) {
  return We.filter((n) => e.includes(n) || t.docs[n]?.state === "manual");
}
function Zs(e) {
  const t = {};
  for (const n of e?.owned ?? []) t[n] = e?.docs[n]?.upstream ?? null;
  return t;
}
const er = "PlenioSongSheet";
function bo(e) {
  return e.nodes ?? e._nodes ?? [];
}
function tr(e, t) {
  return e.getNodeById?.(t) ?? e.getNodeById?.(Number(t)) ?? bo(e).find((o) => String(o.id) === t) ?? null;
}
function Mt(e, t) {
  let n = e, o = null;
  for (const s of t.split(":")) {
    if (!n || (o = tr(n, s), !o)) return null;
    n = o.subgraph;
  }
  return o;
}
function nr(e, t) {
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
function or(e, t) {
  const n = { values: 0, missing: [], sheets: 0, activated: 0 };
  for (const o of t.activate) {
    const s = Mt(e, o);
    s && s.mode !== 0 && (s.mode = 0, n.activated++);
  }
  for (const [o, s] of Object.entries(t.values)) {
    const r = Mt(e, o);
    if (!r) {
      n.missing.push(...Object.keys(s).map((a) => `${o}: ${a}`));
      continue;
    }
    const i = nr(r, s);
    n.values += Object.keys(s).length - i.length, n.missing.push(...i.map((a) => `${r.type}: ${a}`));
  }
  for (const [o, s] of Object.entries(t.sheets)) {
    const r = Mt(e, o)?.widgets?.find((i) => i.name === "sheet_state");
    r && (r.value = s, r.callback?.(s), n.sheets++);
  }
  return n;
}
function sr(e, t) {
  let n = 0;
  for (const o of bo(e)) {
    if (o.type !== er) continue;
    const s = o.widgets?.find((m) => m.name === "sheet_state");
    if (!s) continue;
    const r = ke(s.value) ?? { schema: "plenio.sheet_state/1", docs: {} }, i = (o.inputs ?? []).filter((m) => m.link != null).map((m) => m.name), a = wo(i, r), c = (a.length ? a : [...We]).filter((m) => !!t[m]);
    if (!c.length) continue;
    const d = { ...r.docs };
    for (const m of c) d[m] = { state: "manual", text: t[m] };
    const p = De({ ...r, docs: d, review: void 0 });
    s.value = p, s.callback?.(p), n++;
  }
  return n;
}
function rr(e, t) {
  return (e.split(/[\\/]/).pop() ?? "").replace(/\.plenio\.json$/i, "").replace(/\.(json|flac)$/i, "") || t || "Plenio song";
}
function $t(e, t) {
  const n = [e.plenio && `Plenio ${e.plenio}`, e.created.slice(0, 10)].filter(Boolean).join(", "), o = t?.sheets ? " Its title, style, lyrics and score are kept in the Song Sheets (manual): a new take seed gives new takes of the same song, the editor changes the score, Back to auto lets the workflow write a document again." : "";
  if (e.from === "record") return `"${e.title}" opened in the workflow it was made with (${n}).${o}`;
  if (e.from === "template") {
    const s = e.unplaced.length ? ` ${e.unplaced.length} node(s) of the song have no place in today's template: ${e.unplaced.join(", ")}.` : "";
    return `"${e.title}" (${n}) opened in today's template "${e.template}" with the song's settings.${o}${s}`;
  }
  return `The workflow "${e.title}" was made with cannot be rebuilt (a workflow of your own, from before records kept it).`;
}
const Ft = "Plenio was updated while this page was open: reload the page (F5).";
function ir(e) {
  const t = /\/chunks\/(main-[^/?#]+\.mjs)(?:[?#].*)?$/.exec(e);
  return t ? t[1] : null;
}
function ar(e) {
  return /chunks\/(main-[^"'?#\s]+\.mjs)/.exec(e)?.[1] ?? null;
}
async function rn(e, t) {
  const n = ir(e);
  if (!n) return !1;
  try {
    const o = await t(new URL("../plenio.js", e).href), s = o ? ar(o) : null;
    return s !== null && s !== n;
  } catch {
    return !1;
  }
}
async function an(e) {
  const t = await fetch(e, { cache: "no-store" });
  return t.ok ? await t.text() : null;
}
async function qe(e, t, n = "") {
  try {
    return await e();
  } catch (o) {
    throw await t() ? new Error(n ? `${Ft} ${n}` : Ft) : o;
  }
}
const At = "Plenio.ContinueSong", cr = "plenio.record/1";
function Wt(e, t, n, o, s = 2e4) {
  e.app.extensionManager?.toast?.add({ severity: t, summary: n, detail: o, life: s });
}
async function ft(e, t) {
  const n = await Es(e.fetcher, t);
  if (n.workflow) {
    if (!e.app.loadGraphData) throw new Error("This ComfyUI frontend cannot load a workflow for Plenio.");
    await e.app.loadGraphData(n.workflow, !0, !0, rr("path" in t ? t.path : t.name, n.title));
    const r = e.app.graph;
    if (!r) throw new Error("The workflow did not load.");
    const i = or(r, n);
    r.setDirtyCanvas?.(!0, !0), i.missing.length && console.warn("Plenio: settings of the song without a field in this workflow", i.missing), Wt(e, "success", "Song opened", $t(n, i));
    return;
  }
  const o = e.app.graph, s = o ? sr(o, n.documents) : 0;
  if (!s)
    throw new U(
      $t(n, null),
      "Open a workflow with a Song Sheet (a Plenio template) and continue again: the song's texts and score then go into its Song Sheets."
    );
  Wt(e, "success", "Song texts taken", `${$t(n, null)} Its texts and score went into this workflow's Song Sheets (${s}, manual).`);
}
async function lr(e) {
  if (mo(e)) return ho(e);
  if (!/\.json$/i.test(e.name ?? "")) return null;
  try {
    const t = JSON.parse(await e.text());
    return t?.schema === cr ? t : null;
  } catch {
    return null;
  }
}
function kn(e) {
  const t = [...e.dataTransfer?.files ?? []];
  return t.length === 1 && /\.plenio\.json$/i.test(t[0].name) ? t[0] : null;
}
function ur(e, t) {
  const n = [...e.dataTransfer?.files ?? []];
  if (n.length !== 1 || !mo(n[0]) || e.shiftKey) return null;
  const o = t.canvas, s = t.graph;
  if (!o?.canvas || e.target !== o.canvas || !o.convertEventToCanvasOffset || !s?.getNodeOnPos) return null;
  const [r, i] = o.convertEventToCanvasOffset(e);
  return s.getNodeOnPos(r, i) ? null : n[0];
}
function dr(e, t = window) {
  const n = (o) => {
    const s = kn(o) ? null : ur(o, e.app), r = s ?? kn(o);
    r && (o.preventDefault(), o.stopImmediatePropagation(), (async () => {
      if (s) {
        const a = await ho(s);
        if (a) return ft(e, { record: a, name: s.name });
        if (!e.app.handleFile) throw new U(`${s.name} carries no Plenio project.`, "Drop it with Shift held to give it to ComfyUI.");
        return e.app.handleFile(s);
      }
      const i = await lr(r);
      if (!i) throw new U(`${r.name} is no Plenio release record.`, "Drop the <name>.plenio.json that Export Release wrote next to the song.");
      await ft(e, { record: i, name: r.name });
    })().catch((i) => {
      const a = i instanceof fe ? `${r.name}: ${i.message}.` : i instanceof U && i.hint ? `${i.message} ${i.hint}` : String(i instanceof Error ? i.message : i);
      Wt(e, "error", "Song not opened", a, 3e4);
    }));
  };
  return t.addEventListener("drop", n, !0), () => t.removeEventListener("drop", n, !0);
}
async function fr(e) {
  const t = () => rn(import.meta.url, an), { openContinueDialog: n } = await qe(() => import("./openContinue-Cg6HRMn3.mjs"), t);
  n(e.fetcher, (o) => ft(e, o));
}
const pr = "COMFY_DYNAMICCOMBO_V3";
function hr(e) {
  const t = e?.widgets_values_named;
  return t && typeof t == "object" && !Array.isArray(t) ? { ...t } : Array.isArray(e?.widgets_values) ? [...e.widgets_values] : void 0;
}
function mr(e) {
  return (e.widgets ?? []).filter((t) => t.serialize !== !1);
}
function gr(e, t) {
  const n = mr(e);
  return Array.isArray(t) ? n.length === t.length && n.every((o, s) => o.value === t[s]) : n.every((o) => !(o.name in t) || o.value === t[o.name]);
}
function wr(e, t) {
  return (e.options?.values ?? []).includes(t);
}
function br(e, t, n) {
  if (!t || !e.widgets || gr(e, t)) return !1;
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
    if (n.has(r.name) && !wr(r, i)) return !0;
    r.value !== i && (r.value = i);
  }
  return !0;
}
function yr(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of Object.values(e ?? {}))
    for (const [o, s] of Object.entries(n ?? {}))
      Array.isArray(s) && s[0] === pr && t.add(o);
  return t;
}
const yo = "plenio.eq/1", at = 8, be = 20, vr = 2e4, Te = 12, vo = 15, Ae = ["peak", "low_shelf", "high_shelf"], xo = ["peak", "notch", "highpass", "lowpass"], _n = [0.2, 10], En = [0.25, 1];
function Me() {
  return { schema: yo, preamp_db: 0, bands: [] };
}
function xr(e) {
  if (typeof e != "string" || !e.trim()) return Me();
  try {
    const t = JSON.parse(e);
    return typeof t != "object" || t === null || !Array.isArray(t.bands) ? null : {
      schema: yo,
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
const ee = (e, t) => Number(e.toFixed(t));
function V(e, t, n) {
  return Math.min(n, Math.max(t, e));
}
function So(e) {
  return e.db ?? vo;
}
const Mn = [6, 12, 18], Sr = { 6: 8, 12: 14, 18: 20 };
function kr(e, t) {
  return { ...e, db: Sr[t] ?? vo };
}
function xe(e, t) {
  return Math.log(V(t, be, e.maxHz) / be) / Math.log(e.maxHz / be) * e.width;
}
function $n(e, t) {
  return be * (e.maxHz / be) ** V(t / e.width, 0, 1);
}
function we(e, t) {
  const n = So(e);
  return (1 - (V(t, -n, n) + n) / (2 * n)) * e.height;
}
function An(e, t) {
  const n = So(e);
  return (1 - V(t / e.height, 0, 1)) * 2 * n - n;
}
function Nn(e, t, n) {
  return n ? e + (t - e) * 0.2 : t;
}
function Ln(e, t, n) {
  return t.map((o, s) => `${s ? "L" : "M"}${xe(e, o).toFixed(1)},${we(e, n[s] ?? 0).toFixed(1)}`).join(" ");
}
function cn(e) {
  return Math.min(vr, 0.45 * e);
}
function _r(e) {
  const t = new Set(e.bands.map((o) => o.id));
  let n = e.bands.length + 1;
  for (; t.has(`band-${n}`); ) n++;
  return `band-${n}`;
}
function Er(e, t, n = 0, o = 48e3) {
  if (e.bands.length >= at) return null;
  const s = {
    id: _r(e),
    enabled: !0,
    type: "peak",
    frequency_hz: ee(V(t, be, cn(o)), 1),
    gain_db: ee(V(n, -Te, Te), 1),
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
        frequency_hz: ee(V(n, be, cn(s)), 1),
        gain_db: Ae.includes(r.type) ? ee(V(o, -Te, Te), 1) : r.gain_db
      }
    )
  };
}
function Nt(e, t, n) {
  return {
    ...e,
    bands: e.bands.map((o) => o.id === t ? { ...o, q: ee(V(o.q * n, 0.2, 10), 3) } : o)
  };
}
function Lt(e, t) {
  return { ...e, bands: e.bands.filter((n) => n.id !== t) };
}
function Ie(e) {
  const t = e.frequency_hz >= 1e3 ? `${ee(e.frequency_hz / 1e3, 2)} kHz` : `${Math.round(e.frequency_hz)} Hz`, n = Ae.includes(e.type) ? ` ${e.gain_db > 0 ? "+" : ""}${ee(e.gain_db, 1)} dB` : "";
  return `${e.type.replace("_", " ")} ${t}${n}, Q ${ee(e.q, 2)}`;
}
function Mr(e, t) {
  const n = ko[e.type] ?? e.type, o = e.frequency_hz >= 1e3 ? `${(e.frequency_hz / 1e3).toFixed(2)} kHz` : `${Math.round(e.frequency_hz)} Hz`, s = Ae.includes(e.type) ? ` ${e.gain_db > 0 ? "+" : ""}${e.gain_db.toFixed(1)} dB` : "", r = xo.includes(e.type) ? ` Q ${ee(e.q, 2)}` : "";
  return `● ${t + 1} ${n} ${o}${s}${r}${e.enabled ? "" : " (off)"}`;
}
const ko = {
  peak: "Bell",
  low_shelf: "Low shelf",
  high_shelf: "High shelf",
  highpass: "Low cut",
  lowpass: "High cut",
  notch: "Notch"
};
function Ct(e, { kilo: t = !1 } = {}) {
  let n = e.trim().replace(",", ".").replace(/\s*(hz|db)$/i, ""), o = 1;
  if (t && /k$/i.test(n) && (o = 1e3, n = n.slice(0, -1).trim()), !/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(n)) return null;
  const s = Number(n) * o;
  return Number.isFinite(s) ? s : null;
}
function Je(e, t) {
  const n = Number(e);
  return Number.isFinite(n) ? n : t;
}
function ct(e, t, n, o = 48e3) {
  return {
    ...e,
    bands: e.bands.map((s) => {
      if (s.id !== t) return s;
      const r = { ...s, ...n };
      return {
        ...r,
        frequency_hz: ee(V(Je(r.frequency_hz, s.frequency_hz), be, cn(o)), 1),
        gain_db: ee(V(Je(r.gain_db, s.gain_db), -Te, Te), 1),
        q: ee(V(Je(r.q, s.q), _n[0], _n[1]), 3),
        slope: ee(V(Je(r.slope, s.slope), En[0], En[1]), 2),
        enabled: r.enabled !== !1
      };
    })
  };
}
function Cn(e, t) {
  return ct(e, t, { gain_db: 0 });
}
function Tn(e, t, n, { heightFraction: o = 0.7 } = {}) {
  if (!t.length || t.length !== n.length) return "";
  const s = n.filter((m) => Number.isFinite(m));
  if (!s.length) return "";
  const r = Math.max(...s), i = Math.min(...s), a = Math.max(r - i, 1e-6), c = e.height - 4, d = c - Math.max(12, e.height * V(o, 0.1, 0.95));
  return `M${t.map((m, _) => {
    const b = n[_], E = Number.isFinite(b) ? (b - i) / a : 0;
    return `${xe(e, m).toFixed(1)},${(c - E * (c - d)).toFixed(1)}`;
  }).join(" L")} L${e.width.toFixed(1)},${c.toFixed(1)} L0,${c.toFixed(1)} Z`;
}
class $r {
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
const Ar = "http://www.w3.org/2000/svg", Pn = "plenio_eq_panel", Ke = "mode.bands", he = { capture: !0 }, se = { width: 560, height: 260 }, Ze = ["#4aa3ff", "#f0a35e", "#6fbf73", "#d873c8", "#e0c65a", "#5ac8c8", "#b28df0", "#e08a8a"];
let Tt = null;
function ue(e, t) {
  const n = document.createElementNS(Ar, e);
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
function Nr(e, t) {
  return e.bands.length === t.bands.length && e.bands.every((n, o) => {
    const s = t.bands[o];
    return s !== void 0 && n.type === s.type && n.enabled === s.enabled && Math.abs(n.frequency_hz - s.frequency_hz) < 0.5 && Math.abs(n.gain_db - s.gain_db) < 0.05 && Math.abs(n.q - s.q) < 0.01;
  });
}
function Lr(e, t) {
  const n = F("div", "plenio-eq"), o = F("div", "plenio-eq-tools"), s = F("select");
  s.setAttribute("aria-label", "EQ preset"), s.title = "EQ preset: sets every band at once (the list comes from resources/presets/eq.json)";
  const r = F("select");
  r.setAttribute("aria-label", "Gain range"), r.title = "Gain range: the dB axis of the curve and how far a drag may go";
  for (const l of Mn) r.append(new Option(`±${l} dB`, String(l)));
  const i = ve("", "↶", "Undo the last band change"), a = ve("", "↷", "Redo the last band change"), c = ve("", "reset", "Remove every band"), d = ve("", "compare", "Show the curve without the EQ (bypass)"), p = ve("", "bands as text", "Show or hide the plenio.eq/1 JSON widget"), m = F("span", "plenio-eq-info");
  m.setAttribute("aria-live", "polite"), m.title = "What the panel is showing right now (the selected band, a note, or a hint)", o.append(s, r, i, a, c, d, p, m);
  const _ = F("div", "plenio-eq-mode"), b = ue("svg", {
    viewBox: `0 0 ${se.width} ${se.height}`,
    class: "plenio-eq-plot",
    role: "img",
    preserveAspectRatio: "none"
  });
  b.setAttribute("aria-label", "EQ response curve"), b.setAttribute("tabindex", "0"), b.setAttribute("title", "Drag a handle to move a band (Shift = fine), wheel = Q, double-click = new band, Delete = remove");
  const E = F("div", "plenio-eq-strip"), x = F("div", "plenio-eq-editor"), M = F("div", "plenio-eq-fields");
  x.append(M), n.append(o, _, b, E, x);
  const H = e.addDOMWidget(Pn, Pn, n, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 420,
    getMaxHeight: () => 620
  });
  H.serialize = !1;
  let u = { sampleRate: 48e3, frequencies: [], response: [], settings: Me(), readonly: !0, note: "" }, W = null, N = null, y = !1, g = 12, w = null, v = [], L = 0, $, Y, z = null, q = !1;
  const D = /* @__PURE__ */ new Map();
  let j = null;
  const C = new $r(Me()), pe = () => de(e, Ke), te = () => g, T = () => kr({ ...se, maxHz: Math.min(2e4, u.sampleRate / 2) }, te());
  function O(l, { record: h = !0 } = {}) {
    const f = pe();
    if (!f) return;
    const S = $e(l);
    f.value = S, f.callback?.(S), h && C.push(l), u = { ...u, settings: l }, X(), ae(0);
  }
  async function ae(l = 120) {
    clearTimeout($), $ = setTimeout(async () => {
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
        } : u = { ...u, readonly: !0 }, X();
        return;
      }
      const f = xr(pe()?.value);
      if (!f) {
        u = { ...u, readonly: !0, note: "the bands are not valid JSON" }, X();
        return;
      }
      $e(f) !== $e(C.current) && C.reset(f);
      const S = ++L;
      try {
        const A = await hn(t, f, u.sampleRate);
        if (S !== L) return;
        u = {
          ...u,
          frequencies: A.frequency_hz,
          response: A.response_db,
          settings: A.settings,
          readonly: !1,
          note: ""
        };
      } catch (A) {
        u = { ...u, readonly: !1, note: A instanceof Error ? A.message : String(A) };
      }
      X();
    }, l);
  }
  const Ve = (l) => ({
    ...l.settings,
    bands: l.settings.bands.slice(0, at)
  });
  function ce() {
    if (!w) return "";
    const l = v.find((h) => h.name === w);
    return l && Nr(Ve(l), u.settings) ? w : "";
  }
  function X() {
    b.replaceChildren(), D.clear(), j = null;
    const l = T();
    for (const f of [-l.db, -l.db / 2, 0, l.db / 2, l.db])
      b.append(
        ue("line", { x1: 0, x2: l.width, y1: we(l, f), y2: we(l, f), class: f ? "grid" : "grid zero" })
      );
    for (const f of [100, 1e3, 1e4])
      b.append(ue("line", { x1: xe(l, f), x2: xe(l, f), y1: 0, y2: l.height, class: "grid" }));
    u.beforeDb?.length === u.frequencies.length && b.append(ue("path", { d: Tn(l, u.frequencies, u.beforeDb), class: "spectrum before" })), u.afterDb?.length === u.frequencies.length && b.append(ue("path", { d: Tn(l, u.frequencies, u.afterDb), class: "spectrum after" })), y ? b.append(ue("line", { x1: 0, x2: l.width, y1: we(l, 0), y2: we(l, 0), class: "curve flat" })) : u.frequencies.length && (j = ue("path", { d: Ln(l, u.frequencies, u.response), class: "curve" }), b.append(j)), !u.readonly && !y && u.settings.bands.forEach((f, S) => {
      const A = Ze[S % Ze.length], I = Ae.includes(f.type) ? f.gain_db : 0, k = ue("circle", {
        cx: xe(l, f.frequency_hz),
        cy: we(l, I),
        r: f.id === N ? 9 : 7,
        class: f.id === N ? "handle selected" : "handle",
        style: `stroke: ${A}`,
        tabindex: 0,
        "data-band": f.id
      });
      k.setAttribute("aria-label", `Band ${S + 1}: ${Ie(f)}`), f.enabled || k.classList.add("disabled"), k.append(ue("title", {})), k.lastChild.textContent = `Band ${S + 1}: ${Ie(f)}`, k.addEventListener("pointerdown", (B) => fs(B, f.id)), k.addEventListener("dblclick", (B) => {
        B.stopPropagation(), O(Cn(u.settings, f.id));
      }), k.addEventListener("focus", () => ls(f.id)), k.addEventListener("keydown", (B) => un(B, f.id)), k.addEventListener("wheel", (B) => {
        B.preventDefault();
        const ye = B.deltaY < 0 ? 1.15 : 1 / 1.15;
        O(Nt(u.settings, f.id, ye));
      }), k.addEventListener("contextmenu", (B) => {
        B.preventDefault(), O(Lt(u.settings, f.id));
      }), b.append(k), D.set(f.id, k);
    }), is(), as(), cs();
    const h = u.settings.bands.find((f) => f.id === N);
    m.textContent = u.note || (y ? "compare: the curve is off (the node still applies it)" : h ? Ie(h) : u.readonly ? `${u.settings.bands.length} band(s)` : `drag a handle, Shift = fine, wheel = Q, double-click = add · ${u.settings.bands.length}/${at}`), s.disabled = u.readonly, i.disabled = !C.canUndo, a.disabled = !C.canRedo, c.disabled = u.readonly || !u.settings.bands.length, q && (q = !1, N && D.get(N)?.focus({ preventScroll: !0 })), r.value = String(g), s.value = ce(), d.classList.toggle("active", y), p.classList.toggle("active", yt()), e.setDirtyCanvas?.(!0, !0);
  }
  function is() {
    if (E.replaceChildren(), u.readonly && !u.settings.bands.length) {
      E.append(F("span", "plenio-eq-hint", u.note || "no bands"));
      return;
    }
    u.settings.bands.forEach((l, h) => {
      const f = F("button", "plenio-eq-chip", Mr(l, h));
      f.style.borderLeftColor = Ze[h % Ze.length], f.classList.toggle("selected", l.id === N), f.classList.toggle("disabled", !l.enabled), f.setAttribute("aria-label", `Edit band ${h + 1}`), f.title = `Band ${h + 1}: ${Ie(l)} - click to open its fields`, f.addEventListener("click", (S) => {
        S.stopPropagation(), N = N === l.id ? null : l.id, X();
      }), E.append(f);
    });
  }
  function as() {
    M.replaceChildren();
    const l = u.settings.bands.find((k) => k.id === N);
    if (!l || u.readonly) {
      x.style.display = "none";
      return;
    }
    x.style.display = "";
    const h = F("span", "name", `Band ${u.settings.bands.indexOf(l) + 1}`);
    h.title = "The selected band";
    const f = F("select");
    f.setAttribute("aria-label", "Band type"), f.title = "Band type: bell and shelves change the gain, the cuts and the notch do not";
    for (const [k, B] of Object.entries(ko)) f.append(new Option(B, k));
    f.value = l.type, f.addEventListener("change", () => O(ct(u.settings, l.id, { type: f.value })));
    const S = F("input");
    S.type = "checkbox", S.checked = l.enabled, S.setAttribute("aria-label", "Band enabled"), S.title = "Band enabled: off keeps the band in the list but out of the response", S.addEventListener("change", () => O(ct(u.settings, l.id, { enabled: S.checked })));
    const A = [
      [
        "Hz",
        `${l.frequency_hz}`,
        70,
        (k) => xt(l.id, "frequency_hz", Ct(k, { kilo: !0 }))
      ],
      ["dB", `${l.gain_db}`, 60, (k) => xt(l.id, "gain_db", Ct(k))],
      ["Q", `${l.q}`, 60, (k) => xt(l.id, "q", Ct(k))]
    ];
    M.append(h, f, S);
    for (const [k, B, ye, Ue] of A) {
      const Q = F("input", "number");
      Q.value = B, Q.style.width = `${ye}px`, Q.setAttribute("aria-label", `Band ${k}`), Q.title = k === "Hz" ? "Frequency of the band in Hz (the centre of a bell, the corner of a shelf)" : k === "dB" ? "Gain in dB (bell and shelves; the cuts and the notch have none)" : "Q: how narrow the band is - higher Q, smaller range";
      const Ye = () => {
        Ue(Q.value) || (Q.value = B);
      };
      Q.addEventListener("keydown", (le) => {
        le.key === "Enter" && Ye();
      }), Q.addEventListener("blur", Ye), (k === "dB" && !Ae.includes(l.type) || k === "Q" && !xo.includes(l.type)) && (Q.disabled = !0), M.append(Q);
    }
    const I = ve("", "remove", "Remove this band");
    I.addEventListener("click", (k) => {
      k.stopPropagation(), N = null, O(Lt(u.settings, l.id));
    }), M.append(I);
  }
  function cs() {
    _.replaceChildren();
    const l = String(de(e, "mode")?.value ?? "flat");
    if (l === "manual" || l === "flat") {
      _.style.display = "none";
      return;
    }
    _.style.display = "", _.append(
      F(
        "span",
        "plenio-eq-hint",
        W === l ? `applied proposal (${u.settings.bands.length} band(s), ${l})` : `${l}: no proposal yet - it is computed on the next run`
      )
    );
    const h = ve("", "Edit these bands", "Copy the proposal into manual bands and edit it");
    h.disabled = !u.settings.bands.length, h.addEventListener("click", (f) => {
      f.stopPropagation();
      const S = de(e, "mode");
      if (!S) return;
      S.value = "manual", S.callback?.("manual");
      const A = pe();
      if (A) {
        const I = $e(u.settings);
        A.value = I, A.callback?.(I);
      }
      C.reset(u.settings), St(), ae(0);
    }), _.append(h);
  }
  function ls(l) {
    N = l, q = !0, X();
  }
  function us(l) {
    N = l, bt();
  }
  function bt() {
    const l = T();
    u.settings.bands.forEach((f) => {
      const S = D.get(f.id);
      if (!S) return;
      const A = Ae.includes(f.type) ? f.gain_db : 0;
      S.setAttribute("cx", String(xe(l, f.frequency_hz))), S.setAttribute("cy", String(we(l, A))), S.classList.toggle("selected", f.id === N), S.setAttribute("r", f.id === N ? "9" : "7");
    }), j && u.frequencies.length && j.setAttribute("d", Ln(l, u.frequencies, u.response));
    const h = u.settings.bands.find((f) => f.id === N);
    h && (m.textContent = Ie(h));
  }
  function ds() {
    clearTimeout(Y), Y = setTimeout(async () => {
      const l = u.settings, h = ++L;
      try {
        const f = await hn(t, l, u.sampleRate);
        if (h !== L) return;
        u = { ...u, frequencies: f.frequency_hz, response: f.response_db }, bt();
      } catch {
      }
    }, 60);
  }
  function yt() {
    return !de(e, Ke)?.plenioHidden;
  }
  function vt(l) {
    const h = de(e, Ke);
    h && (h.plenioHidden = !l, l ? delete h.computeSize : h.computeSize = () => [0, -4], e.setDirtyCanvas?.(!0, !0));
  }
  function xt(l, h, f) {
    if (f === null) return !1;
    const S = u.settings.bands.find((A) => A.id === l);
    return S && S[h] === f || O(ct(u.settings, l, { [h]: f })), !0;
  }
  function fs(l, h) {
    l.preventDefault(), l.stopPropagation(), N !== h && us(h);
    const f = u.settings.bands.find((ne) => ne.id === h);
    if (!f) return;
    z = { hz: f.frequency_hz, db: f.gain_db };
    let S = !1, A = !1;
    const I = l.currentTarget;
    try {
      I?.setPointerCapture?.(l.pointerId);
    } catch {
    }
    const k = b.getBoundingClientRect(), B = k.width ? k.left : 0, ye = k.height ? k.top : 0, Ue = k.width || se.width, Q = k.height || se.height, Ye = (ne, Xe) => ne >= B - 1 && ne <= B + Ue + 1 && Xe >= ye - 1 && Xe <= ye + Q + 1;
    function le() {
      if (!A) {
        A = !0;
        try {
          I?.releasePointerCapture?.(l.pointerId);
        } catch {
        }
        window.removeEventListener("pointermove", pn, he), window.removeEventListener("pointerup", le, he), window.removeEventListener("pointercancel", le, he), window.removeEventListener("blur", le, he), z = null, S && O(u.settings);
      }
    }
    const pn = (ne) => {
      if (A || !z) return;
      if (ne.buttons === 0) {
        le();
        return;
      }
      if (!Ye(ne.clientX, ne.clientY)) return;
      const Xe = se.width / Ue, hs = se.height / Q, ms = (ne.clientX - B) * Xe, gs = (ne.clientY - ye) * hs, ws = xe(T(), z.hz), bs = we(T(), z.db), ys = $n(T(), Nn(ws, ms, ne.shiftKey)), vs = An(T(), Nn(bs, gs, ne.shiftKey));
      u = { ...u, settings: Oe(u.settings, h, ys, vs, u.sampleRate) }, S = !0, bt(), ds();
    };
    window.addEventListener("pointermove", pn, he), window.addEventListener("pointerup", le, he), window.addEventListener("pointercancel", le, he), window.addEventListener("blur", le, he);
  }
  function un(l, h) {
    const f = u.settings.bands.find((k) => k.id === h);
    if (!f) return;
    const S = l.shiftKey ? 0.1 : 0.5, A = l.shiftKey ? 1.01 : 1.06;
    let I = null;
    l.key === "ArrowUp" ? I = Oe(u.settings, h, f.frequency_hz, f.gain_db + S, u.sampleRate) : l.key === "ArrowDown" ? I = Oe(u.settings, h, f.frequency_hz, f.gain_db - S, u.sampleRate) : l.key === "ArrowRight" ? I = Oe(u.settings, h, f.frequency_hz * A, f.gain_db, u.sampleRate) : l.key === "ArrowLeft" ? I = Oe(u.settings, h, f.frequency_hz / A, f.gain_db, u.sampleRate) : l.key === "+" ? I = Nt(u.settings, h, 1.15) : l.key === "-" ? I = Nt(u.settings, h, 1 / 1.15) : l.key === "0" ? I = Cn(u.settings, h) : (l.key === "Delete" || l.key === "Backspace") && (I = Lt(u.settings, h)), I && (l.preventDefault(), O(I));
  }
  b.addEventListener("keydown", (l) => {
    N && l.target === b && un(l, N);
  }), b.addEventListener("dblclick", (l) => {
    if (u.readonly || y) return;
    const h = b.getBoundingClientRect(), f = se.width / (h.width || se.width), S = se.height / (h.height || se.height), A = (l.clientX - h.left) * f, I = (l.clientY - h.top) * S, k = Er(u.settings, $n(T(), A), An(T(), I), u.sampleRate);
    k ? (N = k.bands[k.bands.length - 1].id, O(k)) : (u = { ...u, note: `the EQ has at most ${at} bands` }, X());
  }), s.append(new Option("preset…", "")), Tt ??= _s(t).then((l) => l.manual).catch(() => []), Tt.then((l) => {
    v = l;
    for (const h of l) s.append(new Option(h.name, h.name));
    s.value = ce();
  }), s.addEventListener("change", async () => {
    const l = (await Tt)?.find((h) => h.name === s.value);
    l && (w = l.name, O(Ve(l)));
  }), r.addEventListener("change", () => {
    const l = Number(r.value);
    g = Mn.find((h) => h === l) ?? 12, X();
  }), i.addEventListener("click", () => {
    const l = C.undo();
    l && O(l, { record: !1 });
  }), a.addEventListener("click", () => {
    const l = C.redo();
    l && O(l, { record: !1 });
  }), c.addEventListener("click", () => {
    N = null, O(Me());
  }), d.addEventListener("click", () => {
    y = !y, X();
  }), p.addEventListener("click", () => {
    vt(!yt()), X();
  });
  function St() {
    for (const l of ["mode", Ke]) {
      const h = de(e, l);
      if (!h || h.plenioWatched) continue;
      h.plenioWatched = !0;
      const f = h.callback;
      h.callback = (S) => {
        f?.(S), setTimeout(() => {
          yt() || vt(!1), ae();
        });
      };
    }
  }
  St(), vt(!1), ae(0);
  let dn = null, fn = null;
  const ps = setInterval(() => {
    if (!n.isConnected) {
      clearInterval(ps);
      return;
    }
    const l = String(de(e, "mode")?.value ?? "flat"), h = String(pe()?.value ?? "");
    l === dn && h === fn || (dn = l, fn = h, St(), ae(0));
  }, 700);
  return {
    showExecuted(l) {
      const h = l?.plenio_eq, f = h?.[h.length - 1];
      if (!f) return;
      const S = String(de(e, "mode")?.value ?? "flat"), A = S === "manual";
      W = A || S === "flat" ? null : S, u = {
        sampleRate: f.sample_rate,
        frequencies: f.frequency_hz,
        response: f.response_db,
        settings: f.settings,
        readonly: !A,
        note: A ? "" : `applied: ${f.settings.bands.length} band(s)`,
        beforeDb: f.spectrum_before_db,
        afterDb: f.spectrum_after_db
      }, A ? ae(0) : X();
    }
  };
}
const ln = {
  PlenioSongBrief: "one song, stop to review",
  PlenioCoverBrief: "one cover, stop to review"
}, Cr = new Set(Fe.map((e) => on[e]));
function Tr(e, t) {
  return !(e in ln) || !t || typeof t != "object" || Array.isArray(t) ? [] : Object.entries(t).filter(([n, o]) => Cr.has(n) && fo(o)).map(([n]) => n);
}
function Pr(e, t) {
  for (const n of Object.values(e.input ?? {})) {
    const o = n?.[t];
    if (!Array.isArray(o)) continue;
    if (Array.isArray(o[0])) return o[0];
    const s = o[1]?.options;
    return Array.isArray(s) ? s : [];
  }
  return [];
}
const Or = {
  PlenioSongBrief: { arrangement: { simple: "off" } },
  PlenioCoverBrief: { arrangement: { simple: "off" } }
};
function Ir(e, t) {
  const n = Or[e];
  if (!n) return [];
  const o = [];
  for (const s of t ?? []) {
    const r = n[s.name]?.[String(s.value)];
    r !== void 0 && (s.value = r, o.push(s.name));
  }
  return o;
}
const On = 6, Rr = 8, qr = 18;
function zr(e) {
  if (e[On] !== "tags" || e.length > qr) return e;
  const t = On + 1 + Rr;
  return [...e.slice(0, t), "", ...e.slice(t)];
}
function Dr(e, t) {
  if (e.name === "PlenioExportRelease" && t && Array.isArray(t.widgets_values)) {
    const c = zr(t.widgets_values);
    return c === t.widgets_values ? t : { ...t, widgets_values: c };
  }
  const n = ln[e.name];
  if (!n || !t) return t;
  const o = Pr(e, "mode"), s = t.widgets_values, r = t.widgets_values_named;
  let i = t;
  Array.isArray(s) && s.length && !o.includes(s[0]) && (i = { ...i, widgets_values: [n, ...s] }), r && typeof r == "object" && !Array.isArray(r) && !("mode" in r) && (i = { ...i, widgets_values_named: { mode: n, ...r } });
  const a = Tr(e.name, i.widgets_values_named);
  if (a.length) {
    const c = { ...i.widgets_values_named };
    for (const d of a) c[d] = "";
    i = { ...i, widgets_values_named: c };
  }
  return i;
}
const _o = /* @__PURE__ */ new Map(), Gt = /* @__PURE__ */ new Set();
function In(e, t) {
  _o.set(e, t);
  for (const n of Gt) n(e);
}
function Ee(e) {
  return _o.get(e) ?? null;
}
function Br(e) {
  return Gt.add(e), () => Gt.delete(e);
}
const Eo = /* @__PURE__ */ new Map();
function Hr(e) {
  e?.draft_sha256 && Eo.set(e.draft_sha256, e);
}
function jr(e) {
  return e ? Eo.get(e) ?? null : null;
}
const Rn = "Plenio.OpenPlayer", qn = "plenio-player", Fr = "▶ Open in the Plenio Player";
function Vt(e, t, n, o, s = 12e3) {
  e.extensionManager?.toast?.add({ severity: t, summary: n, detail: o, life: s });
}
async function Wr(e) {
  const t = await e.fetchApi("/plenio/player/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  }), n = await t.json().catch(() => ({}));
  if (!t.ok) {
    const o = n?.error ?? {};
    throw new U(o.message ?? `The Plenio Player did not start (${t.status})`, o.hint ?? null);
  }
  return n;
}
function zn(e, t) {
  const n = e.endsWith("/") ? e : `${e}/`;
  return t ? `${n}#/record/${encodeURIComponent(t)}` : `${n}#/`;
}
async function Ut(e, t = null, n = window) {
  const o = n.open("", qn);
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
    const r = await Wr(e.fetcher);
    o ? ((s || t) && (o.location.href = zn(r.url, t)), o.focus()) : n.open(zn(r.url, t), qn), r.started && Vt(e.app, "success", "Plenio Player started", `${r.url} - it keeps running when ComfyUI stops; stop it on its Settings page.`);
  } catch (r) {
    o && s && o.close();
    const i = r instanceof U && r.hint ? ` ${r.hint}` : "";
    Vt(e.app, "error", "Plenio Player", `${r instanceof Error ? r.message : String(r)}${i}`, 2e4);
  }
}
function Gr(e, t) {
  const n = /* @__PURE__ */ new WeakMap(), o = e.prototype, s = o.onNodeCreated;
  o.onNodeCreated = function() {
    s?.call(this);
    const i = this.addWidget?.("button", Fr, null, () => {
      Ut(t, n.get(this) ?? null);
    }, { serialize: !1 });
    i && (i.serialize = !1);
  }, e.prototype.onExecuted = Z(e.prototype.onExecuted, function(r) {
    const i = r?.plenio_player, a = i?.[i.length - 1]?.record;
    a && n.set(this, a);
  });
}
const Vr = /* @__PURE__ */ new Set(["127.0.0.1", "localhost", "[::1]"]);
function Ur(e, t) {
  if (e === t) return !0;
  try {
    const n = new URL(e);
    return n.protocol !== "http:" && n.protocol !== "https:" ? !1 : Vr.has(n.hostname) || n.hostname === new URL(t).hostname;
  } catch {
    return !1;
  }
}
function Yr(e, t = window, n = 1500) {
  const o = new URLSearchParams(t.location.search);
  if (o.get("plenio") !== "continue") return !1;
  o.delete("plenio");
  const s = o.toString();
  t.history.replaceState(t.history.state, "", `${t.location.pathname}${s ? `?${s}` : ""}${t.location.hash}`);
  const r = t.opener;
  if (!r) return !0;
  const i = (a) => {
    const c = a.data;
    c?.type !== "plenio-continue" || a.source !== r || !Ur(a.origin, t.location.origin) || (t.removeEventListener("message", i), ft(e, { record: c.record, name: String(c.name || "the Plenio Player") }).catch((d) => {
      const p = d instanceof U && d.hint ? ` ${d.hint}` : "";
      Vt(e.app, "error", "Continue a song", `${d instanceof Error ? d.message : String(d)}${p}`, 2e4);
    }));
  };
  return t.addEventListener("message", i), t.setTimeout(() => r.postMessage({ type: "plenio-ready" }, "*"), n), !0;
}
const Xr = {
  "one song, stop to review": "new song every run",
  "one cover, stop to review": "new cover every run"
}, Qr = 2e3, Jr = 3e4;
function Kr(e, t, n, o) {
  const s = Xr[t];
  return !s || n <= 0 && o <= 1 ? null : {
    summary: "These runs stop for your review",
    detail: `${e}: "${t}" - each run waits at the Song Sheets until you press Approve, so queued runs render nothing by themselves. For runs that go through, choose "${s}" in the brief's mode.`
  };
}
class Zr {
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
    this.recent = [...this.recent.filter((r) => o - r < Qr), o];
    const s = Kr(t, n, this.queued, this.recent.length);
    !s || o - this.lastNotice < Jr || (this.lastNotice = o, this.notify(s));
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
const Pt = {
  stop: { icon: "⏸", label: "review stop", color: "#2f6fb0", frame: !1 },
  waiting: { icon: "⏸", label: "waiting for your approval", color: "#c98a12", frame: !0 },
  approved: { icon: "✓", label: "approved", color: "#2f8a55", frame: !1 },
  ok: { icon: "✓", label: "", color: "#2f8a55", frame: !1 },
  warning: { icon: "⚠", label: "warning", color: "#b87a0a", frame: !1 },
  error: { icon: "✖", label: "error", color: "#c0392b", frame: !0 },
  skipped: { icon: "–", label: "not needed", color: "#5d6b80", frame: !1 }
};
function ei(e) {
  return e === "ok" || e === "warning" || e === "error" || e === "skipped" ? e : null;
}
function ti(e, t) {
  return e === "stop for review" ? !0 : e === "as the brief says" ? !!t && t.includes("stop to review") : !1;
}
function Mo(e) {
  if (/^(conflict|invalid)/.test(e.status)) return "error";
  if (e.waiting) return "waiting";
  if (e.review === "stop for review" && e.approved) return "approved";
  const t = new Set(e.findings.map((n) => n.severity));
  return t.has("error") ? "error" : t.has("warning") ? "warning" : "ok";
}
function ni(e) {
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
const pt = /* @__PURE__ */ new WeakMap(), Be = /* @__PURE__ */ new Set();
function $o(e) {
  return pt.get(e) ?? null;
}
function Ne(e, t) {
  t ? pt.set(e, t) : pt.delete(e), e.setDirtyCanvas?.(!0, !0);
  for (const n of Be) n(e);
}
function oi(e) {
  for (const t of e) pt.delete(t);
  for (const t of Be) t(null);
}
function si() {
  for (const e of Be) e(null);
}
function ri(e) {
  return Be.add(e), () => Be.delete(e);
}
const Dn = "600 12px sans-serif", et = 20, Ot = 7;
function ii(e) {
  return e.label ? `${e.icon} ${e.label}` : e.icon;
}
function ai(e) {
  const t = e ? ii(e) : "";
  return {
    height: e ? et : 0,
    getWidth(n) {
      if (!e) return 0;
      n.save(), n.font = Dn;
      const o = n.measureText(t).width + 2 * Ot;
      return n.restore(), o;
    },
    draw(n, o, s) {
      if (!e) return;
      n.save(), n.font = Dn;
      const r = n.measureText(t).width + 2 * Ot;
      n.fillStyle = e.color, n.beginPath(), typeof n.roundRect == "function" ? n.roundRect(o, s, r, et, 5) : n.rect(o, s, r, et), n.fill(), n.fillStyle = "#ffffff", n.textBaseline = "middle", n.fillText(t, o + Ot, s + et / 2 + 0.5), n.restore();
    }
  };
}
const ci = "PlenioSongSheet", li = 30;
function Ao(e, t) {
  const n = e.widgets?.find((o) => o.name === t);
  return n ? String(n.value ?? "") : null;
}
function ui(e) {
  const t = e.inputs?.findIndex((n) => n.name === "brief") ?? -1;
  if (t < 0) return null;
  try {
    const n = e.getInputNode?.(t);
    return n ? Ao(n, "mode") : null;
  } catch {
    return null;
  }
}
function Yt(e) {
  const t = $o(e);
  return t || (e.type !== ci ? null : ti(Ao(e, "review") ?? "continue", ui(e)) ? "stop" : null);
}
function di(e) {
  const t = e?.plenio_sheet, n = t?.[t.length - 1];
  if (n) return Mo(n);
  const o = e?.plenio_summary;
  return ei(o?.[o.length - 1]?.status);
}
function fi(e, t) {
  const n = e.prototype, o = n.onNodeCreated;
  n.onNodeCreated = function() {
    o?.call(this);
    const s = this;
    s.badges?.push(() => {
      const r = Yt(s);
      return ai(r ? Pt[r] : null);
    });
  }, n.onDrawForeground = Z(n.onDrawForeground, function(s) {
    const r = Yt(this);
    !r || !Pt[r].frame || this.flags?.collapsed || !this.size || pi(s, Pt[r], this.size, li, t.scale());
  }), n.onExecuted = Z(n.onExecuted, function(s) {
    const r = di(s);
    r && (Ne(this, r), r === "waiting" && t.toast(
      `Stopped at ${this.title || "the Song Sheet"}`,
      'Waiting for your approval: open it with "Edit Song Sheet…", check the documents, press Approve, then run again.'
    ));
  });
}
function pi(e, t, n, o, s) {
  const r = Math.max(3, 3 / Math.max(s, 0.05));
  e.save(), e.strokeStyle = t.color, e.lineWidth = r, e.beginPath();
  const i = r / 2 + 3;
  typeof e.roundRect == "function" ? e.roundRect(-i, -o - i, n[0] + 2 * i, n[1] + o + 2 * i, 10) : e.rect(-i, -o - i, n[0] + 2 * i, n[1] + o + 2 * i), e.stroke(), e.restore();
}
function lc(e, t) {
  const n = [];
  let o = 0;
  return e.bars.forEach((s, r) => {
    const i = t?.[r] ?? null, a = i && i[1] > i[0] ? [i[0], i[1]] : null, c = a ? a[1] - a[0] : s.duration_s;
    n.push({ scoreStart: s.start_s, scoreDur: s.duration_s, realStart: o, realDur: c, source: a }), o += c;
  }), n;
}
function No(e, t, n) {
  let o = null;
  for (const s of e)
    if (s[n] <= t + K) o = s;
    else break;
  return o ?? e[0] ?? null;
}
function _e(e, t) {
  const n = No(e, t, "scoreStart");
  if (!n) return t;
  const o = n.scoreDur > 0 ? (t - n.scoreStart) / n.scoreDur : 0;
  return n.realStart + o * n.realDur;
}
function hi(e, t) {
  const n = No(e, t, "realStart");
  if (!n) return t;
  const o = n.realDur > 0 ? (t - n.realStart) / n.realDur : 0;
  return n.scoreStart + o * n.scoreDur;
}
function uc(e, t, n) {
  const o = _e(e, t), s = n == null ? 1 / 0 : _e(e, n), r = [];
  for (const i of e) {
    if (!i.source) continue;
    const a = i.realStart + i.realDur, c = Math.max(i.realStart, o), d = Math.min(a, s);
    if (d <= c + K) continue;
    let p = i.source[0] + (c - i.realStart) / i.realDur * (i.source[1] - i.source[0]), m = c - o, _ = d - c;
    if (p < 0 && (m -= p, _ += p, p = 0, _ <= K))
      continue;
    const b = r.at(-1);
    b && Math.abs(b.at + b.duration - m) < K && Math.abs(b.offset + b.duration - p) < 0.01 ? b.duration += _ : r.push({ at: m, offset: p, duration: _ });
  }
  return r;
}
const Lo = 0.04, K = 1e-3, mi = 0.25, gi = 2;
function ht(e) {
  return Math.min(gi, Math.max(mi, Number.isFinite(e) ? e : 1));
}
function dc(e, t) {
  const n = ht(t.speed), o = t.to ?? e.duration_s, s = [], r = t.clock?.length ? t.clock : null, i = r ? _e(r, t.from) : t.from, a = (c) => (r ? _e(r, c) : c) - i;
  for (const c of ["Vocal", "Ins"])
    if (t.voices[c])
      for (const d of e.notes?.[c] ?? []) {
        if (d.start_s < t.from - K || d.start_s >= o - K) continue;
        const p = Math.min(d.start_s + d.duration_s, o), m = Math.max(0, a(d.start_s));
        s.push({ at: m / n, duration: (a(p) - m) / n, midi: d.midi, part: c });
      }
  if (t.voices.chords)
    for (const c of e.chords ?? []) {
      const d = Math.min(c.start_s + c.duration_s, o), p = Math.max(c.start_s, t.from);
      if (!(d <= p + K))
        for (const m of c.pitches)
          s.push({ at: a(p) / n, duration: (a(d) - a(p)) / n, midi: m, part: "chord" });
    }
  if (t.voices.guide)
    for (const c of t.guide ?? []) {
      if (c.start_s < t.from - K || c.start_s >= o - K) continue;
      const d = Math.min(c.start_s + c.duration_s, o), p = Math.max(0, a(c.start_s));
      s.push({ at: p / n, duration: (a(d) - p) / n, midi: c.midi, part: "guide" });
    }
  if (t.metronome)
    for (const c of e.bars) {
      const d = Number(c.meter.split("/")[0]) || 1;
      for (let p = 0; p < d; p++) {
        const m = c.start_s + p * c.duration_s / d;
        m < t.from - K || m >= o - K || s.push({
          at: Math.max(0, a(m)) / n,
          duration: Lo,
          midi: p === 0 ? 96 : 89,
          part: "click"
        });
      }
    }
  return s.sort((c, d) => c.at - d.at || c.midi - d.midi);
}
function fc(e, t) {
  const n = Math.max(t.from, t.to ?? e.duration_s), o = t.clock?.length ? t.clock : null, s = o ? _e(o, n) - _e(o, t.from) : n - t.from;
  return Math.max(0, s) / ht(t.speed);
}
function pc(e, t, n, o, s, r) {
  const i = e && t > 0 ? e.duration_s / t : 0, a = e && i > 0 ? Math.max(0, n - e.start_s) : 0, c = i > 0 ? Math.floor(a / i + 1e-6) : 0, d = i > 0 ? (a - c * i) / i * r : 0, p = d > 1e-3 ? 0 : 1, m = Math.max(0, o * t);
  return Array.from({ length: m }, (_, b) => {
    const E = p + m - 1 - b, x = ((c - E) % t + t) % t === 0;
    return { at: Math.max(0, s - d - E * r), duration: Lo, midi: x ? 96 : 89, part: "click" };
  });
}
function hc(e, t) {
  const n = e.clock?.length ? e.clock : null;
  return n ? hi(n, _e(n, e.from) + t * ht(e.speed)) : e.from + t * ht(e.speed);
}
function mc(e, t, n) {
  return (e.elements ?? []).filter(
    (o) => o.kind === "note" && n[o.voice] && o.start_s <= t + K && t < o.start_s + o.duration_s - K
  ).map((o) => o.id);
}
function wi(e) {
  return 440 * 2 ** ((e - 69) / 12);
}
const bi = [
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
], gc = {
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
  return typeof e == "string" && bi.includes(e);
}
function Co() {
  return { Vocal: "soft", Ins: "plain", chord: "plain", guide: "plain" };
}
function yi(e) {
  const t = Co(), n = typeof e == "object" && e !== null ? e : {};
  return {
    Vocal: tt(n.Vocal) ? n.Vocal : t.Vocal,
    Ins: tt(n.Ins) ? n.Ins : t.Ins,
    chord: tt(n.chord) ? n.chord : t.chord,
    guide: tt(n.guide) ? n.guide : t.guide
  };
}
const vi = {
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
}, Bn = /* @__PURE__ */ new WeakMap();
function It(e, t, n) {
  let o = Bn.get(e);
  o || Bn.set(e, o = /* @__PURE__ */ new Map());
  let s = o.get(t);
  if (!s) {
    const r = new Float32Array(n.length + 1), i = new Float32Array(n.length + 1);
    n.forEach((a, c) => i[c + 1] = a), s = e.createPeriodicWave(r, i), o.set(t, s);
  }
  return s;
}
const Hn = /* @__PURE__ */ new WeakMap();
function To(e) {
  let t = Hn.get(e);
  if (!t) {
    t = e.createBuffer(1, e.sampleRate, e.sampleRate);
    const n = t.getChannelData(0);
    let o = 1;
    for (let s = 0; s < n.length; s++)
      o = o * 16807 % 2147483647, n[s] = o / 2147483647 * 2 - 1;
    Hn.set(e, t);
  }
  return t;
}
function P(e, t, n, o = 0) {
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
function Re(e, t, n, o, s, r) {
  const i = P(e, "sine", o), a = e.createGain();
  a.gain.setValueAtTime(0, n), a.gain.setValueAtTime(0, n + r), a.gain.linearRampToValueAtTime(s, n + r + 0.4), i.connect(a);
  for (const c of t) a.connect(c.detune);
  return i;
}
function Rt(e, t, n, o, s, r) {
  const i = e.createBufferSource();
  i.buffer = To(e);
  const a = re(e, "bandpass", o, 1.2), c = e.createGain();
  return c.gain.setValueAtTime(s, n), c.gain.setTargetAtTime(0, n, r), i.connect(a).connect(c).connect(t), i;
}
const lt = (e, t) => Math.min(t * 2.5, Math.max(t * 0.3, t * 2 ** ((60 - e) / 24))), jn = {
  plain: {
    attack: 0.012,
    sustain: 0.85,
    decay: 0.4,
    release: 0.015,
    build: (e, t, n) => [Fn(P(e, "sine", n), t)]
  },
  soft: {
    attack: 0.012,
    sustain: 0.85,
    decay: 0.4,
    release: 0.015,
    build: (e, t, n) => [Fn(P(e, "triangle", n), t)]
  },
  piano: {
    attack: 3e-3,
    sustain: 0,
    decay: 1.4,
    release: 0.09,
    build(e, t, n, o, s, r) {
      const i = It(e, "piano", [1, 0.62, 0.36, 0.27, 0.16, 0.12, 0.07, 0.06, 0.035, 0.02, 0.012, 8e-3]), a = re(e, "lowpass", Math.min(n * (5 + 7 * s), 14e3), 0.5);
      a.frequency.setTargetAtTime(Math.max(n * 2.2, 400), o + 0.01, lt(r, 0.35)), a.connect(t);
      const c = P(e, i, n, -1.5), d = P(e, i, n, 1.5), p = me(e, 0.5);
      c.connect(p), d.connect(p), p.connect(a);
      const m = Rt(e, t, o, Math.min(n * 6, 7e3), 0.12 * s, 8e-3);
      return [c, d, m];
    }
  },
  epiano: {
    attack: 2e-3,
    sustain: 0,
    decay: 1.6,
    release: 0.12,
    build(e, t, n, o, s, r) {
      const i = P(e, "sine", n), a = P(e, "sine", n), c = e.createGain(), d = n * (1.2 + 2.2 * s);
      c.gain.setValueAtTime(d, o), c.gain.setTargetAtTime(n * 0.25, o, lt(r, 0.25)), a.connect(c).connect(i.frequency);
      const p = re(e, "highpass", 25, 0.7);
      p.connect(t);
      const m = P(e, "sine", n * 4), _ = e.createGain();
      return _.gain.setValueAtTime(0.18 * s, o), _.gain.setTargetAtTime(0, o, 0.06), m.connect(_).connect(p), i.connect(p), [i, a, m];
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
      const r = [-9, 0, 8].map((a) => P(e, "sawtooth", n, a));
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
      const s = Math.min(n * 3 + 500, 4500), r = re(e, "lowpass", s, 0.8);
      r.connect(t);
      const i = P(e, "sine", 0.25), a = me(e, s * 0.3);
      i.connect(a).connect(r.frequency);
      const c = [P(e, "sawtooth", n, -12), P(e, "sawtooth", n, 11), P(e, "triangle", n / 2)];
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
      const s = It(e, "organ", [1, 0.75, 0.55, 0.5, 0.18, 0.3, 0, 0.22, 0, 0.08, 0, 0.1]), r = P(e, s, n), i = P(e, "sine", n / 2), a = me(e, 0.35);
      i.connect(a).connect(t), r.connect(t);
      const c = Re(e, [r, i], o, 6.6, 4, 0), d = Rt(e, t, o, 3e3, 0.05, 4e-3);
      return [r, i, c, d];
    }
  },
  flute: {
    attack: 0.07,
    sustain: 0.85,
    decay: 0.5,
    release: 0.06,
    build(e, t, n, o) {
      const s = It(e, "flute", [1, 0.13, 0.06, 0.02]), r = P(e, s, n);
      r.connect(t);
      const i = e.createBufferSource();
      i.buffer = To(e), i.loop = !0;
      const a = re(e, "bandpass", Math.min(n * 2, 8e3), 1.5), c = me(e, 0.06);
      i.connect(a).connect(c).connect(t);
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
      const s = P(e, "sawtooth", n), r = re(e, "lowpass", 5e3, 0.5);
      s.connect(r);
      for (const [c, d, p] of [
        [800, 6, 1],
        [1150, 8, 0.55],
        [2900, 12, 0.18]
      ]) {
        const m = re(e, "bandpass", c, d), _ = me(e, p);
        r.connect(m).connect(_).connect(t);
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
      const i = re(e, "lowpass", Math.min(n * (6 + 6 * s), 9e3), 0.9);
      i.frequency.setTargetAtTime(Math.max(n * 1.5, 250), o + 5e-3, lt(r, 0.12)), i.connect(t);
      const a = P(e, "sawtooth", n), c = P(e, "triangle", n, 4);
      a.connect(i), c.connect(i);
      const d = Rt(e, t, o, Math.min(n * 8, 8e3), 0.1 * s, 5e-3);
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
      const r = P(e, "square", n), i = P(e, "sawtooth", n, 6);
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
      const s = P(e, "sine", n), r = P(e, "triangle", n), i = me(e, 0.5);
      s.connect(t), r.connect(i).connect(t);
      const a = P(e, "sawtooth", n), c = re(e, "lowpass", Math.min(n * 6, 2500), 1);
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
      const i = P(e, "sine", n), a = P(e, "sine", n * 3.5), c = e.createGain();
      return c.gain.setValueAtTime(n * (1 + 1.5 * s), o), c.gain.setTargetAtTime(0, o, 0.05), a.connect(c).connect(i.frequency), i.connect(t), [i, a];
    }
  }
};
function Fn(e, t) {
  return e.connect(t), e;
}
function wc(e, t, n, o, s, { velocity: r = 0.8, level: i = 1 } = {}) {
  const a = jn[n] ?? jn.plain, c = wi(o), d = a.sustain === 0 ? lt(o, a.decay) : a.decay, p = i * vi[n] * (0.55 + 0.45 * Math.max(0, Math.min(1, r))), m = e.createGain();
  m.gain.setValueAtTime(0, s), m.gain.linearRampToValueAtTime(p, s + a.attack), m.gain.setTargetAtTime(p * a.sustain, s + a.attack, d), m.connect(t);
  const _ = a.build(e, m, c, s, r, o);
  for (const M of _) M.start(s);
  let b = !1, E = !1;
  const x = (M) => {
    for (const H of _)
      try {
        H.stop(M);
      } catch {
      }
  };
  return _[0].onended = () => {
    E = !0, m.disconnect();
  }, a.sustain === 0 && x(s + a.attack + d * 7), {
    release(M) {
      if (b || E) return;
      b = !0;
      const H = Math.max(M, s + a.attack);
      m.gain.setTargetAtTime(0, H, a.release), x(H + a.release * 7);
    },
    stop() {
      if (E) return;
      E = !0, b = !0;
      const M = e.currentTime;
      try {
        m.gain.cancelScheduledValues(M), m.gain.setValueAtTime(0, M);
      } catch {
      }
      x(M), m.disconnect();
    }
  };
}
const bc = 12, nt = { width: 640, height: 420 }, xi = { width: 1280, height: 900 }, Po = 120, Oo = 720, Io = 0.25, Ro = 0.85, qo = 160, zo = 460, Do = "plenio.sheet.dialog";
function He(e, t, n) {
  return Number.isFinite(e) ? Math.min(Math.max(e, t), Math.max(t, n)) : t;
}
function Si(e, t) {
  const n = He(e.width, nt.width, Math.max(nt.width, t.width - 16)), o = He(e.height, nt.height, Math.max(nt.height, t.height - 16));
  return { width: Math.round(n), height: Math.round(o) };
}
function yc(e, t) {
  return Math.round(He(e + t, Po, Oo));
}
function vc(e, t, n) {
  return !Number.isFinite(n) || n <= 0 ? Wn(e) : Wn(e + t / n);
}
function Wn(e) {
  return Math.round(He(e, Io, Ro) * 1e3) / 1e3;
}
function xc(e, t) {
  return Math.round(He(e + t, qo, zo));
}
function Sc(e, t, n) {
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
function ki() {
  return { ...xi, maximized: !1 };
}
function kc(e = Bo()) {
  const t = ki();
  try {
    const n = e?.getItem(Do);
    if (!n) return t;
    const o = JSON.parse(n);
    return { ...Si(
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
function _c(e, t = Bo()) {
  try {
    t?.setItem(Do, JSON.stringify(e));
  } catch {
  }
}
function Bo() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function Ho(e) {
  return e === "large" || e === "standard" || e === "smaller" || e === "compact";
}
function jo() {
  return { countIn: 1, quantize: 16, mode: "replace", mute: !0, thru: !0, stepLength: 8 };
}
function _i(e) {
  const t = jo(), n = typeof e == "object" && e !== null ? e : {}, o = (s, r, i) => r.includes(s) ? s : i;
  return {
    countIn: o(n.countIn, [0, 1, 2], t.countIn),
    quantize: o(n.quantize, [0, 4, 8, 16, 32], t.quantize),
    mode: o(n.mode, ["replace", "merge"], t.mode),
    mute: typeof n.mute == "boolean" ? n.mute : t.mute,
    thru: typeof n.thru == "boolean" ? n.thru : t.thru,
    stepLength: o(n.stepLength, [1, 2, 4, 8, 16], t.stepLength)
  };
}
const Fo = "plenio.score-editor.prefs";
function Ei() {
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
    sounds: Co(),
    paper: "a4",
    notationSize: "standard",
    record: jo(),
    midiInput: "all"
  };
}
function Mi(e) {
  const t = e.layout;
  return t === "text" ? { layout: "text", advanced: e.advanced === !0 } : t === "daw" ? { layout: "daw", advanced: e.advanced === !0 } : t === "both" ? { layout: "review", advanced: !0 } : { layout: "review", advanced: e.advanced === !0 };
}
function Ec(e = Wo()) {
  const t = Ei();
  try {
    const n = e?.getItem(Fo);
    if (!n) return t;
    const o = JSON.parse(n);
    return {
      ...Mi(o),
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
      rollHeight: typeof o.rollHeight == "number" && o.rollHeight >= Po && o.rollHeight <= Oo ? Math.round(o.rollHeight) : t.rollHeight,
      notationShare: typeof o.notationShare == "number" && o.notationShare >= Io && o.notationShare <= Ro ? o.notationShare : t.notationShare,
      sideWidth: typeof o.sideWidth == "number" && o.sideWidth >= qo && o.sideWidth <= zo ? Math.round(o.sideWidth) : t.sideWidth,
      metronome: o.metronome === !0,
      hear: o.hear === "notes" || o.hear === "source" ? o.hear : t.hear,
      sourceLevel: typeof o.sourceLevel == "number" && o.sourceLevel >= 0 && o.sourceLevel <= 1 ? o.sourceLevel : t.sourceLevel,
      audition: o.audition !== !1,
      rowHeight: typeof o.rowHeight == "number" && o.rowHeight >= 6 && o.rowHeight <= 28 ? Math.round(o.rowHeight) : t.rowHeight,
      follow: o.follow !== !1,
      sung: o.sung !== !1,
      wave: o.wave !== !1,
      sounds: yi(o.sounds),
      paper: o.paper === "letter" ? "letter" : "a4",
      notationSize: Ho(o.notationSize) ? o.notationSize : t.notationSize,
      record: _i(o.record),
      midiInput: typeof o.midiInput == "string" && o.midiInput ? o.midiInput : "all"
    };
  } catch {
    return t;
  }
}
function Mc(e, t = Wo()) {
  try {
    t?.setItem(Fo, JSON.stringify(e));
  } catch {
  }
}
function Wo() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function Go(e) {
  if (!Array.isArray(e)) return [];
  const t = (n) => typeof n == "string" ? n : "";
  return e.filter((n) => !!n && typeof n == "object").map((n) => ({
    token: t(n.token),
    file: t(n.file),
    title: t(n.title),
    paper: n.paper === "letter" ? "letter" : "a4",
    size: Ho(n.size) ? n.size : "standard",
    display_abc: t(n.display_abc)
  })).filter((n) => n.token && n.file && n.display_abc);
}
function $i(e) {
  return Go(e?.plenio_notation);
}
async function Ai(e) {
  const t = await e.fetchApi("/plenio/export/sheet-music/pending", { cache: "no-store" });
  if (!t.ok) return [];
  const n = await t.json().catch(() => ({}));
  return Go(n.jobs);
}
async function Ni(e, t) {
  const n = await t.draw(e.display_abc, e.title, e.paper, e.size), o = new ArrayBuffer(n.length);
  new Uint8Array(o).set(n);
  const s = await t.fetcher.fetchApi(`/plenio/export/sheet-music?token=${encodeURIComponent(e.token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: new Blob([o], { type: "application/pdf" })
  }), r = await s.json().catch(() => ({}));
  if (!s.ok)
    throw new U(r.error?.message ?? `Saving the sheet music failed (${s.status})`, r.error?.hint ?? null);
  return { file: r.file ?? e.file, bytes: r.bytes ?? n.length };
}
let Gn = Promise.resolve();
function Li(e) {
  const t = Gn.then(e, e);
  return Gn = t.catch(() => {
  }), t;
}
class Ci {
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
        Li(() => Ni(s, this.host)).then(
          (r) => this.report({ job: s, saved: r }),
          (r) => {
            const i = r instanceof U && /can no longer be saved/.test(r.message);
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
      t = await Ai(this.host.fetcher);
    } catch {
      return;
    }
    await Promise.all(this.take(t, !0));
  }
}
const Vo = "PlenioSeed", Ti = 2 ** 32, Uo = "plenio_part", ut = "plenio_seed_hint", Vn = 56, Un = {
  fresh: { color: "#7a5418", bgcolor: "#3b2a10" },
  keep: { color: "#1f4e6e", bgcolor: "#14304a" }
};
function Pi(e = Math.random) {
  return Math.floor(e() * Ti);
}
function Oi(e, t) {
  const n = t.trim() || "result";
  return e ? `🔒 Every run uses this seed again: the same ${n}.` : `🎲 Every run draws a new seed: a new ${n}. Liked it? Switch to 🔒.`;
}
function Le(e, t) {
  return e.widgets?.find((n) => n.name === t);
}
function Yo(e) {
  const t = e.inputs?.find((n) => n.name === "seed");
  return t?.link !== void 0 && t?.link !== null;
}
function mt(e) {
  const t = !!Le(e, "keep_seed")?.value, n = e, o = t ? Un.keep : Un.fresh;
  n.color = o.color, n.bgcolor = o.bgcolor;
  const s = Le(e, ut)?.element;
  s && (s.textContent = Oi(t, String(e.properties?.[Uo] ?? ""))), e.setDirtyCanvas?.(!0, !0);
}
function Yn(e, t = Math.random) {
  const n = Le(e, "seed");
  !n || Yo(e) || (n.value = Pi(t), n.callback?.(n.value), e.setDirtyCanvas?.(!0, !0));
}
function Ii(e, t = Math.random) {
  const n = Le(e, "seed"), o = Le(e, "keep_seed");
  if (!n || !o) return;
  n.beforeQueued = () => {
    o.value || Yn(e, t);
  }, o.callback = Z(o.callback, () => mt(e));
  const r = e.addWidget?.("button", "🎲 new seed now", null, () => Yn(e, t), { serialize: !1 });
  if (r && (r.serialize = !1), !Le(e, ut)) {
    const i = document.createElement("div");
    i.className = "plenio-seed-hint";
    const a = e.addDOMWidget(ut, ut, i, {
      serialize: !1,
      getValue: () => "",
      setValue: () => {
      },
      // two lines of text and the frontend's margin of 10 px above and below a DOM widget
      getMinHeight: () => Vn,
      getMaxHeight: () => Vn
    });
    a.serialize = !1;
  }
  mt(e);
}
function Ri(e) {
  const t = e.prototype, n = t.onNodeCreated;
  t.onNodeCreated = function() {
    n?.call(this), Ii(this);
  }, e.prototype.onConfigure = Z(e.prototype.onConfigure, function() {
    mt(this);
  });
}
const Xo = /* @__PURE__ */ new Set(["new song every run", "new cover every run"]), qi = /* @__PURE__ */ new Set(["one song, stop to review", "one cover, stop to review"]);
function zi(e, t) {
  return Xo.has(e) ? !1 : qi.has(e) ? t.trim() !== "take" : null;
}
function Di(e, t) {
  let n = 0;
  for (const o of e) {
    if (o.type !== Vo || Yo(o)) continue;
    const s = zi(t, String(o.properties?.[Uo] ?? "")), r = o.widgets?.find((i) => i.name === "keep_seed");
    s === null || !r || !!r.value === s || (r.value = s, mt(o), n++);
  }
  return n;
}
function Bi(e, t) {
  const n = `${t} seed${t === 1 ? "" : "s"}`;
  return Xo.has(e) ? { summary: `${n} now 🎲 new seed`, detail: `"${e}": every run draws all its seeds anew - a new song each time. Switch a seed to 🔒 to keep that part.` } : { summary: `${n} now 🔒 same seed`, detail: `"${e}": the song's draft, plan, arrangement and cover stay while you review it; the take seed still draws anew.` };
}
function Hi(e, t) {
  const n = e.widgets?.find((o) => o.name === "mode");
  n && (n.callback = Z(n.callback, (o) => {
    const s = e.graph, r = String(o ?? n.value ?? ""), i = Di(s?.nodes ?? s?._nodes ?? [], r);
    if (i) {
      const a = Bi(r, i);
      t(a.summary, a.detail);
    }
  }));
}
const ji = "PlenioSongSheet";
function Ge(e) {
  return e.widgets?.find((t) => t.name === "sheet_state") ?? null;
}
function Qo(e, t) {
  const n = e.inputs?.[t]?.link;
  if (n == null) return null;
  try {
    const o = e.graph, s = o?.links, r = o?.getLink?.(n) ?? (s instanceof Map ? s.get(n) : s?.[String(n)]);
    return r && o?.getNodeById ? o.getNodeById(r.origin_id) ?? null : e.getInputNode?.(t) ?? null;
  } catch {
    return null;
  }
}
function Jo(e, t) {
  const n = (e.inputs ?? []).findIndex((o) => o.name === t && o.link != null);
  return n < 0 ? null : Qo(e, n);
}
function Ko(e, t) {
  const n = Jo(e, t);
  return n && (n.comfyClass ?? n.type) === ji && Ge(n) ? n : null;
}
function Fi(e) {
  return Ko(e, "context_lyrics");
}
function Wi(e) {
  return Ko(e, "context_score");
}
function Gi(e, t, n) {
  const o = [], s = Jo(t, n);
  s && o.push(s);
  const r = /* @__PURE__ */ new Set();
  for (; o.length && r.size < 1e3; ) {
    const i = o.shift(), a = String(i.id);
    if (!r.has(a)) {
      if (r.add(a), i === e || a === String(e.id)) return !0;
      (i.inputs ?? []).forEach((c, d) => {
        const p = Qo(i, d);
        p && o.push(p);
      });
    }
  }
  return !1;
}
function Vi(e, t, n) {
  const o = Fi(e), s = t?.context?.lyrics;
  if (!o || !s) return null;
  const r = o.title || "Song Sheet", i = ke(Ge(o)?.value), a = i?.docs.lyrics?.text ?? n(String(o.id))?.docs.lyrics?.upstream ?? null;
  let c = null;
  return i === null ? c = `The state of ${r} is unreadable - open that sheet and apply it first.` : a !== null && Se(a) !== Se(s) && (c = `The lyrics in ${r} changed after the last run. Run the workflow again; then they can follow the sections.`), { owner: o, target: { title: r, blocked: c, replans: Gi(o, e, "score") } };
}
function Ui(e, t, n) {
  const o = Ge(e);
  if (!o) return;
  const s = ke(o.value) ?? wt();
  o.value = De(go(s, n, [{ kind: "lyrics", text: t, intent: "keep" }])), e.setDirtyCanvas?.(!0, !0);
}
function Yi(e, t, n) {
  const o = Wi(e), s = t?.context?.score;
  if (!o || !s) return null;
  const r = o.title || "Song Sheet", i = ke(Ge(o)?.value), a = i?.docs.score?.text ?? n(String(o.id))?.docs.score?.upstream ?? null;
  let c = null;
  return i === null ? c = `The state of ${r} is unreadable - open that sheet and apply it first.` : a !== null && Se(a) !== Se(s) && (c = `The score in ${r} changed after the last run. Run the workflow again; then it can be edited here.`), { owner: o, target: { title: r, blocked: c } };
}
function Xi(e, t) {
  const n = String(e.widgets?.find((o) => o.name === "review")?.value ?? "continue");
  return n === "as the brief says" ? t?.review ?? "continue" : n;
}
async function Qi(e, t, n, o = null) {
  const s = Ge(e);
  if (!s) return null;
  const r = ke(s.value) ?? wt(), i = go(r, n, [{ kind: "score", text: t, intent: "keep" }]);
  if (s.value = De(i), e.setDirtyCanvas?.(!0, !0), !o || !n) return i;
  try {
    const a = await Ss(o.fetcher, {
      sheet_state: i,
      upstream: Zs(n),
      owned: n.owned,
      review: Xi(e, n),
      engine: n.engine,
      instrumental: n.instrumental,
      context: n.context,
      target_seconds: n.target_seconds ?? null
    });
    if (!!a.findings.some((p) => p.severity === "error") || !a.fingerprint) return i;
    const d = Ks(i, a.fingerprint);
    return s.value = De(d), e.setDirtyCanvas?.(!0, !0), d;
  } catch {
    return i;
  }
}
const Zo = "PLENIO_SHEET_STATE", Xn = 68;
let dt = null;
function Ji(e) {
  dt = e;
}
const Ki = (e, t, n) => {
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
    const x = Ee(String(e.id)), M = Yt(e);
    r.textContent = Qs(ke(o)) + (x && M !== "approved" ? ` · ${x.status}` : ""), a.textContent = ni(M), a.dataset.state = M ?? "";
    const H = c ? null : e.widgets?.find((u) => u.name === "review");
    if (H) {
      c = !0;
      const u = H.callback;
      H.callback = (W) => {
        u?.(W), d();
      };
    }
  }, p = e.addDOMWidget(t, Zo, s, {
    getValue: () => o,
    setValue: (x) => {
      o = typeof x == "string" ? x : "", d();
    },
    // two rows, always: the frontend lays a DOM widget out once, so a height that changes later is cut;
    // it also keeps a 10 px margin above and below the element (68 - 20 = the rows' 48 px)
    getMinHeight: () => Xn,
    getMaxHeight: () => Xn
  });
  i.addEventListener("click", (x) => {
    x.stopPropagation(), m().catch((M) => {
      console.error("Plenio: the Song Sheet editor could not open", M), r.textContent = `The editor could not open: ${M instanceof Error ? M.message : String(M)}`;
    });
  });
  async function m() {
    const x = ke(o);
    x === null && (r.textContent = "The stored state is unreadable; it will be replaced when you apply.");
    const M = Ee(String(e.id)), u = (e.inputs ?? []).filter((C) => C.link != null).map((C) => C.name), W = x ?? { schema: "plenio.sheet_state/1", docs: {} }, N = M?.owned ?? wo(u, W), y = String(e.widgets?.find((C) => C.name === "review")?.value ?? "continue"), g = y === "as the brief says" ? M?.review ?? "continue" : y, w = () => rn(import.meta.url, an), { openSheetDialog: v } = await qe(() => import("./open-CnhlDAog.mjs"), w), { parseGuide: L, serializeGuide: $ } = await qe(() => import("./tracks-ClAVjvds.mjs"), w), { parseShift: Y, parseSpans: z } = await qe(() => import("./lyricPlacement-DGoRXeqW.mjs"), w);
    if (!dt) throw new Error("Plenio: API not initialised");
    let q = null;
    try {
      q = Vi(e, M, Ee);
    } catch (C) {
      console.warn("Plenio: the lyrics sheet of this score was not found", C);
    }
    let D = null;
    try {
      D = Yi(e, M, Ee);
    } catch (C) {
      console.warn("Plenio: the score sheet of these lyrics was not found", C);
    }
    const j = dt;
    v({
      title: e.title || "Song Sheet",
      state: W,
      payload: M,
      asrNote: jr(M?.docs.lyrics?.upstream_sha256),
      owned: N.length ? N : [...We],
      review: g,
      fetcher: dt,
      // a template's choice of the score editor's layout (review, text; daw with the DAW template)
      layout: typeof e.properties?.plenio_editor_layout == "string" ? e.properties.plenio_editor_layout : null,
      // the Guide track (playback and MIDI only), kept in the node's properties with the workflow
      guide: L(e.properties?.plenio_guide),
      // the lyrics lines placed by hand in the lyrics lane, kept like the Guide notes
      lyricSpans: z(e.properties?.plenio_lyric_spans),
      // how far a cover's source recording is moved against the bars (the beat grid corrected by hand)
      sourceShift: Y(e.properties?.plenio_source_shift),
      lyricsTarget: q?.target ?? null,
      scoreTarget: D?.target ?? null,
      onApply: (C, pe, te, T, O, ae) => {
        const Ve = String(p.value ?? "");
        if (p.value = De(C), e.properties = {
          ...e.properties ?? {},
          plenio_guide: $(pe),
          plenio_lyric_spans: (ae?.lyricSpans ?? []).map((ce) => [...ce]),
          plenio_source_shift: ae?.sourceShift ?? 0
        }, O ? Ne(e, "approved") : String(p.value) !== Ve && _(e), te !== null && q && !q.target.blocked && (Ui(q.owner, te, Ee(String(q.owner.id))), _(q.owner)), T && D && !D.target.blocked) {
          const ce = D.owner;
          Qi(ce, T.text, Ee(String(ce.id)), T.approved ? { fetcher: j } : null).then(
            (X) => {
              X?.review?.approved_fingerprint ? Ne(ce, "approved") : _(ce);
            }
          );
        }
        e.setDirtyCanvas?.(!0, !0);
      }
    });
  }
  function _(x) {
    $o(x) === "approved" && Ne(x, null);
  }
  const b = [
    Br((x) => {
      x === String(e.id) && d();
    }),
    ri((x) => {
      (x === null || x === e) && d();
    })
  ], E = e.onRemoved;
  return e.onRemoved = function() {
    for (const x of b) x();
    E?.call(this);
  }, d(), { widget: p };
}, es = "PLENIO_FINISH_SWITCH", Zi = "plenio_switch", Qn = 148, Xt = 0, ea = 4, qt = [
  {
    id: "hq",
    name: "HQ Mastering",
    on: "UniverSR regenerates the highs: less AI shimmer · about 2× the time",
    off: "Faster, without UniverSR · switch on for the best sound",
    // sparkles
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l1.9 5.1 5.1 1.9-5.1 1.9L12 16.5l-1.9-5.1L5 9.5l5.1-1.9z"/><path d="M19 14.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9zM5 15.5l.7 1.8 1.8.7-1.8.7L5 20.5l-.7-1.8-1.8-.7 1.8-.7z"/></svg>'
  },
  {
    id: "cover",
    name: "Cover Art",
    on: "Paints the cover from the artwork prompt · embedded in the files",
    off: "No cover · no image model needed",
    // a picture: frame, sun and hills
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="9.5" r="1.8"/><path d="M4.5 18l5-5.5 3.5 3.5 2.5-2.5 4 4.5z"/></svg>'
  }
];
function ta(e) {
  return e?.nodes ?? e?._nodes ?? [];
}
function ts(e) {
  return ta(e).filter((t) => t.properties?.[Zi] === "cover");
}
function ot(e) {
  const t = ts(e);
  return t.length ? t.some((n) => (n.mode ?? Xt) === Xt) : null;
}
function na(e, t) {
  for (const n of ts(e)) n.mode = t ? Xt : ea;
  e?.setDirtyCanvas?.(!0, !0);
}
function Jn(e) {
  return e === !0 || typeof e == "string" && ["true", "1", "on"].includes(e.trim().toLowerCase());
}
const Qt = /* @__PURE__ */ new Set();
function oa() {
  for (const e of Qt) e();
}
const sa = (e, t, n) => {
  let o = Jn(n?.[1]?.default);
  const s = e, r = document.createElement("div");
  r.className = "plenio-switches";
  const i = /* @__PURE__ */ new Map();
  for (const b of qt) {
    const E = document.createElement("button");
    E.type = "button", E.className = "plenio-switch", E.dataset.switch = b.id, E.innerHTML = `<span class="icon">${b.icon}</span><span class="text"><span class="name"></span><span class="what"></span></span><span class="pill"></span>`, E.addEventListener("click", (x) => {
      x.stopPropagation(), b.id === "hq" ? (o = !o, d.value = o, d.callback?.(o)) : na(s.graph, !ot(s.graph)), c();
    }), i.set(b.id, E), r.append(E);
  }
  function a(b, E) {
    const x = i.get(b.id);
    x && (x.hidden = E === null, x.classList.toggle("on", !!E), x.setAttribute("aria-pressed", String(!!E)), x.title = `${b.name}: ${E ? "on" : "off"} - click to switch it ${E ? "off" : "on"}`, x.querySelector(".name").textContent = b.name, x.querySelector(".what").textContent = E ? b.on : b.off, x.querySelector(".pill").textContent = E ? "ON" : "OFF");
  }
  function c() {
    a(qt[0], o), a(qt[1], ot(s.graph));
  }
  const d = e.addDOMWidget(t, es, r, {
    getValue: () => o,
    setValue: (b) => {
      o = Jn(b), c();
    },
    getMinHeight: () => Qn,
    getMaxHeight: () => Qn
  });
  Qt.add(c);
  let p = ot(s.graph);
  const m = e.onDrawForeground;
  e.onDrawForeground = function(b) {
    m?.call(this, b);
    const E = ot(s.graph);
    E !== p && (p = E, c());
  };
  const _ = e.onRemoved;
  return e.onRemoved = function() {
    Qt.delete(c), _?.call(this);
  }, c(), { widget: d };
}, je = "plenio.stem_mix/1", Ce = "rest", ra = ["reverb", "delay"], ns = -60, ia = 12;
function aa() {
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
function os(e) {
  const t = aa();
  return e.gain_db === t.gain_db && e.mute === t.mute && e.solo === t.solo && e.compression === t.compression && e.muted.length === 0 && e.reverb === t.reverb && e.delay === t.delay && e.save === t.save;
}
const ca = ["vocals", "drums", "bass", "other"];
function la() {
  return [...ca, Ce];
}
function ua(e) {
  if (typeof e != "string" || !e.trim()) return { schema: je, strips: {} };
  try {
    const t = JSON.parse(e);
    return t?.schema !== je || typeof t.strips != "object" || t.strips === null ? null : t;
  } catch {
    return null;
  }
}
function da(e) {
  const t = {};
  for (const o of Object.keys(e.strips)) {
    if (!o || os(ie(e, o))) continue;
    const s = {}, r = ie(e, o);
    r.gain_db && (s.gain_db = r.gain_db), r.mute && (s.mute = !0), r.solo && (s.solo = !0), r.compression && (s.compression = r.compression), r.muted.length && (s.muted = r.muted), r.reverb && (s.reverb = r.reverb), r.delay && (s.delay = r.delay), r.save && (s.save = !0), t[o] = s;
  }
  const n = { schema: je, strips: t };
  return e.reverb && Object.keys(e.reverb).length && (n.reverb = e.reverb), e.delay && Object.keys(e.delay).length && (n.delay = e.delay), JSON.stringify(n);
}
function gt(e, t, n) {
  const o = { ...e.strips };
  return os(n) ? delete o[t] : o[t] = n, { ...e, strips: o };
}
function fa(e, t, n) {
  const o = n.some((r) => ie(e, r).solo), s = ie(e, t);
  return o ? s.solo : !s.mute;
}
function Kn(e) {
  return e <= ns ? "-∞" : `${e > 0 ? "+" : ""}${e.toFixed(1)}`;
}
function pa(e, t = null) {
  const n = e.filter((s) => Array.isArray(s) && s.length === 2 && Number.isFinite(s[0]) && Number.isFinite(s[1])).map((s) => [Math.max(0, Math.min(s[0], s[1])), Math.max(s[0], s[1])]).filter((s) => s[1] - s[0] > 1e-6).sort((s, r) => s[0] - r[0]), o = [];
  for (const s of n) {
    const r = o[o.length - 1];
    r && s[0] <= r[1] + 1e-6 ? r[1] = Math.max(r[1], s[1]) : o.push([...s]);
  }
  return t !== null && t > 0 ? o.map(([s, r]) => [Math.min(s, t), Math.min(r, t)]).filter(([s, r]) => r - s > 1e-6) : o;
}
function ha(e, t, n) {
  return pa([...e, [t, n]]);
}
function ma(e, t) {
  return e.findIndex(([n, o]) => n <= t && t <= o);
}
function ga(e, t) {
  return t < 0 ? e : e.filter((n, o) => o !== t);
}
function wa(e, t, n, o) {
  const s = ie(e, t);
  return gt(e, t, { ...s, muted: ha(s.muted, n, o) });
}
function ba(e, t, n) {
  const o = ie(e, t), s = ma(o.muted, n);
  return s < 0 ? e : gt(e, t, { ...o, muted: ga(o.muted, s) });
}
function ya(e) {
  const t = e?.plenio_stems, n = t?.[t.length - 1];
  if (!n?.peaks) return {};
  const o = {};
  for (const [s, r] of Object.entries(n.peaks))
    Array.isArray(r) && r.length && (o[s] = r.map((i) => Math.abs(Number(i) || 0)));
  return o;
}
function va(e, t, n = 200) {
  const o = e[t];
  return o?.length ? o.length === n ? o : Array.from({ length: n }, (s, r) => o[Math.floor(r * o.length / n)] ?? 0) : new Array(n).fill(0);
}
function Zn(e, t) {
  const o = (Array.isArray(t?.stems) && t.stems.length ? t.stems : la()).filter((r) => r !== Ce), s = Object.keys(e?.strips ?? {}).filter((r) => r !== Ce && !o.includes(r));
  return [...o, ...s, Ce];
}
const eo = "plenio_stem_mixer", to = "mix", ge = 200, xa = ["room", "plate", "hall"];
function R(e, t, n) {
  const o = document.createElement(e);
  return t && (o.className = t), n !== void 0 && (o.textContent = n), o;
}
function st(e, t, n, o, s) {
  const r = R("input");
  return r.type = "range", r.min = String(e), r.max = String(t), r.step = String(n), r.value = String(o), r.setAttribute("aria-label", s), r;
}
function Sa(e) {
  const t = R("div", "plenio-mix"), n = R("div", "plenio-mix-strips"), o = R("div", "plenio-mix-buses"), s = R("div", "plenio-mix-info"), r = R("div", "plenio-mix-advanced");
  t.append(n, o, r, s);
  let i = {
    mix: { schema: je, strips: {} },
    // the documented stems are there before the first run (owner's request, 2026-09-28); a separation
    // replaces them with what the model actually produced
    names: Zn(null, null),
    peaks: {},
    seconds: 0
  }, a = !1;
  const c = () => e.widgets?.find((y) => y.name === to);
  function d(y, { draw: g = !0 } = {}) {
    const w = c();
    if (!w) return;
    const v = da(y);
    w.value = v, w.callback?.(v), i = { ...i, mix: y }, g && b();
  }
  function p(y, g, w = {}) {
    d(gt(i.mix, y, { ...ie(i.mix, y), ...g }), w);
  }
  function m(y, g, w, v = {}) {
    const L = ie(i.mix, y);
    let $ = gt(i.mix, y, { ...L, [g]: w });
    w > 0 && !($[g] && Object.keys($[g]).length) && ($ = g === "reverb" ? { ...$, reverb: { preset: "room" } } : { ...$, delay: { time_ms: 375, feedback: 0.35, lowpass_hz: 4e3 } }), d($, v);
  }
  function _(y, g, w) {
    const v = { ...i.mix[y] ?? {} };
    d({ ...i.mix, [y]: { ...v, [g]: w } });
  }
  function b() {
    n.replaceChildren();
    const y = i.names;
    for (const g of i.names) {
      const w = ie(i.mix, g), v = R("div", "plenio-mix-strip");
      v.dataset.strip = g;
      const L = R("span", "name", g === Ce ? `${g} (missed)` : g);
      L.title = g === Ce ? "What the separator missed: keeps a neutral mix exact" : "";
      const $ = st(ns, ia, 0.5, w.gain_db, `${g} gain`), Y = R("span", "gain", `${Kn(w.gain_db)} dB`);
      $.addEventListener("input", () => {
        Y.textContent = `${Kn(Number($.value))} dB`, p(g, { gain_db: Number($.value) }, { draw: !1 });
      }), $.addEventListener("change", () => p(g, { gain_db: Number($.value) }));
      const z = R("button", w.mute ? "toggle active" : "toggle", "M");
      z.setAttribute("aria-label", `${g} mute`), z.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { mute: !w.mute });
      });
      const q = R("button", w.solo ? "toggle active" : "toggle", "S");
      q.setAttribute("aria-label", `${g} solo`), q.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { solo: !w.solo });
      });
      const D = st(0, 1, 0.05, w.compression, `${g} compression`);
      D.title = "Compression amount: one knob for the master compressor (threshold and ratio)", D.addEventListener("input", () => p(g, { compression: Number(D.value) }, { draw: !1 })), D.addEventListener("change", () => p(g, { compression: Number(D.value) }));
      const j = ra.map((T) => {
        const O = st(0, 1, 0.05, w[T], `${g} ${T} send`);
        return O.title = `${T} send: how much of this stem goes to the shared ${T} bus`, O.addEventListener("input", () => m(g, T, Number(O.value), { draw: !1 })), O.addEventListener("change", () => m(g, T, Number(O.value))), O;
      }), C = R("button", w.save ? "toggle active" : "toggle", "save");
      C.setAttribute("aria-label", `${g} save as its own file`), C.setAttribute("aria-pressed", String(w.save)), C.title = 'Save this stem as its own 24-bit FLAC file on the next run - next to the song, in the folder "<name>-stems" (without an Export Release: output/plenio/stems); its gain, compression and muted ranges are applied, mute/solo and the buses are not', C.addEventListener("click", (T) => {
        T.stopPropagation(), p(g, { save: !w.save });
      });
      const pe = fa(i.mix, g, y);
      v.classList.toggle("silent", !pe);
      const te = R("canvas", "plenio-mix-wave");
      te.width = ge, te.height = 26, te.setAttribute("aria-label", `${g} waveform (drag to mute a time range)`), E(te, w, va(i.peaks, g, ge)), te.addEventListener("pointerdown", (T) => x(T, te, g)), v.append(
        L,
        $,
        Y,
        z,
        q,
        R("span", "label", "comp"),
        D,
        R("span", "label", "verb"),
        j[0],
        R("span", "label", "delay"),
        j[1],
        C,
        te
      ), n.append(v);
    }
    M(), s.textContent = i.seconds ? `last run: ${i.seconds.toFixed(1)} s - drag on a strip to mute a time range, click a range to remove it` : "no run yet: the strips show the documented stems (vocals, drums, bass, other and the residual rest); Separate Stems fills them", e.setDirtyCanvas?.(!0, !0);
  }
  function E(y, g, w) {
    const v = y.getContext("2d");
    if (!v) return;
    v.clearRect(0, 0, ge, y.height);
    const L = y.height / 2;
    v.strokeStyle = "rgba(180, 190, 205, 0.8)", v.beginPath();
    for (let $ = 0; $ < w.length; $++) {
      const Y = Math.max(1, w[$] * (L - 1));
      v.moveTo($ + 0.5, L - Y), v.lineTo($ + 0.5, L + Y);
    }
    v.stroke(), v.fillStyle = "rgba(224, 104, 94, 0.35)", v.strokeStyle = "rgba(224, 104, 94, 0.9)";
    for (const [$, Y] of g.muted) {
      const z = Math.max(0, Math.min(ge, $ / Math.max(i.seconds, 1e-6) * ge)), q = Math.max(0, Math.min(ge, Y / Math.max(i.seconds, 1e-6) * ge));
      v.fillRect(z, 0, Math.max(1, q - z), y.height), v.strokeRect(z + 0.5, 0.5, Math.max(1, q - z) - 1, y.height - 1);
    }
  }
  function x(y, g, w) {
    if (y.preventDefault(), y.stopPropagation(), !i.seconds) return;
    const v = g.getBoundingClientRect(), L = (j) => Math.max(0, Math.min(1, (j - v.left) / (v.width || ge))) * i.seconds, $ = L(y.clientX);
    if (ie(i.mix, w).muted.some(([j, C]) => j <= $ && $ <= C)) {
      d(ba(i.mix, w, $));
      return;
    }
    let z = $;
    const q = (j) => {
      z = L(j.clientX);
    }, D = () => {
      window.removeEventListener("pointermove", q), window.removeEventListener("pointerup", D), d(wa(i.mix, w, Math.min($, z), Math.max($, z)));
    };
    window.addEventListener("pointermove", q), window.addEventListener("pointerup", D);
  }
  function M() {
    o.replaceChildren();
    const y = { preset: "room", ...i.mix.reverb ?? {} }, g = { time_ms: 375, feedback: 0.35, ...i.mix.delay ?? {} }, w = R("select");
    w.setAttribute("aria-label", "Reverb preset"), w.title = "The room the reverb bus adds; the amount per stem is its verb send";
    for (const $ of xa) w.append(new Option($, $));
    w.value = String(y.preset ?? "room"), w.addEventListener("change", () => _("reverb", "preset", w.value));
    const v = R("input");
    v.type = "number", v.value = String(g.time_ms ?? 375), v.setAttribute("aria-label", "Delay time in ms"), v.title = "Delay time in ms: where the first echo of the delay bus sits", v.addEventListener("change", () => _("delay", "time_ms", Number(v.value)));
    const L = st(0, 0.8, 0.05, Number(g.feedback ?? 0.35), "Delay feedback");
    L.title = "Delay feedback: how much of each echo returns into the delay line", L.addEventListener("input", () => _("delay", "feedback", Number(L.value))), o.append(
      R("span", "label", "reverb bus"),
      w,
      R("span", "label", "delay bus"),
      v,
      R("span", "label", "ms, feedback"),
      L
    ), o.style.display = "flex";
  }
  const H = e.addDOMWidget(eo, eo, t, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 260,
    getMaxHeight: () => 620
  });
  H.serialize = !1;
  const u = e.widgets?.find((y) => y.name === to), W = R("button", "toggle", "JSON");
  W.title = "Show or hide the raw mixer value", W.addEventListener("click", (y) => {
    y.stopPropagation(), a = !a, W.classList.toggle("active", a), u && (u.plenioHidden = !a, a ? delete u.computeSize : u.computeSize = () => [0, -4]), e.setDirtyCanvas?.(!0, !0);
  }), r.append(R("span", "label", "Advanced"), W), u && (u.plenioHidden = !0, u.computeSize = () => [0, -4]);
  function N() {
    const y = ua(c()?.value);
    i = { ...i, mix: y ?? { schema: je, strips: {} } }, y || (s.textContent = "the mixer value is not readable; it will be replaced on the next edit"), b();
  }
  return N(), {
    showExecuted(y) {
      const g = y?.plenio_stems?.at(-1), w = ya(y), v = Zn(i.mix, g ?? null);
      i = { ...i, names: v, peaks: w, seconds: Number(g?.seconds ?? i.seconds) || 0 }, N();
    }
  };
}
const Jt = "plenio-tip", no = 12, rt = 8;
function ka(e, t, n, o) {
  let s = e.right + no;
  if (s + n.width > o.width - rt && (s = e.left - no - n.width), s < rt) return null;
  const r = Math.max(rt, Math.min(t - 14, o.height - rt - n.height));
  return { x: s, y: r };
}
function _a(e) {
  return !!e && (String(e.type ?? "").startsWith("Plenio") || String(e.title ?? "").startsWith("Plenio"));
}
const Ea = 30;
function Ma(e) {
  const t = e.node_over, n = e.ds, o = e.canvas;
  if (!t || !n || !o) return null;
  const s = o.getBoundingClientRect(), r = t.flags?.collapsed ? 0 : t.size[1];
  return {
    left: s.left + (t.pos[0] + n.offset[0]) * n.scale,
    top: s.top + (t.pos[1] - Ea + n.offset[1]) * n.scale,
    right: s.left + (t.pos[0] + t.size[0] + n.offset[0]) * n.scale,
    bottom: s.top + (t.pos[1] + r + n.offset[1]) * n.scale
  };
}
function $a(e) {
  const t = document.body, n = () => t.classList.remove(Jt);
  let o = 0, s = null;
  const r = (a) => {
    const c = e();
    if (a.style.display === "none" || !a.textContent?.trim() || !c || !_a(c.node_over)) return n();
    const d = Ma(c), p = a.getBoundingClientRect(), m = d && ka(d, o, p, { width: window.innerWidth, height: window.innerHeight });
    if (!m) return n();
    const _ = a.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    t.style.setProperty("--plenio-tip-x", `${Math.round(m.x - _.left)}px`), t.style.setProperty("--plenio-tip-y", `${Math.round(m.y - _.top)}px`), t.classList.add(Jt);
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
const Aa = `
body.${Jt} .node-tooltip { left: var(--plenio-tip-x) !important; top: var(--plenio-tip-y) !important;
  transform: none !important; }
`, Na = `
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
.plenio-switches { display: flex; flex-direction: column; gap: 8px; padding: 0 2px; }
.plenio-switch { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 8px 12px; border-radius: 12px;
  border: 1px solid var(--border-color, #4a4a4a); background: var(--comfy-input-bg, #262626); color: var(--input-text, #ddd);
  font: 12px/1.3 var(--font-family, sans-serif); text-align: left; cursor: pointer; transition: background .15s, border-color .15s, box-shadow .15s; }
.plenio-switch:hover { border-color: #7a8ca8; }
.plenio-switch[hidden] { display: none; }
.plenio-switch .icon { flex: none; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; background: #3a3a3a; color: #9a9a9a; }
.plenio-switch .icon svg { width: 22px; height: 22px; fill: currentColor; }
.plenio-switch .text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.plenio-switch .name { font-size: 14px; font-weight: 700; color: var(--input-text, #eee); }
.plenio-switch .what { color: var(--descrip-text, #aaa); white-space: normal; }
.plenio-switch .pill { flex: none; min-width: 44px; padding: 3px 0; border-radius: 999px; text-align: center; font-weight: 800; font-size: 11px;
  letter-spacing: .06em; background: #444; color: #bbb; }
.plenio-switch.on { border-color: #d9a43a; background: linear-gradient(135deg, rgba(217,164,58,.22), rgba(217,164,58,.06)); box-shadow: 0 0 0 1px rgba(217,164,58,.25) inset; }
.plenio-switch.on .icon { background: linear-gradient(135deg, #f2c35b, #d58a2a); color: #2a1c05; }
.plenio-switch.on .pill { background: #e0a83c; color: #261a05; }
.plenio-switch[data-switch="cover"].on { border-color: #4fa3d9; background: linear-gradient(135deg, rgba(79,163,217,.22), rgba(79,163,217,.06)); box-shadow: 0 0 0 1px rgba(79,163,217,.25) inset; }
.plenio-switch[data-switch="cover"].on .icon { background: linear-gradient(135deg, #7cc4f0, #3b84c4); color: #071a2a; }
.plenio-switch[data-switch="cover"].on .pill { background: #5bb0e6; color: #071a2a; }
.plenio-seed-hint { font: 11px/1.35 var(--font-family, sans-serif); color: var(--descrip-text, #aaa); padding: 2px 6px; white-space: normal; overflow-wrap: anywhere;
  overflow: hidden; }
` + Aa;
function La() {
  if (document.getElementById("plenio-styles")) return;
  const e = document.createElement("style");
  e.id = "plenio-styles", e.textContent = Na, document.head.append(e);
}
function Kt(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function it(e) {
  return Kt(e).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
function Ca(e) {
  const t = e.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((n) => n.trim());
  return t.every((n) => /^:?-{3,}:?$/.test(n)) ? null : t;
}
function Ta(e) {
  const t = [];
  let n = !1, o = null, s = null;
  const r = () => {
    n && (t.push("</ul>"), n = !1);
  }, i = () => {
    if (s) {
      const [a, ...c] = s, d = (p, m) => `<tr>${p.map((_) => `<${m}>${it(_)}</${m}>`).join("")}</tr>`;
      t.push(`<table><thead>${d(a, "th")}</thead><tbody>${c.map((p) => d(p, "td")).join("")}</tbody></table>`), s = null;
    }
  };
  for (const a of e.replace(/\r\n?/g, `
`).split(`
`)) {
    if (o !== null) {
      a.startsWith("```") ? (t.push(`<pre><code>${Kt(o.join(`
`))}</code></pre>`), o = null) : o.push(a);
      continue;
    }
    if (a.trim().startsWith("|")) {
      r();
      const p = Ca(a);
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
      t.push(`<h${p}>${it(c[2])}</h${p}>`);
      continue;
    }
    const d = /^\s*[-*]\s+(.*)$/.exec(a);
    if (d) {
      n || (t.push("<ul>"), n = !0), t.push(`<li>${it(d[1])}</li>`);
      continue;
    }
    r(), a.trim() && t.push(`<p>${it(a)}</p>`);
  }
  return r(), i(), o !== null && t.push(`<pre><code>${Kt(o.join(`
`))}</code></pre>`), t.join("");
}
const ze = "plenio_summary", oo = "plenio_summary", so = 84, Pa = 18, Oa = 55, Ia = 16, ro = 10;
function Ra(e) {
  const t = e.split(`
`).filter((n) => n.trim()).reduce((n, o) => n + Math.max(1, Math.ceil(o.length / Oa)), 0);
  return Ia + t * Pa;
}
function qa(e, t) {
  const n = e.widgets?.find((i) => i.name === oo);
  if (n?.element) return n.element;
  const o = document.createElement("div");
  o.className = "plenio-summary";
  let s = ro;
  const r = e.addDOMWidget(oo, "plenio_summary", o, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => so,
    // as tall as its text: a short summary leaves the rest of the node to the other widgets. The margins
    // count too - without them the element stayed 20 px short of its text and hid the last line
    getMaxHeight: () => Math.max(so, (o.scrollHeight ? o.scrollHeight + 2 : Ra(t.markdown)) + 2 * s)
  });
  return s = r.margin ?? ro, r.serialize = !1, o;
}
function za(e) {
  const t = e.computeSize?.();
  t && e.size && e.size[1] < t[1] && e.setSize?.([e.size[0], t[1]]);
}
const io = /* @__PURE__ */ new WeakMap();
function Zt(e, t) {
  if (!t.markdown) return;
  const n = io.get(e) ?? { markdown: "" };
  n.markdown = t.markdown, io.set(e, n);
  const o = qa(e, n);
  o.dataset.status = t.status ?? "", o.innerHTML = Ta(t.markdown), za(e), e.setDirtyCanvas?.(!0, !0);
}
function ao(e, t, n, o) {
  const s = e.properties?.[ze], r = (s?.markdown ?? "").split(`
`), i = r.findIndex((c) => c.startsWith(t));
  i >= 0 ? r[i] = n : r.push(n);
  const a = { markdown: r.join(`
`).trim(), status: o ?? s?.status ?? "" };
  e.properties = e.properties ?? {}, e.properties[ze] = a, Zt(e, a);
}
function Da(e) {
  e.prototype.onExecuted = Z(e.prototype.onExecuted, function(t) {
    const n = t?.[ze], o = n?.[n.length - 1];
    o?.markdown && (this.properties = this.properties ?? {}, this.properties[ze] = { markdown: o.markdown, status: o.status ?? "" }, Zt(this, o));
  }), e.prototype.onConfigure = Z(e.prototype.onConfigure, function() {
    const t = this.properties?.[ze];
    t?.markdown && Zt(this, t);
  });
}
const Ba = "Plenio.Core", J = xs;
Ji(J);
const G = uo, zt = { app: G, fetcher: J }, Dt = { app: G, fetcher: J }, ss = () => G.graph;
function en(e) {
  if (e == null) return null;
  const t = String(e);
  return ss()?.getNodeById?.(t.includes(":") ? t : Number(t)) ?? null;
}
const co = new Zr(
  (e) => G.extensionManager?.toast?.add({ severity: "warn", summary: e.summary, detail: e.detail, life: 2e4 })
), Ha = {
  scale: () => G.canvas?.ds?.scale ?? 1,
  toast: (e, t) => G.extensionManager?.toast?.add({ severity: "info", summary: e, detail: t, life: 12e3 })
}, rs = () => rn(import.meta.url, an), ja = {
  fetcher: J,
  async draw(e, t, n, o) {
    const { notationPdf: s, renderLines: r } = await qe(
      () => import("./notationExport-DkCMgjck.mjs").then((a) => a.c),
      rs,
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
function Fa(e, t) {
  const n = en(e), o = n?.properties?.plenio_summary;
  return n?.type === "PlenioExportRelease" && o?.markdown?.includes(`- sheet music: ${t}`) ? n : null;
}
function Wa(e, t) {
  const n = `- sheet music: ${e.job.file}`, o = Fa(t, e.job.file);
  if ("saved" in e) {
    o && ao(o, n, `${n} - saved (${Math.max(1, Math.round(e.saved.bytes / 1024))} KB)`), G.extensionManager?.toast?.add({ severity: "success", summary: "Sheet music saved", detail: e.saved.file, life: 6e3 });
    return;
  }
  const { error: s } = e, r = s instanceof U && s.hint ? `${s.message} ${s.hint}` : String(s instanceof Error ? s.message : s);
  if (e.quiet) {
    console.info(`Plenio: ${e.job.file} was saved by another page`);
    return;
  }
  o && ao(o, n, `${n} - not saved: ${r}`, "warning"), G.extensionManager?.toast?.add({ severity: "error", summary: "Sheet music not saved", detail: `${e.job.file}: ${r}`, life: 15e3 });
}
const tn = /* @__PURE__ */ new Map(), lo = new Ci(ja, (e) => {
  Wa(e, tn.get(e.job.token)), tn.delete(e.job.token);
});
uo.registerExtension({
  name: Ba,
  getCustomWidgets: () => ({ [Zo]: Ki, [es]: sa }),
  // a song's release record opens its workflow again, its documents kept (continueSong.ts)
  commands: [
    {
      id: At,
      label: "Continue a Plenio song…",
      icon: "pi pi-history",
      function: () => fr(zt).catch((e) => {
        console.error("Plenio: the Continue a song dialog could not open", e), G.extensionManager?.toast?.add({
          severity: "error",
          summary: "Continue a song",
          detail: String(e instanceof Error ? e.message : e),
          life: 15e3
        });
      })
    },
    { id: Rn, label: "Plenio Player", icon: "pi pi-play-circle", function: () => Ut(Dt) }
  ],
  menuCommands: [
    { path: ["File"], commands: [At] },
    { path: ["Plenio"], commands: [Rn, At] }
  ],
  // the Plenio Player, one click away beside Run (player.ts): started as a program of its own when none runs
  actionBarButtons: [
    {
      icon: "pi pi-play-circle",
      label: "Plenio Player",
      tooltip: "Open the Plenio Player: your songs with live lyrics, sheet music and visuals (starts it if needed)",
      onClick: () => {
        Ut(Dt);
      }
    }
  ],
  // a workflow saved before its blocks followed the brief's creativity: they are brought up to date before
  // the frontend configures it (blocks.ts); loading goes on as it was when that fails
  async beforeConfigureGraph(e) {
    try {
      const t = await Cs(e, J);
      for (const n of Ts(t)) G.extensionManager?.toast?.add({ ...n, life: 2e4 });
    } catch (t) {
      console.error("Plenio: the blocks of this workflow could not be brought up to date", t);
      const n = t instanceof U && t.hint ? `${t.message} ${t.hint}` : String(t instanceof Error ? t.message : t);
      G.extensionManager?.toast?.add({
        severity: "warn",
        summary: "Plenio blocks not brought up to date - the brief's creativity may not reach their sampling",
        detail: n,
        life: 2e4
      });
    }
  },
  // the sheets' review stops depend on the linked brief's mode: known once the links are in place
  afterConfigureGraph: () => {
    si(), oa();
  },
  beforeRegisterNodeDef(e, t) {
    if (!t.name.startsWith("Plenio")) return;
    Da(e), fi(e, Ha);
    const n = yr(t.input);
    if (n.size || t.name in ln) {
      const o = e.prototype.configure;
      e.prototype.configure = function(s) {
        const r = Dr(t, s), i = hr(r), a = o?.call(this, r);
        return br(this, i, n), Ir(t.name, this.widgets), a;
      };
    }
    if (t.name === "PlenioTranscribeLyrics" && (e.prototype.onExecuted = Z(e.prototype.onExecuted, function(o) {
      for (const s of o?.plenio_asr ?? []) Hr(s);
    })), t.name === "PlenioEQ") {
      const o = /* @__PURE__ */ new WeakMap(), s = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        s?.call(this), o.set(this, Lr(this, J));
      }, e.prototype.onExecuted = Z(e.prototype.onExecuted, function(r) {
        o.get(this)?.showExecuted(r);
      });
    }
    if (t.name === "PlenioExportRelease" && Gr(e, Dt), t.name === Vo && Ri(e), Gs.has(t.name)) {
      Vs(e, J);
      const o = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        o?.call(this), co.watch(this), Hi(
          this,
          (s, r) => G.extensionManager?.toast?.add({ severity: "info", summary: s, detail: r, life: 1e4 })
        );
      };
    }
    if (t.name === "PlenioStemMixer") {
      const o = /* @__PURE__ */ new WeakMap(), s = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        s?.call(this), o.set(this, Sa(this));
      }, e.prototype.onExecuted = Z(e.prototype.onExecuted, function(r) {
        o.get(this)?.showExecuted(r);
      });
    }
    t.name === "PlenioSongSheet" && (e.prototype.onExecuted = Z(e.prototype.onExecuted, function(o) {
      const s = o?.plenio_sheet, r = s?.[s.length - 1];
      r && In(String(this.id), r);
    }));
  },
  setup() {
    La(), $a(() => G.canvas), dr(zt), Yr(zt), J.addEventListener("plenio.sheet", (n) => {
      const o = n.detail;
      if (!o?.node_id) return;
      In(String(o.node_id), o);
      const s = en(o.node_id);
      s && Ne(s, Mo(o));
    }), J.addEventListener("status", (n) => {
      co.status(n.detail?.exec_info?.queue_remaining);
    }), J.addEventListener("execution_start", () => {
      oi(ss()?.nodes ?? []);
    }), J.addEventListener("execution_error", (n) => {
      const o = en(n.detail?.node_id);
      o && String(o.type).startsWith("Plenio") && Ne(o, "error");
    }), J.addEventListener("executed", (n) => {
      const o = n.detail, s = $i(o?.output), r = o?.display_node ?? o?.node;
      for (const i of s) tn.set(i.token, r);
      lo.take(s);
    });
    const e = () => {
      lo.recover();
    };
    let t = !1;
    J.addEventListener("reconnected", () => {
      rs().then((n) => {
        n ? t || (t = !0, G.extensionManager?.toast?.add({ severity: "warn", summary: "Plenio was updated", detail: Ft })) : e();
      });
    }), document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible" && e();
    }), window.setTimeout(e, 3e3);
  }
});
export {
  ac as $,
  Ho as A,
  Ec as B,
  Po as C,
  qo as D,
  Io as E,
  Se as F,
  Sc as G,
  yc as H,
  bi as I,
  Wn as J,
  xc as K,
  Ka as L,
  Qa as M,
  Ro as N,
  Ja as O,
  U as P,
  Mc as Q,
  Oo as R,
  zo as S,
  K as T,
  vc as U,
  cc as V,
  kc as W,
  Ua as X,
  sc as Y,
  ic as Z,
  oc as _,
  ec as a,
  De as a0,
  rc as a1,
  Ss as a2,
  Zs as a3,
  Ks as a4,
  bc as a5,
  Si as a6,
  _c as a7,
  go as a8,
  Ba as a9,
  Ya as b,
  Za as c,
  Co as d,
  lc as e,
  wi as f,
  dc as g,
  uc as h,
  mo as i,
  hc as j,
  mc as k,
  nc as l,
  fc as m,
  pc as n,
  ht as o,
  ho as p,
  hi as q,
  _e as r,
  wc as s,
  Xa as t,
  gc as u,
  tc as v,
  jo as w,
  tt as x,
  yi as y,
  _i as z
};
