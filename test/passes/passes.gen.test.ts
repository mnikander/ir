import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import * as HIR from "../../src/high/high_grammar.ts";
import * as LIR from "../../src/low/low_grammar.ts";
import {
  emit_linear_lir,
  expand_consumes,
  number_slots,
  type NumberedProgram,
  reserve_temporaries,
  resolve_labels,
  rewrite_named_to_numbered,
} from "../../src/passes/mod.gen.ts";

const small: number = 11;
const large: number = 13;
const huge: number = 281;

function rename_registers(input: HIR.Program): NumberedProgram {
  return rewrite_named_to_numbered(number_slots(input));
}

function linearize_to_lir(input: NumberedProgram): LIR.Program {
  return resolve_labels(
    emit_linear_lir(
      expand_consumes(
        reserve_temporaries(input),
      ),
    ),
  );
}

describe("numbering pipeline", () => {
  it("assigns params first and then enumerates later registers deterministically", () => {
    const input: HIR.Program = [
      {
        name: "@combine",
        params: [[["Int"], ["%a"]], [["Int"], ["%b"]]],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%sum", "add", ["Int"], ["%a"], ["%b"]],
              ["%product", "multiply", ["Int"], ["%sum"], ["%a"]],
            ],
            terminator: [null, "return", ["Int"], ["%product"]],
          },
        ],
      },
    ];

    expect(rename_registers(input)).toEqual([
      {
        name: "@combine",
        params: [
          { name: "%a", offset: 0 },
          { name: "%b", offset: 1 },
        ],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              [2, "add", { offset: 0, consume: false }, {
                offset: 1,
                consume: false,
              }],
              [3, "multiply", { offset: 2, consume: false }, {
                offset: 0,
                consume: false,
              }],
            ],
            terminator: [null, "return", { offset: 3, consume: false }],
          },
        ],
      },
    ]);
  });

  it("preserves consumed inputs while assigning stack slots", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [[["Int"], ["%x"]]],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%y", "copy", ["Int"], ["consume", "%x"]],
            ],
            terminator: [null, "return", ["Int"], ["consume", "%y"]],
          },
        ],
      },
    ];

    expect(rename_registers(input)).toEqual([
      {
        name: "@main",
        params: [
          { name: "%x", offset: 0 },
        ],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              [1, "copy", { offset: 0, consume: true }],
            ],
            terminator: [null, "return", { offset: 1, consume: true }],
          },
        ],
      },
    ]);
  });

  it("renames explicit drops to the dropped register's stack slot", () => {
    const input: HIR.Program = [
      {
        name: "@main",
        params: [[["Int"], ["%x"]]],
        return_type: ["Int"],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              ["%x", "drop", null],
            ],
            terminator: [null, "return", ["Int"], ["%x"]],
          },
        ],
      },
    ];

    expect(rename_registers(input)).toEqual([
      {
        name: "@main",
        params: [
          { name: "%x", offset: 0 },
        ],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              [0, "drop"],
            ],
            terminator: [null, "return", { offset: 0, consume: false }],
          },
        ],
      },
    ]);
  });
});

describe("linearize_to_lir", () => {
  it("resolves branch and jump targets to block-label line numbers", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              [0, "constant", { value: 1 }],
              [1, "constant", { value: small }],
              [2, "constant", { value: large }],
              [3, "constant", { value: huge }],
            ],
            terminator: [null, "branch", { offset: 0, consume: false }, [
              "@then",
              "@else",
            ]],
          },
          {
            name: "@then",
            phis: [],
            lines: [
              [4, "add", { offset: 1, consume: false }, {
                offset: 2,
                consume: false,
              }],
            ],
            terminator: [null, "jump", "@end"],
          },
          {
            name: "@else",
            phis: [],
            lines: [
              [5, "add", { offset: 2, consume: false }, {
                offset: 3,
                consume: false,
              }],
            ],
            terminator: [null, "jump", "@end"],
          },
          {
            name: "@end",
            phis: [],
            lines: [],
            terminator: [null, "return", { offset: 4, consume: false }],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: 1 }],
      [1, "constant", { value: small }],
      [2, "constant", { value: large }],
      [3, "constant", { value: huge }],
      [null, "branch", 0, [{ line: 7 }, { line: 10 }]],
      [null, "noop", "@then"],
      [4, "add", 1, 2],
      [null, "jump", { line: 13 }],
      [null, "noop", "@else"],
      [5, "add", 2, 3],
      [null, "jump", { line: 13 }],
      [null, "noop", "@end"],
      [null, "return", 4],
    ];

    expect(linearize_to_lir(input)).toEqual(expected);
  });

  it("resolves call targets to function-header line numbers", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              [0, "constant", { value: large }],
              [1, "call", "@identity", [{ offset: 0, consume: false }]],
            ],
            terminator: [null, "return", { offset: 1, consume: false }],
          },
        ],
      },
      {
        name: "@identity",
        params: [{ name: "%a", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", { offset: 0, consume: false }],
          },
        ],
      },
    ];

    const expected: LIR.Program = [
      [null, "noop", "fun @main []"],
      [null, "noop", "@entry"],
      [0, "constant", { value: large }],
      [1, "call", { line: 5 }, [0], "@identity"],
      [null, "return", 1],
      [null, "noop", "fun @identity [%a]"],
      [null, "noop", "@entry"],
      [null, "return", 0],
    ];

    expect(linearize_to_lir(input)).toEqual(expected);
  });

  it("emits a drop after a consumed copy", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [{ name: "%x", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              [1, "copy", { offset: 0, consume: true }],
            ],
            terminator: [null, "return", { offset: 1, consume: false }],
          },
        ],
      },
    ];

    expect(linearize_to_lir(input)).toEqual([
      [null, "noop", "fun @main [%x]"],
      [null, "noop", "@entry"],
      [1, "copy", 0],
      [0, "drop"],
      [null, "return", 1],
    ]);
  });

  it("linearizes an explicit drop directly to lir", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [{ name: "%x", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              [0, "drop"],
            ],
            terminator: [null, "return", { offset: 0, consume: false }],
          },
        ],
      },
    ];

    expect(linearize_to_lir(input)).toEqual([
      [null, "noop", "fun @main [%x]"],
      [null, "noop", "@entry"],
      [0, "drop"],
      [null, "return", 0],
    ]);
  });

  it("keeps explicit and consume-driven drops in order", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [{ name: "%x", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              [1, "copy", { offset: 0, consume: true }],
              [1, "drop"],
            ],
            terminator: [null, "return", { offset: 1, consume: false }],
          },
        ],
      },
    ];

    expect(linearize_to_lir(input)).toEqual([
      [null, "noop", "fun @main [%x]"],
      [null, "noop", "@entry"],
      [1, "copy", 0],
      [0, "drop"],
      [1, "drop"],
      [null, "return", 1],
    ]);
  });

  it("emits drops for consumed operands and call arguments", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [{ name: "%x", offset: 0 }, { name: "%y", offset: 1 }],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [
              [2, "add", { offset: 0, consume: true }, {
                offset: 1,
                consume: false,
              }],
              [3, "call", "@identity", [{ offset: 2, consume: true }]],
            ],
            terminator: [null, "return", { offset: 3, consume: false }],
          },
        ],
      },
      {
        name: "@identity",
        params: [{ name: "%a", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "return", { offset: 0, consume: false }],
          },
        ],
      },
    ];

    expect(linearize_to_lir(input)).toEqual([
      [null, "noop", "fun @main [%x, %y]"],
      [null, "noop", "@entry"],
      [2, "add", 0, 1],
      [0, "drop"],
      [3, "call", { line: 7 }, [2], "@identity"],
      [2, "drop"],
      [null, "return", 3],
      [null, "noop", "fun @identity [%a]"],
      [null, "noop", "@entry"],
      [null, "return", 0],
    ]);
  });

  it("materializes consumed terminator inputs before branching and returning", () => {
    const input: NumberedProgram = [
      {
        name: "@main",
        params: [{ name: "%condition", offset: 0 }],
        blocks: [
          {
            name: "@entry",
            phis: [],
            lines: [],
            terminator: [null, "branch", { offset: 0, consume: true }, [
              "@then",
              "@else",
            ]],
          },
          {
            name: "@then",
            phis: [],
            lines: [
              [1, "constant", { value: small }],
            ],
            terminator: [null, "return", { offset: 1, consume: true }],
          },
          {
            name: "@else",
            phis: [],
            lines: [
              [2, "constant", { value: large }],
            ],
            terminator: [null, "return", { offset: 2, consume: false }],
          },
        ],
      },
    ];

    expect(linearize_to_lir(input)).toEqual([
      [null, "noop", "fun @main [%condition]"],
      [null, "noop", "@entry"],
      [3, "copy", 0],
      [0, "drop"],
      [null, "branch", 3, [{ line: 5 }, { line: 10 }]],
      [null, "noop", "@then"],
      [1, "constant", { value: small }],
      [4, "copy", 1],
      [1, "drop"],
      [null, "return", 4],
      [null, "noop", "@else"],
      [2, "constant", { value: large }],
      [null, "return", 2],
    ]);
  });
});
