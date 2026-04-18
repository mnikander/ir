# Invariants of every valid IR program   

| YYYY-MM-DD | Id     | Invariant                                                                        | Tag     |Checked|Unit-Test|
| --         | --     | --                                                                               | --      |--     |--       |
| 2026-04-06 | #d5a | satisfies the context-free grammar specified in [AST](../proto/ast.ts)           | grammar |       |         |
| 2026-04-06 | #53a | $\forall$ Registers: names are globally unique                                   | SSA     |       |         |
| 2026-04-06 | #259 | $\forall$ Functions: names is globally unique                                    | SSA     |       |         |
| 2026-04-06 | #95d | $\neg\exists$ a control flow edge into the `entry` Block                         | SSA     |       |         |
| 2026-04-06 | #51d | $\forall$ Blocks: name is unique in a Function                                   |         |       |         |
| 2026-04-06 | #1c6 | $\exists$ `main` Function                                                        |         |       |         |
| 2026-04-06 | #0e0 | $\neg\exists$ a Function before the `main` Function                              |         |       |         |
| 2026-04-06 | #9cc | $\forall$ Functions: $\exist$ `entry` Block                                      |         |       |         |
| 2026-04-06 | #a02 | $\forall$ Functions: $\neg\exists$ a Block before the `entry` Block              |         |       |         |
| 2026-04-06 | #bfe | $\forall \Phi$-nodes: each Register is exactly 'Live' on its incoming CFG edge   | borrow  |       |         |
| 2026- |  | |         | | |


<!--

TODO: collect invariants for:
- the grammar
- SSA
- phi nodes
- type system
- lifetimes
- borrow checking
- linear resources
- escape semantics
- ...

-->

---
**Copyright (c) 2026 Marco Nikander**
