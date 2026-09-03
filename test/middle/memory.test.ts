import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";
import { lower } from "../../src/middle_to_low/lower.gen.ts";
import { evaluate } from "../../src/low/machine.ts";

describe("MIR: memory and ownership", () => {
  it("must create and dereference a pointer", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int (Borrowed Int) Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (borrow (access 0)))
        (let 2 (dereference (access 1)))
        (return (access 2))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Borrowed", ["Int"]], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["borrow", ["access", 0]]],
        ["let", 2, ["dereference", ["access", 1]]],
        ["return", ["access", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11);
  });

  it.skip("must allow a register to be owned by a pointer", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int (Owned Int) Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (own (access 0)))
        (let 2 (dereference (access 1)))
        (return (access 2))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Owned", ["Int"]], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["own", ["access", 0]]],
        ["let", 2, ["dereference", ["access", 1]]],
        ["return", ["access", 2]],
      ]],
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
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (copy (consume 0)))
        (return (access 1))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["copy", ["consume", 0]]],
        ["return", ["access", 1]],
      ]],
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
    (result Int)
    (locals Int Int Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (copy (literal 13)))
        (let 2 (add (consume 0) (access 1)))
        (return (access 2))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["copy", ["literal", 13]]],
        ["let", 2, ["add", ["consume", 0], ["access", 1]]],
        ["return", ["access", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11 + 13);
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
        (let 0 (copy (literal 11)))
        (return (consume 0))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["return", ["consume", 0]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11);
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
        (let 0 (copy (literal 0)))
        (z)
        (return (access 0))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 0]]],
        ["drop", 0],
        ["return", ["access", 0]],
      ]],
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
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (let 0 (copy (literal 0)))
        (drop 0)
        (let 1 (negate (access 0)))
        (return (access 1))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 0]]],
        ["drop", 0],
        ["let", 1, ["negate", ["access", 0]]],
        ["return", ["access", 1]],
      ]],
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
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (drop 0)
        (drop 0)
        (let 1 (copy (literal 11)))
        (return (access 1))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["drop", 0],
        ["drop", 0],
        ["let", 1, ["copy", ["literal", 11]]],
        ["return", ["access", 1]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a use-after-consume", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (copy (consume 0)))
        (return (access 0))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["copy", ["consume", 0]]],
        ["return", ["access", 0]],
      ]],
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
    (result Int)
    (locals Int (Borrowed Int) Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (borrow (access 0)))
        (drop 0)
        (let 2 (dereference (access 1)))
        (return (access 2))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Borrowed", ["Int"]], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["borrow", ["access", 0]]],
        ["drop", 0],
        ["let", 2, ["dereference", ["access", 1]]],
        ["return", ["access", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a dangling pointer when the source register is consumed", () => {
    const text: string = `
(program
  (function
    (parameters)
    (result Int)
    (locals Int (Borrowed Int) Int Int)
    (blocks
      (block
        (let 0 (copy (literal 11)))
        (let 1 (borrow (access 0)))
        (let 2 (copy (consume 0)))
        (let 3 (dereference (access 1)))
        (return (access 3))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Borrowed", ["Int"]], ["Int"], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["borrow", ["access", 0]]],
        ["let", 2, ["copy", ["consume", 0]]],
        ["let", 3, ["dereference", ["access", 1]]],
        ["return", ["access", 3]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
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
        (let 0 (copy (literal 11)))
        (let 1 (own (access 0)))
        (let 2 (copy (access 0)))
        (return (access 2))))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["result", ["Int"]],
      ["locals", ["Int"], ["Owned", ["Int"]], ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 11]]],
        ["let", 1, ["own", ["access", 0]]],
        ["let", 2, ["copy", ["access", 0]]],
        ["return", ["access", 2]],
      ]],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});
