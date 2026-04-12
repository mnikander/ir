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
    func: "@main",
    params: [],
    blocks: [
      {
        block: "@entry",
        joins: [],
        lines: [
          ["%result", "Call", "@factorial", [[5]]],
        ],
        terminator: [null, "Return", ["%result"]],
      },
    ],
  },
  {
    func: "@factorial",
    params: [["%arg"]],
    blocks: [
      {
        block: "@entry",
        joins: [],
        lines: [],
        terminator: [null, "Jump", "@gate"],
      },
      {
        block: "@gate",
        joins: [
          ["%acc", "Phi", [["@entry", [1]], ["@body", ["%new_acc"]]]],
          ["%n", "Phi", [["@entry", ["%arg"]], ["@body", ["%new_n"]]]],
        ],
        lines: [
          ["%continue", "Greater", ["%n"], [1]],
        ],
        terminator: [null, "Branch", ["%continue"], ["@body", "@end"]],
      },
      {
        block: "@body",
        joins: [],
        lines: [
          ["%new_acc", "Multiply", ["%n"], ["%acc"]],
          ["%new_n", "Subtract", ["%n"], [1]],
        ],
        terminator: [null, "Jump", "@gate"],
      },
      {
        block: "@end",
        joins: [],
        lines: [],
        terminator: [null, "Return", ["%n"]],
      },
    ],
  },
];
