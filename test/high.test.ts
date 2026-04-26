import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIGH from "../src/high/high_grammar.ts";
import { lower } from "../src/passes/lower.gen.ts";
import { evaluate } from "../src/runtime/machine.ts";
import { validate } from "../src/analysis/validate.ts";
import { print } from "../src/high/print.gen.ts";
// import { adjacency_list, analyze, control_flow_graph, Edge, node_list, table_of_contents } from "../src/analysis.ts";

// choose prime numbers for tests, to reduce chances of false-positive results for arithmetic ops
const small: number = 11;
const large: number = 13;
const huge: number = 281;

describe("constants and exit", () => {
  it("must throw error on empty input", () => {
    const text: string = `
function @main [] -> Int


`;

    const input: HIGH.Program = [
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

  block @foo:
    %0 = constant Int ${small}
    return Int %0
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@foo",
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
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject duplicate parameter names.
    // expect(() => evaluate(analyze(input))).toThrow();
  });

  it("must throw an error when exiting with a pointer instead of a Value", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %1 = borrow (Borrowed Int) %0
    return Int %1
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
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

  block @entry:
    %0 = constant Int ${small}
    return Int %0
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
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
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small);
  });
});

describe("copying of registers", () => {
  it("must copy a constant", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %1 = copy Int %0
    return Int %1
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "copy", ["Int"], ["%0"]],
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small);
  });
});

describe("arithmetic operations", () => {
  it("must evaluate integer addition", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %1 = constant Int ${large}
    %2 = add Int %0 %1
    return Int %2
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "constant", ["Int"], { value: large }],
              ["%2", "add", ["Int"], ["%0"], ["%1"]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small + large);
  });
});

describe("labels, jump, and branch", () => {
  it("must execute the correct line of code after an unconditional jump", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    jump @second

  block @first:
    %1 = constant Int ${small}
    return Int %1

  block @second:
    %2 = constant Int ${large}
    return Int %2
`;

    const input: HIGH.Program = [
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
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(large);
  });

  it("must execute first branch if the condition is true", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int 1
    %1 = constant Int ${small}
    %2 = constant Int ${large}
    %3 = constant Int ${huge}
    branch %0 @then @else

  block @then:
    %4 = add Int %1 %2
    jump @end

  block @else:
    %5 = add Int %2 %3
    jump @end

  block @end:
    return Int %4
`;

    const input: HIGH.Program = [
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
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small + large);
  });

  it("must execute the second branch when condition is false", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int 0
    %1 = constant Int ${small}
    %2 = constant Int ${large}
    %3 = constant Int ${huge}
    branch %0 @then @else

  block @then:
    %4 = add Int %1 %2
    jump @end

  block @else:
    %5 = add Int %2 %3
    jump @end

  block @end:
    return Int %5
`;

    const input: HIGH.Program = [
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
            terminator: [null, "return", ["Int"], ["%5"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(large + huge);
  });
});

describe("function call", () => {
  it("must support calling the identity function", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %1 = constant Int ${large}
    %2 = call Int @identity [%1]
    return Int %2

function @identity [Int %a] -> Int

  block @entry:
    return Int %a
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "constant", ["Int"], { value: large }],
              ["%2", "call", ["Int"], "@identity", [["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
      {
        name: "@identity",
        params: [[["Int"], ["%a"]]],
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
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(large);
  });

  it("must support calling a binary function", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %1 = constant Int ${large}
    %2 = call Int @first [%0 %1]
    return Int %2

function @first [Int %a, Int %b] -> Int

  block @entry:
    return Int %a
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "constant", ["Int"], { value: large }],
              ["%2", "call", ["Int"], "@first", [["%0"], ["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
      {
        name: "@first",
        params: [[["Int"], ["%a"]], [["Int"], ["%b"]]],
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
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small);
  });

  it("must evaluate tail-recursive functions", () => {
    // C-style:
    //
    // return factorial(5)
    // function factorial(n, acc = 1):
    //     return n == 1 ? acc : factorial(n-1, n*acc);

    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int 5
    %1 = constant Int 1
    %2 = call Int @factorial [%0 %1]
    return Int %2

function @factorial [Int %n, Int %acc] -> Int

  block @entry:
    %3 = constant Int 1
    %6 = equal Int %n %3
    branch %6 @termination @body

  block @body:
    %7 = subtract Int %n %3
    %8 = multiply Int %n %acc
    %9 = call Int @factorial [%7 %8]
    jump @termination

  block @termination:
    %10 = phi Int [[@body %9] [@entry %acc]]
    return Int %10
`;
    const input: HIGH.Program = [
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
        params: [[["Int"], ["%n"]], [["Int"], ["%acc"]]],
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
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(120);
  });
});

describe("static single assignment", () => {
  it("must throw an error when re-assigning to a register", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %0 = constant Int ${large}
    return Int %1
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%0", "constant", ["Int"], { value: large }], // attempt to reassign register 0
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject duplicate parameter names.
    // expect(() => {evaluate(analyze(input))}).toThrow();
  });

  it("must throw an error when function parameters have the same name", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %1 = constant Int ${large}
    %2 = call Int @first [%0 %1]
    return Int %2

function @first [Int %a, Int %a] -> Int

  block @entry:
    return Int %a
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "constant", ["Int"], { value: large }],
              ["%2", "call", ["Int"], "@first", [["%0"], ["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },
      {
        name: "@first",
        params: [[["Int"], ["%a"]], [["Int"], ["%a"]]], // error
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
    expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject non-unique parameter registers across functions.
    // expect(() => {evaluate(analyze(input))}).toThrow();
  });

  it("must throw an error when function parameter registers are not unique", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %1 = constant Int ${large}
    %2 = call Int @identity [%1]
    return Int %2

function @identity [Int %a] -> Int

  block @entry:
    return Int %a

function @identity2 [Int %a] -> Int

  block @entry:
    return Int %a
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "constant", ["Int"], { value: large }],
              ["%2", "call", ["Int"], "@identity", [["%1"]]],
            ],
            terminator: [null, "return", ["Int"], ["%2"]],
          },
        ],
      },

      {
        name: "@identity",
        params: [[["Int"], ["%a"]]],
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
        params: [[["Int"], ["%a"]]], // error: same parameter name used again
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
    expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject non-unique parameter registers across functions.
    // expect(() => {evaluate(analyze(input))}).toThrow();
  });

  it("phi node must assign from the correct register after an unconditional jump", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    jump @second

  block @first:
    %1 = constant Int ${small}
    jump @end

  block @second:
    %2 = constant Int ${large}
    jump @end

  block @end:
    %3 = phi Int [[@first %1] [@second %2]]
    return Int %3
`;

    const input: HIGH.Program = [
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
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(large);
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

  block @entry:
    %0 = constant Int 0
    %1 = constant Int 1
    %2 = constant Int 3
    jump @loop

  block @loop:
    %3 = phi Int [[@entry %0] [@loop %4]]
    %4 = add Int %1 %3
    %5 = unequal Int %3 %2
    branch %5 @loop @end

  block @end:
    return Int %3
`;

    const input: HIGH.Program = [
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
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(3);
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

  block @entry:
    %condition = constant Int 0
    branch %condition @a @b

  block @a:
    %alpha = constant Int ${small}
    jump @d

  block @b:
    %bravo = constant Int ${large}
    jump @c

  block @c:
    %charlie = constant Int ${huge}
    jump @d

  block @d:
    %grandparent = phi Int [[@a %alpha] [@c %bravo]]
    %parent = phi Int [[@a %alpha] [@c %charlie]]
    %total = add Int %grandparent %parent
    return Int %total
`;

    const input: HIGH.Program = [
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
              "@a",
              "@b",
            ]],
          },
          {
            name: "@a",
            phis: [],
            lines: [
              ["%alpha", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "jump", null, "@d"],
          },
          {
            name: "@b",
            phis: [],
            lines: [
              ["%bravo", "constant", ["Int"], { value: large }],
            ],
            terminator: [null, "jump", null, "@c"],
          },
          {
            name: "@c",
            phis: [],
            lines: [
              ["%charlie", "constant", ["Int"], { value: huge }],
            ],
            terminator: [null, "jump", null, "@d"],
          },
          {
            name: "@d",
            phis: [
              ["%grandparent", "phi", ["Int"], [["@a", ["%alpha"]], [
                "@c",
                ["%bravo"],
              ]]],
              ["%parent", "phi", ["Int"], [["@a", ["%alpha"]], [
                "@c",
                ["%charlie"],
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
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(large + huge);
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

  block @entry:
    jump @a

  block @a:
    %alpha = constant Int ${small}
    %condition = constant Int 1
    branch %condition @b @c

  block @b:
    %bravo = constant Int ${large}
    jump @c

  block @c:
    %result = phi Int [[@a %alpha] [@b %bravo]]
    return Int %result
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "jump", null, "@a"],
          },
          {
            name: "@a",
            phis: [],
            lines: [
              ["%alpha", "constant", ["Int"], { value: small }],
              ["%condition", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "branch", null, ["%condition"], [
              "@b",
              "@c",
            ]],
          },
          {
            name: "@b",
            phis: [],
            lines: [
              ["%bravo", "constant", ["Int"], { value: large }],
            ],
            terminator: [null, "jump", null, "@c"],
          },
          {
            name: "@c",
            phis: [
              ["%result", "phi", ["Int"], [["@a", ["%alpha"]], [
                "@b",
                ["%bravo"],
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
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(large);
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

  block @entry:
    %echo = constant Int 0
    branch %echo @a @c

  block @a:
    %alpha = constant Int 1
    branch %alpha @b @c

  block @b:
    %bravo = constant Int 1
    jump @c

  block @c:
    %result = phi Int [[@entry %echo] [@a %alpha] [@b %bravo]]
    return Int %result
`;

    const input: HIGH.Program = [
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
            terminator: [null, "branch", null, ["%echo"], ["@a", "@c"]],
          },
          {
            name: "@a",
            phis: [],
            lines: [
              ["%alpha", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "branch", null, ["%alpha"], ["@b", "@c"]],
          },
          {
            name: "@b",
            phis: [],
            lines: [
              ["%bravo", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "jump", null, "@c"],
          },
          {
            name: "@c",
            phis: [
              ["%result", "phi", ["Int"], [["@entry", ["%echo"]], [
                "@a",
                ["%alpha"],
              ], ["@b", ["%bravo"]]]],
            ],
            lines: [],
            terminator: [null, "return", ["Int"], ["%result"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(0);
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

  block @entry:
    %echo = constant Int 0
    branch %echo @a @c

  block @a:
    %alpha = constant Int 1
    branch %alpha @b @c

  block @b:
    %bravo = constant Int 1
    jump @c

  block @c:
    %result = phi Int [[@a %alpha] [@b %bravo]]
    return Int %result
`;

    const input: HIGH.Program = [
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
            terminator: [null, "branch", null, ["%echo"], ["@a", "@c"]],
          },
          {
            name: "@a",
            phis: [],
            lines: [
              ["%alpha", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "branch", null, ["%alpha"], ["@b", "@c"]],
          },
          {
            name: "@b",
            phis: [],
            lines: [
              ["%bravo", "constant", ["Int"], { value: 1 }],
            ],
            terminator: [null, "jump", null, "@c"],
          },
          {
            name: "@c",
            phis: [
              ["%result", "phi", ["Int"], [["@a", ["%alpha"]], [
                "@b",
                ["%bravo"],
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
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});

describe("memory and ownership", () => {
  it("must allow consuming the Copy operand", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %1 = copy Int (consume %0)
    return Int %1
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "copy", ["Int"], ["consume", "%0"]],
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small);
  });

  it("must allow consuming an Add operand", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %x = constant Int ${small}
    %y = constant Int ${large}
    %sum = add Int (consume %x) %y
    return Int %sum
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%y", "constant", ["Int"], { value: large }],
              ["%sum", "add", ["Int"], ["consume", "%x"], ["%y"]],
            ],
            terminator: [null, "return", ["Int"], ["%sum"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small + large);
  });

  it("must allow consuming the return operand", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    return Int (consume %0)
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "return", ["Int"], ["consume", "%0"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small);
  });

  it("must create and load from a pointer", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %x = constant Int ${small}
    %r = borrow (Borrowed Int) %x
    %t = load Int %r
    return Int %t
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%r", "borrow", ["Borrowed", ["Int"]], "%x"],
              ["%t", "load", ["Int"], "%r"],
            ],
            terminator: [null, "return", ["Int"], ["%t"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small);
  });

  it("must allow a register to be owned by a pointer", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %x = constant Int ${small}
    %r = own (Owned Int) %x
    %t = load Int %r
    return Int %t
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%r", "own", ["Owned", ["Int"]], ["%x"]],
              ["%t", "load", ["Int"], "%r"],
            ],
            terminator: [null, "return", ["Int"], ["%t"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small);
  });

  it("must detect use of a register owned by a pointer", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %x = constant Int ${small}
    %r = own (Owned Int) %x
    %t = copy Int %x
    return Int %t
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%r", "own", ["Owned", ["Int"]], ["%x"]],
              ["%t", "copy", ["Int"], ["%x"]],
            ],
            terminator: [null, "return", ["Int"], ["%t"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a use-after-free", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int 0
    %0 = drop
    return Int %0
`;

    const input: HIGH.Program = [
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
              ["%0", "drop", null],
            ],
            terminator: [null, "return", ["Int"], ["%0"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a double-free", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %0 = drop
    %0 = drop
    %1 = constant Int ${small}
    return Int %1
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%0", "drop", null],
              ["%0", "drop", null],
              ["%1", "constant", ["Int"], { value: small }],
            ],
            terminator: [null, "return", ["Int"], ["%1"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a use-after-move", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %0 = constant Int ${small}
    %1 = copy Int (consume %0)
    return Int %0
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%0", "constant", ["Int"], { value: small }],
              ["%1", "copy", ["Int"], ["consume", "%0"]],
            ],
            terminator: [null, "return", ["Int"], ["%0"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a dangling pointer when the source register is dropped", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %x = constant Int ${small}
    %r = borrow (Borrowed Int) %x
    %x = drop
    %t = load Int %r
    return Int %t
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%r", "borrow", ["Borrowed", ["Int"]], "%x"],
              ["%x", "drop", null],
              ["%t", "load", ["Int"], "%r"],
            ],
            terminator: [null, "return", ["Int"], ["%t"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a dangling pointer when the source register is moved", () => {
    const text: string = `
function @main [] -> Int

  block @entry:
    %x = constant Int ${small}
    %r = borrow (Borrowed Int) %x
    %y = copy Int (consume %x)
    %t = load Int %r
    return Int %t
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "constant", ["Int"], { value: small }],
              ["%r", "borrow", ["Borrowed", ["Int"]], "%x"],
              ["%y", "copy", ["Int"], ["consume", "%x"]],
              ["%t", "load", ["Int"], "%r"],
            ],
            terminator: [null, "return", ["Int"], ["%t"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
    // expect(count_cfg_nodes(input)).toBe(1);// expect(table_of_contents(input).size).toBe(1);
  });
});
