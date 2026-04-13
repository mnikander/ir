import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIR from "../src/high/high_grammar.ts";
import * as LIR from "../src/low/low_grammar.ts";
import { lower } from "../src/passes/lower.ts";

const small: number = 11;
const large: number = 13;
const huge: number = 281;

describe.skip("lowering from HIR to LIR", () => {
  it("lowers a constant-returning main function", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
            ],
            terminator: [null, "Return", ["%0"]],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [null, "Return", 0],
    ];

    expect(lower(input)).toEqual(expected);
  });

  it("lowers branches into flat LIR blocks with explicit line-number targets", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 1 }],
              ["%1", "Constant", { value: small }],
              ["%2", "Constant", { value: large }],
              ["%3", "Constant", { value: huge }],
            ],
            terminator: [null, "Branch", ["%0"], ["@main.then", "@main.else"]],
          },
          {
            name: "@main.then",
            joins: [],
            lines: [
              ["%4", "Add", ["%1"], ["%2"]],
            ],
            terminator: [null, "Jump", "@main.end"],
          },
          {
            name: "@main.else",
            joins: [],
            lines: [
              ["%5", "Add", ["%2"], ["%3"]],
            ],
            terminator: [null, "Jump", "@main.end"],
          },
          {
            name: "@main.end",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%4"]],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: 1 }],
      [1, "Constant", { value: small }],
      [2, "Constant", { value: large }],
      [3, "Constant", { value: huge }],
      [null, "Branch", 0, [{ line: 7 }, { line: 10 }]],
      [null, "Noop", "@main.then"],
      [4, "Add", 1, 2],
      [null, "Jump", { line: 13 }],
      [null, "Noop", "@main.else"],
      [5, "Add", 2, 3],
      [null, "Jump", { line: 13 }],
      [null, "Noop", "@main.end"],
      [null, "Return", 4],
    ];

    expect(lower(input)).toEqual(expected);
  });

  it("lowers function calls using function entry line numbers and argument offsets", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
              ["%1", "Constant", { value: large }],
              ["%2", "Call", "@identity", [["%1"]]],
            ],
            terminator: [null, "Return", ["%2"]],
          },
        ],
      },
      {
        name: "@identity",
        params: [["%a"]],
        blocks: [
          {
            name: "@identity.entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%a"]],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Call", { line: 6 }, [1], "@identity"],
      [null, "Return", 2],
      [null, "Noop", "fun @identity [%a]"],
      [null, "Noop", "@identity.entry"],
      [null, "Return", 0],
    ];

    expect(lower(input)).toEqual(expected);
  });

  it("lowers phi nodes by inserting copies along predecessor edges", () => {
    const input: HIR.Program = [
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

    const expected: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: 5 }],
      [1, "Call", { line: 5 }, [0], "@factorial"],
      [null, "Return", 1],

      [null, "Noop", "fun @factorial [%arg]"],
      [null, "Noop", "@entry"],
      [1, "Constant", { value: 1 }],
      [2, "Copy", 1],
      [3, "Copy", 0],
      [null, "Jump", { line: 11 }],

      [null, "Noop", "@gate"],
      [4, "Greater", 3, 1],
      [null, "Branch", 4, [{ line: 14 }, { line: 20 }]],

      [null, "Noop", "@body"],
      [5, "Multiply", 3, 2],
      [6, "Subtract", 3, 1],
      [2, "Copy", 5],
      [3, "Copy", 6],
      [null, "Jump", { line: 11 }],

      [null, "Noop", "@end"],
      [null, "Return", 3],
    ];

    expect(lower(input)).toEqual(expected);
  });
});
