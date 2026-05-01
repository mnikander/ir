import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIGH from "../../src/high/high_grammar.ts";
import { lower } from "../../src/passes/lower.gen.ts";
import { evaluate } from "../../src/runtime/machine.ts";
import { validate } from "../../src/analysis/validate.ts";
import { print } from "../../src/high/print.gen.ts";
import { check } from "../../src/check/check.ts";
// import { adjacency_list, analyze, control_flow_graph, Edge, node_list, table_of_contents } from "../src/analysis.ts";

describe("memory and ownership", () => {
  it("must create and load from a pointer", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %x = constant Int 11
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
              ["%x", "constant", ["Int"], { value: 11 }],
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
    expect(check(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(11);
  });

  it("must allow a register to be owned by a pointer", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %x = constant Int 11
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
              ["%x", "constant", ["Int"], { value: 11 }],
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
    expect(check(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(11);
  });

  it.skip("must support pointers as phi operands", () => {
    // TODO
  });

  it("must allow consuming the Copy operand", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %a = constant Int 11
    %b = copy Int (consume %a)
    return Int %b
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
              ["%a", "constant", ["Int"], { value: 11 }],
              ["%b", "copy", ["Int"], ["consume", "%a"]],
            ],
            terminator: [null, "return", ["Int"], ["%b"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(check(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(11);
  });

  it("must allow consuming an Add operand", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %x = constant Int 11
    %y = constant Int 13
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
              ["%x", "constant", ["Int"], { value: 11 }],
              ["%y", "constant", ["Int"], { value: 13 }],
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
    expect(check(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(11 + 13);
  });

  it("must allow consuming the return operand", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %a = constant Int 11
    return Int (consume %a)
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
              ["%a", "constant", ["Int"], { value: 11 }],
            ],
            terminator: [null, "return", ["Int"], ["consume", "%a"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(check(input)).toBe(true);
    expect(evaluate(lower(input))).toBe(11);
  });

  it.skip("must allow consuming a phi operand", () => {
    // TODO
  });
});

describe("use-after-free", () => {
  it("must detect a use-after-free in a return", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %a = constant Int 0
    %a = drop
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
              ["%a", "constant", ["Int"], { value: 0 }],
              ["%a", "drop", null],
            ],
            terminator: [null, "return", ["Int"], ["%a"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(check(input)).toBe(false);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a use-after-free in an arithmetic expression", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %a = constant Int 0
    %a = drop
    %b = negate Int %a
    return Int %b
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
              ["%a", "constant", ["Int"], { value: 0 }],
              ["%a", "drop", null],
              ["%b", "negate", ["Int"], ["%a"]],
            ],
            terminator: [null, "return", ["Int"], ["%b"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(check(input)).toBe(false);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a double-free", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %a = constant Int 11
    %a = drop
    %a = drop
    %b = constant Int 11
    return Int %b
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
              ["%a", "constant", ["Int"], { value: 11 }],
              ["%a", "drop", null],
              ["%a", "drop", null],
              ["%b", "constant", ["Int"], { value: 11 }],
            ],
            terminator: [null, "return", ["Int"], ["%b"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(check(input)).toBe(false);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a use-after-move", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %a = constant Int 11
    %b = copy Int (consume %a)
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
              ["%a", "constant", ["Int"], { value: 11 }],
              ["%b", "copy", ["Int"], ["consume", "%a"]],
            ],
            terminator: [null, "return", ["Int"], ["%a"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(print(input)).toEqual(text);
    expect(validate(input)).toBe(true);
    expect(check(input)).toBe(false);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a dangling pointer when the source register is dropped", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %x = constant Int 11
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
              ["%x", "constant", ["Int"], { value: 11 }],
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
    expect(check(input)).toBe(false);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });

  it("must detect a dangling pointer when the source register is moved", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %x = constant Int 11
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
              ["%x", "constant", ["Int"], { value: 11 }],
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
    expect(check(input)).toBe(false);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});

describe("ownership violations", () => {
  it("must detect invalid use of a register owned by a pointer", () => {
    const text: string = `
function @main [] -> Int

  block @entry
    %x = constant Int 11
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
              ["%x", "constant", ["Int"], { value: 11 }],
              ["%r", "own", ["Owned", ["Int"]], ["%x"]],
              ["%t", "copy", ["Int"], ["%x"]],
            ],
            terminator: [null, "return", ["Int"], ["%t"]],
          },
        ],
      },
    ];
    expect(input).toBeDefined();
    expect(validate(input)).toBe(true);
    expect(check(input)).toBe(false);
    expect(print(input)).toEqual(text);
    expect(() => evaluate(lower(input))).toThrow(); // runtime must flag this as an error
  });
});
