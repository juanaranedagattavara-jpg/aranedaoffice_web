/* water-v5.js — Realistic water-ripple engine (Araneda Office v5)
   Just a height-field water sim. No SVG-ring overlay.
   Specular crests + slight refractive-style brightness on a near-black base.
   Fewer, bigger, slower ripples.
   API: window.WaterFX = { drop(x, y, strength), config }
*/
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var sim = document.createElement('canvas');
  sim.id = 'water-sim';
  document.body.prepend(sim);

  var sctx = sim.getContext('2d');

  var CFG = {
    scale: window.innerWidth < 768 ? 5 : 3,
    damp: 0.988,
    intensity: 0.4,
    tint: { r: 255, g: 255, b: 255 },
  };

  var W = 0, H = 0, cur, prev, img;
  var raf = null, lastT = 0;
  var lastDropTime = 0;

  function resize() {
    CFG.scale = window.innerWidth < 768 ? 5 : 3;
    W = Math.max(40, Math.ceil(window.innerWidth / CFG.scale));
    H = Math.max(40, Math.ceil(window.innerHeight / CFG.scale));
    sim.width = W; sim.height = H;
    cur = new Float32Array(W * H);
    prev = new Float32Array(W * H);
    img = sctx.createImageData(W, H);
    renderWater();
  }

  function disturb(cx, cy, radius, strength) {
    var x0 = Math.round(cx / CFG.scale), y0 = Math.round(cy / CFG.scale);
    var r = Math.max(2, Math.round(radius / CFG.scale));
    for (var y = -r; y <= r; y++) {
      for (var x = -r; x <= r; x++) {
        var d2 = x * x + y * y;
        if (d2 > r * r) continue;
        var px = x0 + x, py = y0 + y;
        if (px < 1 || px >= W - 1 || py < 1 || py >= H - 1) continue;
        /* smooth cosine falloff for a clean, round impact */
        var dist = Math.sqrt(d2) / r;
        var fall = 0.5 + 0.5 * Math.cos(dist * Math.PI);
        prev[py * W + px] -= strength * fall;
      }
    }
  }

  function step() {
    for (var y = 1; y < H - 1; y++) {
      var i = y * W + 1;
      for (var x = 1; x < W - 1; x++, i++) {
        cur[i] = ((prev[i - 1] + prev[i + 1] + prev[i - W] + prev[i + W]) * 0.5 - cur[i]) * CFG.damp;
      }
    }
    /* Absorbing boundary — fade edges aggressively so waves don't bounce back */
    var edgeW = Math.max(8, Math.floor(W * 0.06));
    var edgeH = Math.max(8, Math.floor(H * 0.06));
    for (var yy = 0; yy < H; yy++) {
      for (var xx = 0; xx < edgeW; xx++) {
        var att = xx / edgeW;
        cur[yy * W + xx] *= 0.6 + 0.4 * att;
        cur[yy * W + (W - 1 - xx)] *= 0.6 + 0.4 * att;
      }
    }
    for (var yy2 = 0; yy2 < edgeH; yy2++) {
      var att2 = yy2 / edgeH;
      for (var xx2 = 0; xx2 < W; xx2++) {
        cur[yy2 * W + xx2] *= 0.6 + 0.4 * att2;
        cur[(H - 1 - yy2) * W + xx2] *= 0.6 + 0.4 * att2;
      }
    }
    var t = prev; prev = cur; cur = t;
  }

  function renderWater() {
    var d = img.data;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = y * W + x;
        var lx = 0, ly = 0;
        if (x > 0 && x < W - 1) lx = prev[i - 1] - prev[i + 1];
        if (y > 0 && y < H - 1) ly = prev[i - W] - prev[i + W];
        /* Smooth specular — wide threshold range → pulcra wavefront, no aliasing */
        var spec = ly * 0.65 + lx * 0.35;
        var crest = 0;
        if (spec > 0.4) {
          /* Smooth quadratic ramp → no hard edges */
          var t = (spec - 0.4) * 0.18;
          if (t > 1) t = 1;
          crest = t * t * (3 - 2 * t) * 90;
        }
        var v = crest;
        var o = i * 4;
        d[o] = 4 + v * 0.85;
        d[o + 1] = 10 + v * 0.92;
        d[o + 2] = 24 + v;
        d[o + 3] = 255;
      }
    }
    sctx.putImageData(img, 0, 0);
  }

  function drop(x, y, strength) {
    if (reduced || !cur) return;
    if (strength === undefined) strength = 1;
    var now = Date.now();
    if (now - lastDropTime < 4500) return;
    lastDropTime = now;
    /* Gentle, well-shaped impulse — smaller amplitude, smoother falloff */
    disturb(x, y, 22 + strength * 16, 18 + strength * 14);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - lastT < 1000 / 60) return;
    lastT = now;
    step();
    renderWater();
  }

  /* ── Scroll-only interactions ── */
  if (!reduced) {
    var lastScroll = 0, lastScrollY = window.scrollY;
    window.addEventListener('scroll', function () {
      var now = Date.now();
      var dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      /* Throttle scroll-triggered drops aggressively */
      if (now - lastScroll < 3000 || dy < 60) return;
      lastScroll = now;
      drop(
        180 + Math.random() * (window.innerWidth - 360),
        180 + Math.random() * (window.innerHeight - 360),
        Math.min(1, 0.6 + dy * 0.0015)
      );
    }, { passive: true });

    /* Click also creates a single big drop */
    window.addEventListener('pointerdown', function (e) {
      drop(e.clientX, e.clientY, 0.8);
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      } else if (!raf) {
        lastT = 0;
        raf = requestAnimationFrame(frame);
      }
    });
  }

  var rsTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(rsTimer);
    rsTimer = setTimeout(resize, 180);
  });

  resize();
  if (!reduced) raf = requestAnimationFrame(frame);

  window.WaterFX = { drop: drop, config: CFG };
})();
