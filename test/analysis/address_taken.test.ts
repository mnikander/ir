import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import { address_taken } from "../../src/analysis/address_taken.ts";
import { print } from "../../src/middle/print.gen.ts";

describe("analysis: address taken", () => {
  it("must identify when no resource is borrowed in a block", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int)
    (result Int)
    (block
      (let %0 (identity (constant 0)))
      (let %1 (identity (constant 1)))
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
        ["let", "%1", ["identity", ["constant", 1]]],
        ["return", "%1"],
      ],
    ]];

    const borrows: MIR.ResourceId[] = address_taken(input[1]);

    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(borrows.length).toBe(0);
  });

  it("must identify which resource is borrowed in a block", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int (Borrowed Int))
    (result Int)
    (block
      (let %0 (identity (constant 0)))
      (let %1 (identity (constant 1)))
      (let %2 (borrow (read %1)))
      (return %1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Borrowed", ["Int"]]],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 0]]],
        ["let", "%1", ["identity", ["constant", 1]]],
        ["let", "%2", ["borrow", ["read", "%1"]]],
        ["return", "%1"],
      ],
    ]];

    const borrows: MIR.ResourceId[] = address_taken(input[1]);

    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(borrows.length).toBe(1);
    expect(borrows[0]).toBe("%1");
  });

  it("must identify which resources are borrowed in multiple blocks", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int (Borrowed Int) Int Int (Borrowed Int))
    (result Int)
    (block
      (let %0 (identity (constant 0)))
      (let %1 (identity (constant 1)))
      (let %2 (borrow (read %0)))
      (jump ^1))
    (block
      (let %3 (identity (constant 3)))
      (let %4 (identity (constant 4)))
      (let %5 (borrow (read %4)))
      (return %1))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      [
        "locals",
        ["Int"],
        ["Int"],
        ["Borrowed", ["Int"]],
        ["Int"],
        ["Int"],
        ["Borrowed", ["Int"]],
      ],
      ["result", ["Int"]],
      [
        "block",
        ["let", "%0", ["identity", ["constant", 0]]],
        ["let", "%1", ["identity", ["constant", 1]]],
        ["let", "%2", ["borrow", ["read", "%0"]]],
        ["jump", "^1"],
      ],
      [
        "block",
        ["let", "%3", ["identity", ["constant", 3]]],
        ["let", "%4", ["identity", ["constant", 4]]],
        ["let", "%5", ["borrow", ["read", "%4"]]],
        ["return", "%1"],
      ],
    ]];

    const borrows: MIR.ResourceId[] = address_taken(input[1]);

    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(borrows.length).toBe(2);
    expect(borrows[0]).toBe("%0");
    expect(borrows[1]).toBe("%4");
  });
});
