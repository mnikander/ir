# MIR Instructions and Type Signatures

MIR uses tagged symbolic expressions.
Resources (i.e. variable) are identified by their zero indexed position in their respective function.
Functions and blocks are identified by their zero-based positions in their containing `program` and `blocks` nodes.
A complete function has the following structure:

```text
(function
  (parameters Int)
  (locals Int (Borrowed Int))
  (result Int)
  (blocks
    (block
      (let 0 (copy (constant 42)))
      (return 0))))
```

## Instructions

| Symbol   | Example                                         | Parameters                  | Comment                                                                        |
| :------- | :---------------------------------------------- | :-------------------------- | :----------------------------------------------------------------------------- |
| `let`    | `(let 0 (constant 42))`                         | `Resource, Operation`       | Define resource #0 with the value 42                                           |
| `drop`   | `(drop 0)`                                      | `Resource`                  | Destroy resource #0                                                            |
| `jump`   | `(jump (block_id 1))`                           | `BlockId`                   | Unconditional branch to block #1                                               |
| `branch` | `(branch (access 0) (block_id 1) (block_id 2))` | `Boolean, BlockId, BlockId` | Branch to block #1 when the condition is true, else branch to block #2         |
| `return` | `(return 0)`                                    | `T`                         | Return the value of resource #0 from the function                              |

## Value-Producing Operations

Every value-producing operation is bound to a resource with:
`(let RESOURCE (OPERATION OPERANDS...))`

| Symbol          | Example                                                                                  | Input                   | Output        | Comment                                |
| :-------------- | :--------------------------------------------------------------------------------------- | :---------------------- | :------------ | :------------------------------------- |
| `phi`           | `(let 0 (phi (sources (from (block_id 1) (access 2)) (from (block_id 2) (consume 3)))))` | `T...`                  | `T`           | SSA-style join                         |
| `call`          | `(let 0 (call (function_id 1) (arguments (access 1) (consume 2))))`                      | `T...`                  | `U`           | Function call                          |
| `borrow`        | `(let 0 (borrow (access 1)))`                                                            | `T`                     | `Borrowed T`  | Create a read-only, non-owning pointer |
| `load`          | `(let 0 (load (access 1)))`                                                              | `Borrowed T`            | `T`           | Load the value referenced by a pointer |
| `copy`          | `(let 0 (copy (constant 42)))`                                                           | `T`                     | `T`           | Copy an operand into a resource        |
| `add`           | `(let 0 (add (access 1) (constant 2)))`                                                  | `Int, Int`              | `Int`         |                                        |
| `subtract`      | `(let 0 (subtract (access 1) (consume 2)))`                                              | `Int, Int`              | `Int`         |                                        |
| `multiply`      | `(let 0 (multiply (access 1) (constant 2)))`                                             | `Int, Int`              | `Int`         |                                        |
| `divide`        | `(let 0 (divide (access 1) (consume 2)))`                                                | `Int, Int`              | `Int`         |                                        |
| `remainder`     | `(let 0 (remainder (access 1) (constant 2)))`                                            | `Int, Int`              | `Int`         |                                        |
| `minimum`       | `(let 0 (minimum (access 1) (consume 2)))`                                               | `Int, Int`              | `Int`         |                                        |
| `maximum`       | `(let 0 (maximum (access 1) (constant 2)))`                                              | `Int, Int`              | `Int`         |                                        |
| `negate`        | `(let 0 (negate (access 1)))`                                                            | `Int`                   | `Int`         |                                        |
| `equal`         | `(let 0 (equal (access 1) (constant 2)))`                                                | `Int, Int`              | `Boolean`     |                                        |
| `unequal`       | `(let 0 (unequal (access 1) (consume 2)))`                                               | `Int, Int`              | `Boolean`     |                                        |
| `less`          | `(let 0 (less (access 1) (constant 2)))`                                                 | `Int, Int`              | `Boolean`     |                                        |
| `less_equal`    | `(let 0 (less_equal (access 1) (consume 2)))`                                            | `Int, Int`              | `Boolean`     |                                        |
| `greater`       | `(let 0 (greater (access 1) (constant 2)))`                                              | `Int, Int`              | `Boolean`     |                                        |
| `greater_equal` | `(let 0 (greater_equal (access 1) (consume 2)))`                                         | `Int, Int`              | `Boolean`     |                                        |

## Operands and References

The resource's type is supplied by the function's `parameters` and `locals` lists.
Operands can access or consume a Resource, or they can be a constant (immediate) value.

| Symbol        | Example           | Meaning                                  |
| :------------ | :---------------- | :--------------------------------------- |
| `access`      | `(access 0)`      | Read resource 0 without consuming it     |
| `consume`     | `(consume 0)`     | Destructively move resource 0            |
| `constant`    | `(constant 42)`   | Immediate integer value                  |
| `function_id` | `(function_id 1)` | Function at index 1 in the program       |
| `block_id`    | `(block_id 1)`    | Block at index 1 in the current function |

## Notes

- Boolean results and branch conditions are represented as `Int`, using 0 for
  false and 1 for true.
- MIR carries type annotations in `parameters`, `result`, and `locals`, but no
  MIR type checker is currently implemented.

---
**Copyright (c) 2026 Marco Nikander**
