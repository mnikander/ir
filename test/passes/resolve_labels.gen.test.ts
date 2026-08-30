import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as LIR from "../../src/low/low_grammar.ts";
import {
  resolve_labels,
  type UnresolvedProgram,
} from "../../src/hir_to_lir/mod.gen.ts";

describe("resolve_labels", () => {
  it("resolves function and block targets from symbolic notes", () => {
    const input: UnresolvedProgram = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [
        0,
        "call",
        { kind: "function", function_name: "@identity" },
        [],
        "@identity",
      ],
      [null, "jump", {
        kind: "block",
        function_name: "@main",
        block_name: "@exit",
      }],
      [null, "noop", "@exit"],
      [null, "return", 0],
      [null, "noop", "fun @identity [%x]"],
      [null, "noop", "@entry"],
      [null, "return", 0],
    ];

    const expected: LIR.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "call", { line: 6 }, [], "@identity"],
      [null, "jump", { line: 4 }],
      [null, "noop", "@exit"],
      [null, "return", 0],
      [null, "noop", "fun @identity [%x]"],
      [null, "noop", "@entry"],
      [null, "return", 0],
    ];

    expect(resolve_labels(input)).toEqual(expected);
  });
});
