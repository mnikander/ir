import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";
import { lower } from "../../src/middle_to_low/lower.gen.ts";
import { evaluate } from "../../src/low/machine.ts";

describe("MIR: memory and ownership", () => {
  it("must create and load a pointer", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int (Borrowed Int) Int)
    (result Int)
    (block
      (let %0 (identity (constant 11)))
      (let %1 (borrow (read %0)))
      (let %2 (load (read %1)))
      (return %2))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Borrowed", ["Int"]], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 11]]],
        ["let", "%1", ["borrow", ["read", "%0"]]],
        ["let", "%2", ["load", ["read", "%1"]]],
        ["return", "%2"],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11);
  });

  it.skip("must support pointers as phi operands", () => {
    // TODO
  });

  it("must allow consuming the Copy operand", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (let %0 (identity (constant 11)))
      (let %1 (identity (move %0)))
      (return %1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 11]]],
        ["let", "%1", ["identity", ["move", "%0"]]],
        ["return", "%1"],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11);
  });

  it("must allow consuming an Add operand", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int Int)
    (result Int)
    (block
      (let %0 (identity (constant 11)))
      (let %1 (identity (constant 13)))
      (let %2 (add (move %0) (read %1)))
      (return %2))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 11]]],
        ["let", "%1", ["identity", ["constant", 13]]],
        ["let", "%2", ["add", ["move", "%0"], ["read", "%1"]]],
        ["return", "%2"],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11 + 13);
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
    (locals Int)
    (result Int)
    (block
      (let %0 (identity (constant 0)))
      (z)
      (return %0))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 0]]],
        ["drop", "%0"],
        ["return", "%0"],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a use-after-free in an arithmetic expression", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (let %0 (identity (constant 0)))
      (drop %0)
      (let %1 (negate (read %0)))
      (return %1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 0]]],
        ["drop", "%0"],
        ["let", "%1", ["negate", ["read", "%0"]]],
        ["return", "%1"],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a double-free", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (let %0 (identity (constant 11)))
      (drop %0)
      (drop %0)
      (let %1 (identity (constant 11)))
      (return %1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 11]]],
        ["drop", "%0"],
        ["drop", "%0"],
        ["let", "%1", ["identity", ["constant", 11]]],
        ["return", "%1"],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a use-after-move", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (let %0 (identity (constant 11)))
      (let %1 (identity (move %0)))
      (return %0))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 11]]],
        ["let", "%1", ["identity", ["move", "%0"]]],
        ["return", "%0"],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a dangling pointer when the source register is dropped", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int (Borrowed Int) Int)
    (result Int)
    (block
      (let %0 (identity (constant 11)))
      (let %1 (borrow (read %0)))
      (drop %0)
      (let %2 (load (read %1)))
      (return %2))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Borrowed", ["Int"]], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 11]]],
        ["let", "%1", ["borrow", ["read", "%0"]]],
        ["drop", "%0"],
        ["let", "%2", ["load", ["read", "%1"]]],
        ["return", "%2"],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a dangling pointer when the source register is moved", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int (Borrowed Int) Int Int)
    (result Int)
    (block
      (let %0 (identity (constant 11)))
      (let %1 (borrow (read %0)))
      (let %2 (identity (move %0)))
      (let %3 (load (read %1)))
      (return %3))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Borrowed", ["Int"]], ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 11]]],
        ["let", "%1", ["borrow", ["read", "%0"]]],
        ["let", "%2", ["identity", ["move", "%0"]]],
        ["let", "%3", ["load", ["read", "%1"]]],
        ["return", "%3"],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});
