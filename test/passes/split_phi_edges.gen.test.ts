import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIGH from "../../src/high/high_grammar.ts";
import { split_phi_edges } from "../../src/passes/mod.gen.ts";

describe("split_phi_edges", () => {
  it("inserts edge blocks but keeps phi nodes on the join block", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [["%condition", "constant", ["Int"], { value: 1 }]],
            terminator: [null, "branch", null, ["%condition"], [
              "@left",
              "@join",
            ]],
          },
          {
            name: "@left",
            phis: [],
            lines: [["%left", "constant", ["Int"], { value: 11 }]],
            terminator: [null, "jump", null, "@join"],
          },
          {
            name: "@join",
            phis: [
              ["%result", "phi", ["Int"], [["@entry", ["%condition"]], [
                "@left",
                [
                  "%left",
                ],
              ]]],
            ],
            lines: [],
            terminator: [null, "return", ["Int"], ["%result"]],
          },
        ],
      },
    ];

    expect(split_phi_edges(input)).toEqual([
      {
        name: "@main",
        params: [],
        type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [["%condition", "constant", ["Int"], { value: 1 }]],
            terminator: [null, "branch", null, ["%condition"], [
              "@left",
              "@phi.join.from.entry",
            ]],
          },
          {
            name: "@left",
            phis: [],
            lines: [["%left", "constant", ["Int"], { value: 11 }]],
            terminator: [null, "jump", null, "@phi.join.from.left"],
          },
          {
            name: "@phi.join.from.entry",
            phis: [],
            lines: [],
            terminator: [null, "jump", null, "@join"],
            edge: { target: "@join", predecessor: "@entry" },
          },
          {
            name: "@phi.join.from.left",
            phis: [],
            lines: [],
            terminator: [null, "jump", null, "@join"],
            edge: { target: "@join", predecessor: "@left" },
          },
          {
            name: "@join",
            phis: [
              ["%result", "phi", ["Int"], [["@entry", ["%condition"]], [
                "@left",
                [
                  "%left",
                ],
              ]]],
            ],
            lines: [],
            terminator: [null, "return", ["Int"], ["%result"]],
          },
        ],
      },
    ]);
  });
});
