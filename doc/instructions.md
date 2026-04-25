# Table of Instructions and Type Signatures

| name              | symbols        | example                             | input type             |output type| comments |
| :---              | :---           | :---                                | :---                   | :---      | :--- |
|                   |                |                                     |                        |           | |
| **Special Forms** |                |                                     |                        |           | |
| Function          | `function`     | `function @identity [%arg]:`        |                        |           | function definition |
| Block             | `block`        | `block @entry:`                     |                        |           | basic block definition |
| Phi               | `phi`          | `%x = phi [[@left %l] [@right %r]]` | Array<[Label Value]>   | Value     | SSA-style join |
| Call              | `call`         | `%x = call @f [%a (consume %b)]`    | Label, Array<Value>    | Value     | function call |
|                   |                |                                     |                        |           | |
| **Memory**        |                |                                     |                        |           | |
| Constant          | `constant`     | `%x = constant 42`                  | Literal                | Integer   | load a constant value |
| Copy              | `copy`         | `%x = copy (consume %a)`            | Value                  | Value     | copy another register |
| Own               | `own`          | `%x = own %a`                       | Value                  | Pointer   | create a pointer which takes exclusive ownership of a register |
| Borrow            | `borrow`       | `%x = borrow %a`                    | Value                  | Pointer   | create a pointer which is non-owning, i.e. read-only|
| Load              | `load`         | `%x = load %ptr`                    | Pointer                | Value     | load a value via a pointer |
| Drop              | `drop`         | `%x = drop`                         | Unit                   |           | destroy a register |
|                   |                |                                     |                        |           | |
| **Arithmetic**    |                |                                     |                        |           | |
| Add               | `add`          | `%x = add %a %b`                    | Integer, Integer       | Integer   | |
| Subtract          | `subtract`     | `%x = subtract %a %b`               | Integer, Integer       | Integer   | |
| Multiply          | `multiply`     | `%x = multiply %a %b`               | Integer, Integer       | Integer   | |
| Divide            | `divide`       | `%x = divide %a %b`                 | Integer, Integer       | Integer   | |
| Remainder         | `remainder`    | `%x = remainder %a %b`              | Integer, Integer       | Integer   | |
| Minimum           | `minimum`      | `%x = minimum %a %b`                | Integer, Integer       | Integer   | |
| Maximum           | `maximum`      | `%x = maximum %a %b`                | Integer, Integer       | Integer   | |
| Negate            | `negate`       | `%x = negate %a`                    | Integer                | Integer   | |
|                   |                |                                     |                        |           | |
| **Comparison**    |                |                                     |                        |           | |
| Equal             | `equal`        | `%x = equal %a %b`                  | Integer, Integer       | Boolean   | |
| Unequal           | `unequal`      | `%x = unequal %a %b`                | Integer, Integer       | Boolean   | |
| Less              | `less`         | `%x = less %a %b`                   | Integer, Integer       | Boolean   | |
| LessEqual         | `lessequal`    | `%x = lessequal %a %b`              | Integer, Integer       | Boolean   | |
| Greater           | `greater`      | `%x = greater %a %b`                | Integer, Integer       | Boolean   | |
| GreaterEqual      | `greaterequal` | `%x = greaterequal %a %b`           | Integer, Integer       | Boolean   | |
|                   |                |                                     |                        |           | |
| **Terminator**    |                |                                     |                        |           | |
| Jump              | `jump`         | `jump @end`                         | Label                  |           | unconditional branch |
| Branch            | `branch`       | `branch (consume %c) @left @right`  | Boolean, [Label Label] |           | conditional branch |
| Return            | `return`       | `return (consume %x)`               | Value                  |           | |
|                   |                |                                     |                        |           | |

## Notes
- `Boolean` is currently only an alias for an `Integer` with the value 0 or 1
- `Value` is either `Integer` or `Pointer`
- Arguments can be passed via read, such as `%x`, or consuming read, such as `(consume %x)`.

---
**Copyright (c) 2026 Marco Nikander**
