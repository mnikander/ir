# Intermediate Representation

An interpreter for an intermediate representation (IR). This IR is based on
three-address code (3AC aka TAC) and static single-assignment (SSA) form. Like
all IRs, it sits between high-level languages such as C or TypeScript on one
end, and Assembly on the other end.

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
fix(runtime): correct program counter update
doc: clarify SSA invariants
```

## More Information

- [IR design](./doc/design.md)
- [Log of design decisions for the interpreter and IR](./doc/decisions.md)

---

**Copyright (c) 2026 Marco Nikander**
