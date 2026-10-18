// Pascal's Triangle on a Circle
// The row of pegs wraps around: N positions sit on a ring. At every step a ball
// moves one position clockwise or anticlockwise (or, in "lazy" mode, may stay put).
// Each step is drawn as a ring further out, so time runs from the centre outward.

(function () {
  const canvas = document.getElementById('pc-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const el = (id) => document.getElementById(id);

  const ui = {
    n: el('pc-n'), nOut: el('pc-n-out'),
    steps: el('pc-steps'), stepsOut: el('pc-steps-out'),
    speed: el('pc-speed'),
    lazy: el('pc-lazy'),
    numbers: el('pc-numbers'),
    expected: el('pc-expected'),
    drop1: el('pc-drop1'), drop50: el('pc-drop50'),
    auto: el('pc-auto'), reset: el('pc-reset'),
    count: el('pc-count'), caption: el('pc-caption')
  };

  const C = {
    peg: 'rgba(232, 228, 218, 0.8)',
    pegOff: 'rgba(232, 228, 218, 0.14)',
    pegHit: '#e2c891',
    number: 'rgba(201, 169, 110, 0.95)',
    ball: '#c9a96e',
    ballLight: '#f6e7c1',
    bar: 'rgba(201, 169, 110, 0.28)',
    barEdge: 'rgba(201, 169, 110, 0.85)',
    expected: 'rgba(232, 228, 218, 0.75)',
    ring: 'rgba(201, 169, 110, 0.12)',
    text: 'rgba(232, 228, 218, 0.7)'
  };

  let W = 0, H = 0;
  let board = null;
  let balls = [];
  let counts = [];
  let total = 0;
  let auto = false;
  let queue = 0;
  let spawnTimer = 0;
  let last = performance.now();

  const mod = (a, n) => ((a % n) + n) % n;

  function moves(lazy) { return lazy ? [-1, 0, 1] : [-1, 1]; }

  function caption(N, T, lazy) {
    if (lazy) {
      return 'Lazy steps: a ball may also stay where it is. That one extra choice ' +
             'breaks the alternating pattern, and every position fills in evenly.';
    }
    if (N % 2 === 0) {
      return 'An even circle: after an even number of steps a ball can only be on an even position, ' +
             'after an odd number only on an odd one. Half the circle is always empty, ' +
             'however long you wait.';
    }
    return 'An odd circle: the bell curve spreads around the ring, meets itself on the far side, ' +
           'and slowly evens out until every position is equally likely.';
  }

  // ---------- Board ----------

  function build() {
    const N = +ui.n.value;
    const T = +ui.steps.value;
    const lazy = ui.lazy.checked;
    ui.nOut.textContent = N;
    ui.stepsOut.textContent = T;

    const cx = W / 2;
    const cy = H / 2;
    const outer = Math.min(W, H) / 2 - 28;
    const barLen = outer * 0.2;
    const rMax = outer - barLen - 14;     // last ring
    const r0 = rMax * 0.12;               // ring for step 0
    const dr = T > 0 ? (rMax - r0) / T : 0;
    const angle = (j) => -Math.PI / 2 + (2 * Math.PI * j) / N;

    // Path counts: routes from the start (position 0 at step 0) to each peg
    const paths = [new Array(N).fill(0)];
    paths[0][0] = 1;
    for (let t = 0; t < T; t++) {
      const next = new Array(N).fill(0);
      for (let j = 0; j < N; j++) {
        if (!paths[t][j]) continue;
        for (const m of moves(lazy)) next[mod(j + m, N)] += paths[t][j];
      }
      paths.push(next);
    }

    // Expected share of balls at each position after the last step
    const lastRow = paths[T];
    const sum = lastRow.reduce((a, b) => a + b, 0);
    const expected = lastRow.map((v) => v / sum);

    const rings = [];
    for (let t = 0; t <= T; t++) {
      const r = r0 + t * dr;
      rings.push({
        r,
        pegs: Array.from({ length: N }, (_, j) => ({
          x: cx + r * Math.cos(angle(j)),
          y: cy + r * Math.sin(angle(j)),
          on: paths[t][j] > 0,
          flash: 0,
          visits: 0
        }))
      });
    }

    const spacing = Math.min(dr || rMax, (2 * Math.PI * (r0 + dr)) / N);
    const pegR = Math.max(1.8, Math.min(spacing * 0.08, 4.5));
    const ballR = Math.max(3, Math.min(spacing * 0.16, 8));

    board = { N, T, lazy, cx, cy, r0, dr, rMax, outer, barLen, angle,
              paths, expected, rings, pegR, ballR };
    ui.caption.textContent = caption(N, T, lazy);
  }

  function resetAll() {
    balls = [];
    queue = 0;
    total = 0;
    build();
    counts = new Array(board.N).fill(0);
    ui.count.textContent = '0';
  }

  // ---------- Balls ----------

  // A point in polar form, so balls travel along arcs between rings
  function spawn() {
    const b = board;
    const route = [{ t: 0, j: 0, a: b.angle(0), r: b.r0 }];
    let j = 0, a = b.angle(0);
    const opts = moves(b.lazy);
    for (let t = 0; t < b.T; t++) {
      const m = opts[Math.floor(Math.random() * opts.length)];
      j = mod(j + m, b.N);
      a += (m * 2 * Math.PI) / b.N;      // keep turning the short way
      route.push({ t: t + 1, j, a, r: b.r0 + (t + 1) * b.dr });
    }
    // Final short hop out to the bin
    route.push({ t: null, j, a, r: b.rMax + 14 });
    // Start just inside the first ring
    route.unshift({ t: null, j: 0, a: b.angle(0), r: Math.max(0, b.r0 - b.dr * 0.9) });
    balls.push({ route, seg: 0, t: 0, x: 0, y: 0, bin: j });
  }

  function step(dt) {
    const speed = +ui.speed.value;
    const hop = 0.24 / speed;

    spawnTimer -= dt;
    if ((auto || queue > 0) && spawnTimer <= 0 && balls.length < 400) {
      spawn();
      if (queue > 0) queue--;
      spawnTimer = (auto ? 0.14 : 0.06) / speed;
    }

    const b = board;
    for (const ball of balls) {
      ball.t += dt / hop;
      while (ball.t >= 1 && ball.seg < ball.route.length - 1) {
        ball.t -= 1;
        ball.seg++;
        const p = ball.route[ball.seg];
        if (p.t !== null) {
          const peg = b.rings[p.t].pegs[p.j];
          peg.flash = 1;
          peg.visits++;
        }
      }
      if (ball.seg >= ball.route.length - 1) { ball.done = true; continue; }
      const p = ball.route[ball.seg];
      const q = ball.route[ball.seg + 1];
      const s = Math.min(ball.t, 1);
      const e = s * s * (3 - 2 * s);     // smooth start and stop
      const r = p.r + (q.r - p.r) * e;
      const a = p.a + (q.a - p.a) * e;
      ball.x = b.cx + r * Math.cos(a);
      ball.y = b.cy + r * Math.sin(a);
    }

    let landed = false;
    for (const ball of balls) {
      if (ball.done) { counts[ball.bin]++; total++; landed = true; }
    }
    if (landed) {
      balls = balls.filter((x) => !x.done);
      ui.count.textContent = total;
    }

    for (const ring of b.rings) for (const peg of ring.pegs) peg.flash = Math.max(0, peg.flash - dt * 3);
  }

  // ---------- Drawing ----------

  function draw() {
    const b = board;
    ctx.clearRect(0, 0, W, H);

    // Faint guide circles for each step
    ctx.strokeStyle = C.ring;
    ctx.lineWidth = 1;
    for (const ring of b.rings) {
      ctx.beginPath();
      ctx.arc(b.cx, b.cy, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial bars: how many balls ended at each position
    const binBase = b.rMax + 14;
    const maxCount = Math.max(...counts, 1);
    const maxExp = Math.max(...b.expected) * Math.max(total, 1);
    const scale = Math.max(maxCount, total > 0 ? maxExp : 1);
    const half = Math.min(Math.PI / b.N * 0.7, 0.35);

    for (let j = 0; j < b.N; j++) {
      const a = b.angle(j);
      const len = (counts[j] / scale) * b.barLen;
      if (len > 0) {
        ctx.beginPath();
        ctx.arc(b.cx, b.cy, binBase, a - half, a + half);
        ctx.arc(b.cx, b.cy, binBase + len, a + half, a - half, true);
        ctx.closePath();
        ctx.fillStyle = C.bar;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.cx, b.cy, binBase + len, a - half, a + half);
        ctx.strokeStyle = C.barEdge;
        ctx.stroke();
      }
      if (b.N <= 24) {
        const lr = binBase + b.barLen + 8;
        ctx.fillStyle = C.text;
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(counts[j], b.cx + lr * Math.cos(a), b.cy + lr * Math.sin(a));
      }
    }
    // Base circle for the bars
    ctx.strokeStyle = 'rgba(201, 169, 110, 0.25)';
    ctx.beginPath();
    ctx.arc(b.cx, b.cy, binBase, 0, Math.PI * 2);
    ctx.stroke();

    // Expected shape, as a dashed closed curve
    if (ui.expected.checked) {
      const s = total > 0 ? scale / total : Math.max(...b.expected);
      ctx.strokeStyle = C.expected;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let j = 0; j <= b.N; j++) {
        const jj = j % b.N;
        const a = b.angle(jj);
        const r = binBase + (b.expected[jj] / s) * b.barLen;
        const x = b.cx + r * Math.cos(a), y = b.cy + r * Math.sin(a);
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Traffic glow, compared within each ring
    const glowR = Math.min(b.dr * 0.32, (Math.PI * b.r0) / b.N, 16);
    for (const ring of b.rings) {
      const rowMax = Math.max(...ring.pegs.map((p) => p.visits));
      if (!rowMax) continue;
      for (const peg of ring.pegs) {
        if (!peg.visits) continue;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, Math.max(glowR, b.pegR * 2), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201, 169, 110, ' + (0.02 + 0.16 * peg.visits / rowMax).toFixed(3) + ')';
        ctx.fill();
      }
    }

    // Pegs and path counts
    const fontSize = 10;
    ctx.font = fontSize + 'px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Show a ring's numbers only where they fit (outer rings have more room)
    const fits = b.rings.map((ring, t) => {
      if (!ui.numbers.checked) return false;
      const w = ctx.measureText(String(Math.max(...b.paths[t]))).width;
      const gap = (2 * Math.PI * ring.r) / b.N;
      return w + b.pegR + 6 < gap * 0.5 && 11 < (b.dr || ring.r) * 0.75;
    });

    b.rings.forEach((ring, t) => ring.pegs.forEach((peg, j) => {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, b.pegR * (1 + peg.flash * 0.6), 0, Math.PI * 2);
      ctx.fillStyle = !peg.on ? C.pegOff : (peg.flash > 0.05 ? C.pegHit : C.peg);
      ctx.fill();
      if (fits[t] && peg.on) {
        // Number sits on the ring, just clockwise of its peg, in the gap
        // between neighbouring pegs (rings are too close to put it outside)
        const label = String(b.paths[t][j]);
        const off = b.pegR + 4 + ctx.measureText(label).width / 2;
        const a = b.angle(j) + off / ring.r;
        ctx.fillStyle = C.number;
        ctx.fillText(label, b.cx + ring.r * Math.cos(a), b.cy + ring.r * Math.sin(a));
      }
    }));
    ctx.textBaseline = 'alphabetic';

    // Balls
    for (const ball of balls) {
      const g = ctx.createRadialGradient(
        ball.x - b.ballR * 0.35, ball.y - b.ballR * 0.35, b.ballR * 0.1,
        ball.x, ball.y, b.ballR
      );
      g.addColorStop(0, C.ballLight);
      g.addColorStop(1, C.ball);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, b.ballR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------- Loop, sizing, controls ----------

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = Math.max(360, Math.min(W, 680));
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const keep = counts.slice();
    const old = board ? board.rings : null;
    balls = [];
    build();
    counts = keep.length === board.N ? keep : new Array(board.N).fill(0);
    if (old && old.length === board.rings.length) {
      board.rings.forEach((ring, t) => ring.pegs.forEach((peg, j) => {
        if (old[t].pegs[j]) peg.visits = old[t].pegs[j].visits;
      }));
    }
  }

  function setAuto(on) {
    auto = on;
    ui.auto.classList.toggle('on', auto);
    ui.auto.textContent = auto ? 'Stop' : 'Auto';
  }

  ui.drop1.addEventListener('click', () => { queue += 1; });
  ui.drop50.addEventListener('click', () => { queue += 50; });
  ui.auto.addEventListener('click', () => setAuto(!auto));
  ui.reset.addEventListener('click', () => { setAuto(false); resetAll(); });
  ui.n.addEventListener('input', resetAll);
  ui.steps.addEventListener('input', resetAll);
  ui.lazy.addEventListener('change', resetAll);

  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === ' ') { e.preventDefault(); setAuto(!auto); }
    else if (e.key === 'd' || e.key === 'D') queue += 1;
    else if (e.key === 'r' || e.key === 'R') { setAuto(false); resetAll(); }
  });

  window.addEventListener('resize', resize);
  resize();
  resetAll();
  requestAnimationFrame(frame);
})();