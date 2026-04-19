import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as LIR from "../../src/low/low_grammar.ts";
import {
  resolve_labels,
  type UnresolvedProgram,
} from "../../src/passes/mod.gen.ts";

describe("resolve_labels", () => {
  it("resolves function and block targets from symbolic notes", () => {
    const input: UnresolvedProgram = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@entry"],
      [
        0,
        "Call",
        { kind: "function", function_name: "@identity" },
        [],
        "@identity",
      ],
      [null, "Jump", {
        kind: "block",
        function_name: "@main",
        block_name: "@exit",
      }],
      [null, "Noop", "@exit"],
      [null, "Return", 0],
      [null, "Noop", "fun @identity [%x]"],
      [null, "Noop", "@entry"],
      [null, "Return", 0],
    ];

    const expected: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@entry"],
      [0, "Call", { line: 6 }, [], "@identity"],
      [null, "Jump", { line: 4 }],
      [null, "Noop", "@exit"],
      [null, "Return", 0],
      [null, "Noop", "fun @identity [%x]"],
      [null, "Noop", "@entry"],
      [null, "Return", 0],
    ];

    expect(resolve_labels(input)).toEqual(expected);
  });
});
