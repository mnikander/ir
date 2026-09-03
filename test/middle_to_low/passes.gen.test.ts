import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import {
  lower_operations,
  lower_phi_moves,
  split_phi_edges,
  validate_and_index,
} from "../../src/middle_to_low/mod.gen.ts";

function program(lines: MIR.Line[], locals = 1): MIR.Program {
  return ["program", ["function", ["parameters"], ["result", ["Int"]], [
    "locals",
    ...Array.from({ length: locals }, () => ["Int"] as MIR.Type),
  ], ["blocks", ["block", ...lines]]]];
}

describe("MIR to LIR micro-passes", () => {
  it("indexes resources and rejects duplicate definitions", () => {
    const indexed = validate_and_index(
      program([["let", 0, ["copy", ["literal", 1]]], ["return", [
        "access",
        0,
      ]]]),
    );
    expect(indexed[0].resource_count).toBe(1);
    expect(() =>
      validate_and_index(
        program([["let", 0, ["copy", ["literal", 1]]], ["let", 0, ["copy", [
          "literal",
          2,
        ]]], ["return", ["access", 0]]]),
      )
    ).toThrow();
  });

  it("materializes literals above declared resources", () => {
    const output = lower_operations(
      validate_and_index(
        program([["let", 0, ["add", ["literal", 2], ["literal", 3]]], [
          "return",
          ["access", 0],
        ]]),
      ),
    );
    expect(output).toContainEqual([1, "constant", { value: 2 }]);
    expect(output).toContainEqual([2, "constant", { value: 3 }]);
    expect(output).toContainEqual([0, "add", 1, 2]);
  });

  it("drops consumed operands but preserves accessed operands", () => {
    const output = lower_operations(
      validate_and_index(
        program([["let", 0, ["copy", ["literal", 7]]], ["let", 1, ["add", [
          "consume",
          0,
        ], ["literal", 1]]], ["return", ["access", 1]]], 2),
      ),
    );
    expect(output).toContainEqual([0, "drop"]);
    expect(output).not.toContainEqual([1, "drop"]);
  });

  it("splits phi edges and removes phi operations", () => {
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", ["block", ["let", 0, ["copy", ["literal", 1]]], ["jump", [
        "block_id",
        1,
      ]]], ["block", ["let", 1, ["phi", ["sources", ["from", ["block_id", 0], [
        "access",
        0,
      ]]]]], ["return", ["access", 1]]]],
    ]];
    const split = split_phi_edges(validate_and_index(input));
    expect(split[0].blocks.length).toBe(3);
    const lowered = lower_phi_moves(split);
    expect(
      lowered[0].blocks.flatMap((block) => block.lines).some((line) =>
        line[0] === "let" && line[2][0] === "phi"
      ),
    ).toBe(false);
  });

  it("rejects a non-exhaustive phi", () => {
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      [
        "blocks",
        ["block", ["branch", ["literal", 1], ["block_id", 1], ["block_id", 2]]],
        ["block", ["jump", ["block_id", 2]]],
        ["block", ["let", 1, ["phi", ["sources", ["from", ["block_id", 1], [
          "access",
          0,
        ]]]]], ["return", ["access", 1]]],
      ],
    ]];
    expect(() => validate_and_index(input)).toThrow();
  });
});
