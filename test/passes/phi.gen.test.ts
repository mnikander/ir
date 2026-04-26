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
        phis: [],
        lines: [
          ["%condition", "constant", ["Int"], { value: 1 }],
        ],
        terminator: [null, "branch", null, ["%condition"], [
          "@left",
          "@join",
        ]],
      },
      {
        name: "@left",
        phis: [],
        lines: [],
        terminator: [null, "jump", null, "@join"],
      },
      {
        name: "@join",
        phis: [],
        lines: [],
        terminator: [null, "return", ["Int"], ["%condition"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%condition", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "branch", null, ["%condition"], [
              "@left",
              "@join",
            ]],
          },
          {
            name: "@left",
            phis: [],
            lines: [
              ["%left", "constant", ["Int"], { value: 11 }],
            ],
            terminator: [null, "jump", null, "@join"],
          },
          {
            name: "@join",
            phis: [
              ["%result", "phi", ["Int"], [["@entry", ["%condition"]], [
                "@left",
                ["%left"],
              ]]],
            ],
            lines: [],
            terminator: [null, "return", ["Int"], ["%result"]],
          },
        ],
      },
    ];

    const output = eliminate_phi_nodes(input);

    expect(output).toEqual([
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%condition", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "branch", null, ["%condition"], [
              "@left",
              "@phi.join.from.entry",
            ]],
          },
          {
            name: "@left",
            phis: [],
            lines: [
              ["%left", "constant", ["Int"], { value: 11 }],
            ],
            terminator: [null, "jump", null, "@phi.join.from.left"],
          },
          {
            name: "@phi.join.from.entry",
            phis: [],
            lines: [
              ["%phi.join.from.entry.result", "copy", ["Int"], [
                "%condition",
              ]],
              ["%result", "copy", ["Int"], ["%phi.join.from.entry.result"]],
            ],
            terminator: [null, "jump", null, "@join"],
          },
          {
            name: "@phi.join.from.left",
            phis: [],
            lines: [
              ["%phi.join.from.left.result", "copy", ["Int"], ["%left"]],
              ["%result", "copy", ["Int"], ["%phi.join.from.left.result"]],
            ],
            terminator: [null, "jump", null, "@join"],
          },
          {
            name: "@join",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%result"]],
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
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%left", "constant", ["Int"], { value: 11 }],
              ["%right", "constant", ["Int"], { value: 13 }],
            ],
            terminator: [null, "jump", null, "@join"],
          },
          {
            name: "@join",
            phis: [
              ["%x", "phi", ["Int"], [["@entry", ["%right"]]]],
              ["%y", "phi", ["Int"], [["@entry", ["%left"]]]],
            ],
            lines: [
              ["%sum", "add", ["Int"], ["%x"], ["%y"]],
            ],
            terminator: [null, "return", ["Int"], ["%sum"]],
          },
        ],
      },
    ];

    const output = eliminate_phi_nodes(input);

    expect(output).toEqual([
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%left", "constant", ["Int"], { value: 11 }],
              ["%right", "constant", ["Int"], { value: 13 }],
            ],
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
            lines: [
              ["%sum", "add", ["Int"], ["%x"], ["%y"]],
            ],
            terminator: [null, "return", ["Int"], ["%sum"]],
          },
        ],
      },
    ]);
  });
});
