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
            ["let", 0, ["phi", ["sources", ["from", ["block_id", 1], [
              "access",
              2,
            ]], ["from", ["block_id", 2], ["consume", 3]]]]],
            ["let", 1, ["call", ["function_id", 0], [
              "arguments",
              ["access", 0],
              ["consume", 2],
            ]]],
            ["let", 2, ["call", ["function_id", 1], ["arguments"]]],
            ["let", 3, ["copy", ["literal", 42]]],
            ["let", 4, ["copy", ["access", 3]]],
            ["let", 5, ["own", ["consume", 4]]],
            ["let", 6, ["borrow", ["access", 5]]],
            ["let", 7, ["dereference", ["consume", 6]]],
            ["drop", 5],
            ["return", ["access", 7]],
          ],
          ["block"],
        ],
      ],
      [
        "function",
        ["parameters"],
        ["result", ["Int"]],
        ["locals"],
        ["blocks", ["block", ["return", ["consume", 0]]]],
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
        "        (let 0 (phi (sources (from (block_id 1) (access 2)) (from (block_id 2) (consume 3)))))\n" +
        "        (let 1 (call (function_id 0) (arguments (access 0) (consume 2))))\n" +
        "        (let 2 (call (function_id 1) (arguments)))\n" +
        "        (let 3 (copy (literal 42)))\n" +
        "        (let 4 (copy (access 3)))\n" +
        "        (let 5 (own (consume 4)))\n" +
        "        (let 6 (borrow (access 5)))\n" +
        "        (let 7 (dereference (consume 6)))\n" +
        "        (drop 5)\n" +
        "        (return (access 7)))\n" +
        "      (block)))\n" +
        "  (function\n" +
        "    (parameters)\n" +
        "    (result Int)\n" +
        "    (locals)\n" +
        "    (blocks\n" +
        "      (block\n" +
        "        (return (consume 0))))))\n",
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
    const lines: MIR.Line[] = binary_tags.map((
      tag,
      index,
    ) => ["let", index, [tag, ["access", 0], ["consume", 1]]]);
    lines.push(
      ["let", 13, ["negate", ["access", 2]]],
      ["branch", ["literal", 0], ["block_id", 1], ["block_id", 2]],
      ["return", ["access", 13]],
    );
    const input: MIR.Program = [
      "program",
      ["function", ["parameters"], ["result", ["Int"]], ["locals"], [
        "blocks",
        ["block", ...lines],
      ]],
    ];

    const expected_lines = binary_tags.map((tag, index) =>
      `        (let ${index} (${tag} (access 0) (consume 1)))`
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
        "        (let 13 (negate (access 2)))\n" +
        "        (branch (literal 0) (block_id 1) (block_id 2))\n" +
        "        (return (access 13))))))\n",
    );
  });

  it("prints jump instruction", () => {
    const input: MIR.Program = [
      "program",
      [
        "function",
        ["parameters"],
        ["result", ["Int"]],
        ["locals"],
        ["blocks", ["block", ["jump", ["block_id", 42]]]],
      ],
    ];

    expect(print(input)).toBe(
      "\n(program\n" +
        "  (function\n" +
        "    (parameters)\n" +
        "    (result Int)\n" +
        "    (locals)\n" +
        "    (blocks\n" +
        "      (block\n" +
        "        (jump (block_id 42))))))\n",
    );
  });
});
