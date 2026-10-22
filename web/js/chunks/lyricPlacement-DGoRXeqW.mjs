function b(a) {
  return typeof a == "number" && Number.isFinite(a) && Math.abs(a) <= 10 ? Math.round(a * 1e3) / 1e3 : 0;
}
function x(a, o) {
  return `${a}:${o}`;
}
function w(a) {
  const o = /^(\d+):(\d+)$/.exec(a);
  return o ? { block: Number(o[1]), line: Number(o[2]) } : null;
}
const S = 512;
function M(a) {
  if (!Array.isArray(a)) return [];
  const o = [];
  for (const s of a) {
    if (!Array.isArray(s) || s.length === 3 || s.length < 2 || s.length > 4 + S || !s.every((l) => Number.isInteger(l) && l >= 0)) continue;
    const [n, c] = s;
    if (c <= n) continue;
    if (s.length === 2) {
      o.push([n, c]);
      continue;
    }
    const h = s.slice(4), i = h.every((l, r) => l >= n && l < c && (r === 0 || l >= h[r - 1]));
    o.push([n, c, s[2], s[3], ...i ? h : []]);
  }
  return o.sort((s, n) => s[0] - n[0] || s[1] - n[1] || (s[2] ?? -1) - (n[2] ?? -1) || (s[3] ?? -1) - (n[3] ?? -1));
}
function $(a, o) {
  return a.length === o.length && a.every((s, n) => s.length === o[n].length && s.every((c, h) => c === o[n][h]));
}
function k(a, o) {
  return a.parts.find((s) => s.block === o);
}
function N(a, o) {
  return a.parts.find((s) => o >= s.start && o < s.end);
}
function y(a) {
  return a.syllables.length > 0 || a.pinned;
}
function A(a, o, s) {
  let n = 0, c = s;
  for (const h of a.parts) {
    const i = h.lines.filter(y);
    !i.length || h.block === o || (h.block < o ? n = Math.max(n, ...i.map((l) => Math.max(l.end, l.start + 1))) : c = Math.min(c, ...i.map((l) => l.start)));
  }
  return [n, Math.max(c, n + 1)];
}
function v(a, o, s, n, c) {
  const h = k(a, o), [i, l] = n, r = new Map((h?.lines ?? []).map((f) => [f.line, f])), t = [];
  let e = h ? Math.max(h.start, i) : i;
  return s.forEach((f, d) => {
    const u = r.get(d), g = u && y(u);
    let p = g ? u.start : e, m = g ? Math.max(u.end, u.start + 1) : p + c;
    p = Math.min(Math.max(p, i), l - 1), m = Math.min(Math.max(m, p + 1), l), t.push({ id: String(d), text: f, start: p, end: m }), e = m;
  }), t;
}
function E(a, o) {
  const [s, n] = o, c = a.map((t, e) => {
    const f = Math.max(1, Math.min(t.end - t.start, n - s)), d = Math.min(Math.max(t.start, s), n - 1);
    return { line: { ...t, start: d, end: Math.min(d + f, n) }, index: e, placed: t.id.startsWith("*") };
  }), h = c.filter((t) => t.placed).sort((t, e) => t.line.start - e.line.start), i = (t) => {
    let e = t;
    for (const f of h) e >= f.line.start && e < f.line.end && (e = f.line.end);
    return e;
  };
  let l = s;
  for (const t of c.filter((e) => !e.placed).sort((e, f) => e.line.start - f.line.start || e.index - f.index)) {
    const { start: e, end: f } = t.line;
    let d = i(Math.max(e, l));
    for (; d !== i(d); ) d = i(d);
    const u = f > d ? f : d + (f - e);
    t.line.start = Math.min(d, n - 1), t.line.end = Math.min(Math.max(u, t.line.start + 1), n), l = t.line.end;
  }
  const r = c.sort((t, e) => t.line.start - e.line.start || Number(e.placed) - Number(t.placed) || t.index - e.index).map((t) => t.line);
  for (let t = 0; t < r.length; t++) {
    const e = r[t + 1];
    e && e.start <= r[t].start && (e.start = Math.min(r[t].start + 1, n - 1)), e && r[t].end > e.start && (r[t].end = e.start), r[t].end <= r[t].start && (r[t].end = Math.min(r[t].start + 1, n));
  }
  return r;
}
function L(a, o, s) {
  const n = a.filter((r) => r.length >= 4 && !s.has(r[2])), c = new Set(n.map((r) => x(r[2], r[3]))), h = a.some((r) => r.length === 2) ? o.parts.flatMap(
    (r) => r.lines.filter((t) => t.pinned && !s.has(t.block) && !c.has(x(t.block, t.line))).map((t) => [t.start, t.end, t.block, t.line])
  ) : [], i = new Map(a.filter((r) => r.length > 4).map((r) => [`${r[0]}:${r[1]}:${r[2]}`, r.slice(4)])), l = [...s].flatMap(
    ([r, t]) => t.map((e, f) => [e.start, e.end, r, f, ...i.get(`${e.start}:${e.end}:${r}`) ?? []])
  );
  return M([...n, ...h, ...l]);
}
function O(a, o) {
  const s = [];
  for (const n of a) {
    const [c, h] = n;
    for (const [i, l, r] of o) {
      if (c < i || c >= l) continue;
      const t = r - i, e = n.slice(4), f = e.every((u) => u >= i && u < l) ? e.map((u) => u + t) : [], d = n.length >= 4 ? [c + t, Math.min(h, l) + t, n[2], n[3], ...f] : [c + t, Math.min(h, l) + t];
      s.push(d);
    }
  }
  return M(s);
}
function K(a, o, s, n, c) {
  const h = [];
  for (const i of a) {
    if (i.length < 4) {
      h.push(i);
      continue;
    }
    const l = s[i[2]], r = n.map((e, f) => ({ index: e, block: f })).filter(({ index: e }) => l !== void 0 && o[e] === l);
    if (!r.length) continue;
    const t = r.reduce((e, f) => Math.abs(c[f.index] - i[0]) < Math.abs(c[e.index] - i[0]) ? f : e);
    h.push([i[0], i[1], t.block, i[3], ...i.slice(4)]);
  }
  return M(h);
}
function B(a) {
  const o = [...a].sort((n, c) => n.start - c.start), s = o[0]?.start ?? 0;
  return o.map((n) => ({ text: n.text, offset: n.start - s, length: n.end - n.start }));
}
export {
  B as clipOfLines,
  A as editRange,
  K as followSpans,
  x as lineKey,
  w as parseLineKey,
  b as parseShift,
  M as parseSpans,
  N as partAt,
  k as partOf,
  v as placedLines,
  O as remapSpans,
  $ as sameSpans,
  E as settle,
  L as withBlockSpans
};
