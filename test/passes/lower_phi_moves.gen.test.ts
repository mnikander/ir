import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import {
  lower_phi_moves,
  split_phi_edges,
} from "../../src/hir_to_lir/mod.gen.ts";
import * as HIGH from "../../src/high/high_grammar.ts";

describe("lower_phi_moves", () => {
  it("fills split edge blocks with read-then-write copies and clears phis", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [["%left", "constant", ["Int"], { value: 11 }], [
              "%right",
              "constant",
              ["Int"],
              { value: 13 },
            ]],
            terminator: [null, "jump", null, "@join"],
          },
          {
            name: "@join",
            phis: [
              ["%x", "phi", ["Int"], [["@entry", ["%right"]]]],
              ["%y", "phi", ["Int"], [["@entry", ["%left"]]]],
            ],
            lines: [["%sum", "add", ["Int"], ["%x"], ["%y"]]],
            terminator: [null, "return", ["Int"], ["%sum"]],
          },
        ],
      },
    ];

    expect(lower_phi_moves(split_phi_edges(input))).toEqual([
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [["%left", "constant", ["Int"], { value: 11 }], [
              "%right",
              "constant",
              ["Int"],
              { value: 13 },
            ]],
            terminator: [null, "jump", null, "@phi.join.from.entry"],
          },
          {
            name: "@phi.join.from.entry",
            phis: [],
            lines: [
              ["%phi.join.from.entry.x", "copy", ["Int"], ["%right"]],
              ["%phi.join.from.entry.y", "copy", ["Int"], ["%left"]],
              ["%x", "copy", ["Int"], ["%phi.join.from.entry.x"]],
              ["%y", "copy", ["Int"], ["%phi.join.from.entry.y"]],
            ],
            terminator: [null, "jump", null, "@join"],
          },
          {
            name: "@join",
            phis: [],
            lines: [["%sum", "add", ["Int"], ["%x"], ["%y"]]],
            terminator: [null, "return", ["Int"], ["%sum"]],
          },
        ],
      },
    ]);
  });
});
