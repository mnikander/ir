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
  return ["program", [
    "function",
    ["parameters"],
    [
      "locals",
      ...Array.from({ length: locals }, () => ["Int"] as MIR.Type),
    ],
    ["result", ["Int"]],
    ["block", ...lines],
  ]];
}

describe("MIR to LIR micro-passes", () => {
  it("indexes resources and rejects duplicate definitions", () => {
    const indexed = validate_and_index(
      program([["let", "%0", ["identity", ["constant", 1]]], ["return", "%0"]]),
    );
    expect(indexed[0].resource_count).toBe(1);
    expect(() =>
      validate_and_index(
        program([["let", "%0", ["identity", ["constant", 1]]], ["let", "%0", [
          "identity",
          [
            "constant",
            2,
          ],
        ]], ["return", "%0"]]),
      )
    ).toThrow();
  });

  it("materializes literals above declared resources", () => {
    const output = lower_operations(
      validate_and_index(
        program([["let", "%0", ["add", ["constant", 2], ["constant", 3]]], [
          "return",
          "%0",
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
        program([["let", "%0", ["identity", ["constant", 7]]], ["let", "%1", [
          "add",
          ["move", "%0"],
          ["constant", 1],
        ]], ["return", "%1"]], 2),
      ),
    );
    expect(output).toContainEqual([0, "drop"]);
    expect(output).not.toContainEqual([1, "drop"]);
  });

  it("splits phi edges and removes phi operations", () => {
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["block", ["let", "%0", ["identity", ["constant", 1]]], ["jump", "^1"]],
      ["block", ["let", "%1", ["phi", ["sources", ["from", "^0", [
        "peek",
        "%0",
      ]]]]], ["return", "%1"]],
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
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["block", ["branch", ["constant", 1], "^1", "^2"]],
      ["block", ["jump", "^2"]],
      ["block", ["let", "%1", ["phi", ["sources", ["from", "^1", [
        "peek",
        "%0",
      ]]]]], ["return", "%1"]],
    ]];
    expect(() => validate_and_index(input)).toThrow();
  });
});
