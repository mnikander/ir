import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MID from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";

describe("MIR: constants and exit", () => {
  it("must throw error on empty input", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals)
    (blocks)))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals"],
      ["blocks"],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow();
  });

  it("must throw an error when exiting with a pointer instead of a Value", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int (Borrowed Int))
    (blocks
      (block
        (let 0 (constant (literal 11)))
        (let 1 (borrow (read 0)))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Borrowed", ["Int"]]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["let", 1, ["borrow", ["read", 0]]],
        ["return", ["read", 1]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow();
  });

  it("must evaluate a constant", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int)
    (blocks
      (block
        (let 0 (constant (literal 11)))
        (return (read 0))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["return", ["read", 0]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11);
  });
});

describe("MIR: copying of registers", () => {
  it("must copy a constant", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (let 0 (constant (literal 11)))
        (let 1 (copy (read 0)))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["let", 1, ["copy", ["read", 0]]],
        ["return", ["read", 1]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11);
  });
});

describe("MIR: arithmetic operations", () => {
  it("must evaluate integer addition", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int Int)
    (blocks
      (block
        (let 0 (constant (literal 11)))
        (let 1 (constant (literal 13)))
        (let 2 (add (read 0) (read 1)))
        (return (read 2))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["let", 1, ["constant", ["literal", 13]]],
        ["let", 2, ["add", ["read", 0], ["read", 1]]],
        ["return", ["read", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11 + 13);
  });
});

describe("MIR: block_ids, jump, and branch", () => {
  it("must execute the correct line of code after an unconditional jump", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (jump (block_id 2)))
      (block
        (let 0 (constant (literal 11)))
        (return (read 0)))
      (block
        (let 1 (constant (literal 13)))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["jump", ["block_id", 2]],
      ], [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["return", ["read", 0]],
      ], [
        "block",
        ["let", 1, ["constant", ["literal", 13]]],
        ["return", ["read", 1]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(13);
  });

  it("must execute first branch if the condition is true", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int Int Int Int)
    (blocks
      (block
        (let 0 (constant (literal 11)))
        (let 1 (constant (literal 13)))
        (let 2 (constant (literal 281)))
        (branch (literal 1) (block_id 1) (block_id 2)))
      (block
        (let 3 (add (read 0) (read 1)))
        (jump (block_id 3)))
      (block
        (let 4 (add (read 1) (read 2)))
        (jump (block_id 3)))
      (block
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["let", 1, ["constant", ["literal", 13]]],
        ["let", 2, ["constant", ["literal", 281]]],
        ["branch", ["literal", 1], ["block_id", 1], ["block_id", 2]],
      ], [
        "block",
        ["let", 3, ["add", ["read", 0], ["read", 1]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 4, ["add", ["read", 1], ["read", 2]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["return", ["read", 3]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11 + 13);
  });

  it("must execute the second branch when condition is false", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int Int Int Int)
    (blocks
      (block
        (let 0 (constant (literal 11)))
        (let 1 (constant (literal 13)))
        (let 2 (constant (literal 281)))
        (branch (literal 0) (block_id 1) (block_id 2)))
      (block
        (let 3 (add (read 0) (read 1)))
        (jump (block_id 3)))
      (block
        (let 4 (add (read 1) (read 2)))
        (jump (block_id 3)))
      (block
        (return (read 4))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["let", 1, ["constant", ["literal", 13]]],
        ["let", 2, ["constant", ["literal", 281]]],
        ["branch", ["literal", 0], ["block_id", 1], ["block_id", 2]],
      ], [
        "block",
        ["let", 3, ["add", ["read", 0], ["read", 1]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 4, ["add", ["read", 1], ["read", 2]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["return", ["read", 4]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(13 + 281);
  });
});

describe("MIR: function call", () => {
  it("must support calling the identity function", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int Int)
    (blocks
      (block
        (let 0 (constant (literal 11)))
        (let 1 (constant (literal 13)))
        (let 2 (call (function_id 1) (arguments (read 1))))
        (return (read 2)))))
  (function
    (parameters Int)
    (result Int)
    (locals)
    (blocks
      (block
        (return (read 0))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["let", 1, ["constant", ["literal", 13]]],
        ["let", 2, ["call", ["function_id", 1], ["arguments", ["read", 1]]]],
        ["return", ["read", 2]],
      ]],
    ], [
      "function",
      ["parameters", ["Int"]],
      ["result", ["Int"]],
      ["locals"],
      ["blocks", [
        "block",
        ["return", ["read", 0]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(13);
  });

  it("must support calling a binary function", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int Int)
    (blocks
      (block
        (let 0 (constant (literal 11)))
        (let 1 (constant (literal 13)))
        (let 2 (call (function_id 1) (arguments (read 0) (read 1))))
        (return (read 2)))))
  (function
    (parameters Int Int)
    (result Int)
    (locals)
    (blocks
      (block
        (return (read 0))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["let", 1, ["constant", ["literal", 13]]],
        ["let", 2, ["call", ["function_id", 1], ["arguments", ["read", 0], [
          "read",
          1,
        ]]]],
        ["return", ["read", 2]],
      ]],
    ], [
      "function",
      ["parameters", ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["locals"],
      ["blocks", [
        "block",
        ["return", ["read", 0]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11);
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
    (result Int)
    (locals Int Int Int)
    (blocks
      (block
        (let 0 (constant (literal 5)))
        (let 1 (constant (literal 1)))
        (let 2 (call (function_id 1) (arguments (read 0) (read 1))))
        (return (read 2)))))
  (function
    (parameters Int Int)
    (result Int)
    (locals Int Int Int Int Int Int)
    (blocks
      (block
        (let 3 (equal (read 0) (literal 1)))
        (branch (read 3) (block_id 1) (block_id 2)))
      (block
        (let 4 (subtract (read 0) (literal 1)))
        (let 5 (multiply (read 0) (read 1)))
        (let 6 (call (function_id 1) (arguments (read 4) (read 5))))
        (jump (block_id 2)))
      (block
        (let 7 (phi (sources (from (block_id 1) (read 6)) (from (block_id 0) (read 1)))))
        (return (read 7))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 5]]],
        ["let", 1, ["constant", ["literal", 1]]],
        ["let", 2, ["call", ["function_id", 1], ["arguments", ["read", 0], [
          "read",
          1,
        ]]]],
        ["return", ["read", 2]],
      ]],
    ], [
      "function",
      ["parameters", ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 3, ["equal", ["read", 0], ["literal", 1]]],
        ["branch", ["read", 3], ["block_id", 1], ["block_id", 2]],
      ], [
        "block",
        ["let", 4, ["subtract", ["read", 0], ["literal", 1]]],
        ["let", 5, ["multiply", ["read", 0], ["read", 1]]],
        ["let", 6, ["call", ["function_id", 1], ["arguments", ["read", 4], [
          "read",
          5,
        ]]]],
        ["jump", ["block_id", 2]],
      ], [
        "block",
        ["let", 7, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["read", 6]],
          ["from", ["block_id", 0], ["read", 1]],
        ]]],
        ["return", ["read", 7]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(120);
  });
});

describe("MIR: static single assignment", () => {
  it("must throw an error when re-assigning to a register", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (let 0 (constant (literal 11)))
        (let 0 (constant (literal 13)))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["let", 0, ["constant", ["literal", 13]]],
        ["return", ["read", 1]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => {evaluate(lower(input))}).toThrow();
  });

  it("phi node must assign from the correct register after an unconditional jump", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int Int)
    (blocks
      (block
        (jump (block_id 2)))
      (block
        (let 0 (constant (literal 11)))
        (jump (block_id 3)))
      (block
        (let 1 (constant (literal 13)))
        (jump (block_id 3)))
      (block
        (let 2 (phi (sources (from (block_id 1) (read 0)) (from (block_id 2) (read 1)))))
        (return (read 2))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["jump", ["block_id", 2]],
      ], [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 1, ["constant", ["literal", 13]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 2, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["read", 0]],
          ["from", ["block_id", 2], ["read", 1]],
        ]]],
        ["return", ["read", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(13);
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
    (result Int)
    (locals Int Int Int Int Int Int)
    (blocks
      (block
        (let 0 (constant (literal 0)))
        (let 1 (constant (literal 1)))
        (let 2 (constant (literal 3)))
        (jump (block_id 1)))
      (block
        (let 3 (phi (sources (from (block_id 0) (read 0)) (from (block_id 1) (read 4)))))
        (let 4 (add (read 1) (read 3)))
        (let 5 (unequal (read 3) (read 2)))
        (branch (read 5) (block_id 1) (block_id 2)))
      (block
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 0]]],
        ["let", 1, ["constant", ["literal", 1]]],
        ["let", 2, ["constant", ["literal", 3]]],
        ["jump", ["block_id", 1]],
      ], [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 0], ["read", 0]],
          ["from", ["block_id", 1], ["read", 4]],
        ]]],
        ["let", 4, ["add", ["read", 1], ["read", 3]]],
        ["let", 5, ["unequal", ["read", 3], ["read", 2]]],
        ["branch", ["read", 5], ["block_id", 1], ["block_id", 2]],
      ], [
        "block",
        ["return", ["read", 3]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(3);
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
    (result Int)
    (locals Int Int Int Int Int Int Int)
    (blocks
      (block
        (let 0 (constant (literal 0)))
        (branch (read 0) (block_id 1) (block_id 2)))
      (block
        (let 1 (constant (literal 11)))
        (jump (block_id 4)))
      (block
        (let 2 (constant (literal 13)))
        (jump (block_id 3)))
      (block
        (let 3 (constant (literal 281)))
        (jump (block_id 4)))
      (block
        (let 4 (phi (sources (from (block_id 1) (read 1)) (from (block_id 3) (read 2)))))
        (let 5 (phi (sources (from (block_id 1) (read 1)) (from (block_id 3) (read 3)))))
        (let 6 (add (read 4) (read 5)))
        (return (read 6))))))
`;

    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 0]]],
        ["branch", ["read", 0], ["block_id", 1], ["block_id", 2]],
      ], [
        "block",
        ["let", 1, ["constant", ["literal", 11]]],
        ["jump", ["block_id", 4]],
      ], [
        "block",
        ["let", 2, ["constant", ["literal", 13]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 3, ["constant", ["literal", 281]]],
        ["jump", ["block_id", 4]],
      ], [
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
        ["return", ["read", 6]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(13 + 281);
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
    (result Int)
    (locals Int Int Int Int)
    (blocks
      (block
        (jump (block_id 1)))
      (block
        (let 0 (constant (literal 11)))
        (let 1 (constant (literal 1)))
        (branch (read 1) (block_id 2) (block_id 3)))
      (block
        (let 2 (constant (literal 13)))
        (jump (block_id 3)))
      (block
        (let 3 (phi (sources (from (block_id 1) (read 0)) (from (block_id 2) (read 2)))))
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["jump", ["block_id", 1]],
      ], [
        "block",
        ["let", 0, ["constant", ["literal", 11]]],
        ["let", 1, ["constant", ["literal", 1]]],
        ["branch", ["read", 1], ["block_id", 2], ["block_id", 3]],
      ], [
        "block",
        ["let", 2, ["constant", ["literal", 13]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["read", 0]],
          ["from", ["block_id", 2], ["read", 2]],
        ]]],
        ["return", ["read", 3]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(13);
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
    (result Int)
    (locals Int Int Int Int)
    (blocks
      (block
        (let 0 (constant (literal 0)))
        (branch (read 0) (block_id 1) (block_id 3)))
      (block
        (let 1 (constant (literal 1)))
        (branch (read 1) (block_id 2) (block_id 3)))
      (block
        (let 2 (constant (literal 1)))
        (jump (block_id 3)))
      (block
        (let 3 (phi (sources (from (block_id 0) (read 0)) (from (block_id 1) (read 1)) (from (block_id 2) (read 2)))))
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 0]]],
        ["branch", ["read", 0], ["block_id", 1], ["block_id", 3]],
      ], [
        "block",
        ["let", 1, ["constant", ["literal", 1]]],
        ["branch", ["read", 1], ["block_id", 2], ["block_id", 3]],
      ], [
        "block",
        ["let", 2, ["constant", ["literal", 1]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 0], ["read", 0]],
          ["from", ["block_id", 1], ["read", 1]],
          ["from", ["block_id", 2], ["read", 2]],
        ]]],
        ["return", ["read", 3]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(0);
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
    (result Int)
    (locals Int Int Int Int)
    (blocks
      (block
        (let 0 (constant (literal 0)))
        (branch (read 0) (block_id 1) (block_id 3)))
      (block
        (let 1 (constant (literal 1)))
        (branch (read 1) (block_id 2) (block_id 3)))
      (block
        (let 2 (constant (literal 1)))
        (jump (block_id 3)))
      (block
        (let 3 (phi (sources (from (block_id 1) (read 1)) (from (block_id 2) (read 2)))))
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["constant", ["literal", 0]]],
        ["branch", ["read", 0], ["block_id", 1], ["block_id", 3]],
      ], [
        "block",
        ["let", 1, ["constant", ["literal", 1]]],
        ["branch", ["read", 1], ["block_id", 2], ["block_id", 3]],
      ], [
        "block",
        ["let", 2, ["constant", ["literal", 1]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["read", 1]],
          ["from", ["block_id", 2], ["read", 2]],
        ]]],
        ["return", ["read", 3]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});
