import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";
import { may_return_pointer } from "../../src/analysis/pointer_return.ts";

describe("analysis: pointer return", () => {
  it("must identify when no pointer is returned", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int (Borrowed Int))
    (result Int)
    (block
      (let %0 (identity (constant 0)))
      (let %1 (borrow (peek %0)))
      (return %0))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Borrowed", ["Int"]]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 0]]],
        ["let", "%1", ["borrow", ["peek", "%0"]]],
        ["return", "%0"],
      ],
    ]];

    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(may_return_pointer(input[1])).toBe(false);
  });

  it("must identify when a pointer is returned", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int (Borrowed Int))
    (result (Borrowed Int))
    (block
      (let %0 (identity (constant 0)))
      (let %1 (borrow (peek %0)))
      (return %1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Borrowed", ["Int"]]],
      ["result", ["Borrowed", ["Int"]]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 0]]],
        ["let", "%1", ["borrow", ["peek", "%0"]]],
        ["return", "%1"],
      ],
    ]];

    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(may_return_pointer(input[1])).toBe(true);
  });
});
