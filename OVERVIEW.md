# Repository Overview

This repository contains a TypeScript/Deno interpreter for a small intermediate
representation. MIR is the structured input representation used for analysis
and lowering. It is lowered through a micro-pass pipeline to flat, executable
LIR, which is interpreted by the runtime.

Programs are constructed directly as TypeScript values in a tagged JSON-like
form and checked by the TypeScript type checker; there is no parser. MIR also
has a pretty-printer for readable test fixtures and debugging. Files that are
completely AI-generated use the `*.gen.ts` or `*.gen.test.ts` suffix.

## Important Files

- [README.md](README.md)
  Short project introduction and common Deno commands.
- [design.md](doc/design.md)
  High-level design goals for the IR.
- [decisions.md](doc/decisions.md)
  Decision log for architectural changes.
- [instructions.md](doc/instructions.md)
  Human-readable instruction reference.
- [invariants.md](doc/invariants.md)
  Intended invariants for valid programs.

## Source Layout

### Middle-Level IR

- [middle_grammar.ts](src/middle/middle_grammar.ts)
  Defines MIR programs, functions, blocks, instructions, operands, and tagged
  structural nodes.
- [types.ts](src/middle/types.ts)
  Defines MIR value and ownership types.
- [print.gen.ts](src/middle/print.gen.ts)
  Pretty-prints MIR programs as canonical, indented symbolic expressions.

#### MIR Syntax

MIR represents every value-producing line as a tagged `let` tuple. The
destination resource precedes the operation in both symbolic-expression and
TypeScript forms:

```text
(let 2 (add (access 0) (access 1)))
["let", 2, ["add", ["access", 0], ["access", 1]]]
```

The general form is `(let RESOURCE OPERATION)`. For example:

- `(let 0 (copy (literal 42)))` loads the integer `42` into resource 0.
- `(let 1 (add (access 0) (consume 2)))` adds two operands and binds the
  result to resource 1.
- `(let 3 (phi (sources (from (block_id 1) (access 2)) (from (block_id 2) (consume 3)))))`
  selects a value based on the predecessor block.

Operands are `(access N)` for a non-consuming read, `(consume N)` for a
destructive move, and `(literal N)` for an immediate integer. Block and
function references use `(block_id N)` and `(function_id N)`.

`drop` and terminator instructions are direct block lines rather than `let`
bindings:

- `(drop 0)` drops resource 0.
- `(return (access 0))` returns a value.
- `(jump (block_id 1))` jumps unconditionally.
- `(branch (access 0) (block_id 1) (block_id 2))` branches conditionally.

Structural nodes are expanded over indented lines by the printer, while
instructions and operands remain inline. Variadic phi inputs and call operands
are wrapped in explicit `(sources ...)` and `(arguments ...)` nodes:

```text
(program
  (function
    (parameters Int)
    (result Int)
    (locals (Owned Int))
    (blocks
      (block
        (let 0 (phi (sources (from (block_id 1) (access 2)) (from (block_id 2) (consume 3)))))
        (let 1 (call (function_id 0) (arguments (access 0) (consume 2))))
        (branch (literal 0) (block_id 1) (block_id 2)))
      (block
        (return (access 1))))))
```

### MIR-to-LIR Lowering

The pipeline entry point is [lower.gen.ts](src/mir_to_lir/lower.gen.ts). It
runs these micro-passes in order:

1. [validate_and_index.gen.ts](src/mir_to_lir/validate_and_index.gen.ts)
   validates references and indexes MIR functions and blocks.
2. [split_phi_edges.gen.ts](src/mir_to_lir/split_phi_edges.gen.ts)
   inserts edge blocks so every phi input has its own predecessor edge.
3. [lower_phi_moves.gen.ts](src/mir_to_lir/lower_phi_moves.gen.ts)
   replaces phi nodes with explicit transfers in the edge blocks.
4. [lower_operations.gen.ts](src/mir_to_lir/lower_operations.gen.ts)
   lowers MIR operations and operands into flat LIR instructions with symbolic
   targets.
5. [resolve_targets.gen.ts](src/mir_to_lir/resolve_targets.gen.ts)
   resolves function and block targets to concrete instruction addresses.

[mod.gen.ts](src/mir_to_lir/mod.gen.ts) exports the individual passes, and
[types.gen.ts](src/mir_to_lir/types.gen.ts) defines their intermediate forms.

### Low-Level IR and Runtime

- [low_grammar.ts](src/low/low_grammar.ts)
  Defines flat LIR programs and instructions, numeric stack offsets, and
  concrete control-flow targets.
- [machine.ts](src/runtime/machine.ts)
  Executes LIR programs and returns a plain `number`.
- [stack.ts](src/runtime/stack.ts)
  Implements runtime values, pointers, dead slots, and pointer generations.
- [utility.ts](src/utility.ts)
  Provides shared helpers such as `valid()`.

## Tests

- [middle.test.ts](test/middle/middle.test.ts)
  End-to-end MIR lowering and execution tests for core instructions, control
  flow, calls, and SSA behavior.
- [memory.test.ts](test/middle/memory.test.ts)
  End-to-end MIR memory and ownership tests.
- [print.gen.test.ts](test/middle/print.gen.test.ts)
  MIR pretty-printer coverage.
- [passes.gen.test.ts](test/mir_to_lir/passes.gen.test.ts)
  MIR-to-LIR micro-pass tests.
- [runtime.test.ts](test/runtime.test.ts)
  Direct LIR runtime tests.

## Other Repository Areas

- `doc/`
  Design documents, invariants, the instruction reference, and architectural
  decisions.
- `id/`
  Utilities and state for generating unique design-decision and invariant IDs.

## Suggested Workflow

- For MIR syntax or semantics, start with
  [middle_grammar.ts](src/middle/middle_grammar.ts), then consult the MIR tests
  and `doc/`.
- For lowering behavior, start with
  [lower.gen.ts](src/mir_to_lir/lower.gen.ts), then inspect the ordered
  micro-passes above.
- For execution behavior, start with
  [low_grammar.ts](src/low/low_grammar.ts), [stack.ts](src/runtime/stack.ts), and
  [machine.ts](src/runtime/machine.ts).

## Commands

- Run all tests: `deno test`
- Run MIR end-to-end tests: `deno test test/middle`
- Run MIR-to-LIR pass tests: `deno test test/mir_to_lir`
- Run direct runtime tests: `deno test test/runtime.test.ts`
