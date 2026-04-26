import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as LOW from "../src/low/low_grammar.ts";
import { evaluate } from "../src/runtime/machine.ts";

// choose prime numbers for tests, to reduce chances of false-positive results for arithmetic ops
const small: number = 11;
const large: number = 13;
const huge: number = 281;

describe("constants and exit", () => {
  it.skip("must throw error on empty input", () => {
    // (empty program)
    const input: LOW.Program = [];
    expect(() => evaluate(input)).toThrow();
  });

  it.skip("must throw error if there is no Exit instruction", () => {
    // function @main []:
    // block @entry
    // %0 = constant 11

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
    ];
    expect(() => evaluate(input)).toThrow();
  });

  it.skip("must throw error if there is no Entry block", () => {
    // function @main []:
    // (missing block @entry)
    // %0 = constant 11
    // exit %0

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [0, "constant", { value: small }],
      [null, "return", 0],
    ];
    expect(() => evaluate(input)).toThrow();
  });

  it("must throw a runtime-error when exiting with a Pointer instead of a Value", () => {
    // function @main []:
    // block @entry
    // %0 = constant 0
    // %1 = address_of %0
    // exit %1

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "address_of", 0],
      [null, "return", 1],
    ];
    expect(() => {
      evaluate(input);
    }).toThrow();
  });
});

describe("memory operations", () => {
  it("must evaluate a constant", () => {
    // function @main []:
    // block @entry
    // %0 = constant 11
    // exit %0

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [null, "return", 0],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must throw when the destination of Constant is Dead", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "drop"],
      [0, "constant", { value: small }], // error
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must copy a constant", () => {
    // function @main []:
    // block @entry
    // %0 = constant 11
    // %1 = copy %0
    // exit %1

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "copy", 0],
      [null, "return", 1],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must throw when Copy is given a Dead source", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "drop"],
      [1, "copy", 0], // error
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when Copy is given a Dead destination", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "drop"],
      [1, "copy", 0], // error
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must load a value through an address produced by AddressOf", () => {
    // function @main []:
    // block @entry
    // %0 = constant 11
    // %1 = address_of %0
    // %2 = load %1
    // exit %2

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "address_of", 0],
      [2, "load", 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must store through an address produced by AddressOf", () => {
    // function @main []:
    // block @entry
    // %0 = constant 11
    // %1 = constant 13
    // %2 = address_of %0
    // store %2, %1
    // exit %0

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "address_of", 0],
      [2, "store", 1],
      [null, "return", 0],
    ];
    expect(evaluate(input)).toBe(large);
  });

  it("must throw when Load is given a non-pointer source", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "load", 0],
      [null, "return", 1],
    ];
    expect(() => evaluate(input)).toThrow(/Expected a Pointer/);
  });

  it("must throw when Store is given a non-pointer destination", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [0, "store", 1],
      [null, "return", 1],
    ];
    expect(() => evaluate(input)).toThrow(/Expected a Pointer/);
  });

  it("must throw when Load is given a dangling pointer source", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "address_of", 0],
      [0, "constant", { value: large }], // over-write the original value and invalidate pointer
      [2, "load", 1],
      [null, "return", 2],
    ];
    expect(() => evaluate(input)).toThrow(/dangling pointer/);
  });

  it("must throw when Load is given a Dead source", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "drop"],
      [1, "load", 0],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when Load is given a Dead destination", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "address_of", 0],
      [2, "drop"],
      [2, "load", 1],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when Store is given a dangling pointer destination", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "address_of", 1],
      [1, "constant", { value: huge }], // over-write the original value and invalidate pointer
      [2, "store", 0],
      [null, "return", 1],
    ];
    expect(() => evaluate(input)).toThrow(/dangling pointer/);
  });

  it("must throw when Store is given a Dead source", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "drop"],
      [1, "store", 0],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when Store is given a Dead destination", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "drop"],
      [1, "store", 0],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when AddressOf is given a Dead source", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "drop"],
      [1, "address_of", 0],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when AddressOf is given a Dead destination", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "drop"],
      [1, "address_of", 0],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });
});

describe("arithmetic operations", () => {
  it("must evaluate integer addition", () => {
    // function @main []:
    // block @entry
    // %0 = constant 11
    // %1 = constant 22
    // %2 = add %0, %1
    // exit %2

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "add", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(small + large);
  });

  it("must evaluate integer subtraction", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: large }],
      [1, "constant", { value: small }],
      [2, "subtract", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(large - small);
  });

  it("must evaluate integer multiplication", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "multiply", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(small * large);
  });

  it("must evaluate integer division", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small * large }],
      [1, "constant", { value: large }],
      [2, "divide", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must evaluate integer remainder", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: large }],
      [1, "constant", { value: small }],
      [2, "remainder", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(large % small);
  });

  it("must evaluate minimum", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "minimum", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(small);
  });

  it("must evaluate maximum", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "maximum", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(large);
  });

  it("must evaluate negation", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "negate", 0],
      [null, "return", 1],
    ];
    expect(evaluate(input)).toBe(-small);
  });

  it("must throw when Negate is given a Dead source", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "drop"],
      [1, "negate", 0], // error
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when Negate is given a Dead destination", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "drop"],
      [1, "negate", 0], // error
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when an arithmetic operation is given a Dead right argument", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "drop"],
      [1, "constant", { value: small }],
      [2, "add", 0, 1],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when an arithmetic operation is given a Dead left argument", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "drop"],
      [2, "add", 0, 1],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when an arithmetic operation is given a Dead destination", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "drop"],
      [2, "add", 0, 1],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });
});

describe("comparison operations", () => {
  it("must evaluate small==small as true", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: small }],
      [2, "equal", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small==large as false", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "equal", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small!=large as true", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "unequal", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small!=small as false", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: small }],
      [2, "unequal", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small<large as true", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "less", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate large<large as false", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: small }],
      [2, "less", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate large<small as false", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: large }],
      [1, "constant", { value: small }],
      [2, "less", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small<=large as true", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "less_equal", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small<=small as true", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: small }],
      [2, "less_equal", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate large<=small as false", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: large }],
      [1, "constant", { value: small }],
      [2, "less_equal", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate large>small as true", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: large }],
      [1, "constant", { value: small }],
      [2, "greater", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small>small as false", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: small }],
      [2, "greater", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate small>large as false", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "greater", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must evaluate large>=small as true", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: large }],
      [1, "constant", { value: small }],
      [2, "greater_equal", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small>=small as true", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: small }],
      [2, "greater_equal", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(1);
  });

  it("must evaluate small>=small as false", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "greater_equal", 0, 1],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(0);
  });

  it("must throw when a comparison operation is given a Dead right argument", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "drop"],
      [1, "constant", { value: small }],
      [2, "equal", 0, 1],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when a comparison operation is given a Dead left argument", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "drop"],
      [2, "equal", 0, 1],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });

  it("must throw when a comparison operation is given a Dead destination", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "drop"],
      [2, "equal", 0, 1],
      [42, "constant", { value: huge }],
      [null, "return", 42],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });
});

describe("control flow operations", () => {
  it("must execute the correct line of code after an unconditional jump", () => {
    // function @main []:
    // block @entry
    // jump @second
    //
    // block @first
    // %1 = constant 11
    // exit %1
    //
    // block @second
    // %2 = constant 22
    // exit %2

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [null, "jump", { line: 6 }],

      [null, "noop", "@first"],
      [1, "constant", { value: small }],
      [null, "return", 1],

      [null, "noop", "@second"],
      [2, "constant", { value: large }],
      [null, "return", 2],
    ];
    expect(evaluate(input)).toBe(large);
  });

  it("must execute first branch if the condition is true", () => {
    // function @main []:
    // block @entry
    // %0 = constant true
    // %1 = constant 11
    // %2 = constant 22
    // %3 = constant 44
    // branch %0 @then @else
    //
    // block @then
    // %4 = add %1, %2
    // jump @end
    //
    // block @else
    // %5 = add %2, %3
    // jump @end
    //
    // block @end
    // exit %4

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: 1 }], // true
      [1, "constant", { value: small }],
      [2, "constant", { value: large }],
      [3, "constant", { value: huge }],
      [null, "branch", 0, [{ line: 7 }, { line: 10 }]],
      [null, "noop", "@then"],
      [4, "add", 1, 2],
      [null, "jump", { line: 13 }],
      [null, "noop", "@else"],
      [4, "add", 2, 3],
      [null, "jump", { line: 13 }],
      [null, "noop", "@end"],
      [null, "return", 4],
    ];
    expect(evaluate(input)).toBe(small + large);
  });

  it("must execute the second branch when condition is false", () => {
    // function @main []:
    // block @entry
    // %0 = constant false
    // %1 = constant 11
    // %2 = constant 22
    // %3 = constant 44
    // branch %0 @then @else
    //
    // block @then
    // %4 = add %1, %2
    // jump @end
    //
    // block @else
    // %5 = add %2, %3
    // jump @end
    //
    // block @end
    // exit %5

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: 0 }], // false
      [1, "constant", { value: small }],
      [2, "constant", { value: large }],
      [3, "constant", { value: huge }],
      [null, "branch", 0, [{ line: 7 }, { line: 10 }]],
      [null, "noop", "@then"],
      [4, "add", 1, 2],
      [null, "jump", { line: 13 }],
      [null, "noop", "@else"],
      [4, "add", 2, 3],
      [null, "jump", { line: 13 }],
      [null, "noop", "@end"],
      [null, "return", 4],
    ];
    expect(evaluate(input)).toBe(large + huge);
  });

  it("must support calling the identity function", () => {
    // function @main []:
    // block @entry
    // %0 = constant 11
    // %1 = constant 22
    // %2 = call @identity [%1]
    // exit %2
    //
    // function @identity [%a]:
    // block @entry
    // return %a

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }], // @entry
      [1, "constant", { value: large }],
      [2, "call", { line: 6 }, [1], "@identity"],
      [null, "return", 2],
      [null, "noop", "fun @identity [%a, %b]"],
      [null, "noop", "@entry"],
      [null, "return", 0],
    ];
    expect(evaluate(input)).toBe(large);
  });

  it("must support calling a binary function", () => {
    // function @main []:
    // block @entry
    // %0 = constant 11
    // %1 = constant 22
    // %2 = call @first [%0, %1]
    // exit %2
    //
    // function @first [%a, %b]:
    // block @entry
    // return %a

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: small }],
      [1, "constant", { value: large }],
      [2, "call", { line: 6 }, [0, 1], "@first"],
      [null, "return", 2],
      [null, "noop", "fun @first [%a, %b]"],
      [null, "noop", "@entry"],
      [null, "return", 0],
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
    // block @entry
    // %0 = constant 5
    // %1 = constant 1
    // %2 = call @factorial [%0, %1]
    // exit %2
    //
    // function @factorial [%n, %acc]:
    // block @entry
    // %3 = constant 1
    // %6 = equal %n, %3
    // branch %6 @termination @body
    //
    // block @body
    // %7 = subtract %n, %3
    // %8 = multiply %n, %acc
    // %9 = call @factorial [%7, %8]
    // jump @termination
    //
    // block @termination
    // %10 = phi [[@body, %9], [@entry, %acc]]
    // return %10

    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: 5 }], // main
      [1, "constant", { value: 1 }],
      [2, "call", { line: 6 }, [0, 1], "@factorial"],
      [null, "return", 2],

      [null, "noop", "fun @factorial [%n, %acc]"],
      [null, "noop", "@entry"],
      [2, "constant", { value: 1 }],
      [3, "equal", 0, 2],
      [7, "copy", 1],
      [null, "branch", 3, [{ line: 18 }, { line: 12 }]],

      [null, "noop", "@body"],
      [4, "subtract", 0, 2],
      [5, "multiply", 0, 1],
      [6, "call", { line: 6 }, [4, 5], "@factorial"],
      [7, "copy", 6],
      [null, "jump", { line: 18 }],

      [null, "noop", "@termination"],
      [null, "return", 7],
    ];
    expect(evaluate(input)).toBe(120);
  });

  it("must throw when Return is given a Dead argument", () => {
    const input: LOW.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "drop"],
      [null, "return", 0],
    ];
    expect(() => evaluate(input)).toThrow(/Dead/);
  });
});
