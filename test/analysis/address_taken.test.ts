import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MIR from "../../src/middle/middle_grammar.ts";
import { address_taken } from "../../src/analysis/address_taken.ts";
import { print } from "../../src/middle/print.gen.ts";

describe("analysis: address taken", () => {
  it("must identify which resource is borrowed in a block", () => {
    const text: string = `
(program
  (function
    (parameters)
    (locals Int Int (Borrowed Int))
    (result Int)
    (blocks
      (block
        (let 0 (copy (literal 0)))
        (let 1 (copy (literal 1)))
        (let 2 (borrow (access 1)))
        (return 1)))))
`;
    const input: MIR.Program = ["program", [
      "function",
      ["parameters"],
      ["locals", ["Int"], ["Int"], ["Borrowed", ["Int"]]],
      ["result", ["Int"]],
      ["blocks", [
        "block",
        ["let", 0, ["copy", ["literal", 0]]],
        ["let", 1, ["copy", ["literal", 1]]],
        ["let", 2, ["borrow", ["access", 1]]],
        ["return", 1],
      ]],
    ]];

    const borrows: number[] = address_taken(input[1]);

    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(borrows.length).toBe(1);
    expect(borrows[0]).toBe(1);
  });
});
