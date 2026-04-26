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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "return", ["Int"], ["%0"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 1 }],
              ["%1", "constant", ["Int"], { value: small }],
              ["%2", "constant", ["Int"], { value: large }],
              ["%3", "constant", ["Int"], { value: huge }],
            ],
            terminator: [null, "branch", null, ["%0"], ["@then", "@else"]],
          },
          {
            name: "@then",
            phis: [],
            lines: [
              ["%4", "add", ["Int"], ["%1"], ["%2"]],
            ],
            terminator: [null, "jump", null, "@end"],
          },
          {
            name: "@else",
            phis: [],
            lines: [
              ["%5", "add", ["Int"], ["%2"], ["%3"]],
            ],
            terminator: [null, "jump", null, "@end"],
          },
          {
            name: "@end",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%4"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%y", "copy", ["Int"], ["consume", "%x"]],
            ],
            terminator: [null, "return", ["Int"], ["%y"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%x", "drop", null],
            ],
            terminator: [null, "return", ["Int"], ["%x"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%y", "copy", ["Int"], ["consume", "%x"]],
              ["%y", "drop", null],
            ],
            terminator: [null, "return", ["Int"], ["%y"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%r", "borrow", ["Borrowed", ["Int"]], "%x"],
              ["%t", "load", ["Int"], "%r"],
            ],
            terminator: [null, "return", ["Int"], ["%t"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%r", "own", ["Owned", ["Int"]], ["%x"]],
            ],
            terminator: [null, "return", ["Owned", ["Int"]], ["%r"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%condition", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "branch", null, ["consume", "%condition"], [
              "@then",
              "@else",
            ]],
          },
          {
            name: "@then",
            phis: [],
            lines: [
              ["%value", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "return", ["Int"], ["consume", "%value"]],
          },
          {
            name: "@else",
            phis: [],
            lines: [
              ["%fallback", "constant", ["Int"], { value: large }],
            ],
            terminator: [null, "return", ["Int"], ["%fallback"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "constant", ["Int"], { value: large }],
              ["%2", "call", ["Int"], "@identity", [["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
      {
        name: "@identity",
        params: [[["%a"], ["Int"]]],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%a"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: 5 }],
              ["%result", "call", ["Int"], "@factorial", [["%x"]]],
            ],
            terminator: [null, "return", ["Int"], ["%result"]],
          },
        ],
      },
      {
        name: "@factorial",
        params: [[["%arg"], ["Int"]]],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%one", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "jump", null, "@gate"],
          },
          {
            name: "@gate",
            phis: [
              ["%acc", "phi", ["Int"], [["@entry", ["%one"]], [
                "@body",
                ["%new_acc"],
              ]]],
              ["%n", "phi", ["Int"], [["@entry", ["%arg"]], [
                "@body",
                ["%new_n"],
              ]]],
            ],
            lines: [
              ["%continue", "greater", ["Int"], ["%n"], ["%one"]],
            ],
            terminator: [null, "branch", null, ["%continue"], [
              "@body",
              "@end",
            ]],
          },
          {
            name: "@body",
            phis: [],
            lines: [
              ["%new_acc", "multiply", ["Int"], ["%n"], ["%acc"]],
              ["%new_n", "subtract", ["Int"], ["%n"], ["%one"]],
            ],
            terminator: [null, "jump", null, "@gate"],
          },
          {
            name: "@end",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%n"]],
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
