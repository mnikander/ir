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
            lines: [["%left", "constant", { value: 11 }], [
              "%right",
              "constant",
              { value: 13 },
            ]],
            terminator: [null, "jump", "@join"],
          },
          {
            name: "@join",
            phis: [
              ["%x", "phi", [["@entry", ["%right"]]]],
              ["%y", "phi", [["@entry", ["%left"]]]],
            ],
            lines: [["%sum", "add", ["%x"], ["%y"]]],
            terminator: [null, "return", ["%sum"]],
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
            lines: [["%left", "constant", { value: 11 }], [
              "%right",
              "constant",
              { value: 13 },
            ]],
            terminator: [null, "jump", "@phi.join.from.entry"],
          },
          {
            name: "@phi.join.from.entry",
            phis: [],
            lines: [
              ["%phi.join.from.entry.x", "copy", ["%right"]],
              ["%phi.join.from.entry.y", "copy", ["%left"]],
              ["%x", "copy", ["%phi.join.from.entry.x"]],
              ["%y", "copy", ["%phi.join.from.entry.y"]],
            ],
            terminator: [null, "jump", "@join"],
          },
          {
            name: "@join",
            phis: [],
            lines: [["%sum", "add", ["%x"], ["%y"]]],
            terminator: [null, "return", ["%sum"]],
          },
        ],
      },
    ]);
  });
});
