import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIR from "../../src/high/high_grammar.ts";
import * as LIR from "../../src/low/low_grammar.ts";
import { lower } from "../../src/passes/lower.ts";

const small: number = 11;
const large: number = 13;
const huge: number = 281;

describe("lowering from HIR to LIR", () => {
  it("lowers a constant-returning main function", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
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
      [null, "Noop", "@entry"],
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
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 1 }],
              ["%1", "Constant", { value: small }],
              ["%2", "Constant", { value: large }],
              ["%3", "Constant", { value: huge }],
            ],
            terminator: [null, "Branch", ["%0"], ["@then", "@else"]],
          },
          {
            name: "@then",
            joins: [],
            lines: [
              ["%4", "Add", ["%1"], ["%2"]],
            ],
            terminator: [null, "Jump", "@end"],
          },
          {
            name: "@else",
            joins: [],
            lines: [
              ["%5", "Add", ["%2"], ["%3"]],
            ],
            terminator: [null, "Jump", "@end"],
          },
          {
            name: "@end",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%4"]],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@entry"],
      [0, "Constant", { value: 1 }],
      [1, "Constant", { value: small }],
      [2, "Constant", { value: large }],
      [3, "Constant", { value: huge }],
      [null, "Branch", 0, [{ line: 7 }, { line: 10 }]],
      [null, "Noop", "@then"],
      [4, "Add", 1, 2],
      [null, "Jump", { line: 13 }],
      [null, "Noop", "@else"],
      [5, "Add", 2, 3],
      [null, "Jump", { line: 13 }],
      [null, "Noop", "@end"],
      [null, "Return", 4],
    ];

    expect(lower(input)).toEqual(expected);
  });

  it("lowers a consumed assign into copy then drop", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: small }],
              ["%y", "Assign", ["consume", "%x"]],
            ],
            terminator: [null, "Return", ["%y"]],
          },
        ],
      },
    ];

    expect(lower(input)).toEqual([
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@entry"],
      [0, "Constant", { value: small }],
      [1, "Copy", 0],
      [0, "Drop"],
      [null, "Return", 1],
    ]);
  });

  it("lowers consumed control-flow inputs while keeping block targets correct", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%condition", "Constant", { value: 1 }],
            ],
            terminator: [null, "Branch", ["consume", "%condition"], ["@then", "@else"]],
          },
          {
            name: "@then",
            joins: [],
            lines: [
              ["%value", "Constant", { value: small }],
            ],
            terminator: [null, "Return", ["consume", "%value"]],
          },
          {
            name: "@else",
            joins: [],
            lines: [
              ["%fallback", "Constant", { value: large }],
            ],
            terminator: [null, "Return", ["%fallback"]],
          },
        ],
      },
    ];

    expect(lower(input)).toEqual([
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@entry"],
      [0, "Constant", { value: 1 }],
      [3, "Copy", 0],
      [0, "Drop"],
      [null, "Branch", 3, [{ line: 6 }, { line: 11 }]],
      [null, "Noop", "@then"],
      [1, "Constant", { value: small }],
      [4, "Copy", 1],
      [1, "Drop"],
      [null, "Return", 4],
      [null, "Noop", "@else"],
      [2, "Constant", { value: large }],
      [null, "Return", 2],
    ]);
  });

  it("lowers function calls using function entry line numbers and argument offsets", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
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
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%a"]],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Call", { line: 6 }, [1], "@identity"],
      [null, "Return", 2],
      [null, "Noop", "fun @identity [%a]"],
      [null, "Noop", "@entry"],
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
      [null, "Noop", "@entry"],
      [0, "Constant", { value: 5 }],
      [1, "Call", { line: 5 }, [0], "@factorial"],
      [null, "Return", 1],

      [null, "Noop", "fun @factorial [%arg]"],
      [null, "Noop", "@entry"],
      [1, "Constant", { value: 1 }],
      [null, "Jump", { line: 9 }],

      [null, "Noop", "@phi.gate.from.entry"],
      [2, "Copy", 1],
      [3, "Copy", 0],
      [4, "Copy", 2],
      [5, "Copy", 3],
      [null, "Jump", { line: 21 }],

      [null, "Noop", "@phi.gate.from.body"],
      [6, "Copy", 9],
      [7, "Copy", 10],
      [4, "Copy", 6],
      [5, "Copy", 7],
      [null, "Jump", { line: 21 }],

      [null, "Noop", "@gate"],
      [8, "Greater", 5, 1],
      [null, "Branch", 8, [{ line: 24 }, { line: 28 }]],

      [null, "Noop", "@body"],
      [9, "Multiply", 5, 4],
      [10, "Subtract", 5, 1],
      [null, "Jump", { line: 15 }],

      [null, "Noop", "@end"],
      [null, "Return", 5],
    ];

    expect(lower(input)).toEqual(expected);
  });
});
