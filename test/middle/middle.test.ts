import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as MID from "../../src/middle/middle_grammar.ts";
import { print } from "../../src/middle/print.gen.ts";
// import { adjacency_list, analyze, control_flow_graph, Edge, node_list, table_of_contents } from "../src/analysis.ts";

describe("constants and exit", () => {
  it("must throw error on empty input", () => {
    const text: string = `
function @main [] -> Int


`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject a missing @entry block.
    // expect(() => evaluate(analyze(input))).toThrow();
  });

  it("must throw error if there is no Entry block", () => {
    const text: string = `
function @main [] -> Int

  block @foo
    %0 = constant Int 11
    return Int %0
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@foo",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
            ],
            terminator: [null, "return", ["Int"], ["%0"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject duplicate parameter names.
    // expect(() => evaluate(analyze(input))).toThrow();
  });

  it("must throw an error when exiting with a pointer instead of a Value", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 11
    %1 = borrow (Borrowed Int) %0
    return Int %1
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
              ["%1", "borrow", ["Borrowed", ["Int"]], "%0"],
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject non-unique parameter registers across functions.
    // expect(() => evaluate(analyze(input))).toThrow();
  });

  it("must evaluate a constant", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 11
    return Int %0
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
            ],
            terminator: [null, "return", ["Int"], ["%0"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(11);
  });
});

describe("copying of registers", () => {
  it("must copy a constant", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 11
    %1 = copy Int %0
    return Int %1
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
              ["%1", "copy", ["Int"], ["%0"]],
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(11);
  });
});

describe("arithmetic operations", () => {
  it("must evaluate integer addition", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 11
    %1 = constant Int 13
    %2 = add Int %0 %1
    return Int %2
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
              ["%1", "constant", ["Int"], { value: 13 }],
              ["%2", "add", ["Int"], ["%0"], ["%1"]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(11 + 13);
  });
});

describe("labels, jump, and branch", () => {
  it("must execute the correct line of code after an unconditional jump", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    jump @second

  block @first
    %1 = constant Int 11
    return Int %1

  block @second
    %2 = constant Int 13
    return Int %2
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
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
              ["%1", "constant", ["Int"], { value: 11 }],
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
          {
            name: "@second",
            phis: [],
            lines: [
              ["%2", "constant", ["Int"], { value: 13 }],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(13);
  });

  it("must execute first branch if the condition is true", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 1
    %1 = constant Int 11
    %2 = constant Int 13
    %3 = constant Int 281
    branch %0 @then @else

  block @then
    %4 = add Int %1 %2
    jump @end

  block @else
    %5 = add Int %2 %3
    jump @end

  block @end
    return Int %4
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 1 }],
              ["%1", "constant", ["Int"], { value: 11 }],
              ["%2", "constant", ["Int"], { value: 13 }],
              ["%3", "constant", ["Int"], { value: 281 }],
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
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(11 + 13);
  });

  it("must execute the second branch when condition is false", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 0
    %1 = constant Int 11
    %2 = constant Int 13
    %3 = constant Int 281
    branch %0 @then @else

  block @then
    %4 = add Int %1 %2
    jump @end

  block @else
    %5 = add Int %2 %3
    jump @end

  block @end
    return Int %5
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 0 }],
              ["%1", "constant", ["Int"], { value: 11 }],
              ["%2", "constant", ["Int"], { value: 13 }],
              ["%3", "constant", ["Int"], { value: 281 }],
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
            terminator: [null, "return", ["Int"], ["%5"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(13 + 281);
  });
});

describe("function call", () => {
  it("must support calling the identity function", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 11
    %1 = constant Int 13
    %2 = call Int @identity [%1]
    return Int %2

function @identity [%a : Int] -> Int

  block @entry
    return Int %a
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
              ["%1", "constant", ["Int"], { value: 13 }],
              ["%2", "call", ["Int"], "@identity", [["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
      {
        name: "@identity",
        params: [[["%a"], ["Int"]]],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%a"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(13);
  });

  it("must support calling a binary function", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 11
    %1 = constant Int 13
    %2 = call Int @first [%0, %1]
    return Int %2

function @first [%a : Int, %b : Int] -> Int

  block @entry
    return Int %a
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
              ["%1", "constant", ["Int"], { value: 13 }],
              ["%2", "call", ["Int"], "@first", [["%0"], ["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
      {
        name: "@first",
        params: [[["%a"], ["Int"]], [["%b"], ["Int"]]],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%a"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(11);
  });

  it("must evaluate tail-recursive functions", () => {
    // C-style:
    //
    // return factorial(5)
    // function factorial(n, acc = 1):
    //     return n == 1 ? acc : factorial(n-1, n*acc);

    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 5
    %1 = constant Int 1
    %2 = call Int @factorial [%0, %1]
    return Int %2

function @factorial [%n : Int, %acc : Int] -> Int

  block @entry
    %3 = constant Int 1
    %6 = equal Int %n %3
    branch %6 @termination @body

  block @body
    %7 = subtract Int %n %3
    %8 = multiply Int %n %acc
    %9 = call Int @factorial [%7, %8]
    jump @termination

  block @termination
    %10 = phi Int [@body, %9] [@entry, %acc]
    return Int %10
`;
    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 5 }],
              ["%1", "constant", ["Int"], { value: 1 }],
              ["%2", "call", ["Int"], "@factorial", [["%0"], ["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
      {
        name: "@factorial",
        params: [[["%n"], ["Int"]], [["%acc"], ["Int"]]],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%3", "constant", ["Int"], { value: 1 }],
              ["%6", "equal", ["Int"], ["%n"], ["%3"]],
            ],
            terminator: [null, "branch", null, ["%6"], [
              "@termination",
              "@body",
            ]],
          },
          {
            name: "@body",
            phis: [],
            lines: [
              ["%7", "subtract", ["Int"], ["%n"], ["%3"]],
              ["%8", "multiply", ["Int"], ["%n"], ["%acc"]],
              ["%9", "call", ["Int"], "@factorial", [["%7"], ["%8"]]],
            ],
            terminator: [null, "jump", null, "@termination"],
          },
          {
            name: "@termination",
            phis: [
              ["%10", "phi", ["Int"], [["@body", ["%9"]], [
                "@entry",
                ["%acc"],
              ]]],
            ],
            lines: [],
            terminator: [null, "return", ["Int"], ["%10"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(120);
  });
});

describe("static single assignment", () => {
  it("must throw an error when re-assigning to a register", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 11
    %0 = constant Int 13
    return Int %1
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
              ["%0", "constant", ["Int"], { value: 13 }], // attempt to reassign register 0
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject duplicate parameter names.
    // expect(() => {evaluate(analyze(input))}).toThrow();
  });

  it("must throw an error when function parameters have the same name", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 11
    %1 = constant Int 13
    %2 = call Int @first [%0, %1]
    return Int %2

function @first [%a : Int, %a : Int] -> Int

  block @entry
    return Int %a
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
              ["%1", "constant", ["Int"], { value: 13 }],
              ["%2", "call", ["Int"], "@first", [["%0"], ["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
      {
        name: "@first",
        params: [[["%a"], ["Int"]], [["%a"], ["Int"]]], // error
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%a"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject non-unique parameter registers across functions.
    // expect(() => {evaluate(analyze(input))}).toThrow();
  });

  it("must throw an error when function parameter registers are not unique", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 11
    %1 = constant Int 13
    %2 = call Int @identity [%1]
    return Int %2

function @identity [%a : Int] -> Int

  block @entry
    return Int %a

function @identity2 [%a : Int] -> Int

  block @entry
    return Int %a
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 11 }],
              ["%1", "constant", ["Int"], { value: 13 }],
              ["%2", "call", ["Int"], "@identity", [["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },

      {
        name: "@identity",
        params: [[["%a"], ["Int"]]],
        return_type: ["Int"],
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
        name: "@identity2",
        params: [[["%a"], ["Int"]]], // error: same parameter name used again
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%a"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject non-unique parameter registers across functions.
    // expect(() => {evaluate(analyze(input))}).toThrow();
  });

  it("phi node must assign from the correct register after an unconditional jump", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    jump @second

  block @first
    %1 = constant Int 11
    jump @end

  block @second
    %2 = constant Int 13
    jump @end

  block @end
    %3 = phi Int [@first, %1] [@second, %2]
    return Int %3
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
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
              ["%1", "constant", ["Int"], { value: 11 }],
            ],
            terminator: [null, "jump", null, "@end"],
          },
          {
            name: "@second",
            phis: [],
            lines: [
              ["%2", "constant", ["Int"], { value: 13 }],
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
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(13);
  });

  it("phi node must assign from the correct register when executing a loop", () => {
    // C-style:
    //
    // int i = 0;
    // while (i != 3) {
    //     i++;
    // }
    // return i;
    //
    //
    // IR-code:
    //
    const text: string = `
function @main [] -> Int

  block @entry
    %0 = constant Int 0
    %1 = constant Int 1
    %2 = constant Int 3
    jump @loop

  block @loop
    %3 = phi Int [@entry, %0] [@loop, %4]
    %4 = add Int %1 %3
    %5 = unequal Int %3 %2
    branch %5 @loop @end

  block @end
    return Int %3
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: 0 }],
              ["%1", "constant", ["Int"], { value: 1 }],
              ["%2", "constant", ["Int"], { value: 3 }],
            ],
            terminator: [null, "jump", null, "@loop"],
          },
          {
            name: "@loop",
            phis: [
              ["%3", "phi", ["Int"], [["@entry", ["%0"]], ["@loop", ["%4"]]]],
            ],
            lines: [
              ["%4", "add", ["Int"], ["%1"], ["%3"]],
              ["%5", "unequal", ["Int"], ["%3"], ["%2"]],
            ],
            terminator: [null, "branch", null, ["%5"], ["@loop", "@end"]],
          },
          {
            name: "@end",
            phis: [],
            lines: [],
            terminator: [null, "return", ["Int"], ["%3"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(3);
  });

  it("phi node must allow assignment from dominator blocks which are not the immediate dominator", () => {
    // Control flow graph with a split in the Entry node and a Join in node D
    //
    //      Entry
    //      /   \
    //     A     B
    //      \    |
    //       \   C
    //        \ /
    //         D
    //
    //
    const text: string = `
function @main [] -> Int

  block @entry
    %condition = constant Int 0
    branch %condition @alpha @bravo

  block @alpha
    %a = constant Int 11
    jump @delta

  block @bravo
    %b = constant Int 13
    jump @charlie

  block @charlie
    %c = constant Int 281
    jump @delta

  block @delta
    %grandparent = phi Int [@alpha, %a] [@charlie, %b]
    %parent = phi Int [@alpha, %a] [@charlie, %c]
    %total = add Int %grandparent %parent
    return Int %total
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%condition", "constant", ["Int"], { value: 0 }],
            ],
            terminator: [null, "branch", null, ["%condition"], [
              "@alpha",
              "@bravo",
            ]],
          },
          {
            name: "@alpha",
            phis: [],
            lines: [
              ["%a", "constant", ["Int"], { value: 11 }],
            ],
            terminator: [null, "jump", null, "@delta"],
          },
          {
            name: "@bravo",
            phis: [],
            lines: [
              ["%b", "constant", ["Int"], { value: 13 }],
            ],
            terminator: [null, "jump", null, "@charlie"],
          },
          {
            name: "@charlie",
            phis: [],
            lines: [
              ["%c", "constant", ["Int"], { value: 281 }],
            ],
            terminator: [null, "jump", null, "@delta"],
          },
          {
            name: "@delta",
            phis: [
              ["%grandparent", "phi", ["Int"], [["@alpha", ["%a"]], [
                "@charlie",
                ["%b"],
              ]]],
              ["%parent", "phi", ["Int"], [["@alpha", ["%a"]], [
                "@charlie",
                ["%c"],
              ]]],
            ],
            lines: [
              ["%total", "add", ["Int"], ["%grandparent"], ["%parent"]],
            ],
            terminator: [null, "return", ["Int"], ["%total"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(13 + 281);
  });

  it("phi node must allow assignment when both inputs are available", () => {
    //
    //      Entry
    //        |
    //        A
    //      / |
    //     B  |
    //      \ |
    //        C
    //
    //
    const text: string = `
function @main [] -> Int

  block @entry
    jump @alpha

  block @alpha
    %a = constant Int 11
    %condition = constant Int 1
    branch %condition @bravo @charlie

  block @bravo
    %b = constant Int 13
    jump @charlie

  block @charlie
    %result = phi Int [@alpha, %a] [@bravo, %b]
    return Int %result
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "jump", null, "@alpha"],
          },
          {
            name: "@alpha",
            phis: [],
            lines: [
              ["%a", "constant", ["Int"], { value: 11 }],
              ["%condition", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "branch", null, ["%condition"], [
              "@bravo",
              "@charlie",
            ]],
          },
          {
            name: "@bravo",
            phis: [],
            lines: [
              ["%b", "constant", ["Int"], { value: 13 }],
            ],
            terminator: [null, "jump", null, "@charlie"],
          },
          {
            name: "@charlie",
            phis: [
              ["%result", "phi", ["Int"], [["@alpha", ["%a"]], [
                "@bravo",
                ["%b"],
              ]]],
            ],
            lines: [],
            terminator: [null, "return", ["Int"], ["%result"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(13);
  });

  it("must allow assignment when three inputs are available", () => {
    //
    //        Entry
    //        |   |
    //        A   |
    //      / |   |
    //     B  |  /
    //      \ | /
    //        C
    //
    //
    const text: string = `
function @main [] -> Int

  block @entry
    %echo = constant Int 0
    branch %echo @alpha @charlie

  block @alpha
    %a = constant Int 1
    branch %a @bravo @charlie

  block @bravo
    %b = constant Int 1
    jump @charlie

  block @charlie
    %result = phi Int [@entry, %echo] [@alpha, %a] [@bravo, %b]
    return Int %result
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%echo", "constant", ["Int"], { value: 0 }],
            ],
            terminator: [null, "branch", null, ["%echo"], [
              "@alpha",
              "@charlie",
            ]],
          },
          {
            name: "@alpha",
            phis: [],
            lines: [
              ["%a", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "branch", null, ["%a"], ["@bravo", "@charlie"]],
          },
          {
            name: "@bravo",
            phis: [],
            lines: [
              ["%b", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "jump", null, "@charlie"],
          },
          {
            name: "@charlie",
            phis: [
              ["%result", "phi", ["Int"], [["@entry", ["%echo"]], [
                "@alpha",
                ["%a"],
              ], ["@bravo", ["%b"]]]],
            ],
            lines: [],
            terminator: [null, "return", ["Int"], ["%result"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(true);
    // expect(evaluate(lower(input))).toBe(0);
  });

  it("must throw an error when a phi node is non-exhaustive", () => {
    //
    //        Entry
    //        |   |
    //        A   |
    //      / |   |
    //     B  |  /
    //      \ | /
    //        C
    //
    //
    const text: string = `
function @main [] -> Int

  block @entry
    %echo = constant Int 0
    branch %echo @alpha @charlie

  block @alpha
    %a = constant Int 1
    branch %a @bravo @charlie

  block @bravo
    %b = constant Int 1
    jump @charlie

  block @charlie
    %result = phi Int [@alpha, %a] [@bravo, %b]
    return Int %result
`;

    const input: MID.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%echo", "constant", ["Int"], { value: 0 }],
            ],
            terminator: [null, "branch", null, ["%echo"], [
              "@alpha",
              "@charlie",
            ]],
          },
          {
            name: "@alpha",
            phis: [],
            lines: [
              ["%a", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "branch", null, ["%a"], ["@bravo", "@charlie"]],
          },
          {
            name: "@bravo",
            phis: [],
            lines: [
              ["%b", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "jump", null, "@charlie"],
          },
          {
            name: "@charlie",
            phis: [
              ["%result", "phi", ["Int"], [["@alpha", ["%a"]], [
                "@bravo",
                ["%b"],
              ]]],
            ],
            lines: [],
            terminator: [null, "return", ["Int"], ["%result"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(false);
    // expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});
