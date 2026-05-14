# Invariants of every valid IR program   

| YYYY-MM-DD | Id     | Invariant                                                                        | Tag     |Checked|Unit-Test|
| --         | --     | --                                                                               | --      |--     |--       |
| 2026-04-06 | #d5a | satisfies the context-free grammar specified in [AST](../proto/ast.ts)           | grammar |       |         |
| 2026-04-06 | #53a | $\forall$ Registers: name is defined once in the Program                         | SSA     |       |         |
| 2026-04-06 | #259 | $\forall$ Functions: name is defined once in the Program                         | SSA     |       |         |
| 2026-04-06 | #95d | $\nexists$ a control flow edge into the `entry` Block                            | SSA     |       |         |
| 2026-04-06 | #51d | $\forall$ Blocks: name is defined once in its Function                           |         |       |         |
| 2026-04-06 | #1c6 | $\exists$ a `main` Function                                                      |         |       |         |
| 2026-04-06 | #0e0 | $\nexists$ a Function before the `main` Function                                 |         |       |         |
| 2026-04-06 | #9cc | $\forall$ Functions: $\exists$ an `entry` Block                                  |         |       |         |
| 2026-04-06 | #a02 | $\forall$ Functions: $\nexists$ a Block before the `entry` Block                 |         |       |         |
| 2026-04-06 | #bfe | $\forall$ Phi-nodes: each Register is exactly 'Live' on its incoming CFG edge    | borrow  |       |         |
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
