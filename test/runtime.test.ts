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
      [0, "Constant", { value: small }],
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
      [0, "Constant", { value: small }],
      [null, "Return", 0],
    ];
    expect(() => evaluate(input)).toThrow();
    // TODO: it would be nice if I could enforce 'CFG.length === 0' here
  });

  it("must throw a runtime-error when exiting with a Pointer instead of a Value", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 0
    // %1 = ref %0
    // exit %1

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "AddressOf", 0],
      [null, "Return", 1],
    ];
    expect(() => {
      evaluate(input);
    }).toThrow();
  });
});

describe("memory operations", () => {
  it("must evaluate a constant", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // exit %0

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [null, "Return", 0],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must throw when the destination of Constant is Dead", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Drop"],
      [0, "Constant", { value: small }], // error
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must copy a constant", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %1 = copy %0
    // exit %1

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Copy", 0],
      [null, "Return", 1],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must throw when Copy is given a Dead source", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Drop"],
      [1, "Copy", 0], // error
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when Copy is given a Dead destination", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Drop"],
      [1, "Copy", 0], // error
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must load a value through an address produced by AddressOf", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %1 = address_of %0
    // %2 = load %1
    // exit %2

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "AddressOf", 0],
      [2, "Load", 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must store through an address produced by AddressOf", () => {
    // function @main []:
    // block @main.entry:
    // %0 = constant 11
    // %1 = constant 13
    // %2 = address_of %0
    // store %2, %1
    // exit %0

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "AddressOf", 0],
      [2, "Store", 1],
      [null, "Return", 0],
    ];
    expect(evaluate(input)).toBe(large);
  });

  it("must throw when Load is given a non-pointer source", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Load", 0],
      [null, "Return", 1],
    ];
    expect(() => evaluate(input)).toThrow(/Expected a Pointer/);
  });

  it("must throw when Store is given a non-pointer destination", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [0, "Store", 1],
      [null, "Return", 1],
    ];
    expect(() => evaluate(input)).toThrow(/Expected a Pointer/);
  });

  it("must throw when Load is given a dangling pointer source", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "AddressOf", 0],
      [0, "Constant", { value: large }], // over-write the original value and invalidate pointer
      [2, "Load", 1],
      [null, "Return", 2],
    ];
    expect(() => evaluate(input)).toThrow(/dangling pointer/);
  });

  it("must throw when Load is given a Dead source", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Drop"],
      [1, "Load", 0],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when Load is given a Dead destination", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "AddressOf", 0],
      [2, "Drop"],
      [2, "Load", 1],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when Store is given a dangling pointer destination", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "AddressOf", 1],
      [1, "Constant", { value: huge }], // over-write the original value and invalidate pointer
      [2, "Store", 0],
      [null, "Return", 1],
    ];
    expect(() => evaluate(input)).toThrow(/dangling pointer/);
  });

  it("must throw when Store is given a Dead source", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Drop"],
      [1, "Store", 0],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when Store is given a Dead destination", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Drop"],
      [1, "Store", 0],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when AddressOf is given a Dead source", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Drop"],
      [1, "AddressOf", 0],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when AddressOf is given a Dead destination", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Drop"],
      [1, "AddressOf", 0],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
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
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Add", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(small + large);
  });

  it("must evaluate integer subtraction", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: large }],
      [1, "Constant", { value: small }],
      [2, "Subtract", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(large - small);
  });

  it("must evaluate integer multiplication", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Multiply", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(small * large);
  });

  it("must evaluate integer division", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small * large }],
      [1, "Constant", { value: large }],
      [2, "Divide", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must evaluate integer remainder", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: large }],
      [1, "Constant", { value: small }],
      [2, "Remainder", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(large % small);
  });

  it("must evaluate minimum", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Minimum", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must evaluate maximum", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Maximum", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(large);
  });

  it("must evaluate negation", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Negate", 0],
      [null, "Return", 1],
    ];
    expect(evaluate(input)).toBe(-small);
  });

  it("must throw when Negate is given a Dead source", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Drop"],
      [1, "Negate", 0], // error
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when Negate is given a Dead destination", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Drop"],
      [1, "Negate", 0], // error
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when an arithmetic operation is given a Dead right argument", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Drop"],
      [1, "Constant", { value: small }],
      [2, "Add", 0, 1],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when an arithmetic operation is given a Dead left argument", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Drop"],
      [2, "Add", 0, 1],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when an arithmetic operation is given a Dead destination", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Drop"],
      [2, "Add", 0, 1],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });
});

describe("comparison operations", () => {
  it("must evaluate small==small as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: small }],
      [2, "Equal", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small==large as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Equal", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small!=large as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Unequal", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small!=small as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: small }],
      [2, "Unequal", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small<large as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Less", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate large<large as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: small }],
      [2, "Less", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate large<small as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: large }],
      [1, "Constant", { value: small }],
      [2, "Less", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small<=large as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "LessEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small<=small as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: small }],
      [2, "LessEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate large<=small as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: large }],
      [1, "Constant", { value: small }],
      [2, "LessEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate large>small as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: large }],
      [1, "Constant", { value: small }],
      [2, "Greater", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small>small as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: small }],
      [2, "Greater", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small>large as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Greater", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate large>=small as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: large }],
      [1, "Constant", { value: small }],
      [2, "GreaterEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small>=small as true", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: small }],
      [2, "GreaterEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small>=small as false", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "GreaterEqual", 0, 1],
      [null, "Return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must throw when a comparison operation is given a Dead right argument", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Drop"],
      [1, "Constant", { value: small }],
      [2, "Equal", 0, 1],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when a comparison operation is given a Dead left argument", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Drop"],
      [2, "Equal", 0, 1],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when a comparison operation is given a Dead destination", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Drop"],
      [2, "Equal", 0, 1],
      [42, "Constant", { value: huge }],
      [null, "Return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });
});

describe("control flow operations", () => {
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
      [1, "Constant", { value: small }],
      [null, "Return", 1],

      [null, "Noop", "@main.second"],
      [2, "Constant", { value: large }],
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
      [0, "Constant", { value: 1 }], // true
      [1, "Constant", { value: small }],
      [2, "Constant", { value: large }],
      [3, "Constant", { value: huge }],
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
      [0, "Constant", { value: 0 }], // false
      [1, "Constant", { value: small }],
      [2, "Constant", { value: large }],
      [3, "Constant", { value: huge }],
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
      [0, "Constant", { value: small }], // @main.entry
      [1, "Constant", { value: large }],
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
      [0, "Constant", { value: small }],
      [1, "Constant", { value: large }],
      [2, "Call", { line: 6 }, [0, 1], "@first"],
      [null, "Return", 2],
      [null, "Noop", "fun @first [%a, %b]"],
      [null, "Noop", "@first.entry"],
      [null, "Return", 0],
    ];
    expect(evaluate(input)).toBe(small);
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

    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Constant", { value: 5 }], // main
      [1, "Constant", { value: 1 }],
      [2, "Call", { line: 6 }, [0, 1], "@factorial"],
      [null, "Return", 2],

      [null, "Noop", "fun @factorial [%n, %acc]"],
      [null, "Noop", "@factorial.entry"],
      [2, "Constant", { value: 1 }],
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

  it("must throw when Return is given a Dead argument", () => {
    const input: LIR.Program = [
      [null, "Noop", "fun @main []"],
      [null, "Noop", "@main.entry"],
      [0, "Drop"],
      [null, "Return", 0],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });
});
