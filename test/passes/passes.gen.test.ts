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
            name: "@combine.entry",
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
            name: "@combine.entry",
            joins: [],
            lines: [
              [2, "Add", [0], [1]],
              [3, "Multiply", [2], [0]],
            ],
            terminator: [null, "Return", [3]],
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
            name: "@main.entry",
            joins: [],
            lines: [
              [0, "Constant", { value: 1 }],
              [1, "Constant", { value: small }],
              [2, "Constant", { value: large }],
              [3, "Constant", { value: huge }],
            ],
            terminator: [null, "Branch", [0], ["@main.then", "@main.else"]],
          },
          {
            name: "@main.then",
            joins: [],
            lines: [
              [4, "Add", [1], [2]],
            ],
            terminator: [null, "Jump", "@main.end"],
          },
          {
            name: "@main.else",
            joins: [],
            lines: [
              [5, "Add", [2], [3]],
            ],
            terminator: [null, "Jump", "@main.end"],
          },
          {
            name: "@main.end",
            joins: [],
            lines: [],
            terminator: [null, "Return", [4]],
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

    expect(linearize_to_lir(input)).toEqual(expected);
  });

  it("resolves call targets to function-header line numbers", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              [0, "Constant", { value: large }],
              [1, "Call", "@identity", [[0]]],
            ],
            terminator: [null, "Return", [1]],
          },
        ],
      },
      {
        name: "@identity",
        params: [{ name: "%a", offset: 0 }],
        blocks: [
          {
            name: "@identity.entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", [0]],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: large }],
      [1, "Call", { line: 5 }, [0], "@identity"],
      [null, "Return", 1],
      [null, "Noop", "fun @identity [%a]"],
      [null, "Noop", "@identity.entry"],
      [null, "Return", 0],
    ];

    expect(linearize_to_lir(input)).toEqual(expected);
  });
});
