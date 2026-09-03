# Table of Instructions and Type Signatures

| name              | symbols        | example                             | input type             |output type| comments |
| :---              | :---           | :---                                | :---                   | :---      | :--- |
|                   |                |                                     |                        |           | |
| **Special Forms** |                |                                     |                        |           | |
| Function          | `function`     | `function @identity [%1rg : Int] -> Int` |                   | Int       | function definition |
| Block             | `block`        | `block @entry`                      |                        |           | basic block definition |
| Phi               | `phi`          | `%0 = phi [@1, %1] [@2, %2]`        | [Label, Value]...      | Int       | SSA-style join |
| Call              | `call`         | `%0 = call @f [%1, (consume %2)]`   | Label, Value...        | Int       | function call |
|                   |                |                                     |                        |           | |
| **Memory**        |                |                                     |                        |           | |
| Constant          | `constant`     | `%0 = constant Int 42`              | Literal                | Int       | load a constant value |
| Copy              | `copy`         | `%0 = copy Int (consume %1)`        | Value                  | Int       | copy another register |
| Own               | `own`          | `%0 = own (Owned Int) %1`           | Value                  | Owned Int | create a pointer which takes exclusive ownership of a register |
| Borrow            | `borrow`       | `%0 = borrow  %1`                   | Value                  | Borrowed Int | create a pointer which is non-owning, i.e. read-only|
| Load              | `load`         | `%0 = load %1`                      | Pointer                | Int       | load a value via a pointer |
| Drop              | `drop`         | `%0 = drop`                         | Unit                   |           | destroy a register |
|                   |                |                                     |                        |           | |
| **Arithmetic**    |                |                                     |                        |           | |
| Add               | `add`          | `%0 = add %1 %2`                    | Int, Int               | Int       | |
| Subtract          | `subtract`     | `%0 = subtract %1 %2`               | Int, Int               | Int       | |
| Multiply          | `multiply`     | `%0 = multiply %1 %2`               | Int, Int               | Int       | |
| Divide            | `divide`       | `%0 = divide %1 %2`                 | Int, Int               | Int       | |
| Remainder         | `remainder`    | `%0 = remainder %1 %2`              | Int, Int               | Int       | |
| Minimum           | `minimum`      | `%0 = minimum %1 %2`                | Int, Int               | Int       | |
| Maximum           | `maximum`      | `%0 = maximum %1 %2`                | Int, Int               | Int       | |
| Negate            | `negate`       | `%0 = negate %1`                    | Int                    | Int       | |
|                   |                |                                     |                        |           | |
| **Comparison**    |                |                                     |                        |           | |
| Equal             | `equal`        | `%0 = equal %1 %2`                  | Int, Int               | Int       | |
| Unequal           | `unequal`      | `%0 = unequal %1 %2`                | Int, Int               | Int       | |
| Less              | `less`         | `%0 = less %1 %2`                   | Int, Int               | Int       | |
| LessEqual         | `less_equal`   | `%0 = less_equal %1 %2`             | Int, Int               | Int       | |
| Greater           | `greater`      | `%0 = greater %1 %2`                | Int, Int               | Int       | |
| GreaterEqual      | `greater_equal`| `%0 = greater_equal %1 %2`          | Int, Int               | Int       | |
|                   |                |                                     |                        |           | |
| **Terminator**    |                |                                     |                        |           | |
| Jump              | `jump`         | `jump @1`                           | Label                  |           | unconditional branch |
| Branch            | `branch`       | `branch (consume %3) @1 @2`         | Boolean, Label, Label  |           | conditional branch |
| Return            | `return`       | `return (consume %0)`               | Value                  |           | |
|                   |                |                                     |                        |           | |

## Notes
- `Boolean` is currently represented as `Int` with the value 0 or 1.
- HIR and MIR carry type annotations, but there is no type-checker yet.
- LIR does not carry type annotations.
- `Value` is either `Int` or a pointer type such as `(Owned Int)` or `(Borrowed Int)`.
- Arguments can be literal values, of used/moved variables.

---
**Copyright (c) 2026 Marco Nikander**
