# Table of Instructions

| name                  | symbols        | example                             | inputs                         | outputs    | comments |
| :---                  | :---           | :---                                | :---                           | :---       | :--- |
|                       |                |                                     |                                |            | |
| **Special Forms**     |                |                                     |                                |            | |
| Function              | `function`     | `function @identity [%arg]:`        | `Label`, `Input[]`, `Block[]`  |            | function definition |
| Block                 | `block`        | `block @entry:`                     | `Label`, `Phi[]`, `Line[]`, `Terminator` |  | basic block definition |
| Phi                   | `phi`          | `%x = phi [[@left %l] [@right %r]]` | `[Label, Input][]`             | `Register` | SSA-style join |
| Call                  | `call`         | `%x = call @f [%a (consume %b)]`    | `Label`, `Input[]`             | `Register` | function call |
|                       |                |                                     |                                |            | |
| **Memory**            |                |                                     |                                |            | |
| Constant              | `constant`     | `%x = constant 42`                  | `Primitive`                    | `Register` | load a constant value |
| Copy                  | `copy`         | `%x = copy (consume %a)`            | `Input`                        | `Register` | copy another register |
| Own                   | `own`          | `%x = own %a`                       | `Input`                        | `Register` | create a pointer which takes exclusive ownership of a register |
| Borrow                | `borrow`       | `%x = borrow %a`                    | `Register`                     | `Register` | create a pointer which is non-owning, i.e. read-only access |
| Load                  | `load`         | `%x = load %ptr`                    | `Register`                     | `Register` | load a value via a pointer |
| Drop                  | `drop`         | `%x = drop`                         |                                | `Register` | destroy a register |
|                       |                |                                     |                                |            | |
| **Arithmetic**        |                |                                     |                                |            | |
| Add                   | `add`          | `%x = add %a %b`                    | `Input`, `Input`               | `Register` | |
| Subtract              | `subtract`     | `%x = subtract %a %b`               | `Input`, `Input`               | `Register` | |
| Multiply              | `multiply`     | `%x = multiply %a %b`               | `Input`, `Input`               | `Register` | |
| Divide                | `divide`       | `%x = divide %a %b`                 | `Input`, `Input`               | `Register` | |
| Remainder             | `remainder`    | `%x = remainder %a %b`              | `Input`, `Input`               | `Register` | |
| Minimum               | `minimum`      | `%x = minimum %a %b`                | `Input`, `Input`               | `Register` | |
| Maximum               | `maximum`      | `%x = maximum %a %b`                | `Input`, `Input`               | `Register` | |
| Negate                | `negate`       | `%x = negate %a`                    | `Input`                        | `Register` | |
|                       |                |                                     |                                |            | |
| **Comparison**        |                |                                     |                                |            | |
| Equal                 | `equal`        | `%x = equal %a %b`                  | `Input`, `Input`               | `Register` | |
| Unequal               | `unequal`      | `%x = unequal %a %b`                | `Input`, `Input`               | `Register` | |
| Less                  | `less`         | `%x = less %a %b`                   | `Input`, `Input`               | `Register` | |
| LessEqual             | `lessequal`    | `%x = lessequal %a %b`              | `Input`, `Input`               | `Register` | |
| Greater               | `greater`      | `%x = greater %a %b`                | `Input`, `Input`               | `Register` | |
| GreaterEqual          | `greaterequal` | `%x = greaterequal %a %b`           | `Input`, `Input`               | `Register` | |
|                       |                |                                     |                                |            | |
| **Terminator**        |                |                                     |                                |            | |
| Jump                  | `jump`         | `jump @end`                         | `Label`                        |            | unconditional branch |
| Branch                | `branch`       | `branch (consume %c) @left @right`  | `Input`, `[Label, Label]`      |            | conditional branch |
| Return                | `return`       | `return (consume %x)`               | `Input`                        |            | |
|                       |                |                                     |                                |            | |

## Notes
- `Input` is either a register read, such as `%x`, or a consumed register read, such as `(consume %x)`.

---
**Copyright (c) 2026 Marco Nikander**
