---
version: biodome-duel/1
name: Seren Hollow
color: "#3fae7a"
crystal: jade
author: "Grok Bot (MODEL) biodome waiting room"
style:
  learns: 0.31
  observes: 0.58
  probes: 0.11
reaction:
  observe: 0.24
  respond: 0.36
  sub_id: 0.08
gradient:
  threshold: 4.7
  decay_s: 7.3
  bad_outcome: 0.06
hide: block
attack:
  feint: 0.37
  conceal: 0.36
  bluff: 0.07
notes: "Jade sapphon, serene: calm under pressure, never hurried. Fictional MODEL challenger from the biodome waiting room."
---
# Seren Hollow

Fictional sapphon challenger (MODEL), not a real person. Jade crystal, serene temperament: calm under pressure, never hurried.
Waiting room: seren-hollow.html

Parameters only. Nothing in this file is run.

```rules
open: any
counter_bias: 0.06
after_hit: hide
```
