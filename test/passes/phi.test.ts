import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIGH from "../../src/high/high_grammar.ts";
import {
  collect_predecessors,
  eliminate_phi_nodes,
} from "../../src/passes/phi_elimination/mod.gen.ts";

describe("collect_predecessors", () => {
  it("records incoming blocks for jump and branch targets", () => {
    const blocks: HIGH.Block[] = [
      {
        name: "@main.entry",
        joins: [],
        lines: [
          ["%condition", "Constant", { value: 1 }],
        ],
        terminator: [null, "Branch", ["%condition"], [
          "@main.left",
          "@main.join",
        ]],
      },
      {
        name: "@main.left",
        joins: [],
        lines: [],
        terminator: [null, "Jump", "@main.join"],
      },
      {
        name: "@main.join",
        joins: [],
        lines: [],
        terminator: [null, "Return", ["%condition"]],
      },
    ];

    const predecessors = collect_predecessors(blocks);

    expect([...predecessors.entries()]).toEqual([
      ["@main.entry", []],
      ["@main.left", ["@main.entry"]],
      ["@main.join", ["@main.entry", "@main.left"]],
    ]);
  });
});

describe("eliminate_phi_nodes", () => {
  it("splits every incoming edge to a phi block", () => {
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%condition", "Constant", { value: 1 }],
            ],
            terminator: [null, "Branch", ["%condition"], [
              "@main.left",
              "@main.join",
            ]],
          },
          {
            name: "@main.left",
            joins: [],
            lines: [
              ["%left", "Constant", { value: 11 }],
            ],
            terminator: [null, "Jump", "@main.join"],
          },
          {
            name: "@main.join",
            joins: [
              ["%result", "Phi", [["@main.entry", ["%condition"]], [
                "@main.left",
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
            name: "@main.entry",
            joins: [],
            lines: [
              ["%condition", "Constant", { value: 1 }],
            ],
            terminator: [null, "Branch", ["%condition"], [
              "@main.left",
              "@phi.main.join.from.main.entry",
            ]],
          },
          {
            name: "@main.left",
            joins: [],
            lines: [
              ["%left", "Constant", { value: 11 }],
            ],
            terminator: [null, "Jump", "@phi.main.join.from.main.left"],
          },
          {
            name: "@phi.main.join.from.main.entry",
            joins: [],
            lines: [
              ["%phi.main.join.from.main.entry.result", "Copy", ["%condition"]],
              ["%result", "Copy", ["%phi.main.join.from.main.entry.result"]],
            ],
            terminator: [null, "Jump", "@main.join"],
          },
          {
            name: "@phi.main.join.from.main.left",
            joins: [],
            lines: [
              ["%phi.main.join.from.main.left.result", "Copy", ["%left"]],
              ["%result", "Copy", ["%phi.main.join.from.main.left.result"]],
            ],
            terminator: [null, "Jump", "@main.join"],
          },
          {
            name: "@main.join",
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
            name: "@main.entry",
            joins: [],
            lines: [
              ["%left", "Constant", { value: 11 }],
              ["%right", "Constant", { value: 13 }],
            ],
            terminator: [null, "Jump", "@main.join"],
          },
          {
            name: "@main.join",
            joins: [
              ["%x", "Phi", [["@main.entry", ["%right"]]]],
              ["%y", "Phi", [["@main.entry", ["%left"]]]],
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
            name: "@main.entry",
            joins: [],
            lines: [
              ["%left", "Constant", { value: 11 }],
              ["%right", "Constant", { value: 13 }],
            ],
            terminator: [null, "Jump", "@phi.main.join.from.main.entry"],
          },
          {
            name: "@phi.main.join.from.main.entry",
            joins: [],
            lines: [
              ["%phi.main.join.from.main.entry.x", "Copy", ["%right"]],
              ["%phi.main.join.from.main.entry.y", "Copy", ["%left"]],
              ["%x", "Copy", ["%phi.main.join.from.main.entry.x"]],
              ["%y", "Copy", ["%phi.main.join.from.main.entry.y"]],
            ],
            terminator: [null, "Jump", "@main.join"],
          },
          {
            name: "@main.join",
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
