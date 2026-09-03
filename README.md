# Intermediate Representation

An interpreter for an intermediate representation (IR). This IR is based on
three-address code (3AC aka TAC) and static single-assignment (SSA) form. Like
all IRs, it sits between high-level languages such as C or TypeScript on one
end, and Assembly on the other end.

This project contains middle ([MIR](src/middle/middle_grammar.ts)) and low
([LIR](src/low/low_grammar.ts)) intermediate representations. MIR is based on
symbolic expressions and has type information needed for analysis. LIR is close
to assembly and executable.

There is no parser for LIR or MIR. The input is in JSON form, not in text form.
The JSON input is verified by the TypeScript type-checker. There is a
pretty-printer which can convert an MIR into text, for better readablity.

The LIR is closer to assembly than MIR and is used for execution on a virtual
[machine](src/runtime/machine.ts). The MIR-to-LIR complilation pipeline uses a
micro-pass architecture inspired by the Chez Scheme compiler.

## More Information

- [design.md](./doc/design.md) High-level design goals for the IR.
- [instructions.md](./doc/instructions.md) Human-readable instruction reference.
- [decisions.md](./doc/decisions.md) Decision log for architectural changes.
- [invariants.md](doc/invariants.md) Intended invariants for valid programs.

## Getting Started

This project is implemented in TypeScript, using [Deno](https://deno.com/).
After setting up deno, navigate into the directory of this repository and
install the required dependencies using:

```bash
cd ir/
deno install
```

Build and run the tests with:

```bash
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
