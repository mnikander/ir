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
    // expect(validate(input)).toBe(false);
    // expect(() => evaluate(analyze(input))).toThrow();
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
        (constant (define 0) (literal 11))
        (borrow (define 1) (read 0))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Borrowed", ["Int"]]],
      ["blocks", ["block", ["constant", ["define", 0], ["literal", 11]], [
        "borrow",
        ["define", 1],
        ["read", 0],
      ], ["return", ["read", 1]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(analyze(input))).toThrow();
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
        (constant (define 0) (literal 11))
        (return (read 0))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"]],
      ["blocks", ["block", ["constant", ["define", 0], ["literal", 11]], [
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
        (constant (define 0) (literal 11))
        (copy (define 1) (read 0))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["define", 0], ["literal", 11]], [
        "copy",
        ["define", 1],
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
        (constant (define 0) (literal 11))
        (constant (define 1) (literal 13))
        (add (define 2) (read 0) (read 1))
        (return (read 2))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["constant", ["define", 0], ["literal", 11]],
        ["constant", ["define", 1], ["literal", 13]],
        ["add", ["define", 2], ["read", 0], ["read", 1]],
        ["return", ["read", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11 + 13);
  });
});

describe("MIR: labels, jump, and branch", () => {
  it("must execute the correct line of code after an unconditional jump", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (branch (literal 0) (labels 2)))
      (block
        (constant (define 0) (literal 11))
        (return (read 0)))
      (block
        (constant (define 1) (literal 13))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", ["block", ["branch", ["literal", 0], ["labels", 2]]], [
        "block",
        ["constant", ["define", 0], ["literal", 11]],
        ["return", ["read", 0]],
      ], ["block", ["constant", ["define", 1], ["literal", 13]], ["return", [
        "read",
        1,
      ]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(13);
  });

  it("must branch to label #0 when index is 0", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int Int Int Int)
    (blocks
      (block
        (constant (define 0) (literal 11))
        (constant (define 1) (literal 13))
        (constant (define 2) (literal 281))
        (branch (literal 0) (labels 1 2)))
      (block
        (add (define 3) (read 0) (read 1))
        (branch (literal 0) (labels 3)))
      (block
        (add (define 4) (read 1) (read 2))
        (branch (literal 0) (labels 3)))
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
        ["constant", ["define", 0], ["literal", 11]],
        ["constant", ["define", 1], ["literal", 13]],
        ["constant", ["define", 2], ["literal", 281]],
        ["branch", ["literal", 0], ["labels", 1, 2]],
      ], ["block", ["add", ["define", 3], ["read", 0], ["read", 1]], [
        "branch",
        ["literal", 0],
        ["labels", 3],
      ]], ["block", ["add", ["define", 4], ["read", 1], ["read", 2]], [
        "branch",
        ["literal", 0],
        ["labels", 3],
      ]], ["block", ["return", ["read", 3]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11 + 13);
  });

  it("must branch to label #1 when index is 1", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int Int Int Int)
    (blocks
      (block
        (constant (define 0) (literal 11))
        (constant (define 1) (literal 13))
        (constant (define 2) (literal 281))
        (branch (literal 1) (labels 1 2)))
      (block
        (add (define 3) (read 0) (read 1))
        (branch (literal 0) (labels 3)))
      (block
        (add (define 4) (read 1) (read 2))
        (branch (literal 0) (labels 3)))
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
        ["constant", ["define", 0], ["literal", 11]],
        ["constant", ["define", 1], ["literal", 13]],
        ["constant", ["define", 2], ["literal", 281]],
        ["branch", ["literal", 1], ["labels", 1, 2]],
      ], ["block", ["add", ["define", 3], ["read", 0], ["read", 1]], [
        "branch",
        ["literal", 0],
        ["labels", 3],
      ]], ["block", ["add", ["define", 4], ["read", 1], ["read", 2]], [
        "branch",
        ["literal", 0],
        ["labels", 3],
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
        (constant (define 0) (literal 11))
        (constant (define 1) (literal 13))
        (call (define 2) (label 1) (arguments (read 1)))
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
        ["constant", ["define", 0], ["literal", 11]],
        ["constant", ["define", 1], ["literal", 13]],
        ["call", ["define", 2], ["label", 1], ["arguments", ["read", 1]]],
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
        (constant (define 0) (literal 11))
        (constant (define 1) (literal 13))
        (call (define 2) (label 1) (arguments (read 0) (read 1)))
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
      ["blocks", ["block", ["constant", ["define", 0], ["literal", 11]], [
        "constant",
        ["define", 1],
        ["literal", 13],
      ], ["call", ["define", 2], ["label", 1], ["arguments", ["read", 0], [
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
        (constant (define 0) (literal 5))
        (constant (define 1) (literal 1))
        (call (define 2) (label 1) (arguments (read 0) (read 1)))
        (return (read 2)))))
  (function
    (parameters Int Int)
    (result Int)
    (locals Int Int Int Int Int Int)
    (blocks
      (block
        (equal (define 3) (read 0) (literal 1))
        (branch (read 3) (labels 1 2)))
      (block
        (subtract (define 4) (read 0) (literal 1))
        (multiply (define 5) (read 0) (read 1))
        (call (define 6) (label 1) (arguments (read 4) (read 5)))
        (branch (literal 0) (labels 2)))
      (block
        (phi (define 7) (sources (from (label 1) (read 6)) (from (label 0) (read 1))))
        (return (read 7))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["define", 0], ["literal", 5]], [
        "constant",
        ["define", 1],
        ["literal", 1],
      ], ["call", ["define", 2], ["label", 1], ["arguments", ["read", 0], [
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
    ], ["blocks", ["block", ["equal", ["define", 3], ["read", 0], [
      "literal",
      1,
    ]], ["branch", ["read", 3], ["labels", 1, 2]]], [
      "block",
      ["subtract", ["define", 4], ["read", 0], ["literal", 1]],
      ["multiply", ["define", 5], ["read", 0], ["read", 1]],
      ["call", ["define", 6], ["label", 1], ["arguments", ["read", 4], [
        "read",
        5,
      ]]],
      ["branch", ["literal", 0], ["labels", 2]],
    ], ["block", ["phi", ["define", 7], ["sources", ["from", ["label", 1], [
      "read",
      6,
    ]], ["from", ["label", 0], ["read", 1]]]], ["return", ["read", 7]]]]]];
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
        (constant (define 0) (literal 11))
        (constant (define 0) (literal 13))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["define", 0], ["literal", 11]], [
        "constant",
        ["define", 0],
        ["literal", 13],
      ], ["return", ["read", 1]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(false);
    // expect(() => {evaluate(analyze(input))}).toThrow();
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
        (branch (literal 0) (labels 2)))
      (block
        (constant (define 0) (literal 11))
        (branch (literal 0) (labels 3)))
      (block
        (constant (define 1) (literal 13))
        (branch (literal 0) (labels 3)))
      (block
        (phi (define 2) (sources (from (label 1) (read 0)) (from (label 2) (read 1))))
        (return (read 2))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", ["block", ["branch", ["literal", 0], ["labels", 2]]], [
        "block",
        ["constant", ["define", 0], ["literal", 11]],
        ["branch", ["literal", 0], ["labels", 3]],
      ], ["block", ["constant", ["define", 1], ["literal", 13]], ["branch", [
        "literal",
        0,
      ], ["labels", 3]]], ["block", ["phi", ["define", 2], ["sources", [
        "from",
        ["label", 1],
        ["read", 0],
      ], ["from", ["label", 2], ["read", 1]]]], ["return", ["read", 2]]]],
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
        (constant (define 0) (literal 0))
        (constant (define 1) (literal 1))
        (constant (define 2) (literal 3))
        (branch (literal 0) (labels 1)))
      (block
        (phi (define 3) (sources (from (label 0) (read 0)) (from (label 1) (read 4))))
        (add (define 4) (read 1) (read 3))
        (unequal (define 5) (read 3) (read 2))
        (branch (read 5) (labels 2 1)))
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
        ["constant", ["define", 0], ["literal", 0]],
        ["constant", ["define", 1], ["literal", 1]],
        ["constant", ["define", 2], ["literal", 3]],
        ["branch", ["literal", 0], ["labels", 1]],
      ], [
        "block",
        ["phi", ["define", 3], [
          "sources",
          ["from", ["label", 0], ["read", 0]],
          ["from", ["label", 1], ["read", 4]],
        ]],
        ["add", ["define", 4], ["read", 1], ["read", 3]],
        ["unequal", ["define", 5], ["read", 3], ["read", 2]],
        ["branch", ["read", 5], ["labels", 2, 1]],
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
        (constant (define 0) (literal 0))
        (branch (read 0) (labels 1 2)))
      (block
        (constant (define 1) (literal 11))
        (branch (literal 0) (labels 4)))
      (block
        (constant (define 2) (literal 13))
        (branch (literal 0) (labels 3)))
      (block
        (constant (define 3) (literal 281))
        (branch (literal 0) (labels 4)))
      (block
        (phi (define 4) (sources (from (label 1) (read 1)) (from (label 3) (read 2))))
        (phi (define 5) (sources (from (label 1) (read 1)) (from (label 3) (read 3))))
        (add (define 6) (read 4) (read 5))
        (return (read 6))))))
`;

    const input: MID.Program = ["program", ["function", ["parameters"], [
      "result",
      ["Int"],
    ], ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], [
      "Int",
    ]], ["blocks", ["block", ["constant", ["define", 0], ["literal", 0]], [
      "branch",
      ["read", 0],
      ["labels", 1, 2],
    ]], ["block", ["constant", ["define", 1], ["literal", 11]], ["branch", [
      "literal",
      0,
    ], ["labels", 4]]], [
      "block",
      ["constant", ["define", 2], ["literal", 13]],
      ["branch", ["literal", 0], ["labels", 3]],
    ], ["block", ["constant", ["define", 3], ["literal", 281]], ["branch", [
      "literal",
      0,
    ], ["labels", 4]]], [
      "block",
      ["phi", ["define", 4], ["sources", ["from", ["label", 1], ["read", 1]], [
        "from",
        ["label", 3],
        ["read", 2],
      ]]],
      ["phi", ["define", 5], ["sources", ["from", ["label", 1], ["read", 1]], [
        "from",
        ["label", 3],
        ["read", 3],
      ]]],
      ["add", ["define", 6], ["read", 4], ["read", 5]],
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
        (branch (literal 0) (labels 1)))
      (block
        (constant (define 0) (literal 11))
        (constant (define 1) (literal 1))
        (branch (read 1) (labels 2 3)))
      (block
        (constant (define 2) (literal 13))
        (branch (literal 0) (labels 3)))
      (block
        (phi (define 3) (sources (from (label 1) (read 0)) (from (label 2) (read 2))))
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", ["block", ["branch", ["literal", 0], ["labels", 1]]], [
        "block",
        ["constant", ["define", 0], ["literal", 11]],
        ["constant", ["define", 1], ["literal", 1]],
        ["branch", ["read", 1], ["labels", 2, 3]],
      ], ["block", ["constant", ["define", 2], ["literal", 13]], ["branch", [
        "literal",
        0,
      ], ["labels", 3]]], ["block", ["phi", ["define", 3], ["sources", [
        "from",
        ["label", 1],
        ["read", 0],
      ], ["from", ["label", 2], ["read", 2]]]], ["return", ["read", 3]]]],
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
        (constant (define 0) (literal 0))
        (branch (read 0) (labels 3 1)))
      (block
        (constant (define 1) (literal 1))
        (branch (read 1) (labels 3 2)))
      (block
        (constant (define 2) (literal 1))
        (branch (literal 0) (labels 3)))
      (block
        (phi (define 3) (sources (from (label 0) (read 0)) (from (label 1) (read 1)) (from (label 2) (read 2))))
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["define", 0], ["literal", 0]], [
        "branch",
        ["read", 0],
        ["labels", 3, 1],
      ]], ["block", ["constant", ["define", 1], ["literal", 1]], ["branch", [
        "read",
        1,
      ], ["labels", 3, 2]]], ["block", ["constant", ["define", 2], [
        "literal",
        1,
      ]], ["branch", ["literal", 0], ["labels", 3]]], ["block", ["phi", [
        "define",
        3,
      ], ["sources", ["from", ["label", 0], ["read", 0]], [
        "from",
        ["label", 1],
        ["read", 1],
      ], ["from", ["label", 2], ["read", 2]]]], ["return", ["read", 3]]]],
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
        (constant (define 0) (literal 0))
        (branch (read 0) (labels 3 1)))
      (block
        (constant (define 1) (literal 1))
        (branch (read 1) (labels 3 2)))
      (block
        (constant (define 2) (literal 1))
        (branch (literal 0) (labels 3)))
      (block
        (phi (define 3) (sources (from (label 1) (read 1)) (from (label 2) (read 2))))
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["define", 0], ["literal", 0]], [
        "branch",
        ["read", 0],
        ["labels", 3, 1],
      ]], ["block", ["constant", ["define", 1], ["literal", 1]], ["branch", [
        "read",
        1,
      ], ["labels", 3, 2]]], ["block", ["constant", ["define", 2], [
        "literal",
        1,
      ]], ["branch", ["literal", 0], ["labels", 3]]], ["block", ["phi", [
        "define",
        3,
      ], ["sources", ["from", ["label", 1], ["read", 1]], [
        "from",
        ["label", 2],
        ["read", 2],
      ]]], ["return", ["read", 3]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});
