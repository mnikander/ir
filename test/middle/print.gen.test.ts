import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";

describe("MIR printer", () => {
  it("prints empty and typed structural nodes", () => {
    const empty: MIR.Program = ["program"];
    expect(print(empty)).toBe("\n(program)\n");

    const input: MIR.Program = [
      "program",
      [
        "function",
        ["parameters", ["Int"], ["Borrowed", ["Owned", ["Int"]]]],
        ["result", ["Owned", ["Int"]]],
        ["locals"],
        ["blocks"],
      ],
    ];

    expect(print(input)).toBe(
      "\n(program\n" +
        "  (function\n" +
        "    (parameters Int (Borrowed (Owned Int)))\n" +
        "    (result (Owned Int))\n" +
        "    (locals)\n" +
        "    (blocks)))\n",
    );
  });

  it("prints phi, calls, memory operations, and multiple functions", () => {
    const input: MIR.Program = [
      "program",
      [
        "function",
        ["parameters", ["Int"]],
        ["result", ["Int"]],
        ["locals", ["Int"], ["Owned", ["Int"]]],
        [
          "blocks",
          ["phi", ["define", 0], [
            ["from", ["label", 1], ["read", 2]],
            ["from", ["label", 2], ["move", 3]],
          ]],
          ["call", ["define", 1], ["label", 0], [
            "arguments",
            ["read", 0],
            ["move", 2],
          ]],
          ["call", ["define", 2], ["label", 1], ["arguments"]],
          ["constant", ["define", 3], ["literal", 42]],
          ["copy", ["define", 4], ["read", 3]],
          ["own", ["define", 5], ["move", 4]],
          ["borrow", ["define", 6], ["read", 5]],
          ["load", ["define", 7], ["move", 6]],
          ["drop", ["move", 5]],
          ["return", ["read", 7]],
        ],
      ],
      [
        "function",
        ["parameters"],
        ["result", ["Int"]],
        ["locals"],
        ["blocks", ["return", ["move", 0]]],
      ],
    ];

    expect(print(input)).toBe(
      "\n(program\n" +
        "  (function\n" +
        "    (parameters Int)\n" +
        "    (result Int)\n" +
        "    (locals Int (Owned Int))\n" +
        "    (blocks\n" +
        "      (phi (define 0) (from (label 1) (read 2)) (from (label 2) (move 3)))\n" +
        "      (call (define 1) (label 0) (arguments (read 0) (move 2)))\n" +
        "      (call (define 2) (label 1) (arguments))\n" +
        "      (constant (define 3) (literal 42))\n" +
        "      (copy (define 4) (read 3))\n" +
        "      (own (define 5) (move 4))\n" +
        "      (borrow (define 6) (read 5))\n" +
        "      (load (define 7) (move 6))\n" +
        "      (drop (move 5))\n" +
        "      (return (read 7))))\n" +
        "  (function\n" +
        "    (parameters)\n" +
        "    (result Int)\n" +
        "    (locals)\n" +
        "    (blocks\n" +
        "      (return (move 0)))))\n",
    );
  });

  it("prints every arithmetic, comparison, and control-flow instruction", () => {
    const binary_tags = [
      "add",
      "subtract",
      "multiply",
      "divide",
      "remainder",
      "minimum",
      "maximum",
      "equal",
      "unequal",
      "less",
      "less_equal",
      "greater",
      "greater_equal",
    ] as const;
    const lines: MIR.Line[] = binary_tags.map((tag, index) =>
      [
        tag,
        ["define", index],
        ["read", 0],
        ["move", 1],
      ] as MIR.Line
    );
    lines.push(
      ["negate", ["define", 13], ["read", 2]],
      ["branch", ["move", 13], [["label", 1], ["label", 2]]],
      ["return", ["read", 13]],
    );
    const input: MIR.Program = [
      "program",
      ["function", ["parameters"], ["result", ["Int"]], ["locals"], [
        "blocks",
        ...lines,
      ]],
    ];

    const expected_lines = binary_tags.map((tag, index) =>
      `      (${tag} (define ${index}) (read 0) (move 1))`
    );
    expect(print(input)).toBe(
      "\n(program\n" +
        "  (function\n" +
        "    (parameters)\n" +
        "    (result Int)\n" +
        "    (locals)\n" +
        "    (blocks\n" +
        expected_lines.join("\n") + "\n" +
        "      (negate (define 13) (read 2))\n" +
        "      (branch (move 13) (label 1) (label 2))\n" +
        "      (return (read 13)))))\n",
    );
  });
});
