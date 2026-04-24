import * as HIGH from "../../src/high/high_grammar.ts";
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { enumerate_all_blocks } from "../../src/check/enumerate_blocks.ts";

// choose prime numbers for tests, to reduce chances of false-positive results for arithmetic ops
const small: number = 11;
const large: number = 13;
const huge: number = 281;

describe("constants and exit", () => {
  it("must set a single block label correctly", () => {
    // function @main []:
    // block @entry:
    // %0 = constant 11
    // return %0
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
            ],
            terminator: [null, "Return", ["%0"]],
          },
        ],
      },
    ];
    const expected: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@0",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
            ],
            terminator: [null, "Return", ["%0"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(enumerate_all_blocks(input)).toEqual(expected);
  });

  it("must set jump target correctly", () => {
    // function @main []:
    // block @entry:
    // jump @second
    //
    // block @first:
    // %1 = constant 11
    // return %1
    //
    // block @second:
    // %2 = constant 22
    // return %2
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@second"],
          },
          {
            name: "@first",
            joins: [],
            lines: [
              ["%1", "Constant", { value: small }],
            ],
            terminator: [null, "Return", ["%1"]],
          },
          {
            name: "@second",
            joins: [],
            lines: [
              ["%2", "Constant", { value: large }],
            ],
            terminator: [null, "Return", ["%2"]],
          },
        ],
      },
    ];
    const expected: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@0",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@2"],
          },
          {
            name: "@1",
            joins: [],
            lines: [
              ["%1", "Constant", { value: small }],
            ],
            terminator: [null, "Return", ["%1"]],
          },
          {
            name: "@2",
            joins: [],
            lines: [
              ["%2", "Constant", { value: large }],
            ],
            terminator: [null, "Return", ["%2"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(enumerate_all_blocks(input)).toEqual(expected);
  });

  it("must set branch targets correctly", () => {
    // function @main []:
    // block @entry:
    // %0 = constant true
    // %1 = constant 11
    // %2 = constant 22
    // %3 = constant 44
    // branch %0 @then @else
    //
    // block @then:
    // %4 = add %1, %2
    // jump @end
    //
    // block @else:
    // %5 = add %2, %3
    // jump @end
    //
    // block @end:
    // return %4
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 1 }],
              ["%1", "Constant", { value: small }],
              ["%2", "Constant", { value: large }],
              ["%3", "Constant", { value: huge }],
            ],
            terminator: [null, "Branch", ["%0"], ["@then", "@else"]],
          },
          {
            name: "@then",
            joins: [],
            lines: [
              ["%4", "Add", ["%1"], ["%2"]],
            ],
            terminator: [null, "Jump", "@end"],
          },
          {
            name: "@else",
            joins: [],
            lines: [
              ["%5", "Add", ["%2"], ["%3"]],
            ],
            terminator: [null, "Jump", "@end"],
          },
          {
            name: "@end",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%4"]],
          },
        ],
      },
    ];
    const expected: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@0",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 1 }],
              ["%1", "Constant", { value: small }],
              ["%2", "Constant", { value: large }],
              ["%3", "Constant", { value: huge }],
            ],
            terminator: [null, "Branch", ["%0"], ["@1", "@2"]],
          },
          {
            name: "@1",
            joins: [],
            lines: [
              ["%4", "Add", ["%1"], ["%2"]],
            ],
            terminator: [null, "Jump", "@3"],
          },
          {
            name: "@2",
            joins: [],
            lines: [
              ["%5", "Add", ["%2"], ["%3"]],
            ],
            terminator: [null, "Jump", "@3"],
          },
          {
            name: "@3",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%4"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(enumerate_all_blocks(input)).toEqual(expected);
  });

  it("must set block labels in all functions", () => {
    // function @main []:
    // block @entry:
    // %0 = constant 11
    // %1 = constant 22
    // %2 = call @identity [%1]
    // return %2
    //
    // function @identity [%a]:
    // block @entry:
    // return %a
    //
    // function @identity2 [%a]:
    // block @entry:
    // return %a
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
              ["%1", "Constant", { value: large }],
              ["%2", "Call", "@identityA", [["%1"]]],
            ],
            terminator: [null, "Return", ["%2"]],
          },
        ],
      },
      {
        name: "@identityA",
        params: [["%a"]],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%a"]],
          },
        ],
      },
      {
        name: "@identityB",
        params: [["%b"]], // error: same parameter name used again
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%b"]],
          },
        ],
      },
    ];
    const expected: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@0",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
              ["%1", "Constant", { value: large }],
              ["%2", "Call", "@identityA", [["%1"]]],
            ],
            terminator: [null, "Return", ["%2"]],
          },
        ],
      },
      {
        name: "@identityA",
        params: [["%a"]],
        blocks: [
          {
            name: "@0",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%a"]],
          },
        ],
      },
      {
        name: "@identityB",
        params: [["%b"]], // error: same parameter name used again
        blocks: [
          {
            name: "@0",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%b"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(enumerate_all_blocks(input)).toEqual(expected);
  });

  it("phi node must assign from the correct register after an unconditional jump", () => {
    // function @main []:
    // block @entry:
    // jump @second
    //
    // block @first:
    // %1 = constant 11
    // jump @end
    //
    // block @second:
    // %2 = constant 22
    // jump @end
    //
    // block @end:
    // %3 = phi [[@first, %1], [@second, %2]]
    // return %3
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@second"],
          },
          {
            name: "@first",
            joins: [],
            lines: [
              ["%1", "Constant", { value: small }],
            ],
            terminator: [null, "Jump", "@end"],
          },
          {
            name: "@second",
            joins: [],
            lines: [
              ["%2", "Constant", { value: large }],
            ],
            terminator: [null, "Jump", "@end"],
          },
          {
            name: "@end",
            joins: [
              ["%3", "Phi", [["@first", ["%1"]], ["@second", [
                "%2",
              ]]]],
            ],
            lines: [],
            terminator: [null, "Return", ["%3"]],
          },
        ],
      },
    ];
    const expected: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@0",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@2"],
          },
          {
            name: "@1",
            joins: [],
            lines: [
              ["%1", "Constant", { value: small }],
            ],
            terminator: [null, "Jump", "@3"],
          },
          {
            name: "@2",
            joins: [],
            lines: [
              ["%2", "Constant", { value: large }],
            ],
            terminator: [null, "Jump", "@3"],
          },
          {
            name: "@3",
            joins: [
              ["%3", "Phi", [["@first", ["%1"]], ["@second", [
                "%2",
              ]]]],
            ],
            lines: [],
            terminator: [null, "Return", ["%3"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(enumerate_all_blocks(input)).toEqual(expected);
  });
});
