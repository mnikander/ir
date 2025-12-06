# Intermediate Representation

An interpreter for an intermediate representation (IR).
The intermediate representation is based on three-address code.
Like all IRs, it sits between high-level languages such as C or TypeScript on one end and Assembly on the other end.

## Getting started

This project is implemented in TypeScript, using [Deno](https://deno.com/).
Unit testing is done using the behavior driven development package which can be installed with:

```
deno add jsr:@std/testing/bdd
```

Build and run the tests with:
```
deno test
```
