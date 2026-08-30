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
        (constant (let 0) (literal 11))
        (borrow (let 1) (read 0))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Borrowed", ["Int"]]],
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 11]], [
        "borrow",
        ["let", 1],
        ["read", 0],
      ], ["return", ["read", 1]]]],
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
        (constant (let 0) (literal 11))
        (return (read 0))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"]],
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 11]], [
        "return",
        ["read", 0],
      ]]],
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
        (constant (let 0) (literal 11))
        (copy (let 1) (read 0))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 11]], [
        "copy",
        ["let", 1],
        ["read", 0],
      ], ["return", ["read", 1]]]],
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
        (constant (let 0) (literal 11))
        (constant (let 1) (literal 13))
        (add (let 2) (read 0) (read 1))
        (return (read 2))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["constant", ["let", 0], ["literal", 11]],
        ["constant", ["let", 1], ["literal", 13]],
        ["add", ["let", 2], ["read", 0], ["read", 1]],
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
        (branch (literal 0) (block_ids 2)))
      (block
        (constant (let 0) (literal 11))
        (return (read 0)))
      (block
        (constant (let 1) (literal 13))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", ["block", ["branch", ["literal", 0], ["block_ids", 2]]], [
        "block",
        ["constant", ["let", 0], ["literal", 11]],
        ["return", ["read", 0]],
      ], ["block", ["constant", ["let", 1], ["literal", 13]], ["return", [
        "read",
        1,
      ]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(13);
  });

  it("must branch to target #0 when index is 0", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int Int Int Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (constant (let 1) (literal 13))
        (constant (let 2) (literal 281))
        (branch (literal 0) (block_ids 1 2)))
      (block
        (add (let 3) (read 0) (read 1))
        (branch (literal 0) (block_ids 3)))
      (block
        (add (let 4) (read 1) (read 2))
        (branch (literal 0) (block_ids 3)))
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
        ["constant", ["let", 0], ["literal", 11]],
        ["constant", ["let", 1], ["literal", 13]],
        ["constant", ["let", 2], ["literal", 281]],
        ["branch", ["literal", 0], ["block_ids", 1, 2]],
      ], ["block", ["add", ["let", 3], ["read", 0], ["read", 1]], [
        "branch",
        ["literal", 0],
        ["block_ids", 3],
      ]], ["block", ["add", ["let", 4], ["read", 1], ["read", 2]], [
        "branch",
        ["literal", 0],
        ["block_ids", 3],
      ]], ["block", ["return", ["read", 3]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11 + 13);
  });

  it("must branch to target #1 when index is 1", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int Int Int Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (constant (let 1) (literal 13))
        (constant (let 2) (literal 281))
        (branch (literal 1) (block_ids 1 2)))
      (block
        (add (let 3) (read 0) (read 1))
        (branch (literal 0) (block_ids 3)))
      (block
        (add (let 4) (read 1) (read 2))
        (branch (literal 0) (block_ids 3)))
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
        ["constant", ["let", 0], ["literal", 11]],
        ["constant", ["let", 1], ["literal", 13]],
        ["constant", ["let", 2], ["literal", 281]],
        ["branch", ["literal", 1], ["block_ids", 1, 2]],
      ], ["block", ["add", ["let", 3], ["read", 0], ["read", 1]], [
        "branch",
        ["literal", 0],
        ["block_ids", 3],
      ]], ["block", ["add", ["let", 4], ["read", 1], ["read", 2]], [
        "branch",
        ["literal", 0],
        ["block_ids", 3],
      ]], ["block", ["return", ["read", 4]]]],
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
        (constant (let 0) (literal 11))
        (constant (let 1) (literal 13))
        (call (let 2) (function_id 1) (arguments (read 1)))
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
        ["constant", ["let", 0], ["literal", 11]],
        ["constant", ["let", 1], ["literal", 13]],
        ["call", ["let", 2], ["function_id", 1], ["arguments", ["read", 1]]],
        ["return", ["read", 2]],
      ]],
    ], ["function", ["parameters", ["Int"]], ["result", ["Int"]], ["locals"], [
      "blocks",
      ["block", ["return", ["read", 0]]],
    ]]];
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
        (constant (let 0) (literal 11))
        (constant (let 1) (literal 13))
        (call (let 2) (function_id 1) (arguments (read 0) (read 1)))
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
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 11]], [
        "constant",
        ["let", 1],
        ["literal", 13],
      ], ["call", ["let", 2], ["function_id", 1], ["arguments", ["read", 0], [
        "read",
        1,
      ]]], ["return", ["read", 2]]]],
    ], ["function", ["parameters", ["Int"], ["Int"]], ["result", ["Int"]], [
      "locals",
    ], ["blocks", ["block", ["return", ["read", 0]]]]]];
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
        (constant (let 0) (literal 5))
        (constant (let 1) (literal 1))
        (call (let 2) (function_id 1) (arguments (read 0) (read 1)))
        (return (read 2)))))
  (function
    (parameters Int Int)
    (result Int)
    (locals Int Int Int Int Int Int)
    (blocks
      (block
        (equal (let 3) (read 0) (literal 1))
        (branch (read 3) (block_ids 1 2)))
      (block
        (subtract (let 4) (read 0) (literal 1))
        (multiply (let 5) (read 0) (read 1))
        (call (let 6) (function_id 1) (arguments (read 4) (read 5)))
        (branch (literal 0) (block_ids 2)))
      (block
        (phi (let 7) (sources (from (block_id 1) (read 6)) (from (block_id 0) (read 1))))
        (return (read 7))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 5]], [
        "constant",
        ["let", 1],
        ["literal", 1],
      ], ["call", ["let", 2], ["function_id", 1], ["arguments", ["read", 0], [
        "read",
        1,
      ]]], ["return", ["read", 2]]]],
    ], ["function", ["parameters", ["Int"], ["Int"]], ["result", ["Int"]], [
      "locals",
      ["Int"],
      ["Int"],
      ["Int"],
      ["Int"],
      ["Int"],
      ["Int"],
    ], ["blocks", ["block", ["equal", ["let", 3], ["read", 0], [
      "literal",
      1,
    ]], ["branch", ["read", 3], ["block_ids", 1, 2]]], [
      "block",
      ["subtract", ["let", 4], ["read", 0], ["literal", 1]],
      ["multiply", ["let", 5], ["read", 0], ["read", 1]],
      ["call", ["let", 6], ["function_id", 1], ["arguments", ["read", 4], [
        "read",
        5,
      ]]],
      ["branch", ["literal", 0], ["block_ids", 2]],
    ], ["block", ["phi", ["let", 7], ["sources", ["from", ["block_id", 1], [
      "read",
      6,
    ]], ["from", ["block_id", 0], ["read", 1]]]], ["return", ["read", 7]]]]]];
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
        (constant (let 0) (literal 11))
        (constant (let 0) (literal 13))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 11]], [
        "constant",
        ["let", 0],
        ["literal", 13],
      ], ["return", ["read", 1]]]],
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
        (branch (literal 0) (block_ids 2)))
      (block
        (constant (let 0) (literal 11))
        (branch (literal 0) (block_ids 3)))
      (block
        (constant (let 1) (literal 13))
        (branch (literal 0) (block_ids 3)))
      (block
        (phi (let 2) (sources (from (block_id 1) (read 0)) (from (block_id 2) (read 1))))
        (return (read 2))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", ["block", ["branch", ["literal", 0], ["block_ids", 2]]], [
        "block",
        ["constant", ["let", 0], ["literal", 11]],
        ["branch", ["literal", 0], ["block_ids", 3]],
      ], ["block", ["constant", ["let", 1], ["literal", 13]], ["branch", [
        "literal",
        0,
      ], ["block_ids", 3]]], ["block", ["phi", ["let", 2], ["sources", [
        "from",
        ["block_id", 1],
        ["read", 0],
      ], ["from", ["block_id", 2], ["read", 1]]]], ["return", ["read", 2]]]],
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
        (constant (let 0) (literal 0))
        (constant (let 1) (literal 1))
        (constant (let 2) (literal 3))
        (branch (literal 0) (block_ids 1)))
      (block
        (phi (let 3) (sources (from (block_id 0) (read 0)) (from (block_id 1) (read 4))))
        (add (let 4) (read 1) (read 3))
        (unequal (let 5) (read 3) (read 2))
        (branch (read 5) (block_ids 2 1)))
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
        ["constant", ["let", 0], ["literal", 0]],
        ["constant", ["let", 1], ["literal", 1]],
        ["constant", ["let", 2], ["literal", 3]],
        ["branch", ["literal", 0], ["block_ids", 1]],
      ], [
        "block",
        ["phi", ["let", 3], [
          "sources",
          ["from", ["block_id", 0], ["read", 0]],
          ["from", ["block_id", 1], ["read", 4]],
        ]],
        ["add", ["let", 4], ["read", 1], ["read", 3]],
        ["unequal", ["let", 5], ["read", 3], ["read", 2]],
        ["branch", ["read", 5], ["block_ids", 2, 1]],
      ], ["block", ["return", ["read", 3]]]],
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
        (constant (let 0) (literal 0))
        (branch (read 0) (block_ids 1 2)))
      (block
        (constant (let 1) (literal 11))
        (branch (literal 0) (block_ids 4)))
      (block
        (constant (let 2) (literal 13))
        (branch (literal 0) (block_ids 3)))
      (block
        (constant (let 3) (literal 281))
        (branch (literal 0) (block_ids 4)))
      (block
        (phi (let 4) (sources (from (block_id 1) (read 1)) (from (block_id 3) (read 2))))
        (phi (let 5) (sources (from (block_id 1) (read 1)) (from (block_id 3) (read 3))))
        (add (let 6) (read 4) (read 5))
        (return (read 6))))))
`;

    const input: MID.Program = ["program", ["function", ["parameters"], [
      "result",
      ["Int"],
    ], ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], [
      "Int",
    ]], ["blocks", ["block", ["constant", ["let", 0], ["literal", 0]], [
      "branch",
      ["read", 0],
      ["block_ids", 1, 2],
    ]], ["block", ["constant", ["let", 1], ["literal", 11]], ["branch", [
      "literal",
      0,
    ], ["block_ids", 4]]], [
      "block",
      ["constant", ["let", 2], ["literal", 13]],
      ["branch", ["literal", 0], ["block_ids", 3]],
    ], ["block", ["constant", ["let", 3], ["literal", 281]], ["branch", [
      "literal",
      0,
    ], ["block_ids", 4]]], [
      "block",
      ["phi", ["let", 4], ["sources", ["from", ["block_id", 1], ["read", 1]], [
        "from",
        ["block_id", 3],
        ["read", 2],
      ]]],
      ["phi", ["let", 5], ["sources", ["from", ["block_id", 1], ["read", 1]], [
        "from",
        ["block_id", 3],
        ["read", 3],
      ]]],
      ["add", ["let", 6], ["read", 4], ["read", 5]],
      ["return", ["read", 6]],
    ]]]];
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
        (branch (literal 0) (block_ids 1)))
      (block
        (constant (let 0) (literal 11))
        (constant (let 1) (literal 1))
        (branch (read 1) (block_ids 2 3)))
      (block
        (constant (let 2) (literal 13))
        (branch (literal 0) (block_ids 3)))
      (block
        (phi (let 3) (sources (from (block_id 1) (read 0)) (from (block_id 2) (read 2))))
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", ["block", ["branch", ["literal", 0], ["block_ids", 1]]], [
        "block",
        ["constant", ["let", 0], ["literal", 11]],
        ["constant", ["let", 1], ["literal", 1]],
        ["branch", ["read", 1], ["block_ids", 2, 3]],
      ], ["block", ["constant", ["let", 2], ["literal", 13]], ["branch", [
        "literal",
        0,
      ], ["block_ids", 3]]], ["block", ["phi", ["let", 3], ["sources", [
        "from",
        ["block_id", 1],
        ["read", 0],
      ], ["from", ["block_id", 2], ["read", 2]]]], ["return", ["read", 3]]]],
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
        (constant (let 0) (literal 0))
        (branch (read 0) (block_ids 3 1)))
      (block
        (constant (let 1) (literal 1))
        (branch (read 1) (block_ids 3 2)))
      (block
        (constant (let 2) (literal 1))
        (branch (literal 0) (block_ids 3)))
      (block
        (phi (let 3) (sources (from (block_id 0) (read 0)) (from (block_id 1) (read 1)) (from (block_id 2) (read 2))))
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 0]], [
        "branch",
        ["read", 0],
        ["block_ids", 3, 1],
      ]], ["block", ["constant", ["let", 1], ["literal", 1]], ["branch", [
        "read",
        1,
      ], ["block_ids", 3, 2]]], ["block", ["constant", ["let", 2], [
        "literal",
        1,
      ]], ["branch", ["literal", 0], ["block_ids", 3]]], ["block", ["phi", [
        "let",
        3,
      ], ["sources", ["from", ["block_id", 0], ["read", 0]], [
        "from",
        ["block_id", 1],
        ["read", 1],
      ], ["from", ["block_id", 2], ["read", 2]]]], ["return", ["read", 3]]]],
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
        (constant (let 0) (literal 0))
        (branch (read 0) (block_ids 3 1)))
      (block
        (constant (let 1) (literal 1))
        (branch (read 1) (block_ids 3 2)))
      (block
        (constant (let 2) (literal 1))
        (branch (literal 0) (block_ids 3)))
      (block
        (phi (let 3) (sources (from (block_id 1) (read 1)) (from (block_id 2) (read 2))))
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 0]], [
        "branch",
        ["read", 0],
        ["block_ids", 3, 1],
      ]], ["block", ["constant", ["let", 1], ["literal", 1]], ["branch", [
        "read",
        1,
      ], ["block_ids", 3, 2]]], ["block", ["constant", ["let", 2], [
        "literal",
        1,
      ]], ["branch", ["literal", 0], ["block_ids", 3]]], ["block", ["phi", [
        "let",
        3,
      ], ["sources", ["from", ["block_id", 1], ["read", 1]], [
        "from",
        ["block_id", 2],
        ["read", 2],
      ]]], ["return", ["read", 3]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});
