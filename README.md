# Intermediate Representation

An interpreter for an intermediate representation (IR). This IR is based on
three-address code (3AC aka TAC) and inspired by WebAssembly, LLVM IR, and Rust
MIR. Like all IRs, it sits between high-level languages such as C or TypeScript
on one end, and Assembly on the other end.

This project contains middle ([MIR](src/middle/middle_grammar.ts)) and low
([LIR](src/low/low_grammar.ts)) intermediate representations. MIR is based on
symbolic expressions, has type information, and is intended for program
analysis. LIR is close to assembly and is used for execution on a virtual
[machine](src/low/machine.ts).

Programs are constructed directly as tagged tuples in TypeScript and checked by
the type checker. There is no parser. MIR has a pretty-printer for readable test
fixtures and debugging.

The MIR-to-LIR complilation pipeline is completely AI-generated, via
human-defined interfaces and human-defined end-to-end tests. It uses a
micro-pass architecture inspired by the Chez Scheme compiler.

## More Information

- [design.md](./doc/design.md) High-level design goals for the IR.
- [instructions.md](./doc/instructions.md) Human-readable instruction reference.
- [decisions.md](./doc/decisions.md) Log of design decisions.
- [invariants.md](doc/invariants.md) Intended invariants for valid programs.

## Getting Started

This project is implemented in TypeScript, using [Deno](https://deno.com/).
After setting up deno install the required dependencies and run the tests with:

```bash
cd ir/
deno install
deno test
```

Currently, there is no command-line interface, only tests.

## MIR Syntax

An MIR program is an array of functions, where the function with index 0 serves
as the entry point or 'main' function.

A simple example of an MIR program is given by:

```
(program
  (function
    (parameters)
    (locals Int)
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 42)))
        (return 0)))))
```

This defines an MIR program with a single function. That function takes no
parameters, has one local resource of type `Int` and returns a result of type
`Int`. The function consists of a single block of code. That block of code
defines resource #0 to have the constant value 42, and returns that resource.

Overall, there exist five fundamental syntactic forms in the body of an MIR
function. They are illustrated by these examples:

- `(let 0 (copy (literal 42)))` defines resource #0 with the value 42.
- `(drop 0)` drops resource #0.
- `(return 0)` returns a value from a function.
- `(jump (block_id 1))` jumps unconditionally.
- `(branch (access 0) (block_id 1) (block_id 2))` branches conditionally.

Every value-producing line takes the form of a let-binding. The general form is
`(let RESOURCE OPERATION)`. For example:

- `(let 0 (copy (literal 42)))` loads the integer `42` into resource 0.
- `(let 1 (add (access 0) (consume 2)))` adds two operands and binds the result
  to resource 1.
- `(let 2 (phi (sources (from (block_id 1) (access 2)) (from (block_id 2) (consume 3)))))`
  selects a value based on the predecessor block.
- `(let 3 (call (function_id 1) (arguments (access 0))))` calls function #1,
  pass resource #0 as an argument, and bind the result to resource #3.

Operands are `(access N)` for a non-consuming read, `(consume N)` for a
destructive move, and `(literal N)` for an immediate integer. Block and function
references use `(block_id N)` and `(function_id N)`.

### Symbolic expressions vs. JSON

The notation between symbolic expressions and JSON is slightly different. For
MIR, both notations are designed to have identical structure. Having a
straight-forward translation step makes it easier to reason about and write
test-cases in either form.

```text
(let 2 (add (access 0) (access 1)))
["let", 2, ["add", ["access", 0], ["access", 1]]]
```

### Formatting

Structural nodes are expanded over indented lines by the printer, while
instructions and operands remain inline. Variadic phi inputs and call operands
are wrapped in explicit `(sources ...)` and `(arguments ...)` nodes such that
every tuple is tagged. Example of canonical formatting:

```text
(program
  (function
    (parameters Int)
    (locals (Owned Int))
    (result Int)
    (blocks
      (block
        (let 0 (phi (sources (from (block_id 1) (access 2)) (from (block_id 2) (consume 3)))))
        (let 1 (call (function_id 0) (arguments (access 0) (consume 2))))
        (branch (literal 0) (block_id 1) (block_id 2)))
      (block
        (return 1)))))
```

## Source Layout

### Middle Intermediate Representation (MIR)

| File / Directory                                  | Description                                                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [middle_grammar.ts](src/middle/middle_grammar.ts) | Defines MIR programs, functions, blocks, instructions, operands, and tagged structural nodes. |
| [types.ts](src/middle/types.ts)                   | Defines MIR value and ownership types.                                                        |
| [print.gen.ts](src/middle/print.gen.ts)           | Pretty-prints MIR programs as canonical, indented symbolic expressions.                       |

### MIR-to-LIR Lowering

| File / Directory                                                         | Description                                                                             |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [lower.gen.ts](src/middle_to_low/lower.gen.ts)                           | The pipeline entry point. Runs micro-passes in order.                                   |
| [validate_and_index.gen.ts](src/middle_to_low/validate_and_index.gen.ts) | 1. Validates references and indexes MIR functions and blocks.                           |
| [split_phi_edges.gen.ts](src/middle_to_low/split_phi_edges.gen.ts)       | 2. Inserts edge blocks so every phi input has its own predecessor edge.                 |
| [lower_phi_moves.gen.ts](src/middle_to_low/lower_phi_moves.gen.ts)       | 3. Replaces phi nodes with explicit transfers in the edge blocks.                       |
| [lower_operations.gen.ts](src/middle_to_low/lower_operations.gen.ts)     | 4. Lowers MIR operations and operands into flat LIR instructions with symbolic targets. |
| [resolve_targets.gen.ts](src/middle_to_low/resolve_targets.gen.ts)       | 5. Resolves function and block targets to concrete instruction addresses.               |
| [mod.gen.ts](src/middle_to_low/mod.gen.ts)                               | Exports the individual passes.                                                          |
| [types.gen.ts](src/middle_to_low/types.gen.ts)                           | Defines intermediate forms for passes.                                                  |

### Low-Level IR and Runtime

| File / Directory                         | Description                                                                                           |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [low_grammar.ts](src/low/low_grammar.ts) | Defines flat LIR programs and instructions, numeric stack offsets, and concrete control-flow targets. |
| [machine.ts](src/low/machine.ts)         | Executes LIR programs and returns a plain `number`.                                                   |
| [stack.ts](src/low/stack.ts)             | Implements runtime values, pointers, dead slots, and pointer generations.                             |
| [utility.ts](src/utility.ts)             | Provides shared helpers such as `valid()`.                                                            |

### Tests

| File / Directory                                            | Description                                                                |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| [middle.test.ts](test/middle/middle.test.ts)                | End-to-end MIR tests for literals, exit, register copying, and arithmetic. |
| [control_flow.test.ts](test/middle/control_flow.test.ts)    | End-to-end MIR tests for jumps, branches, and phi joins.                   |
| [functions.test.ts](test/middle/functions.test.ts)          | End-to-end MIR tests for function calls.                                   |
| [memory.test.ts](test/middle/memory.test.ts)                | End-to-end MIR tests for memory and ownership.                             |
| [print.gen.test.ts](test/middle/print.gen.test.ts)          | MIR pretty-printer coverage.                                               |
| [passes.gen.test.ts](test/middle_to_low/passes.gen.test.ts) | MIR-to-LIR micro-pass tests.                                               |
| [runtime.test.ts](test/low/runtime.test.ts)                 | Direct LIR runtime tests.                                                  |

### Other Repository Areas

| File / Directory | Description                                                                           |
| ---------------- | ------------------------------------------------------------------------------------- |
| [doc/](doc/)     | Design documents, invariants, the instruction reference, and architectural decisions. |
| [id/](id/)       | Utilities and state for generating unique design-decision and invariant IDs.          |

## Commit Message Hook

This repo includes a tracked `commit-msg` hook in `.githooks/` that enforces
commit messages to start with one of these tags:

- `impl` for implementations of features
- `gen` for AI-generated features
- `fix`
- `ref` for refactoring
- `test`
- `doc`
- `tool` for linters, git config, CI/CD etc
- `proto` for prototyping (could also use impl/gen instead)

Enable it once per clone with:

```sh
git config core.hooksPath .githooks
chmod +x .githooks/commit-msg
```

Accepted examples:

```text
impl: stack underflow check
fix: correct program counter update
doc: clarify SSA invariants
```

---

**Copyright (c) 2026 Marco Nikander**
