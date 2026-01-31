# Intermediate Representation

An interpreter for an intermediate representation (IR).
This IR is based on three-address code (3AC aka TAC) and static single-assignment (SSA) form.
Like all IRs, it sits between high-level languages such as C or TypeScript on one end, and Assembly on the other end.

## Getting Started

This project is implemented in TypeScript, using [Deno](https://deno.com/).
After setting up deno, just navigate into the root directory and install all dependencies using:

```
cd ir/
deno install
```

Build and run the tests with:
```
deno test
```

## More Information
- [Design of the Intermediate Representation](./design.md)
- [Log of Design Decisions](./decisions.md)

---
**Copyright (c) 2026 Marco Nikander**
