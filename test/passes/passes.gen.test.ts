import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIR from "../../src/high/high_grammar.ts";
import * as LIR from "../../src/low/low_grammar.ts";
import {
  linearize_to_lir,
  type NumberedProgram,
  rename_registers,
} from "../../src/passes/lowering/mod.gen.ts";

const small: number = 11;
const large: number = 13;
const huge: number = 281;

describe("rename_registers", () => {
  it("assigns params first and then enumerates later registers deterministically", () => {
    const input: HIR.Program = [
      {
        name: "@combine",
        params: [["%a"], ["%b"]],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%sum", "Add", ["%a"], ["%b"]],
              ["%product", "Multiply", ["%sum"], ["%a"]],
            ],
            terminator: [null, "Return", ["%product"]],
          },
        ],
      },
    ];

    expect(rename_registers(input)).toEqual([
      {
        name: "@combine",
        params: [
          { name: "%a", offset: 0 },
          { name: "%b", offset: 1 },
        ],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              [2, "Add", { offset: 0, consume: false }, { offset: 1, consume: false }],
              [3, "Multiply", { offset: 2, consume: false }, { offset: 0, consume: false }],
            ],
            terminator: [null, "Return", { offset: 3, consume: false }],
          },
        ],
      },
    ]);
  });

  it("preserves consumed inputs while assigning stack slots", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [["%x"]],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%y", "Assign", ["consume", "%x"]],
            ],
            terminator: [null, "Return", ["consume", "%y"]],
          },
        ],
      },
    ];

    expect(rename_registers(input)).toEqual([
      {
        name: "@main",
        params: [
          { name: "%x", offset: 0 },
        ],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              [1, "Assign", { offset: 0, consume: true }],
            ],
            terminator: [null, "Return", { offset: 1, consume: true }],
          },
        ],
      },
    ]);
  });
});

describe("linearize_to_lir", () => {
  it("resolves branch and jump targets to block-label line numbers", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              [0, "Constant", { value: 1 }],
              [1, "Constant", { value: small }],
              [2, "Constant", { value: large }],
              [3, "Constant", { value: huge }],
            ],
            terminator: [null, "Branch", { offset: 0, consume: false }, ["@then", "@else"]],
          },
          {
            name: "@then",
            joins: [],
            lines: [
              [4, "Add", { offset: 1, consume: false }, { offset: 2, consume: false }],
            ],
            terminator: [null, "Jump", "@end"],
          },
          {
            name: "@else",
            joins: [],
            lines: [
              [5, "Add", { offset: 2, consume: false }, { offset: 3, consume: false }],
            ],
            terminator: [null, "Jump", "@end"],
          },
          {
            name: "@end",
            joins: [],
            lines: [],
            terminator: [null, "Return", { offset: 4, consume: false }],
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

    expect(linearize_to_lir(input)).toEqual(expected);
  });

  it("resolves call targets to function-header line numbers", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              [0, "Constant", { value: large }],
              [1, "Call", "@identity", [{ offset: 0, consume: false }]],
            ],
            terminator: [null, "Return", { offset: 1, consume: false }],
          },
        ],
      },
      {
        name: "@identity",
        params: [{ name: "%a", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", { offset: 0, consume: false }],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@entry"],
      [0, "Constant", { value: large }],
      [1, "Call", { line: 5 }, [0], "@identity"],
      [null, "Return", 1],
      [null, "Noop", "fun @identity [%a]"],
      [null, "Noop", "@entry"],
      [null, "Return", 0],
    ];

    expect(linearize_to_lir(input)).toEqual(expected);
  });

  it("emits a drop after a consumed assign", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [{ name: "%x", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              [1, "Assign", { offset: 0, consume: true }],
            ],
            terminator: [null, "Return", { offset: 1, consume: false }],
          },
        ],
      },
    ];

    expect(linearize_to_lir(input)).toEqual([
      [null, "Noop", "fun @main [%x]"],
      [null, "Noop", "@entry"],
      [1, "Copy", 0],
      [0, "Drop"],
      [null, "Return", 1],
    ]);
  });

  it("emits drops for consumed operands and call arguments", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [{ name: "%x", offset: 0 }, { name: "%y", offset: 1 }],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              [2, "Add", { offset: 0, consume: true }, { offset: 1, consume: false }],
              [3, "Call", "@identity", [{ offset: 2, consume: true }]],
            ],
            terminator: [null, "Return", { offset: 3, consume: false }],
          },
        ],
      },
      {
        name: "@identity",
        params: [{ name: "%a", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", { offset: 0, consume: false }],
          },
        ],
      },
    ];

    expect(linearize_to_lir(input)).toEqual([
      [null, "Noop", "fun @main [%x, %y]"],
      [null, "Noop", "@entry"],
      [2, "Add", 0, 1],
      [0, "Drop"],
      [3, "Call", { line: 7 }, [2], "@identity"],
      [2, "Drop"],
      [null, "Return", 3],
      [null, "Noop", "fun @identity [%a]"],
      [null, "Noop", "@entry"],
      [null, "Return", 0],
    ]);
  });

  it("materializes consumed terminator inputs before branching and returning", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [{ name: "%condition", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Branch", { offset: 0, consume: true }, ["@then", "@else"]],
          },
          {
            name: "@then",
            joins: [],
            lines: [
              [1, "Constant", { value: small }],
            ],
            terminator: [null, "Return", { offset: 1, consume: true }],
          },
          {
            name: "@else",
            joins: [],
            lines: [
              [2, "Constant", { value: large }],
            ],
            terminator: [null, "Return", { offset: 2, consume: false }],
          },
        ],
      },
    ];

    expect(linearize_to_lir(input)).toEqual([
      [null, "Noop", "fun @main [%condition]"],
      [null, "Noop", "@entry"],
      [3, "Copy", 0],
      [0, "Drop"],
      [null, "Branch", 3, [{ line: 5 }, { line: 10 }]],
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
});
