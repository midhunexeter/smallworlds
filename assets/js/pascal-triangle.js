// Pascal's Triangle, Both Ways
// Balls fall through a triangle of pegs. At each peg a ball goes left or right
// with equal chance (or is forced inward by the edge of the board).
// Shapes: "up" (classic), "down" (upside down), "diamond" (opens, then closes).

(function () {
  const canvas = document.getElementById('pt-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const el = (id) => document.getElementById(id);

  const ui = {
    shape: el('pt-shape'),
    rows: el('pt-rows'),
    rowsOut: el('pt-rows-out'),
    speed: el('pt-speed'),
    numbers: el('pt-numbers'),
    expected: el('pt-expected'),
    drop1: el('pt-drop1'),
    drop50: el('pt-drop50'),
    auto: el('pt-auto'),
    reset: el('pt-reset'),
    count: el('pt-count'),
    caption: el('pt-caption')
  };

  // Colours matching the site theme
  const C = {
    peg: 'rgba(232, 228, 218, 0.8)',
    pegHit: '#e2c891',
    number: 'rgba(201, 169, 110, 0.95)',
    ball: '#c9a96e',
    ballLight: '#f6e7c1',
    bar: 'rgba(201, 169, 110, 0.28)',
    barEdge: 'rgba(201, 169, 110, 0.85)',
    expected: 'rgba(232, 228, 218, 0.75)',
    text: 'rgba(232, 228, 218, 0.7)',
    rail: 'rgba(201, 169, 110, 0.25)'
  };

  const CAPTIONS = {
    up: 'Classic: every number counts the routes from the top to that peg. ' +
        'These are the numbers of Pascal\u2019s triangle, and the balls pile up in the same proportions.',
    down: 'Upside down: balls enter anywhere along the wide top and are funnelled to a single point. ' +
          'Each number now counts the routes from that peg down to the bottom \u2014 Pascal\u2019s triangle read from the other end.',
    diamond: 'Both ways: the triangle opens, then closes. Every peg is still the sum of the two above it; ' +
             'the rule never changes, only the walls do.'
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

  // ---------- Board geometry ----------

  function rowWidths(shape, R) {
    const w = [];
    if (shape === 'up') {
      for (let r = 0; r < R; r++) w.push(r + 1);
    } else if (shape === 'down') {
      for (let r = 0; r < R; r++) w.push(R - r);
    } else {
      for (let r = 0; r < R; r++) w.push(r + 1);
      for (let r = R - 2; r >= 0; r--) w.push(r + 1);
    }
    return w;
  }

  // Pegs a ball can move to from peg k in row r
  function nextOptions(widths, r, k) {
    const n = widths[r + 1];
    const opts = widths[r + 1] > widths[r] ? [k, k + 1] : [k - 1, k];
    return opts.filter((j) => j >= 0 && j < n);
  }

  function build() {
    const shape = ui.shape.value;
    const maxRows = shape === 'diamond' ? 8 : 14;
    ui.rows.max = maxRows;
    if (+ui.rows.value > maxRows) ui.rows.value = maxRows;
    const R = +ui.rows.value;
    ui.rowsOut.textContent = R;

    const widths = rowWidths(shape, R);
    const rows = widths.length;
    const lastW = widths[rows - 1];
    const binsN = lastW + 1;
    const maxW = Math.max(...widths, binsN);

    const topPad = 50;
    const binH = H * 0.24;
    const latticeH = H - topPad - binH - 50;
    let dx = (W * 0.88) / maxW;
    dx = Math.min(dx, latticeH / Math.max(rows - 1, 1) / 0.866, 90);
    const dy = dx * 0.866;
    const cx = W / 2;
    const y0 = topPad + Math.max(0, (latticeH - dy * (rows - 1)) / 2);

    const pegs = widths.map((n, r) =>
      Array.from({ length: n }, (_, k) => ({
        x: cx + (k - (n - 1) / 2) * dx,
        y: y0 + r * dy,
        flash: 0,
        visits: 0
      }))
    );

    const binTop = pegs[rows - 1][0].y + dy * 0.9;
    const binBottom = H - 34;
    const bins = Array.from({ length: binsN }, (_, b) => cx + (b - lastW / 2) * dx);

    // Path counts: from the top if there is a single entry peg,
    // otherwise from each peg down to the single exit peg.
    const fromTop = widths[0] === 1;
    const paths = widths.map((n) => new Array(n).fill(0));
    if (fromTop) {
      paths[0][0] = 1;
      for (let r = 0; r < rows - 1; r++)
        for (let k = 0; k < widths[r]; k++)
          for (const j of nextOptions(widths, r, k)) paths[r + 1][j] += paths[r][k];
    } else {
      paths[rows - 1].fill(1);
      for (let r = rows - 2; r >= 0; r--)
        for (let k = 0; k < widths[r]; k++)
          for (const j of nextOptions(widths, r, k)) paths[r][k] += paths[r + 1][j];
    }

    // Expected share of balls in each bin
    let p = new Array(widths[0]).fill(1 / widths[0]);
    for (let r = 0; r < rows - 1; r++) {
      const q = new Array(widths[r + 1]).fill(0);
      for (let k = 0; k < widths[r]; k++) {
        const opts = nextOptions(widths, r, k);
        for (const j of opts) q[j] += p[k] / opts.length;
      }
      p = q;
    }
    const expected = new Array(binsN).fill(0);
    for (let k = 0; k < lastW; k++) {
      expected[k] += p[k] / 2;
      expected[k + 1] += p[k] / 2;
    }

    const pegR = Math.max(2, Math.min(dx * 0.07, 5));
    const ballR = Math.max(3, Math.min(dx * 0.15, 9));

    board = { shape, R, widths, rows, pegs, bins, binTop, binBottom, binH,
              dx, dy, paths, expected, pegR, ballR };
    ui.caption.textContent = CAPTIONS[shape];
  }

  function resetAll() {
    balls = [];
    queue = 0;
    total = 0;
    build();
    counts = new Array(board.bins.length).fill(0);
    ui.count.textContent = '0';
  }

  // ---------- Balls ----------

  function spawn() {
    const b = board;
    const { widths, rows, pegs } = b;
    let k = widths[0] === 1 ? 0 : Math.floor(Math.random() * widths[0]);
    const route = [[0, k]];
    for (let r = 0; r < rows - 1; r++) {
      const opts = nextOptions(widths, r, k);
      k = opts[Math.floor(Math.random() * opts.length)];
      route.push([r + 1, k]);
    }
    const bin = k + (Math.random() < 0.5 ? 0 : 1);

    const lift = b.pegR + b.ballR;
    const pts = [{ x: pegs[0][route[0][1]].x, y: pegs[0][0].y - b.dy * 1.3, peg: null }];
    for (const [r, kk] of route) pts.push({ x: pegs[r][kk].x, y: pegs[r][kk].y - lift, peg: [r, kk] });
    pts.push({ x: b.bins[bin], y: b.binTop, peg: null });

    balls.push({ pts, seg: 0, t: 0, x: pts[0].x, y: pts[0].y, bin });
  }

  function step(dt) {
    const speed = +ui.speed.value;
    const hop = 0.22 / speed;

    // Spawning
    spawnTimer -= dt;
    if ((auto || queue > 0) && spawnTimer <= 0 && balls.length < 400) {
      spawn();
      if (queue > 0) queue--;
      spawnTimer = (auto ? 0.14 : 0.06) / speed;
    }

    // Movement
    for (const ball of balls) {
      ball.t += dt / hop;
      while (ball.t >= 1 && ball.seg < ball.pts.length - 1) {
        ball.t -= 1;
        ball.seg++;
        const hit = ball.pts[ball.seg].peg;
        if (hit) {
          const peg = board.pegs[hit[0]][hit[1]];
          peg.flash = 1;
          peg.visits++;
        }
      }
      if (ball.seg >= ball.pts.length - 1) { ball.done = true; continue; }
      const a = ball.pts[ball.seg];
      const z = ball.pts[ball.seg + 1];
      const t = Math.min(ball.t, 1);
      ball.x = a.x + (z.x - a.x) * t;
      const arc = a.peg ? Math.sin(Math.PI * t) * board.dy * 0.32 : 0;
      ball.y = a.y + (z.y - a.y) * (a.peg ? t * t : t) - arc;
    }

    // Land balls in bins
    for (const ball of balls) {
      if (ball.done) {
        counts[ball.bin]++;
        total++;
      }
    }
    if (balls.some((b) => b.done)) {
      balls = balls.filter((b) => !b.done);
      ui.count.textContent = total;
    }

    // Fade peg flashes
    for (const row of board.pegs) for (const peg of row) peg.flash = Math.max(0, peg.flash - dt * 3);
  }

  // ---------- Drawing ----------

  function draw() {
    const b = board;
    ctx.clearRect(0, 0, W, H);

    // Bins
    const maxCount = Math.max(...counts, 1);
    const maxExp = Math.max(...b.expected) * Math.max(total, 1);
    const scale = Math.max(maxCount, maxExp, 1);
    const binW = b.dx * 0.82;
    const binSpan = b.binBottom - b.binTop;

    ctx.strokeStyle = C.rail;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(b.bins[0] - b.dx / 2, b.binBottom + 0.5);
    ctx.lineTo(b.bins[b.bins.length - 1] + b.dx / 2, b.binBottom + 0.5);
    ctx.stroke();

    b.bins.forEach((x, i) => {
      const h = (counts[i] / scale) * binSpan;
      if (h > 0) {
        ctx.fillStyle = C.bar;
        ctx.fillRect(x - binW / 2, b.binBottom - h, binW, h);
        ctx.strokeStyle = C.barEdge;
        ctx.beginPath();
        ctx.moveTo(x - binW / 2, b.binBottom - h + 0.5);
        ctx.lineTo(x + binW / 2, b.binBottom - h + 0.5);
        ctx.stroke();
      }
      if (b.bins.length <= 16) {
        ctx.fillStyle = C.text;
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(counts[i], x, b.binBottom + 16);
      }
    });

    // Expected shape
    if (ui.expected.checked) {
      const t = Math.max(total, 1);
      const s = total > 0 ? scale : Math.max(...b.expected);
      ctx.strokeStyle = C.expected;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      b.bins.forEach((x, i) => {
        const v = total > 0 ? b.expected[i] * t : b.expected[i];
        const y = b.binBottom - (v / s) * binSpan;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Traffic: a soft halo showing how often each peg has been hit
    // (compared within each row, so you see how the balls are spread across it)
    for (const row of b.pegs) {
      const rowMax = Math.max(...row.map((p) => p.visits));
      if (!rowMax) continue;
      for (const peg of row) {
        if (!peg.visits) continue;
        const a = 0.02 + 0.16 * (peg.visits / rowMax);
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, Math.min(b.dx * 0.3, 18), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201, 169, 110, ' + a.toFixed(3) + ')';
        ctx.fill();
      }
    }

    // Pegs and path counts
    const fontSize = Math.max(9, Math.min(b.dx * 0.22, 13));
    ctx.font = fontSize + 'px Inter, system-ui, sans-serif';
    const biggest = String(Math.max(...b.paths.flat()));
    const showNums = ui.numbers.checked && ctx.measureText(biggest).width < b.dx * 0.85;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    b.pegs.forEach((row, r) => row.forEach((peg, k) => {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, b.pegR * (1 + peg.flash * 0.6), 0, Math.PI * 2);
      ctx.fillStyle = peg.flash > 0.05 ? C.pegHit : C.peg;
      ctx.fill();
      if (showNums) {
        ctx.fillStyle = C.number;
        ctx.font = fontSize + 'px Inter, system-ui, sans-serif';
        ctx.fillText(b.paths[r][k], peg.x, peg.y + b.pegR + 4);
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
    H = Math.max(380, Math.min(W * 0.85, 680));
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const keep = counts.slice();
    const oldPegs = board ? board.pegs : null;
    balls = [];
    build();
    counts = keep.length === board.bins.length ? keep : new Array(board.bins.length).fill(0);
    // Keep the peg glow when the window is resized
    if (oldPegs && oldPegs.length === board.pegs.length) {
      board.pegs.forEach((row, r) => row.forEach((peg, k) => {
        if (oldPegs[r] && oldPegs[r][k]) peg.visits = oldPegs[r][k].visits;
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
  ui.shape.addEventListener('change', resetAll);
  ui.rows.addEventListener('input', resetAll);

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