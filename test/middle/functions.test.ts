import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";
import { lower } from "../../src/middle_to_low/lower.gen.ts";
import { evaluate } from "../../src/low/machine.ts";

describe("MIR: function call", () => {
  it("must support calling the identity function", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 11)))
      (let 1 (identity (constant 13)))
      (let 2 (call (function_id 1) (arguments (read 1))))
      (return 2)))
  (function
    (parameters Int)
    (locals)
    (result Int)
    (block
      (return 0))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["let", 1, ["identity", ["constant", 13]]],
        ["let", 2, ["call", ["function_id", 1], ["arguments", ["read", 1]]]],
        ["return", 2],
      ],
    ], [
      "function",
      ["parameters", ["Int"]],
      ["locals"],
      ["result", ["Int"]],
      [
        "block",
        ["return", 0],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(13);
  });

  it("must support calling a binary function", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 11)))
      (let 1 (identity (constant 13)))
      (let 2 (call (function_id 1) (arguments (read 0) (read 1))))
      (return 2)))
  (function
    (parameters Int Int)
    (locals)
    (result Int)
    (block
      (return 0))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["let", 1, ["identity", ["constant", 13]]],
        ["let", 2, ["call", ["function_id", 1], ["arguments", ["read", 0], [
          "read",
          1,
        ]]]],
        ["return", 2],
      ],
    ], [
      "function",
      ["parameters", ["Int"], ["Int"]],
      ["locals"],
      ["result", ["Int"]],
      [
        "block",
        ["return", 0],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11);
  });

  it("must evaluate tail-recursive functions", () => {
    // C-style:
    //
    // return factorial(5)
    // function factorial(n, acc = 1):
    //     return n == 1 ? acc : factorial(n-1, n*acc);

    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 5)))
      (let 1 (identity (constant 1)))
      (let 2 (call (function_id 1) (arguments (read 0) (read 1))))
      (return 2)))
  (function
    (parameters Int Int)
    (locals Int Int Int Int Int Int)
    (result Int)
    (block
      (let 3 (equal (read 0) (constant 1)))
      (branch (read 3) (block_id 2) (block_id 1)))
    (block
      (let 4 (subtract (read 0) (constant 1)))
      (let 5 (multiply (read 0) (read 1)))
      (let 6 (call (function_id 1) (arguments (read 4) (read 5))))
      (jump (block_id 2)))
    (block
      (let 7 (phi (sources (from (block_id 1) (read 6)) (from (block_id 0) (read 1)))))
      (return 7))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 5]]],
        ["let", 1, ["identity", ["constant", 1]]],
        ["let", 2, ["call", ["function_id", 1], ["arguments", ["read", 0], [
          "read",
          1,
        ]]]],
        ["return", 2],
      ],
    ], [
      "function",
      ["parameters", ["Int"], ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 3, ["equal", ["read", 0], ["constant", 1]]],
        ["branch", ["read", 3], ["block_id", 2], ["block_id", 1]],
      ],
      [
        "block",
        ["let", 4, ["subtract", ["read", 0], ["constant", 1]]],
        ["let", 5, ["multiply", ["read", 0], ["read", 1]]],
        ["let", 6, ["call", ["function_id", 1], ["arguments", ["read", 4], [
          "read",
          5,
        ]]]],
        ["jump", ["block_id", 2]],
      ],
      [
        "block",
        ["let", 7, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["read", 6]],
          ["from", ["block_id", 0], ["read", 1]],
        ]]],
        ["return", 7],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(120);
  });
});
