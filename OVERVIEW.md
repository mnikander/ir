# Repository Overview

This repository is organized around three active layers:

- a high-level SSA-style IR in `src/high/`
- a lowering pipeline in `src/passes/`
- a low-level stack/register-oriented IR plus runtime in `src/low/` and `src/runtime/`

The older `old_src/` implementation has been removed, so the active codebase is the only architecture described here.

## Current Shape

The main execution path is:

1. build a program in HIR
2. eliminate phi nodes
3. rename HIR registers into numeric stack slots
4. linearize blocks/functions into flat LIR
5. execute the resulting LIR in the runtime

The entry point for that pipeline is [lower.ts](/home/marco/Documents/ir/src/passes/lower.ts).

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
  - line instructions including `Call`, `Constant`, `Assign`, arithmetic, and comparisons
  - memory-oriented forms `Constant`, `Assign`, `Own`, `Borrow`, `Load`, and `Drop`
  - terminators `Jump`, `Branch`, and `Return`
  - inputs modeled as either `[register]` or `['consume', register]`

### Lowering Pipeline

- [lower.ts](/home/marco/Documents/ir/src/passes/lower.ts)
  Runs phi elimination, register renaming, and linearization.

- [phi_elimination/mod.gen.ts](/home/marco/Documents/ir/src/passes/phi_elimination/mod.gen.ts)
  Eliminates phi nodes by inserting edge-splitting blocks and `Assign` instructions.

- [lowering/rename.gen.ts](/home/marco/Documents/ir/src/passes/lowering/rename.gen.ts)
  Maps HIR registers to numeric LIR offsets.
  It preserves `consume` on inputs for later lowering.

- [lowering/linearize.gen.ts](/home/marco/Documents/ir/src/passes/lowering/linearize.gen.ts)
  Emits flat LIR with concrete line-number targets.
  `consume` lowering is implemented here:
  - consumed `Assign`, arithmetic operands, and call arguments become `Copy` plus `Drop`
  - consumed `Branch` and `Return` inputs are first materialized into temporaries so control-flow targets remain correct

- [lowering/types.gen.ts](/home/marco/Documents/ir/src/passes/lowering/types.gen.ts)
  Intermediate numbered representation used between renaming and final LIR emission.

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

- [runtime.test.ts](/home/marco/Documents/ir/test/runtime.test.ts)
  Direct LIR runtime tests covering memory operations, arithmetic/comparison behavior, control flow, and calls.

- [lower.gen.test.ts](/home/marco/Documents/ir/test/passes/lower.gen.test.ts)
  Tests the full HIR-to-LIR lowering pipeline.

- [passes.gen.test.ts](/home/marco/Documents/ir/test/passes/passes.gen.test.ts)
  Tests register renaming and linearization in isolation.

- [phi.gen.test.ts](/home/marco/Documents/ir/test/passes/phi.gen.test.ts)
  Tests predecessor collection and phi elimination.

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

1. Start at [lower.ts](/home/marco/Documents/ir/src/passes/lower.ts).
2. Inspect phi elimination in [mod.gen.ts](/home/marco/Documents/ir/src/passes/phi_elimination/mod.gen.ts).
3. Inspect slot assignment in [rename.gen.ts](/home/marco/Documents/ir/src/passes/lowering/rename.gen.ts).
4. Inspect final emission in [linearize.gen.ts](/home/marco/Documents/ir/src/passes/lowering/linearize.gen.ts).
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

## Notes

- The active executable path is HIR -> lowering passes -> LIR -> runtime.
- `consume` is part of the HIR input model and is lowered explicitly.
- Every current HIR line instruction and terminator is lowered to LIR.
