import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIR from "../../src/high/high_grammar.ts";
import { number_slots } from "../../src/passes/mod.gen.ts";

describe("number_slots", () => {
  it("records stable slots while leaving named blocks untouched", () => {
    const input: HIR.Program = [
      {
        name: "@combine",
        params: [[["%a"], ["Int"]], [["%b"], ["Int"]]],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%sum", "add", ["Int"], ["%a"], ["%b"]],
              ["%product", "multiply", ["Int"], ["%sum"], ["%a"]],
            ],
            terminator: [null, "return", ["Int"], ["%product"]],
          },
        ],
      },
    ];

    expect(number_slots(input)).toEqual([
      {
        name: "@combine",
        params: [
          { name: "%a", offset: 0 },
          { name: "%b", offset: 1 },
        ],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%sum", "add", ["Int"], ["%a"], ["%b"]],
              ["%product", "multiply", ["Int"], ["%sum"], ["%a"]],
            ],
            terminator: [null, "return", ["Int"], ["%product"]],
          },
        ],
        slots: [
          { name: "%a", offset: 0 },
          { name: "%b", offset: 1 },
          { name: "%sum", offset: 2 },
          { name: "%product", offset: 3 },
        ],
      },
    ]);
  });
});
