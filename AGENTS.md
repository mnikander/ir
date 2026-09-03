# Agents

- Any change that affects structure, modules, or responsibilities must update
  README.md in the same commit.
- Any change that affects the middle (MIR) grammar's instruction set, type
  signatures, or printed surface syntax must update doc/instructions.md in the
  same commit.
- Files which are completely AI-generated use the `*.gen.ts` or `*.gen.test.ts`
  suffix.

## Suggested Workflow

- For MIR syntax or semantics, start with
  [middle_grammar.ts](src/middle/middle_grammar.ts), then consult the MIR tests
  in `tests/middle/` and `doc/`.
- For lowering behavior, start with [lower.gen.ts](src/mir_to_lir/lower.gen.ts),
  then inspect the micro-passes described in the readme.
- For execution behavior, start with [low_grammar.ts](src/low/low_grammar.ts),
  [stack.ts](src/low/stack.ts), and [machine.ts](src/low/machine.ts).

## Commands

- Run all tests: `deno test`
- Run MIR end-to-end tests: `deno test test/middle`
- Run MIR-to-LIR pass tests: `deno test test/mir_to_lir`
- Run direct runtime tests: `deno test test/runtime.test.ts`
- Run linter: `deno lint`
- Run formatter: `deno fmt`
