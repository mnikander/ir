# Type Signatures of Instructions

| name                     | symbols                      | example                                 | inputs                         | outputs | comments |
| :---                     | :---                         | :---                                    | :---                           | :---    | :--- |
|                          |                              |                                         |                                |         | |
| **Special Forms**        |                              |                                         |                                |         | |
| Value definition         | `=`                          | `%x = %a`                               | Value                          |         | |
| Function call            | `call`                       | `%x = call @f [%a %b]`                  | Function, Tuple Value*         | Value   | |
| Phi node                 | `phi`                        | `%x = phi [[@left %l] [@right %r]]`     | Tuple (Tuple Label Value)*     | Value   | |
|                          |                              |                                         |                                |         | |
| **Arithmetic and Logic** |                              |                                         |                                |         | |
| Constant                 | `const`                      | `%x = const 42`                         | Literal                        | Value   | |
| Equality                 | `equal` <br> `unequal`       | `%x = equal %a %b`                      | Value, Value                   | Boolean | |
| Negation                 | `negate`                     | `%x = negate %a`                        | Number                         | Number  | _not available yet_ |
| Arithmetic               | `add` <br> `subtract` <br> `multiply` <br> `divide` <br> `remainder`| `%x = add %a %b` | Number, Number | Number  | |
| Comparison               | `less` <br> `less_equal` <br> `greater` <br> `greater_equal` | `%c = less %a %b` | Number, Number       | Boolean | _not available yet_ |
| Not                      | `not`                        | `%x = not %a`                           | Boolean                        | Boolean | _not available yet_ |
| Logical                  | `and` <br> `or`              | `%x = and %a %b`                        | Boolean, Boolean               | Boolean | _not available yet_ |
|                          |                              |                                         |                                |         | |
| **Control Flow**         |                              |                                         |                                |         | |
| Basic block              | `block`                      | `block @entry`:                         | Label                          |         | |
| Function definition      | `function`                   | `function @identity [%arg]`:            | Label, Tuple Value*            |         | |
| Jump                     | `jump`                       | `jump @end`                             | Label                          |         | unconditional branch |
| Branch                   | `branch`                     | `branch @left @right %c`                | Label, Label, Boolean          |         | conditional branch |
| Return                   | `return`                     | `return %x`                             | Value                          |         | |
| Exit                     | `exit`                       | `exit %x`                               | Value                          |         | _will hopefully be replaced by `return`_ |
|                          |                              |                                         |                                |         | |

## Notes
- $\text{Value} = \text{Boolean} \cup \text{Number}$

---
**Copyright (c) 2026 Marco Nikander**
