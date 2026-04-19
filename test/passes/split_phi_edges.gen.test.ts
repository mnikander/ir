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
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [["%condition", "Constant", { value: 1 }]],
            terminator: [null, "Branch", ["%condition"], ["@left", "@join"]],
          },
          {
            name: "@left",
            joins: [],
            lines: [["%left", "Constant", { value: 11 }]],
            terminator: [null, "Jump", "@join"],
          },
          {
            name: "@join",
            joins: [
              ["%result", "Phi", [["@entry", ["%condition"]], ["@left", [
                "%left",
              ]]]],
            ],
            lines: [],
            terminator: [null, "Return", ["%result"]],
          },
        ],
      },
    ];

    expect(split_phi_edges(input)).toEqual([
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [["%condition", "Constant", { value: 1 }]],
            terminator: [null, "Branch", ["%condition"], [
              "@left",
              "@phi.join.from.entry",
            ]],
          },
          {
            name: "@left",
            joins: [],
            lines: [["%left", "Constant", { value: 11 }]],
            terminator: [null, "Jump", "@phi.join.from.left"],
          },
          {
            name: "@phi.join.from.entry",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@join"],
            edge: { target: "@join", predecessor: "@entry" },
          },
          {
            name: "@phi.join.from.left",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@join"],
            edge: { target: "@join", predecessor: "@left" },
          },
          {
            name: "@join",
            joins: [
              ["%result", "Phi", [["@entry", ["%condition"]], ["@left", [
                "%left",
              ]]]],
            ],
            lines: [],
            terminator: [null, "Return", ["%result"]],
          },
        ],
      },
    ]);
  });
});
