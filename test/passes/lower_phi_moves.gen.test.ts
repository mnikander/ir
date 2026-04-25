import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { lower_phi_moves, split_phi_edges } from "../../src/passes/mod.gen.ts";
import * as HIGH from "../../src/high/high_grammar.ts";

describe("lower_phi_moves", () => {
  it("fills split edge blocks with read-then-write copies and clears phis", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [["%left", "Constant", { value: 11 }], [
              "%right",
              "Constant",
              { value: 13 },
            ]],
            terminator: [null, "Jump", "@join"],
          },
          {
            name: "@join",
            phis: [
              ["%x", "Phi", [["@entry", ["%right"]]]],
              ["%y", "Phi", [["@entry", ["%left"]]]],
            ],
            lines: [["%sum", "Add", ["%x"], ["%y"]]],
            terminator: [null, "Return", ["%sum"]],
          },
        ],
      },
    ];

    expect(lower_phi_moves(split_phi_edges(input))).toEqual([
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [["%left", "Constant", { value: 11 }], [
              "%right",
              "Constant",
              { value: 13 },
            ]],
            terminator: [null, "Jump", "@phi.join.from.entry"],
          },
          {
            name: "@phi.join.from.entry",
            phis: [],
            lines: [
              ["%phi.join.from.entry.x", "Copy", ["%right"]],
              ["%phi.join.from.entry.y", "Copy", ["%left"]],
              ["%x", "Copy", ["%phi.join.from.entry.x"]],
              ["%y", "Copy", ["%phi.join.from.entry.y"]],
            ],
            terminator: [null, "Jump", "@join"],
          },
          {
            name: "@join",
            phis: [],
            lines: [["%sum", "Add", ["%x"], ["%y"]]],
            terminator: [null, "Return", ["%sum"]],
          },
        ],
      },
    ]);
  });
});
