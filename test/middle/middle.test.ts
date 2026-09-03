import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";
import { lower } from "../../src/middle_to_low/lower.gen.ts";
import { evaluate } from "../../src/low/machine.ts";

describe("MIR: literals and exit", () => {
  it("must evaluate copy and return of a literal", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int)
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (return 0)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["return", 0],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11);
  });

  it("must throw error on empty input", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals)
    (result Int)
    (blocks)))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals"],
      ["result", ["Int"]],
      ["blocks"],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow();
  });

  it("must throw an error when exiting with a pointer instead of a Value", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int (Borrowed Int))
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (borrow (access 0)))
        (return 1)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Borrowed", ["Int"]]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["borrow", ["access", 0]]],
        ["return", 1],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow();
  });
});

describe("MIR: copying of registers", () => {
  it("must copy a literal", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (copy (access 0)))
        (return 1)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["copy", ["access", 0]]],
        ["return", 1],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11);
  });
});

describe("MIR: arithmetic operations", () => {
  it("must evaluate integer addition", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int)
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (copy (literal 13)))
        (let 2 (add (access 0) (access 1)))
        (return 2)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["copy", ["literal", 13]]],
        ["let", 2, ["add", ["access", 0], ["access", 1]]],
        ["return", 2],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11 + 13);
  });

  it("must evaluate integer addition with a literal", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (add (access 0) (literal 13)))
        (return 1)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["add", ["access", 0], ["literal", 13]]],
        ["return", 1],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11 + 13);
  });
});

describe("MIR: block_ids, jump, and branch", () => {
  it("must execute the correct line of code after an unconditional jump", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (blocks
      (block
        (jump (block_id 2)))
      (block
        (let 0 (copy (literal 11)))
        (return 0))
      (block
        (let 1 (copy (literal 13)))
        (return 1)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["jump", ["block_id", 2]],
      ], [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["return", 0],
      ], [
        "block",
        ["let", 1, ["copy", ["literal", 13]]],
        ["return", 1],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(13);
  });

  it("must execute first branch if the condition is true", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int Int Int)
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (copy (literal 13)))
        (let 2 (copy (literal 281)))
        (branch (literal 1) (block_id 1) (block_id 2)))
      (block
        (let 3 (add (access 0) (access 1)))
        (jump (block_id 3)))
      (block
        (let 4 (add (access 1) (access 2)))
        (jump (block_id 3)))
      (block
        (return 3)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["copy", ["literal", 13]]],
        ["let", 2, ["copy", ["literal", 281]]],
        ["branch", ["literal", 1], ["block_id", 1], ["block_id", 2]],
      ], [
        "block",
        ["let", 3, ["add", ["access", 0], ["access", 1]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 4, ["add", ["access", 1], ["access", 2]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["return", 3],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11 + 13);
  });

  it("must execute the second branch when condition is false", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int Int Int)
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (copy (literal 13)))
        (let 2 (copy (literal 281)))
        (branch (literal 0) (block_id 1) (block_id 2)))
      (block
        (let 3 (add (access 0) (access 1)))
        (jump (block_id 3)))
      (block
        (let 4 (add (access 1) (access 2)))
        (jump (block_id 3)))
      (block
        (return 4)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["copy", ["literal", 13]]],
        ["let", 2, ["copy", ["literal", 281]]],
        ["branch", ["literal", 0], ["block_id", 1], ["block_id", 2]],
      ], [
        "block",
        ["let", 3, ["add", ["access", 0], ["access", 1]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 4, ["add", ["access", 1], ["access", 2]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["return", 4],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(13 + 281);
  });
});

describe("MIR: function call", () => {
  it("must support calling the identity function", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int)
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (copy (literal 13)))
        (let 2 (call (function_id 1) (arguments (access 1))))
        (return 2))))
  (function
    (parameters Int)
    (locals)
    (result Int)
    (blocks
      (block
        (return 0)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["copy", ["literal", 13]]],
        ["let", 2, ["call", ["function_id", 1], ["arguments", ["access", 1]]]],
        ["return", 2],
      ]],
    ], [
      "function",
      ["parameters", ["Int"]],
      ["locals"],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["return", 0],
      ]],
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
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (copy (literal 13)))
        (let 2 (call (function_id 1) (arguments (access 0) (access 1))))
        (return 2))))
  (function
    (parameters Int Int)
    (locals)
    (result Int)
    (blocks
      (block
        (return 0)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["copy", ["literal", 13]]],
        ["let", 2, ["call", ["function_id", 1], ["arguments", ["access", 0], [
          "access",
          1,
        ]]]],
        ["return", 2],
      ]],
    ], [
      "function",
      ["parameters", ["Int"], ["Int"]],
      ["locals"],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["return", 0],
      ]],
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
    (blocks
      (block
        (let 0 (copy (literal 5)))
        (let 1 (copy (literal 1)))
        (let 2 (call (function_id 1) (arguments (access 0) (access 1))))
        (return 2))))
  (function
    (parameters Int Int)
    (locals Int Int Int Int Int Int)
    (result Int)
    (blocks
      (block
        (let 3 (equal (access 0) (literal 1)))
        (branch (access 3) (block_id 2) (block_id 1)))
      (block
        (let 4 (subtract (access 0) (literal 1)))
        (let 5 (multiply (access 0) (access 1)))
        (let 6 (call (function_id 1) (arguments (access 4) (access 5))))
        (jump (block_id 2)))
      (block
        (let 7 (phi (sources (from (block_id 1) (access 6)) (from (block_id 0) (access 1)))))
        (return 7)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 5]]],
        ["let", 1, ["copy", ["literal", 1]]],
        ["let", 2, ["call", ["function_id", 1], ["arguments", ["access", 0], [
          "access",
          1,
        ]]]],
        ["return", 2],
      ]],
    ], [
      "function",
      ["parameters", ["Int"], ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 3, ["equal", ["access", 0], ["literal", 1]]],
        ["branch", ["access", 3], ["block_id", 2], ["block_id", 1]],
      ], [
        "block",
        ["let", 4, ["subtract", ["access", 0], ["literal", 1]]],
        ["let", 5, ["multiply", ["access", 0], ["access", 1]]],
        ["let", 6, ["call", ["function_id", 1], ["arguments", ["access", 4], [
          "access",
          5,
        ]]]],
        ["jump", ["block_id", 2]],
      ], [
        "block",
        ["let", 7, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["access", 6]],
          ["from", ["block_id", 0], ["access", 1]],
        ]]],
        ["return", 7],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(120);
  });
});

describe("MIR: static single assignment", () => {
  it("must throw an error when re-assigning to a register", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 0 (copy (literal 13)))
        (return 1)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 0, ["copy", ["literal", 13]]],
        ["return", 1],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => {
      evaluate(lower(input));
    }).toThrow();
  });

  it("phi node must assign from the correct register after an unconditional jump", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int)
    (result Int)
    (blocks
      (block
        (jump (block_id 2)))
      (block
        (let 0 (copy (literal 11)))
        (jump (block_id 3)))
      (block
        (let 1 (copy (literal 13)))
        (jump (block_id 3)))
      (block
        (let 2 (phi (sources (from (block_id 1) (access 0)) (from (block_id 2) (access 1)))))
        (return 2)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["jump", ["block_id", 2]],
      ], [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 1, ["copy", ["literal", 13]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 2, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["access", 0]],
          ["from", ["block_id", 2], ["access", 1]],
        ]]],
        ["return", 2],
      ]],
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
    (blocks
      (block
        (let 0 (copy (literal 0)))
        (let 1 (copy (literal 1)))
        (let 2 (copy (literal 3)))
        (jump (block_id 1)))
      (block
        (let 3 (phi (sources (from (block_id 0) (access 0)) (from (block_id 1) (access 4)))))
        (let 4 (add (access 1) (access 3)))
        (let 5 (unequal (access 3) (access 2)))
        (branch (access 5) (block_id 1) (block_id 2)))
      (block
        (return 3)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 0]]],
        ["let", 1, ["copy", ["literal", 1]]],
        ["let", 2, ["copy", ["literal", 3]]],
        ["jump", ["block_id", 1]],
      ], [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 0], ["access", 0]],
          ["from", ["block_id", 1], ["access", 4]],
        ]]],
        ["let", 4, ["add", ["access", 1], ["access", 3]]],
        ["let", 5, ["unequal", ["access", 3], ["access", 2]]],
        ["branch", ["access", 5], ["block_id", 1], ["block_id", 2]],
      ], [
        "block",
        ["return", 3],
      ]],
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
    (blocks
      (block
        (let 0 (copy (literal 0)))
        (branch (access 0) (block_id 1) (block_id 2)))
      (block
        (let 1 (copy (literal 11)))
        (jump (block_id 4)))
      (block
        (let 2 (copy (literal 13)))
        (jump (block_id 3)))
      (block
        (let 3 (copy (literal 281)))
        (jump (block_id 4)))
      (block
        (let 4 (phi (sources (from (block_id 1) (access 1)) (from (block_id 3) (access 2)))))
        (let 5 (phi (sources (from (block_id 1) (access 1)) (from (block_id 3) (access 3)))))
        (let 6 (add (access 4) (access 5)))
        (return 6)))))
`;

    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 0]]],
        ["branch", ["access", 0], ["block_id", 1], ["block_id", 2]],
      ], [
        "block",
        ["let", 1, ["copy", ["literal", 11]]],
        ["jump", ["block_id", 4]],
      ], [
        "block",
        ["let", 2, ["copy", ["literal", 13]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 3, ["copy", ["literal", 281]]],
        ["jump", ["block_id", 4]],
      ], [
        "block",
        ["let", 4, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["access", 1]],
          ["from", ["block_id", 3], ["access", 2]],
        ]]],
        ["let", 5, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["access", 1]],
          ["from", ["block_id", 3], ["access", 3]],
        ]]],
        ["let", 6, ["add", ["access", 4], ["access", 5]]],
        ["return", 6],
      ]],
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
    (blocks
      (block
        (jump (block_id 1)))
      (block
        (let 0 (copy (literal 11)))
        (let 1 (copy (literal 1)))
        (branch (access 1) (block_id 2) (block_id 3)))
      (block
        (let 2 (copy (literal 13)))
        (jump (block_id 3)))
      (block
        (let 3 (phi (sources (from (block_id 1) (access 0)) (from (block_id 2) (access 2)))))
        (return 3)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["jump", ["block_id", 1]],
      ], [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["copy", ["literal", 1]]],
        ["branch", ["access", 1], ["block_id", 2], ["block_id", 3]],
      ], [
        "block",
        ["let", 2, ["copy", ["literal", 13]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["access", 0]],
          ["from", ["block_id", 2], ["access", 2]],
        ]]],
        ["return", 3],
      ]],
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
    (blocks
      (block
        (let 0 (copy (literal 0)))
        (branch (access 0) (block_id 1) (block_id 3)))
      (block
        (let 1 (copy (literal 1)))
        (branch (access 1) (block_id 2) (block_id 3)))
      (block
        (let 2 (copy (literal 1)))
        (jump (block_id 3)))
      (block
        (let 3 (phi (sources (from (block_id 0) (access 0)) (from (block_id 1) (access 1)) (from (block_id 2) (access 2)))))
        (return 3)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 0]]],
        ["branch", ["access", 0], ["block_id", 1], ["block_id", 3]],
      ], [
        "block",
        ["let", 1, ["copy", ["literal", 1]]],
        ["branch", ["access", 1], ["block_id", 2], ["block_id", 3]],
      ], [
        "block",
        ["let", 2, ["copy", ["literal", 1]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 0], ["access", 0]],
          ["from", ["block_id", 1], ["access", 1]],
          ["from", ["block_id", 2], ["access", 2]],
        ]]],
        ["return", 3],
      ]],
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
    (blocks
      (block
        (let 0 (copy (literal 0)))
        (branch (access 0) (block_id 1) (block_id 3)))
      (block
        (let 1 (copy (literal 1)))
        (branch (access 1) (block_id 2) (block_id 3)))
      (block
        (let 2 (copy (literal 1)))
        (jump (block_id 3)))
      (block
        (let 3 (phi (sources (from (block_id 1) (access 1)) (from (block_id 2) (access 2)))))
        (return 3)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 0]]],
        ["branch", ["access", 0], ["block_id", 1], ["block_id", 3]],
      ], [
        "block",
        ["let", 1, ["copy", ["literal", 1]]],
        ["branch", ["access", 1], ["block_id", 2], ["block_id", 3]],
      ], [
        "block",
        ["let", 2, ["copy", ["literal", 1]]],
        ["jump", ["block_id", 3]],
      ], [
        "block",
        ["let", 3, ["phi", [
          "sources",
          ["from", ["block_id", 1], ["access", 1]],
          ["from", ["block_id", 2], ["access", 2]],
        ]]],
        ["return", 3],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});
