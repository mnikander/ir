# Table of Instructions and Type Signatures

| name              | symbols        | example                             | input type             |output type| comments |
| :---              | :---           | :---                                | :---                   | :---      | :--- |
|                   |                |                                     |                        |           | |
| **Special Forms** |                |                                     |                        |           | |
| Function          | `function`     | `function @identity [%arg : Int] -> Int` |                   | Int       | function definition |
| Block             | `block`        | `block @entry`                      |                        |           | basic block definition |
| Phi               | `phi`          | `%x = phi Int [@left, %l] [@right, %r]` | [Label, Value]...  | Int       | SSA-style join |
| Call              | `call`         | `%x = call Int @f [%a, (consume %b)]`| Label, Value...       | Int       | function call |
|                   |                |                                     |                        |           | |
| **Memory**        |                |                                     |                        |           | |
| Constant          | `constant`     | `%x = constant Int 42`              | Literal                | Int       | load a constant value |
| Copy              | `copy`         | `%x = copy Int (consume %a)`        | Value                  | Int       | copy another register |
| Own               | `own`          | `%x = own (Owned Int) %a`           | Value                  | Owned Int | create a pointer which takes exclusive ownership of a register |
| Borrow            | `borrow`       | `%x = borrow (Borrowed Int) %a`     | Value                  | Borrowed Int | create a pointer which is non-owning, i.e. read-only|
| Load              | `load`         | `%x = load Int %ptr`                | Pointer                | Int       | load a value via a pointer |
| Drop              | `drop`         | `%x = drop`                         | Unit                   |           | destroy a register |
|                   |                |                                     |                        |           | |
| **Arithmetic**    |                |                                     |                        |           | |
| Add               | `add`          | `%x = add Int %a %b`                | Int, Int               | Int       | |
| Subtract          | `subtract`     | `%x = subtract Int %a %b`           | Int, Int               | Int       | |
| Multiply          | `multiply`     | `%x = multiply Int %a %b`           | Int, Int               | Int       | |
| Divide            | `divide`       | `%x = divide Int %a %b`             | Int, Int               | Int       | |
| Remainder         | `remainder`    | `%x = remainder Int %a %b`          | Int, Int               | Int       | |
| Minimum           | `minimum`      | `%x = minimum Int %a %b`            | Int, Int               | Int       | |
| Maximum           | `maximum`      | `%x = maximum Int %a %b`            | Int, Int               | Int       | |
| Negate            | `negate`       | `%x = negate Int %a`                | Int                    | Int       | |
|                   |                |                                     |                        |           | |
| **Comparison**    |                |                                     |                        |           | |
| Equal             | `equal`        | `%x = equal Int %a %b`              | Int, Int               | Int       | |
| Unequal           | `unequal`      | `%x = unequal Int %a %b`            | Int, Int               | Int       | |
| Less              | `less`         | `%x = less Int %a %b`               | Int, Int               | Int       | |
| LessEqual         | `less_equal`   | `%x = less_equal Int %a %b`         | Int, Int               | Int       | |
| Greater           | `greater`      | `%x = greater Int %a %b`            | Int, Int               | Int       | |
| GreaterEqual      | `greater_equal`| `%x = greater_equal Int %a %b`      | Int, Int               | Int       | |
|                   |                |                                     |                        |           | |
| **Terminator**    |                |                                     |                        |           | |
| Jump              | `jump`         | `jump @end`                         | Label                  |           | unconditional branch |
| Branch            | `branch`       | `branch (consume %c) @left @right`  | Boolean, Label, Label  |           | conditional branch |
| Return            | `return`       | `return Int (consume %x)`           | Value                  | Int       | |
|                   |                |                                     |                        |           | |

## Notes
- `Boolean` is currently represented as `Int` with the value 0 or 1.
- HIR carries type annotations, but there is no type-checker yet.
- LIR does not carry type annotations.
- `Value` is either `Int` or a pointer type such as `(Owned Int)` or `(Borrowed Int)`.
- Arguments can be passed via read, such as `%x`, or consuming read, such as `(consume %x)`.

## MIR Printed Syntax

MIR is printed as tagged symbolic expressions. Structural nodes are expanded
over indented lines, with each `(blocks ...)` node containing explicit
`(block ...)` nodes, while instructions and operands remain inline. Numeric
resources and labels retain their tags, for example `(read 0)`, `(move 0)`,
`(literal 0)`, and `(label 1)`. Literals can be used directly as MIR operands;
for example, an unconditional jump is represented by a branch from the
immediate value `0` to a singleton target list. Phi inputs, call operands, and branch targets are wrapped in
explicit variadic `(sources ...)`, `(arguments ...)`, and `(labels ...)` nodes:

```text
(program
  (function
    (parameters Int)
    (result Int)
    (locals (Owned Int))
    (blocks
      (block
        (phi (define 0) (sources (from (label 1) (read 2)) (from (label 2) (move 3))))
        (call (define 1) (label 0) (arguments (read 0) (move 2)))
        (branch (literal 0) (labels 1)))
      (block
        (return (read 1))))))
```

---
**Copyright (c) 2026 Marco Nikander**
