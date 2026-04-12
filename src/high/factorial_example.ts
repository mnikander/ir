// Copyright (c) 2026 Marco Nikander

import { Program } from "./high_grammar.ts";

// func main(): int
// {
//   result = factorial 5
//   return result
// }
//
// func factorial(int arg): int
// {
//   acc = 1
//   while (n > 1) {
//     acc = n * acc
//     n   = n - 1
//   }
//   return acc
// }

export const factorial: Program = [
  {
    name: "@main",
    params: [],
    blocks: [
      {
        name: "@entry",
        joins: [],
        lines: [
          ["%x", "Constant", { value: 5 }],
          ["%result", "Call", "@factorial", [["%x"]]],
        ],
        terminator: [null, "Return", ["%result"]],
      },
    ],
  },
  {
    name: "@factorial",
    params: [["%arg"]],
    blocks: [
      {
        name: "@entry",
        joins: [],
        lines: [
          ["%one", "Constant", { value: 1 }],
        ],
        terminator: [null, "Jump", "@gate"],
      },
      {
        name: "@gate",
        joins: [
          ["%acc", "Phi", [["@entry", ["%one"]], ["@body", ["%new_acc"]]]],
          ["%n", "Phi", [["@entry", ["%arg"]], ["@body", ["%new_n"]]]],
        ],
        lines: [
          ["%continue", "Greater", ["%n"], ["%one"]],
        ],
        terminator: [null, "Branch", ["%continue"], ["@body", "@end"]],
      },
      {
        name: "@body",
        joins: [],
        lines: [
          ["%new_acc", "Multiply", ["%n"], ["%acc"]],
          ["%new_n", "Subtract", ["%n"], ["%one"]],
        ],
        terminator: [null, "Jump", "@gate"],
      },
      {
        name: "@end",
        joins: [],
        lines: [],
        terminator: [null, "Return", ["%n"]],
      },
    ],
  },
];
