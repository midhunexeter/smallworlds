// Opinion dynamics with bounded confidence (Deffuant et al., 2000)
// Every agent holds an opinion between 0 and 1. Repeatedly, two random agents
// meet. If their opinions are closer than the open-mindedness threshold, each
// moves part of the way toward the other. If not, nothing happens.
// Optionally, a few stubborn agents sit at the extremes and never move.

(function () {
  const canvas = document.getElementById('od-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const el = (id) => document.getElementById(id);

  const ui = {
    n: el('od-n'), nOut: el('od-n-out'),
    eps: el('od-eps'), epsOut: el('od-eps-out'),
    mu: el('od-mu'), muOut: el('od-mu-out'),
    stub: el('od-stub'), stubOut: el('od-stub-out'),
    speed: el('od-speed'),
    play: el('od-play'), restart: el('od-restart'),
    rounds: el('od-rounds'), groups: el('od-groups'),
    caption: el('od-caption')
  };

  const C = {
    grid: 'rgba(201, 169, 110, 0.12)',
    axis: 'rgba(232, 228, 218, 0.55)',
    text: 'rgba(232, 228, 218, 0.7)',
    band: 'rgba(201, 169, 110, 0.10)',
    bar: 'rgba(201, 169, 110, 0.45)',
    stubborn: '#ffffff'
  };

  // Colour each agent by where it STARTED, so you can see who ends up with whom:
  // soft blue (0) -> ivory (0.5) -> gold (1)
  function colour(x, alpha) {
    const a = [111, 143, 214], m = [232, 228, 218], b = [201, 169, 110];
    const t = Math.max(0, Math.min(1, x));
    const [p, q, s] = t < 0.5 ? [a, m, t * 2] : [m, b, (t - 0.5) * 2];
    const c = p.map((v, i) => Math.round(v + (q[i] - v) * s));
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
  }

  let W = 0, H = 0, plot = null;
  let trail = document.createElement('canvas');
  let tctx = trail.getContext('2d');
  let agents = [];
  let round = 0;
  let playing = true;
  let carry = 0;
  let col = 0;          // next pixel column in the trail
  let prev = null;      // opinions at the previous drawn column
  const STEP_PX = 2;    // pixels per round on the time axis

  // ---------- Model ----------

  function restart() {
    const N = +ui.n.value;
    const S = +ui.stub.value;
    agents = [];
    for (let i = 0; i < N; i++) {
      const x = Math.random();
      agents.push({ x, start: x, stubborn: false });
    }
    // Stubborn agents: half near 0, half near 1
    for (let i = 0; i < S; i++) {
      const x = i % 2 === 0 ? 0.02 : 0.98;
      agents.push({ x, start: x, stubborn: true });
    }
    round = 0;
    carry = 0;
    clearTrail();
    updateLabels();
  }

  // One round = on average every agent takes part in one meeting
  function doRound() {
    const eps = +ui.eps.value;
    const mu = +ui.mu.value;
    const n = agents.length;
    const meetings = Math.max(1, Math.round(n / 2));
    for (let m = 0; m < meetings; m++) {
      const i = Math.floor(Math.random() * n);
      let j = Math.floor(Math.random() * (n - 1));
      if (j >= i) j++;
      const A = agents[i], B = agents[j];
      const d = B.x - A.x;
      if (Math.abs(d) < eps) {
        if (!A.stubborn) A.x += mu * d;
        if (!B.stubborn) B.x -= mu * d;
      }
    }
    round++;
  }

  // Groups: sort opinions and split wherever there is a clear gap
  function countGroups() {
    const xs = agents.filter((a) => !a.stubborn).map((a) => a.x).sort((p, q) => p - q);
    if (!xs.length) return 0;
    const minSize = Math.max(2, Math.round(xs.length * 0.02));
    let groups = 0, size = 1;
    for (let i = 1; i <= xs.length; i++) {
      if (i === xs.length || xs[i] - xs[i - 1] > 0.02) {
        if (size >= minSize) groups++;
        size = 1;
      } else size++;
    }
    return groups;
  }

  // ---------- Drawing ----------

  function layout() {
    const dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = Math.max(320, Math.min(W * 0.6, 520));
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const left = 58, right = 96, top = 18, bottom = 34;
    plot = { x: left, y: top, w: Math.max(100, W - left - right), h: H - top - bottom };
    plot.hx = plot.x + plot.w + 14;                  // histogram strip
    plot.hw = W - plot.hx - 8;

    trail.width = Math.round(plot.w * dpr);
    trail.height = Math.round(plot.h * dpr);
    tctx = trail.getContext('2d');
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    clearTrail();
  }

  function clearTrail() {
    tctx.clearRect(0, 0, plot.w, plot.h);
    col = 0;
    prev = null;
  }

  const yOf = (x) => plot.h - x * plot.h;

  // Add one column (one round) to the scrolling picture of everyone's opinion
  function drawColumn() {
    const xs = agents.map((a) => a.x);
    if (prev) {
      if (col + STEP_PX > plot.w) {
        // Scroll left to make room
        const dpr = window.devicePixelRatio || 1;
        tctx.save();
        tctx.setTransform(1, 0, 0, 1, 0, 0);
        tctx.globalCompositeOperation = 'copy';
        tctx.drawImage(trail, -STEP_PX * dpr, 0);
        tctx.restore();
        col -= STEP_PX;
      }
      const alpha = Math.max(0.12, Math.min(0.6, 40 / agents.length));
      tctx.lineWidth = 1;
      for (let i = 0; i < agents.length; i++) {
        tctx.strokeStyle = agents[i].stubborn ? C.stubborn : colour(agents[i].start, alpha);
        tctx.lineWidth = agents[i].stubborn ? 2 : 1;
        tctx.beginPath();
        tctx.moveTo(col, yOf(prev[i]));
        tctx.lineTo(col + STEP_PX, yOf(xs[i]));
        tctx.stroke();
      }
      col += STEP_PX;
    }
    prev = xs;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const eps = +ui.eps.value;

    // Grid and axis labels
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = C.text;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      const y = plot.y + yOf(v);
      ctx.beginPath();
      ctx.moveTo(plot.x, y + 0.5);
      ctx.lineTo(plot.x + plot.w, y + 0.5);
      ctx.stroke();
      ctx.fillText(v.toFixed(2), plot.x - 8, y);
    }
    ctx.save();
    ctx.translate(14, plot.y + plot.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('opinion', 0, 0);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('time →', plot.x + plot.w / 2, plot.y + plot.h + 12);

    // Opinion trails
    ctx.drawImage(trail, plot.x, plot.y, plot.w, plot.h);

    // Histogram of current opinions
    const bins = 40;
    const hist = new Array(bins).fill(0);
    for (const a of agents) if (!a.stubborn) hist[Math.min(bins - 1, Math.floor(a.x * bins))]++;
    const maxH = Math.max(...hist, 1);
    const bh = plot.h / bins;
    for (let b = 0; b < bins; b++) {
      if (!hist[b]) continue;
      const len = (hist[b] / maxH) * plot.hw;
      const y = plot.y + plot.h - (b + 1) * bh;
      ctx.fillStyle = colour((b + 0.5) / bins, 0.75);
      ctx.fillRect(plot.hx, y + 0.5, len, Math.max(1, bh - 1));
    }
    ctx.strokeStyle = C.axis;
    ctx.beginPath();
    ctx.moveTo(plot.hx - 0.5, plot.y);
    ctx.lineTo(plot.hx - 0.5, plot.y + plot.h);
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.textAlign = 'left';
    ctx.fillText('now', plot.hx, plot.y + plot.h + 12);

    // Open-mindedness ruler: how far an agent will "listen"
    const rx = plot.hx + plot.hw - 4;
    const r0 = plot.y + yOf(0.5 + eps / 2), r1 = plot.y + yOf(0.5 - eps / 2);
    ctx.strokeStyle = 'rgba(232, 228, 218, 0.6)';
    ctx.beginPath();
    ctx.moveTo(rx - 4, r0); ctx.lineTo(rx + 4, r0);
    ctx.moveTo(rx, r0); ctx.lineTo(rx, r1);
    ctx.moveTo(rx - 4, r1); ctx.lineTo(rx + 4, r1);
    ctx.stroke();
  }

  function updateLabels() {
    ui.nOut.textContent = ui.n.value;
    ui.epsOut.textContent = (+ui.eps.value).toFixed(2);
    ui.muOut.textContent = (+ui.mu.value).toFixed(2);
    ui.stubOut.textContent = ui.stub.value;
    ui.rounds.textContent = round;
    ui.groups.textContent = countGroups();
  }

  // ---------- Loop and controls ----------

  let last = performance.now();
  let labelTimer = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (playing) {
      carry += dt * 20 * +ui.speed.value;     // about 20 rounds per second at speed 1
      while (carry >= 1) {
        doRound();
        drawColumn();
        carry -= 1;
      }
    }
    labelTimer -= dt;
    if (labelTimer <= 0) { updateLabels(); labelTimer = 0.2; }
    draw();
    requestAnimationFrame(frame);
  }

  function setPlaying(on) {
    playing = on;
    ui.play.textContent = playing ? 'Pause' : 'Play';
    ui.play.classList.toggle('on', !playing);
  }

  ui.play.addEventListener('click', () => setPlaying(!playing));
  ui.restart.addEventListener('click', () => { restart(); setPlaying(true); });
  // Population changes need a fresh start; the rules can change mid-run
  ui.n.addEventListener('input', restart);
  ui.stub.addEventListener('input', restart);
  ui.eps.addEventListener('input', updateLabels);
  ui.mu.addEventListener('input', updateLabels);

  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === 'r' || e.key === 'R') { restart(); setPlaying(true); }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  });

  layout();
  restart();
  requestAnimationFrame(frame);
})();
