---
layout: post
title: "Pascal's Triangle, Both Ways"
description: "Balls falling through a triangle of pegs, the right way up, upside down, and both at once."
---

Drop balls through a triangle of pegs. At every peg a ball goes left or right with
equal chance. Nothing else is going on, yet the balls always pile up into the same
shape, and the numbers that describe it are the rows of Pascal's triangle.

Then turn the triangle upside down, and the same rule tells a different story.

<div class="sim">
  <div class="sim-controls">
    <label>Shape
      <select id="pt-shape">
        <option value="up">Classic</option>
        <option value="down">Upside down</option>
        <option value="diamond">Both ways</option>
      </select>
    </label>
    <label>Rows <span id="pt-rows-out" class="sim-value">10</span>
      <input id="pt-rows" type="range" min="3" max="14" value="10">
    </label>
    <label>Speed
      <input id="pt-speed" type="range" min="0.25" max="4" step="0.25" value="1">
    </label>
    <label class="sim-check"><input id="pt-numbers" type="checkbox" checked> Path counts</label>
    <label class="sim-check"><input id="pt-expected" type="checkbox" checked> Expected shape</label>
  </div>

  <canvas id="pt-canvas" class="sim-canvas"></canvas>

  <div class="sim-buttons">
    <button id="pt-drop1" type="button">Drop 1</button>
    <button id="pt-drop50" type="button">Drop 50</button>
    <button id="pt-auto" type="button">Auto</button>
    <button id="pt-reset" type="button" class="sim-quiet">Reset</button>
    <span class="sim-stat"><span id="pt-count">0</span> balls</span>
  </div>

  <p id="pt-caption" class="sim-caption"></p>
  <p class="sim-keys">Keys: <kbd>Space</kbd> auto on/off &middot; <kbd>D</kbd> drop one &middot; <kbd>R</kbd> reset</p>
</div>

## What to look for

**Classic.** The number under each peg counts the different routes a ball could take
from the top to reach it. Each number is the sum of the two above it, which is exactly
how Pascal's triangle is built. Because every route is equally likely, the bins fill
in proportion to the last row: a bell shape emerges from pure coin tosses.

**Upside down.** Now the wide end is at the top and the triangle points down. Balls
are dropped above any peg of the top row, with equal chance, and the board narrows as
they fall. There are no walls: a ball that bounces past the edge simply falls off and
drops straight down, so balls that start near the sides are the first to leave.

Every peg on this board has two pegs above it, so the number of routes doubles from
one row to the next: 1, 2, 4, 8, and so on. And the pile below comes out flat. Every
landing spot is equally likely, whether a ball fell off the side early or bounced all
the way to the bottom.

Watch the soft glow on the pegs, which shows how busy each peg is compared with its row.

**Both ways.** The triangle opens and then closes. While it widens, no ball can
escape and the numbers are Pascal's triangle. Once it starts to narrow, balls begin
to fall off the sides, and only the lucky ones bounce all the way to the last peg.
The numbers there count just those survivors.

<script src="{{ '/assets/js/pascal-triangle.js' | relative_url }}"></script>