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

    const empty_block: MIR.Program = [
      "program",
      [
        "function",
        ["parameters"],
        ["result", ["Int"]],
        ["locals"],
        ["blocks", ["block"]],
      ],
    ];
    expect(print(empty_block)).toBe(
      "\n(program\n" +
        "  (function\n" +
        "    (parameters)\n" +
        "    (result Int)\n" +
        "    (locals)\n" +
        "    (blocks\n" +
        "      (block))))\n",
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
          [
            "block",
            ["phi", ["let", 0], ["sources", ["from", ["label", 1], [
              "read",
              2,
            ]], ["from", ["label", 2], ["move", 3]]]],
            ["call", ["let", 1], ["function_id", 0], [
              "arguments",
              ["read", 0],
              ["move", 2],
            ]],
            ["call", ["let", 2], ["function_id", 1], ["arguments"]],
            ["constant", ["let", 3], ["literal", 42]],
            ["copy", ["let", 4], ["read", 3]],
            ["own", ["let", 5], ["move", 4]],
            ["borrow", ["let", 6], ["read", 5]],
            ["load", ["let", 7], ["move", 6]],
            ["drop", ["move", 5]],
            ["return", ["read", 7]],
          ],
          ["block"],
        ],
      ],
      [
        "function",
        ["parameters"],
        ["result", ["Int"]],
        ["locals"],
        ["blocks", ["block", ["return", ["move", 0]]]],
      ],
    ];

    expect(print(input)).toBe(
      "\n(program\n" +
        "  (function\n" +
        "    (parameters Int)\n" +
        "    (result Int)\n" +
        "    (locals Int (Owned Int))\n" +
        "    (blocks\n" +
        "      (block\n" +
        "        (phi (let 0) (sources (from (label 1) (read 2)) (from (label 2) (move 3))))\n" +
        "        (call (let 1) (function_id 0) (arguments (read 0) (move 2)))\n" +
        "        (call (let 2) (function_id 1) (arguments))\n" +
        "        (constant (let 3) (literal 42))\n" +
        "        (copy (let 4) (read 3))\n" +
        "        (own (let 5) (move 4))\n" +
        "        (borrow (let 6) (read 5))\n" +
        "        (load (let 7) (move 6))\n" +
        "        (drop (move 5))\n" +
        "        (return (read 7)))\n" +
        "      (block)))\n" +
        "  (function\n" +
        "    (parameters)\n" +
        "    (result Int)\n" +
        "    (locals)\n" +
        "    (blocks\n" +
        "      (block\n" +
        "        (return (move 0))))))\n",
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
        ["let", index],
        ["read", 0],
        ["move", 1],
      ] as MIR.Line
    );
    lines.push(
      ["negate", ["let", 13], ["read", 2]],
      ["branch", ["literal", 0], ["targets", 1, 2]],
      ["return", ["read", 13]],
    );
    const input: MIR.Program = [
      "program",
      ["function", ["parameters"], ["result", ["Int"]], ["locals"], [
        "blocks",
        ["block", ...lines],
      ]],
    ];

    const expected_lines = binary_tags.map((tag, index) =>
      `        (${tag} (let ${index}) (read 0) (move 1))`
    );
    expect(print(input)).toBe(
      "\n(program\n" +
        "  (function\n" +
        "    (parameters)\n" +
        "    (result Int)\n" +
        "    (locals)\n" +
        "    (blocks\n" +
        "      (block\n" +
        expected_lines.join("\n") + "\n" +
        "        (negate (let 13) (read 2))\n" +
        "        (branch (literal 0) (targets 1 2))\n" +
        "        (return (read 13))))))\n",
    );
  });
});
