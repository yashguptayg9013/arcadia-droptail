/* ==========================================================================
   Arcadia Droptail — cinematic tribute
   GSAP + ScrollTrigger drive the scroll choreography, Lenis smooths the
   wheel. The page still reads top to bottom, with working video, film
   player and clock, if the CDN scripts fail or motion is reduced.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const SVGNS = 'http://www.w3.org/2000/svg';

  const root = document.documentElement;
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  if (reduce) root.classList.add('no-motion');
  if (!hasGsap) root.classList.add('no-gsap');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  let lenis = null;

  function svg(tag, attrs = {}, parent) {
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  // Run a frame callback only while an element is on screen
  function whileVisible(el, frame, margin = '120px') {
    let raf = 0;
    let on = false;
    const loop = (t) => { frame(t); raf = requestAnimationFrame(loop); };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !on) { on = true; raf = requestAnimationFrame(loop); }
      else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf); }
    }, { rootMargin: margin }).observe(el);
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' }) : target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
  }

  /* ------------------------------------------------------------------------
     Loader: a twisted 119-line rosette, like the clock's guilloché
     ------------------------------------------------------------------------ */
  function buildRose() {
    const rose = $('[data-rose]');
    if (!rose) return;
    svg('circle', { r: 98 }, rose);
    const step = (Math.PI * 2) / 119;
    for (let i = 0; i < 119; i++) {
      const a = i * step;
      const b = a + step * 9;
      const line = svg('line', {
        x1: (Math.cos(a) * 18).toFixed(2), y1: (Math.sin(a) * 18).toFixed(2),
        x2: (Math.cos(b) * 94).toFixed(2), y2: (Math.sin(b) * 94).toFixed(2),
      }, rose);
      line.style.animationDelay = `${((i / 119) * 1.7).toFixed(3)}s`;
    }
  }

  function runLoader(done) {
    const loader = $('.loader');
    const count = $('[data-count]');
    const heroImg = $('.hero__media img');
    const minTime = reduce ? 200 : 2700;
    const t0 = performance.now();
    let ready = false;

    const imgReady = heroImg.complete ? Promise.resolve() : new Promise((r) => {
      heroImg.addEventListener('load', r, { once: true });
      heroImg.addEventListener('error', r, { once: true });
    });
    Promise.all([imgReady, document.fonts ? document.fonts.ready : null]).then(() => { ready = true; });
    setTimeout(() => { ready = true; }, 8000);

    let shown = 0;
    const tick = (now) => {
      const t = clamp((now - t0) / minTime, 0, 1);
      const target = ready ? t : Math.min(t, 0.86);
      shown += (target - shown) * 0.14;
      count.textContent = String(Math.round(shown * 100)).padStart(3, '0');
      if (ready && t >= 1 && shown > 0.995) {
        count.textContent = '100';
        loader.classList.add('is-done');
        body.classList.remove('is-loading');
        done();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------------
     Blossom petals
     ------------------------------------------------------------------------ */
  const PETAL_COLOURS = ['#f4d4da', '#eec3cb', '#f9e4e7', '#e6b4be', '#fff2f4'];

  function petals(canvas) {
    const ctx = canvas.getContext('2d');
    const n = +canvas.dataset.petals || 30;
    let w = 0, h = 0, dpr = 1, list = [];

    const make = (initial) => {
      const depth = rand(0.35, 1);
      return {
        x: rand(-0.1, 1.05) * w,
        y: initial ? rand(0, h) : rand(-60, -10) * dpr,
        r: (4 + depth * 8) * dpr,
        depth,
        vx: rand(0.15, 0.55) * depth * dpr,
        vy: rand(0.35, 0.85) * depth * dpr,
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.02, 0.02),
        sway: rand(0, Math.PI * 2),
        swaySpeed: rand(0.008, 0.02),
        flip: rand(0, Math.PI * 2),
        flipSpeed: rand(0.015, 0.04),
        colour: PETAL_COLOURS[(Math.random() * PETAL_COLOURS.length) | 0],
        alpha: 0.45 + depth * 0.45,
      };
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.width = canvas.clientWidth * dpr;
      h = canvas.height = canvas.clientHeight * dpr;
      list = Array.from({ length: n }, () => make(true));
    };

    const drawPetal = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.25 + Math.abs(Math.cos(p.flip)) * 0.75);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.colour;
      const r = p.r;
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(r * 0.95, r * 0.55, r * 0.8, -r * 0.7, r * 0.18, -r);
      ctx.lineTo(0, -r * 0.78);
      ctx.lineTo(-r * 0.18, -r);
      ctx.bezierCurveTo(-r * 0.8, -r * 0.7, -r * 0.95, r * 0.55, 0, r);
      ctx.fill();
      ctx.restore();
    };

    const frame = () => {
      const gust = lenis ? clamp(lenis.velocity * 0.05, -3, 3) : 0;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        p.sway += p.swaySpeed;
        p.flip += p.flipSpeed;
        p.rot += p.vr;
        p.x += p.vx + Math.sin(p.sway) * 0.6 * p.depth * dpr;
        p.y += p.vy - gust * p.depth * dpr;
        if (p.y > h + 30 * dpr || p.x > w + 40 * dpr) list[i] = make(false);
        else if (p.y < -80 * dpr) p.y = h + 20 * dpr;
        drawPetal(p);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    if (reduce) { list.forEach(drawPetal); return; }
    whileVisible(canvas, frame);
  }

  /* ------------------------------------------------------------------------
     Paint sample: white with aluminium and glass flakes that catch the light
     ------------------------------------------------------------------------ */
  const GLINTS = ['#ffffff', '#ffffff', '#eaf4ff', '#fff1f6', '#fffbe8', '#effff8'];

  function sparkle() {
    const c = $('[data-sparkle]');
    if (!c) return;
    const ctx = c.getContext('2d');
    const box = c.parentElement;
    let size = 0, dpr = 1, flakes = [];
    const light = { x: -0.35, y: -0.4, tx: -0.35, ty: -0.4, user: false, idle: 0 };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      size = c.clientWidth * dpr;
      c.width = c.height = size;
      const R = size / 2;
      const count = Math.round(clamp(c.clientWidth * 3.2, 700, 2000));
      flakes = Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2;
        const d = Math.sqrt(Math.random()) * R * 0.985;
        const glass = Math.random() < 0.16;
        return {
          x: R + Math.cos(a) * d, y: R + Math.sin(a) * d,
          angle: Math.random() * Math.PI * 2,
          size: (glass ? rand(1.2, 2.2) : rand(0.6, 1.2)) * dpr,
          // Glass particles split the light into faint colour
          tint: glass ? GLINTS[(Math.random() * GLINTS.length) | 0] : '#ffffff',
          glass, seed: Math.random() * 100,
        };
      });
    };

    const move = (e) => {
      const r = c.getBoundingClientRect();
      light.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.6, 1.6);
      light.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1.6, 1.6);
      light.user = true;
      light.idle = 0;
    };
    (finePointer ? box.closest('section') : c).addEventListener('pointermove', move);

    const frame = (t) => {
      const R = size / 2;
      if (!light.user || ++light.idle > 240) {
        light.user = false;
        light.tx = Math.cos(t * 0.00031) * 0.7;
        light.ty = Math.sin(t * 0.00047) * 0.55 - 0.15;
      }
      light.x += (light.tx - light.x) * 0.08;
      light.y += (light.ty - light.y) * 0.08;
      const lx = R + light.x * R * 0.75;
      const ly = R + light.y * R * 0.75;

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(R, R, R, 0, Math.PI * 2);
      ctx.clip();

      // Kept just below pure white so the flakes have something to shine against
      const g = ctx.createRadialGradient(lx, ly, R * 0.02, R, R, R * 1.15);
      g.addColorStop(0, '#f1f1ef');
      g.addColorStop(0.3, '#e6e7e5');
      g.addColorStop(0.72, '#d0d2d1');
      g.addColorStop(1, '#aeb2b3');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);

      const shimmer = t * 0.0015;
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        const dx = lx - f.x, dy = ly - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy) / R;
        const fall = Math.exp(-dist * dist * 1.9);
        if (fall < 0.03) continue;
        const ang = Math.atan2(dy, dx);
        const spec = Math.pow(Math.max(0, Math.cos(ang - f.angle + Math.sin(shimmer + f.seed) * 0.3)), f.glass ? 26 : 10);
        const a = spec * fall;
        if (a < 0.05) continue;
        ctx.globalAlpha = Math.min(1, a * 1.4);
        ctx.fillStyle = f.tint;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        if (f.glass && a > 0.35) {
          const L = f.size * 8 * a;
          ctx.strokeStyle = f.tint;
          ctx.lineWidth = 0.7 * dpr;
          ctx.beginPath();
          ctx.moveTo(f.x - L, f.y); ctx.lineTo(f.x + L, f.y);
          ctx.moveTo(f.x, f.y - L); ctx.lineTo(f.x, f.y + L);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // Soft falloff on the rim so it reads as a curved sample
      const rim = ctx.createRadialGradient(R, R, R * 0.7, R, R, R);
      rim.addColorStop(0, 'rgba(120,124,128,0)');
      rim.addColorStop(1, 'rgba(120,124,128,.22)');
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
    };

    resize();
    window.addEventListener('resize', resize);
    if (reduce) { frame(0); return; }
    whileVisible(c, frame);
  }

  /* ------------------------------------------------------------------------
     The timepiece: a live clock with a 119-facet guilloché dial
     ------------------------------------------------------------------------ */
  function clock() {
    const el = $('[data-clock]');
    if (!el) return;
    const digital = $('[data-clock-digital]');
    const defs = svg('defs', {}, el);

    const grad = (id, stops, attrs = {}, type = 'linearGradient') => {
      const g = svg(type, { id, ...attrs }, defs);
      stops.forEach(([o, c]) => svg('stop', { offset: o, 'stop-color': c }, g));
    };
    grad('bezel', [[0, '#fbfbfb'], [0.32, '#999fa4'], [0.52, '#f1f2f3'], [0.78, '#666c71'], [1, '#e7e8e9']], { x1: 0, y1: 0, x2: 1, y2: 1 });
    grad('dial', [[0, '#f5f5f3'], [0.7, '#d7dadc'], [1, '#b5b9bd']], {}, 'radialGradient');
    grad('handL', [[0, '#ffffff'], [1, '#c8ccd0']], { x1: 0, y1: 0, x2: 0, y2: 1 });
    grad('handD', [[0, '#8d9398'], [1, '#4e5459']], { x1: 0, y1: 0, x2: 0, y2: 1 });

    svg('circle', { r: 198, fill: 'url(#bezel)' }, el);
    svg('circle', { r: 187, fill: '#26282b' }, el);
    svg('circle', { r: 185, fill: 'url(#dial)' }, el);

    // 119 pyramidal facets, each split in two so a moving light can play across them
    const facets = svg('g', {}, el);
    const halves = [];
    const N = 119;
    const pt = (r, a) => `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2;
      const am = (a0 + a1) / 2;
      halves.push({ el: svg('polygon', { points: `${pt(22, am)} ${pt(150, a0)} ${pt(150, am)}` }, facets), normal: am - Math.PI / 2 });
      halves.push({ el: svg('polygon', { points: `${pt(22, am)} ${pt(150, am)} ${pt(150, a1)}` }, facets), normal: am + Math.PI / 2 });
    }
    svg('circle', { r: 22, fill: '#e9ebec', stroke: '#9aa0a5', 'stroke-width': 0.6 }, el);

    // Ceramic minute track, laser-etched back to bright metal
    svg('circle', { r: 166, fill: 'none', stroke: '#1c1e21', 'stroke-width': 20 }, el);
    const ticks = svg('g', { stroke: '#e8ecef', 'stroke-linecap': 'round' }, el);
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const major = i % 5 === 0;
      svg('line', {
        x1: (Math.cos(a) * (major ? 158 : 161)).toFixed(2), y1: (Math.sin(a) * (major ? 158 : 161)).toFixed(2),
        x2: (Math.cos(a) * 173).toFixed(2), y2: (Math.sin(a) * 173).toFixed(2),
        'stroke-width': major ? 1.6 : 0.7,
      }, ticks);
    }

    // Twelve slim chaplets with an infill bridge
    const chaplets = svg('g', {}, el);
    for (let i = 0; i < 12; i++) {
      const g = svg('g', { transform: `rotate(${i * 30})` }, chaplets);
      const twin = i === 0;
      [-1, 1].slice(0, twin ? 2 : 1).forEach((side) => {
        const x = twin ? side * 4.5 : 0;
        svg('rect', { x: x - 2.4, y: -147, width: 4.8, height: 34, rx: 1.2, fill: '#fbfbfb', stroke: '#686d72', 'stroke-width': 0.7 }, g);
        svg('line', { x1: x, y1: -143, x2: x, y2: -117, stroke: '#3b3e42', 'stroke-width': 1 }, g);
      });
    }

    const word = svg('text', { x: 0, y: 66, 'text-anchor': 'middle', fill: '#4a4d52', 'font-size': 9.5, 'letter-spacing': 4.5, 'font-family': 'Cormorant Garamond, serif' }, el);
    word.textContent = 'ARCADIA';
    const sub = svg('text', { x: 0, y: 80, 'text-anchor': 'middle', fill: '#7d8186', 'font-size': 5.5, 'letter-spacing': 3, 'font-family': 'Manrope, sans-serif' }, el);
    sub.textContent = 'DROPTAIL';

    const hand = (len, wid, tail) => {
      const g = svg('g', {}, el);
      svg('polygon', { points: `${-wid},${tail} 0,${-len} 0,${tail}`, fill: 'url(#handL)' }, g);
      svg('polygon', { points: `0,${tail} 0,${-len} ${wid},${tail}`, fill: 'url(#handD)' }, g);
      return g;
    };
    const hourHand = hand(98, 6.5, 20);
    const minHand = hand(146, 4.6, 24);
    const secHand = svg('g', {}, el);
    svg('rect', { x: -0.7, y: -158, width: 1.4, height: 190, fill: '#b9804f' }, secHand);
    svg('circle', { r: 4, cy: 24, fill: '#b9804f' }, secHand);
    svg('circle', { r: 7.5, fill: 'url(#bezel)' }, el);
    svg('circle', { r: 2.4, fill: '#2a2c2f' }, el);

    let lightAngle = -2.2;
    let targetLight = -2.2;
    let lastLight = null;

    const shade = () => {
      if (lastLight !== null && Math.abs(lightAngle - lastLight) < 0.002) return;
      lastLight = lightAngle;
      for (const h of halves) {
        const b = 0.5 + 0.5 * Math.cos(h.normal - lightAngle);
        const v = Math.round(150 + b * 100);
        h.el.setAttribute('fill', `rgb(${v},${v + 1},${v + 3})`);
      }
    };

    const section = el.closest('section');
    if (finePointer) {
      section.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        targetLight = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
      });
    }

    let lastMinute = -1;
    const frame = (t) => {
      const now = new Date();
      const s = now.getSeconds() + now.getMilliseconds() / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;
      hourHand.setAttribute('transform', `rotate(${(h * 30).toFixed(3)})`);
      minHand.setAttribute('transform', `rotate(${(m * 6).toFixed(3)})`);
      secHand.setAttribute('transform', `rotate(${(s * 6).toFixed(3)})`);
      if (now.getMinutes() !== lastMinute) {
        lastMinute = now.getMinutes();
        digital.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      }
      if (!finePointer) targetLight = -2.2 + Math.sin(t * 0.0004) * 1.2;
      let d = targetLight - lightAngle;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      lightAngle += d * 0.08;
      shade();
    };

    frame(0);
    whileVisible(el, frame);
  }

  /* ------------------------------------------------------------------------
     Lazy, on-screen-only video loops
     ------------------------------------------------------------------------ */
  function videos() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target: v, isIntersecting }) => {
        if (isIntersecting) {
          if (!v.getAttribute('src')) v.src = v.dataset.src;
          if (!reduce) v.play().catch(() => {});
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { rootMargin: '250px 0px' });
    $$('video[data-src]').forEach((v) => io.observe(v));
  }

  /* ------------------------------------------------------------------------
     Interior: four frames, driven by scroll (or tapped)
     ------------------------------------------------------------------------ */
  function interior() {
    const section = $('#interior');
    const frames = $$('.interior__frame', section);
    const steps = $$('.istep', section);
    const dots = $$('[data-dot]', section);
    let current = 0;
    let trigger = null;
    let timer = 0;

    const set = (i) => {
      if (i === current) return;
      current = i;
      frames.forEach((f, k) => f.classList.toggle('is-active', k === i));
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    };

    const autoplay = () => {
      clearInterval(timer);
      timer = setInterval(() => set((current + 1) % frames.length), 5200);
    };

    dots.forEach((d, i) => d.addEventListener('click', () => {
      if (trigger) {
        scrollToTarget(trigger.start + ((i + 0.5) / frames.length) * (trigger.end - trigger.start));
      } else {
        set(i);
        autoplay();
      }
    }));

    if (hasGsap && !reduce) {
      trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=280%',
        pin: '.interior__pin',
        anticipatePin: 1,
        onUpdate: (self) => set(Math.min(frames.length - 1, Math.floor(self.progress * frames.length))),
      });
    } else if (!reduce) {
      autoplay();
    }
  }

  /* ------------------------------------------------------------------------
     Film player
     ------------------------------------------------------------------------ */
  function player() {
    const wrap = $('[data-player]');
    const v = $('[data-film]');
    if (!wrap || !v) return;
    const toggleBtn = $('[data-toggle]', wrap);
    const muteBtn = $('[data-mute]', wrap);
    const track = $('[data-seek]', wrap);
    const played = $('[data-played]', wrap);
    const buffer = $('[data-buffer]', wrap);
    const time = $('[data-time]', wrap);
    const chapters = $$('[data-seek-to]');
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    const toggle = () => (v.paused ? v.play() : v.pause());
    $('[data-play]', wrap).addEventListener('click', toggle);
    toggleBtn.addEventListener('click', toggle);
    v.addEventListener('click', toggle);

    v.addEventListener('play', () => { wrap.classList.add('is-playing'); wrap.classList.remove('is-paused-started'); toggleBtn.textContent = 'Pause'; });
    v.addEventListener('pause', () => { wrap.classList.remove('is-playing'); wrap.classList.add('is-paused-started'); toggleBtn.textContent = 'Play'; });
    v.addEventListener('ended', () => { v.currentTime = 0; });

    v.addEventListener('timeupdate', () => {
      const d = v.duration || 121.6;
      const p = v.currentTime / d;
      played.style.width = `${p * 100}%`;
      track.setAttribute('aria-valuenow', Math.round(p * 100));
      time.textContent = `${fmt(v.currentTime)} / ${fmt(d)}`;
      let active = -1;
      chapters.forEach((c, i) => { if (v.currentTime >= +c.dataset.seekTo - 0.2) active = i; });
      chapters.forEach((c, i) => c.classList.toggle('is-active', i === active));
    });
    v.addEventListener('progress', () => {
      if (v.buffered.length && v.duration) buffer.style.width = `${(v.buffered.end(v.buffered.length - 1) / v.duration) * 100}%`;
    });

    const seekAt = (x) => {
      const r = track.getBoundingClientRect();
      if (v.duration) v.currentTime = clamp((x - r.left) / r.width, 0, 1) * v.duration;
    };
    track.addEventListener('pointerdown', (e) => {
      track.setPointerCapture(e.pointerId);
      seekAt(e.clientX);
      const mv = (ev) => seekAt(ev.clientX);
      track.addEventListener('pointermove', mv);
      track.addEventListener('pointerup', () => track.removeEventListener('pointermove', mv), { once: true });
    });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { v.currentTime = Math.min(v.duration || 0, v.currentTime + 5); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { v.currentTime = Math.max(0, v.currentTime - 5); e.preventDefault(); }
    });

    muteBtn.addEventListener('click', () => {
      v.muted = !v.muted;
      muteBtn.textContent = v.muted ? 'Sound off' : 'Sound on';
    });
    $('[data-fs]', wrap).addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (wrap.requestFullscreen) wrap.requestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });

    chapters.forEach((c) => c.addEventListener('click', () => {
      v.currentTime = +c.dataset.seekTo;
      v.play().catch(() => {});
    }));

    new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }, { threshold: 0.15 }).observe(wrap);
  }

  /* ------------------------------------------------------------------------
     Lightbox
     ------------------------------------------------------------------------ */
  function lightbox() {
    const lb = $('[data-lb]');
    const img = $('[data-lb-img]');
    const open = (src, alt) => {
      img.src = src;
      img.alt = alt;
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add('is-open'));
      if (lenis) lenis.stop();
      $('[data-lb-close]').focus();
    };
    const close = () => {
      lb.classList.remove('is-open');
      setTimeout(() => { lb.hidden = true; img.removeAttribute('src'); }, 450);
      if (lenis) lenis.start();
    };
    $$('img[data-lightbox]').forEach((el) => {
      el.addEventListener('click', () => open(el.currentSrc.replace('-m.jpg', '-d.jpg'), el.alt));
    });
    lb.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) close(); });
  }

  /* ------------------------------------------------------------------------
     Cursor ring
     ------------------------------------------------------------------------ */
  function cursor() {
    if (!finePointer) return;
    const c = $('.cursor');
    const label = $('.cursor__label');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; c.classList.add('is-on'); });
    document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor]');
      c.classList.toggle('is-big', !!t);
      if (t) label.textContent = t.dataset.cursor;
    });
    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------------
     Chrome: nav colour, chapter rail, progress bar, hide-on-scroll nav
     ------------------------------------------------------------------------ */
  function chrome() {
    const themed = $$('main > section, .footer');
    const chapters = $$('[data-chapter]');
    const railLinks = $$('[data-rail]');
    const navLinks = $$('.nav__links a');
    const bar = $('.progress i');
    let lastY = 0;

    const update = () => {
      const y = window.scrollY;
      const vh = innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

      let theme = 'light';
      for (const s of themed) {
        const r = s.getBoundingClientRect();
        if (r.top <= 40 && r.bottom > 40) { theme = s.dataset.theme || 'light'; break; }
      }
      body.classList.toggle('on-dark', theme === 'dark');
      body.classList.toggle('at-top', y < vh * 0.6);

      let active = null;
      for (const s of chapters) {
        const r = s.getBoundingClientRect();
        if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) { active = s.id; break; }
      }
      railLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.rail === active));
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${active}`));

      if (y > vh && y > lastY + 4) body.classList.add('nav-hidden');
      else if (y < lastY - 4 || y < vh) body.classList.remove('nav-hidden');
      lastY = y;
    };

    if (lenis) lenis.on('scroll', update);
    else window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      scrollToTarget(target);
    }));
  }

  /* ------------------------------------------------------------------------
     Mobile reel counter (native horizontal scroll)
     ------------------------------------------------------------------------ */
  function reelCounter(progress) {
    const num = $('[data-reel-num]');
    const barEl = $('[data-reel-bar]');
    const n = $$('.slide').length;
    num.textContent = String(clamp(Math.round(progress * (n - 1)) + 1, 1, n)).padStart(2, '0');
    barEl.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
  }

  function nativeReel() {
    const track = $('.reel__track');
    const onScroll = () => reelCounter(track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth));
    track.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------------
     Scroll choreography (GSAP)
     ------------------------------------------------------------------------ */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return words.map((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return s;
    });
  }

  function splitLetters(el) {
    const text = el.textContent;
    el.textContent = '';
    return [...text].map((ch) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      el.appendChild(s);
      return s;
    });
  }

  // Split and hide the title before the loader lifts, so nothing flashes
  let letters = [];
  function heroPrepare() {
    if (!hasGsap || reduce) return;
    letters = splitLetters($('.hero__letters'));
    gsap.set(letters, { yPercent: 55, opacity: 0, filter: 'blur(14px)' });
    gsap.set('[data-hero-in]', { y: 18, opacity: 0 });
  }

  function heroIntro() {
    if (!hasGsap || reduce) return;
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .fromTo('.hero__media img', { scale: 1.14 }, { scale: 1.02, duration: 4.2, ease: 'power2.out' }, 0)
      .fromTo(letters, { yPercent: 55, opacity: 0, filter: 'blur(14px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 2.2, stagger: 0.07 }, 0.15)
      .fromTo('[data-hero-in]', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1.6, stagger: 0.14 }, 0.9);
  }

  function choreography() {
    if (!hasGsap || reduce) { nativeReel(); return; }
    gsap.registerPlugin(ScrollTrigger);

    // Hero: the scene sinks away while the title lifts
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero__media', { yPercent: 18, ease: 'none' }, 0)
      .to('.hero__inner', { yPercent: -60, opacity: 0, ease: 'none' }, 0)
      .to('.hero__foot', { opacity: 0, ease: 'none', duration: 0.4 }, 0);

    // Reveals
    gsap.set('[data-reveal]', { opacity: 0, y: 26 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', stagger: 0.09, overwrite: true }),
    });

    // I. Prologue: words light up as you read
    const words = splitWords($('[data-scrub-words]'));
    ScrollTrigger.create({
      trigger: '[data-scrub-words]',
      start: 'top 78%',
      end: 'bottom 45%',
      scrub: true,
      onUpdate: (self) => {
        const lit = self.progress * (words.length + 4);
        words.forEach((w, i) => { w.style.opacity = clamp(0.14 + (lit - i) * 0.3, 0.14, 1); });
      },
    });

    // II. Sketch → coachwork: an iris opens from the drawing onto the real car
    const sketch = $('#sketch');
    gsap.from('.sketch__copy > *', {
      opacity: 0, y: 30, duration: 1.3, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: sketch, start: 'top 55%' },
    });
    gsap.timeline({
      scrollTrigger: {
        trigger: sketch, start: 'top top', end: '+=170%', pin: '.sketch__pin', scrub: 1, anticipatePin: 1,
        onUpdate: (self) => { sketch.dataset.theme = self.progress > 0.6 ? 'light' : 'dark'; },
      },
    })
      .to('.sketch__layer--draw img', { scale: 1.14, ease: 'none', duration: 1 }, 0)
      .to('.sketch__copy', { opacity: 0, y: -40, duration: 0.25 }, 0.28)
      .fromTo('[data-iris]', { clipPath: 'circle(0% at 62% 58%)' }, { clipPath: 'circle(100% at 62% 58%)', ease: 'power2.inOut', duration: 0.62 }, 0.3)
      .fromTo('[data-iris] img', { scale: 1.22 }, { scale: 1, ease: 'none', duration: 0.7 }, 0.3)
      .to('[data-tag-a]', { opacity: 0, duration: 0.1 }, 0.5)
      .to('[data-tag-b]', { opacity: 1, duration: 0.1 }, 0.6);

    // III. Form reel: horizontal on desktop, native swipe on phones
    const mm = gsap.matchMedia();
    mm.add('(min-width: 761px)', () => {
      const track = $('.reel__track');
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.reel__pin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1,
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => reelCounter(self.progress),
        },
      });
      $$('.slide__img > *', track).forEach((m) => {
        gsap.fromTo(m, { xPercent: -5, scale: 1.12 }, {
          xPercent: 5, scale: 1.12, ease: 'none',
          scrollTrigger: { trigger: m.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
      });

      // Drag to scrub through the reel
      let startX = 0, startY = 0, dragging = false;
      const down = (e) => {
        if (e.button !== 0) return;
        dragging = true; startX = e.clientX; startY = window.scrollY;
        track.setPointerCapture(e.pointerId);
      };
      const move = (e) => {
        if (!dragging) return;
        const y = startY - (e.clientX - startX) * 1.2;
        if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      };
      const up = () => { dragging = false; };
      track.addEventListener('pointerdown', down);
      track.addEventListener('pointermove', move);
      track.addEventListener('pointerup', up);
      track.addEventListener('pointercancel', up);
      return () => {
        track.removeEventListener('pointerdown', down);
        track.removeEventListener('pointermove', move);
        track.removeEventListener('pointerup', up);
        track.removeEventListener('pointercancel', up);
      };
    });
    mm.add('(max-width: 760px)', () => { nativeReel(); });

    // Interlude: the letterbox opens out to full frame
    const frame = $('[data-letterbox]');
    gsap.timeline({ scrollTrigger: { trigger: '.interlude', start: 'top top', end: '+=150%', pin: '.interlude__pin', scrub: 1, anticipatePin: 1 } })
      .fromTo(frame, { clipPath: getComputedStyle(frame).clipPath }, { clipPath: 'inset(0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
      .fromTo(frame.querySelector('video'), { scale: 1.25 }, { scale: 1, ease: 'none', duration: 1 }, 0)
      .fromTo('.interlude__line span', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.35 }, 0.5)
      .fromTo('.interlude__line em', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.35 }, 0.62)
      .to({}, { duration: 0.25 });

    // V. Wood: drifting grain, counting numbers, the 55° ray
    gsap.fromTo('.wood__bg', { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.wood', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('[data-countup]').forEach((el) => {
      const end = +el.dataset.countup;
      const comma = el.dataset.format === 'comma';
      const o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, {
        v: end, duration: end > 100 ? 2.4 : 1.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { const v = Math.round(o.v); el.textContent = comma ? v.toLocaleString('en-GB') : v; },
      });
    });
    const ray = $('[data-ray]');
    const arc = $('[data-arc]');
    [ray, arc].forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.timeline({ scrollTrigger: { trigger: '.deck__img', start: 'top 70%' } })
      .to(ray, { strokeDashoffset: 0, duration: 1.4, ease: 'power3.inOut' })
      .to(arc, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out' }, 0.7);
    gsap.fromTo('.deck__img img', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.deck__img', start: 'top bottom', end: 'bottom top', scrub: true } });

    // VII. Timepiece: the dial turns in, the photo settles
    gsap.from('[data-clock]', { rotate: -40, scale: 0.86, opacity: 0, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: '.timepiece__dial', start: 'top 75%' } });
    gsap.fromTo('.tp-photo img', { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.tp-photo', start: 'top bottom', end: 'bottom top', scrub: true } });

    // VIII. Craft: columns drift at different speeds
    $$('.craft__col').forEach((col) => {
      const s = +col.dataset.speed || 0;
      gsap.fromTo(col, { y: s * -14 }, { y: s * 14, ease: 'none', scrollTrigger: { trigger: '.craft__cols', start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // IX / finale: gentle settle on large images
    gsap.fromTo('.spec__img img', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.spec__img', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.finale__media img', { scale: 1.15, yPercent: -6 }, { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  buildRose();
  heroPrepare();

  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    lenis.stop();
  }

  choreography();
  chrome();
  interior();
  videos();
  player();
  lightbox();
  cursor();
  clock();
  sparkle();
  $$('[data-petals]').forEach(petals);

  runLoader(() => {
    if (lenis) lenis.start();
    heroIntro();
    if (hasGsap) ScrollTrigger.refresh();
  });
})();
