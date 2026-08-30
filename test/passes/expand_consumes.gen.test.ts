import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import {
  expand_consumes,
  type NumberedProgram,
  reserve_temporaries,
} from "../../src/hir_to_lir/mod.gen.ts";

describe("expand_consumes", () => {
  it("rewrites consumed returns with a temporary copy and drop", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [{ name: "%value", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", { offset: 0, consume: true }],
          },
        ],
      },
    ];

    expect(expand_consumes(reserve_temporaries(input))).toEqual([
      {
        name: "@main",
        params: [{ name: "%value", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            lines: [
              [1, "copy", 0],
              [0, "drop"],
            ],
            terminator: [null, "return", 1],
          },
        ],
      },
    ]);
  });
});
