# Intermediate Representation

An interpreter for an intermediate representation (IR). This IR is based on
three-address code (3AC aka TAC) and static single-assignment (SSA) form. Like
all IRs, it sits between high-level languages such as C or TypeScript on one
end, and Assembly on the other end.

This project actually contains two IRs, a high intermediate representation
([HIR](src/high/high_grammar.ts)) and a low intermediate representation
([LIR](src/low/low_grammar.ts)). The focus of the project is the HIR, which is
in SSA form and is designed for memory safety. The LIR is closer to assembly and
is used for execution on a virtual [machine](src/runtime/machine.ts). HIR has
type annotations for analysis; LIR does not.

There is no parser for the HIR. The input is in JSON form, not in text form. The
JSON input is verified by the TypeScript type-checker. There is a pretty-printer
which can convert an HIR into text, for better readablity.

## More Information

- [IR design](./doc/design.md)
- [Table of Instructions](./doc/instructions.md)
- [Log of design decisions for the interpreter and IR](./doc/decisions.md)
- [Overview](./OVERVIEW.md) which outlines the architecture and files

## Getting Started

This project is implemented in TypeScript, using [Deno](https://deno.com/).
After setting up deno, navigate into the directory of this repository and
install the required dependencies using:

```
cd ir/
deno install
```

Build and run the tests with:

```
deno test
```

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
