import * as HIGH from "../../src/high/high_grammar.ts";
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { enumerate_all_blocks } from "../../src/transformations/enumerate_blocks.ts";

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
        type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "return", ["Int"], ["%0"]],
          },
        ],
      },
    ];
    const expected: HIGH.Program = [
      {
        name: "@main",
        params: [],
        type: ["Int"],
        blocks: [
          {
            name: "@0",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "return", ["Int"], ["%0"]],
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
        type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "jump", null, "@second"],
          },
          {
            name: "@first",
            phis: [],
            lines: [
              ["%1", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
          {
            name: "@second",
            phis: [],
            lines: [
              ["%2", "constant", ["Int"], { value: large }],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
    ];
    const expected: HIGH.Program = [
      {
        name: "@main",
        params: [],
        type: ["Int"],
        blocks: [
          {
            name: "@0",
            phis: [],
            lines: [],
            terminator: [null, "jump", null, "@2"],
          },
          {
            name: "@1",
            phis: [],
            lines: [
              ["%1", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
          {
            name: "@2",
            phis: [],
            lines: [
              ["%2", "constant", ["Int"], { value: large }],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
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
        type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 1 }],
              ["%1", "constant", ["Int"], { value: small }],
              ["%2", "constant", ["Int"], { value: large }],
              ["%3", "constant", ["Int"], { value: huge }],
            ],
            terminator: [null, "branch", null, ["%0"], ["@then", "@else"]],
          },
          {
            name: "@then",
            phis: [],
            lines: [
              ["%4", "add", ["Int"], ["%1"], ["%2"]],
            ],
            terminator: [null, "jump", null, "@end"],
          },
          {
            name: "@else",
            phis: [],
            lines: [
              ["%5", "add", ["Int"], ["%2"], ["%3"]],
            ],
            terminator: [null, "jump", null, "@end"],
          },
          {
            name: "@end",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%4"]],
          },
        ],
      },
    ];
    const expected: HIGH.Program = [
      {
        name: "@main",
        params: [],
        type: ["Int"],
        blocks: [
          {
            name: "@0",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 1 }],
              ["%1", "constant", ["Int"], { value: small }],
              ["%2", "constant", ["Int"], { value: large }],
              ["%3", "constant", ["Int"], { value: huge }],
            ],
            terminator: [null, "branch", null, ["%0"], ["@1", "@2"]],
          },
          {
            name: "@1",
            phis: [],
            lines: [
              ["%4", "add", ["Int"], ["%1"], ["%2"]],
            ],
            terminator: [null, "jump", null, "@3"],
          },
          {
            name: "@2",
            phis: [],
            lines: [
              ["%5", "add", ["Int"], ["%2"], ["%3"]],
            ],
            terminator: [null, "jump", null, "@3"],
          },
          {
            name: "@3",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%4"]],
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
        type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "constant", ["Int"], { value: large }],
              ["%2", "call", ["Int"], "@identityA", [["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
      {
        name: "@identityA",
        params: [[["Int"], ["%a"]]],
        type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%a"]],
          },
        ],
      },
      {
        name: "@identityB",
        params: [[["Int"], ["%b"]]], // error: same parameter name used again
        type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%b"]],
          },
        ],
      },
    ];
    const expected: HIGH.Program = [
      {
        name: "@main",
        params: [],
        type: ["Int"],
        blocks: [
          {
            name: "@0",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "constant", ["Int"], { value: large }],
              ["%2", "call", ["Int"], "@identityA", [["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
      {
        name: "@identityA",
        params: [[["Int"], ["%a"]]],
        type: ["Int"],
        blocks: [
          {
            name: "@0",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%a"]],
          },
        ],
      },
      {
        name: "@identityB",
        params: [[["Int"], ["%b"]]], // error: same parameter name used again
        type: ["Int"],
        blocks: [
          {
            name: "@0",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%b"]],
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
        type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "jump", null, "@second"],
          },
          {
            name: "@first",
            phis: [],
            lines: [
              ["%1", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "jump", null, "@end"],
          },
          {
            name: "@second",
            phis: [],
            lines: [
              ["%2", "constant", ["Int"], { value: large }],
            ],
            terminator: [null, "jump", null, "@end"],
          },
          {
            name: "@end",
            phis: [
              ["%3", "phi", ["Int"], [["@first", ["%1"]], ["@second", [
                "%2",
              ]]]],
            ],
            lines: [],
            terminator: [null, "return", ["Int"], ["%3"]],
          },
        ],
      },
    ];
    const expected: HIGH.Program = [
      {
        name: "@main",
        params: [],
        type: ["Int"],
        blocks: [
          {
            name: "@0",
            phis: [],
            lines: [],
            terminator: [null, "jump", null, "@2"],
          },
          {
            name: "@1",
            phis: [],
            lines: [
              ["%1", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "jump", null, "@3"],
          },
          {
            name: "@2",
            phis: [],
            lines: [
              ["%2", "constant", ["Int"], { value: large }],
            ],
            terminator: [null, "jump", null, "@3"],
          },
          {
            name: "@3",
            phis: [
              ["%3", "phi", ["Int"], [["@first", ["%1"]], ["@second", [
                "%2",
              ]]]],
            ],
            lines: [],
            terminator: [null, "return", ["Int"], ["%3"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(enumerate_all_blocks(input)).toEqual(expected);
  });
});
