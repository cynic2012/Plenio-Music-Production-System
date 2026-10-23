import { api as xr } from "../../../../scripts/api.js";
import { app as ho } from "../../../../scripts/app.js";
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
  }), r = await o.json();
  if (!o.ok) {
    const s = r?.error ?? {};
    throw new U(s.message ?? `Request failed (${o.status})`, s.hint ?? null);
  }
  return r;
}
function kr(e, t) {
  return oe(e, "/plenio/sheet/resolve", t);
}
async function Xa(e, t) {
  if (!/^[0-9a-f]{64}$/.test(t)) return null;
  const n = await e.fetchApi(`/plenio/asr/notes/${t}`);
  return n.ok ? (await n.json())?.note ?? null : null;
}
function sn(e, t, n) {
  return t ? n?.length ? { ...e, lyrics: t, lyric_spans: n } : { ...e, lyrics: t } : e;
}
function Qa(e, t, n, o) {
  return oe(e, "/plenio/score/analyze", sn({ abc: t }, n, o));
}
function Ja(e, t, n, o, r) {
  return oe(e, "/plenio/score/transform", sn({ abc: t, operation: n }, o, r));
}
function Ka(e, t) {
  const { lyrics: n, spans: o, ...r } = t;
  return oe(e, "/plenio/score/musicxml/export", sn(r, n, o));
}
function Za(e, t) {
  const { lyrics: n, ...o } = t;
  return oe(e, "/plenio/score/musicxml/import", n ? { ...o, lyrics: n } : o);
}
function ec(e, t) {
  return oe(e, "/plenio/score/midi/export", t);
}
function tc(e, t) {
  return oe(e, "/plenio/score/midi/import", t);
}
function nc(e, t) {
  return oe(e, "/plenio/lyrics/analyze", t);
}
function oc(e, t) {
  const o = `/view?${new URLSearchParams({ filename: t.filename, subfolder: t.subfolder, type: t.type }).toString()}`;
  return e.apiURL ? e.apiURL(o) : `/api${o}`;
}
function wn(e, t, n, o = 200) {
  return oe(e, "/plenio/eq/response", { settings: t, sample_rate: n, points: o });
}
function Sr(e, t) {
  return oe(e, "/plenio/brief/fields", t);
}
async function _r(e) {
  const t = await e.fetchApi("/plenio/presets/eq");
  if (!t.ok) throw new U(`Request failed (${t.status})`);
  return await t.json();
}
async function rc(e) {
  const t = await e.fetchApi("/plenio/records"), n = await t.json();
  if (!t.ok) {
    const o = n?.error ?? {};
    throw new U(o.message ?? `Request failed (${t.status})`, o.hint ?? null);
  }
  return n?.records ?? [];
}
function Er(e, t) {
  return oe(e, "/plenio/records/continue", t);
}
function Mr(e, t) {
  return oe(e, "/plenio/workflow/blocks", { workflow: t });
}
function Z(e, t) {
  return function(...n) {
    e?.apply(this, n), t.apply(this, n);
  };
}
const jt = "Plenio · ", $r = /* @__PURE__ */ new Set(["YuE2GenerateABC", "YuE2GenerateMusic", "PlenioComposePrompt", "PlenioComposeArrangement"]), Ar = "PlenioCreativity";
function Lr(e) {
  const t = e?.definitions?.subgraphs;
  return Array.isArray(t) ? t : [];
}
function Cr(e) {
  return Lr(e).some((t) => {
    if (typeof t?.name != "string" || !t.name.startsWith(jt)) return !1;
    const n = new Set((t.nodes ?? []).map((o) => o?.type));
    return !n.has(Ar) && [...n].some((o) => $r.has(String(o)));
  });
}
async function Nr(e, t) {
  if (!e || typeof e != "object" || !Cr(e)) return null;
  const n = await Mr(t, e);
  if (n.workflow) {
    const o = e;
    for (const r of Object.keys(o)) delete o[r];
    Object.assign(o, n.workflow);
  }
  return n;
}
const Wt = (e) => e.startsWith(jt) ? e.slice(jt.length) : e, bn = (e) => e.map(Wt).join(", ");
function Tr(e) {
  if (!e) return [];
  const t = [];
  if (e.updated.length) {
    const o = e.linked.length ? ` The creativity of ${bn(e.linked)} now comes from the brief.` : "";
    t.push({
      severity: "info",
      summary: "Plenio blocks brought up to date",
      detail: `This workflow was saved before its blocks followed the brief's creativity: ${bn(e.updated)} are the current blocks now.${o} At creativity 50 they work exactly as before. Save the workflow to keep it.`
    });
  }
  const n = [
    ...e.kept.map(([o, r]) => `${Wt(o)} was kept as it was (${r}) - its sampling stays fixed`),
    ...e.unlinked.map(([o, r]) => `${Wt(o)} has its own creativity slider (${r})`)
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
], Pr = ["length", "vocals", "melody"], an = {
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
}, Or = "custom";
function mo(e) {
  return typeof e == "string" && e.trim().toLowerCase() === Or;
}
function Oe(e, t) {
  const n = an[t];
  if (n)
    return (e.widgets ?? []).find((o) => o.name === n);
}
function Ir(e) {
  const t = {};
  for (const n of [...We, ...Pr]) {
    const o = Oe(e, n);
    o && (t[n] = typeof o.value == "string" ? o.value : String(o.value ?? ""));
  }
  return t;
}
function qr(e) {
  return (e.comfyClass ?? e.type) === "PlenioCoverBrief" ? "cover" : "song";
}
function yn(e, t) {
  const n = [];
  for (const o of t.fills) {
    if (!We.includes(o.field)) continue;
    const r = Oe(e, o.field);
    r && !String(r.value ?? "").trim() && o.value && n.push({ field: o.field, value: o.value });
  }
  return n;
}
function vn(e) {
  const t = [];
  for (const n of We) {
    const o = Oe(e, n);
    o && String(o.value ?? "").trim() && t.push(o);
  }
  return t;
}
function Gt(e) {
  return e.choices.filter((t) => t.suggested && t.suggested !== t.current).map((t) => ({ field: t.field, value: t.suggested }));
}
function Rr(e, t) {
  return !t || !e || e.template === "none" ? null : e.fills.length ? `Template fills: ${e.fills.map((o) => `${o.field} (${Hr(o.value)})`).join(", ")}` : "The template fills nothing: every text field has your value.";
}
function zr(e) {
  const t = e ? Gt(e) : [];
  return t.length ? `The template suggests: ${t.map((n) => `${n.field} = ${n.value}`).join(", ")}` : null;
}
function Dr(e) {
  return e?.notes.length ? e.notes.join("; ") : null;
}
function Br(e) {
  const t = e?.mode;
  return t?.description ? `Creative mode ${t.name} (experimental): ${t.description}` : null;
}
function Hr(e, t = 44) {
  const n = e.replace(/\s+/g, " ").trim();
  return n.length > t ? `${n.slice(0, t - 1)}…` : n;
}
function xn(e, t) {
  for (const n of t) {
    const o = Oe(e, n.field);
    o && (o.value = n.value, o.callback?.(n.value));
  }
  e.setDirtyCanvas?.(!0, !0);
}
function Fr(e, t) {
  for (const n of t)
    n.value = "", n.callback?.("");
  e.setDirtyCanvas?.(!0, !0);
}
function go(e) {
  const t = [];
  for (const n of We) {
    const o = Oe(e, n);
    !o || !mo(o.value) || (o.value = "", o.callback?.(""), t.push(n));
  }
  return t.length && e.setDirtyCanvas?.(!0, !0), t;
}
const kn = "plenio_brief_template", jr = 400;
function Wr(e, t) {
  let n = null, o = !1, r = null, s;
  const i = document.createElement("div");
  i.className = "plenio-brief-template";
  const a = document.createElement("div");
  a.className = "line";
  const c = document.createElement("div");
  c.className = "hint";
  const d = document.createElement("div");
  d.className = "mode";
  const f = document.createElement("div");
  f.className = "actions", i.append(a, c, d, f);
  const h = (g, w, v) => {
    const C = document.createElement("button");
    return C.textContent = g, C.title = w, C.addEventListener("click", (E) => {
      E.stopPropagation(), v();
    }), f.append(C), C;
  }, S = h("Copy template text", "Fill every empty text field with the template’s text", () => {
    n && (xn(e, yn(e, n).map((g) => ({ field: g.field, value: g.value }))), P());
  }), b = h("Use template choices", "Set length, vocals and melody to the template’s choices", () => {
    n && (xn(e, Gt(n)), P());
  }), _ = h("Reset all to template", "Clear every text field you typed into (they fall back to the template)", () => {
    const g = vn(e);
    g.length && window.confirm(`Clear ${g.length} text field(s)? The template's values apply again.`) && (Fr(e, g), P());
  }), N = h("↻", "Ask again what the template fills", () => {
    $();
  }), P = () => {
    const g = Rr(n, o);
    a.textContent = r ?? g ?? "The template fills nothing: every text field has your value.", a.dataset.state = r ? "error" : o && n ? "ok" : "empty";
    const w = zr(n), v = Dr(n);
    c.textContent = [w, v].filter(Boolean).join(" · "), c.style.display = c.textContent ? "" : "none", d.textContent = Br(n) ?? "", d.style.display = d.textContent ? "" : "none", f.style.display = o && n && n.template !== "none" ? "" : "none", S.disabled = !n || !yn(e, n).length, b.disabled = !n || !Gt(n).length, _.disabled = !vn(e).length, N.disabled = !1, e.setDirtyCanvas?.(!0, !0);
  }, Y = /* @__PURE__ */ new WeakSet(), l = () => {
    for (const g of ["template", "arrangement", ...Object.keys(an)]) {
      const w = g === "template" || g === "arrangement" ? e.widgets?.find((v) => v.name === g) : Oe(e, g);
      !w || Y.has(w) || (Y.add(w), w.callback = Z(w.callback, () => {
        l(), $();
      }));
    }
  }, L = async () => {
    l();
    const g = String(e.widgets?.find((w) => w.name === "template")?.value ?? "none");
    try {
      const w = String(e.widgets?.find((v) => v.name === "arrangement")?.value ?? "");
      n = await Sr(t, { fields: Ir(e), template: g, kind: qr(e), arrangement: w }), r = null;
    } catch (w) {
      n = null, r = `The template fields could not be read: ${w instanceof Error ? w.message : String(w)}`;
    }
    o = !0, P();
  };
  function $() {
    clearTimeout(s), s = setTimeout(() => {
      L();
    }, jr);
  }
  l();
  const y = e.addDOMWidget(kn, kn, i, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 64,
    getMaxHeight: () => 128
  });
  return y.serialize = !1, go(e), P(), $(), {
    widget: y,
    refresh: $,
    answer: () => n,
    dispose: () => clearTimeout(s)
  };
}
const Gr = /* @__PURE__ */ new Set(["PlenioSongBrief", "PlenioCoverBrief"]);
function Vr(e, t) {
  const n = /* @__PURE__ */ new WeakMap(), o = e.prototype, r = o.onNodeCreated;
  o.onNodeCreated = function() {
    r?.call(this), n.set(this, Wr(this, t));
  };
  const s = o.onConfigure;
  o.onConfigure = function(i) {
    s?.call(this, i), go(this), n.get(this)?.refresh();
  };
}
const Sn = "plenio.record/1", Ur = 2, Yr = "PLNO", Je = new TextEncoder().encode(`${Yr}plenio.project/1\0`), _n = 32 * 2 ** 20;
class pe extends Error {
}
async function Mt(e, t, n) {
  return new Uint8Array(await e.slice(t, t + n).arrayBuffer());
}
function $t(e, t) {
  return e.length >= t.length && t.every((n, o) => e[o] === n);
}
async function Xr(e) {
  const t = e.stream().pipeThrough(new DecompressionStream("gzip")).getReader(), n = [];
  let o = 0;
  for (; ; ) {
    const { done: i, value: a } = await t.read();
    if (i) break;
    if (o += a.length, o > _n)
      throw await t.cancel(), new pe(`its Plenio project is larger than ${_n / 2 ** 20} MB`);
    n.push(a);
  }
  const r = new Uint8Array(o);
  let s = 0;
  for (const i of n)
    r.set(i, s), s += i.length;
  return new TextDecoder().decode(r);
}
async function wo(e) {
  if (!$t(await Mt(e, 0, 4), new TextEncoder().encode("fLaC"))) throw new pe("it is not a FLAC file");
  let t = 4;
  for (; ; ) {
    const n = await Mt(e, t, 4);
    if (n.length < 4) throw new pe("the file ends inside its metadata");
    const o = n[1] << 16 | n[2] << 8 | n[3];
    if ((n[0] & 127) === Ur && o >= 4) {
      const r = await Mt(e, t + 4, Math.min(o, Je.length));
      if ($t(r, Je.subarray(0, 4))) {
        if (!$t(r, Je)) throw new pe("it holds a Plenio project of an unknown layout (made by a newer Plenio)");
        let s;
        try {
          s = await Xr(e.slice(t + 4 + Je.length, t + 4 + o));
        } catch (a) {
          throw a instanceof pe ? a : new pe(`its Plenio project is damaged (${a instanceof Error ? a.message : String(a)})`);
        }
        let i;
        try {
          i = JSON.parse(s);
        } catch {
          throw new pe("its Plenio project is damaged (no JSON)");
        }
        if (i?.schema !== Sn)
          throw new pe(`its Plenio project is no release record (${Sn})`);
        return i;
      }
    }
    if (n[0] & 128) return null;
    t += 4 + o;
  }
}
function bo(e) {
  return /\.flac$/i.test(e.name ?? "") || e.type === "audio/flac" || e.type === "audio/x-flac";
}
const cn = "plenio.sheet_state/1", Ge = ["title", "style", "lyrics", "score", "artwork_prompt"];
function bt() {
  return { schema: cn, docs: {} };
}
function Se(e) {
  if (e == null || typeof e == "string" && e.trim() === "")
    return bt();
  if (typeof e != "string") return null;
  try {
    const t = JSON.parse(e);
    return t?.schema !== cn || typeof t.docs != "object" || t.docs === null ? null : t;
  } catch {
    return null;
  }
}
function Be(e) {
  const t = {};
  for (const o of Ge) {
    const r = e.docs[o];
    r && (t[o] = r);
  }
  const n = { schema: cn, docs: t };
  return e.review?.approved_fingerprint && (n.review = { approved_fingerprint: e.review.approved_fingerprint }), JSON.stringify(n);
}
function At(e, t) {
  return e.docs[t]?.state ?? "auto";
}
function Qr(e) {
  if (e === null) return "Song Sheet state is unreadable - open the editor to repair it.";
  const t = Ge.filter((o) => At(e, o) !== "auto").map(
    (o) => o === "lyrics" && At(e, o) === "manual" ? "lyrics: yours (manual)" : `${o.replace("_", " ")} ${At(e, o)}`
  ), n = e.review?.approved_fingerprint ? " · approved" : "";
  return (t.length ? t.join(" · ") : "all documents automatic") + n;
}
function sc(e) {
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
const ic = "Creative modes are experimental: the writer’s plan can surprise - listen, change the score here, or run again with another arrangement seed; arrangement off keeps the music model’s own plan.";
function ac(e) {
  const t = /* @__PURE__ */ new Map();
  for (const n of e) t.set(n, (t.get(n) ?? 0) + 1);
  return [...t].map(([n, o]) => o > 1 ? `${n} (${o} times)` : n);
}
function cc(e) {
  const t = e.kind === "cover" ? "song flow closeness" : "genre closeness";
  return `${e.mode} (${t} ${e.closeness})`;
}
function En(e) {
  const t = Math.max(0, e), n = Math.floor(t / 60), o = Math.round(t - n * 60);
  return `${n}:${String(o).padStart(2, "0")}`;
}
function lc(e) {
  return e?.bars?.length ? (e.sections ?? []).map(([t, n, o]) => {
    const r = e.bars[Math.max(0, n - 1)], s = e.bars[Math.min(e.bars.length - 1, n - 1 + o - 1)];
    return { label: t, bars: o, start: En(r?.[0] ?? 0), end: En(s?.[1] ?? e.duration_s) };
  }) : [];
}
function ke(e) {
  const t = e.replace(/\r\n?/g, `
`).split(`
`).map((r) => r.replace(/\s+$/, ""));
  let n = 0, o = t.length;
  for (; n < o && !t[n]; ) n++;
  for (; o > n && !t[o - 1]; ) o--;
  return t.slice(n, o).join(`
`);
}
function Jr(e, t, n) {
  const o = e.docs[n];
  return o ? o.text : t?.docs[n]?.upstream ?? "";
}
function uc(e, t, n) {
  return n.map((o) => ({ kind: o, text: Jr(e, t, o), intent: "keep" }));
}
function yo(e, t, n) {
  const o = { ...e.docs };
  for (const s of n) {
    const i = e.docs[s.kind], a = t?.docs[s.kind], c = ke(s.text);
    if (s.intent === "auto")
      delete o[s.kind];
    else if (s.intent === "manual")
      o[s.kind] = { state: "manual", text: c };
    else if (s.intent === "rebase")
      a?.upstream_sha256 ? o[s.kind] = { state: "edited", text: c, base_sha256: a.upstream_sha256 } : o[s.kind] = { state: "manual", text: c };
    else if (i)
      ke(i.text) !== c && (o[s.kind] = { ...i, text: c });
    else {
      const d = ke(a?.upstream ?? "");
      if (c === d) continue;
      o[s.kind] = a?.upstream_sha256 ? { state: "edited", text: c, base_sha256: a.upstream_sha256 } : { state: "manual", text: c };
    }
  }
  const r = { ...bt(), docs: o };
  return e.review?.approved_fingerprint && (r.review = { approved_fingerprint: e.review.approved_fingerprint }), r;
}
function Kr(e, t) {
  return t ? { ...e, review: { approved_fingerprint: t } } : { ...e, review: void 0 };
}
function vo(e, t) {
  return Ge.filter((n) => e.includes(n) || t.docs[n]?.state === "manual");
}
function Zr(e) {
  const t = {};
  for (const n of e?.owned ?? []) t[n] = e?.docs[n]?.upstream ?? null;
  return t;
}
const es = "PlenioSongSheet";
function xo(e) {
  return e.nodes ?? e._nodes ?? [];
}
function ts(e, t) {
  return e.getNodeById?.(t) ?? e.getNodeById?.(Number(t)) ?? xo(e).find((o) => String(o.id) === t) ?? null;
}
function Lt(e, t) {
  let n = e, o = null;
  for (const r of t.split(":")) {
    if (!n || (o = ts(n, r), !o)) return null;
    n = o.subgraph;
  }
  return o;
}
function ns(e, t) {
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
function os(e, t) {
  const n = { values: 0, missing: [], sheets: 0, activated: 0 };
  for (const o of t.activate) {
    const r = Lt(e, o);
    r && r.mode !== 0 && (r.mode = 0, n.activated++);
  }
  for (const [o, r] of Object.entries(t.values)) {
    const s = Lt(e, o);
    if (!s) {
      n.missing.push(...Object.keys(r).map((a) => `${o}: ${a}`));
      continue;
    }
    const i = ns(s, r);
    n.values += Object.keys(r).length - i.length, n.missing.push(...i.map((a) => `${s.type}: ${a}`));
  }
  for (const [o, r] of Object.entries(t.sheets)) {
    const s = Lt(e, o)?.widgets?.find((i) => i.name === "sheet_state");
    s && (s.value = r, s.callback?.(r), n.sheets++);
  }
  return n;
}
function rs(e, t) {
  let n = 0;
  for (const o of xo(e)) {
    if (o.type !== es) continue;
    const r = o.widgets?.find((h) => h.name === "sheet_state");
    if (!r) continue;
    const s = Se(r.value) ?? { schema: "plenio.sheet_state/1", docs: {} }, i = (o.inputs ?? []).filter((h) => h.link != null).map((h) => h.name), a = vo(i, s), c = (a.length ? a : [...Ge]).filter((h) => !!t[h]);
    if (!c.length) continue;
    const d = { ...s.docs };
    for (const h of c) d[h] = { state: "manual", text: t[h] };
    const f = Be({ ...s, docs: d, review: void 0 });
    r.value = f, r.callback?.(f), n++;
  }
  return n;
}
function ss(e, t) {
  return (e.split(/[\\/]/).pop() ?? "").replace(/\.plenio\.json$/i, "").replace(/\.(json|flac)$/i, "") || t || "Plenio song";
}
function Ct(e, t) {
  const n = [e.plenio && `Plenio ${e.plenio}`, e.created.slice(0, 10)].filter(Boolean).join(", "), o = t?.sheets ? " Its title, style, lyrics and score are kept in the Song Sheets (manual): a new take seed gives new takes of the same song, the editor changes the score, Back to auto lets the workflow write a document again." : "";
  if (e.from === "record") return `"${e.title}" opened in the workflow it was made with (${n}).${o}`;
  if (e.from === "template") {
    const r = e.unplaced.length ? ` ${e.unplaced.length} node(s) of the song have no place in today's template: ${e.unplaced.join(", ")}.` : "";
    return `"${e.title}" (${n}) opened in today's template "${e.template}" with the song's settings.${o}${r}`;
  }
  return `The workflow "${e.title}" was made with cannot be rebuilt (a workflow of your own, from before records kept it).`;
}
const Vt = "Plenio was updated while this page was open: reload the page (F5).";
function is(e) {
  const t = /\/chunks\/(main-[^/?#]+\.mjs)(?:[?#].*)?$/.exec(e);
  return t ? t[1] : null;
}
function as(e) {
  return /chunks\/(main-[^"'?#\s]+\.mjs)/.exec(e)?.[1] ?? null;
}
async function ln(e, t) {
  const n = is(e);
  if (!n) return !1;
  try {
    const o = await t(new URL("../plenio.js", e).href), r = o ? as(o) : null;
    return r !== null && r !== n;
  } catch {
    return !1;
  }
}
async function un(e) {
  const t = await fetch(e, { cache: "no-store" });
  return t.ok ? await t.text() : null;
}
async function ze(e, t, n = "") {
  try {
    return await e();
  } catch (o) {
    throw await t() ? new Error(n ? `${Vt} ${n}` : Vt) : o;
  }
}
const Nt = "Plenio.ContinueSong", cs = "plenio.record/1";
function Ut(e, t, n, o, r = 2e4) {
  e.app.extensionManager?.toast?.add({ severity: t, summary: n, detail: o, life: r });
}
async function ft(e, t) {
  const n = await Er(e.fetcher, t);
  if (n.workflow) {
    if (!e.app.loadGraphData) throw new Error("This ComfyUI frontend cannot load a workflow for Plenio.");
    await e.app.loadGraphData(n.workflow, !0, !0, ss("path" in t ? t.path : t.name, n.title));
    const s = e.app.graph;
    if (!s) throw new Error("The workflow did not load.");
    const i = os(s, n);
    s.setDirtyCanvas?.(!0, !0), i.missing.length && console.warn("Plenio: settings of the song without a field in this workflow", i.missing), Ut(e, "success", "Song opened", Ct(n, i));
    return;
  }
  const o = e.app.graph, r = o ? rs(o, n.documents) : 0;
  if (!r)
    throw new U(
      Ct(n, null),
      "Open a workflow with a Song Sheet (a Plenio template) and continue again: the song's texts and score then go into its Song Sheets."
    );
  Ut(e, "success", "Song texts taken", `${Ct(n, null)} Its texts and score went into this workflow's Song Sheets (${r}, manual).`);
}
async function ls(e) {
  if (bo(e)) return wo(e);
  if (!/\.json$/i.test(e.name ?? "")) return null;
  try {
    const t = JSON.parse(await e.text());
    return t?.schema === cs ? t : null;
  } catch {
    return null;
  }
}
function Mn(e) {
  const t = [...e.dataTransfer?.files ?? []];
  return t.length === 1 && /\.plenio\.json$/i.test(t[0].name) ? t[0] : null;
}
function us(e, t) {
  const n = [...e.dataTransfer?.files ?? []];
  if (n.length !== 1 || !bo(n[0]) || e.shiftKey) return null;
  const o = t.canvas, r = t.graph;
  if (!o?.canvas || e.target !== o.canvas || !o.convertEventToCanvasOffset || !r?.getNodeOnPos) return null;
  const [s, i] = o.convertEventToCanvasOffset(e);
  return r.getNodeOnPos(s, i) ? null : n[0];
}
function ds(e, t = window) {
  const n = (o) => {
    const r = Mn(o) ? null : us(o, e.app), s = r ?? Mn(o);
    s && (o.preventDefault(), o.stopImmediatePropagation(), (async () => {
      if (r) {
        const a = await wo(r);
        if (a) return ft(e, { record: a, name: r.name });
        if (!e.app.handleFile) throw new U(`${r.name} carries no Plenio project.`, "Drop it with Shift held to give it to ComfyUI.");
        return e.app.handleFile(r);
      }
      const i = await ls(s);
      if (!i) throw new U(`${s.name} is no Plenio release record.`, "Drop the <name>.plenio.json that Export Release wrote next to the song.");
      await ft(e, { record: i, name: s.name });
    })().catch((i) => {
      const a = i instanceof pe ? `${s.name}: ${i.message}.` : i instanceof U && i.hint ? `${i.message} ${i.hint}` : String(i instanceof Error ? i.message : i);
      Ut(e, "error", "Song not opened", a, 3e4);
    }));
  };
  return t.addEventListener("drop", n, !0), () => t.removeEventListener("drop", n, !0);
}
async function ps(e) {
  const t = () => ln(import.meta.url, un), { openContinueDialog: n } = await ze(() => import("./openContinue-l84V_0NH.mjs"), t);
  n(e.fetcher, (o) => ft(e, o));
}
const fs = "COMFY_DYNAMICCOMBO_V3";
function hs(e) {
  const t = e?.widgets_values_named;
  return t && typeof t == "object" && !Array.isArray(t) ? { ...t } : Array.isArray(e?.widgets_values) ? [...e.widgets_values] : void 0;
}
function ms(e) {
  return (e.widgets ?? []).filter((t) => t.serialize !== !1);
}
function gs(e, t) {
  const n = ms(e);
  return Array.isArray(t) ? n.length === t.length && n.every((o, r) => o.value === t[r]) : n.every((o) => !(o.name in t) || o.value === t[o.name]);
}
function ws(e, t) {
  return (e.options?.values ?? []).includes(t);
}
function bs(e, t, n) {
  if (!t || !e.widgets || gs(e, t)) return !1;
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
    if (n.has(s.name) && !ws(s, i)) return !0;
    s.value !== i && (s.value = i);
  }
  return !0;
}
function ys(e) {
  const t = /* @__PURE__ */ new Set();
  for (const n of Object.values(e ?? {}))
    for (const [o, r] of Object.entries(n ?? {}))
      Array.isArray(r) && r[0] === fs && t.add(o);
  return t;
}
const ko = "plenio.eq/1", ct = 8, be = 20, vs = 2e4, Pe = 12, So = 15, Le = ["peak", "low_shelf", "high_shelf"], _o = ["peak", "notch", "highpass", "lowpass"], $n = [0.2, 10], An = [0.25, 1];
function $e() {
  return { schema: ko, preamp_db: 0, bands: [] };
}
function xs(e) {
  if (typeof e != "string" || !e.trim()) return $e();
  try {
    const t = JSON.parse(e);
    return typeof t != "object" || t === null || !Array.isArray(t.bands) ? null : {
      schema: ko,
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
function Ae(e) {
  return JSON.stringify(e);
}
const ee = (e, t) => Number(e.toFixed(t));
function V(e, t, n) {
  return Math.min(n, Math.max(t, e));
}
function Eo(e) {
  return e.db ?? So;
}
const Ln = [6, 12, 18], ks = { 6: 8, 12: 14, 18: 20 };
function Ss(e, t) {
  return { ...e, db: ks[t] ?? So };
}
function xe(e, t) {
  return Math.log(V(t, be, e.maxHz) / be) / Math.log(e.maxHz / be) * e.width;
}
function Cn(e, t) {
  return be * (e.maxHz / be) ** V(t / e.width, 0, 1);
}
function we(e, t) {
  const n = Eo(e);
  return (1 - (V(t, -n, n) + n) / (2 * n)) * e.height;
}
function Nn(e, t) {
  const n = Eo(e);
  return (1 - V(t / e.height, 0, 1)) * 2 * n - n;
}
function Tn(e, t, n) {
  return n ? e + (t - e) * 0.2 : t;
}
function Pn(e, t, n) {
  return t.map((o, r) => `${r ? "L" : "M"}${xe(e, o).toFixed(1)},${we(e, n[r] ?? 0).toFixed(1)}`).join(" ");
}
function dn(e) {
  return Math.min(vs, 0.45 * e);
}
function _s(e) {
  const t = new Set(e.bands.map((o) => o.id));
  let n = e.bands.length + 1;
  for (; t.has(`band-${n}`); ) n++;
  return `band-${n}`;
}
function Es(e, t, n = 0, o = 48e3) {
  if (e.bands.length >= ct) return null;
  const r = {
    id: _s(e),
    enabled: !0,
    type: "peak",
    frequency_hz: ee(V(t, be, dn(o)), 1),
    gain_db: ee(V(n, -Pe, Pe), 1),
    q: 1,
    slope: 1
  };
  return { ...e, bands: [...e.bands, r] };
}
function Ie(e, t, n, o, r = 48e3) {
  return {
    ...e,
    bands: e.bands.map(
      (s) => s.id !== t ? s : {
        ...s,
        frequency_hz: ee(V(n, be, dn(r)), 1),
        gain_db: Le.includes(s.type) ? ee(V(o, -Pe, Pe), 1) : s.gain_db
      }
    )
  };
}
function Tt(e, t, n) {
  return {
    ...e,
    bands: e.bands.map((o) => o.id === t ? { ...o, q: ee(V(o.q * n, 0.2, 10), 3) } : o)
  };
}
function Pt(e, t) {
  return { ...e, bands: e.bands.filter((n) => n.id !== t) };
}
function qe(e) {
  const t = e.frequency_hz >= 1e3 ? `${ee(e.frequency_hz / 1e3, 2)} kHz` : `${Math.round(e.frequency_hz)} Hz`, n = Le.includes(e.type) ? ` ${e.gain_db > 0 ? "+" : ""}${ee(e.gain_db, 1)} dB` : "";
  return `${e.type.replace("_", " ")} ${t}${n}, Q ${ee(e.q, 2)}`;
}
function Ms(e, t) {
  const n = Mo[e.type] ?? e.type, o = e.frequency_hz >= 1e3 ? `${(e.frequency_hz / 1e3).toFixed(2)} kHz` : `${Math.round(e.frequency_hz)} Hz`, r = Le.includes(e.type) ? ` ${e.gain_db > 0 ? "+" : ""}${e.gain_db.toFixed(1)} dB` : "", s = _o.includes(e.type) ? ` Q ${ee(e.q, 2)}` : "";
  return `● ${t + 1} ${n} ${o}${r}${s}${e.enabled ? "" : " (off)"}`;
}
const Mo = {
  peak: "Bell",
  low_shelf: "Low shelf",
  high_shelf: "High shelf",
  highpass: "Low cut",
  lowpass: "High cut",
  notch: "Notch"
};
function Ot(e, { kilo: t = !1 } = {}) {
  let n = e.trim().replace(",", ".").replace(/\s*(hz|db)$/i, ""), o = 1;
  if (t && /k$/i.test(n) && (o = 1e3, n = n.slice(0, -1).trim()), !/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(n)) return null;
  const r = Number(n) * o;
  return Number.isFinite(r) ? r : null;
}
function Ke(e, t) {
  const n = Number(e);
  return Number.isFinite(n) ? n : t;
}
function lt(e, t, n, o = 48e3) {
  return {
    ...e,
    bands: e.bands.map((r) => {
      if (r.id !== t) return r;
      const s = { ...r, ...n };
      return {
        ...s,
        frequency_hz: ee(V(Ke(s.frequency_hz, r.frequency_hz), be, dn(o)), 1),
        gain_db: ee(V(Ke(s.gain_db, r.gain_db), -Pe, Pe), 1),
        q: ee(V(Ke(s.q, r.q), $n[0], $n[1]), 3),
        slope: ee(V(Ke(s.slope, r.slope), An[0], An[1]), 2),
        enabled: s.enabled !== !1
      };
    })
  };
}
function On(e, t) {
  return lt(e, t, { gain_db: 0 });
}
function In(e, t, n, { heightFraction: o = 0.7 } = {}) {
  if (!t.length || t.length !== n.length) return "";
  const r = n.filter((h) => Number.isFinite(h));
  if (!r.length) return "";
  const s = Math.max(...r), i = Math.min(...r), a = Math.max(s - i, 1e-6), c = e.height - 4, d = c - Math.max(12, e.height * V(o, 0.1, 0.95));
  return `M${t.map((h, S) => {
    const b = n[S], _ = Number.isFinite(b) ? (b - i) / a : 0;
    return `${xe(e, h).toFixed(1)},${(c - _ * (c - d)).toFixed(1)}`;
  }).join(" L")} L${e.width.toFixed(1)},${c.toFixed(1)} L0,${c.toFixed(1)} Z`;
}
class $s {
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
    Ae(t) !== Ae(this.current) && (this.entries = this.entries.slice(0, this.index + 1), this.entries.push(t), this.entries.length > this.limit && this.entries.shift(), this.index = this.entries.length - 1);
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
const As = "http://www.w3.org/2000/svg", qn = "plenio_eq_panel", Ze = "mode.bands", he = { capture: !0 }, se = { width: 560, height: 260 }, et = ["#4aa3ff", "#f0a35e", "#6fbf73", "#d873c8", "#e0c65a", "#5ac8c8", "#b28df0", "#e08a8a"];
let It = null;
function ue(e, t) {
  const n = document.createElementNS(As, e);
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
function de(e, t) {
  return e.widgets?.find((n) => n.name === t);
}
function Ls(e, t) {
  return e.bands.length === t.bands.length && e.bands.every((n, o) => {
    const r = t.bands[o];
    return r !== void 0 && n.type === r.type && n.enabled === r.enabled && Math.abs(n.frequency_hz - r.frequency_hz) < 0.5 && Math.abs(n.gain_db - r.gain_db) < 0.05 && Math.abs(n.q - r.q) < 0.01;
  });
}
function Cs(e, t) {
  const n = F("div", "plenio-eq"), o = F("div", "plenio-eq-tools"), r = F("select");
  r.setAttribute("aria-label", "EQ preset"), r.title = "EQ preset: sets every band at once (the list comes from resources/presets/eq.json)";
  const s = F("select");
  s.setAttribute("aria-label", "Gain range"), s.title = "Gain range: the dB axis of the curve and how far a drag may go";
  for (const u of Ln) s.append(new Option(`±${u} dB`, String(u)));
  const i = ve("", "↶", "Undo the last band change"), a = ve("", "↷", "Redo the last band change"), c = ve("", "reset", "Remove every band"), d = ve("", "compare", "Show the curve without the EQ (bypass)"), f = ve("", "bands as text", "Show or hide the plenio.eq/1 JSON widget"), h = F("span", "plenio-eq-info");
  h.setAttribute("aria-live", "polite"), h.title = "What the panel is showing right now (the selected band, a note, or a hint)", o.append(r, s, i, a, c, d, f, h);
  const S = F("div", "plenio-eq-mode"), b = ue("svg", {
    viewBox: `0 0 ${se.width} ${se.height}`,
    class: "plenio-eq-plot",
    role: "img",
    preserveAspectRatio: "none"
  });
  b.setAttribute("aria-label", "EQ response curve"), b.setAttribute("tabindex", "0"), b.setAttribute("title", "Drag a handle to move a band (Shift = fine), wheel = Q, double-click = new band, Delete = remove");
  const _ = F("div", "plenio-eq-strip"), N = F("div", "plenio-eq-editor"), P = F("div", "plenio-eq-fields");
  N.append(P), n.append(o, S, b, _, N);
  const Y = e.addDOMWidget(qn, qn, n, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 420,
    getMaxHeight: () => 620
  });
  Y.serialize = !1;
  let l = { sampleRate: 48e3, frequencies: [], response: [], settings: $e(), readonly: !0, note: "" }, L = null, $ = null, y = !1, g = 12, w = null, v = [], C = 0, E, X, z = null, j = !1;
  const B = /* @__PURE__ */ new Map();
  let H = null;
  const O = new $s($e()), te = () => de(e, Ze), re = () => g, M = () => Ss({ ...se, maxHz: Math.min(2e4, l.sampleRate / 2) }, re());
  function I(u, { record: m = !0 } = {}) {
    const p = te();
    if (!p) return;
    const x = Ae(u);
    p.value = x, p.callback?.(x), m && O.push(u), l = { ...l, settings: u }, W(), ce(0);
  }
  async function ce(u = 120) {
    clearTimeout(E), E = setTimeout(async () => {
      const m = String(de(e, "mode")?.value ?? "flat");
      if (m !== "manual") {
        m === "flat" ? l = {
          ...l,
          settings: $e(),
          response: l.frequencies.map(() => 0),
          readonly: !0,
          note: "flat: no change"
        } : L !== m ? l = {
          ...l,
          settings: $e(),
          response: l.frequencies.map(() => 0),
          readonly: !0,
          note: `${m}: the bands are fitted to your audio when the workflow runs - run once to see the proposal here`
        } : l = { ...l, readonly: !0 }, W();
        return;
      }
      const p = xs(te()?.value);
      if (!p) {
        l = { ...l, readonly: !0, note: "the bands are not valid JSON" }, W();
        return;
      }
      Ae(p) !== Ae(O.current) && O.reset(p);
      const x = ++C;
      try {
        const A = await wn(t, p, l.sampleRate);
        if (x !== C) return;
        l = {
          ...l,
          frequencies: A.frequency_hz,
          response: A.response_db,
          settings: A.settings,
          readonly: !1,
          note: ""
        };
      } catch (A) {
        l = { ...l, readonly: !1, note: A instanceof Error ? A.message : String(A) };
      }
      W();
    }, u);
  }
  const Ee = (u) => ({
    ...u.settings,
    bands: u.settings.bands.slice(0, ct)
  });
  function Ue() {
    if (!w) return "";
    const u = v.find((m) => m.name === w);
    return u && Ls(Ee(u), l.settings) ? w : "";
  }
  function W() {
    b.replaceChildren(), B.clear(), H = null;
    const u = M();
    for (const p of [-u.db, -u.db / 2, 0, u.db / 2, u.db])
      b.append(
        ue("line", { x1: 0, x2: u.width, y1: we(u, p), y2: we(u, p), class: p ? "grid" : "grid zero" })
      );
    for (const p of [100, 1e3, 1e4])
      b.append(ue("line", { x1: xe(u, p), x2: xe(u, p), y1: 0, y2: u.height, class: "grid" }));
    l.beforeDb?.length === l.frequencies.length && b.append(ue("path", { d: In(u, l.frequencies, l.beforeDb), class: "spectrum before" })), l.afterDb?.length === l.frequencies.length && b.append(ue("path", { d: In(u, l.frequencies, l.afterDb), class: "spectrum after" })), y ? b.append(ue("line", { x1: 0, x2: u.width, y1: we(u, 0), y2: we(u, 0), class: "curve flat" })) : l.frequencies.length && (H = ue("path", { d: Pn(u, l.frequencies, l.response), class: "curve" }), b.append(H)), !l.readonly && !y && l.settings.bands.forEach((p, x) => {
      const A = et[x % et.length], q = Le.includes(p.type) ? p.gain_db : 0, k = ue("circle", {
        cx: xe(u, p.frequency_hz),
        cy: we(u, q),
        r: p.id === $ ? 9 : 7,
        class: p.id === $ ? "handle selected" : "handle",
        style: `stroke: ${A}`,
        tabindex: 0,
        "data-band": p.id
      });
      k.setAttribute("aria-label", `Band ${x + 1}: ${qe(p)}`), p.enabled || k.classList.add("disabled"), k.append(ue("title", {})), k.lastChild.textContent = `Band ${x + 1}: ${qe(p)}`, k.addEventListener("pointerdown", (D) => pr(D, p.id)), k.addEventListener("dblclick", (D) => {
        D.stopPropagation(), I(On(l.settings, p.id));
      }), k.addEventListener("focus", () => lr(p.id)), k.addEventListener("keydown", (D) => fn(D, p.id)), k.addEventListener("wheel", (D) => {
        D.preventDefault();
        const ye = D.deltaY < 0 ? 1.15 : 1 / 1.15;
        I(Tt(l.settings, p.id, ye));
      }), k.addEventListener("contextmenu", (D) => {
        D.preventDefault(), I(Pt(l.settings, p.id));
      }), b.append(k), B.set(p.id, k);
    }), yt(), fe(), vt();
    const m = l.settings.bands.find((p) => p.id === $);
    h.textContent = l.note || (y ? "compare: the curve is off (the node still applies it)" : m ? qe(m) : l.readonly ? `${l.settings.bands.length} band(s)` : `drag a handle, Shift = fine, wheel = Q, double-click = add · ${l.settings.bands.length}/${ct}`), r.disabled = l.readonly, i.disabled = !O.canUndo, a.disabled = !O.canRedo, c.disabled = l.readonly || !l.settings.bands.length, j && (j = !1, $ && B.get($)?.focus({ preventScroll: !0 })), s.value = String(g), r.value = Ue(), d.classList.toggle("active", y), f.classList.toggle("active", kt()), e.setDirtyCanvas?.(!0, !0);
  }
  function yt() {
    if (_.replaceChildren(), l.readonly && !l.settings.bands.length) {
      _.append(F("span", "plenio-eq-hint", l.note || "no bands"));
      return;
    }
    l.settings.bands.forEach((u, m) => {
      const p = F("button", "plenio-eq-chip", Ms(u, m));
      p.style.borderLeftColor = et[m % et.length], p.classList.toggle("selected", u.id === $), p.classList.toggle("disabled", !u.enabled), p.setAttribute("aria-label", `Edit band ${m + 1}`), p.title = `Band ${m + 1}: ${qe(u)} - click to open its fields`, p.addEventListener("click", (x) => {
        x.stopPropagation(), $ = $ === u.id ? null : u.id, W();
      }), _.append(p);
    });
  }
  function fe() {
    P.replaceChildren();
    const u = l.settings.bands.find((k) => k.id === $);
    if (!u || l.readonly) {
      N.style.display = "none";
      return;
    }
    N.style.display = "";
    const m = F("span", "name", `Band ${l.settings.bands.indexOf(u) + 1}`);
    m.title = "The selected band";
    const p = F("select");
    p.setAttribute("aria-label", "Band type"), p.title = "Band type: bell and shelves change the gain, the cuts and the notch do not";
    for (const [k, D] of Object.entries(Mo)) p.append(new Option(D, k));
    p.value = u.type, p.addEventListener("change", () => I(lt(l.settings, u.id, { type: p.value })));
    const x = F("input");
    x.type = "checkbox", x.checked = u.enabled, x.setAttribute("aria-label", "Band enabled"), x.title = "Band enabled: off keeps the band in the list but out of the response", x.addEventListener("change", () => I(lt(l.settings, u.id, { enabled: x.checked })));
    const A = [
      [
        "Hz",
        `${u.frequency_hz}`,
        70,
        (k) => _t(u.id, "frequency_hz", Ot(k, { kilo: !0 }))
      ],
      ["dB", `${u.gain_db}`, 60, (k) => _t(u.id, "gain_db", Ot(k))],
      ["Q", `${u.q}`, 60, (k) => _t(u.id, "q", Ot(k))]
    ];
    P.append(m, p, x);
    for (const [k, D, ye, Ye] of A) {
      const Q = F("input", "number");
      Q.value = D, Q.style.width = `${ye}px`, Q.setAttribute("aria-label", `Band ${k}`), Q.title = k === "Hz" ? "Frequency of the band in Hz (the centre of a bell, the corner of a shelf)" : k === "dB" ? "Gain in dB (bell and shelves; the cuts and the notch have none)" : "Q: how narrow the band is - higher Q, smaller range";
      const Xe = () => {
        Ye(Q.value) || (Q.value = D);
      };
      Q.addEventListener("keydown", (le) => {
        le.key === "Enter" && Xe();
      }), Q.addEventListener("blur", Xe), (k === "dB" && !Le.includes(u.type) || k === "Q" && !_o.includes(u.type)) && (Q.disabled = !0), P.append(Q);
    }
    const q = ve("", "remove", "Remove this band");
    q.addEventListener("click", (k) => {
      k.stopPropagation(), $ = null, I(Pt(l.settings, u.id));
    }), P.append(q);
  }
  function vt() {
    S.replaceChildren();
    const u = String(de(e, "mode")?.value ?? "flat");
    if (u === "manual" || u === "flat") {
      S.style.display = "none";
      return;
    }
    S.style.display = "", S.append(
      F(
        "span",
        "plenio-eq-hint",
        L === u ? `applied proposal (${l.settings.bands.length} band(s), ${u})` : `${u}: no proposal yet - it is computed on the next run`
      )
    );
    const m = ve("", "Edit these bands", "Copy the proposal into manual bands and edit it");
    m.disabled = !l.settings.bands.length, m.addEventListener("click", (p) => {
      p.stopPropagation();
      const x = de(e, "mode");
      if (!x) return;
      x.value = "manual", x.callback?.("manual");
      const A = te();
      if (A) {
        const q = Ae(l.settings);
        A.value = q, A.callback?.(q);
      }
      O.reset(l.settings), Et(), ce(0);
    }), S.append(m);
  }
  function lr(u) {
    $ = u, j = !0, W();
  }
  function ur(u) {
    $ = u, xt();
  }
  function xt() {
    const u = M();
    l.settings.bands.forEach((p) => {
      const x = B.get(p.id);
      if (!x) return;
      const A = Le.includes(p.type) ? p.gain_db : 0;
      x.setAttribute("cx", String(xe(u, p.frequency_hz))), x.setAttribute("cy", String(we(u, A))), x.classList.toggle("selected", p.id === $), x.setAttribute("r", p.id === $ ? "9" : "7");
    }), H && l.frequencies.length && H.setAttribute("d", Pn(u, l.frequencies, l.response));
    const m = l.settings.bands.find((p) => p.id === $);
    m && (h.textContent = qe(m));
  }
  function dr() {
    clearTimeout(X), X = setTimeout(async () => {
      const u = l.settings, m = ++C;
      try {
        const p = await wn(t, u, l.sampleRate);
        if (m !== C) return;
        l = { ...l, frequencies: p.frequency_hz, response: p.response_db }, xt();
      } catch {
      }
    }, 60);
  }
  function kt() {
    return !de(e, Ze)?.plenioHidden;
  }
  function St(u) {
    const m = de(e, Ze);
    m && (m.plenioHidden = !u, u ? delete m.computeSize : m.computeSize = () => [0, -4], e.setDirtyCanvas?.(!0, !0));
  }
  function _t(u, m, p) {
    if (p === null) return !1;
    const x = l.settings.bands.find((A) => A.id === u);
    return x && x[m] === p || I(lt(l.settings, u, { [m]: p })), !0;
  }
  function pr(u, m) {
    u.preventDefault(), u.stopPropagation(), $ !== m && ur(m);
    const p = l.settings.bands.find((ne) => ne.id === m);
    if (!p) return;
    z = { hz: p.frequency_hz, db: p.gain_db };
    let x = !1, A = !1;
    const q = u.currentTarget;
    try {
      q?.setPointerCapture?.(u.pointerId);
    } catch {
    }
    const k = b.getBoundingClientRect(), D = k.width ? k.left : 0, ye = k.height ? k.top : 0, Ye = k.width || se.width, Q = k.height || se.height, Xe = (ne, Qe) => ne >= D - 1 && ne <= D + Ye + 1 && Qe >= ye - 1 && Qe <= ye + Q + 1;
    function le() {
      if (!A) {
        A = !0;
        try {
          q?.releasePointerCapture?.(u.pointerId);
        } catch {
        }
        window.removeEventListener("pointermove", gn, he), window.removeEventListener("pointerup", le, he), window.removeEventListener("pointercancel", le, he), window.removeEventListener("blur", le, he), z = null, x && I(l.settings);
      }
    }
    const gn = (ne) => {
      if (A || !z) return;
      if (ne.buttons === 0) {
        le();
        return;
      }
      if (!Xe(ne.clientX, ne.clientY)) return;
      const Qe = se.width / Ye, hr = se.height / Q, mr = (ne.clientX - D) * Qe, gr = (ne.clientY - ye) * hr, wr = xe(M(), z.hz), br = we(M(), z.db), yr = Cn(M(), Tn(wr, mr, ne.shiftKey)), vr = Nn(M(), Tn(br, gr, ne.shiftKey));
      l = { ...l, settings: Ie(l.settings, m, yr, vr, l.sampleRate) }, x = !0, xt(), dr();
    };
    window.addEventListener("pointermove", gn, he), window.addEventListener("pointerup", le, he), window.addEventListener("pointercancel", le, he), window.addEventListener("blur", le, he);
  }
  function fn(u, m) {
    const p = l.settings.bands.find((k) => k.id === m);
    if (!p) return;
    const x = u.shiftKey ? 0.1 : 0.5, A = u.shiftKey ? 1.01 : 1.06;
    let q = null;
    u.key === "ArrowUp" ? q = Ie(l.settings, m, p.frequency_hz, p.gain_db + x, l.sampleRate) : u.key === "ArrowDown" ? q = Ie(l.settings, m, p.frequency_hz, p.gain_db - x, l.sampleRate) : u.key === "ArrowRight" ? q = Ie(l.settings, m, p.frequency_hz * A, p.gain_db, l.sampleRate) : u.key === "ArrowLeft" ? q = Ie(l.settings, m, p.frequency_hz / A, p.gain_db, l.sampleRate) : u.key === "+" ? q = Tt(l.settings, m, 1.15) : u.key === "-" ? q = Tt(l.settings, m, 1 / 1.15) : u.key === "0" ? q = On(l.settings, m) : (u.key === "Delete" || u.key === "Backspace") && (q = Pt(l.settings, m)), q && (u.preventDefault(), I(q));
  }
  b.addEventListener("keydown", (u) => {
    $ && u.target === b && fn(u, $);
  }), b.addEventListener("dblclick", (u) => {
    if (l.readonly || y) return;
    const m = b.getBoundingClientRect(), p = se.width / (m.width || se.width), x = se.height / (m.height || se.height), A = (u.clientX - m.left) * p, q = (u.clientY - m.top) * x, k = Es(l.settings, Cn(M(), A), Nn(M(), q), l.sampleRate);
    k ? ($ = k.bands[k.bands.length - 1].id, I(k)) : (l = { ...l, note: `the EQ has at most ${ct} bands` }, W());
  }), r.append(new Option("preset…", "")), It ??= _r(t).then((u) => u.manual).catch(() => []), It.then((u) => {
    v = u;
    for (const m of u) r.append(new Option(m.name, m.name));
    r.value = Ue();
  }), r.addEventListener("change", async () => {
    const u = (await It)?.find((m) => m.name === r.value);
    u && (w = u.name, I(Ee(u)));
  }), s.addEventListener("change", () => {
    const u = Number(s.value);
    g = Ln.find((m) => m === u) ?? 12, W();
  }), i.addEventListener("click", () => {
    const u = O.undo();
    u && I(u, { record: !1 });
  }), a.addEventListener("click", () => {
    const u = O.redo();
    u && I(u, { record: !1 });
  }), c.addEventListener("click", () => {
    $ = null, I($e());
  }), d.addEventListener("click", () => {
    y = !y, W();
  }), f.addEventListener("click", () => {
    St(!kt()), W();
  });
  function Et() {
    for (const u of ["mode", Ze]) {
      const m = de(e, u);
      if (!m || m.plenioWatched) continue;
      m.plenioWatched = !0;
      const p = m.callback;
      m.callback = (x) => {
        p?.(x), setTimeout(() => {
          kt() || St(!1), ce();
        });
      };
    }
  }
  Et(), St(!1), ce(0);
  let hn = null, mn = null;
  const fr = setInterval(() => {
    if (!n.isConnected) {
      clearInterval(fr);
      return;
    }
    const u = String(de(e, "mode")?.value ?? "flat"), m = String(te()?.value ?? "");
    u === hn && m === mn || (hn = u, mn = m, Et(), ce(0));
  }, 700);
  return {
    showExecuted(u) {
      const m = u?.plenio_eq, p = m?.[m.length - 1];
      if (!p) return;
      const x = String(de(e, "mode")?.value ?? "flat"), A = x === "manual";
      L = A || x === "flat" ? null : x, l = {
        sampleRate: p.sample_rate,
        frequencies: p.frequency_hz,
        response: p.response_db,
        settings: p.settings,
        readonly: !A,
        note: A ? "" : `applied: ${p.settings.bands.length} band(s)`,
        beforeDb: p.spectrum_before_db,
        afterDb: p.spectrum_after_db
      }, A ? ce(0) : W();
    }
  };
}
const pn = {
  PlenioSongBrief: "one song, stop to review",
  PlenioCoverBrief: "one cover, stop to review"
}, Ns = new Set(We.map((e) => an[e]));
function Ts(e, t) {
  return !(e in pn) || !t || typeof t != "object" || Array.isArray(t) ? [] : Object.entries(t).filter(([n, o]) => Ns.has(n) && mo(o)).map(([n]) => n);
}
function Ps(e, t) {
  for (const n of Object.values(e.input ?? {})) {
    const o = n?.[t];
    if (!Array.isArray(o)) continue;
    if (Array.isArray(o[0])) return o[0];
    const r = o[1]?.options;
    return Array.isArray(r) ? r : [];
  }
  return [];
}
const Os = {
  PlenioSongBrief: { arrangement: { simple: "off" } },
  PlenioCoverBrief: { arrangement: { simple: "off" } }
};
function Is(e, t) {
  const n = Os[e];
  if (!n) return [];
  const o = [];
  for (const r of t ?? []) {
    const s = n[r.name]?.[String(r.value)];
    s !== void 0 && (r.value = s, o.push(r.name));
  }
  return o;
}
const Rn = 6, qs = 8, Rs = 18;
function zs(e) {
  if (e[Rn] !== "tags" || e.length > Rs) return e;
  const t = Rn + 1 + qs;
  return [...e.slice(0, t), "", ...e.slice(t)];
}
function Ds(e, t) {
  if (e.name === "PlenioExportRelease" && t && Array.isArray(t.widgets_values)) {
    const c = zs(t.widgets_values);
    return c === t.widgets_values ? t : { ...t, widgets_values: c };
  }
  const n = pn[e.name];
  if (!n || !t) return t;
  const o = Ps(e, "mode"), r = t.widgets_values, s = t.widgets_values_named;
  let i = t;
  Array.isArray(r) && r.length && !o.includes(r[0]) && (i = { ...i, widgets_values: [n, ...r] }), s && typeof s == "object" && !Array.isArray(s) && !("mode" in s) && (i = { ...i, widgets_values_named: { mode: n, ...s } });
  const a = Ts(e.name, i.widgets_values_named);
  if (a.length) {
    const c = { ...i.widgets_values_named };
    for (const d of a) c[d] = "";
    i = { ...i, widgets_values_named: c };
  }
  return i;
}
const $o = /* @__PURE__ */ new Map(), Yt = /* @__PURE__ */ new Set();
function zn(e, t) {
  $o.set(e, t);
  for (const n of Yt) n(e);
}
function Me(e) {
  return $o.get(e) ?? null;
}
function Bs(e) {
  return Yt.add(e), () => Yt.delete(e);
}
const Ao = /* @__PURE__ */ new Map();
function Hs(e) {
  e?.draft_sha256 && Ao.set(e.draft_sha256, e);
}
function Fs(e) {
  return e ? Ao.get(e) ?? null : null;
}
const Dn = "Plenio.OpenPlayer", Bn = "plenio-player", js = "▶ Open in the Plenio Player";
function Xt(e, t, n, o, r = 12e3) {
  e.extensionManager?.toast?.add({ severity: t, summary: n, detail: o, life: r });
}
async function Ws(e) {
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
function Hn(e, t) {
  const n = e.endsWith("/") ? e : `${e}/`;
  return t ? `${n}#/record/${encodeURIComponent(t)}` : `${n}#/`;
}
async function Qt(e, t = null, n = window) {
  const o = n.open("", Bn);
  let r = !0;
  try {
    r = !o || o.location.href === "about:blank";
  } catch {
    r = !1;
  }
  if (o && r)
    try {
      o.document.title = "Plenio Player", o.document.body.style.cssText = "margin:0;height:100vh;display:grid;place-items:center;background:#0a0910;color:#a99fc0;font:600 18px system-ui,sans-serif", o.document.body.textContent = "Starting the Plenio Player …";
    } catch {
    }
  try {
    const s = await Ws(e.fetcher);
    o ? ((r || t) && (o.location.href = Hn(s.url, t)), o.focus()) : n.open(Hn(s.url, t), Bn), s.started && Xt(e.app, "success", "Plenio Player started", `${s.url} - it keeps running when ComfyUI stops; stop it on its Settings page.`);
  } catch (s) {
    o && r && o.close();
    const i = s instanceof U && s.hint ? ` ${s.hint}` : "";
    Xt(e.app, "error", "Plenio Player", `${s instanceof Error ? s.message : String(s)}${i}`, 2e4);
  }
}
function Gs(e, t) {
  const n = /* @__PURE__ */ new WeakMap(), o = e.prototype, r = o.onNodeCreated;
  o.onNodeCreated = function() {
    r?.call(this);
    const i = this.addWidget?.("button", js, null, () => {
      Qt(t, n.get(this) ?? null);
    }, { serialize: !1 });
    i && (i.serialize = !1);
  }, e.prototype.onExecuted = Z(e.prototype.onExecuted, function(s) {
    const i = s?.plenio_player, a = i?.[i.length - 1]?.record;
    a && n.set(this, a);
  });
}
const Vs = /* @__PURE__ */ new Set(["127.0.0.1", "localhost", "[::1]"]);
function Us(e, t) {
  if (e === t) return !0;
  try {
    const n = new URL(e);
    return n.protocol !== "http:" && n.protocol !== "https:" ? !1 : Vs.has(n.hostname) || n.hostname === new URL(t).hostname;
  } catch {
    return !1;
  }
}
function Ys(e, t = window, n = 1500) {
  const o = new URLSearchParams(t.location.search);
  if (o.get("plenio") !== "continue") return !1;
  o.delete("plenio");
  const r = o.toString();
  t.history.replaceState(t.history.state, "", `${t.location.pathname}${r ? `?${r}` : ""}${t.location.hash}`);
  const s = t.opener;
  if (!s) return !0;
  const i = (a) => {
    const c = a.data;
    c?.type !== "plenio-continue" || a.source !== s || !Us(a.origin, t.location.origin) || (t.removeEventListener("message", i), ft(e, { record: c.record, name: String(c.name || "the Plenio Player") }).catch((d) => {
      const f = d instanceof U && d.hint ? ` ${d.hint}` : "";
      Xt(e.app, "error", "Continue a song", `${d instanceof Error ? d.message : String(d)}${f}`, 2e4);
    }));
  };
  return t.addEventListener("message", i), t.setTimeout(() => s.postMessage({ type: "plenio-ready" }, "*"), n), !0;
}
const Xs = {
  "one song, stop to review": "new song every run",
  "one cover, stop to review": "new cover every run"
}, Qs = 2e3, Js = 3e4;
function Ks(e, t, n, o) {
  const r = Xs[t];
  return !r || n <= 0 && o <= 1 ? null : {
    summary: "These runs stop for your review",
    detail: `${e}: "${t}" - each run waits at the Song Sheets until you press Approve, so queued runs render nothing by themselves. For runs that go through, choose "${r}" in the brief's mode.`
  };
}
class Zs {
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
    this.recent = [...this.recent.filter((s) => o - s < Qs), o];
    const r = Ks(t, n, this.queued, this.recent.length);
    !r || o - this.lastNotice < Js || (this.lastNotice = o, this.notify(r));
  }
  /** Hear of every run queued with this brief node (its *mode* widget's ``beforeQueued``). */
  watch(t) {
    const n = t.widgets?.find((r) => r.name === "mode");
    if (!n) return;
    const o = n.beforeQueued;
    n.beforeQueued = (r) => {
      o?.(r), r?.isPartialExecution || this.queuing(String(t.title || t.type), String(n.value ?? ""));
    };
  }
}
const qt = {
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
function Lo(e) {
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
      return "✖ fix the sheet (its Edit button)";
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
const ht = /* @__PURE__ */ new WeakMap(), He = /* @__PURE__ */ new Set();
function Co(e) {
  return ht.get(e) ?? null;
}
function Ce(e, t) {
  t ? ht.set(e, t) : ht.delete(e), e.setDirtyCanvas?.(!0, !0);
  for (const n of He) n(e);
}
function oi(e) {
  for (const t of e) ht.delete(t);
  for (const t of He) t(null);
}
function ri() {
  for (const e of He) e(null);
}
function si(e) {
  return He.add(e), () => He.delete(e);
}
const Fn = "600 12px sans-serif", tt = 20, Rt = 7;
function ii(e) {
  return e.label ? `${e.icon} ${e.label}` : e.icon;
}
function ai(e) {
  const t = e ? ii(e) : "";
  return {
    height: e ? tt : 0,
    getWidth(n) {
      if (!e) return 0;
      n.save(), n.font = Fn;
      const o = n.measureText(t).width + 2 * Rt;
      return n.restore(), o;
    },
    draw(n, o, r) {
      if (!e) return;
      n.save(), n.font = Fn;
      const s = n.measureText(t).width + 2 * Rt;
      n.fillStyle = e.color, n.beginPath(), typeof n.roundRect == "function" ? n.roundRect(o, r, s, tt, 5) : n.rect(o, r, s, tt), n.fill(), n.fillStyle = "#ffffff", n.textBaseline = "middle", n.fillText(t, o + Rt, r + tt / 2 + 0.5), n.restore();
    }
  };
}
const ci = "PlenioSongSheet", li = 30;
function No(e, t) {
  const n = e.widgets?.find((o) => o.name === t);
  return n ? String(n.value ?? "") : null;
}
function ui(e) {
  const t = e.inputs?.findIndex((n) => n.name === "brief") ?? -1;
  if (t < 0) return null;
  try {
    const n = e.getInputNode?.(t);
    return n ? No(n, "mode") : null;
  } catch {
    return null;
  }
}
function Jt(e) {
  const t = Co(e);
  return t || (e.type !== ci ? null : ti(No(e, "review") ?? "continue", ui(e)) ? "stop" : null);
}
function di(e) {
  const t = e?.plenio_sheet, n = t?.[t.length - 1];
  if (n) return Lo(n);
  const o = e?.plenio_summary;
  return ei(o?.[o.length - 1]?.status);
}
function pi(e, t) {
  const n = e.prototype, o = n.onNodeCreated;
  n.onNodeCreated = function() {
    o?.call(this);
    const r = this;
    r.badges?.push(() => {
      const s = Jt(r);
      return ai(s ? qt[s] : null);
    });
  }, n.onDrawForeground = Z(n.onDrawForeground, function(r) {
    const s = Jt(this);
    !s || !qt[s].frame || this.flags?.collapsed || !this.size || fi(r, qt[s], this.size, li, t.scale());
  }), n.onExecuted = Z(n.onExecuted, function(r) {
    const s = di(r);
    s && (Ce(this, s), s === "waiting" && t.toast(
      `Stopped at ${this.title || "the Song Sheet"}`,
      "Waiting for your approval: open it with its Edit button, check the documents, press Approve, then run again."
    ));
  });
}
function fi(e, t, n, o, r) {
  const s = Math.max(3, 3 / Math.max(r, 0.05));
  e.save(), e.strokeStyle = t.color, e.lineWidth = s, e.beginPath();
  const i = s / 2 + 3;
  typeof e.roundRect == "function" ? e.roundRect(-i, -o - i, n[0] + 2 * i, n[1] + o + 2 * i, 10) : e.rect(-i, -o - i, n[0] + 2 * i, n[1] + o + 2 * i), e.stroke(), e.restore();
}
function dc(e, t) {
  const n = [];
  let o = 0;
  return e.bars.forEach((r, s) => {
    const i = t?.[s] ?? null, a = i && i[1] > i[0] ? [i[0], i[1]] : null, c = a ? a[1] - a[0] : r.duration_s;
    n.push({ scoreStart: r.start_s, scoreDur: r.duration_s, realStart: o, realDur: c, source: a }), o += c;
  }), n;
}
function To(e, t, n) {
  let o = null;
  for (const r of e)
    if (r[n] <= t + K) o = r;
    else break;
  return o ?? e[0] ?? null;
}
function _e(e, t) {
  const n = To(e, t, "scoreStart");
  if (!n) return t;
  const o = n.scoreDur > 0 ? (t - n.scoreStart) / n.scoreDur : 0;
  return n.realStart + o * n.realDur;
}
function hi(e, t) {
  const n = To(e, t, "realStart");
  if (!n) return t;
  const o = n.realDur > 0 ? (t - n.realStart) / n.realDur : 0;
  return n.scoreStart + o * n.scoreDur;
}
function pc(e, t, n) {
  const o = _e(e, t), r = n == null ? 1 / 0 : _e(e, n), s = [];
  for (const i of e) {
    if (!i.source) continue;
    const a = i.realStart + i.realDur, c = Math.max(i.realStart, o), d = Math.min(a, r);
    if (d <= c + K) continue;
    let f = i.source[0] + (c - i.realStart) / i.realDur * (i.source[1] - i.source[0]), h = c - o, S = d - c;
    if (f < 0 && (h -= f, S += f, f = 0, S <= K))
      continue;
    const b = s.at(-1);
    b && Math.abs(b.at + b.duration - h) < K && Math.abs(b.offset + b.duration - f) < 0.01 ? b.duration += S : s.push({ at: h, offset: f, duration: S });
  }
  return s;
}
const Po = 0.04, K = 1e-3, mi = 0.25, gi = 2;
function mt(e) {
  return Math.min(gi, Math.max(mi, Number.isFinite(e) ? e : 1));
}
function fc(e, t) {
  const n = mt(t.speed), o = t.to ?? e.duration_s, r = [], s = t.clock?.length ? t.clock : null, i = s ? _e(s, t.from) : t.from, a = (c) => (s ? _e(s, c) : c) - i;
  for (const c of ["Vocal", "Ins"])
    if (t.voices[c])
      for (const d of e.notes?.[c] ?? []) {
        if (d.start_s < t.from - K || d.start_s >= o - K) continue;
        const f = Math.min(d.start_s + d.duration_s, o), h = Math.max(0, a(d.start_s));
        r.push({ at: h / n, duration: (a(f) - h) / n, midi: d.midi, part: c });
      }
  if (t.voices.chords)
    for (const c of e.chords ?? []) {
      const d = Math.min(c.start_s + c.duration_s, o), f = Math.max(c.start_s, t.from);
      if (!(d <= f + K))
        for (const h of c.pitches)
          r.push({ at: a(f) / n, duration: (a(d) - a(f)) / n, midi: h, part: "chord" });
    }
  if (t.voices.guide)
    for (const c of t.guide ?? []) {
      if (c.start_s < t.from - K || c.start_s >= o - K) continue;
      const d = Math.min(c.start_s + c.duration_s, o), f = Math.max(0, a(c.start_s));
      r.push({ at: f / n, duration: (a(d) - f) / n, midi: c.midi, part: "guide" });
    }
  if (t.metronome)
    for (const c of e.bars) {
      const d = Number(c.meter.split("/")[0]) || 1;
      for (let f = 0; f < d; f++) {
        const h = c.start_s + f * c.duration_s / d;
        h < t.from - K || h >= o - K || r.push({
          at: Math.max(0, a(h)) / n,
          duration: Po,
          midi: f === 0 ? 96 : 89,
          part: "click"
        });
      }
    }
  return r.sort((c, d) => c.at - d.at || c.midi - d.midi);
}
function hc(e, t) {
  const n = Math.max(t.from, t.to ?? e.duration_s), o = t.clock?.length ? t.clock : null, r = o ? _e(o, n) - _e(o, t.from) : n - t.from;
  return Math.max(0, r) / mt(t.speed);
}
function mc(e, t, n, o, r, s) {
  const i = e && t > 0 ? e.duration_s / t : 0, a = e && i > 0 ? Math.max(0, n - e.start_s) : 0, c = i > 0 ? Math.floor(a / i + 1e-6) : 0, d = i > 0 ? (a - c * i) / i * s : 0, f = d > 1e-3 ? 0 : 1, h = Math.max(0, o * t);
  return Array.from({ length: h }, (S, b) => {
    const _ = f + h - 1 - b, N = ((c - _) % t + t) % t === 0;
    return { at: Math.max(0, r - d - _ * s), duration: Po, midi: N ? 96 : 89, part: "click" };
  });
}
function gc(e, t) {
  const n = e.clock?.length ? e.clock : null;
  return n ? hi(n, _e(n, e.from) + t * mt(e.speed)) : e.from + t * mt(e.speed);
}
function wc(e, t, n) {
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
], bc = {
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
function nt(e) {
  return typeof e == "string" && bi.includes(e);
}
function Oo() {
  return { Vocal: "soft", Ins: "plain", chord: "plain", guide: "plain" };
}
function yi(e) {
  const t = Oo(), n = typeof e == "object" && e !== null ? e : {};
  return {
    Vocal: nt(n.Vocal) ? n.Vocal : t.Vocal,
    Ins: nt(n.Ins) ? n.Ins : t.Ins,
    chord: nt(n.chord) ? n.chord : t.chord,
    guide: nt(n.guide) ? n.guide : t.guide
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
}, jn = /* @__PURE__ */ new WeakMap();
function zt(e, t, n) {
  let o = jn.get(e);
  o || jn.set(e, o = /* @__PURE__ */ new Map());
  let r = o.get(t);
  if (!r) {
    const s = new Float32Array(n.length + 1), i = new Float32Array(n.length + 1);
    n.forEach((a, c) => i[c + 1] = a), r = e.createPeriodicWave(s, i), o.set(t, r);
  }
  return r;
}
const Wn = /* @__PURE__ */ new WeakMap();
function Io(e) {
  let t = Wn.get(e);
  if (!t) {
    t = e.createBuffer(1, e.sampleRate, e.sampleRate);
    const n = t.getChannelData(0);
    let o = 1;
    for (let r = 0; r < n.length; r++)
      o = o * 16807 % 2147483647, n[r] = o / 2147483647 * 2 - 1;
    Wn.set(e, t);
  }
  return t;
}
function T(e, t, n, o = 0) {
  const r = e.createOscillator();
  return typeof t == "string" ? r.type = t : r.setPeriodicWave(t), r.frequency.value = n, r.detune.value = o, r;
}
function me(e, t) {
  const n = e.createGain();
  return n.gain.value = t, n;
}
function ie(e, t, n, o = 0.7) {
  const r = e.createBiquadFilter();
  return r.type = t, r.frequency.value = Math.min(n, e.sampleRate / 2 - 100), r.Q.value = o, r;
}
function Re(e, t, n, o, r, s) {
  const i = T(e, "sine", o), a = e.createGain();
  a.gain.setValueAtTime(0, n), a.gain.setValueAtTime(0, n + s), a.gain.linearRampToValueAtTime(r, n + s + 0.4), i.connect(a);
  for (const c of t) a.connect(c.detune);
  return i;
}
function Dt(e, t, n, o, r, s) {
  const i = e.createBufferSource();
  i.buffer = Io(e);
  const a = ie(e, "bandpass", o, 1.2), c = e.createGain();
  return c.gain.setValueAtTime(r, n), c.gain.setTargetAtTime(0, n, s), i.connect(a).connect(c).connect(t), i;
}
const ut = (e, t) => Math.min(t * 2.5, Math.max(t * 0.3, t * 2 ** ((60 - e) / 24))), Gn = {
  plain: {
    attack: 0.012,
    sustain: 0.85,
    decay: 0.4,
    release: 0.015,
    build: (e, t, n) => [Vn(T(e, "sine", n), t)]
  },
  soft: {
    attack: 0.012,
    sustain: 0.85,
    decay: 0.4,
    release: 0.015,
    build: (e, t, n) => [Vn(T(e, "triangle", n), t)]
  },
  piano: {
    attack: 3e-3,
    sustain: 0,
    decay: 1.4,
    release: 0.09,
    build(e, t, n, o, r, s) {
      const i = zt(e, "piano", [1, 0.62, 0.36, 0.27, 0.16, 0.12, 0.07, 0.06, 0.035, 0.02, 0.012, 8e-3]), a = ie(e, "lowpass", Math.min(n * (5 + 7 * r), 14e3), 0.5);
      a.frequency.setTargetAtTime(Math.max(n * 2.2, 400), o + 0.01, ut(s, 0.35)), a.connect(t);
      const c = T(e, i, n, -1.5), d = T(e, i, n, 1.5), f = me(e, 0.5);
      c.connect(f), d.connect(f), f.connect(a);
      const h = Dt(e, t, o, Math.min(n * 6, 7e3), 0.12 * r, 8e-3);
      return [c, d, h];
    }
  },
  epiano: {
    attack: 2e-3,
    sustain: 0,
    decay: 1.6,
    release: 0.12,
    build(e, t, n, o, r, s) {
      const i = T(e, "sine", n), a = T(e, "sine", n), c = e.createGain(), d = n * (1.2 + 2.2 * r);
      c.gain.setValueAtTime(d, o), c.gain.setTargetAtTime(n * 0.25, o, ut(s, 0.25)), a.connect(c).connect(i.frequency);
      const f = ie(e, "highpass", 25, 0.7);
      f.connect(t);
      const h = T(e, "sine", n * 4), S = e.createGain();
      return S.gain.setValueAtTime(0.18 * r, o), S.gain.setTargetAtTime(0, o, 0.06), h.connect(S).connect(f), i.connect(f), [i, a, h];
    }
  },
  strings: {
    attack: 0.22,
    sustain: 0.9,
    decay: 0.6,
    release: 0.2,
    build(e, t, n, o) {
      const r = ie(e, "lowpass", Math.min(n * 5 + 800, 6e3), 0.6);
      r.connect(t);
      const s = [-9, 0, 8].map((a) => T(e, "sawtooth", n, a));
      for (const a of s) a.connect(r);
      const i = Re(e, s, o, 5.3, 7, 0.3);
      return [...s, i];
    }
  },
  pad: {
    attack: 0.5,
    sustain: 0.95,
    decay: 1,
    release: 0.45,
    build(e, t, n, o) {
      const r = Math.min(n * 3 + 500, 4500), s = ie(e, "lowpass", r, 0.8);
      s.connect(t);
      const i = T(e, "sine", 0.25), a = me(e, r * 0.3);
      i.connect(a).connect(s.frequency);
      const c = [T(e, "sawtooth", n, -12), T(e, "sawtooth", n, 11), T(e, "triangle", n / 2)];
      for (const d of c) d.connect(s);
      return [...c, i];
    }
  },
  organ: {
    attack: 6e-3,
    sustain: 1,
    decay: 1,
    release: 0.025,
    build(e, t, n, o) {
      const r = zt(e, "organ", [1, 0.75, 0.55, 0.5, 0.18, 0.3, 0, 0.22, 0, 0.08, 0, 0.1]), s = T(e, r, n), i = T(e, "sine", n / 2), a = me(e, 0.35);
      i.connect(a).connect(t), s.connect(t);
      const c = Re(e, [s, i], o, 6.6, 4, 0), d = Dt(e, t, o, 3e3, 0.05, 4e-3);
      return [s, i, c, d];
    }
  },
  flute: {
    attack: 0.07,
    sustain: 0.85,
    decay: 0.5,
    release: 0.06,
    build(e, t, n, o) {
      const r = zt(e, "flute", [1, 0.13, 0.06, 0.02]), s = T(e, r, n);
      s.connect(t);
      const i = e.createBufferSource();
      i.buffer = Io(e), i.loop = !0;
      const a = ie(e, "bandpass", Math.min(n * 2, 8e3), 1.5), c = me(e, 0.06);
      i.connect(a).connect(c).connect(t);
      const d = Re(e, [s], o, 4.9, 9, 0.25);
      return [s, i, d];
    }
  },
  voice: {
    attack: 0.08,
    sustain: 0.9,
    decay: 0.5,
    release: 0.09,
    build(e, t, n, o) {
      const r = T(e, "sawtooth", n), s = ie(e, "lowpass", 5e3, 0.5);
      r.connect(s);
      for (const [c, d, f] of [
        [800, 6, 1],
        [1150, 8, 0.55],
        [2900, 12, 0.18]
      ]) {
        const h = ie(e, "bandpass", c, d), S = me(e, f);
        s.connect(h).connect(S).connect(t);
      }
      const i = me(e, 0.15);
      s.connect(i).connect(t);
      const a = Re(e, [r], o, 5.4, 18, 0.22);
      return [r, a];
    }
  },
  pluck: {
    attack: 2e-3,
    sustain: 0,
    decay: 0.7,
    release: 0.07,
    build(e, t, n, o, r, s) {
      const i = ie(e, "lowpass", Math.min(n * (6 + 6 * r), 9e3), 0.9);
      i.frequency.setTargetAtTime(Math.max(n * 1.5, 250), o + 5e-3, ut(s, 0.12)), i.connect(t);
      const a = T(e, "sawtooth", n), c = T(e, "triangle", n, 4);
      a.connect(i), c.connect(i);
      const d = Dt(e, t, o, Math.min(n * 8, 8e3), 0.1 * r, 5e-3);
      return [a, c, d];
    }
  },
  lead: {
    attack: 0.01,
    sustain: 0.8,
    decay: 0.3,
    release: 0.06,
    build(e, t, n, o) {
      const r = ie(e, "lowpass", Math.min(n * 8, 7e3), 2);
      r.frequency.setTargetAtTime(Math.min(n * 4, 4e3), o + 0.02, 0.2), r.connect(t);
      const s = T(e, "square", n), i = T(e, "sawtooth", n, 6);
      s.connect(r), i.connect(r);
      const a = Re(e, [s, i], o, 5.6, 10, 0.3);
      return [s, i, a];
    }
  },
  bass: {
    attack: 4e-3,
    sustain: 0.45,
    decay: 0.5,
    release: 0.06,
    build(e, t, n, o) {
      const r = T(e, "sine", n), s = T(e, "triangle", n), i = me(e, 0.5);
      r.connect(t), s.connect(i).connect(t);
      const a = T(e, "sawtooth", n), c = ie(e, "lowpass", Math.min(n * 6, 2500), 1);
      c.frequency.setTargetAtTime(n * 2, o + 0.01, 0.12);
      const d = me(e, 0.25);
      return a.connect(c).connect(d).connect(t), [r, s, a];
    }
  },
  mallets: {
    attack: 2e-3,
    sustain: 0,
    decay: 0.8,
    release: 0.1,
    build(e, t, n, o, r, s) {
      const i = T(e, "sine", n), a = T(e, "sine", n * 3.5), c = e.createGain();
      return c.gain.setValueAtTime(n * (1 + 1.5 * r), o), c.gain.setTargetAtTime(0, o, 0.05), a.connect(c).connect(i.frequency), i.connect(t), [i, a];
    }
  }
};
function Vn(e, t) {
  return e.connect(t), e;
}
function yc(e, t, n, o, r, { velocity: s = 0.8, level: i = 1 } = {}) {
  const a = Gn[n] ?? Gn.plain, c = wi(o), d = a.sustain === 0 ? ut(o, a.decay) : a.decay, f = i * vi[n] * (0.55 + 0.45 * Math.max(0, Math.min(1, s))), h = e.createGain();
  h.gain.setValueAtTime(0, r), h.gain.linearRampToValueAtTime(f, r + a.attack), h.gain.setTargetAtTime(f * a.sustain, r + a.attack, d), h.connect(t);
  const S = a.build(e, h, c, r, s, o);
  for (const P of S) P.start(r);
  let b = !1, _ = !1;
  const N = (P) => {
    for (const Y of S)
      try {
        Y.stop(P);
      } catch {
      }
  };
  return S[0].onended = () => {
    _ = !0, h.disconnect();
  }, a.sustain === 0 && N(r + a.attack + d * 7), {
    release(P) {
      if (b || _) return;
      b = !0;
      const Y = Math.max(P, r + a.attack);
      h.gain.setTargetAtTime(0, Y, a.release), N(Y + a.release * 7);
    },
    stop() {
      if (_) return;
      _ = !0, b = !0;
      const P = e.currentTime;
      try {
        h.gain.cancelScheduledValues(P), h.gain.setValueAtTime(0, P);
      } catch {
      }
      N(P), h.disconnect();
    }
  };
}
const vc = 12, ot = { width: 640, height: 420 }, xi = { width: 1280, height: 900 }, qo = 120, Ro = 720, zo = 0.25, Do = 0.85, Bo = 160, Ho = 460, Fo = "plenio.sheet.dialog";
function Fe(e, t, n) {
  return Number.isFinite(e) ? Math.min(Math.max(e, t), Math.max(t, n)) : t;
}
function ki(e, t) {
  const n = Fe(e.width, ot.width, Math.max(ot.width, t.width - 16)), o = Fe(e.height, ot.height, Math.max(ot.height, t.height - 16));
  return { width: Math.round(n), height: Math.round(o) };
}
function xc(e, t) {
  return Math.round(Fe(e + t, qo, Ro));
}
function kc(e, t, n) {
  return !Number.isFinite(n) || n <= 0 ? Un(e) : Un(e + t / n);
}
function Un(e) {
  return Math.round(Fe(e, zo, Do) * 1e3) / 1e3;
}
function Sc(e, t) {
  return Math.round(Fe(e + t, Bo, Ho));
}
function _c(e, t, n) {
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
      window.removeEventListener("pointermove", c), window.removeEventListener("pointerup", a), window.removeEventListener("pointercancel", a), window.removeEventListener("blur", a), n?.();
    }
  }, c = (d) => {
    if (d.buttons === 0) {
      a();
      return;
    }
    t({ dx: d.clientX - o, dy: d.clientY - r });
  };
  window.addEventListener("pointermove", c), window.addEventListener("pointerup", a), window.addEventListener("pointercancel", a), window.addEventListener("blur", a);
}
function Si() {
  return { ...xi, maximized: !1 };
}
function Ec(e = jo()) {
  const t = Si();
  try {
    const n = e?.getItem(Fo);
    if (!n) return t;
    const o = JSON.parse(n);
    return { ...ki(
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
function Mc(e, t = jo()) {
  try {
    t?.setItem(Fo, JSON.stringify(e));
  } catch {
  }
}
function jo() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function Wo(e) {
  return e === "large" || e === "standard" || e === "smaller" || e === "compact";
}
function Go() {
  return { countIn: 1, quantize: 16, mode: "replace", mute: !0, thru: !0, stepLength: 8 };
}
function _i(e) {
  const t = Go(), n = typeof e == "object" && e !== null ? e : {}, o = (r, s, i) => s.includes(r) ? r : i;
  return {
    countIn: o(n.countIn, [0, 1, 2], t.countIn),
    quantize: o(n.quantize, [0, 4, 8, 16, 32], t.quantize),
    mode: o(n.mode, ["replace", "merge"], t.mode),
    mute: typeof n.mute == "boolean" ? n.mute : t.mute,
    thru: typeof n.thru == "boolean" ? n.thru : t.thru,
    stepLength: o(n.stepLength, [1, 2, 4, 8, 16], t.stepLength)
  };
}
const Vo = "plenio.score-editor.prefs";
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
    sounds: Oo(),
    paper: "a4",
    notationSize: "standard",
    record: Go(),
    midiInput: "all"
  };
}
function Mi(e) {
  const t = e.layout;
  return t === "text" ? { layout: "text", advanced: e.advanced === !0 } : t === "daw" ? { layout: "daw", advanced: e.advanced === !0 } : t === "both" ? { layout: "review", advanced: !0 } : { layout: "review", advanced: e.advanced === !0 };
}
function $c(e = Uo()) {
  const t = Ei();
  try {
    const n = e?.getItem(Vo);
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
      rollHeight: typeof o.rollHeight == "number" && o.rollHeight >= qo && o.rollHeight <= Ro ? Math.round(o.rollHeight) : t.rollHeight,
      notationShare: typeof o.notationShare == "number" && o.notationShare >= zo && o.notationShare <= Do ? o.notationShare : t.notationShare,
      sideWidth: typeof o.sideWidth == "number" && o.sideWidth >= Bo && o.sideWidth <= Ho ? Math.round(o.sideWidth) : t.sideWidth,
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
      notationSize: Wo(o.notationSize) ? o.notationSize : t.notationSize,
      record: _i(o.record),
      midiInput: typeof o.midiInput == "string" && o.midiInput ? o.midiInput : "all"
    };
  } catch {
    return t;
  }
}
function Ac(e, t = Uo()) {
  try {
    t?.setItem(Vo, JSON.stringify(e));
  } catch {
  }
}
function Uo() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function Yo(e) {
  if (!Array.isArray(e)) return [];
  const t = (n) => typeof n == "string" ? n : "";
  return e.filter((n) => !!n && typeof n == "object").map((n) => ({
    token: t(n.token),
    file: t(n.file),
    title: t(n.title),
    paper: n.paper === "letter" ? "letter" : "a4",
    size: Wo(n.size) ? n.size : "standard",
    display_abc: t(n.display_abc)
  })).filter((n) => n.token && n.file && n.display_abc);
}
function $i(e) {
  return Yo(e?.plenio_notation);
}
async function Ai(e) {
  const t = await e.fetchApi("/plenio/export/sheet-music/pending", { cache: "no-store" });
  if (!t.ok) return [];
  const n = await t.json().catch(() => ({}));
  return Yo(n.jobs);
}
async function Li(e, t) {
  const n = await t.draw(e.display_abc, e.title, e.paper, e.size), o = new ArrayBuffer(n.length);
  new Uint8Array(o).set(n);
  const r = await t.fetcher.fetchApi(`/plenio/export/sheet-music?token=${encodeURIComponent(e.token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: new Blob([o], { type: "application/pdf" })
  }), s = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new U(s.error?.message ?? `Saving the sheet music failed (${r.status})`, s.error?.hint ?? null);
  return { file: s.file ?? e.file, bytes: s.bytes ?? n.length };
}
let Yn = Promise.resolve();
function Ci(e) {
  const t = Yn.then(e, e);
  return Yn = t.catch(() => {
  }), t;
}
class Ni {
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
        Ci(() => Li(r, this.host)).then(
          (s) => this.report({ job: r, saved: s }),
          (s) => {
            const i = s instanceof U && /can no longer be saved/.test(s.message);
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
      t = await Ai(this.host.fetcher);
    } catch {
      return;
    }
    await Promise.all(this.take(t, !0));
  }
}
const Xo = "PlenioSeed", Ti = 2 ** 32, Qo = "plenio_part", dt = "plenio_seed_hint", Xn = 56, Qn = {
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
function Ne(e, t) {
  return e.widgets?.find((n) => n.name === t);
}
function Jo(e) {
  const t = e.inputs?.find((n) => n.name === "seed");
  return t?.link !== void 0 && t?.link !== null;
}
function gt(e) {
  const t = !!Ne(e, "keep_seed")?.value, n = e, o = t ? Qn.keep : Qn.fresh;
  n.color = o.color, n.bgcolor = o.bgcolor;
  const r = Ne(e, dt)?.element;
  r && (r.textContent = Oi(t, String(e.properties?.[Qo] ?? ""))), e.setDirtyCanvas?.(!0, !0);
}
function Jn(e, t = Math.random) {
  const n = Ne(e, "seed");
  !n || Jo(e) || (n.value = Pi(t), n.callback?.(n.value), e.setDirtyCanvas?.(!0, !0));
}
function Ii(e, t = Math.random) {
  const n = Ne(e, "seed"), o = Ne(e, "keep_seed");
  if (!n || !o) return;
  n.beforeQueued = () => {
    o.value || Jn(e, t);
  }, o.callback = Z(o.callback, () => gt(e));
  const s = e.addWidget?.("button", "🎲 new seed now", null, () => Jn(e, t), { serialize: !1 });
  if (s && (s.serialize = !1), !Ne(e, dt)) {
    const i = document.createElement("div");
    i.className = "plenio-seed-hint";
    const a = e.addDOMWidget(dt, dt, i, {
      serialize: !1,
      getValue: () => "",
      setValue: () => {
      },
      // two lines of text and the frontend's margin of 10 px above and below a DOM widget
      getMinHeight: () => Xn,
      getMaxHeight: () => Xn
    });
    a.serialize = !1;
  }
  gt(e);
}
function qi(e) {
  const t = e.prototype, n = t.onNodeCreated;
  t.onNodeCreated = function() {
    n?.call(this), Ii(this);
  }, e.prototype.onConfigure = Z(e.prototype.onConfigure, function() {
    gt(this);
  });
}
const Ko = /* @__PURE__ */ new Set(["new song every run", "new cover every run"]), Ri = /* @__PURE__ */ new Set(["one song, stop to review", "one cover, stop to review"]);
function zi(e, t) {
  return Ko.has(e) ? !1 : Ri.has(e) ? t.trim() !== "take" : null;
}
function Di(e, t) {
  let n = 0;
  for (const o of e) {
    if (o.type !== Xo || Jo(o)) continue;
    const r = zi(t, String(o.properties?.[Qo] ?? "")), s = o.widgets?.find((i) => i.name === "keep_seed");
    r === null || !s || !!s.value === r || (s.value = r, gt(o), n++);
  }
  return n;
}
function Bi(e, t) {
  const n = `${t} seed${t === 1 ? "" : "s"}`;
  return Ko.has(e) ? { summary: `${n} now 🎲 new seed`, detail: `"${e}": every run draws all its seeds anew - a new song each time. Switch a seed to 🔒 to keep that part.` } : { summary: `${n} now 🔒 same seed`, detail: `"${e}": the song's draft, plan, arrangement and cover stay while you review it; the take seed still draws anew.` };
}
function Hi(e, t) {
  const n = e.widgets?.find((o) => o.name === "mode");
  n && (n.callback = Z(n.callback, (o) => {
    const r = e.graph, s = String(o ?? n.value ?? ""), i = Di(r?.nodes ?? r?._nodes ?? [], s);
    if (i) {
      const a = Bi(s, i);
      t(a.summary, a.detail);
    }
  }));
}
const Fi = "PlenioSongSheet";
function Ve(e) {
  return e.widgets?.find((t) => t.name === "sheet_state") ?? null;
}
function Zo(e, t) {
  const n = e.inputs?.[t]?.link;
  if (n == null) return null;
  try {
    const o = e.graph, r = o?.links, s = o?.getLink?.(n) ?? (r instanceof Map ? r.get(n) : r?.[String(n)]);
    return s && o?.getNodeById ? o.getNodeById(s.origin_id) ?? null : e.getInputNode?.(t) ?? null;
  } catch {
    return null;
  }
}
function er(e, t) {
  const n = (e.inputs ?? []).findIndex((o) => o.name === t && o.link != null);
  return n < 0 ? null : Zo(e, n);
}
function tr(e, t) {
  const n = er(e, t);
  return n && (n.comfyClass ?? n.type) === Fi && Ve(n) ? n : null;
}
function ji(e) {
  return tr(e, "context_lyrics");
}
function Wi(e) {
  return tr(e, "context_score");
}
function Gi(e, t, n) {
  const o = [], r = er(t, n);
  r && o.push(r);
  const s = /* @__PURE__ */ new Set();
  for (; o.length && s.size < 1e3; ) {
    const i = o.shift(), a = String(i.id);
    if (!s.has(a)) {
      if (s.add(a), i === e || a === String(e.id)) return !0;
      (i.inputs ?? []).forEach((c, d) => {
        const f = Zo(i, d);
        f && o.push(f);
      });
    }
  }
  return !1;
}
function Vi(e, t, n) {
  const o = ji(e), r = t?.context?.lyrics;
  if (!o || !r) return null;
  const s = o.title || "Song Sheet", i = Se(Ve(o)?.value), a = i?.docs.lyrics?.text ?? n(String(o.id))?.docs.lyrics?.upstream ?? null;
  let c = null;
  return i === null ? c = `The state of ${s} is unreadable - open that sheet and apply it first.` : a !== null && ke(a) !== ke(r) && (c = `The lyrics in ${s} changed after the last run. Run the workflow again; then they can follow the sections.`), { owner: o, target: { title: s, blocked: c, replans: Gi(o, e, "score") } };
}
function Ui(e, t, n) {
  const o = Ve(e);
  if (!o) return;
  const r = Se(o.value) ?? bt();
  o.value = Be(yo(r, n, [{ kind: "lyrics", text: t, intent: "keep" }])), e.setDirtyCanvas?.(!0, !0);
}
function Yi(e, t, n) {
  const o = Wi(e), r = t?.context?.score;
  if (!o || !r) return null;
  const s = o.title || "Song Sheet", i = Se(Ve(o)?.value), a = i?.docs.score?.text ?? n(String(o.id))?.docs.score?.upstream ?? null;
  let c = null;
  return i === null ? c = `The state of ${s} is unreadable - open that sheet and apply it first.` : a !== null && ke(a) !== ke(r) && (c = `The score in ${s} changed after the last run. Run the workflow again; then it can be edited here.`), { owner: o, target: { title: s, blocked: c } };
}
function Xi(e, t) {
  const n = String(e.widgets?.find((o) => o.name === "review")?.value ?? "continue");
  return n === "as the brief says" ? t?.review ?? "continue" : n;
}
async function Qi(e, t, n, o = null) {
  const r = Ve(e);
  if (!r) return null;
  const s = Se(r.value) ?? bt(), i = yo(s, n, [{ kind: "score", text: t, intent: "keep" }]);
  if (r.value = Be(i), e.setDirtyCanvas?.(!0, !0), !o || !n) return i;
  try {
    const a = await kr(o.fetcher, {
      sheet_state: i,
      upstream: Zr(n),
      owned: n.owned,
      review: Xi(e, n),
      engine: n.engine,
      instrumental: n.instrumental,
      context: n.context,
      target_seconds: n.target_seconds ?? null
    });
    if (!!a.findings.some((f) => f.severity === "error") || !a.fingerprint) return i;
    const d = Kr(i, a.fingerprint);
    return r.value = Be(d), e.setDirtyCanvas?.(!0, !0), d;
  } catch {
    return i;
  }
}
const Ji = {
  text: {
    name: "Edit lyrics & text",
    what: "Title · style · lyrics · cover prompt",
    // a written page and a pen
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.5h8.2L18.5 7v4.6l-2 2V8h-4V4.5H6v15h5.4l-.5 2H6a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2z"/><path d="M7.6 10h7v1.7h-7zM7.6 13.4h5.6v1.7H7.6zM7.6 16.8h3.2v1.7H7.6z"/><path d="M20.3 12.6l1.6 1.6-6.7 6.7-2.6.9.9-2.6z"/></svg>'
  },
  score: {
    name: "Edit the score",
    what: "Melody · chords · sections · listen and compare",
    // notes on a staff
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6h20M2 9.5h20M2 13h20M2 16.5h20" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/><path d="M8.6 5.2l11-2.6v12.6a2.9 2.3 0 1 1-1.8-2.1V6.2l-7.4 1.8v9.4a2.9 2.3 0 1 1-1.8-2.1z"/></svg>'
  },
  daw: {
    name: "Compose the score",
    what: "Piano roll · chords · sections · MIDI",
    // the piano roll: keys and notes
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3.5h5v17H2z" opacity=".5"/><path d="M2 7.6h3.2v1.4H2zM2 12h3.2v1.4H2zM2 16.4h3.2v1.4H2z"/><rect x="9" y="4.5" width="6.5" height="2.8" rx="1.1"/><rect x="12.5" y="9" width="9" height="2.8" rx="1.1"/><rect x="9" y="13.5" width="4.5" height="2.8" rx="1.1"/><rect x="15" y="18" width="6.5" height="2.8" rx="1.1"/></svg>'
  }
};
function Ki(e) {
  return e.properties?.plenio_editor_layout === "daw" ? "daw" : (e.inputs ?? []).some((n) => n.name === "score" && n.link != null) ? "score" : "text";
}
const nr = "PLENIO_SHEET_STATE", Kn = 128;
let pt = null;
function Zi(e) {
  pt = e;
}
const ea = (e, t, n) => {
  let o = typeof n?.[1]?.default == "string" ? n[1].default : "";
  const r = document.createElement("div");
  r.className = "plenio-sheet-state";
  const s = document.createElement("div");
  s.className = "plenio-sheet-summary";
  const i = document.createElement("button");
  i.type = "button", i.className = "plenio-sheet-open", i.innerHTML = '<span class="icon"></span><span class="text"><span class="name"></span><span class="what"></span></span><span class="go">Edit</span>';
  const a = document.createElement("div");
  a.className = "plenio-sheet-status", r.append(i, s, a);
  let c = !1, d = null;
  const f = () => {
    const l = Ki(e);
    if (l === d) return;
    d = l;
    const L = Ji[l];
    i.dataset.kind = l, i.title = `${L.name} - opens the Song Sheet editor (${L.what.toLowerCase()})`, i.querySelector(".icon").innerHTML = L.icon, i.querySelector(".name").textContent = L.name, i.querySelector(".what").textContent = L.what;
  }, h = () => {
    f();
    const l = Me(String(e.id)), L = Jt(e);
    s.textContent = Qr(Se(o)) + (l && L !== "approved" ? ` · ${l.status}` : ""), a.textContent = ni(L), a.dataset.state = L ?? "";
    const $ = c ? null : e.widgets?.find((y) => y.name === "review");
    if ($) {
      c = !0;
      const y = $.callback;
      $.callback = (g) => {
        y?.(g), h();
      };
    }
  }, S = e.addDOMWidget(t, nr, r, {
    getValue: () => o,
    setValue: (l) => {
      o = typeof l == "string" ? l : "", h();
    },
    // two rows, always: the frontend lays a DOM widget out once, so a height that changes later is cut;
    // it also keeps a 10 px margin above and below the element (68 - 20 = the rows' 48 px)
    getMinHeight: () => Kn,
    getMaxHeight: () => Kn
  });
  i.addEventListener("click", (l) => {
    l.stopPropagation(), b().catch((L) => {
      console.error("Plenio: the Song Sheet editor could not open", L), s.textContent = `The editor could not open: ${L instanceof Error ? L.message : String(L)}`;
    });
  });
  async function b() {
    const l = Se(o);
    l === null && (s.textContent = "The stored state is unreadable; it will be replaced when you apply.");
    const L = Me(String(e.id)), y = (e.inputs ?? []).filter((M) => M.link != null).map((M) => M.name), g = l ?? { schema: "plenio.sheet_state/1", docs: {} }, w = L?.owned ?? vo(y, g), v = String(e.widgets?.find((M) => M.name === "review")?.value ?? "continue"), C = v === "as the brief says" ? L?.review ?? "continue" : v, E = () => ln(import.meta.url, un), { openSheetDialog: X } = await ze(() => import("./open-BELZkPFq.mjs"), E), { parseGuide: z, serializeGuide: j } = await ze(() => import("./tracks-ClAVjvds.mjs"), E), { parseShift: B, parseSpans: H } = await ze(() => import("./lyricPlacement-DGoRXeqW.mjs"), E);
    if (!pt) throw new Error("Plenio: API not initialised");
    let O = null;
    try {
      O = Vi(e, L, Me);
    } catch (M) {
      console.warn("Plenio: the lyrics sheet of this score was not found", M);
    }
    let te = null;
    try {
      te = Yi(e, L, Me);
    } catch (M) {
      console.warn("Plenio: the score sheet of these lyrics was not found", M);
    }
    const re = pt;
    X({
      title: e.title || "Song Sheet",
      state: g,
      payload: L,
      asrNote: Fs(L?.docs.lyrics?.upstream_sha256),
      owned: w.length ? w : [...Ge],
      review: C,
      fetcher: pt,
      // a template's choice of the score editor's layout (review, text; daw with the DAW template)
      layout: typeof e.properties?.plenio_editor_layout == "string" ? e.properties.plenio_editor_layout : null,
      // the Guide track (playback and MIDI only), kept in the node's properties with the workflow
      guide: z(e.properties?.plenio_guide),
      // the lyrics lines placed by hand in the lyrics lane, kept like the Guide notes
      lyricSpans: H(e.properties?.plenio_lyric_spans),
      // how far a cover's source recording is moved against the bars (the beat grid corrected by hand)
      sourceShift: B(e.properties?.plenio_source_shift),
      lyricsTarget: O?.target ?? null,
      scoreTarget: te?.target ?? null,
      onApply: (M, I, ce, Ee, Ue, W) => {
        const yt = String(S.value ?? "");
        if (S.value = Be(M), e.properties = {
          ...e.properties ?? {},
          plenio_guide: j(I),
          plenio_lyric_spans: (W?.lyricSpans ?? []).map((fe) => [...fe]),
          plenio_source_shift: W?.sourceShift ?? 0
        }, Ue ? Ce(e, "approved") : String(S.value) !== yt && _(e), ce !== null && O && !O.target.blocked && (Ui(O.owner, ce, Me(String(O.owner.id))), _(O.owner)), Ee && te && !te.target.blocked) {
          const fe = te.owner;
          Qi(fe, Ee.text, Me(String(fe.id)), Ee.approved ? { fetcher: re } : null).then(
            (vt) => {
              vt?.review?.approved_fingerprint ? Ce(fe, "approved") : _(fe);
            }
          );
        }
        e.setDirtyCanvas?.(!0, !0);
      }
    });
  }
  function _(l) {
    Co(l) === "approved" && Ce(l, null);
  }
  const N = [
    Bs((l) => {
      l === String(e.id) && h();
    }),
    si((l) => {
      (l === null || l === e) && h();
    })
  ], P = e.onDrawForeground;
  e.onDrawForeground = function(l) {
    P?.call(this, l), f();
  };
  const Y = e.onRemoved;
  return e.onRemoved = function() {
    for (const l of N) l();
    Y?.call(this);
  }, h(), { widget: S };
}, or = "PLENIO_FINISH_SWITCH", ta = "plenio_switch", Zn = 148, Kt = 0, na = 4, Bt = [
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
function oa(e) {
  return e?.nodes ?? e?._nodes ?? [];
}
function rr(e) {
  return oa(e).filter((t) => t.properties?.[ta] === "cover");
}
function rt(e) {
  const t = rr(e);
  return t.length ? t.some((n) => (n.mode ?? Kt) === Kt) : null;
}
function ra(e, t) {
  for (const n of rr(e)) n.mode = t ? Kt : na;
  e?.setDirtyCanvas?.(!0, !0);
}
function eo(e) {
  return e === !0 || typeof e == "string" && ["true", "1", "on"].includes(e.trim().toLowerCase());
}
const Zt = /* @__PURE__ */ new Set();
function sa() {
  for (const e of Zt) e();
}
const ia = (e, t, n) => {
  let o = eo(n?.[1]?.default);
  const r = e, s = document.createElement("div");
  s.className = "plenio-switches";
  const i = /* @__PURE__ */ new Map();
  for (const b of Bt) {
    const _ = document.createElement("button");
    _.type = "button", _.className = "plenio-switch", _.dataset.switch = b.id, _.innerHTML = `<span class="icon">${b.icon}</span><span class="text"><span class="name"></span><span class="what"></span></span><span class="pill"></span>`, _.addEventListener("click", (N) => {
      N.stopPropagation(), b.id === "hq" ? (o = !o, d.value = o, d.callback?.(o)) : ra(r.graph, !rt(r.graph)), c();
    }), i.set(b.id, _), s.append(_);
  }
  function a(b, _) {
    const N = i.get(b.id);
    N && (N.hidden = _ === null, N.classList.toggle("on", !!_), N.setAttribute("aria-pressed", String(!!_)), N.title = `${b.name}: ${_ ? "on" : "off"} - click to switch it ${_ ? "off" : "on"}`, N.querySelector(".name").textContent = b.name, N.querySelector(".what").textContent = _ ? b.on : b.off, N.querySelector(".pill").textContent = _ ? "ON" : "OFF");
  }
  function c() {
    a(Bt[0], o), a(Bt[1], rt(r.graph));
  }
  const d = e.addDOMWidget(t, or, s, {
    getValue: () => o,
    setValue: (b) => {
      o = eo(b), c();
    },
    getMinHeight: () => Zn,
    getMaxHeight: () => Zn
  });
  Zt.add(c);
  let f = rt(r.graph);
  const h = e.onDrawForeground;
  e.onDrawForeground = function(b) {
    h?.call(this, b);
    const _ = rt(r.graph);
    _ !== f && (f = _, c());
  };
  const S = e.onRemoved;
  return e.onRemoved = function() {
    Zt.delete(c), S?.call(this);
  }, c(), { widget: d };
}, je = "plenio.stem_mix/1", Te = "rest", aa = ["reverb", "delay"], sr = -60, ca = 12;
function la() {
  return { gain_db: 0, mute: !1, solo: !1, compression: 0, muted: [], reverb: 0, delay: 0, save: !1 };
}
function ae(e, t) {
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
function ir(e) {
  const t = la();
  return e.gain_db === t.gain_db && e.mute === t.mute && e.solo === t.solo && e.compression === t.compression && e.muted.length === 0 && e.reverb === t.reverb && e.delay === t.delay && e.save === t.save;
}
const ua = ["vocals", "drums", "bass", "other"];
function da() {
  return [...ua, Te];
}
function pa(e) {
  if (typeof e != "string" || !e.trim()) return { schema: je, strips: {} };
  try {
    const t = JSON.parse(e);
    return t?.schema !== je || typeof t.strips != "object" || t.strips === null ? null : t;
  } catch {
    return null;
  }
}
function fa(e) {
  const t = {};
  for (const o of Object.keys(e.strips)) {
    if (!o || ir(ae(e, o))) continue;
    const r = {}, s = ae(e, o);
    s.gain_db && (r.gain_db = s.gain_db), s.mute && (r.mute = !0), s.solo && (r.solo = !0), s.compression && (r.compression = s.compression), s.muted.length && (r.muted = s.muted), s.reverb && (r.reverb = s.reverb), s.delay && (r.delay = s.delay), s.save && (r.save = !0), t[o] = r;
  }
  const n = { schema: je, strips: t };
  return e.reverb && Object.keys(e.reverb).length && (n.reverb = e.reverb), e.delay && Object.keys(e.delay).length && (n.delay = e.delay), JSON.stringify(n);
}
function wt(e, t, n) {
  const o = { ...e.strips };
  return ir(n) ? delete o[t] : o[t] = n, { ...e, strips: o };
}
function ha(e, t, n) {
  const o = n.some((s) => ae(e, s).solo), r = ae(e, t);
  return o ? r.solo : !r.mute;
}
function to(e) {
  return e <= sr ? "-∞" : `${e > 0 ? "+" : ""}${e.toFixed(1)}`;
}
function ma(e, t = null) {
  const n = e.filter((r) => Array.isArray(r) && r.length === 2 && Number.isFinite(r[0]) && Number.isFinite(r[1])).map((r) => [Math.max(0, Math.min(r[0], r[1])), Math.max(r[0], r[1])]).filter((r) => r[1] - r[0] > 1e-6).sort((r, s) => r[0] - s[0]), o = [];
  for (const r of n) {
    const s = o[o.length - 1];
    s && r[0] <= s[1] + 1e-6 ? s[1] = Math.max(s[1], r[1]) : o.push([...r]);
  }
  return t !== null && t > 0 ? o.map(([r, s]) => [Math.min(r, t), Math.min(s, t)]).filter(([r, s]) => s - r > 1e-6) : o;
}
function ga(e, t, n) {
  return ma([...e, [t, n]]);
}
function wa(e, t) {
  return e.findIndex(([n, o]) => n <= t && t <= o);
}
function ba(e, t) {
  return t < 0 ? e : e.filter((n, o) => o !== t);
}
function ya(e, t, n, o) {
  const r = ae(e, t);
  return wt(e, t, { ...r, muted: ga(r.muted, n, o) });
}
function va(e, t, n) {
  const o = ae(e, t), r = wa(o.muted, n);
  return r < 0 ? e : wt(e, t, { ...o, muted: ba(o.muted, r) });
}
function xa(e) {
  const t = e?.plenio_stems, n = t?.[t.length - 1];
  if (!n?.peaks) return {};
  const o = {};
  for (const [r, s] of Object.entries(n.peaks))
    Array.isArray(s) && s.length && (o[r] = s.map((i) => Math.abs(Number(i) || 0)));
  return o;
}
function ka(e, t, n = 200) {
  const o = e[t];
  return o?.length ? o.length === n ? o : Array.from({ length: n }, (r, s) => o[Math.floor(s * o.length / n)] ?? 0) : new Array(n).fill(0);
}
function no(e, t) {
  const o = (Array.isArray(t?.stems) && t.stems.length ? t.stems : da()).filter((s) => s !== Te), r = Object.keys(e?.strips ?? {}).filter((s) => s !== Te && !o.includes(s));
  return [...o, ...r, Te];
}
const oo = "plenio_stem_mixer", ro = "mix", ge = 200, Sa = ["room", "plate", "hall"];
function R(e, t, n) {
  const o = document.createElement(e);
  return t && (o.className = t), n !== void 0 && (o.textContent = n), o;
}
function st(e, t, n, o, r) {
  const s = R("input");
  return s.type = "range", s.min = String(e), s.max = String(t), s.step = String(n), s.value = String(o), s.setAttribute("aria-label", r), s;
}
function _a(e) {
  const t = R("div", "plenio-mix"), n = R("div", "plenio-mix-strips"), o = R("div", "plenio-mix-buses"), r = R("div", "plenio-mix-info"), s = R("div", "plenio-mix-advanced");
  t.append(n, o, s, r);
  let i = {
    mix: { schema: je, strips: {} },
    // the documented stems are there before the first run (owner's request, 2026-09-28); a separation
    // replaces them with what the model actually produced
    names: no(null, null),
    peaks: {},
    seconds: 0
  }, a = !1;
  const c = () => e.widgets?.find((y) => y.name === ro);
  function d(y, { draw: g = !0 } = {}) {
    const w = c();
    if (!w) return;
    const v = fa(y);
    w.value = v, w.callback?.(v), i = { ...i, mix: y }, g && b();
  }
  function f(y, g, w = {}) {
    d(wt(i.mix, y, { ...ae(i.mix, y), ...g }), w);
  }
  function h(y, g, w, v = {}) {
    const C = ae(i.mix, y);
    let E = wt(i.mix, y, { ...C, [g]: w });
    w > 0 && !(E[g] && Object.keys(E[g]).length) && (E = g === "reverb" ? { ...E, reverb: { preset: "room" } } : { ...E, delay: { time_ms: 375, feedback: 0.35, lowpass_hz: 4e3 } }), d(E, v);
  }
  function S(y, g, w) {
    const v = { ...i.mix[y] ?? {} };
    d({ ...i.mix, [y]: { ...v, [g]: w } });
  }
  function b() {
    n.replaceChildren();
    const y = i.names;
    for (const g of i.names) {
      const w = ae(i.mix, g), v = R("div", "plenio-mix-strip");
      v.dataset.strip = g;
      const C = R("span", "name", g === Te ? `${g} (missed)` : g);
      C.title = g === Te ? "What the separator missed: keeps a neutral mix exact" : "";
      const E = st(sr, ca, 0.5, w.gain_db, `${g} gain`), X = R("span", "gain", `${to(w.gain_db)} dB`);
      E.addEventListener("input", () => {
        X.textContent = `${to(Number(E.value))} dB`, f(g, { gain_db: Number(E.value) }, { draw: !1 });
      }), E.addEventListener("change", () => f(g, { gain_db: Number(E.value) }));
      const z = R("button", w.mute ? "toggle active" : "toggle", "M");
      z.setAttribute("aria-label", `${g} mute`), z.addEventListener("click", (M) => {
        M.stopPropagation(), f(g, { mute: !w.mute });
      });
      const j = R("button", w.solo ? "toggle active" : "toggle", "S");
      j.setAttribute("aria-label", `${g} solo`), j.addEventListener("click", (M) => {
        M.stopPropagation(), f(g, { solo: !w.solo });
      });
      const B = st(0, 1, 0.05, w.compression, `${g} compression`);
      B.title = "Compression amount: one knob for the master compressor (threshold and ratio)", B.addEventListener("input", () => f(g, { compression: Number(B.value) }, { draw: !1 })), B.addEventListener("change", () => f(g, { compression: Number(B.value) }));
      const H = aa.map((M) => {
        const I = st(0, 1, 0.05, w[M], `${g} ${M} send`);
        return I.title = `${M} send: how much of this stem goes to the shared ${M} bus`, I.addEventListener("input", () => h(g, M, Number(I.value), { draw: !1 })), I.addEventListener("change", () => h(g, M, Number(I.value))), I;
      }), O = R("button", w.save ? "toggle active" : "toggle", "save");
      O.setAttribute("aria-label", `${g} save as its own file`), O.setAttribute("aria-pressed", String(w.save)), O.title = 'Save this stem as its own 24-bit FLAC file on the next run - next to the song, in the folder "<name>-stems" (without an Export Release: output/plenio/stems); its gain, compression and muted ranges are applied, mute/solo and the buses are not', O.addEventListener("click", (M) => {
        M.stopPropagation(), f(g, { save: !w.save });
      });
      const te = ha(i.mix, g, y);
      v.classList.toggle("silent", !te);
      const re = R("canvas", "plenio-mix-wave");
      re.width = ge, re.height = 26, re.setAttribute("aria-label", `${g} waveform (drag to mute a time range)`), _(re, w, ka(i.peaks, g, ge)), re.addEventListener("pointerdown", (M) => N(M, re, g)), v.append(
        C,
        E,
        X,
        z,
        j,
        R("span", "label", "comp"),
        B,
        R("span", "label", "verb"),
        H[0],
        R("span", "label", "delay"),
        H[1],
        O,
        re
      ), n.append(v);
    }
    P(), r.textContent = i.seconds ? `last run: ${i.seconds.toFixed(1)} s - drag on a strip to mute a time range, click a range to remove it` : "no run yet: the strips show the documented stems (vocals, drums, bass, other and the residual rest); Separate Stems fills them", e.setDirtyCanvas?.(!0, !0);
  }
  function _(y, g, w) {
    const v = y.getContext("2d");
    if (!v) return;
    v.clearRect(0, 0, ge, y.height);
    const C = y.height / 2;
    v.strokeStyle = "rgba(180, 190, 205, 0.8)", v.beginPath();
    for (let E = 0; E < w.length; E++) {
      const X = Math.max(1, w[E] * (C - 1));
      v.moveTo(E + 0.5, C - X), v.lineTo(E + 0.5, C + X);
    }
    v.stroke(), v.fillStyle = "rgba(224, 104, 94, 0.35)", v.strokeStyle = "rgba(224, 104, 94, 0.9)";
    for (const [E, X] of g.muted) {
      const z = Math.max(0, Math.min(ge, E / Math.max(i.seconds, 1e-6) * ge)), j = Math.max(0, Math.min(ge, X / Math.max(i.seconds, 1e-6) * ge));
      v.fillRect(z, 0, Math.max(1, j - z), y.height), v.strokeRect(z + 0.5, 0.5, Math.max(1, j - z) - 1, y.height - 1);
    }
  }
  function N(y, g, w) {
    if (y.preventDefault(), y.stopPropagation(), !i.seconds) return;
    const v = g.getBoundingClientRect(), C = (H) => Math.max(0, Math.min(1, (H - v.left) / (v.width || ge))) * i.seconds, E = C(y.clientX);
    if (ae(i.mix, w).muted.some(([H, O]) => H <= E && E <= O)) {
      d(va(i.mix, w, E));
      return;
    }
    let z = E;
    const j = (H) => {
      z = C(H.clientX);
    }, B = () => {
      window.removeEventListener("pointermove", j), window.removeEventListener("pointerup", B), d(ya(i.mix, w, Math.min(E, z), Math.max(E, z)));
    };
    window.addEventListener("pointermove", j), window.addEventListener("pointerup", B);
  }
  function P() {
    o.replaceChildren();
    const y = { preset: "room", ...i.mix.reverb ?? {} }, g = { time_ms: 375, feedback: 0.35, ...i.mix.delay ?? {} }, w = R("select");
    w.setAttribute("aria-label", "Reverb preset"), w.title = "The room the reverb bus adds; the amount per stem is its verb send";
    for (const E of Sa) w.append(new Option(E, E));
    w.value = String(y.preset ?? "room"), w.addEventListener("change", () => S("reverb", "preset", w.value));
    const v = R("input");
    v.type = "number", v.value = String(g.time_ms ?? 375), v.setAttribute("aria-label", "Delay time in ms"), v.title = "Delay time in ms: where the first echo of the delay bus sits", v.addEventListener("change", () => S("delay", "time_ms", Number(v.value)));
    const C = st(0, 0.8, 0.05, Number(g.feedback ?? 0.35), "Delay feedback");
    C.title = "Delay feedback: how much of each echo returns into the delay line", C.addEventListener("input", () => S("delay", "feedback", Number(C.value))), o.append(
      R("span", "label", "reverb bus"),
      w,
      R("span", "label", "delay bus"),
      v,
      R("span", "label", "ms, feedback"),
      C
    ), o.style.display = "flex";
  }
  const Y = e.addDOMWidget(oo, oo, t, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => 260,
    getMaxHeight: () => 620
  });
  Y.serialize = !1;
  const l = e.widgets?.find((y) => y.name === ro), L = R("button", "toggle", "JSON");
  L.title = "Show or hide the raw mixer value", L.addEventListener("click", (y) => {
    y.stopPropagation(), a = !a, L.classList.toggle("active", a), l && (l.plenioHidden = !a, a ? delete l.computeSize : l.computeSize = () => [0, -4]), e.setDirtyCanvas?.(!0, !0);
  }), s.append(R("span", "label", "Advanced"), L), l && (l.plenioHidden = !0, l.computeSize = () => [0, -4]);
  function $() {
    const y = pa(c()?.value);
    i = { ...i, mix: y ?? { schema: je, strips: {} } }, y || (r.textContent = "the mixer value is not readable; it will be replaced on the next edit"), b();
  }
  return $(), {
    showExecuted(y) {
      const g = y?.plenio_stems?.at(-1), w = xa(y), v = no(i.mix, g ?? null);
      i = { ...i, names: v, peaks: w, seconds: Number(g?.seconds ?? i.seconds) || 0 }, $();
    }
  };
}
const en = "plenio-tip", so = 12, it = 8;
function Ea(e, t, n, o) {
  let r = e.right + so;
  if (r + n.width > o.width - it && (r = e.left - so - n.width), r < it) return null;
  const s = Math.max(it, Math.min(t - 14, o.height - it - n.height));
  return { x: r, y: s };
}
function Ma(e) {
  return !!e && (String(e.type ?? "").startsWith("Plenio") || String(e.title ?? "").startsWith("Plenio"));
}
const $a = 30;
function Aa(e) {
  const t = e.node_over, n = e.ds, o = e.canvas;
  if (!t || !n || !o) return null;
  const r = o.getBoundingClientRect(), s = t.flags?.collapsed ? 0 : t.size[1];
  return {
    left: r.left + (t.pos[0] + n.offset[0]) * n.scale,
    top: r.top + (t.pos[1] - $a + n.offset[1]) * n.scale,
    right: r.left + (t.pos[0] + t.size[0] + n.offset[0]) * n.scale,
    bottom: r.top + (t.pos[1] + s + n.offset[1]) * n.scale
  };
}
function La(e) {
  const t = document.body, n = () => t.classList.remove(en);
  let o = 0, r = null;
  const s = (a) => {
    const c = e();
    if (a.style.display === "none" || !a.textContent?.trim() || !c || !Ma(c.node_over)) return n();
    const d = Aa(c), f = a.getBoundingClientRect(), h = d && Ea(d, o, f, { width: window.innerWidth, height: window.innerHeight });
    if (!h) return n();
    const S = a.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    t.style.setProperty("--plenio-tip-x", `${Math.round(h.x - S.left)}px`), t.style.setProperty("--plenio-tip-y", `${Math.round(h.y - S.top)}px`), t.classList.add(en);
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
const Ca = `
body.${en} .node-tooltip { left: var(--plenio-tip-x) !important; top: var(--plenio-tip-y) !important;
  transform: none !important; }
`, Na = `
.plenio-sheet-state { display: flex; flex-direction: column; gap: 4px; font: 12px/18px var(--font-family, sans-serif);
  color: var(--descrip-text, #999); padding: 0 2px; white-space: nowrap; overflow: hidden; }
.plenio-sheet-summary { min-width: 0; overflow: hidden; text-overflow: ellipsis; padding: 0 4px; }
.plenio-sheet-status { font-weight: 600; overflow: hidden; text-overflow: ellipsis; padding: 0 4px; }
.plenio-sheet-status[data-state="stop"] { color: #8fa3bf; }
.plenio-sheet-status[data-state="waiting"] { color: #e3a82b; }
.plenio-sheet-status[data-state="approved"], .plenio-sheet-status[data-state="ok"] { color: #4fbf7f; }
.plenio-sheet-status[data-state="warning"] { color: #d8a31a; }
.plenio-sheet-status[data-state="error"] { color: #e0574a; }
.plenio-sheet-open { --accent: 63,191,166; display: flex; align-items: center; gap: 12px; width: 100%; height: 62px; padding: 8px 10px 8px 9px;
  border-radius: 12px; border: 1px solid rgba(var(--accent), .65); color: var(--input-text, #eee); cursor: pointer; text-align: left;
  font: 12px/1.3 var(--font-family, sans-serif); background: linear-gradient(135deg, rgba(var(--accent), .26), rgba(var(--accent), .07));
  box-shadow: 0 0 0 1px rgba(var(--accent), .18) inset; transition: background .15s, box-shadow .15s; }
.plenio-sheet-open:hover { background: linear-gradient(135deg, rgba(var(--accent), .42), rgba(var(--accent), .14));
  box-shadow: 0 0 0 1px rgba(var(--accent), .45) inset, 0 2px 10px rgba(var(--accent), .25); }
.plenio-sheet-open[data-kind="score"] { --accent: 160,124,240; }
.plenio-sheet-open[data-kind="daw"] { --accent: 90,167,240; }
.plenio-sheet-open .icon { flex: none; width: 42px; height: 42px; display: grid; place-items: center; border-radius: 11px; color: #0d2420;
  background: linear-gradient(135deg, #8fe8d4, #2fa38b); box-shadow: 0 1px 4px rgba(0,0,0,.35); }
.plenio-sheet-open[data-kind="score"] .icon { color: #1c1033; background: linear-gradient(135deg, #d2bdff, #7d55d9); }
.plenio-sheet-open[data-kind="daw"] .icon { color: #08182b; background: linear-gradient(135deg, #a9d4ff, #3b84c4); }
.plenio-sheet-open .icon svg { width: 26px; height: 26px; fill: currentColor; }
.plenio-sheet-open .text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.plenio-sheet-open .name { font-size: 14px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; }
.plenio-sheet-open .what { color: var(--descrip-text, #aaa); overflow: hidden; text-overflow: ellipsis; }
.plenio-sheet-open .go { flex: none; padding: 3px 10px; border-radius: 999px; font-weight: 800; font-size: 11px; letter-spacing: .02em;
  color: #0d1a17; background: rgb(var(--accent)); }
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
` + Ca;
function Ta() {
  if (document.getElementById("plenio-styles")) return;
  const e = document.createElement("style");
  e.id = "plenio-styles", e.textContent = Na, document.head.append(e);
}
function tn(e) {
  return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function at(e) {
  return tn(e).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
function Pa(e) {
  const t = e.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((n) => n.trim());
  return t.every((n) => /^:?-{3,}:?$/.test(n)) ? null : t;
}
function Oa(e) {
  const t = [];
  let n = !1, o = null, r = null;
  const s = () => {
    n && (t.push("</ul>"), n = !1);
  }, i = () => {
    if (r) {
      const [a, ...c] = r, d = (f, h) => `<tr>${f.map((S) => `<${h}>${at(S)}</${h}>`).join("")}</tr>`;
      t.push(`<table><thead>${d(a, "th")}</thead><tbody>${c.map((f) => d(f, "td")).join("")}</tbody></table>`), r = null;
    }
  };
  for (const a of e.replace(/\r\n?/g, `
`).split(`
`)) {
    if (o !== null) {
      a.startsWith("```") ? (t.push(`<pre><code>${tn(o.join(`
`))}</code></pre>`), o = null) : o.push(a);
      continue;
    }
    if (a.trim().startsWith("|")) {
      s();
      const f = Pa(a);
      f && (r ??= []).push(f);
      continue;
    }
    if (i(), a.startsWith("```")) {
      s(), o = [];
      continue;
    }
    const c = /^(#{1,4})\s+(.*)$/.exec(a);
    if (c) {
      s();
      const f = Math.min(c[1].length + 2, 6);
      t.push(`<h${f}>${at(c[2])}</h${f}>`);
      continue;
    }
    const d = /^\s*[-*]\s+(.*)$/.exec(a);
    if (d) {
      n || (t.push("<ul>"), n = !0), t.push(`<li>${at(d[1])}</li>`);
      continue;
    }
    s(), a.trim() && t.push(`<p>${at(a)}</p>`);
  }
  return s(), i(), o !== null && t.push(`<pre><code>${tn(o.join(`
`))}</code></pre>`), t.join("");
}
const De = "plenio_summary", io = "plenio_summary", ao = 84, Ia = 18, qa = 55, Ra = 16, co = 10;
function za(e) {
  const t = e.split(`
`).filter((n) => n.trim()).reduce((n, o) => n + Math.max(1, Math.ceil(o.length / qa)), 0);
  return Ra + t * Ia;
}
function Da(e, t) {
  const n = e.widgets?.find((i) => i.name === io);
  if (n?.element) return n.element;
  const o = document.createElement("div");
  o.className = "plenio-summary";
  let r = co;
  const s = e.addDOMWidget(io, "plenio_summary", o, {
    serialize: !1,
    getValue: () => "",
    setValue: () => {
    },
    getMinHeight: () => ao,
    // as tall as its text: a short summary leaves the rest of the node to the other widgets. The margins
    // count too - without them the element stayed 20 px short of its text and hid the last line
    getMaxHeight: () => Math.max(ao, (o.scrollHeight ? o.scrollHeight + 2 : za(t.markdown)) + 2 * r)
  });
  return r = s.margin ?? co, s.serialize = !1, o;
}
function Ba(e) {
  const t = e.computeSize?.();
  t && e.size && e.size[1] < t[1] && e.setSize?.([e.size[0], t[1]]);
}
const lo = /* @__PURE__ */ new WeakMap();
function nn(e, t) {
  if (!t.markdown) return;
  const n = lo.get(e) ?? { markdown: "" };
  n.markdown = t.markdown, lo.set(e, n);
  const o = Da(e, n);
  o.dataset.status = t.status ?? "", o.innerHTML = Oa(t.markdown), Ba(e), e.setDirtyCanvas?.(!0, !0);
}
function uo(e, t, n, o) {
  const r = e.properties?.[De], s = (r?.markdown ?? "").split(`
`), i = s.findIndex((c) => c.startsWith(t));
  i >= 0 ? s[i] = n : s.push(n);
  const a = { markdown: s.join(`
`).trim(), status: o ?? r?.status ?? "" };
  e.properties = e.properties ?? {}, e.properties[De] = a, nn(e, a);
}
function Ha(e) {
  e.prototype.onExecuted = Z(e.prototype.onExecuted, function(t) {
    const n = t?.[De], o = n?.[n.length - 1];
    o?.markdown && (this.properties = this.properties ?? {}, this.properties[De] = { markdown: o.markdown, status: o.status ?? "" }, nn(this, o));
  }), e.prototype.onConfigure = Z(e.prototype.onConfigure, function() {
    const t = this.properties?.[De];
    t?.markdown && nn(this, t);
  });
}
const Fa = "Plenio.Core", J = xr;
Zi(J);
const G = ho, Ht = { app: G, fetcher: J }, Ft = { app: G, fetcher: J }, ar = () => G.graph;
function on(e) {
  if (e == null) return null;
  const t = String(e);
  return ar()?.getNodeById?.(t.includes(":") ? t : Number(t)) ?? null;
}
const po = new Zs(
  (e) => G.extensionManager?.toast?.add({ severity: "warn", summary: e.summary, detail: e.detail, life: 2e4 })
), ja = {
  scale: () => G.canvas?.ds?.scale ?? 1,
  toast: (e, t) => G.extensionManager?.toast?.add({ severity: "info", summary: e, detail: t, life: 12e3 })
}, cr = () => ln(import.meta.url, un), Wa = {
  fetcher: J,
  async draw(e, t, n, o) {
    const { notationPdf: r, renderLines: s } = await ze(
      () => import("./notationExport-DkCMgjck.mjs").then((a) => a.c),
      cr,
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
function Ga(e, t) {
  const n = on(e), o = n?.properties?.plenio_summary;
  return n?.type === "PlenioExportRelease" && o?.markdown?.includes(`- sheet music: ${t}`) ? n : null;
}
function Va(e, t) {
  const n = `- sheet music: ${e.job.file}`, o = Ga(t, e.job.file);
  if ("saved" in e) {
    o && uo(o, n, `${n} - saved (${Math.max(1, Math.round(e.saved.bytes / 1024))} KB)`), G.extensionManager?.toast?.add({ severity: "success", summary: "Sheet music saved", detail: e.saved.file, life: 6e3 });
    return;
  }
  const { error: r } = e, s = r instanceof U && r.hint ? `${r.message} ${r.hint}` : String(r instanceof Error ? r.message : r);
  if (e.quiet) {
    console.info(`Plenio: ${e.job.file} was saved by another page`);
    return;
  }
  o && uo(o, n, `${n} - not saved: ${s}`, "warning"), G.extensionManager?.toast?.add({ severity: "error", summary: "Sheet music not saved", detail: `${e.job.file}: ${s}`, life: 15e3 });
}
const rn = /* @__PURE__ */ new Map(), fo = new Ni(Wa, (e) => {
  Va(e, rn.get(e.job.token)), rn.delete(e.job.token);
});
ho.registerExtension({
  name: Fa,
  getCustomWidgets: () => ({ [nr]: ea, [or]: ia }),
  // a song's release record opens its workflow again, its documents kept (continueSong.ts)
  commands: [
    {
      id: Nt,
      label: "Continue a Plenio song…",
      icon: "pi pi-history",
      function: () => ps(Ht).catch((e) => {
        console.error("Plenio: the Continue a song dialog could not open", e), G.extensionManager?.toast?.add({
          severity: "error",
          summary: "Continue a song",
          detail: String(e instanceof Error ? e.message : e),
          life: 15e3
        });
      })
    },
    { id: Dn, label: "Plenio Player", icon: "pi pi-play-circle", function: () => Qt(Ft) }
  ],
  menuCommands: [
    { path: ["File"], commands: [Nt] },
    { path: ["Plenio"], commands: [Dn, Nt] }
  ],
  // the Plenio Player, one click away beside Run (player.ts): started as a program of its own when none runs
  actionBarButtons: [
    {
      icon: "pi pi-play-circle",
      label: "Plenio Player",
      tooltip: "Open the Plenio Player: your songs with live lyrics, sheet music and visuals (starts it if needed)",
      onClick: () => {
        Qt(Ft);
      }
    }
  ],
  // a workflow saved before its blocks followed the brief's creativity: they are brought up to date before
  // the frontend configures it (blocks.ts); loading goes on as it was when that fails
  async beforeConfigureGraph(e) {
    try {
      const t = await Nr(e, J);
      for (const n of Tr(t)) G.extensionManager?.toast?.add({ ...n, life: 2e4 });
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
    ri(), sa();
  },
  beforeRegisterNodeDef(e, t) {
    if (!t.name.startsWith("Plenio")) return;
    Ha(e), pi(e, ja);
    const n = ys(t.input);
    if (n.size || t.name in pn) {
      const o = e.prototype.configure;
      e.prototype.configure = function(r) {
        const s = Ds(t, r), i = hs(s), a = o?.call(this, s);
        return bs(this, i, n), Is(t.name, this.widgets), a;
      };
    }
    if (t.name === "PlenioTranscribeLyrics" && (e.prototype.onExecuted = Z(e.prototype.onExecuted, function(o) {
      for (const r of o?.plenio_asr ?? []) Hs(r);
    })), t.name === "PlenioEQ") {
      const o = /* @__PURE__ */ new WeakMap(), r = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        r?.call(this), o.set(this, Cs(this, J));
      }, e.prototype.onExecuted = Z(e.prototype.onExecuted, function(s) {
        o.get(this)?.showExecuted(s);
      });
    }
    if (t.name === "PlenioExportRelease" && Gs(e, Ft), t.name === Xo && qi(e), Gr.has(t.name)) {
      Vr(e, J);
      const o = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        o?.call(this), po.watch(this), Hi(
          this,
          (r, s) => G.extensionManager?.toast?.add({ severity: "info", summary: r, detail: s, life: 1e4 })
        );
      };
    }
    if (t.name === "PlenioStemMixer") {
      const o = /* @__PURE__ */ new WeakMap(), r = e.prototype.onNodeCreated;
      e.prototype.onNodeCreated = function() {
        r?.call(this), o.set(this, _a(this));
      }, e.prototype.onExecuted = Z(e.prototype.onExecuted, function(s) {
        o.get(this)?.showExecuted(s);
      });
    }
    t.name === "PlenioSongSheet" && (e.prototype.onExecuted = Z(e.prototype.onExecuted, function(o) {
      const r = o?.plenio_sheet, s = r?.[r.length - 1];
      s && zn(String(this.id), s);
    }));
  },
  setup() {
    Ta(), La(() => G.canvas), ds(Ht), Ys(Ht), J.addEventListener("plenio.sheet", (n) => {
      const o = n.detail;
      if (!o?.node_id) return;
      zn(String(o.node_id), o);
      const r = on(o.node_id);
      r && Ce(r, Lo(o));
    }), J.addEventListener("status", (n) => {
      po.status(n.detail?.exec_info?.queue_remaining);
    }), J.addEventListener("execution_start", () => {
      oi(ar()?.nodes ?? []);
    }), J.addEventListener("execution_error", (n) => {
      const o = on(n.detail?.node_id);
      o && String(o.type).startsWith("Plenio") && Ce(o, "error");
    }), J.addEventListener("executed", (n) => {
      const o = n.detail, r = $i(o?.output), s = o?.display_node ?? o?.node;
      for (const i of r) rn.set(i.token, s);
      fo.take(r);
    });
    const e = () => {
      fo.recover();
    };
    let t = !1;
    J.addEventListener("reconnected", () => {
      cr().then((n) => {
        n ? t || (t = !0, G.extensionManager?.toast?.add({ severity: "warn", summary: "Plenio was updated", detail: Vt })) : e();
      });
    }), document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible" && e();
    }), window.setTimeout(e, 3e3);
  }
});
export {
  lc as $,
  Wo as A,
  $c as B,
  qo as C,
  Bo as D,
  zo as E,
  ke as F,
  _c as G,
  xc as H,
  bi as I,
  Un as J,
  Sc as K,
  ec as L,
  Ka as M,
  Do as N,
  Za as O,
  U as P,
  Ac as Q,
  Ro as R,
  Ho as S,
  K as T,
  kc as U,
  uc as V,
  Ec as W,
  Xa as X,
  ic as Y,
  cc as Z,
  sc as _,
  nc as a,
  Be as a0,
  ac as a1,
  kr as a2,
  Zr as a3,
  Kr as a4,
  vc as a5,
  ki as a6,
  Mc as a7,
  yo as a8,
  Fa as a9,
  Qa as b,
  tc as c,
  Oo as d,
  dc as e,
  wi as f,
  fc as g,
  pc as h,
  bo as i,
  gc as j,
  wc as k,
  rc as l,
  hc as m,
  mc as n,
  mt as o,
  wo as p,
  hi as q,
  _e as r,
  yc as s,
  Ja as t,
  bc as u,
  oc as v,
  Go as w,
  nt as x,
  yi as y,
  _i as z
};
