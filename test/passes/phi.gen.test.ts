import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIGH from "../../src/high/high_grammar.ts";
import {
  collect_predecessors,
  lower_phi_moves,
  split_phi_edges,
} from "../../src/passes/mod.gen.ts";

describe("collect_predecessors", () => {
  it("records incoming blocks for jump and branch targets", () => {
    const blocks: HIGH.Block[] = [
      {
        name: "@entry",
        joins: [],
        lines: [
          ["%condition", "Constant", { value: 1 }],
        ],
        terminator: [null, "Branch", ["%condition"], [
          "@left",
          "@join",
        ]],
      },
      {
        name: "@left",
        joins: [],
        lines: [],
        terminator: [null, "Jump", "@join"],
      },
      {
        name: "@join",
        joins: [],
        lines: [],
        terminator: [null, "Return", ["%condition"]],
      },
    ];

    const predecessors = collect_predecessors(blocks);

    expect([...predecessors.entries()]).toEqual([
      ["@entry", []],
      ["@left", ["@entry"]],
      ["@join", ["@entry", "@left"]],
    ]);
  });
});

function eliminate_phi_nodes(input: HIGH.Program): HIGH.Program {
  return lower_phi_moves(split_phi_edges(input));
}

describe("phi elimination pipeline", () => {
  it("splits every incoming edge to a phi block", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%condition", "Constant", { value: 1 }],
            ],
            terminator: [null, "Branch", ["%condition"], [
              "@left",
              "@join",
            ]],
          },
          {
            name: "@left",
            joins: [],
            lines: [
              ["%left", "Constant", { value: 11 }],
            ],
            terminator: [null, "Jump", "@join"],
          },
          {
            name: "@join",
            joins: [
              ["%result", "Phi", [["@entry", ["%condition"]], [
                "@left",
                ["%left"],
              ]]],
            ],
            lines: [],
            terminator: [null, "Return", ["%result"]],
          },
        ],
      },
    ];

    const output = eliminate_phi_nodes(input);

    expect(output).toEqual([
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%condition", "Constant", { value: 1 }],
            ],
            terminator: [null, "Branch", ["%condition"], [
              "@left",
              "@phi.join.from.entry",
            ]],
          },
          {
            name: "@left",
            joins: [],
            lines: [
              ["%left", "Constant", { value: 11 }],
            ],
            terminator: [null, "Jump", "@phi.join.from.left"],
          },
          {
            name: "@phi.join.from.entry",
            joins: [],
            lines: [
              ["%phi.join.from.entry.result", "Copy", ["%condition"]],
              ["%result", "Copy", ["%phi.join.from.entry.result"]],
            ],
            terminator: [null, "Jump", "@join"],
          },
          {
            name: "@phi.join.from.left",
            joins: [],
            lines: [
              ["%phi.join.from.left.result", "Copy", ["%left"]],
              ["%result", "Copy", ["%phi.join.from.left.result"]],
            ],
            terminator: [null, "Jump", "@join"],
          },
          {
            name: "@join",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%result"]],
          },
        ],
      },
    ]);
  });

  it("uses temporaries before writing final phi destinations", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%left", "Constant", { value: 11 }],
              ["%right", "Constant", { value: 13 }],
            ],
            terminator: [null, "Jump", "@join"],
          },
          {
            name: "@join",
            joins: [
              ["%x", "Phi", [["@entry", ["%right"]]]],
              ["%y", "Phi", [["@entry", ["%left"]]]],
            ],
            lines: [
              ["%sum", "Add", ["%x"], ["%y"]],
            ],
            terminator: [null, "Return", ["%sum"]],
          },
        ],
      },
    ];

    const output = eliminate_phi_nodes(input);

    expect(output).toEqual([
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%left", "Constant", { value: 11 }],
              ["%right", "Constant", { value: 13 }],
            ],
            terminator: [null, "Jump", "@phi.join.from.entry"],
          },
          {
            name: "@phi.join.from.entry",
            joins: [],
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
            joins: [],
            lines: [
              ["%sum", "Add", ["%x"], ["%y"]],
            ],
            terminator: [null, "Return", ["%sum"]],
          },
        ],
      },
    ]);
  });
});
