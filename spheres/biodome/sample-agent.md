---
name: Rook
color: "#4fd1c5"
crystal: aquamarine
author: you
style:
  learns: 0.45      # how fast memory moves (0..1)
  observes: 0.35    # how often a shown tell is caught (0..1)
  probes: 0.20      # exploration: trying moves that are not yet best (0..1)
reaction:
  observe: 0.30     # seconds to see a tell
  respond: 0.20     # seconds to answer it
  sub_id: 0.10      # reflex: emergency dodge when only this fits
gradient:
  threshold: 3      # 1x at 0.5, 2x at 2, {{trigger::hide}} at this value (2..5)
  decay_s: 3        # calm fades the gradient (e-fold seconds)
  bad_outcome: 0.2  # extra gradient for a wrong read (0..1)
hide: best          # best | block | dodge
attack:
  feint: 0.35       # share of feints when attacking
  conceal: 0.30     # chance your tell is hidden
  bluff: 0.10       # chance a shown tell lies
notes: "patient, counters feints, hides early"
---
# Rook

Free markdown about your challenger. Nothing here is run.

```rules
open: feint         # punch | feint | any (first attack)
counter_bias: 0.2   # 0..1, leans answers toward COUNTER
after_hit: hide     # hide | counter | none
```
