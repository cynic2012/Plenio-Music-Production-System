const u = {
  Vocal: "#4c9aff",
  Ins: "#f0a35e",
  chords: "#9ecbff",
  guide: "#9aa4b2"
}, g = {
  Vocal: { track: "vocal", name: "Vocal" },
  Ins: { track: "ins", name: "Instrument" }
};
function I(n, r, e) {
  const t = n?.model?.tracks[r] ?? [], o = r === "vocal" ? "Vocal" : "Instrument";
  return t.length ? t.some((c) => c.pitch + e < 0 || c.pitch + e > 127) ? `A ${o} note would leave the MIDI range` : null : `The ${o} track has no notes`;
}
function y(n, r = 0) {
  const e = n?.model?.tracks;
  return [
    {
      voice: "Vocal",
      name: "Vocal",
      destination: "V: Vocal",
      notes: e?.vocal.length ?? 0,
      color: u.Vocal,
      sent: !0
    },
    {
      voice: "Ins",
      name: "Instrument",
      destination: "V: Ins",
      notes: e?.ins.length ?? 0,
      color: u.Ins,
      sent: !0
    },
    {
      voice: "chords",
      name: "Chords",
      destination: "chord symbols",
      notes: e?.chords.length ?? 0,
      color: u.chords,
      sent: !0
    },
    {
      voice: "guide",
      name: "Guide",
      destination: "not sent to YuE2",
      notes: r,
      color: u.guide,
      sent: !1
    }
  ];
}
function V(n) {
  return n === 1 ? "1 note" : `${n} notes`;
}
function v(n, r) {
  if (!n?.length || !r) return [];
  const e = r.grid.units_per_quarter, t = 60 / r.tempo;
  return !e || !r.tempo ? [] : n.map(([o, c, l], f) => ({
    id: `guide:${o}:${f}`,
    segments: [],
    midi: l,
    start_s: o / e * t,
    duration_s: c / e * t
  }));
}
function k(n) {
  const r = typeof n == "string" && n.trim() ? p(n) : n;
  if (!Array.isArray(r)) return [];
  const e = [];
  for (const t of r)
    !Array.isArray(t) || t.length !== 3 || !t.every((o) => typeof o == "number" && Number.isInteger(o)) || t[0] < 0 || t[1] < 1 || t[2] < 0 || t[2] > 127 || e.push([t[0], t[1], t[2]]);
  return e.sort((t, o) => t[0] - o[0] || t[2] - o[2]);
}
function p(n) {
  try {
    return JSON.parse(n);
  } catch {
    return null;
  }
}
function A(n) {
  return n.map(([r, e, t]) => [r, e, t]);
}
function G(n, r) {
  const e = [];
  for (const [t, o, c] of n) {
    const l = t + o, f = r.map(([s, a, m]) => {
      const d = Math.max(t, s), h = Math.min(l, a);
      return h > d ? { start: m + d - s, end: m + h - s, from: d, to: h } : null;
    }).filter((s) => s !== null).sort((s, a) => s.start - a.start), i = [];
    for (const s of f) {
      const a = i[i.length - 1];
      a && a.end === s.start && a.to === s.from ? i[i.length - 1] = { ...a, end: s.end, to: s.to } : i.push(s);
    }
    for (const s of i) e.push([s.start, s.end - s.start, c]);
  }
  return e.sort((t, o) => t[0] - o[0] || t[2] - o[2]);
}
function _(n, r) {
  return n.length === r.length && n.every((e, t) => e.every((o, c) => o === r[t][c]));
}
export {
  g as SHIFTABLE,
  u as TRACK_COLORS,
  v as guideNotes,
  V as notesLabel,
  k as parseGuide,
  G as remapGuide,
  _ as sameGuide,
  A as serializeGuide,
  I as shiftBlock,
  y as trackRows
};
