# Repository Overview

This repository contains a TypeScript/Deno interpreter for a small intermediate representation.
The active architecture provides independent HIR -> LIR and MIR -> LIR
lowering pipelines feeding the same runtime.
The input is in JSON form, which is verified by the typescript type-checker.
There is no parser.
Files which are completely AI-generated have `*.gen.ts` or `*.gen.test.ts` file extensions.
MIR is executable through its own lowering pipeline while the HIR pipeline
remains available independently.

## Important Files

- [README.md](/home/marco/Documents/ir/README.md)
  Short project intro and common Deno commands.

- [design.md](/home/marco/Documents/ir/doc/design.md)
  High-level design goals for the IR.

- [decisions.md](/home/marco/Documents/ir/doc/decisions.md)
  Decision log for architectural changes.

- [instructions.md](/home/marco/Documents/ir/doc/instructions.md)
  Human-readable instruction reference.

- [invariants.md](/home/marco/Documents/ir/doc/invariants.md)
  Intended invariants for valid programs.

## Source Layout

### High-Level IR

- [high_grammar.ts](/home/marco/Documents/ir/src/high/high_grammar.ts)
  Defines structured HIR:
  - programs, functions, and blocks
  - HIR-only type annotations
  - named registers and labels
  - SSA-style phi nodes
  - consumed inputs
  - call instructions
  - memory instructions
  - arithmetic and comparison instructions
  - control-flow terminators

- [print.gen.ts](/home/marco/Documents/ir/src/high/print.gen.ts)
  Pretty-prints HIR programs for tests and debugging.

### Middle-Level IR
- Not yet used, but the codebase will be refactored to use the MIR instead of the HIR
- [middle_grammar.ts](/home/marco/Documents/ir/src/middle/middle_grammar.ts)
  Defines MIR based on tagged symbolic-expressions
- [print.gen.ts](/home/marco/Documents/ir/src/middle/print.gen.ts)
  Pretty-prints MIR programs as canonical, indented symbolic expressions


#### MIR Syntax

MIR represents every value-producing line as a tagged `let` tuple containing a
tagged value operation. The destination precedes the operation in both the
symbolic-expression and JSON forms:

```text
(let 2 (add (read 0) (read 1)))
["let", 2, ["add", ["read", 0], ["read", 1]]]
```

Value-producing instructions are wrapped in `let` nodes to bind their result 
to a resource number. The syntax is:

```
(let resource value-op)
```

For example:
- `(let 0 (copy (literal 42)))` - load constant 42 into resource 0
- `(let 1 (add (read 0) (read 2)))` - add resources 0 and 2, store in resource 1
- `(let 3 (phi (sources (from (block_id 1) (read 2)) (from (block_id 2) (move 3)))))` - phi node

Operands can be:
- `(read n)` - read from resource n
- `(move n)` - move from resource n (consuming it)
- `(literal n)` - literal value n
- `(block_id n)` - block identifier n
- `(function_id n)` - function identifier n

Terminator instructions (drop, return, jump, branch) are not wrapped in `let`:
- `(drop (move 0))` - drop resource 0
- `(return (read 0))` - return resource 0
- `(jump (block_id 1))` - unconditionally jump to block 1
- `(branch (read 0) (block_id 1) (block_id 2))` - conditional branch

MIR is printed as tagged symbolic expressions. Structural nodes are expanded
over indented lines, with each `(blocks ...)` node containing explicit
`(block ...)` nodes, while instructions and operands remain inline. A
value-producing line is a `(let RESOURCE VALUE)` node, so its destination is
visible before the nested operation. In the JSON representation the same node
is `["let", RESOURCE, VALUE]`; both the definition and its value retain a tag at
index zero. Non-producing `drop` and terminator nodes remain direct block lines.

Resource uses and block IDs retain their tags, for example `(read 0)`,
`(move 0)`, `(literal 0)`, and `(block_id 1)`. Phi inputs and call operands are
wrapped in explicit variadic `(sources ...)` and `(arguments ...)` nodes:

```text
(program
  (function
    (parameters Int)
    (result Int)
    (locals (Owned Int))
    (blocks
      (block
        (let 0 (phi (sources (from (block_id 1) (read 2)) (from (block_id 2) (move 3)))))
        (let 1 (call (function_id 0) (arguments (read 0) (move 2))))
        (branch (literal 0) (block_id 1) (block_id 2)))
      (block
        (return (read 1))))))
```

### Lowering Pipeline

There are two independent micro-pass pipelines. `src/hir_to_lir/` contains the
existing named-register HIR pipeline described below. `src/mir_to_lir/`
validates and indexes MIR, splits and lowers phi edges, fuses bindings with
operations, materializes literals and consumes, emits flat LIR, and resolves
numeric function and block targets.

The pipeline entry point is [lower.gen.ts](/home/marco/Documents/ir/src/passes/lower.gen.ts). It runs these passes in order:

1. [split_phi_edges.gen.ts](/home/marco/Documents/ir/src/passes/split_phi_edges.gen.ts)
   Inserts edge blocks so each phi input arrives through its own predecessor edge.
2. [lower_phi_moves.gen.ts](/home/marco/Documents/ir/src/passes/lower_phi_moves.gen.ts)
   Replaces phi nodes with explicit `Copy` reads and writes in edge blocks.
3. [number_slots.gen.ts](/home/marco/Documents/ir/src/passes/number_slots.gen.ts)
   Assigns stable numeric stack slots to HIR registers.
4. [rewrite_named_to_numbered.gen.ts](/home/marco/Documents/ir/src/passes/rewrite_named_to_numbered.gen.ts)
   Rewrites named HIR instructions into numbered form while preserving `consume`.
5. [reserve_temporaries.gen.ts](/home/marco/Documents/ir/src/passes/reserve_temporaries.gen.ts)
   Records the first free temporary stack offset for each function.
6. [expand_consumes.gen.ts](/home/marco/Documents/ir/src/passes/expand_consumes.gen.ts)
   Lowers consumed inputs into explicit `Copy` and `Drop` instructions.
7. [emit_linear_lir.gen.ts](/home/marco/Documents/ir/src/passes/emit_linear_lir.gen.ts)
   Emits flat LIR with symbolic block and function targets.
8. [resolve_labels.gen.ts](/home/marco/Documents/ir/src/passes/resolve_labels.gen.ts)
   Resolves symbolic control-flow targets to concrete line numbers.

Other pass files:

- [mod.gen.ts](/home/marco/Documents/ir/src/passes/mod.gen.ts)
  Re-exports the lowering micro-passes.

- [types.gen.ts](/home/marco/Documents/ir/src/passes/types.gen.ts)
  Intermediate forms used between passes. Numbered and lower forms erase HIR type annotations.

### Analysis and Transformations

- [validate.ts](/home/marco/Documents/ir/src/analysis/validate.ts)
  Current validation entry point; delegates to [unique_variables.ts](/home/marco/Documents/ir/src/analysis/unique_variables.ts).

- [enumerate_blocks.ts](/home/marco/Documents/ir/src/transformations/enumerate_blocks.ts)
  Renames HIR block labels to numeric labels and rewrites terminator successors.

### Low-Level IR and Runtime

- [low_grammar.ts](/home/marco/Documents/ir/src/low/low_grammar.ts)
  Defines flat LIR:
  - programs and instructions
  - numeric stack offsets
  - concrete line-number control flow
  - metadata `noop` instructions
  - memory instructions
  - arithmetic and comparison instructions
  - control-flow instructions

- [machine.ts](/home/marco/Documents/ir/src/runtime/machine.ts)
  Executes LIR programs and returns a plain `number`.

- [stack.ts](/home/marco/Documents/ir/src/runtime/stack.ts)
  Runtime data model for:
  - values
  - pointers
  - dead slots
  - pointer generations

- [utility.ts](/home/marco/Documents/ir/src/utility.ts)
  Shared helpers such as `valid()`.

## Tests

- [high.test.ts](/home/marco/Documents/ir/test/high.test.ts)
  End-to-end HIR examples that lower and execute through the runtime.

- [print.gen.test.ts](/home/marco/Documents/ir/test/high/print.gen.test.ts)
  HIR pretty-printer coverage.

- [runtime.test.ts](/home/marco/Documents/ir/test/runtime.test.ts)
  Direct LIR runtime tests.

- `test/passes/`
  Full-pipeline and micro-pass tests.

- [enumerate_blocks.test.ts](/home/marco/Documents/ir/test/transformations/enumerate_blocks.test.ts)
  Transformation tests.

## Other Repo Areas

- `doc/`
  Design docs, invariants, grammar notes, and table of instructions.

- `id/`
  Generation of unique IDs for design decisions and invariants.

## Suggested Workflow

- HIR design or semantics:
  - start with [high_grammar.ts](/home/marco/Documents/ir/src/high/high_grammar.ts)
  - check [high.test.ts](/home/marco/Documents/ir/test/high.test.ts)
  - use `doc/` for design context

- Lowering:
  - start with [lower.gen.ts](/home/marco/Documents/ir/src/passes/lower.gen.ts)
  - inspect the ordered pass list above

- Runtime behavior:
  - start with [low_grammar.ts](/home/marco/Documents/ir/src/low/low_grammar.ts)
  - inspect [stack.ts](/home/marco/Documents/ir/src/runtime/stack.ts)
  - adjust [machine.ts](/home/marco/Documents/ir/src/runtime/machine.ts)

## Commands

- Run all tests: `deno test`
- Run HIR examples: `deno test test/high.test.ts`
- Run HIR printer tests: `deno test test/high/print.gen.test.ts`
- Run runtime tests: `deno test test/runtime.test.ts`
- Run all pass tests: `deno test test/passes`
- Run transformation tests: `deno test test/transformations`
