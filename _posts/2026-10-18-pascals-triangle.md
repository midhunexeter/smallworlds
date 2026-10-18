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

**Upside down.** Now balls enter anywhere along the wide top, and the walls push them
inward until they all meet at a single peg. The numbers now count routes *from* each
peg *down* to that point, and they are Pascal's triangle again, read from the other end.
Watch the soft glow on the pegs, which shows how busy each peg is compared with its row:
the outer pegs glow brightest, because the walls keep turning balls back inward.

**Both ways.** The triangle opens and then closes. In the first half the balls spread
out; in the second half they are gathered back in. Each number is still the sum of the
two above it, so the counts keep growing as the walls close, until the single peg at
the bottom collects every route through the board.

<script src="{{ '/assets/js/pascal-triangle.js' | relative_url }}"></script>