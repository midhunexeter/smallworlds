---
layout: post
title: "Pascal's Triangle on a Circle"
date: 2026-10-18 00:00:01
description: "Take away the walls: wrap the row of pegs into a ring and watch the bell curve chase its own tail."
---

In [Pascal's Triangle, Both Ways]({{ site.baseurl }}{% post_url 2026-10-18-pascals-triangle %}) the
balls were held in by walls. Here there are none. The row of pegs is bent into a
circle, so a ball that steps off one end simply comes back on the other.

The rule is the same as before: at each step, go one place left or one place right
with equal chance. Each step is drawn as a ring further out from the centre, so you
can read the board like a tree ring, from the first step inside to the last outside.

<div class="sim">
  <div class="sim-controls">
    <label>Positions <span id="pc-n-out" class="sim-value">9</span>
      <input id="pc-n" type="range" min="3" max="24" value="9">
    </label>
    <label>Steps <span id="pc-steps-out" class="sim-value">10</span>
      <input id="pc-steps" type="range" min="1" max="16" value="10">
    </label>
    <label>Speed
      <input id="pc-speed" type="range" min="0.25" max="4" step="0.25" value="1">
    </label>
    <label class="sim-check"><input id="pc-lazy" type="checkbox"> Lazy steps</label>
    <label class="sim-check"><input id="pc-numbers" type="checkbox" checked> Path counts</label>
    <label class="sim-check"><input id="pc-expected" type="checkbox" checked> Expected shape</label>
  </div>

  <canvas id="pc-canvas" class="sim-canvas"></canvas>

  <div class="sim-buttons">
    <button id="pc-drop1" type="button">Drop 1</button>
    <button id="pc-drop50" type="button">Drop 50</button>
    <button id="pc-auto" type="button">Auto</button>
    <button id="pc-reset" type="button" class="sim-quiet">Reset</button>
    <span class="sim-stat"><span id="pc-count">0</span> balls</span>
  </div>

  <p id="pc-caption" class="sim-caption"></p>
  <p class="sim-keys">Keys: <kbd>Space</kbd> auto on/off &middot; <kbd>D</kbd> drop one &middot; <kbd>R</kbd> reset</p>
</div>

## What to look for

**Few steps.** Early on the circle hardly matters. The balls have not travelled far
enough to meet the far side, and the numbers on the rings are ordinary Pascal's
triangle, bent into an arc.

**Many steps.** Once the two edges of the spreading pile meet on the far side of the
circle, the numbers start to overlap and add up. The bell curve flattens, and with an
odd number of positions every position becomes equally likely. Nothing pushes the
balls toward evenness; it is simply where the coin tosses lead.

**Even circles.** Try 8 or 10 positions. Every step changes a ball's position by one,
so after an even number of steps it can only be on an even position, and after an odd
number only on an odd one, like a bishop that can never leave its colour on a
chessboard. Half the pegs on every ring stay dark, and half the bins stay empty, no
matter how long you wait.

**Lazy steps.** Now let a ball also stay where it is, with three equal choices.
This tiny change breaks the alternating pattern. The numbers become the rows of a
different triangle, where each entry is the sum of the *three* above it, and every
circle, odd or even, fills in evenly.

<script src="{{ '/assets/js/pascal-circle.js' | relative_url }}"></script>