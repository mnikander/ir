import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MID from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";

describe.skip("MIR: memory and ownership", () => {
  it("must create and load from a pointer", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int (Borrowed Int) Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (borrow (let 1) (read 0))
        (load (let 2) (read 1))
        (return (read 2))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Borrowed", ["Int"]], ["Int"]],
      ["blocks", [
        "block",
        ["constant", ["let", 0], ["literal", 11]],
        ["borrow", ["let", 1], ["read", 0]],
        ["load", ["let", 2], ["read", 1]],
        ["return", ["read", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(11);
  });

  it("must allow a register to be owned by a pointer", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int (Owned Int) Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (own (let 1) (read 0))
        (load (let 2) (read 1))
        (return (read 2))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Owned", ["Int"]], ["Int"]],
      ["blocks", [
        "block",
        ["constant", ["let", 0], ["literal", 11]],
        ["own", ["let", 1], ["read", 0]],
        ["load", ["let", 2], ["read", 1]],
        ["return", ["read", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11);
  });

  it.skip("must support pointers as phi operands", () => {
    // TODO
  });

  it("must allow consuming the Copy operand", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (copy (let 1) (move 0))
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
        ["move", 0],
      ], ["return", ["read", 1]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11);
  });

  it("must allow consuming an Add operand", () => {
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
        (add (let 2) (move 0) (read 1))
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
        ["add", ["let", 2], ["move", 0], ["read", 1]],
        ["return", ["read", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11 + 13);
  });

  it("must allow consuming the return operand", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (return (move 0))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"]],
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 11]], [
        "return",
        ["move", 0],
      ]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(evaluate(lower(input))).toBe(11);
  });

  it.skip("must allow consuming a phi operand", () => {
    // TODO
  });
});

describe.skip("MIR: use-after-free", () => {
  it("must detect a use-after-free in a return", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int)
    (blocks
      (block
        (constant (let 0) (literal 0))
        (drop (move 0))
        (return (read 0))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"]],
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 0]], [
        "drop",
        ["move", 0],
      ], ["return", ["read", 0]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a use-after-free in an arithmetic expression", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (constant (let 0) (literal 0))
        (drop (move 0))
        (negate (let 1) (read 0))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["constant", ["let", 0], ["literal", 0]],
        ["drop", ["move", 0]],
        ["negate", ["let", 1], ["read", 0]],
        ["return", ["read", 1]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a double-free", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (drop (move 0))
        (drop (move 0))
        (constant (let 1) (literal 11))
        (return (read 1))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["constant", ["let", 0], ["literal", 11]],
        ["drop", ["move", 0]],
        ["drop", ["move", 0]],
        ["constant", ["let", 1], ["literal", 11]],
        ["return", ["read", 1]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a use-after-move", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (copy (let 1) (move 0))
        (return (read 0))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", ["block", ["constant", ["let", 0], ["literal", 11]], [
        "copy",
        ["let", 1],
        ["move", 0],
      ], ["return", ["read", 0]]]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a dangling pointer when the source register is dropped", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int (Borrowed Int) Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (borrow (let 1) (read 0))
        (drop (move 0))
        (load (let 2) (read 1))
        (return (read 2))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Borrowed", ["Int"]], ["Int"]],
      ["blocks", [
        "block",
        ["constant", ["let", 0], ["literal", 11]],
        ["borrow", ["let", 1], ["read", 0]],
        ["drop", ["move", 0]],
        ["load", ["let", 2], ["read", 1]],
        ["return", ["read", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a dangling pointer when the source register is moved", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int (Borrowed Int) Int Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (borrow (let 1) (read 0))
        (copy (let 2) (move 0))
        (load (let 3) (read 1))
        (return (read 3))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Borrowed", ["Int"]], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["constant", ["let", 0], ["literal", 11]],
        ["borrow", ["let", 1], ["read", 0]],
        ["copy", ["let", 2], ["move", 0]],
        ["load", ["let", 3], ["read", 1]],
        ["return", ["read", 3]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});

describe.skip("MIR: ownership violations", () => {
  it("must detect invalid use of a register owned by a pointer", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int (Owned Int) Int)
    (blocks
      (block
        (constant (let 0) (literal 11))
        (own (let 1) (read 0))
        (copy (let 2) (read 0))
        (return (read 2))))))
`;
    const input: MID.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Owned", ["Int"]], ["Int"]],
      ["blocks", [
        "block",
        ["constant", ["let", 0], ["literal", 11]],
        ["own", ["let", 1], ["read", 0]],
        ["copy", ["let", 2], ["read", 0]],
        ["return", ["read", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});
