
|###| Invariants of every valid IR program                                             | Tag     |Checked|Unit-Test|
| --| --                                                                               | --      |--     |--       |
|   | satisfies the context-free grammar specified in [AST](../proto/ast.ts)           | grammar |       |         |
|   | $\forall$ Registers: names are globally unique                                   | SSA     |       |         |
|   | $\forall$ Functions: names is globally unique                                    | SSA     |       |         |
|   | $\neg\exists$ a control flow edge into the `entry` Block                         | SSA     |       |         |
|   | $\forall$ Blocks: name is scoped to its Function name                            |         |       |         |
|   | $\forall$ Blocks: name is unique in a Function                                   |         |       |         |
|   | $\exists$ `main` Function                                                        |         |       |         |
|   | $\neg\exists$ a Function before the `main` Function                              |         |       |         |
|   | $\forall$ Functions: $\exist$ `entry` Block                                      |         |       |         |
|   | $\forall$ Functions: $\neg\exists$ a Block before the `entry` Block              |         |       |         |
|   | $\forall \Phi$-nodes: each Register is exactly 'Live' on its incoming CFG edge   | borrow  |       |         |
|   | |         | | |

---
**Copyright (c) 2026 Marco Nikander**
