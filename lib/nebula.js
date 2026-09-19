/*
 * nebula.js — a nebula you fly through.
 *
 * The idea: nothing here is a backdrop. Four tall gas strips are generated once
 * from domain-warped fractal noise, then scrolled past the viewport at four
 * different rates. Scrolling the page moves you forward through the field, so
 * new structure keeps arriving.
 *
 * Draw order each frame, back to front:
 *   deep stars -> hot gas (additive) -> dark dust (opaque) -> near stars
 * The dust pass is the important one. Real nebulae look like nebulae because
 * cold opaque material sits in front of the glow and silhouettes against it.
 *
 * Generation is chunked across frames with a time budget, so the page never
 * locks up while the field is being built. Each layer fades in as it lands.
 */

/* ------------------------------------------------------------------ noise */

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePerlin(rand) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

  function grad(h, x, y) {
    switch (h & 7) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      case 3: return -x - y;
      case 4: return x;
      case 5: return -x;
      case 6: return y;
      default: return -y;
    }
  }

  return function noise2(x, y) {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const X = fx & 255;
    const Y = fy & 255;
    const xf = x - fx;
    const yf = y - fy;
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[X] + Y];
    const ba = perm[perm[X + 1] + Y];
    const ab = perm[perm[X] + Y + 1];
    const bb = perm[perm[X + 1] + Y + 1];
    const g00 = grad(aa, xf, yf);
    const g10 = grad(ba, xf - 1, yf);
    const g01 = grad(ab, xf, yf - 1);
    const g11 = grad(bb, xf - 1, yf - 1);
    const x1 = g00 + u * (g10 - g00);
    const x2 = g01 + u * (g11 - g01);
    return x1 + v * (x2 - x1);
  };
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(a, b, t) {
  const x = clamp01((t - a) / (b - a || 1e-6));
  return x * x * (3 - 2 * x);
}

function fbm(noise, x, y, octaves) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(fx, fy);
    norm += amp;
    fx *= 2.13;
    fy *= 2.13;
    amp *= 0.5;
  }
  return sum / norm;
}

function ridged(noise, x, y, octaves) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise(fx, fy));
    sum += amp * n * n;
    norm += amp;
    fx *= 2.28;
    fy *= 2.28;
    amp *= 0.52;
  }
  return sum / norm;
}

function rampColor(stops, t) {
  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
  const [p0, c0] = stops[i];
  const [p1, c1] = stops[i + 1];
  const k = clamp01((t - p0) / (p1 - p0 || 1e-6));
  return [
    c0[0] + (c1[0] - c0[0]) * k,
    c0[1] + (c1[1] - c0[1]) * k,
    c0[2] + (c1[2] - c0[2]) * k,
  ];
}

/* ------------------------------------------------------------ gas recipes */

/**
 * Four strips, ordered far to near. `rate` is how fast each one travels when
 * you scroll — the spread between those numbers is what produces depth.
 * `mode: 'dust'` paints the layer opaquely over the glow instead of adding
 * to it, which is what creates silhouettes.
 */
const LAYERS = [
  {
    name: 'haze',
    scale: 1.25,
    octaves: 3,
    warp: 0.8,
    kind: 'fbm',
    lo: 0.26,
    hi: 0.95,
    curve: 1.2,
    alpha: 0.95,
    knot: 0.5,
    rate: 0.06,
    spread: 1.18,
    blur: 30,
    mode: 'add',
    ramp: [
      [0.0, [5, 7, 26]],
      [0.42, [30, 20, 64]],
      [0.74, [62, 34, 96]],
      [1.0, [104, 66, 146]],
    ],
  },
  {
    name: 'core',
    scale: 2.0,
    octaves: 4,
    warp: 1.5,
    kind: 'fbm',
    lo: 0.34,
    hi: 0.92,
    curve: 1.35,
    alpha: 0.88,
    knot: 0.9,
    rate: 0.14,
    spread: 1.3,
    blur: 34,
    mode: 'add',
    ramp: [
      [0.0, [26, 7, 20]],
      [0.38, [104, 28, 54]],
      [0.7, [172, 62, 60]],
      [1.0, [240, 158, 124]],
    ],
  },
  {
    name: 'ions',
    scale: 2.9,
    octaves: 4,
    warp: 1.2,
    kind: 'ridged',
    lo: 0.6,
    hi: 0.985,
    curve: 1.9,
    alpha: 0.58,
    knot: 0.8,
    rate: 0.24,
    spread: 1.42,
    blur: 20,
    mode: 'add',
    ramp: [
      [0.0, [4, 16, 26]],
      [0.5, [24, 90, 112]],
      [0.8, [78, 166, 180]],
      [1.0, [186, 238, 246]],
    ],
  },
  {
    // the cold foreground: opaque, nearly black, faintly warm at its edges
    name: 'dust',
    scale: 1.7,
    octaves: 4,
    warp: 1.9,
    kind: 'fbm',
    lo: 0.49,
    hi: 0.86,
    curve: 0.95,
    alpha: 0.94,
    knot: 0.85,
    rate: 0.42,
    spread: 1.6,
    blur: 16,
    mode: 'dust',
    ramp: [
      [0.0, [12, 7, 16]],
      [0.5, [7, 4, 11]],
      [0.85, [4, 3, 8]],
      [1.0, [3, 2, 7]],
    ],
  },
];

/* -------------------------------------------------- chunked strip builder */

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Returns { canvas, step(budgetMs) } — call step until it reports done.
 * Rows are filled in order, so a partial strip is still coherent.
 */
function stripBuilder(spec, w, h, seed) {
  const cvs = makeCanvas(w, h);
  const ctx = cvs.getContext('2d');
  const img = ctx.createImageData(w, h);
  const data = img.data;

  const noise = makePerlin(mulberry32(seed));
  const dustN = makePerlin(mulberry32(seed ^ 0x9e3779b9));
  const aspect = w / h;
  let y = 0;

  function row(yy) {
    const v = yy / h;

    // fade the two ends of the strip so tiled copies overlap invisibly
    const seam = smoothstep(0, 0.14, v) * (1 - smoothstep(0.86, 1, v));

    // low-frequency modulation along the strip: dense knots, then open void.
    // This is what gives the journey somewhere to go.
    const knotRaw = fbm(noise, 3.1, v * 2.6 + 40.5, 3) * 0.5 + 0.5;
    const knot = 1 - spec.knot * smoothstep(0.62, 0.18, knotRaw);

    for (let x = 0; x < w; x++) {
      const u = x / w;
      const nx = u * spec.scale;
      const ny = (v * spec.scale) / aspect;

      // domain warp — turns round blobs into sheets and filaments
      const qx = fbm(noise, nx, ny, 2);
      const qy = fbm(noise, nx + 5.2, ny + 1.3, 2);
      const wx = nx + spec.warp * qx;
      const wy = ny + spec.warp * qy;

      let d =
        spec.kind === 'ridged'
          ? ridged(noise, wx, wy, spec.octaves)
          : fbm(noise, wx, wy, spec.octaves) * 0.5 + 0.5;

      d = smoothstep(spec.lo, spec.hi, d);
      d = Math.pow(d, spec.curve);
      d *= seam * knot;

      // soften the sides so the strip has no hard edges
      d *= smoothstep(0, 0.16, u) * (1 - smoothstep(0.84, 1, u));

      if (spec.mode !== 'dust') {
        // dark lanes cut through the glowing layers
        const dl =
          fbm(dustN, u * 2.4 + 11.7, (v * 2.4) / aspect + 3.4, 3) * 0.5 + 0.5;
        d *= 1 - 0.8 * smoothstep(0.5, 0.78, dl);
      }

      const i = (yy * w + x) << 2;
      if (d <= 0.003) {
        data[i + 3] = 0;
        continue;
      }
      const c = rampColor(spec.ramp, clamp01(d));
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = clamp01(d * spec.alpha) * 255;
    }
  }

  return {
    canvas: cvs,
    step(budget) {
      const until = performance.now() + budget;
      while (y < h) {
        row(y++);
        if ((y & 7) === 0 && performance.now() > until) break;
      }
      if (y >= h) {
        ctx.putImageData(img, 0, 0);
        return true;
      }
      return false;
    },
  };
}

/* ----------------------------------------------------------- star sprites */

const STAR_TINTS = [
  [240, 244, 255],
  [196, 214, 255],
  [255, 234, 208],
  [255, 198, 202],
  [186, 238, 246],
];

/** A soft point of light. Drawn additively, so there is no visible disc edge. */
function pointSprite(tint) {
  const S = 48;
  const c = makeCanvas(S, S);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  const [r, gg, b] = tint;
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.15, `rgba(${r},${gg},${b},0.92)`);
  grad.addColorStop(0.34, `rgba(${r},${gg},${b},0.24)`);
  grad.addColorStop(0.66, `rgba(${r},${gg},${b},0.045)`);
  grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return c;
}

/** The bright ones get diffraction spikes, the way a telescope renders them. */
function spikeSprite(tint) {
  const S = 128;
  const c = makeCanvas(S, S);
  const g = c.getContext('2d');
  const [r, gg, b] = tint;
  const mid = S / 2;

  g.translate(mid, mid);
  for (let k = 0; k < 4; k++) {
    const len = k % 2 === 0 ? mid * 0.95 : mid * 0.6;
    const grad = g.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, `rgba(${r},${gg},${b},0.8)`);
    grad.addColorStop(0.16, `rgba(${r},${gg},${b},0.2)`);
    grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, -1.1);
    g.lineTo(len, -0.1);
    g.lineTo(len, 0.1);
    g.lineTo(0, 1.1);
    g.closePath();
    g.fill();
    g.rotate(Math.PI / 2);
  }

  const core = g.createRadialGradient(0, 0, 0, 0, 0, S * 0.14);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.28, `rgba(${r},${gg},${b},0.65)`);
  core.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = core;
  g.beginPath();
  g.arc(0, 0, S * 0.14, 0, Math.PI * 2);
  g.fill();

  return c;
}

/* ------------------------------------------------------------------- main */

export function createNebula(canvas, options = {}) {
  const opts = {
    seed: (Math.random() * 1e9) | 0,
    repelRadius: 80,
    torch: true,
    ...options,
  };

  const ctx = canvas.getContext('2d', { alpha: false });
  const reduced =
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0;
  let H = 0;
  let dpr = 1;
  let small = false;
  let layers = [];
  let queue = [];
  let deepStars = [];
  let nearStars = [];
  let sprites = [];
  let spikes = [];
  let raf = 0;
  let running = true;
  let scroll = 0;

  const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

  function makeStars(count, rand, near) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const depth = rand();
      const bright = near && rand() < 0.05;
      out.push({
        hx: rand(),
        hy: rand(),
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        prevHy: null,
        tint: (rand() * STAR_TINTS.length) | 0,
        size: bright
          ? 26 + rand() * 26
          : (near ? 3.4 : 2.2) + depth * depth * (near ? 7 : 3.2),
        alpha: (near ? 0.5 : 0.26) + depth * (near ? 0.48 : 0.34),
        bright,
        rate: near ? 0.34 + depth * 0.55 : 0.03 + depth * 0.1,
        drift: near ? 5 + depth * 22 : 1 + depth * 5,
        phase: rand() * Math.PI * 2,
        twinkle: 0.35 + rand() * 1.5,
      });
    }
    return out;
  }

  function buildField() {
    const tw = small ? 240 : 340;
    const th = Math.round(tw * 2.35);
    layers = [];
    queue = LAYERS.map((spec, i) => {
      const builder = stripBuilder(spec, tw, th, opts.seed + i * 7919);
      const layer = {
        spec,
        canvas: builder.canvas,
        aspect: th / tw,
        fade: 0,
        ready: false,
        sway: 0.4 + i * 0.27,
        blur: small ? Math.round(spec.blur * 0.6) : spec.blur,
      };
      layers.push(layer);
      return { builder, layer };
    });
  }

  function pumpQueue() {
    if (!queue.length) return;
    const job = queue[0];
    if (job.builder.step(9)) {
      job.layer.ready = true;
      queue.shift();
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    small = W < 760;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rand = mulberry32(opts.seed ^ 0x2545f491);
    const area = W * H;
    deepStars = makeStars(Math.min(Math.round(area * 0.00026), 620), rand, false);
    nearStars = makeStars(Math.min(Math.round(area * 0.00012), 260), rand, true);
    for (const s of deepStars) {
      s.x = s.hx * W;
      s.y = s.hy * H;
    }
    for (const s of nearStars) {
      s.x = s.hx * W;
      s.y = s.hy * H;
    }

    sprites = STAR_TINTS.map(pointSprite);
    spikes = STAR_TINTS.map(spikeSprite);
    buildField();
  }

  function drawLayer(L, t) {
    if (!L.ready && L.fade <= 0) return;
    if (L.ready) L.fade = Math.min(1, L.fade + 0.018);
    if (L.fade <= 0) return;

    const dw = W * L.spec.spread;
    const dh = dw * L.aspect;
    const period = dh * 0.82; // the faded strip ends overlap here

    const sway = reduced ? 0 : Math.sin(t * 0.045 * L.sway) * (small ? 8 : 20);
    const px = (pointer.active ? pointer.x / W - 0.5 : 0) * (10 + L.spec.rate * 70);
    const x = (W - dw) / 2 + sway + px;

    const travel = scroll * L.spec.rate + (reduced ? 0 : t * (3 + L.spec.rate * 12));
    let y = -(travel % period);
    if (y > 0) y -= period;

    ctx.save();
    ctx.globalAlpha = L.fade;
    ctx.globalCompositeOperation = L.spec.mode === 'dust' ? 'source-over' : 'lighter';
    if (ctx.filter !== undefined) ctx.filter = `blur(${L.blur}px)`;
    for (let yy = y - period; yy < H + period; yy += period) {
      ctx.drawImage(L.canvas, x, yy, dw, dh);
    }
    ctx.restore();
  }

  function drawStars(list, t) {
    const span = H + 240;
    const R = opts.repelRadius;
    const R2 = R * R;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const s of list) {
      const par = pointer.active ? pointer.x / W - 0.5 : 0;
      const parY = pointer.active ? pointer.y / H - 0.5 : 0;
      const hx = s.hx * W + par * s.drift;

      let hy = (s.hy * H - scroll * s.rate) % span;
      if (hy < -120) hy += span;
      hy += parY * s.drift;

      if (s.prevHy !== null && Math.abs(hy - s.prevHy) > H * 0.5) {
        s.y += hy - s.prevHy;
      }
      s.prevHy = hy;

      if (pointer.active && s.rate > 0.3) {
        const dx = s.x - pointer.x;
        const dy = s.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const push = (1 - d / R) * 1.4;
          s.vx += (dx / d) * push;
          s.vy += (dy / d) * push;
        }
      }

      s.vx += (hx - s.x) * 0.045;
      s.vy += (hy - s.y) * 0.045;
      s.vx *= 0.85;
      s.vy *= 0.85;
      s.x += s.vx;
      s.y += s.vy;

      if (s.y < -140 || s.y > H + 140) continue;

      const tw = reduced ? 1 : 0.7 + 0.3 * Math.sin(t * s.twinkle + s.phase);
      ctx.globalAlpha = clamp01(s.alpha * tw);
      const sprite = s.bright ? spikes[s.tint] : sprites[s.tint];
      ctx.drawImage(sprite, s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    }

    ctx.restore();
  }

  function drawTorch() {
    if (!opts.torch || !pointer.active) return;
    const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 260);
    g.addColorStop(0, 'rgba(146,118,190,0.09)');
    g.addColorStop(0.5, 'rgba(108,88,158,0.035)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.2, W * 0.5, H * 0.45, H * 1.2);
    g.addColorStop(0, 'rgba(3,3,10,0)');
    g.addColorStop(1, 'rgba(3,3,10,0.8)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  let start = 0;
  function frame(now) {
    if (!running) return;
    if (!start) start = now;
    const t = (now - start) / 1000;

    pumpQueue();

    ctx.fillStyle = '#03030a';
    ctx.fillRect(0, 0, W, H);

    drawStars(deepStars, t);
    for (const L of layers) if (L.spec.mode !== 'dust') drawLayer(L, t);
    for (const L of layers) if (L.spec.mode === 'dust') drawLayer(L, t);
    drawStars(nearStars, t);

    drawTorch();
    drawVignette();

    pointer.x += (pointer.tx - pointer.x) * 0.18;
    pointer.y += (pointer.ty - pointer.y) * 0.18;

    raf = requestAnimationFrame(frame);
  }

  function onScroll() {
    scroll = window.scrollY || window.pageYOffset || 0;
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.tx = e.clientX - rect.left;
    pointer.ty = e.clientY - rect.top;
    if (!pointer.active) {
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
      pointer.active = true;
    }
  }

  function onPointerLeave() {
    pointer.active = false;
    pointer.tx = pointer.x = -9999;
    pointer.ty = pointer.y = -9999;
  }

  let resizeTimer = 0;
  let lastW = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // mobile browsers fire resize when the URL bar hides; only a real width
      // change is worth regenerating the whole field for
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      resize();
    }, 200);
  }

  lastW = window.innerWidth;
  onScroll();
  resize();
  raf = requestAnimationFrame(frame);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave);

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    },
  };
}
