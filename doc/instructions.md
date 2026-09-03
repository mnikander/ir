# MIR Instructions and Type Signatures

MIR uses tagged symbolic expressions.
Resources (i.e. variable) are identified by their zero indexed position in their respective function.
Functions and blocks are identified by their zero-based positions in their containing `program` and `blocks` nodes.
A complete function has the following structure:

```text
(function
  (parameters Int)
  (result Int)
  (locals Int (Owned Int))
  (blocks
    (block
      (let 0 (copy (literal 42)))
      (return (access 0)))))
```

## Instructions

| Name   | Symbol   | Example                                         | Parameters                  | Comment                                                                        |
| :----- | :------- | :---------------------------------------------- | :-------------------------- | :----------------------------------------------------------------------------- |
| Let    | `let`    | `(let 0 (literal 42))`                          | `Resource, Operation`       | Define resource #0 with the value 42                                           |
| Drop   | `drop`   | `(drop 0)`                                      | `Resource`                  | Destroy resource #0                                                            |
| Jump   | `jump`   | `(jump (block_id 1))`                           | `BlockId`                   | Unconditional branch to block #1                                               |
| Branch | `branch` | `(branch (access 0) (block_id 1) (block_id 2))` | `Boolean, BlockId, BlockId` | Branch to block #1 when the condition is true, else branch to block #2         |
| Return | `return` | `(return (consume 0))`                          | `T`                         | Return the value of resource #0 from the function                              |

## Value-Producing Operations

Every value-producing operation is bound to a resource with:
`(let RESOURCE (OPERATION OPERANDS...))`

| Name          | Symbol          | Example                                                                                  | Input                   | Output        | Comment                                |
| :------------ | :-------------- | :--------------------------------------------------------------------------------------- | :---------------------- | :------------ | :------------------------------------- |
| Phi           | `phi`           | `(let 0 (phi (sources (from (block_id 1) (access 2)) (from (block_id 2) (consume 3)))))` | `T...`                  | `T`           | SSA-style join                         |
| Call          | `call`          | `(let 0 (call (function_id 1) (arguments (access 1) (consume 2))))`                      | `T...`                  | `U`           | Function call                          |
| Own           | `own`           | `(let 0 (own (consume 1)))`                                                              | `T`                     | `Owned T`     | Create an exclusively owning pointer   |
| Borrow        | `borrow`        | `(let 0 (borrow (access 1)))`                                                            | `T`                     | `Borrowed T`  | Create a read-only, non-owning pointer |
| Dereference   | `dereference`   | `(let 0 (dereference (access 1)))`                                                       | `Owned T \| Borrowed T` | `T`           | Load the value referenced by a pointer |
| Copy          | `copy`          | `(let 0 (copy (literal 42)))`                                                            | `T`                     | `T`           | Copy an operand into a resource        |
| Add           | `add`           | `(let 0 (add (access 1) (literal 2)))`                                                   | `Int, Int`              | `Int`         |                                        |
| Subtract      | `subtract`      | `(let 0 (subtract (access 1) (consume 2)))`                                              | `Int, Int`              | `Int`         |                                        |
| Multiply      | `multiply`      | `(let 0 (multiply (access 1) (literal 2)))`                                              | `Int, Int`              | `Int`         |                                        |
| Divide        | `divide`        | `(let 0 (divide (access 1) (consume 2)))`                                                | `Int, Int`              | `Int`         |                                        |
| Remainder     | `remainder`     | `(let 0 (remainder (access 1) (literal 2)))`                                             | `Int, Int`              | `Int`         |                                        |
| Minimum       | `minimum`       | `(let 0 (minimum (access 1) (consume 2)))`                                               | `Int, Int`              | `Int`         |                                        |
| Maximum       | `maximum`       | `(let 0 (maximum (access 1) (literal 2)))`                                               | `Int, Int`              | `Int`         |                                        |
| Negate        | `negate`        | `(let 0 (negate (access 1)))`                                                            | `Int`                   | `Int`         |                                        |
| Equal         | `equal`         | `(let 0 (equal (access 1) (literal 2)))`                                                 | `Int, Int`              | `Boolean`     |                                        |
| Unequal       | `unequal`       | `(let 0 (unequal (access 1) (consume 2)))`                                               | `Int, Int`              | `Boolean`     |                                        |
| Less          | `less`          | `(let 0 (less (access 1) (literal 2)))`                                                  | `Int, Int`              | `Boolean`     |                                        |
| Less Equal    | `less_equal`    | `(let 0 (less_equal (access 1) (consume 2)))`                                            | `Int, Int`              | `Boolean`     |                                        |
| Greater       | `greater`       | `(let 0 (greater (access 1) (literal 2)))`                                               | `Int, Int`              | `Boolean`     |                                        |
| Greater Equal | `greater_equal` | `(let 0 (greater_equal (access 1) (consume 2)))`                                         | `Int, Int`              | `Boolean`     |                                        |

## Operands and References

The resource's type is supplied by the function's `parameters` and `locals` lists.
Operands can access or consume a Resource, or they can be a literal (immediate) value.

| Name        | Symbol        | Example           | Meaning                                  |
| :---------- | :------------ | :---------------- | :--------------------------------------- |
| Access      | `access`      | `(access 0)`      | Read resource 0 without consuming it     |
| Consume     | `consume`     | `(consume 0)`     | Destructively move resource 0            |
| Literal     | `literal`     | `(literal 42)`    | Immediate integer value                  |
| Function ID | `function_id` | `(function_id 1)` | Function at index 1 in the program       |
| Block ID    | `block_id`    | `(block_id 1)`    | Block at index 1 in the current function |

## Notes

- Boolean results and branch conditions are represented as `Int`, using 0 for
  false and 1 for true.
- MIR carries type annotations in `parameters`, `result`, and `locals`, but no
  MIR type checker is currently implemented.

---
**Copyright (c) 2026 Marco Nikander**
