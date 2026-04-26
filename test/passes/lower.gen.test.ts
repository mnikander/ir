import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIR from "../../src/high/high_grammar.ts";
import * as LIR from "../../src/low/low_grammar.ts";
import { lower } from "../../src/passes/lower.gen.ts";

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
            phis: [],
            lines: [
              ["%0", "constant", { value: small }],
            ],
            terminator: [null, "return", ["%0"]],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [null, "return", 0],
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
            phis: [],
            lines: [
              ["%0", "constant", { value: 1 }],
              ["%1", "constant", { value: small }],
              ["%2", "constant", { value: large }],
              ["%3", "constant", { value: huge }],
            ],
            terminator: [null, "branch", ["%0"], ["@then", "@else"]],
          },
          {
            name: "@then",
            phis: [],
            lines: [
              ["%4", "add", ["%1"], ["%2"]],
            ],
            terminator: [null, "jump", "@end"],
          },
          {
            name: "@else",
            phis: [],
            lines: [
              ["%5", "add", ["%2"], ["%3"]],
            ],
            terminator: [null, "jump", "@end"],
          },
          {
            name: "@end",
            phis: [],
            lines: [],
            terminator: [null, "return", ["%4"]],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: 1 }],
      [1, "constant", { value: small }],
      [2, "constant", { value: large }],
      [3, "constant", { value: huge }],
      [null, "branch", 0, [{ line: 7 }, { line: 10 }]],
      [null, "noop", "@then"],
      [4, "add", 1, 2],
      [null, "jump", { line: 13 }],
      [null, "noop", "@else"],
      [5, "add", 2, 3],
      [null, "jump", { line: 13 }],
      [null, "noop", "@end"],
      [null, "return", 4],
    ];

    expect(lower(input)).toEqual(expected);
  });

  it("lowers a consumed copy into copy then drop", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", { value: small }],
              ["%y", "copy", ["consume", "%x"]],
            ],
            terminator: [null, "return", ["%y"]],
          },
        ],
      },
    ];

    expect(lower(input)).toEqual([
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "copy", 0],
      [0, "drop"],
      [null, "return", 1],
    ]);
  });

  it("lowers an explicit hir drop directly to lir drop", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", { value: small }],
              ["%x", "drop"],
            ],
            terminator: [null, "return", ["%x"]],
          },
        ],
      },
    ];

    expect(lower(input)).toEqual([
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [0, "drop"],
      [null, "return", 0],
    ]);
  });

  it("lowers explicit and consume-driven drops together", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", { value: small }],
              ["%y", "copy", ["consume", "%x"]],
              ["%y", "drop"],
            ],
            terminator: [null, "return", ["%y"]],
          },
        ],
      },
    ];

    expect(lower(input)).toEqual([
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "copy", 0],
      [0, "drop"],
      [1, "drop"],
      [null, "return", 1],
    ]);
  });

  it("lowers borrow and load into address_of and load without extra temporaries", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", { value: small }],
              ["%r", "borrow", "%x"],
              ["%t", "load", "%r"],
            ],
            terminator: [null, "return", ["%t"]],
          },
        ],
      },
    ];

    expect(lower(input)).toEqual([
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "address_of", 0],
      [2, "load", 1],
      [null, "return", 2],
    ]);
  });

  it("lowers own into copy address_of and drop", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", { value: small }],
              ["%r", "own", ["%x"]],
            ],
            terminator: [null, "return", ["%r"]],
          },
        ],
      },
    ];

    expect(lower(input)).toEqual([
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [2, "copy", 0],
      [1, "address_of", 2],
      [0, "drop"],
      [null, "return", 1],
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
            phis: [],
            lines: [
              ["%condition", "constant", { value: 1 }],
            ],
            terminator: [null, "branch", ["consume", "%condition"], [
              "@then",
              "@else",
            ]],
          },
          {
            name: "@then",
            phis: [],
            lines: [
              ["%value", "constant", { value: small }],
            ],
            terminator: [null, "return", ["consume", "%value"]],
          },
          {
            name: "@else",
            phis: [],
            lines: [
              ["%fallback", "constant", { value: large }],
            ],
            terminator: [null, "return", ["%fallback"]],
          },
        ],
      },
    ];

    expect(lower(input)).toEqual([
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: 1 }],
      [3, "copy", 0],
      [0, "drop"],
      [null, "branch", 3, [{ line: 6 }, { line: 11 }]],
      [null, "noop", "@then"],
      [1, "constant", { value: small }],
      [4, "copy", 1],
      [1, "drop"],
      [null, "return", 4],
      [null, "noop", "@else"],
      [2, "constant", { value: large }],
      [null, "return", 2],
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
            phis: [],
            lines: [
              ["%0", "constant", { value: small }],
              ["%1", "constant", { value: large }],
              ["%2", "call", "@identity", [["%1"]]],
            ],
            terminator: [null, "return", ["%2"]],
          },
        ],
      },
      {
        name: "@identity",
        params: [["%a"]],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", ["%a"]],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "call", { line: 6 }, [1], "@identity"],
      [null, "return", 2],
      [null, "noop", "fun @identity [%a]"],
      [null, "noop", "@entry"],
      [null, "return", 0],
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
            phis: [],
            lines: [
              ["%x", "constant", { value: 5 }],
              ["%result", "call", "@factorial", [["%x"]]],
            ],
            terminator: [null, "return", ["%result"]],
          },
        ],
      },
      {
        name: "@factorial",
        params: [["%arg"]],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%one", "constant", { value: 1 }],
            ],
            terminator: [null, "jump", "@gate"],
          },
          {
            name: "@gate",
            phis: [
              ["%acc", "phi", [["@entry", ["%one"]], ["@body", ["%new_acc"]]]],
              ["%n", "phi", [["@entry", ["%arg"]], ["@body", ["%new_n"]]]],
            ],
            lines: [
              ["%continue", "greater", ["%n"], ["%one"]],
            ],
            terminator: [null, "branch", ["%continue"], ["@body", "@end"]],
          },
          {
            name: "@body",
            phis: [],
            lines: [
              ["%new_acc", "multiply", ["%n"], ["%acc"]],
              ["%new_n", "subtract", ["%n"], ["%one"]],
            ],
            terminator: [null, "jump", "@gate"],
          },
          {
            name: "@end",
            phis: [],
            lines: [],
            terminator: [null, "return", ["%n"]],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: 5 }],
      [1, "call", { line: 5 }, [0], "@factorial"],
      [null, "return", 1],

      [null, "noop", "fun @factorial [%arg]"],
      [null, "noop", "@entry"],
      [1, "constant", { value: 1 }],
      [null, "jump", { line: 9 }],

      [null, "noop", "@phi.gate.from.entry"],
      [2, "copy", 1],
      [3, "copy", 0],
      [4, "copy", 2],
      [5, "copy", 3],
      [null, "jump", { line: 21 }],

      [null, "noop", "@phi.gate.from.body"],
      [6, "copy", 9],
      [7, "copy", 10],
      [4, "copy", 6],
      [5, "copy", 7],
      [null, "jump", { line: 21 }],

      [null, "noop", "@gate"],
      [8, "greater", 5, 1],
      [null, "branch", 8, [{ line: 24 }, { line: 28 }]],

      [null, "noop", "@body"],
      [9, "multiply", 5, 4],
      [10, "subtract", 5, 1],
      [null, "jump", { line: 15 }],

      [null, "noop", "@end"],
      [null, "return", 5],
    ];

    expect(lower(input)).toEqual(expected);
  });
});
