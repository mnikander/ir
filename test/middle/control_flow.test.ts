import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";
import { lower } from "../../src/middle_to_low/lower.gen.ts";
import { evaluate } from "../../src/low/machine.ts";

describe("MIR: jump", () => {
  it("must execute the correct line of code after an unconditional jump", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (jump (block_id 2)))
    (block
      (let 0 (identity (constant 11)))
      (return 0))
    (block
      (let 1 (identity (constant 13)))
      (return 1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["jump", ["block_id", 2]],
      ],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["return", 0],
      ],
      [
        "block",
        ["let", 1, ["identity", ["constant", 13]]],
        ["return", 1],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(13);
  });
});

describe("MIR: branch", () => {
  it("must execute first branch if the condition is true", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (branch (constant 1) (block_id 1) (block_id 2)))
    (block
      (let 0 (identity (constant 11)))
      (return 0))
    (block
      (let 1 (identity (constant 13)))
      (return 1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["branch", ["constant", 1], ["block_id", 1], ["block_id", 2]],
      ],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["return", 0],
      ],
      [
        "block",
        ["let", 1, ["identity", ["constant", 13]]],
        ["return", 1],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11);
  });

  it("must execute second branch if the condition is false", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (branch (constant 0) (block_id 1) (block_id 2)))
    (block
      (let 0 (identity (constant 11)))
      (return 0))
    (block
      (let 1 (identity (constant 13)))
      (return 1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["branch", ["constant", 0], ["block_id", 1], ["block_id", 2]],
      ],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["return", 0],
      ],
      [
        "block",
        ["let", 1, ["identity", ["constant", 13]]],
        ["return", 1],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(13);
  });

  it("must perform computations inside of branches", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 11)))
      (let 1 (identity (constant 13)))
      (let 2 (identity (constant 281)))
      (branch (constant 0) (block_id 1) (block_id 2)))
    (block
      (let 3 (add (read 0) (read 1)))
      (jump (block_id 3)))
    (block
      (let 4 (add (read 1) (read 2)))
      (jump (block_id 3)))
    (block
      (return 4))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["let", 1, ["identity", ["constant", 13]]],
        ["let", 2, ["identity", ["constant", 281]]],
        ["branch", ["constant", 0], ["block_id", 1], ["block_id", 2]],
      ],
      [
        "block",
        ["let", 3, ["add", ["read", 0], ["read", 1]]],
        ["jump", ["block_id", 3]],
      ],
      [
        "block",
        ["let", 4, ["add", ["read", 1], ["read", 2]]],
        ["jump", ["block_id", 3]],
      ],
      [
        "block",
        ["return", 4],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(13 + 281);
  });

  it("must throw an error when condition is not a boolean", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (branch (constant 2) (block_id 1) (block_id 2)))
    (block
      (let 0 (identity (constant 11)))
      (return 0))
    (block
      (let 1 (identity (constant 13)))
      (return 1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["branch", ["constant", 2], ["block_id", 1], ["block_id", 2]], // error: 2 is not a boolean
      ],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["return", 0],
      ],
      [
        "block",
        ["let", 1, ["identity", ["constant", 13]]],
        ["return", 1],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow();
  });
});

describe("MIR: phi (control flow join)", () => {
  it("phi node must assign from the correct register after an unconditional jump", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int)
    (result Int)
    (block
      (jump (block_id 2)))
    (block
      (let 0 (identity (constant 11)))
      (jump (block_id 3)))
    (block
      (let 1 (identity (constant 13)))
      (jump (block_id 3)))
    (block
      (let 2 (phi (sources (from (block_id 1) (read 0)) (from (block_id 2) (read 1)))))
      (return 2))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["jump", ["block_id", 2]],
      ],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["jump", ["block_id", 3]],
      ],
      [
        "block",
        ["let", 1, ["identity", ["constant", 13]]],
        ["jump", ["block_id", 3]],
      ],
      [
        "block",
        ["let", 2, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["read", 0]],
          ["from", ["block_id", 2], ["read", 1]],
        ]]],
        ["return", 2],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(13);
  });

  it("phi node must assign from the correct register when executing a loop", () => {
    // C-style:
    //
    // int i = 0;
    // while (i != 3) {
    //     i++;
    // }
    // return i;
    //
    //
    // IR-code:
    //
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int Int Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 0)))
      (let 1 (identity (constant 1)))
      (let 2 (identity (constant 3)))
      (jump (block_id 1)))
    (block
      (let 3 (phi (sources (from (block_id 0) (read 0)) (from (block_id 1) (read 4)))))
      (let 4 (add (read 1) (read 3)))
      (let 5 (unequal (read 3) (read 2)))
      (branch (read 5) (block_id 1) (block_id 2)))
    (block
      (return 3))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 0]]],
        ["let", 1, ["identity", ["constant", 1]]],
        ["let", 2, ["identity", ["constant", 3]]],
        ["jump", ["block_id", 1]],
      ],
      [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 0], ["read", 0]],
          ["from", ["block_id", 1], ["read", 4]],
        ]]],
        ["let", 4, ["add", ["read", 1], ["read", 3]]],
        ["let", 5, ["unequal", ["read", 3], ["read", 2]]],
        ["branch", ["read", 5], ["block_id", 1], ["block_id", 2]],
      ],
      [
        "block",
        ["return", 3],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(3);
  });

  it("phi node must allow assignment from dominator blocks which are not the immediate dominator", () => {
    // Control flow graph with a split in the Entry node and a Join in node D
    //
    //      Entry
    //      /   \
    //     A     B
    //      \    |
    //       \   C
    //        \ /
    //         D
    //
    //
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int Int Int Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 0)))
      (branch (read 0) (block_id 1) (block_id 2)))
    (block
      (let 1 (identity (constant 11)))
      (jump (block_id 4)))
    (block
      (let 2 (identity (constant 13)))
      (jump (block_id 3)))
    (block
      (let 3 (identity (constant 281)))
      (jump (block_id 4)))
    (block
      (let 4 (phi (sources (from (block_id 1) (read 1)) (from (block_id 3) (read 2)))))
      (let 5 (phi (sources (from (block_id 1) (read 1)) (from (block_id 3) (read 3)))))
      (let 6 (add (read 4) (read 5)))
      (return 6))))
`;

    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 0]]],
        ["branch", ["read", 0], ["block_id", 1], ["block_id", 2]],
      ],
      [
        "block",
        ["let", 1, ["identity", ["constant", 11]]],
        ["jump", ["block_id", 4]],
      ],
      [
        "block",
        ["let", 2, ["identity", ["constant", 13]]],
        ["jump", ["block_id", 3]],
      ],
      [
        "block",
        ["let", 3, ["identity", ["constant", 281]]],
        ["jump", ["block_id", 4]],
      ],
      [
        "block",
        ["let", 4, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["read", 1]],
          ["from", ["block_id", 3], ["read", 2]],
        ]]],
        ["let", 5, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["read", 1]],
          ["from", ["block_id", 3], ["read", 3]],
        ]]],
        ["let", 6, ["add", ["read", 4], ["read", 5]]],
        ["return", 6],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(13 + 281);
  });

  it("phi node must allow assignment when both inputs are available", () => {
    //
    //      Entry
    //        |
    //        A
    //      / |
    //     B  |
    //      \ |
    //        C
    //
    //
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int Int)
    (result Int)
    (block
      (jump (block_id 1)))
    (block
      (let 0 (identity (constant 11)))
      (let 1 (identity (constant 1)))
      (branch (read 1) (block_id 2) (block_id 3)))
    (block
      (let 2 (identity (constant 13)))
      (jump (block_id 3)))
    (block
      (let 3 (phi (sources (from (block_id 1) (read 0)) (from (block_id 2) (read 2)))))
      (return 3))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["jump", ["block_id", 1]],
      ],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["let", 1, ["identity", ["constant", 1]]],
        ["branch", ["read", 1], ["block_id", 2], ["block_id", 3]],
      ],
      [
        "block",
        ["let", 2, ["identity", ["constant", 13]]],
        ["jump", ["block_id", 3]],
      ],
      [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["read", 0]],
          ["from", ["block_id", 2], ["read", 2]],
        ]]],
        ["return", 3],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(13);
  });

  it("must allow assignment when three inputs are available", () => {
    //
    //        Entry
    //        |   |
    //        A   |
    //      / |   |
    //     B  |  /
    //      \ | /
    //        C
    //
    //
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 0)))
      (branch (read 0) (block_id 1) (block_id 3)))
    (block
      (let 1 (identity (constant 1)))
      (branch (read 1) (block_id 2) (block_id 3)))
    (block
      (let 2 (identity (constant 1)))
      (jump (block_id 3)))
    (block
      (let 3 (phi (sources (from (block_id 0) (read 0)) (from (block_id 1) (read 1)) (from (block_id 2) (read 2)))))
      (return 3))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 0]]],
        ["branch", ["read", 0], ["block_id", 1], ["block_id", 3]],
      ],
      [
        "block",
        ["let", 1, ["identity", ["constant", 1]]],
        ["branch", ["read", 1], ["block_id", 2], ["block_id", 3]],
      ],
      [
        "block",
        ["let", 2, ["identity", ["constant", 1]]],
        ["jump", ["block_id", 3]],
      ],
      [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 0], ["read", 0]],
          ["from", ["block_id", 1], ["read", 1]],
          ["from", ["block_id", 2], ["read", 2]],
        ]]],
        ["return", 3],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(0);
  });

  it("must throw an error when a phi node is non-exhaustive", () => {
    //
    //        Entry
    //        |   |
    //        A   |
    //      / |   |
    //     B  |  /
    //      \ | /
    //        C
    //
    //
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 0)))
      (branch (read 0) (block_id 1) (block_id 3)))
    (block
      (let 1 (identity (constant 1)))
      (branch (read 1) (block_id 2) (block_id 3)))
    (block
      (let 2 (identity (constant 1)))
      (jump (block_id 3)))
    (block
      (let 3 (phi (sources (from (block_id 1) (read 1)) (from (block_id 2) (read 2)))))
      (return 3))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 0]]],
        ["branch", ["read", 0], ["block_id", 1], ["block_id", 3]],
      ],
      [
        "block",
        ["let", 1, ["identity", ["constant", 1]]],
        ["branch", ["read", 1], ["block_id", 2], ["block_id", 3]],
      ],
      [
        "block",
        ["let", 2, ["identity", ["constant", 1]]],
        ["jump", ["block_id", 3]],
      ],
      [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["read", 1]],
          ["from", ["block_id", 2], ["read", 2]],
        ]]],
        ["return", 3],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});
