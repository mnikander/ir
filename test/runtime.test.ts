import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as LIR from "../src/low/low_grammar.ts";
import { evaluate } from "../src/runtime/machine.ts";

// choose prime numbers for tests, to reduce chances of false-positive results for arithmetic ops
const small: number = 11;
const large: number = 13;
const huge: number = 281;

describe("constants and exit", () => {
  it.skip("must throw error on empty input", () => {
    // (empty program)
    const input: LIR.Program = [];
    expect(() => evaluate(input)).toThrow();
  });

  it.skip("must throw error if there is no Exit instruction", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
    ];
    expect(() => evaluate(input)).toThrow();
  });

  it.skip("must throw error if there is no Entry block", () => {
    // function @main []:
    // (missing block @main.entry)
    // %0 = constant 11
    // exit %0

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [0, "Constant", small],
      [null, "Return", 0],
    ];
    expect(() => evaluate(input)).toThrow();
    // TODO: it would be nice if I could enforce 'CFG.length === 0' here
  });

  it.skip("must throw a runtime-error when exiting with a Pointer instead of a Value", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 0
    // %1 = ref %0
    // exit %1

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "AddressOf", 0],
      [null, "Return", 1],
    ];
    expect(() => {
      evaluate(input);
    }).toThrow();
  });

  it("must evaluate a constant", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // exit %0

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [null, "Return", 0],
    ];
    expect(evaluate(input)).toBe(small);
  });
});

describe("copying of registers", () => {
  it("must copy a constant", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %1 = copy %0
    // exit %1

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Copy", 0],
      [null, "Return", 1],
    ];
    expect(evaluate(input)).toBe(small);
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

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "Add", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(small + large);
  });

  it("must evaluate integer subtraction", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", large],
      [1, "Constant", small],
      [2, "Subtract", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(large - small);
  });

  it("must evaluate integer multiplication", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "Multiply", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(small * large);
  });

  it("must evaluate integer division", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small * large],
      [1, "Constant", large],
      [2, "Divide", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must evaluate integer remainder", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", large],
      [1, "Constant", small],
      [2, "Remainder", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(large % small);
  });

  it("must evaluate minimum", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "Minimum", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must evaluate maximum", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "Maximum", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(large);
  });

  it("must evaluate negation", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Negate", 0],
      [null, "Return", 1],
    ];
    expect(evaluate(input)).toBe(-small);
  });
});

describe("comparison operations", () => {
  it("must evaluate small==small as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", small],
      [2, "Equal", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small==large as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "Equal", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small!=large as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "Unequal", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small!=small as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", small],
      [2, "Unequal", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small<large as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "Less", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate 22<large as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", small],
      [2, "Less", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate 22<small as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", large],
      [1, "Constant", small],
      [2, "Less", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small<=large as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "LessEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small<=small as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", small],
      [2, "LessEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate 22<=small as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", large],
      [1, "Constant", small],
      [2, "LessEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate 22>small as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", large],
      [1, "Constant", small],
      [2, "Greater", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small>small as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", small],
      [2, "Greater", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small>large as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "Greater", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate 22>=small as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", large],
      [1, "Constant", small],
      [2, "GreaterEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small>=small as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", small],
      [2, "GreaterEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small>=small as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "GreaterEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });
});

describe("labels, jump, and branch", () => {
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

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [null, "Jump", { line: 6 }],

      [null, "Noop", "@main.first"],
      [1, "Constant", small],
      [null, "Return", 1],

      [null, "Noop", "@main.second"],
      [2, "Constant", large],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(large);
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

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", 1], // true
      [1, "Constant", small],
      [2, "Constant", large],
      [3, "Constant", huge],
      [null, "Branch", 0, [{ line: 7 }, { line: 10 }]],
      [null, "Noop", "@main.then"],
      [4, "Add", 1, 2],
      [null, "Jump", { line: 13 }],
      [null, "Noop", "@main.else"],
      [4, "Add", 2, 3],
      [null, "Jump", { line: 13 }],
      [null, "Noop", "@main.end"],
      [null, "Return", 4],
    ];
    expect(evaluate(input)).toBe(small + large);
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

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", 0], // false
      [1, "Constant", small],
      [2, "Constant", large],
      [3, "Constant", huge],
      [null, "Branch", 0, [{ line: 7 }, { line: 10 }]],
      [null, "Noop", "@main.then"],
      [4, "Add", 1, 2],
      [null, "Jump", { line: 13 }],
      [null, "Noop", "@main.else"],
      [4, "Add", 2, 3],
      [null, "Jump", { line: 13 }],
      [null, "Noop", "@main.end"],
      [null, "Return", 4],
    ];
    expect(evaluate(input)).toBe(large + huge);
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

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small], // @main.entry
      [1, "Constant", large],
      [2, "Call", { line: 6 }, [1], "@identity"],
      [null, "Return", 2],
      [null, "Noop", "fun @identity [%a, %b]"],
      [null, "Noop", "@identity.entry"],
      [null, "Return", 0],
    ];
    expect(evaluate(input)).toBe(large);
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

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", small],
      [1, "Constant", large],
      [2, "Call", { line: 6 }, [0, 1], "@first"],
      [null, "Return", 2],
      [null, "Noop", "fun @first [%a, %b]"],
      [null, "Noop", "@first.entry"],
      [null, "Return", 0],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it.skip("must evaluate tail-recursive functions", () => {
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

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", 5], // main
      [1, "Constant", 1],
      [2, "Call", { line: 6 }, [0, 1], "@factorial"],
      [null, "Return", 2],

      [null, "Noop", "fun @factorial [%n, %acc]"],
      [null, "Noop", "@factorial.entry"],
      [2, "Constant", 1],
      [3, "Equal", 0, 2],
      [7, "Copy", 1],
      [null, "Branch", 3, [{ line: 18 }, { line: 12 }]],

      [null, "Noop", "@factorial.body"],
      [4, "Subtract", 0, 2],
      [5, "Multiply", 0, 1],
      [6, "Call", { line: 6 }, [4, 5], "@factorial"],
      [7, "Copy", 6],
      [null, "Jump", { line: 18 }],

      [null, "Noop", "@factorial.termination"],
      [null, "Return", 7],
    ];
    expect(evaluate(input)).toBe(120);
  });
});

// describe("static single assignment", () => {
//   it("must throw an error when re-assigning to a register", () => {
//     // function @main []:
//     // block @main.entry:
//     // %0 = constant 11
//     // %0 = constant 22
//     // exit %1

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       [0, "Constant", small],
//       [0, "Constant", large], // attempt to reassign register 0
//       [null, "Exit", 1],
//     ];
//     expect(() => {
//       evaluate(input);
//     }).toThrow();
//   });

//   it("must throw an error when function parameters have the same name", () => {
//     // function @main []:
//     // block @main.entry:
//     // %0 = constant 11
//     // %1 = constant 22
//     // %2 = call @first [%0, %1]
//     // exit %2
//     //
//     // function @first [%a, %a]:
//     // block @first.entry:
//     // return %a

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       [0, "Constant", small],
//       [1, "Constant", large],
//       [2, "Call", "@first", [0, 1]],
//       [null, "Exit", 2],

//       [null, "Function", "@first", ["%a", "%a"]],
//       [null, "Block", "@first.entry"],
//       [null, "Return", "%a"],
//     ];
//     expect(() => {
//       evaluate(input);
//     }).toThrow();
//   });

//   it("must throw an error when function parameter registers are not unique", () => {
//     // function @main []:
//     // block @main.entry:
//     // %0 = constant 11
//     // %1 = constant 22
//     // %2 = call @identity [%1]
//     // exit %2
//     //
//     // function @identity [%a]:
//     // block @identity.entry:
//     // return %a
//     //
//     // function @identity2 [%a]:
//     // block @identity2.entry:
//     // return %a

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       [0, "Constant", small],
//       [1, "Constant", large],
//       [2, "Call", "@identity", [1]],
//       [null, "Exit", 2],

//       [null, "Function", "@identity", ["%a"]],
//       [null, "Block", "@identity.entry"],
//       [null, "Return", "%a"],

//       [null, "Function", "@identity2", ["%a"]],
//       [null, "Block", "@identity2.entry"],
//       [null, "Return", "%a"],
//     ];
//     expect(() => {
//       evaluate(input);
//     }).toThrow();
//   });

//   it("phi node must assign from the correct register after an unconditional jump", () => {
//     // function @main []:
//     // block @main.entry:
//     // jump @main.second
//     //
//     // block @main.first:
//     // %1 = constant 11
//     // jump @main.end
//     //
//     // block @main.second:
//     // %2 = constant 22
//     // jump @main.end
//     //
//     // block @main.end:
//     // %3 = phi [[@main.first, %1], [@main.second, %2]]
//     // exit %3

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       [null, "Jump", "@main.second"],

//       [null, "Block", "@main.first"],
//       [1, "Constant", small],
//       [null, "Jump", "@main.end"],

//       [null, "Block", "@main.second"],
//       [2, "Constant", large],
//       [null, "Jump", "@main.end"],

//       [null, "Block", "@main.end"],
//       [3, "Phi", [["@main.first", 1], ["@main.second", 2]]],
//       [null, "Exit", 3],
//     ];
//     expect(evaluate(input)).toBe(large);
//   });

//   it("phi node must assign from the correct register when executing a loop", () => {
//     // C-style:
//     //
//     // int i = 0;
//     // while (i != 3) {
//     //     i++;
//     // }
//     // return i;
//     //
//     //
//     // IR-code:
//     //
//     // function @main []:
//     // block @main.entry:
//     // %0 = constant 0
//     // %1 = constant 1
//     // %2 = constant 3
//     // jump @main.loop
//     //
//     // block @main.loop:
//     // %3 = phi [[@main.entry, %0], [@main.loop, %4]]
//     // %4 = add %1, %3
//     // %5 = unequal %3, %2
//     // branch %5 @main.loop @main.end
//     //
//     // block @main.end:
//     // exit %3

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       [0, "Constant", 0],
//       [1, "Constant", 1],
//       [2, "Constant", 3],
//       [null, "Jump", "@main.loop"],

//       [null, "Block", "@main.loop"],
//       [3, "Phi", [["@main.entry", 0], ["@main.loop", 4]]],
//       [4, "Add", 1, 3],
//       [5, "Unequal", 3, 2],
//       [null, "Branch", 5, ["@main.loop", "@main.end"]],

//       [null, "Block", "@main.end"],
//       [null, "Exit", 3],
//     ];
//     expect(evaluate(input)).toBe(3);
//   });

//   it("phi node must allow assignment from dominator blocks which are not the immediate dominator", () => {
//     // Control flow graph with a split in the Entry node and a Join in node D
//     //
//     //      Entry
//     //      /   \
//     //     A     B
//     //      \    |
//     //       \   C
//     //        \ /
//     //         D
//     //
//     //
//     // function @main []:
//     // block @main.entry:
//     // %condition = constant false
//     // branch %condition @main.a @main.b
//     //
//     // block @main.a:
//     // %alpha = constant 10
//     // jump @main.d
//     //
//     // block @main.b:
//     // %bravo = constant 20
//     // jump @main.c
//     //
//     // block @main.c:
//     // %charlie = constant 21
//     // jump @main.d
//     //
//     // block @main.d:
//     // %grandparent = phi [[@main.a, %alpha], [@main.c, %bravo]]
//     // %parent = phi [[@main.a, %alpha], [@main.c, %charlie]]
//     // %total = add %grandparent, %parent
//     // exit %total

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       ["%condition", "Constant", false],
//       [null, "Branch", "%condition", ["@main.a", "@main.b"]],

//       [null, "Block", "@main.a"],
//       ["%alpha", "Constant", 10],
//       [null, "Jump", "@main.d"],

//       [null, "Block", "@main.b"],
//       ["%bravo", "Constant", 20],
//       [null, "Jump", "@main.c"],

//       [null, "Block", "@main.c"],
//       ["%charlie", "Constant", 21],
//       [null, "Jump", "@main.d"],

//       [null, "Block", "@main.d"],
//       ["%grandparent", "Phi", [["@main.a", "%alpha"], ["@main.c", "%bravo"]]],
//       ["%parent", "Phi", [["@main.a", "%alpha"], ["@main.c", "%charlie"]]],
//       ["%total", "Add", "%grandparent", "%parent"],
//       [null, "Exit", "%total"],
//     ];
//     expect(evaluate(input)).toBe(41);
//   });

//   it("phi node must allow assignment when both inputs are available", () => {
//     //
//     //      Entry
//     //        |
//     //        A
//     //      / |
//     //     B  |
//     //      \ |
//     //        C
//     //
//     //
//     // function @main []:
//     // block @main.entry:
//     // jump @main.a
//     //
//     // block @main.a:
//     // %alpha = constant 10
//     // %condition = constant true
//     // branch %condition @main.b @main.c
//     //
//     // block @main.b:
//     // %bravo = constant 20
//     // jump @main.c
//     //
//     // block @main.c:
//     // %result = phi [[@main.a, %alpha], [@main.b, %bravo]]
//     // exit %result

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       [null, "Jump", "@main.a"],

//       [null, "Block", "@main.a"],
//       ["%alpha", "Constant", 10],
//       ["%condition", "Constant", true],
//       [null, "Branch", "%condition", ["@main.b", "@main.c"]],

//       [null, "Block", "@main.b"],
//       ["%bravo", "Constant", 20],
//       [null, "Jump", "@main.c"],

//       [null, "Block", "@main.c"],
//       ["%result", "Phi", [["@main.a", "%alpha"], ["@main.b", "%bravo"]]],
//       [null, "Exit", "%result"],
//     ];
//     expect(evaluate(input)).toBe(20);
//   });

//   it("must allow assignment when three inputs are available", () => {
//     //
//     //        Entry
//     //        |   |
//     //        A   |
//     //      / |   |
//     //     B  |  /
//     //      \ | /
//     //        C
//     //
//     //
//     // function @main []:
//     // block @main.entry:
//     // %echo = constant false
//     // branch %echo @main.a @main.c
//     //
//     // block @main.a:
//     // %alpha = constant true
//     // branch %alpha @main.b @main.c
//     //
//     // block @main.b:
//     // %bravo = constant true
//     // jump @main.c
//     //
//     // block @main.c:
//     // %result = phi [[@main.entry, %echo], [@main.a, %alpha], [@main.b, %bravo]]
//     // exit %result

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       ["%echo", "Constant", false],
//       [null, "Branch", "%echo", ["@main.a", "@main.c"]],

//       [null, "Block", "@main.a"],
//       ["%alpha", "Constant", true],
//       [null, "Branch", "%alpha", ["@main.b", "@main.c"]],

//       [null, "Block", "@main.b"],
//       ["%bravo", "Constant", true],
//       [null, "Jump", "@main.c"],

//       [null, "Block", "@main.c"],
//       ["%result", "Phi", [["@main.entry", "%echo"], ["@main.a", "%alpha"], [
//         "@main.b",
//         "%bravo",
//       ]]],
//       [null, "Exit", "%result"],
//     ];
//     expect(evaluate(input)).toBe(false);
//   });

//   it("must throw an error when a phi node is non-exhaustive", () => {
//     //
//     //        Entry
//     //        |   |
//     //        A   |
//     //      / |   |
//     //     B  |  /
//     //      \ | /
//     //        C
//     //
//     //
//     // function @main []:
//     // block @main.entry:
//     // %echo = constant false
//     // branch %echo @main.a @main.c
//     //
//     // block @main.a:
//     // %alpha = constant true
//     // branch %alpha @main.b @main.c
//     //
//     // block @main.b:
//     // %bravo = constant true
//     // jump @main.c
//     //
//     // block @main.c:
//     // %result = phi [[@main.a, %alpha], [@main.b, %bravo]]  // this phi-node does NOT cover all incoming edges
//     // exit %result

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       ["%echo", "Constant", false],
//       [null, "Branch", "%echo", ["@main.a", "@main.c"]],

//       [null, "Block", "@main.a"],
//       ["%alpha", "Constant", true],
//       [null, "Branch", "%alpha", ["@main.b", "@main.c"]],

//       [null, "Block", "@main.b"],
//       ["%bravo", "Constant", true],
//       [null, "Jump", "@main.c"],

//       [null, "Block", "@main.c"],
//       ["%result", "Phi", [["@main.a", "%alpha"], ["@main.b", "%bravo"]]],
//       [null, "Exit", "%result"],
//     ];
//     expect(() => {
//       evaluate(input);
//     }).toThrow(); // runtime must flag this as an error
//   });
// });

// describe("memory and ownership", () => {
//   it("must reference and dereference a register", () => {
//     // function @main []:
//     // block @main.entry:
//     // %x = constant 42
//     // %r = ref %x
//     // %t = deref %r
//     // exit %t

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       ["%x", "Constant", 42],
//       ["%r", "Ref", "%x"],
//       ["%t", "Deref", "%r"],
//       [null, "Exit", "%t"],
//     ];
//     expect(evaluate(input)).toBe(42);
//   });

//   it("must detect a use-after-drop", () => {
//     // function @main []:
//     // block @main.entry:
//     // %0 = constant 0
//     // drop %0
//     // exit %0

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       [0, "Constant", 0],
//       [null, "Drop", 0],
//       [null, "Exit", 0],
//     ];
//     expect(() => {
//       evaluate(input);
//     }).toThrow(); // runtime must flag this as an error
//   });

//   it("must detect a double-drop", () => {
//     // function @main []:
//     // block @main.entry:
//     // %0 = constant 0
//     // %1 = constant 0
//     // drop %0
//     // drop %0
//     // exit %1

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       [0, "Constant", 0],
//       [1, "Constant", 0],
//       [null, "Drop", 0],
//       [null, "Drop", 0],
//       [null, "Exit", 1],
//     ];
//     expect(() => {
//       evaluate(input);
//     }).toThrow(); // runtime must flag this as an error
//   });

//   it("must detect a use-after-move", () => {
//     // function @main []:
//     // block @main.entry:
//     // %0 = constant 0
//     // %1 = move %0
//     // exit %0

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       [0, "Constant", 0],
//       [1, "Move", 0],
//       [null, "Exit", 0],
//     ];
//     expect(() => {
//       evaluate(input);
//     }).toThrow(); // runtime must flag this as an error
//   });

//   it("must detect a dangling reference when the source register is dropped", () => {
//     // function @main []:
//     // block @main.entry:
//     // %x = constant 42
//     // %r = ref %x
//     // drop %x
//     // %t = deref %r
//     // exit %t

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       ["%x", "Constant", 42],
//       ["%r", "Ref", "%x"],
//       [null, "Drop", "%x"],
//       ["%t", "Deref", "%r"],
//       [null, "Exit", "%t"],
//     ];
//     expect(() => {
//       evaluate(input);
//     }).toThrow(); // runtime must flag this as an error
//   });

//   it("must detect a dangling reference when the source register is moved", () => {
//     // function @main []:
//     // block @main.entry:
//     // %x = constant 42
//     // %r = ref %x
//     // %y = move %x
//     // %t = deref %r
//     // exit %t

//     const input: LIR.Program = [
//       [null, "Function", "@main", []],
//       [null, "Block", "@main.entry"],
//       ["%x", "Constant", 42],
//       ["%r", "Ref", "%x"],
//       ["%y", "Move", "%x"],
//       ["%t", "Deref", "%r"],
//       [null, "Exit", "%t"],
//     ];
//     expect(() => {
//       evaluate(input);
//     }).toThrow(); // runtime must flag this as an error
//   });
// });
