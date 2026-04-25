# Repository Overview

This repository is organized around three active layers:

- a high-level SSA-style IR in `src/high/`
- a lowering pipeline in `src/passes/`
- analysis/check helpers in `src/analysis/` and `src/check/`
- a low-level stack/register-oriented IR plus runtime in `src/low/` and `src/runtime/`

The older `old_src/` implementation has been removed, so the active codebase is the only architecture described here.

## Current Shape

The main execution path is:

1. build a program in HIR
2. eliminate phi nodes
3. rename HIR registers into numeric stack slots
4. reserve temporary stack slots for consumed inputs
5. expand consumed inputs into explicit copies and drops
6. linearize blocks/functions into flat LIR
7. resolve symbolic control-flow labels
8. execute the resulting LIR in the runtime

The entry point for that pipeline is [lower.gen.ts](/home/marco/Documents/ir/src/passes/lower.gen.ts).

## Important Files

- [README.md](/home/marco/Documents/ir/README.md)
  Short project intro and common Deno commands.

- [design.md](/home/marco/Documents/ir/doc/design.md)
  High-level design goals for the IR.

- [decisions.md](/home/marco/Documents/ir/doc/decisions.md)
  Decision log. This is the best place to understand why the architecture keeps shifting.

- [signatures.md](/home/marco/Documents/ir/doc/signatures.md)
  Human-readable instruction reference.

- [invariants.md](/home/marco/Documents/ir/doc/invariants.md)
  Intended invariants for valid programs.

## Source Layout

### High-Level IR

- [high_grammar.ts](/home/marco/Documents/ir/src/high/high_grammar.ts)
  Defines the structured HIR:
  - `Program = Function[]`
  - `Function = { name, params, blocks }`
  - `Block = { name, joins, lines, terminator }`

  Current HIR features:
  - SSA-style phi nodes in `joins`
  - line instructions including `Call`, `Constant`, `Assign`, arithmetic, comparison, and unary `Negate`
  - memory-oriented forms `Constant`, `Assign`, `Own`, `Borrow`, `Load`, and `Drop`
  - terminators `Jump`, `Branch`, and `Return`
  - inputs modeled as either `[register]` or `['consume', register]`

- [print.gen.ts](/home/marco/Documents/ir/src/high/print.gen.ts)
  Pretty-prints HIR programs for tests and debugging. The printer includes function params, calls, phi joins, consumes, memory operations, arithmetic/comparison operations, and terminators.

### Lowering Pipeline

- [lower.gen.ts](/home/marco/Documents/ir/src/passes/lower.gen.ts)
  Runs the full lowering pipeline from HIR to executable LIR.

- [mod.gen.ts](/home/marco/Documents/ir/src/passes/mod.gen.ts)
  Re-exports the lowering micro-passes.

- [split_phi_edges.gen.ts](/home/marco/Documents/ir/src/passes/split_phi_edges.gen.ts)
  Inserts edge blocks so each phi input arrives through its own predecessor edge.

- [lower_phi_moves.gen.ts](/home/marco/Documents/ir/src/passes/lower_phi_moves.gen.ts)
  Replaces phi nodes with explicit `Assign` reads and writes in the edge blocks.

- [number_slots.gen.ts](/home/marco/Documents/ir/src/passes/number_slots.gen.ts)
  Assigns stable numeric stack slots to HIR registers.

- [rewrite_named_to_numbered.gen.ts](/home/marco/Documents/ir/src/passes/rewrite_named_to_numbered.gen.ts)
  Rewrites named HIR instructions into numbered form while preserving `consume`.

- [reserve_temporaries.gen.ts](/home/marco/Documents/ir/src/passes/reserve_temporaries.gen.ts)
  Records the first free temporary stack offset for each function so consume expansion has scratch space that does not overlap params or destination slots.

- [expand_consumes.gen.ts](/home/marco/Documents/ir/src/passes/expand_consumes.gen.ts)
  Lowers consumed inputs into explicit `Copy` and `Drop` instructions.

- [emit_linear_lir.gen.ts](/home/marco/Documents/ir/src/passes/emit_linear_lir.gen.ts)
  Emits flat LIR with symbolic block and function targets.

- [resolve_labels.gen.ts](/home/marco/Documents/ir/src/passes/resolve_labels.gen.ts)
  Resolves symbolic control-flow targets to concrete line numbers.

- [types.gen.ts](/home/marco/Documents/ir/src/passes/types.gen.ts)
  Intermediate forms used between numbering, consume expansion, emission, and final label resolution.

### Analysis, Checks, and Transformations

- [validate.ts](/home/marco/Documents/ir/src/analysis/validate.ts)
  Current validation entry point. It delegates to unique-variable validation.

- [unique_variables.ts](/home/marco/Documents/ir/src/analysis/unique_variables.ts)
  Checks register uniqueness constraints for HIR programs.

- [lifecycle_lattice.ts](/home/marco/Documents/ir/src/check/lifecycle_lattice.ts)
  Small undefined/live/dead lattice used for lifecycle checking experiments.

- [build_cfg.ts](/home/marco/Documents/ir/src/check/build_cfg.ts)
  Builds a simple successor-only control-flow graph for a HIR function.

- [enumerate_blocks.ts](/home/marco/Documents/ir/src/transformations/enumerate_blocks.ts)
  Renames HIR block labels to numeric labels and rewrites terminator successors accordingly.

### Low-Level IR

- [low_grammar.ts](/home/marco/Documents/ir/src/low/low_grammar.ts)
  Defines the flat LIR consumed by the runtime.

  Key traits:
  - `Program = Instruction[]`
  - instructions use numeric `Offset`s instead of named registers
  - control flow uses concrete `LineNumber`s
  - includes metadata `Noop` instructions used for function/block notes

  Current LIR groups:
  - memory: `Constant`, `Copy`, `Load`, `Store`, `AddressOf`, `Drop`
  - arithmetic and comparison families
  - control: `Jump`, `Branch`, `Call`, `Return`

### Runtime

- [machine.ts](/home/marco/Documents/ir/src/runtime/machine.ts)
  Executes LIR programs and returns a plain `number`.

  Implemented runtime operations:
  - `Noop`
  - `Constant`
  - `Copy`
  - `Load`
  - `Store`
  - `AddressOf`
  - `Drop`
  - `Add`
  - `Subtract`
  - `Multiply`
  - `Divide`
  - `Remainder`
  - `Minimum`
  - `Maximum`
  - `Negate`
  - `Equal`
  - `Unequal`
  - `Less`
  - `LessEqual`
  - `Greater`
  - `GreaterEqual`
  - `Jump`
  - `Branch`
  - `Call`
  - `Return`

- [stack.ts](/home/marco/Documents/ir/src/runtime/stack.ts)
  Runtime data model and helpers.
  It tracks values, pointers, dead slots, and pointer generations.

- [utility.ts](/home/marco/Documents/ir/src/utility.ts)
  Shared helpers such as `valid()`.

## Tests

The current test suite is split by layer:

- [high.test.ts](/home/marco/Documents/ir/test/high.test.ts)
  End-to-end HIR examples that lower and execute through the runtime.

- [print.gen.test.ts](/home/marco/Documents/ir/test/high/print.gen.test.ts)
  HIR pretty-printer coverage.

- [runtime.test.ts](/home/marco/Documents/ir/test/runtime.test.ts)
  Direct LIR runtime tests covering memory operations, arithmetic/comparison behavior, control flow, and calls.

- [lower.gen.test.ts](/home/marco/Documents/ir/test/passes/lower.gen.test.ts)
  Tests the full HIR-to-LIR lowering pipeline.

- [passes.gen.test.ts](/home/marco/Documents/ir/test/passes/passes.gen.test.ts)
  Tests pass-level behavior that spans several micro-passes.

- [phi.gen.test.ts](/home/marco/Documents/ir/test/passes/phi.gen.test.ts)
  Tests predecessor collection and phi elimination.

- [split_phi_edges.gen.test.ts](/home/marco/Documents/ir/test/passes/split_phi_edges.gen.test.ts), [lower_phi_moves.gen.test.ts](/home/marco/Documents/ir/test/passes/lower_phi_moves.gen.test.ts), [number_slots.gen.test.ts](/home/marco/Documents/ir/test/passes/number_slots.gen.test.ts), [expand_consumes.gen.test.ts](/home/marco/Documents/ir/test/passes/expand_consumes.gen.test.ts), and [resolve_labels.gen.test.ts](/home/marco/Documents/ir/test/passes/resolve_labels.gen.test.ts)
  Focused tests for individual lowering micro-passes.

- [enumerate_blocks.test.ts](/home/marco/Documents/ir/test/transformations/enumerate_blocks.test.ts)
  Tests block-label enumeration and successor rewriting.

Several test files were renamed compared with earlier repo states, so these are the current names to use.

## Other Repo Areas

- `doc/`
  Design docs, invariants, grammar notes, and signatures.

- `id/`
  Small utility area for ID generation experiments.

## Suggested Workflow

If we are working on HIR design or semantics:

1. Read [high_grammar.ts](/home/marco/Documents/ir/src/high/high_grammar.ts).
2. Check [high.test.ts](/home/marco/Documents/ir/test/high.test.ts) for concrete examples.
3. Use the docs in [doc/](/home/marco/Documents/ir/doc/design.md) for design context.

If we are working on lowering:

1. Start at [lower.gen.ts](/home/marco/Documents/ir/src/passes/lower.gen.ts).
2. Inspect the micro-pass exports in [mod.gen.ts](/home/marco/Documents/ir/src/passes/mod.gen.ts).
3. Inspect slot numbering in [number_slots.gen.ts](/home/marco/Documents/ir/src/passes/number_slots.gen.ts) and [rewrite_named_to_numbered.gen.ts](/home/marco/Documents/ir/src/passes/rewrite_named_to_numbered.gen.ts).
4. Inspect temporary reservation in [reserve_temporaries.gen.ts](/home/marco/Documents/ir/src/passes/reserve_temporaries.gen.ts), consume lowering in [expand_consumes.gen.ts](/home/marco/Documents/ir/src/passes/expand_consumes.gen.ts), flat emission in [emit_linear_lir.gen.ts](/home/marco/Documents/ir/src/passes/emit_linear_lir.gen.ts), and target resolution in [resolve_labels.gen.ts](/home/marco/Documents/ir/src/passes/resolve_labels.gen.ts).
5. Verify behavior in [lower.gen.test.ts](/home/marco/Documents/ir/test/passes/lower.gen.test.ts), [passes.gen.test.ts](/home/marco/Documents/ir/test/passes/passes.gen.test.ts), and [phi.gen.test.ts](/home/marco/Documents/ir/test/passes/phi.gen.test.ts).

If we are working on execution behavior:

1. Read [low_grammar.ts](/home/marco/Documents/ir/src/low/low_grammar.ts).
2. Inspect [stack.ts](/home/marco/Documents/ir/src/runtime/stack.ts).
3. Implement or adjust behavior in [machine.ts](/home/marco/Documents/ir/src/runtime/machine.ts).
4. Verify it in [runtime.test.ts](/home/marco/Documents/ir/test/runtime.test.ts).

## Commands

- Run all tests: `deno test`
- Run only HIR examples: `deno test test/high.test.ts`
- Run only runtime tests: `deno test test/runtime.test.ts`
- Run only lowering tests: `deno test test/passes/lower.gen.test.ts`
- Run only pass-level tests: `deno test test/passes/passes.gen.test.ts`
- Run only phi-elimination tests: `deno test test/passes/phi.gen.test.ts`
- Run HIR printer tests: `deno test test/high/print.gen.test.ts`
- Run all pass tests: `deno test test/passes`
- Run transformation tests: `deno test test/transformations`

## Notes

- The active executable path is HIR -> lowering passes -> LIR -> runtime.
- `consume` is part of the HIR input model and is lowered explicitly.
- Every current HIR line instruction and terminator is lowered to LIR.
