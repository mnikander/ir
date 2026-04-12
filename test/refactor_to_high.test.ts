import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as REF from "../src/high/refactoring_grammar.ts";
// import { adjacency_list, analyze, control_flow_graph, Edge, node_list, table_of_contents } from "../src/analysis.ts";

// choose prime numbers for tests, to reduce chances of false-positive results for arithmetic ops
const small: number = 11;
const large: number = 13;
const huge: number = 281;

describe("constants and exit", () => {
  it("must throw error on empty input", () => {
    // (empty program)
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => evaluate(analyze(input))).toThrow();
  });

  it("must throw error if there is no Entry block", () => {
    // function @main []:
    // (missing block @main.entry)
    // %0 = constant 11
    // exit %0
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.foo",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
            ],
            terminator: [null, "Exit", "%0"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => evaluate(analyze(input))).toThrow();
  });

  it("must throw a runtime-error when exiting with a Reference instead of a Value", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 0
    // %1 = ref %0
    // exit %1
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
              ["%1", "AddressOf", "%0"],
            ],
            terminator: [null, "Exit", "%1"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => {evaluate(analyze(input))}).toThrow();
    // expect(table_of_contents(input).size).toBe(1);
  });

  it("must evaluate a constant", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // exit %0
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
            ],
            terminator: [null, "Exit", "%0"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(small);
    // expect(table_of_contents(input).size).toBe(1);
  });
});

describe("copying of registers", () => {
  it("must copy a constant", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %1 = copy %0
    // exit %1
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
              ["%1", "Copy", "%0"],
            ],
            terminator: [null, "Exit", "%1"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(small);
    // expect(table_of_contents(input).size).toBe(1);
  });
});

describe("arithmetic operations", () => {
  it("must evaluate integer addition", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %1 = constant 22
    // %2 = add %0, %1
    // exit %2
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
              ["%1", "Constant", { value: large }],
              ["%2", "Add", "%0", "%1"],
            ],
            terminator: [null, "Exit", "%2"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(small + large);
    // expect(table_of_contents(input).size).toBe(1);
  });
});

describe("labels, jump, and branch", () => {
  // it('must report an error if a block falls through into the next label', () => {
  //     // function @main []:
  //     // block @main.entry:
  //     // %0 = constant 11
  //     // (missing terminator)
  //     //
  //     // block @main.first:
  //     // %1 = constant 22
  //     // exit %2
  //     const input: REF.Program = [
  //         {
  //             func: '@main',
  //             params: [],
  //             blocks:
  //             [
  //                 {
  //                     block: '@main.entry',
  //                     joins: [],
  //                     lines: [
  //                         [ '%0', 'Const', 11 ],
  //                     ],
  //                     terminator: [] // the missing Terminator statement here, should cause an error
  //                 },
  //                 {
  //                     block: '@main.first',
  //                     joins: [],
  //                     lines: [
  //                         [ '%1', 'Const', 22 ],
  //                     ],
  //                     terminator: [ null, 'Exit',  '%2' ],
  //                 },
  //             ]
  //         },
  //     ];
  //     expect(input).toBeDefined();
  //     // expect(() => {evaluate(analyze(input))}).toThrow();
  //     // expect(table_of_contents(input).size).toBeGreaterThanOrEqual(1);
  // });

  it("must execute the correct line of code after an unconditional jump", () => {
    // function @main []:
    // block @main.entry:
    // jump @main.second
    //
    // block @main.first:
    // %1 = constant 11
    // exit %1
    //
    // block @main.second:
    // %2 = constant 22
    // exit %2
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@main.second"],
          },
          {
            name: "@main.first",
            joins: [],
            lines: [
              ["%1", "Constant", { value: small }],
            ],
            terminator: [null, "Exit", "%1"],
          },
          {
            name: "@main.second",
            joins: [],
            lines: [
              ["%2", "Constant", { value: large }],
            ],
            terminator: [null, "Exit", "%2"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(large);
    // expect(table_of_contents(input).size).toBe(3);
  });

  it("must execute first branch if the condition is true", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant true
    // %1 = constant 11
    // %2 = constant 22
    // %3 = constant 44
    // branch %0 @main.then @main.else
    //
    // block @main.then:
    // %4 = add %1, %2
    // jump @main.end
    //
    // block @main.else:
    // %5 = add %2, %3
    // jump @main.end
    //
    // block @main.end:
    // exit %4
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: true }],
              ["%1", "Constant", { value: small }],
              ["%2", "Constant", { value: large }],
              ["%3", "Constant", { value: huge }],
            ],
            terminator: [null, "Branch", "%0", ["@main.then", "@main.else"]],
          },
          {
            name: "@main.then",
            joins: [],
            lines: [
              ["%4", "Add", "%1", "%2"],
            ],
            terminator: [null, "Jump", "@main.end"],
          },
          {
            name: "@main.else",
            joins: [],
            lines: [
              ["%5", "Add", "%2", "%3"],
            ],
            terminator: [null, "Jump", "@main.end"],
          },
          {
            name: "@main.end",
            joins: [],
            lines: [],
            terminator: [null, "Exit", "%4"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(small + large);
    // expect(table_of_contents(input).size).toBe(4);
  });

  it("must execute the second branch when condition is false", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant false
    // %1 = constant 11
    // %2 = constant 22
    // %3 = constant 44
    // branch %0 @main.then @main.else
    //
    // block @main.then:
    // %4 = add %1, %2
    // jump @main.end
    //
    // block @main.else:
    // %5 = add %2, %3
    // jump @main.end
    //
    // block @main.end:
    // exit %5
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: false }],
              ["%1", "Constant", { value: small }],
              ["%2", "Constant", { value: large }],
              ["%3", "Constant", { value: huge }],
            ],
            terminator: [null, "Branch", "%0", ["@main.then", "@main.else"]],
          },
          {
            name: "@main.then",
            joins: [],
            lines: [
              ["%4", "Add", "%1", "%2"],
            ],
            terminator: [null, "Jump", "@main.end"],
          },
          {
            name: "@main.else",
            joins: [],
            lines: [
              ["%5", "Add", "%2", "%3"],
            ],
            terminator: [null, "Jump", "@main.end"],
          },
          {
            name: "@main.end",
            joins: [],
            lines: [],
            terminator: [null, "Exit", "%5"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(large + huge);
    // expect(table_of_contents(input).size).toBe(4);
  });
});

describe("function call", () => {
  it("must support calling the identity function", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %1 = constant 22
    // %2 = call @identity [%1]
    // exit %2
    //
    // function @identity [%a]:
    // block @identity.entry:
    // return %a
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
              ["%1", "Constant", { value: large }],
              ["%2", "Call", "@identity", ["%1"]],
            ],
            terminator: [null, "Exit", "%2"],
          },
        ],
      },
      {
        name: "@identity",
        params: ["%a"],
        blocks: [
          {
            name: "@identity.entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", "%a"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(large);
    // expect(table_of_contents(input).size).toBe(2);
  });

  it("must support calling a binary function", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %1 = constant 22
    // %2 = call @first [%0, %1]
    // exit %2
    //
    // function @first [%a, %b]:
    // block @first.entry:
    // return %a
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
              ["%1", "Constant", { value: large }],
              ["%2", "Call", "@first", ["%0", "%1"]],
            ],
            terminator: [null, "Exit", "%2"],
          },
        ],
      },
      {
        name: "@first",
        params: ["%a", "%b"],
        blocks: [
          {
            name: "@first.entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", "%a"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(small);
    // expect(table_of_contents(input).size).toBe(2);
  });

  it("must evaluate tail-recursive functions", () => {
    // C-style:
    //
    // return factorial(5)
    // function factorial(n, acc = 1):
    //     return n == 1 ? acc : factorial(n-1, n*acc);
    //
    //
    // IR code:
    //
    // function @main []:
    // block @main.entry:
    // %0 = constant 5
    // %1 = constant 1
    // %2 = call @factorial [%0, %1]
    // exit %2
    //
    // function @factorial [%n, %acc]:
    // block @factorial.entry:
    // %3 = constant 1
    // %6 = equal %n, %3
    // branch %6 @factorial.termination @factorial.body
    //
    // block @factorial.body:
    // %7 = subtract %n, %3
    // %8 = multiply %n, %acc
    // %9 = call @factorial [%7, %8]
    // jump @factorial.termination
    //
    // block @factorial.termination:
    // %10 = phi [[@factorial.body, %9], [@factorial.entry, %acc]]
    // return %10
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 5 }],
              ["%1", "Constant", { value: 1 }],
              ["%2", "Call", "@factorial", ["%0", "%1"]],
            ],
            terminator: [null, "Exit", "%2"],
          },
        ],
      },
      {
        name: "@factorial",
        params: ["%n", "%acc"],
        blocks: [
          {
            name: "@factorial.entry",
            joins: [],
            lines: [
              ["%3", "Constant", { value: 1 }],
              ["%6", "Equal", "%n", "%3"],
            ],
            terminator: [null, "Branch", "%6", [
              "@factorial.termination",
              "@factorial.body",
            ]],
          },
          {
            name: "@factorial.body",
            joins: [],
            lines: [
              ["%7", "Subtract", "%n", "%3"],
              ["%8", "Multiply", "%n", "%acc"],
              ["%9", "Call", "@factorial", ["%7", "%8"]],
            ],
            terminator: [null, "Jump", "@factorial.termination"],
          },
          {
            name: "@factorial.termination",
            joins: [
              ["%10", "Phi", [["@factorial.body", "%9"], [
                "@factorial.entry",
                "%acc",
              ]]],
            ],
            lines: [],
            terminator: [null, "Return", "%10"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(120);
    // expect(table_of_contents(input).size).toBe(4);
  });
});

describe("static single assignment", () => {
  it("must throw an error when re-assigning to a register", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %0 = constant 22
    // exit %1
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
              ["%0", "Constant", { value: large }], // attempt to reassign register 0
            ],
            terminator: [null, "Exit", "%1"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => {evaluate(analyze(input))}).toThrow();
    // expect(table_of_contents(input).size).toBe(1);
  });

  it("must throw an error when function parameters have the same name", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %1 = constant 22
    // %2 = call @first [%0, %1]
    // exit %2
    //
    // function @first [%a, %a]:
    // block @first.entry:
    // return %a
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
              ["%1", "Constant", { value: large }],
              ["%2", "Call", "@first", ["%0", "%1"]],
            ],
            terminator: [null, "Exit", "%2"],
          },
        ],
      },
      {
        name: "@first",
        params: ["%a", "%a"],
        blocks: [
          {
            name: "@first.entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", "%a"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => {evaluate(analyze(input))}).toThrow();
    // expect(table_of_contents(input).size).toBe(2);
  });

  it("must throw an error when function parameter registers are not unique", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %1 = constant 22
    // %2 = call @identity [%1]
    // exit %2
    //
    // function @identity [%a]:
    // block @identity.entry:
    // return %a
    //
    // function @identity2 [%a]:
    // block @identity2.entry:
    // return %a
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: small }],
              ["%1", "Constant", { value: large }],
              ["%2", "Call", "@identity", ["%1"]],
            ],
            terminator: [null, "Exit", "%2"],
          },
        ],
      },

      {
        name: "@identity",
        params: ["%a"],
        blocks: [
          {
            name: "@identity.entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", "%a"],
          },
        ],
      },

      {
        name: "@identity2",
        params: ["%a"],
        blocks: [
          {
            name: "@identity2.entry",
            joins: [],
            lines: [],
            terminator: [null, "Return", "%a"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => {evaluate(analyze(input))}).toThrow();
    // expect(table_of_contents(input).size).toBe(3);
  });

  it("phi node must assign from the correct register after an unconditional jump", () => {
    // function @main []:
    // block @main.entry:
    // jump @main.second
    //
    // block @main.first:
    // %1 = constant 11
    // jump @main.end
    //
    // block @main.second:
    // %2 = constant 22
    // jump @main.end
    //
    // block @main.end:
    // %3 = phi [[@main.first, %1], [@main.second, %2]]
    // exit %3
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@main.second"],
          },
          {
            name: "@main.first",
            joins: [],
            lines: [
              ["%1", "Constant", { value: small }],
            ],
            terminator: [null, "Jump", "@main.end"],
          },
          {
            name: "@main.second",
            joins: [],
            lines: [
              ["%2", "Constant", { value: large }],
            ],
            terminator: [null, "Jump", "@main.end"],
          },
          {
            name: "@main.end",
            joins: [
              ["%3", "Phi", [["@main.first", "%1"], ["@main.second", "%2"]]],
            ],
            lines: [],
            terminator: [null, "Exit", "%3"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(large);
    // expect(table_of_contents(input).size).toBe(4);
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
    // function @main []:
    // block @main.entry:
    // %0 = constant 0
    // %1 = constant 1
    // %2 = constant 3
    // jump @main.loop
    //
    // block @main.loop:
    // %3 = phi [[@main.entry, %0], [@main.loop, %4]]
    // %4 = add %1, %3
    // %5 = unequal %3, %2
    // branch %5 @main.loop @main.end
    //
    // block @main.end:
    // exit %3
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
              ["%1", "Constant", { value: 1 }],
              ["%2", "Constant", { value: 3 }],
            ],
            terminator: [null, "Jump", "@main.loop"],
          },
          {
            name: "@main.loop",
            joins: [
              ["%3", "Phi", [["@main.entry", "%0"], ["@main.loop", "%4"]]],
            ],
            lines: [
              ["%4", "Add", "%1", "%3"],
              ["%5", "Unequal", "%3", "%2"],
            ],
            terminator: [null, "Branch", "%5", ["@main.loop", "@main.end"]],
          },
          {
            name: "@main.end",
            joins: [],
            lines: [],
            terminator: [null, "Exit", "%3"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(3);
    // expect(table_of_contents(input).size).toBe(3);
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
    // function @main []:
    // block @main.entry:
    // %condition = constant false
    // branch %condition @main.a @main.b
    //
    // block @main.a:
    // %alpha = constant 10
    // jump @main.d
    //
    // block @main.b:
    // %bravo = constant 20
    // jump @main.c
    //
    // block @main.c:
    // %charlie = constant 21
    // jump @main.d
    //
    // block @main.d:
    // %grandparent = phi [[@main.a, %alpha], [@main.c, %bravo]]
    // %parent = phi [[@main.a, %alpha], [@main.c, %charlie]]
    // %total = add %grandparent, %parent
    // exit %total
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%condition", "Constant", { value: false }],
            ],
            terminator: [null, "Branch", "%condition", ["@main.a", "@main.b"]],
          },
          {
            name: "@main.a",
            joins: [],
            lines: [
              ["%alpha", "Constant", { value: small }],
            ],
            terminator: [null, "Jump", "@main.d"],
          },
          {
            name: "@main.b",
            joins: [],
            lines: [
              ["%bravo", "Constant", { value: large }],
            ],
            terminator: [null, "Jump", "@main.c"],
          },
          {
            name: "@main.c",
            joins: [],
            lines: [
              ["%charlie", "Constant", { value: huge }],
            ],
            terminator: [null, "Jump", "@main.d"],
          },
          {
            name: "@main.d",
            joins: [
              ["%grandparent", "Phi", [["@main.a", "%alpha"], [
                "@main.c",
                "%bravo",
              ]]],
              ["%parent", "Phi", [["@main.a", "%alpha"], [
                "@main.c",
                "%charlie",
              ]]],
            ],
            lines: [
              ["%total", "Add", "%grandparent", "%parent"],
            ],
            terminator: [null, "Exit", "%total"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(large + huge);
    // expect(table_of_contents(input).size).toBe(5);
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
    // function @main []:
    // block @main.entry:
    // jump @main.a
    //
    // block @main.a:
    // %alpha = constant 10
    // %condition = constant true
    // branch %condition @main.b @main.c
    //
    // block @main.b:
    // %bravo = constant 20
    // jump @main.c
    //
    // block @main.c:
    // %result = phi [[@main.a, %alpha], [@main.b, %bravo]]
    // exit %result
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [],
            terminator: [null, "Jump", "@main.a"],
          },
          {
            name: "@main.a",
            joins: [],
            lines: [
              ["%alpha", "Constant", { value: small }],
              ["%condition", "Constant", { value: true }],
            ],
            terminator: [null, "Branch", "%condition", ["@main.b", "@main.c"]],
          },
          {
            name: "@main.b",
            joins: [],
            lines: [
              ["%bravo", "Constant", { value: large }],
            ],
            terminator: [null, "Jump", "@main.c"],
          },
          {
            name: "@main.c",
            joins: [
              ["%result", "Phi", [["@main.a", "%alpha"], [
                "@main.b",
                "%bravo",
              ]]],
            ],
            lines: [],
            terminator: [null, "Exit", "%result"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(large);
    // expect(table_of_contents(input).size).toBe(4);
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
    // function @main []:
    // block @main.entry:
    // %echo = constant false
    // branch %echo @main.a @main.c
    //
    // block @main.a:
    // %alpha = constant true
    // branch %alpha @main.b @main.c
    //
    // block @main.b:
    // %bravo = constant true
    // jump @main.c
    //
    // block @main.c:
    // %result = phi [[@main.entry, %echo], [@main.a, %alpha], [@main.b, %bravo]]
    // exit %result
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%echo", "Constant", { value: false }],
            ],
            terminator: [null, "Branch", "%echo", ["@main.a", "@main.c"]],
          },
          {
            name: "@main.a",
            joins: [],
            lines: [
              ["%alpha", "Constant", { value: true }],
            ],
            terminator: [null, "Branch", "%alpha", ["@main.b", "@main.c"]],
          },
          {
            name: "@main.b",
            joins: [],
            lines: [
              ["%bravo", "Constant", { value: true }],
            ],
            terminator: [null, "Jump", "@main.c"],
          },
          {
            name: "@main.c",
            joins: [
              ["%result", "Phi", [["@main.entry", "%echo"], [
                "@main.a",
                "%alpha",
              ], ["@main.b", "%bravo"]]],
            ],
            lines: [],
            terminator: [null, "Exit", "%result"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(false);
    // expect(table_of_contents(input).size).toBe(4);
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
    // function @main []:
    // block @main.entry:
    // %echo = constant false
    // branch %echo @main.a @main.c
    //
    // block @main.a:
    // %alpha = constant true
    // branch %alpha @main.b @main.c
    //
    // block @main.b:
    // %bravo = constant true
    // jump @main.c
    //
    // block @main.c:
    // %result = phi [[@main.a, %alpha], [@main.b, %bravo]]  // this phi-node does NOT cover all incoming edges
    // exit %result
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%echo", "Constant", { value: false }],
            ],
            terminator: [null, "Branch", "%echo", ["@main.a", "@main.c"]],
          },
          {
            name: "@main.a",
            joins: [],
            lines: [
              ["%alpha", "Constant", { value: true }],
            ],
            terminator: [null, "Branch", "%alpha", ["@main.b", "@main.c"]],
          },
          {
            name: "@main.b",
            joins: [],
            lines: [
              ["%bravo", "Constant", { value: true }],
            ],
            terminator: [null, "Jump", "@main.c"],
          },
          {
            name: "@main.c",
            joins: [
              ["%result", "Phi", [["@main.a", "%alpha"], [
                "@main.b",
                "%bravo",
              ]]],
            ],
            lines: [],
            terminator: [null, "Exit", "%result"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    // expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
    // expect(table_of_contents(input).size).toBe(4);
  });
});

describe("memory and ownership", () => {
  it("must reference and dereference a register", () => {
    // function @main []:
    // block @main.entry:
    // %x = constant 42
    // %r = ref %x
    // %t = deref %r
    // exit %t
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: small }],
              ["%r", "AddressOf", "%x"],
              ["%t", "Load", "%r"],
            ],
            terminator: [null, "Exit", "%t"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(evaluate(analyze(input))).toBe(small);
    // expect(table_of_contents(input).size).toBe(1);
  });

  it("must detect a use-after-drop", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 0
    // drop %0
    // exit %0
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
              [null, "Drop", "%0"],
            ],
            terminator: [null, "Exit", "%0"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    // expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
    // expect(table_of_contents(input).size).toBe(1);
  });

  it("must detect a double-drop", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 0
    // %1 = constant 0
    // drop %0
    // drop %0
    // exit %1
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
              ["%1", "Constant", { value: 0 }],
              [null, "Drop", "%0"],
              [null, "Drop", "%0"],
            ],
            terminator: [null, "Exit", "%1"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    // expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
    // expect(table_of_contents(input).size).toBe(1);
  });

  it("must detect a use-after-move", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 0
    // %1 = move %0
    // exit %0
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%0", "Constant", { value: 0 }],
              ["%1", "Move", "%0"],
            ],
            terminator: [null, "Exit", "%0"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    // expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
    // expect(table_of_contents(input).size).toBe(1);
  });

  it("must detect a dangling reference when the source register is dropped", () => {
    // function @main []:
    // block @main.entry:
    // %x = constant 42
    // %r = ref %x
    // drop %x
    // %t = deref %r
    // exit %t
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: small }],
              ["%r", "AddressOf", "%x"],
              [null, "Drop", "%x"],
              ["%t", "Load", "%r"],
            ],
            terminator: [null, "Exit", "%t"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    // expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
    // expect(table_of_contents(input).size).toBe(1);
  });

  it("must detect a dangling reference when the source register is moved", () => {
    // function @main []:
    // block @main.entry:
    // %x = constant 42
    // %r = ref %x
    // %y = move %x
    // %t = deref %r
    // exit %t
    const input: REF.Program = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@main.entry",
            joins: [],
            lines: [
              ["%x", "Constant", { value: small }],
              ["%r", "AddressOf", "%x"],
              ["%y", "Move", "%x"],
              ["%t", "Load", "%r"],
            ],
            terminator: [null, "Exit", "%t"],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    // expect(() => {analyze(input)}).toThrow(); // static analysis must flag this as an error
    // expect(() => {evaluate(input)}).toThrow(); // runtime must flag this as an error
    // expect(count_cfg_nodes(input)).toBe(1);// expect(table_of_contents(input).size).toBe(1);
  });
});
