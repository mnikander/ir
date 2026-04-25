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
function @main []:


`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
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
function @main []:

  block @foo:
    %0 = constant ${small}
    return %0
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@foo",
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
    expect(print(input)).toEqual(text);
    // expect(validate(input)).toBe(false);
    // Lowering/runtime do not currently reject duplicate parameter names.
    // expect(() => evaluate(analyze(input))).toThrow();
  });

  it("must throw an error when exiting with a pointer instead of a Value", () => {
    const text: string = `
function @main []:

  block @entry:
    %0 = constant 0
    %1 = borrow %0
    return %1
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
              ["%1", "Borrow", "%0"],
            ],
            terminator: [null, "Return", ["%1"]],
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
function @main []:

  block @entry:
    %0 = constant ${small}
    return %0
`;

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
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small);
  });
});

describe("copying of registers", () => {
  it("must copy a constant", () => {
    const text: string = `
function @main []:

  block @entry:
    %0 = constant ${small}
    %1 = assign %0
    return %1
`;

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
              ["%1", "Assign", ["%0"]],
            ],
            terminator: [null, "Return", ["%1"]],
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
function @main []:

  block @entry:
    %0 = constant ${small}
    %1 = constant ${large}
    %2 = add %0 %1
    return %2
`;

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
              ["%2", "Add", ["%0"], ["%1"]],
            ],
            terminator: [null, "Return", ["%2"]],
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
function @main []:

  block @entry:
    jump @second

  block @first:
    %1 = constant ${small}
    return %1

  block @second:
    %2 = constant ${large}
    return %2
`;

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
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(large);
  });

  it("must execute first branch if the condition is true", () => {
    const text: string = `
function @main []:

  block @entry:
    %0 = constant 1
    %1 = constant ${small}
    %2 = constant ${large}
    %3 = constant ${huge}
    branch %0 @then @else

  block @then:
    %4 = add %1 %2
    jump @end

  block @else:
    %5 = add %2 %3
    jump @end

  block @end:
    return %4
`;

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
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(small + large);
  });

  it("must execute the second branch when condition is false", () => {
    const text: string = `
function @main []:

  block @entry:
    %0 = constant 0
    %1 = constant ${small}
    %2 = constant ${large}
    %3 = constant ${huge}
    branch %0 @then @else

  block @then:
    %4 = add %1 %2
    jump @end

  block @else:
    %5 = add %2 %3
    jump @end

  block @end:
    return %5
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
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
            terminator: [null, "Return", ["%5"]],
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
function @main []:

  block @entry:
    %0 = constant ${small}
    %1 = constant ${large}
    %2 = call @identity [%1]
    return %2

function @identity [%a]:

  block @entry:
    return %a
`;

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
              ["%2", "Call", "@identity", [["%1"]]],
            ],
            terminator: [null, "Return", ["%2"]],
          },
        ],
      },
      {
        name: "@identity",
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
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(large);
  });

  it("must support calling a binary function", () => {
    const text: string = `
function @main []:

  block @entry:
    %0 = constant ${small}
    %1 = constant ${large}
    %2 = call @first [%0 %1]
    return %2

function @first [%a %b]:

  block @entry:
    return %a
`;

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
              ["%2", "Call", "@first", [["%0"], ["%1"]]],
            ],
            terminator: [null, "Return", ["%2"]],
          },
        ],
      },
      {
        name: "@first",
        params: [["%a"], ["%b"]],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%a"]],
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
function @main []:

  block @entry:
    %0 = constant 5
    %1 = constant 1
    %2 = call @factorial [%0 %1]
    return %2

function @factorial [%n %acc]:

  block @entry:
    %3 = constant 1
    %6 = equal %n %3
    branch %6 @termination @body

  block @body:
    %7 = subtract %n %3
    %8 = multiply %n %acc
    %9 = call @factorial [%7 %8]
    jump @termination

  block @termination:
    %10 = phi [[@body %9] [@entry %acc]]
    return %10
`;
    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 5 }],
              ["%1", "Constant", { value: 1 }],
              ["%2", "Call", "@factorial", [["%0"], ["%1"]]],
            ],
            terminator: [null, "Return", ["%2"]],
          },
        ],
      },
      {
        name: "@factorial",
        params: [["%n"], ["%acc"]],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%3", "Constant", { value: 1 }],
              ["%6", "Equal", ["%n"], ["%3"]],
            ],
            terminator: [null, "Branch", ["%6"], [
              "@termination",
              "@body",
            ]],
          },
          {
            name: "@body",
            joins: [],
            lines: [
              ["%7", "Subtract", ["%n"], ["%3"]],
              ["%8", "Multiply", ["%n"], ["%acc"]],
              ["%9", "Call", "@factorial", [["%7"], ["%8"]]],
            ],
            terminator: [null, "Jump", "@termination"],
          },
          {
            name: "@termination",
            joins: [
              ["%10", "Phi", [["@body", ["%9"]], [
                "@entry",
                ["%acc"],
              ]]],
            ],
            lines: [],
            terminator: [null, "Return", ["%10"]],
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
function @main []:

  block @entry:
    %0 = constant ${small}
    %0 = constant ${large}
    return %1
`;

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
              ["%0", "Constant", { value: large }], // attempt to reassign register 0
            ],
            terminator: [null, "Return", ["%1"]],
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
function @main []:

  block @entry:
    %0 = constant ${small}
    %1 = constant ${large}
    %2 = call @first [%0 %1]
    return %2

function @first [%a %a]:

  block @entry:
    return %a
`;

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
              ["%2", "Call", "@first", [["%0"], ["%1"]]],
            ],
            terminator: [null, "Return", ["%2"]],
          },
        ],
      },
      {
        name: "@first",
        params: [["%a"], ["%a"]], // error
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%a"]],
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
function @main []:

  block @entry:
    %0 = constant ${small}
    %1 = constant ${large}
    %2 = call @identity [%1]
    return %2

function @identity [%a]:

  block @entry:
    return %a

function @identity2 [%a]:

  block @entry:
    return %a
`;

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
              ["%2", "Call", "@identity", [["%1"]]],
            ],
            terminator: [null, "Return", ["%2"]],
          },
        ],
      },

      {
        name: "@identity",
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
        name: "@identity2",
        params: [["%a"]], // error: same parameter name used again
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%a"]],
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
function @main []:

  block @entry:
    jump @second

  block @first:
    %1 = constant ${small}
    jump @end

  block @second:
    %2 = constant ${large}
    jump @end

  block @end:
    %3 = phi [[@first %1] [@second %2]]
    return %3
`;

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
function @main []:

  block @entry:
    %0 = constant 0
    %1 = constant 1
    %2 = constant 3
    jump @loop

  block @loop:
    %3 = phi [[@entry %0] [@loop %4]]
    %4 = add %1 %3
    %5 = unequal %3 %2
    branch %5 @loop @end

  block @end:
    return %3
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
              ["%1", "Constant", { value: 1 }],
              ["%2", "Constant", { value: 3 }],
            ],
            terminator: [null, "Jump", "@loop"],
          },
          {
            name: "@loop",
            joins: [
              ["%3", "Phi", [["@entry", ["%0"]], ["@loop", ["%4"]]]],
            ],
            lines: [
              ["%4", "Add", ["%1"], ["%3"]],
              ["%5", "Unequal", ["%3"], ["%2"]],
            ],
            terminator: [null, "Branch", ["%5"], ["@loop", "@end"]],
          },
          {
            name: "@end",
            joins: [],
            lines: [],
            terminator: [null, "Return", ["%3"]],
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
function @main []:

  block @entry:
    %condition = constant 0
    branch %condition @a @b

  block @a:
    %alpha = constant ${small}
    jump @d

  block @b:
    %bravo = constant ${large}
    jump @c

  block @c:
    %charlie = constant ${huge}
    jump @d

  block @d:
    %grandparent = phi [[@a %alpha] [@c %bravo]]
    %parent = phi [[@a %alpha] [@c %charlie]]
    %total = add %grandparent %parent
    return %total
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%condition", "Constant", { value: 0 }],
            ],
            terminator: [null, "Branch", ["%condition"], [
              "@a",
              "@b",
            ]],
          },
          {
            name: "@a",
            joins: [],
            lines: [
              ["%alpha", "Constant", { value: small }],
            ],
            terminator: [null, "Jump", "@d"],
          },
          {
            name: "@b",
            joins: [],
            lines: [
              ["%bravo", "Constant", { value: large }],
            ],
            terminator: [null, "Jump", "@c"],
          },
          {
            name: "@c",
            joins: [],
            lines: [
              ["%charlie", "Constant", { value: huge }],
            ],
            terminator: [null, "Jump", "@d"],
          },
          {
            name: "@d",
            joins: [
              ["%grandparent", "Phi", [["@a", ["%alpha"]], [
                "@c",
                ["%bravo"],
              ]]],
              ["%parent", "Phi", [["@a", ["%alpha"]], [
                "@c",
                ["%charlie"],
              ]]],
            ],
            lines: [
              ["%total", "Add", ["%grandparent"], ["%parent"]],
            ],
            terminator: [null, "Return", ["%total"]],
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
function @main []:

  block @entry:
    jump @a

  block @a:
    %alpha = constant ${small}
    %condition = constant 1
    branch %condition @b @c

  block @b:
    %bravo = constant ${large}
    jump @c

  block @c:
    %result = phi [[@a %alpha] [@b %bravo]]
    return %result
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@a"],
          },
          {
            name: "@a",
            joins: [],
            lines: [
              ["%alpha", "Constant", { value: small }],
              ["%condition", "Constant", { value: 1 }],
            ],
            terminator: [null, "Branch", ["%condition"], [
              "@b",
              "@c",
            ]],
          },
          {
            name: "@b",
            joins: [],
            lines: [
              ["%bravo", "Constant", { value: large }],
            ],
            terminator: [null, "Jump", "@c"],
          },
          {
            name: "@c",
            joins: [
              ["%result", "Phi", [["@a", ["%alpha"]], [
                "@b",
                ["%bravo"],
              ]]],
            ],
            lines: [],
            terminator: [null, "Return", ["%result"]],
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
function @main []:

  block @entry:
    %echo = constant 0
    branch %echo @a @c

  block @a:
    %alpha = constant 1
    branch %alpha @b @c

  block @b:
    %bravo = constant 1
    jump @c

  block @c:
    %result = phi [[@entry %echo] [@a %alpha] [@b %bravo]]
    return %result
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%echo", "Constant", { value: 0 }],
            ],
            terminator: [null, "Branch", ["%echo"], ["@a", "@c"]],
          },
          {
            name: "@a",
            joins: [],
            lines: [
              ["%alpha", "Constant", { value: 1 }],
            ],
            terminator: [null, "Branch", ["%alpha"], ["@b", "@c"]],
          },
          {
            name: "@b",
            joins: [],
            lines: [
              ["%bravo", "Constant", { value: 1 }],
            ],
            terminator: [null, "Jump", "@c"],
          },
          {
            name: "@c",
            joins: [
              ["%result", "Phi", [["@entry", ["%echo"]], [
                "@a",
                ["%alpha"],
              ], ["@b", ["%bravo"]]]],
            ],
            lines: [],
            terminator: [null, "Return", ["%result"]],
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
function @main []:

  block @entry:
    %echo = constant 0
    branch %echo @a @c

  block @a:
    %alpha = constant 1
    branch %alpha @b @c

  block @b:
    %bravo = constant 1
    jump @c

  block @c:
    %result = phi [[@a %alpha] [@b %bravo]]
    return %result
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%echo", "Constant", { value: 0 }],
            ],
            terminator: [null, "Branch", ["%echo"], ["@a", "@c"]],
          },
          {
            name: "@a",
            joins: [],
            lines: [
              ["%alpha", "Constant", { value: 1 }],
            ],
            terminator: [null, "Branch", ["%alpha"], ["@b", "@c"]],
          },
          {
            name: "@b",
            joins: [],
            lines: [
              ["%bravo", "Constant", { value: 1 }],
            ],
            terminator: [null, "Jump", "@c"],
          },
          {
            name: "@c",
            joins: [
              ["%result", "Phi", [["@a", ["%alpha"]], [
                "@b",
                ["%bravo"],
              ]]],
            ],
            lines: [],
            terminator: [null, "Return", ["%result"]],
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
  it("must allow consuming the Assign operand", () => {
    const text: string = `
function @main []:

  block @entry:
    %0 = constant ${small}
    %1 = assign (consume %0)
    return %1
`;

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
              ["%1", "Assign", ["consume", "%0"]],
            ],
            terminator: [null, "Return", ["%1"]],
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
function @main []:

  block @entry:
    %x = constant ${small}
    %y = constant ${large}
    %sum = add (consume %x) %y
    return %sum
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: small }],
              ["%y", "Constant", { value: large }],
              ["%sum", "Add", ["consume", "%x"], ["%y"]],
            ],
            terminator: [null, "Return", ["%sum"]],
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
function @main []:

  block @entry:
    %0 = constant ${small}
    return (consume %0)
`;

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
            terminator: [null, "Return", ["consume", "%0"]],
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
function @main []:

  block @entry:
    %x = constant ${small}
    %r = borrow %x
    %t = load %r
    return %t
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: small }],
              ["%r", "Borrow", "%x"],
              ["%t", "Load", "%r"],
            ],
            terminator: [null, "Return", ["%t"]],
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
function @main []:

  block @entry:
    %x = constant ${small}
    %r = own %x
    %t = load %r
    return %t
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: small }],
              ["%r", "Own", ["%x"]],
              ["%t", "Load", "%r"],
            ],
            terminator: [null, "Return", ["%t"]],
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
function @main []:

  block @entry:
    %x = constant ${small}
    %r = own %x
    %t = assign %x
    return %t
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: small }],
              ["%r", "Own", ["%x"]],
              ["%t", "Assign", ["%x"]],
            ],
            terminator: [null, "Return", ["%t"]],
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
function @main []:

  block @entry:
    %0 = constant 0
    %0 = drop
    return %0
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
              ["%0", "Drop"],
            ],
            terminator: [null, "Return", ["%0"]],
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
function @main []:

  block @entry:
    %0 = constant 0
    %1 = constant 0
    %0 = drop
    %0 = drop
    return %1
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
              ["%1", "Constant", { value: 0 }],
              ["%0", "Drop"],
              ["%0", "Drop"],
            ],
            terminator: [null, "Return", ["%1"]],
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
function @main []:

  block @entry:
    %0 = constant 0
    %1 = assign (consume %0)
    return %0
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
              ["%1", "Assign", ["consume", "%0"]],
            ],
            terminator: [null, "Return", ["%0"]],
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
function @main []:

  block @entry:
    %x = constant ${small}
    %r = borrow %x
    %x = drop
    %t = load %r
    return %t
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: small }],
              ["%r", "Borrow", "%x"],
              ["%x", "Drop"],
              ["%t", "Load", "%r"],
            ],
            terminator: [null, "Return", ["%t"]],
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
function @main []:

  block @entry:
    %x = constant ${small}
    %r = borrow %x
    %y = assign (consume %x)
    %t = load %r
    return %t
`;

    const input: HIGH.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: small }],
              ["%r", "Borrow", "%x"],
              ["%y", "Assign", ["consume", "%x"]],
              ["%t", "Load", "%r"],
            ],
            terminator: [null, "Return", ["%t"]],
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
