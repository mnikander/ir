# Repository Overview

This repository is now organized around a new split between:

- a high-level SSA-style IR in `src/high/`
- a lower-level register/offset-based IR in `src/low/`
- a register-machine runtime in `src/runtime/`

The older flat interpreter has been moved aside into `old_src/` and `test/old/`.

## Current Shape

The active codebase is no longer the old tuple-interpreter described in earlier docs.
The repo now looks like a compiler/runtime prototype with multiple layers:

1. High-level IR
   - structured by functions and blocks
   - intended to model the source-facing SSA form
   - lives in [high_grammar.ts](/home/marco/Documents/ir/src/high/high_grammar.ts)

2. Refactoring / transitional high-level grammar
   - older or alternate high-level grammar still kept in-tree
   - useful as a comparison/reference while the design settles
   - lives in [refactoring_grammar.ts](/home/marco/Documents/ir/src/high/refactoring_grammar.ts)

3. Low-level IR
   - linear instruction stream
   - uses numeric stack-frame offsets and line-number jumps/calls
   - lives in [low_grammar.ts](/home/marco/Documents/ir/src/low/low_grammar.ts)

4. Runtime
   - a register machine / stack machine hybrid that executes the low-level IR
   - lives in [machine.ts](/home/marco/Documents/ir/src/runtime/machine.ts)

## Important Files

- [README.md](/home/marco/Documents/ir/README.md)
  Short project intro and Deno commands. It still gives the project-level entry point, but the internal structure has evolved beyond the older interpreter layout.

- [design.md](/home/marco/Documents/ir/doc/design.md)
  High-level design goals for the IR family.

- [decisions.md](/home/marco/Documents/ir/doc/decisions.md)
  Decision log. This is the best place to understand why the architecture keeps shifting.

- [signatures.md](/home/marco/Documents/ir/doc/signatures.md)
  Human-readable instruction reference.

- [invariants.md](/home/marco/Documents/ir/doc/invariants.md)
  Intended invariants for valid IR programs.

## Source Layout

### High-Level IR

- [high_grammar.ts](/home/marco/Documents/ir/src/high/high_grammar.ts)
  Defines the main structured HIR:
  - `Program = Function[]`
  - `Function = { func, params, blocks }`
  - `Block = { block, joins, lines, terminator }`

  This grammar supports:
  - SSA-style phi nodes
  - ownership/pointer-oriented operations like `Define`, `Stack`, `Heap`, `Borrow`, `Dereference`, `Update`, `Drop`
  - arithmetic and comparison operations over `Input`
  - explicit block terminators

- [refactoring_grammar.ts](/home/marco/Documents/ir/src/high/refactoring_grammar.ts)
  Transitional/legacy HIR grammar that still looks closer to the older tuple-based interpreter model.
  It is useful when comparing the old and new representations.

- [factorial_example.ts](/home/marco/Documents/ir/src/high/factorial_example.ts)
  Small example HIR program for orientation.

### Low-Level IR

- [low_grammar.ts](/home/marco/Documents/ir/src/low/low_grammar.ts)
  Defines the LIR consumed by the runtime.

 Key traits:
  - `Program = Instruction[]`
  - includes a lightweight `Noop` instruction used for metadata/notes in programs and tests
  - registers are replaced by numeric `Offset`s
  - literal numbers are wrapped as `Primitive = { value: number }`
  - control flow targets are concrete `LineNumber`s
  - instructions are grouped into `Noop`, `Memory`, `Arithmetic`, `Comparison`, and `Control`

  Currently visible low-level operations include:
  - metadata: `Noop`
  - memory: `Constant`, `Copy`, `Load`, `Store`, `AddressOf`
  - arithmetic/comparison families
  - control: `Jump`, `Branch`, `Call`, `Return`

## Runtime

- [machine.ts](/home/marco/Documents/ir/src/runtime/machine.ts)
  Main evaluator for the low-level IR.

  Current runtime shape:
  - initializes the runtime through helpers in `stack.ts`
  - executes instructions by reading `pc` from the top control frame
  - stores runtime data in a flat data stack plus a separate control stack
  - uses small helper operations for arithmetic/comparison families instead of open-coded repetition
  - evaluates an LIR program down to a plain `number`

  Implemented today:
  - `Noop`
  - `Constant`
  - `Copy`
  - `Load`
  - `Store`
  - `AddressOf`
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
  - `Return`
  - `Call`

- [stack.ts](/home/marco/Documents/ir/src/runtime/stack.ts)
  Runtime data model and helpers.

  Important concepts:
  - `Stack = { data, control }`
  - `Frame = { return_address, base_address, pc, note? }`
  - runtime values are either `Value` or `Pointer`
  - `initialize_stack()` builds the initial exit frame and main-function frame
  - `is_executable()` controls the main evaluation loop
  - helper conversions `to_value()` and `to_pointer()` enforce runtime expectations

- [utility.ts](/home/marco/Documents/ir/src/utility.ts)
  Small shared helpers such as `valid()`.

## Tests

There are now multiple test layers:

- [runtime.test.ts](/home/marco/Documents/ir/test/runtime.test.ts)
  Main active runtime tests for the low-level register machine.
  These are the most important tests for current execution behavior.
  They now cover the arithmetic and comparison instruction families, memory operations, unconditional jump, branching, and function calls in the low-level machine.

- [high.test.ts](/home/marco/Documents/ir/test/high.test.ts)
  HIR-shape tests/examples.
  Many assertions are currently placeholders or commented out, which suggests this area is still under construction.

- [evaluate.test.ts](/home/marco/Documents/ir/test/old/evaluate.test.ts)
  Old interpreter tests preserved under `test/old/`.

Practical takeaway:
If you are changing the active evaluator, start with [runtime.test.ts](/home/marco/Documents/ir/test/runtime.test.ts), not the archived tests.

## Legacy / Archive

- `old_src/`
  Archived implementation of the earlier interpreter architecture.

  Notable files:
  - [analysis.ts](/home/marco/Documents/ir/old_src/analysis.ts)
  - [evaluate.ts](/home/marco/Documents/ir/old_src/evaluate.ts)
  - [state.ts](/home/marco/Documents/ir/old_src/state.ts)
  - [to_string.ts](/home/marco/Documents/ir/old_src/to_string.ts)

This folder is useful for reference and migration work, but it is no longer the primary implementation path.

## Other Repo Areas

- `doc/`
  Design docs, invariants, grammar notes, and instruction signatures.

- `id/`
  Small utility area for ID generation experiments.

- `notes.ignore.md`
  Scratch notes outside the main tracked architecture docs.

## Suggested Workflow

If we are working on the active runtime:

1. Read [low_grammar.ts](/home/marco/Documents/ir/src/low/low_grammar.ts) to confirm the exact instruction format.
2. Inspect [stack.ts](/home/marco/Documents/ir/src/runtime/stack.ts) to understand addressing and frame layout.
3. Implement runtime behavior in [machine.ts](/home/marco/Documents/ir/src/runtime/machine.ts).
4. Verify behavior in [runtime.test.ts](/home/marco/Documents/ir/test/runtime.test.ts).

If we are working on the HIR design:

1. Start with [high_grammar.ts](/home/marco/Documents/ir/src/high/high_grammar.ts).
2. Compare with [refactoring_grammar.ts](/home/marco/Documents/ir/src/high/refactoring_grammar.ts) when needed.
3. Use [design.md](/home/marco/Documents/ir/doc/design.md), [decisions.md](/home/marco/Documents/ir/doc/decisions.md), and [invariants.md](/home/marco/Documents/ir/doc/invariants.md) as the design context.

If we are tracing older behavior:

1. Check `old_src/` and `test/old/`.
2. Treat that code as reference material unless the task is explicitly about migration/cleanup.

## Commands

- Run all tests: `deno test`
- Run only runtime tests: `deno test test/runtime.test.ts`
- Run only HIR tests: `deno test test/high.test.ts`

## Notes For Future Work

- The repo now contains multiple IR layers, but only the low-level runtime is actively executable.
- The biggest source of confusion for future sessions will likely be the coexistence of:
  - active runtime code in `src/runtime/`
  - active-but-not-yet-executable HIR work in `src/high/`
  - archived interpreter code in `old_src/`
