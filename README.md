# Intermediate Representation

An interpreter for an intermediate representation (IR).
This IR is based on three-address code (3AC aka TAC) and static single-assignment (SSA) form.
Like all IRs, it sits between high-level languages such as C or TypeScript on one end, and Assembly on the other end.

## Getting Started

This project is implemented in TypeScript, using [Deno](https://deno.com/).
After setting up deno, navigate into the directory of this repository and install the required dependencies using:

```
cd ir/
deno install
```

Build and run the tests with:
```
deno test
```

You can run the pretty-printing example with:
```
deno run misc/print_ir.ts
```

## Commit Message Hook

This repo includes a tracked `commit-msg` hook in `.githooks/` that enforces
commit messages to start with one of these tags:

- `feat`
- `fix`
- `doc`
- `ref`
- `tool`
- `proto`

Enable it once per clone with:

```sh
git config core.hooksPath .githooks
chmod +x .githooks/commit-msg
```

Accepted examples:

```text
feat: add stack underflow check
fix(runtime): correct program counter update
doc: clarify SSA invariants
```

## More Information
- [IR design](./doc/design.md)
- [Log of design decisions for the interpreter and IR](./doc/decisions.md)

---
**Copyright (c) 2026 Marco Nikander**
