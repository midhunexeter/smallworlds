---
layout: post
title: "Opinion Dynamics: Who Listens to Whom"
date: 2026-10-18 00:00:02
description: "A crowd of agents who only listen to people who already roughly agree with them. One slider decides between consensus and camps."
---

Imagine a crowd where everyone holds an opinion somewhere between 0 and 1. People
meet in random pairs and talk. The only rule:

> **If two people's opinions are close enough, each moves part of the way toward the
> other. If they are too far apart, they ignore each other.**

How close is "close enough" is set by **open-mindedness**. How far each person moves
is set by **compromise**. Nobody is trying to form groups, and nobody can see the
crowd as a whole. Yet groups form.

<div class="sim">
  <div class="sim-controls">
    <label>Open-mindedness <span id="od-eps-out" class="sim-value">0.15</span>
      <input id="od-eps" type="range" min="0.02" max="0.5" step="0.01" value="0.15">
    </label>
    <label>Compromise <span id="od-mu-out" class="sim-value">0.30</span>
      <input id="od-mu" type="range" min="0.05" max="0.5" step="0.05" value="0.3">
    </label>
    <label>People <span id="od-n-out" class="sim-value">200</span>
      <input id="od-n" type="range" min="20" max="500" step="10" value="200">
    </label>
    <label>Stubborn <span id="od-stub-out" class="sim-value">0</span>
      <input id="od-stub" type="range" min="0" max="20" step="2" value="0">
    </label>
    <label>Speed
      <input id="od-speed" type="range" min="0.25" max="4" step="0.25" value="1">
    </label>
  </div>

  <canvas id="od-canvas" class="sim-canvas"></canvas>

  <div class="sim-buttons">
    <button id="od-play" type="button">Pause</button>
    <button id="od-restart" type="button" class="sim-quiet">New crowd</button>
    <span class="sim-stat">Round <span id="od-rounds">0</span> &middot; <span id="od-groups">0</span> groups</span>
  </div>

  <p class="sim-caption">Each line is one person&rsquo;s opinion over time, coloured by where they
  started. The bars on the right show where everyone is now; the small bracket shows how far
  one person is willing to listen.</p>
  <p class="sim-keys">Keys: <kbd>Space</kbd> pause/play &middot; <kbd>R</kbd> new crowd</p>
</div>

## What to look for

**Open-mindedness decides the number of groups.** At 0.15 the crowd usually settles
into three groups, occasionally two or four. Make people more open-minded and the groups merge: from around
0.4 upward, the whole crowd almost always reaches a single consensus. Make them less
open-minded and it shatters into many small groups. A rough rule of thumb is that
the number of groups is about 1 ÷ (2 × open-mindedness). Between 0.25 and 0.3 it is
a coin toss whether you get one group or two, so try **New crowd** a few times there.

**Compromise mostly changes the speed, not the outcome.** People who move a long way
at each meeting settle quickly; people who move only a little take much longer. But
the number of groups they end up in hardly changes.

**Groups stop talking to each other.** Once two groups are further apart than the
open-mindedness, no conversation between them can ever happen again. The split is
permanent, even though every single person was willing to compromise.

**A few stubborn people can drag everyone.** Set **Stubborn** above zero. These people
sit at the extremes and never change their minds, but others still listen to them.
With open-mindedness around 0.3, a crowd that would normally agree in the middle can
instead be pulled apart to the two edges, or split into one extreme group and one
nearer the middle. Sometimes it still agrees in the middle. Which happens depends on
chance early on, so restart a few times.

## Where this comes from

This is the *bounded confidence* model of Deffuant, Neau, Amblard and Weisbuch,
published in 2000 as *Mixing beliefs among interacting agents*. It is a deliberately
simple toy: real people are influenced by many things at once, and opinions are
rarely a single number. Its value is in showing how much structure can come from
one local rule about who listens to whom.

<script src="{{ '/assets/js/opinion-dynamics.js' | relative_url }}"></script>
