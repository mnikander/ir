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

## More Information
- [IR design](./design.md)
- [Log of design decisions for the interpreter and IR](./decisions.md)

---
**Copyright (c) 2026 Marco Nikander**
