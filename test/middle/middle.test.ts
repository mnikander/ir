import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";
import { lower } from "../../src/middle_to_low/lower.gen.ts";
import { evaluate } from "../../src/low/machine.ts";

describe("MIR: literals and exit", () => {
  it("must evaluate assignment and return of a constant", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int)
    (result Int)
    (block
      (let 0 (identity (constant 11)))
      (return 0))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["return", 0],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11);
  });

  it("must throw an error when re-assigning a resource", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 11)))
      (let 0 (identity (constant 13)))
      (return 1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["let", 0, ["identity", ["constant", 13]]],
        ["return", 1],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => {
      evaluate(lower(input));
    }).toThrow();
  });

  it("must throw error on empty input", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals)
    (result Int)))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals"],
      ["result", ["Int"]],
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
    (block
      (let 0 (identity (constant 11)))
      (let 1 (borrow (access 0)))
      (return 1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Borrowed", ["Int"]]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["let", 1, ["borrow", ["access", 0]]],
        ["return", 1],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow();
  });
});

describe("MIR: copying of registers", () => {
  it("must copy a constant", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 11)))
      (let 1 (identity (access 0)))
      (return 1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["let", 1, ["identity", ["access", 0]]],
        ["return", 1],
      ],
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
    (block
      (let 0 (identity (constant 11)))
      (let 1 (identity (constant 13)))
      (let 2 (add (access 0) (access 1)))
      (return 2))))
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
        ["let", 2, ["add", ["access", 0], ["access", 1]]],
        ["return", 2],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11 + 13);
  });

  it("must evaluate integer addition with a constant", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (let 0 (identity (constant 11)))
      (let 1 (add (access 0) (constant 13)))
      (return 1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"]],
      ["result", ["Int"]],
      [
        "block",
        ["let", 0, ["identity", ["constant", 11]]],
        ["let", 1, ["add", ["access", 0], ["constant", 13]]],
        ["return", 1],
      ],
    ]];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(evaluate(lower(input))).toBe(11 + 13);
  });
});
