/** Plenio Nova's worlds to fly through: neon rings, a fractal, a gyroid's caves, a city of the spectrum, an outrun
 * drive - and two made of the music's own last seconds (its spectrum's history, carried over as a state). */
import type { NovaDef } from './renderer'

const rings: NovaDef = {
  id: 'nova-rings',
  name: 'Neon rings',
  blurb: 'A flight through hexagonal neon rings, each one lit by its own band of the spectrum, the nearest flashing on the beat',
  suits: ['energetic', 'electronic'],
  bloom: 0.6,
  exposure: 1,
  speed: [0.9, 2.2],
  image: `
float ring = 0.0;
vec2 path(float z) { return vec2(sin(z * 0.13) * 1.4 + sin(z * 0.051) * 1.1, cos(z * 0.09) * 0.9); }
float map(vec3 q) {
  float spacing = 2.4;
  float k = floor(q.z / spacing + 0.5);
  vec3 r = q;
  r.xy -= path(k * spacing);
  r.z -= k * spacing;
  r.xy = rot(k * 0.5 + spin * 0.6) * r.xy;
  vec2 a = abs(r.xy);
  float hex = max(a.x * 0.8660254 + a.y * 0.5, a.y) - (1.7 + 0.3 * spec(fract(k * 0.137) * 0.8));
  ring = k;
  return length(vec2(hex, r.z)) - 0.04;
}
vec3 image(vec2 p, vec2 uv) {
  float z0 = travel * 7.0;
  vec3 ro = vec3(path(z0), z0);
  vec3 ta = vec3(path(z0 + 4.0), z0 + 4.0);
  vec3 rd = look(ro, ta, rot(sin(T * 0.13) * 0.2) * p, 1.4);
  vec3 col = vec3(0.0);
  float t = 0.05;
  for (int i = 0; i < 72; i++) {
    vec3 q = ro + rd * t;
    float d = map(q);
    float e = spec(fract(abs(ring) * 0.137) * 0.8);
    vec3 c = pal(ring * 0.061 + T * 0.02) * (0.1 + 1.6 * e * e + 1.0 * pulse * exp(-t * 0.3));
    col += c * 0.0035 / (0.0012 + d * d * 90.0) * exp(-t * 0.06) * smoothstep(0.4, 3.0, t);
    t += max(d * 0.75, 0.03);
    if (t > 45.0) break;
  }
  col += pal(0.7) * 0.03 * fbm(p * 3.0 + vec2(0.0, travel));
  return col;
}`,
}

const bulb: NovaDef = {
  id: 'nova-bulb',
  name: 'Mandelbulb',
  blurb: 'The famous 3D fractal turning slowly in the dark, its shape breathing with the bass, its glow with the beat',
  suits: ['electronic', 'dark', 'calm'],
  bloom: 1,
  exposure: 1.15,
  speed: [0.4, 1],
  image: `
float trap = 0.0;
float bulb(vec3 p) {
  vec3 z = p;
  float dr = 1.0;
  float r = 0.0;
  float power = 8.0 + 1.1 * sin(T * 0.11) + 0.9 * bass;
  trap = 1e9;
  for (int i = 0; i < 7; i++) {
    r = length(z);
    if (r > 2.0) break;
    float theta = acos(clamp(z.z / r, -1.0, 1.0)) * power;
    float phi = atan(z.y, z.x) * power;
    dr = pow(r, power - 1.0) * power * dr + 1.0;
    z = pow(r, power) * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta)) + p;
    trap = min(trap, dot(z, z));
  }
  return 0.5 * log(max(r, 1e-6)) * r / dr;
}
vec3 image(vec2 p, vec2 uv) {
  float ang = T * 0.06 + spin * 0.12;
  vec3 ro = vec3(sin(ang) * 2.6, 0.8 * sin(T * 0.05), cos(ang) * 2.6);
  vec3 rd = look(ro, vec3(0.0), p, 1.8);
  float r2 = dot(p, p);
  vec3 col = pal(0.62) * 0.025 * exp(-r2 * 0.8) + pal(0.1) * 0.015 * pulse;
  float b = dot(ro, rd);
  float h = b * b - (dot(ro, ro) - 1.44);
  if (h > 0.0) {
    float t = max(0.0, -b - sqrt(h));
    float far = -b + sqrt(h);
    float glow = 0.0;
    float steps = 0.0;
    bool hit = false;
    for (int i = 0; i < 110; i++) {
      vec3 q = ro + rd * t;
      float d = bulb(q);
      glow += exp(-d * 40.0);
      steps += 1.0;
      if (d < 0.0005 * t) {
        hit = true;
        break;
      }
      t += d * 0.9;
      if (t > far) break;
    }
    if (hit) {
      vec3 q = ro + rd * t;
      float shade = trap;
      vec2 e = vec2(0.0008, -0.0008);
      vec3 n = normalize(e.xyy * bulb(q + e.xyy) + e.yyx * bulb(q + e.yyx) + e.yxy * bulb(q + e.yxy) + e.xxx * bulb(q + e.xxx));
      vec3 light = normalize(vec3(0.6, 0.8, 0.4));
      float diff = max(0.0, dot(n, light));
      float back = max(0.0, dot(n, -light)) * 0.25;
      float rim = pow(1.0 - max(0.0, dot(n, -rd)), 4.0);
      float ao = pow(clamp(1.0 - steps / 90.0, 0.0, 1.0), 2.0);
      vec3 base = mix(pal(0.05), pal(0.55), smoothstep(0.15, 1.1, shade));
      base = mix(base, vec3(1.0), 0.12);
      col = base * (0.05 + 1.3 * diff + back) * ao + pal(0.1) * rim * (0.2 + 0.8 * mid) * ao + vec3(1.0) * pow(max(0.0, dot(reflect(rd, n), light)), 40.0) * 0.7 * ao;
    }
    col += pal(0.15) * glow * 0.0025 * (0.5 + 1.5 * pulse + kick);
  }
  return col;
}`,
}

const gyroid: NovaDef = {
  id: 'nova-gyroid',
  name: 'Gyroid caves',
  blurb: 'Gliding through endless curved caves, their walls breathing with the bass, a glow running along the way',
  suits: ['electronic', 'calm'],
  bloom: 0.9,
  exposure: 1.1,
  speed: [0.7, 1.5],
  image: `
vec2 path(float z) { return vec2(sin(z * 0.15) * 1.2, cos(z * 0.11) * 1.0); }
float map(vec3 p) {
  vec3 q = p * 2.2;
  float g = abs(dot(sin(q), cos(q.zxy))) / 2.2 - (0.035 + 0.035 * bass + 0.03 * kick);
  float tube = 0.5 - length(p.xy - path(p.z));
  return max(g, tube) * 0.7;
}
vec3 image(vec2 p, vec2 uv) {
  float z0 = travel * 3.0;
  vec3 ro = vec3(path(z0), z0);
  vec3 rd = look(ro, vec3(path(z0 + 2.0), z0 + 2.0), p, 1.2);
  float t = 0.0;
  float glow = 0.0;
  float steps = 0.0;
  bool hit = false;
  for (int i = 0; i < 96; i++) {
    vec3 q = ro + rd * t;
    float d = map(q);
    glow += 0.02 / (0.03 + abs(d) * 10.0);
    steps += 1.0;
    if (d < 0.001) {
      hit = true;
      break;
    }
    t += d;
    if (t > 32.0) break;
  }
  vec3 fogColor = pal(0.62) * 0.015;
  vec3 col = fogColor;
  if (hit) {
    vec3 q = ro + rd * t;
    vec2 e = vec2(0.002, -0.002);
    vec3 n = normalize(e.xyy * map(q + e.xyy) + e.yyx * map(q + e.yyx) + e.yxy * map(q + e.yxy) + e.xxx * map(q + e.xxx));
    float diff = max(0.0, dot(n, -rd));
    float ao = clamp(1.0 - steps / 70.0, 0.0, 1.0);
    vec3 base = pal(q.z * 0.03 + 0.15 * sin(q.x + q.y));
    vec3 v = q * 7.0;
    float veins = smoothstep(0.06, 0.0, abs(dot(sin(v), cos(v.zxy))) / 7.0);
    col = base * (0.015 + 0.3 * pow(diff, 3.0)) * ao + mix(base, vec3(1.0), 0.3) * veins * (0.6 + 2.5 * treb + 1.5 * pulse);
    col = mix(col, fogColor, 1.0 - exp(-t * 0.12));
  }
  col += pal(0.15 + 0.02 * t) * glow * 0.0016 * (0.4 + 1.5 * pulse + mid);
  return col;
}`,
}

const city: NovaDef = {
  id: 'nova-city',
  name: 'Spectrum city',
  blurb: 'Flying low over a night city whose towers rise and fall with the spectrum, neon on the roofs, lights in the windows',
  suits: ['energetic', 'electronic'],
  bloom: 1,
  exposure: 1.1,
  speed: [0.8, 1.6],
  image: `
float house(vec2 cell) {
  float h = hash12(cell);
  if (h < 0.18) return 0.0;
  float band = spec(fract(abs(cell.x) * 0.0625) * 0.8 + 0.02);
  return (0.4 + 1.6 * h * h) * (0.45 + 1.7 * band);
}
float box(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}
float map(vec3 p) {
  vec2 cell = floor(p.xz);
  vec2 f = fract(p.xz) - 0.5;
  float h = house(cell);
  float d = p.y;
  if (h > 0.0) d = min(d, box(vec3(f.x, p.y - h * 0.5, f.y), vec3(0.36, h * 0.5, 0.36)));
  return d;
}
vec3 sky(vec3 rd) {
  vec3 col = mix(pal(0.92) * 0.12, pal(0.65) * 0.01, smoothstep(-0.05, 0.5, rd.y));
  vec3 s = rd * 200.0;
  col += vec3(0.7) * step(0.99, hash13(floor(s))) * smoothstep(0.35, 0.0, length(fract(s) - 0.5)) * smoothstep(0.1, 0.4, rd.y);
  return col;
}
vec3 image(vec2 p, vec2 uv) {
  float z0 = travel * 2.5;
  vec3 ro = vec3(0.5 + 0.8 * sin(z0 * 0.05), 3.6 + 0.4 * sin(T * 0.1), z0);
  vec3 rd = look(ro, ro + vec3(0.3 * sin(T * 0.07), -1.4, 4.0), p, 1.5);
  vec2 sd = vec2(rd.x >= 0.0 ? 1.0 : -1.0, rd.z >= 0.0 ? 1.0 : -1.0) * max(abs(rd.xz), vec2(1e-4));
  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < 160; i++) {
    vec3 q = ro + rd * t;
    float d = map(q);
    if (d < 0.002) {
      hit = true;
      break;
    }
    vec2 edge = (step(0.0, sd) - fract(q.xz)) / sd;
    t += min(d, min(edge.x, edge.y) + 0.002);
    if (t > 70.0) break;
  }
  vec3 horizon = pal(0.92) * 0.12;
  if (!hit) return sky(rd);
  vec3 q = ro + rd * t;
  vec2 cell = floor(q.xz);
  vec2 f = fract(q.xz) - 0.5;
  vec3 col;
  if (q.y < 0.004) {
    float street = smoothstep(0.42, 0.5, max(abs(f.x), abs(f.y)));
    float lanes = smoothstep(0.03, 0.0, abs(abs(f.x) - 0.5)) + smoothstep(0.03, 0.0, abs(abs(f.y) - 0.5));
    col = vec3(0.004) + pal(0.1) * lanes * 0.25 * (0.5 + bass) + sky(reflect(rd, vec3(0.0, 1.0, 0.0))) * 0.25 * street;
  } else {
    vec2 e = vec2(0.002, -0.002);
    vec3 n = normalize(e.xyy * map(q + e.xyy) + e.yyx * map(q + e.yyx) + e.yxy * map(q + e.yxy) + e.xxx * map(q + e.xxx));
    float h = house(cell);
    float hue = hash12(cell + 7.0);
    col = pal(hue) * 0.015 + pal(0.6) * 0.02 * max(0.0, n.y);
    if (n.y > 0.5) {
      float edge = 0.36 - max(abs(f.x), abs(f.y));
      float band = spec(fract(abs(cell.x) * 0.0625) * 0.8 + 0.02);
      col += pal(hue * 0.5 + 0.05) * smoothstep(0.025, 0.0, edge) * (1.0 + 4.0 * band * band) ;
    } else {
      vec2 wall = abs(n.x) > 0.5 ? vec2(q.z, q.y) : vec2(q.x, q.y);
      vec2 w = fract(wall * vec2(7.0, 9.0));
      vec2 wid = floor(wall * vec2(7.0, 9.0));
      float lit = step(0.5, hash12(wid + cell * 13.1));
      float glass = step(0.22, w.x) * step(w.x, 0.78) * step(0.28, w.y) * step(w.y, 0.72);
      col += mix(vec3(1.0, 0.72, 0.42), pal(hue), 0.45) * glass * lit * 1.4 * step(q.y, h - 0.05);
    }
  }
  return mix(col, horizon, 1.0 - exp(-t * 0.035));
}`,
}

const outrun: NovaDef = {
  id: 'nova-outrun',
  name: 'Outrun',
  blurb: 'A night drive down a neon valley towards a striped sunset, the grid pumping with the bass, the hills with the spectrum',
  suits: ['energetic', 'electronic'],
  bloom: 1.1,
  exposure: 1.05,
  speed: [1, 2],
  image: `
float ground(vec2 q) {
  float side = smoothstep(5.0, 14.0, abs(q.x));
  float hills = fbm(q * 0.08) * 7.0 + pow(1.0 - abs(noise(q * 0.05) * 2.0 - 1.0), 2.0) * 5.0;
  return side * hills * (0.8 + 0.4 * spec(clamp((abs(q.x) - 5.0) / 25.0, 0.0, 1.0) * 0.8));
}
vec3 haze(vec3 rd) {
  vec2 s = rd.xy / max(rd.z, 0.1) - vec2(0.0, 0.17);
  return mix(pal(0.95) * 0.35, pal(0.68) * 0.02, smoothstep(0.0, 0.45, rd.y)) + pal(0.05) * exp(-length(s) * 6.0) * 0.3;
}
vec3 sky(vec3 rd) {
  vec3 col = mix(pal(0.95) * 0.35, pal(0.68) * 0.02, smoothstep(0.0, 0.45, rd.y));
  vec2 s = rd.xy / max(rd.z, 0.1) - vec2(0.0, 0.17);
  float r = length(s);
  float disc = smoothstep(0.205, 0.2, r);
  float cut = step(0.0, s.y) + step(0.08 + 0.5 * clamp(-s.y / 0.2, 0.0, 1.0), fract(s.y * 26.0 - T * 0.4));
  vec3 sun = mix(pal(0.95), pal(0.12), smoothstep(-0.2, 0.2, s.y)) * 3.0;
  col = mix(col, sun, disc * clamp(cut, 0.0, 1.0));
  col += pal(0.05) * exp(-r * 6.0) * (0.25 + 0.4 * level + 0.5 * pulse);
  vec3 st = rd * 180.0;
  col += vec3(0.8) * step(0.988, hash13(floor(st))) * smoothstep(0.35, 0.0, length(fract(st) - 0.5)) * smoothstep(0.2, 0.5, rd.y);
  return col;
}
vec3 image(vec2 p, vec2 uv) {
  vec3 ro = vec3(0.5, 0.55, travel * 4.0);
  vec3 rd = normalize(vec3(p.x, p.y - 0.06, 1.6));
  vec3 col = sky(rd);
  if (rd.y > 0.12) return col;
  float t = 0.0;
  float last = 0.0;
  bool hit = false;
  for (int i = 0; i < 110; i++) {
    vec3 q = ro + rd * t;
    float h = q.y - ground(q.xz);
    if (h < 0.002 * t) {
      hit = true;
      break;
    }
    last = max(0.02, h * 0.3);
    t += last;
    if (t > 90.0) break;
  }
  if (!hit) return col;
  float a = t - last;
  float b = t;
  for (int k = 0; k < 6; k++) {
    float m = 0.5 * (a + b);
    vec3 r = ro + rd * m;
    if (r.y - ground(r.xz) < 0.0) b = m;
    else a = m;
  }
  t = 0.5 * (a + b);
  vec3 q = ro + rd * t;
  vec2 g = q.xz;
  vec2 w = fwidth(g);
  vec2 dl = abs(fract(g + 0.5) - 0.5) / max(w, vec2(1e-4));
  float line = 1.0 - min(min(dl.x, dl.y), 1.0);
  vec2 l2 = abs(fract(g + 0.5) - 0.5);
  float halo = exp(-min(l2.x, l2.y) * 16.0);
  vec3 lineColor = mix(pal(0.92), pal(0.55), smoothstep(0.0, 5.0, q.y));
  float pump = 0.6 + 0.8 * bass + 1.5 * kick * exp(-t * 0.08);
  vec3 land = mix(vec3(0.012, 0.0, 0.03), pal(0.7) * 0.05, smoothstep(0.0, 6.0, q.y)) + lineColor * (line * 1.5 + halo * 0.3) * pump;
  return mix(land, haze(normalize(vec3(rd.x, 0.0, rd.z))), 1.0 - exp(-t * 0.016));
}`,
}

/** The spectrum's history: the newest at the bottom row, the rows before moving up one at every step. */
const HISTORY = `
vec4 next(vec2 uv) {
  float row = 1.0 / S.y;
  if (uv.y < row) return vec4(spec(uv.x), peak(uv.x), 0.0, 1.0);
  return textureLod(state, uv - vec2(0.0, row), 0.0);
}`

const pulsar: NovaDef = {
  id: 'nova-pulsar',
  name: 'Pulsar',
  blurb: 'The last seconds of the spectrum as ridge lines stacked into the distance - the famous album cover, alive',
  suits: ['dark', 'energetic', 'electronic'],
  bloom: 0.7,
  exposure: 1.1,
  speed: [0.5, 1],
  state: { code: HISTORY, rate: 18, height: 64, width: 128 },
  image: `
vec3 image(vec2 p, vec2 uv) {
  float half_ = min(1.2, R.x / R.y * 0.78);
  float x = p.x / half_;
  if (abs(x) > 1.0) return vec3(0.0);
  float f = abs(x);
  float env = smoothstep(1.0, 0.22, f);
  float px = 2.0 / R.y;
  for (int j = 0; j < 42; j++) {
    float fj = float(j);
    float depth = fj + lag;
    float base = -0.86 + depth * 0.034;
    float v = textureLod(state, vec2(f * 0.8 + 0.01, (fj + 0.5) / S.y), 0.0).r;
    float wiggle = (noise(vec2(x * 28.0, fj * 3.1)) - 0.5) * 0.014;
    float y = base + (v * v * 0.38 + wiggle) * env;
    float dy = p.y - y;
    float w = px * (1.3 + 0.025 * fj);
    if (dy < w) {
      float line = smoothstep(w, 0.0, abs(dy));
      float fade = 1.0 - depth / 50.0;
      return mix(pal(0.05 + fj * 0.012), vec3(1.0), 0.65) * line * fade * (1.0 + 1.2 * pulse * step(fj, 2.5));
    }
  }
  return vec3(0.0);
}`,
}

const terrain: NovaDef = {
  id: 'nova-terrain',
  name: 'Sound mountains',
  blurb: 'The song’s last seconds as a neon mountain range: the newest at your feet, the bass in the middle, rolling away',
  suits: ['energetic', 'electronic'],
  bloom: 1,
  exposure: 1.05,
  speed: [0.5, 1],
  state: { code: HISTORY, rate: 14, height: 64, width: 128 },
  image: `
float rowAt(float z) { return z / 0.5 - lag; }
float hgt(vec2 q) {
  float f = clamp(abs(q.x) / 13.0, 0.0, 1.0);
  float row = rowAt(q.y);
  if (row < -0.5 || row > S.y - 1.0) return 0.0;
  float v = textureLod(state, vec2(f * 0.8 + 0.01, (max(row, 0.0) + 0.5) / S.y), 0.0).r;
  return v * v * 4.0 * smoothstep(1.0, 0.45, f) * smoothstep(-0.5, 3.0, row) * smoothstep(S.y - 1.0, S.y - 12.0, row);
}
vec3 image(vec2 p, vec2 uv) {
  vec3 ro = vec3(1.5 * sin(T * 0.07), 5.2 + 0.4 * sin(T * 0.05), -3.5);
  vec3 rd = look(ro, vec3(0.0, 0.0, 11.0), p, 1.5);
  vec3 horizon = pal(0.9) * 0.1;
  vec3 col = mix(horizon, pal(0.66) * 0.006, smoothstep(-0.05, 0.4, rd.y));
  float t = 0.0;
  float last = 0.0;
  bool hit = false;
  for (int i = 0; i < 120; i++) {
    vec3 q = ro + rd * t;
    float d = q.y - hgt(q.xz);
    if (d < 0.003 * t) {
      hit = true;
      break;
    }
    last = max(0.015, d * 0.3);
    t += last;
    if (t > 80.0) break;
  }
  if (!hit) return col;
  float a = t - last;
  float b = t;
  for (int k = 0; k < 6; k++) {
    float m = 0.5 * (a + b);
    vec3 r = ro + rd * m;
    if (r.y - hgt(r.xz) < 0.0) b = m;
    else a = m;
  }
  t = 0.5 * (a + b);
  vec3 q = ro + rd * t;
  vec2 g = vec2(q.x * 2.0, rowAt(q.z));
  vec2 w = fwidth(g);
  vec2 dl = abs(fract(g + 0.5) - 0.5) / max(w, vec2(1e-4));
  float line = (1.0 - min(dl.y * 0.8, 1.0)) + 0.25 * (1.0 - min(dl.x, 1.0));
  float h = hgt(q.xz);
  vec3 c = mix(pal(0.58), pal(0.95), smoothstep(0.0, 3.5, h));
  vec3 land = vec3(0.004, 0.002, 0.012) + c * line * (0.5 + 0.6 * h) + c * 0.05 * h;
  float fresh_ = exp(-max(rowAt(q.z), 0.0) * 0.25);
  land += c * line * fresh_ * (0.6 + 1.5 * pulse);
  return mix(land, horizon, 1.0 - exp(-t * 0.03));
}`,
}

export const WORLDS: NovaDef[] = [rings, bulb, gyroid, city, outrun, pulsar, terrain]
