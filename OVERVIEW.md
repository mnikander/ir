# Repository Overview

This repository is a Deno/TypeScript prototype for an SSA-style intermediate representation (IR) and its interpreter.
The current executable implementation lives in `src/` and operates on a flat instruction stream.
The material in `proto/` is not used by the runtime yet; it captures the intended future direction for the IR.

## Working Model

There are effectively two IR layers in the repo:

1. Current interpreter path
   - Defined in [src/instructions.ts](/home/marco/Documents/ir/src/instructions.ts)
   - Programs are `Instruction[]`
   - Entry point must begin with `@entry`
   - Main pipeline is `analyze(program)` then `evaluate(program)`
   - This is the only implementation currently in use

2. Prototype redesign
   - Defined in [proto/grammar.ts](/home/marco/Documents/ir/proto/grammar.ts) and [proto/ast.ts](/home/marco/Documents/ir/proto/ast.ts)
   - Programs are structured as functions with nested blocks
   - Adds the newer ownership/storage ideas described in [design.md](/home/marco/Documents/ir/design.md)
   - This is future-facing design work and is not yet wired into the runtime in `src/`

## Important Files

- [README.md](/home/marco/Documents/ir/README.md)
  Short project intro and basic Deno commands.

- [design.md](/home/marco/Documents/ir/design.md)
  High-level IR goals: SSA, ownership/lifetime tracking, compilation-target motivation.

- [decisions.md](/home/marco/Documents/ir/decisions.md)
  Chronological design log. The most important recent note is decision 024 on `2026-04-05`, which says the IR and implementation are being overhauled.

- [signatures.md](/home/marco/Documents/ir/signatures.md)
  Human-readable instruction set reference for the current interpreter. Some entries are still aspirational and broader than what `src/` currently implements.

## Runtime Architecture

### Instruction definitions

- [src/instructions.ts](/home/marco/Documents/ir/src/instructions.ts)
  Defines the current tuple-based IR.
  Key instruction groups:
  - structure: `Function`, `Block`
  - data: `Const`, `Copy`, `Move`, `Ref`, `Deref`
  - arithmetic: `Add`, `Subtract`, `Multiply`, `Divide`, `Remainder`, `Minimum`, `Maximum`, `Negate`
  - comparison: `Equal`, `Unequal`, `Less`, `LessEqual`, `Greater`, `GreaterEqual`
  - control flow: `Jump`, `Branch`, `Return`, `Exit`
  - SSA merge: `Phi`

### Static analysis

- [src/analysis.ts](/home/marco/Documents/ir/src/analysis.ts)
  Performs lightweight validation and graph construction.
  Current responsibilities:
  - single-assignment check for destination registers and function parameters
  - collect block/function labels
  - build adjacency list and CFG
  - compute reachability
  - compute a table of contents mapping labels to instruction index ranges

  Important note:
  `analyze()` currently computes several structures mainly as validation and then returns the original `Program` unchanged.

### Interpreter

- [src/evaluate.ts](/home/marco/Documents/ir/src/evaluate.ts)
  Main execution loop. It:
  - builds a table of contents from labels to instruction ranges
  - initializes interpreter state
  - dispatches instructions by tag
  - rethrows errors with the current line number attached

- [src/state.ts](/home/marco/Documents/ir/src/state.ts)
  Holds the operational semantics for each instruction and the runtime state shape.
  Runtime model:
  - explicit call stack of frames
  - each frame stores a `Map<Register, Value | Reference>`
  - `pc`, `current_block`, and `previous_block` drive control flow and phi resolution

### Utilities

- [src/type_assertions.ts](/home/marco/Documents/ir/src/type_assertions.ts)
  Small runtime guards such as `valid`, `get_number`, and `get_boolean`.

- [src/to_string.ts](/home/marco/Documents/ir/src/to_string.ts)
  Pretty-printer for the current flat IR.

- [misc/print_ir.ts](/home/marco/Documents/ir/misc/print_ir.ts)
  Example program that prints a factorial IR snippet using `to_string`.

## Tests

- [test/evaluate.test.ts](/home/marco/Documents/ir/test/evaluate.test.ts)
  Main behavioral test suite for the current interpreter.

The tests currently cover:
- empty/invalid programs
- `@entry` and `Exit` requirements
- constants and copies
- arithmetic
- block structure, jumps, and branches
- function calls
- static single-assignment checks and phi behavior
- memory and ownership behavior (`ref`, `deref`, `drop`, `move`)
- CFG-related helper expectations

Current note:
The newly added arithmetic/comparison operations are implemented in `src/`, but do not yet have dedicated tests in [test/evaluate.test.ts](/home/marco/Documents/ir/test/evaluate.test.ts).

When changing `src/`, this file is the first place to check for intended behavior.

## Current Design Tension

The repository has a clear present-vs-future split:

- `src/` is the active implementation
- `proto/` and recent decisions describe a newer structured IR with different ownership/storage semantics
- [proto/ast.ts](/home/marco/Documents/ir/proto/ast.ts) and [proto/grammar.ts](/home/marco/Documents/ir/proto/grammar.ts) are design/prototyping artifacts for future work

Practical takeaway:
Unless a task is explicitly about future design, treat `src/` as the source of truth.

## Suggested Workflow

If we are working on the current interpreter:

1. Start with [src/instructions.ts](/home/marco/Documents/ir/src/instructions.ts) to confirm the exact tuple shape.
2. Inspect [src/analysis.ts](/home/marco/Documents/ir/src/analysis.ts) if labels, SSA checks, or CFG behavior are involved.
3. Implement execution changes in [src/state.ts](/home/marco/Documents/ir/src/state.ts) and dispatch changes in [src/evaluate.ts](/home/marco/Documents/ir/src/evaluate.ts).
4. Update or add tests in [test/evaluate.test.ts](/home/marco/Documents/ir/test/evaluate.test.ts).

If we are working on the redesign:

1. Read [design.md](/home/marco/Documents/ir/design.md) and the latest entries in [decisions.md](/home/marco/Documents/ir/decisions.md).
2. Use [proto/ast.ts](/home/marco/Documents/ir/proto/ast.ts) and/or [proto/grammar.ts](/home/marco/Documents/ir/proto/grammar.ts) as the source of truth for the next shape.
3. Expect separate follow-up implementation work to be needed in `src/`, because the current runtime does not consume the new structured form yet.

## Commands

- Run tests: `deno test`
- Run the example printer: `deno run misc/print_ir.ts`

## Notes For Future Work

- The repo already documents intent well in prose; the main challenge is keeping the active `src/` implementation clearly separated from the evolving `proto/` design work.
- If we start making larger changes, this file can become the quick “where things are now” checkpoint for future sessions.
